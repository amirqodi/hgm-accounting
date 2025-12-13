package services

import (
	"sort"

	"github.com/amirqodi/hgm/internal/models"
	ptime "github.com/yaa110/go-persian-calendar"
	"gorm.io/gorm"
)

type IncomeExpenseReport struct {
	Period    string  `json:"period"`
	Income    float64 `json:"income"`
	Expense   float64 `json:"expense"`
	NetProfit float64 `json:"net_profit"`
}

type TotalBalance struct {
	BankBalance       float64 `json:"bank_balance"`
	CashHolderBalance float64 `json:"cash_holder_balance"`
	Total             float64 `json:"total"`
}

type BalanceSheet struct {
	Assets struct {
		BankAccounts     float64 `json:"bank_accounts"`
		CashHolders      float64 `json:"cash_holders"`
		Inventory        float64 `json:"inventory"`
		DepositsReceived float64 `json:"deposits_received"` // ودیعه‌های دریافتی
		Receivables      float64 `json:"receivables"`
		Total            float64 `json:"total"`
	} `json:"assets"`

	Liabilities struct {
		DepositsPaid float64 `json:"deposits_paid"` // ودیعه‌های پرداختی
		Payables     float64 `json:"payables"`
		Total        float64 `json:"total"`
	} `json:"liabilities"`

	Equity struct {
		Capital          float64 `json:"capital"`
		RetainedEarnings float64 `json:"retained_earnings"`
		Total            float64 `json:"total"`
	} `json:"equity"`

	TotalAssets float64 `json:"total_assets"`
	TotalLiab   float64 `json:"total_liabilities"`
	TotalEquity float64 `json:"total_equity"`
}

func GetIncomeExpenseReport(db *gorm.DB, period string) ([]IncomeExpenseReport, error) {
	var results []IncomeExpenseReport
	var transactions []models.Transaction

	// همه تراکنش‌ها رو میاریم (فیلتر میشه بر اساس نوع بعدا)
	if err := db.Find(&transactions).Error; err != nil {
		return nil, err
	}

	// بازه‌های ثابت
	var periods []string
	switch period {
	case "daily":
		periods = []string{
			"شنبه", "یکشنبه", "دوشنبه", "سه\u200cشنبه", "چهارشنبه", "پنج\u200cشنبه", "جمعه",
		}

	case "weekly":
		periods = []string{"هفته 1", "هفته 2", "هفته 3", "هفته 4"}
	default: // ماهیانه
		periods = []string{
			"فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
			"مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
		}
	}

	// دیتا مپ اولیه
	dataMap := map[string]*IncomeExpenseReport{}
	for _, p := range periods {
		dataMap[p] = &IncomeExpenseReport{
			Period:  p,
			Income:  0,
			Expense: 0,
		}
	}

	// پردازش تراکنش‌ها
	for _, tx := range transactions {
		if tx.TransactionDate == nil {
			continue // اگه تاریخ نداشت، رد کن
		}

		pt := ptime.New(*tx.TransactionDate) // 👈 اینجا dereference کن

		var key string
		switch period {
		case "daily":
			// شنبه = 0
			key = periods[(int(pt.Weekday())+6)%7]
		case "weekly":
			day := pt.Day()
			week := (day-1)/7 + 1
			if week > 4 {
				week = 4
			}
			key = periods[week-1]
		default: // monthly
			key = periods[pt.Month()-1]
		}

		if tx.TransactionType == "income" {
			dataMap[key].Income += tx.Amount
		} else if tx.TransactionType == "expense" {
			dataMap[key].Expense += tx.Amount
		}
	}

	// محاسبه سود خالص
	for _, p := range periods {
		r := dataMap[p]
		r.NetProfit = r.Income - r.Expense
		results = append(results, *r)
	}

	// مرتب‌سازی درست (به ترتیب periods)
	sort.Slice(results, func(i, j int) bool {
		for idx, p := range periods {
			if results[i].Period == p {
				return idx < indexOf(periods, results[j].Period)
			}
		}
		return false
	})

	return results, nil
}

func GetLatestTransactions(db *gorm.DB, limit int) ([]models.Transaction, error) {
	var txs []models.Transaction
	if err := db.
		Select("id, amount, transaction_date, is_paid, transaction_type").
		Order("created_at desc").
		Limit(limit).
		Find(&txs).Error; err != nil {
		return nil, err
	}
	return txs, nil
}

func GetTotalBalance(db *gorm.DB) (TotalBalance, error) {
	var result TotalBalance

	if err := db.Model(&models.BankAccount{}).
		Select("COALESCE(SUM(balance),0)").Scan(&result.BankBalance).Error; err != nil {
		return result, err
	}

	if err := db.Model(&models.CashHolder{}).
		Select("COALESCE(SUM(balance),0)").Scan(&result.CashHolderBalance).Error; err != nil {
		return result, err
	}

	result.Total = result.BankBalance + result.CashHolderBalance
	return result, nil
}

