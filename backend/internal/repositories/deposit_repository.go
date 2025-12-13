package repositories

import (
	"errors"

	"github.com/amirqodi/hgm/internal/models"
	"gorm.io/gorm"
)

func CreateDeposit(dep *models.Deposit, db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// اعتبارسنجی منبع پول
		if dep.MoneySourceType == "bank" && dep.BankAccountID == nil {
			return errors.New("حساب بانکی الزامیست")
		}
		if dep.MoneySourceType == "cash" && dep.CashHolderID == nil {
			return errors.New("تنخواه الزامیست")
		}

		// ذخیره ودیعه
		if err := tx.Create(dep).Error; err != nil {
			return err
		}

		// بروزرسانی موجودی حساب/تنخواه
		amount := dep.Amount
		if dep.Type == models.DepositPaid {
			amount = -amount
		}

		switch dep.MoneySourceType {
		case "bank":
			var bank models.BankAccount
			if err := tx.First(&bank, *dep.BankAccountID).Error; err != nil {
				return err
			}
			bank.Balance -= amount
			if bank.Balance < 0 {
				return errors.New("موجودی حساب کافی نیست")
			}
			if err := tx.Save(&bank).Error; err != nil {
				return err
			}
		case "cash":
			var cash models.CashHolder
			if err := tx.First(&cash, *dep.CashHolderID).Error; err != nil {
				return err
			}
			cash.Balance -= amount
			if cash.Balance < 0 {
				return errors.New("موجودی تنخواه کافی نیست")
			}
			if err := tx.Save(&cash).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// AdjustDepositBalance updates the balance according to the deposit
func AdjustDepositBalance(dep *models.Deposit, db *gorm.DB) error {
	var err error
	amount := dep.Amount

	// برای ودیعه پرداختی (paid) => موجودی کم می‌شود
	// برای ودیعه دریافتی (received) => موجودی زیاد می‌شود
	switch dep.Type {
	case models.DepositReceived:
		amount = dep.Amount // دریافت => افزایش موجودی
	case models.DepositPaid:
		amount = -dep.Amount // پرداخت => کاهش موجودی
	default:
		return errors.New("نوع ودیعه نامعتبر است")
	}

	switch dep.MoneySourceType {
	case "bank":
		var bank models.BankAccount
		if err = db.First(&bank, *dep.BankAccountID).Error; err != nil {
			return err
		}
		bank.Balance += amount
		if bank.Balance < 0 {
			return errors.New("موجودی حساب کافی نیست")
		}
		err = db.Save(&bank).Error
	case "cash":
		var cash models.CashHolder
		if err = db.First(&cash, *dep.CashHolderID).Error; err != nil {
			return err
		}
		cash.Balance += amount
		if cash.Balance < 0 {
			return errors.New("موجودی تنخواه کافی نیست")
		}
		err = db.Save(&cash).Error
	default:
		err = errors.New("نوع منبع پول نامعتبر است")
	}
	return err
}

// RevertDeposit reverts the deposit impact on balance
// RevertDeposit reverts the deposit impact on balance
func RevertDeposit(dep *models.Deposit, db *gorm.DB) error {
	// اگر ودیعه پرداخت شده است، دیگر هیچ کاری انجام نده
	if dep.Status == "completed" {
		return nil
	}

	amount := dep.Amount

	// اگر دریافتی است، کم شده را برگردان
	switch dep.Type {
	case models.DepositReceived:
		amount = dep.Amount // دریافتی => موجودی قبلاً کم شده؟ حالا برگردانیم
	case models.DepositPaid:
		amount = -dep.Amount // پرداختی => موجودی قبلاً کم شده، حالا برگردانیم
	default:
		return errors.New("نوع ودیعه نامعتبر است")
	}

	switch dep.MoneySourceType {
	case "bank":
		var bank models.BankAccount
		if err := db.First(&bank, *dep.BankAccountID).Error; err != nil {
			return err
		}
		bank.Balance += amount
		return db.Save(&bank).Error
	case "cash":
		var cash models.CashHolder
		if err := db.First(&cash, *dep.CashHolderID).Error; err != nil {
			return err
		}
		cash.Balance += amount
		return db.Save(&cash).Error
	default:
		return errors.New("نوع منبع پول نامعتبر است")
	}
}