func GetBalanceSheet(db *gorm.DB) (*BalanceSheet, error) {
	var result BalanceSheet

	// --- دارایی‌ها ---
	var bankTotal, cashTotal, inventory, depositReceived, incomeReceivable, subIncome float64

	db.Model(&models.BankAccount{}).Select("COALESCE(SUM(balance),0)").Scan(&bankTotal)
	db.Model(&models.CashHolder{}).Select("COALESCE(SUM(balance),0)").Scan(&cashTotal)
	db.Model(&models.ProductService{}).Select("COALESCE(SUM(stock * buying_price),0)").Scan(&inventory)

	// فقط ودیعه‌های دریافتی که هنوز پرداخت نشده‌اند
	db.Model(&models.Deposit{}).
		Where("type = ? AND status != ?", models.DepositReceived, "completed").
		Select("COALESCE(SUM(amount),0)").Scan(&depositReceived)

	db.Model(&models.Transaction{}).
		Where("transaction_type = ? AND is_paid = ?", "income", false).
		Where("id NOT IN (?)", db.Model(&models.SubTransaction{}).Select("transaction_id")).
		Select("COALESCE(SUM(amount),0)").Scan(&incomeReceivable)

	db.Model(&models.SubTransaction{}).
		Joins("JOIN transactions ON transactions.id = sub_transactions.transaction_id").
		Where("sub_transactions.is_paid = ? AND transactions.transaction_type = ?", false, "income").
		Select("COALESCE(SUM(sub_transactions.amount),0)").Scan(&subIncome)

	result.Assets.BankAccounts = bankTotal
	result.Assets.CashHolders = cashTotal
	result.Assets.Inventory = inventory
	result.Assets.DepositsReceived = depositReceived
	result.Assets.Receivables = incomeReceivable + subIncome
	result.Assets.Total = bankTotal + cashTotal + inventory + depositReceived + incomeReceivable + subIncome

	// --- بدهی‌ها ---
	var depositPaid, expensePayables, subExpense float64

	// فقط ودیعه‌های پرداختی که هنوز پرداخت نشده‌اند
	db.Model(&models.Deposit{}).
		Where("type = ? AND status != ?", models.DepositPaid, "completed").
		Select("COALESCE(SUM(amount),0)").Scan(&depositPaid)

	db.Model(&models.Transaction{}).
		Where("transaction_type = ? AND is_paid = ?", "expense", false).
		Where("id NOT IN (?)", db.Model(&models.SubTransaction{}).Select("transaction_id")).
		Select("COALESCE(SUM(amount),0)").Scan(&expensePayables)

	db.Model(&models.SubTransaction{}).
		Joins("JOIN transactions ON transactions.id = sub_transactions.transaction_id").
		Where("sub_transactions.is_paid = ? AND transactions.transaction_type = ?", false, "expense").
		Select("COALESCE(SUM(sub_transactions.amount),0)").Scan(&subExpense)

	result.Liabilities.DepositsPaid = depositPaid
	result.Liabilities.Payables = expensePayables + subExpense
	result.Liabilities.Total = depositPaid + expensePayables + subExpense

	// --- سرمایه و سود انباشته ---
	var shareHolders float64
	db.Model(&models.Contact{}).Where("type = ?", "shareholder").Select("COALESCE(SUM(amount),0)").Scan(&shareHolders)

	// Retained earnings = net profit (income - expense), excluding asset purchases
	var incomePaid, subIncomePaid, expensePaid, subExpensePaid float64

	db.Model(&models.Transaction{}).
		Where("transaction_type = ? AND is_paid = ? AND product_id IS NULL",
			"income", true).
		Select("COALESCE(SUM(amount),0)").Scan(&incomePaid)

	db.Model(&models.SubTransaction{}).
		Joins("JOIN transactions ON transactions.id = sub_transactions.transaction_id").
		Where("sub_transactions.is_paid = ? AND transactions.transaction_type = ? AND transactions.product_id IS NULL",
			true, "income").
		Select("COALESCE(SUM(sub_transactions.amount),0)").Scan(&subIncomePaid)

	// --- Expense transactions (only paid) excluding product purchases ---
	db.Model(&models.Transaction{}).
		Where("transaction_type = ? AND is_paid = ? AND product_id IS NULL",
			"expense", true).
		Select("COALESCE(SUM(amount),0)").Scan(&expensePaid)

	db.Model(&models.SubTransaction{}).
		Joins("JOIN transactions ON transactions.id = sub_transactions.transaction_id").
		Where("sub_transactions.is_paid = ? AND transactions.transaction_type = ? AND transactions.product_id IS NULL",
			true, "expense").
		Select("COALESCE(SUM(sub_transactions.amount),0)").Scan(&subExpensePaid)
	result.Equity.Capital = shareHolders
	result.Equity.RetainedEarnings = (incomePaid + subIncomePaid) - (expensePaid + subExpensePaid)
	result.Equity.Total = result.Equity.Capital + result.Equity.RetainedEarnings

	// --- جمع کل‌ها ---
	result.TotalLiab = result.Liabilities.Total
	result.TotalEquity = result.Equity.Total
	result.TotalAssets = result.TotalLiab + result.TotalEquity

	return &result, nil
}

func indexOf(slice []string, val string) int {
	for i, v := range slice {
		if v == val {
			return i
		}
	}
	return -1
}
