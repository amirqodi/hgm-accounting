package repositories

import (
	"errors"
	"io"
	"math"
	"os"
	"strings"

	"mime/multipart"

	"github.com/amirqodi/hgm/internal/models"
	"gorm.io/gorm"
)

// ---------------- CREATE ----------------
func CreateTransaction(trx *models.Transaction, uploadedFiles []*multipart.FileHeader, db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// --- 1. اعتبارسنجی ---
		if err := validateTransaction(trx, tx); err != nil {
			return err
		}

		// --- 2. ذخیره فایل‌ها ---
		for _, file := range uploadedFiles {
			os.MkdirAll("./uploads", os.ModePerm)

			savePath := "./uploads/" + file.Filename
			if err := saveUploadedFile(file, savePath); err != nil {
				return err
			}

			urlPath := "/uploads/" + file.Filename
			trx.Attachments = append(trx.Attachments, models.TransactionAttachment{
				FileName: file.Filename,
				FilePath: urlPath,
			})
		}

		// --- 3. ذخیره تراکنش ---
		if err := tx.Create(trx).Error; err != nil {
			return err
		}

		// --- 4. بروزرسانی موجودی‌ها ---
		if trx.IsPaid && len(trx.SubTransactions) == 0 {
			// پرداخت نقدی → هم پول و هم موجودی کالا بروزرسانی شود
			if err := adjustBalanceAndStock(trx, tx, trx.Amount, false); err != nil {
				return err
			}
		} else if len(trx.SubTransactions) > 0 {
			// تراکنش قسطی → فقط موجودی کالا بروزرسانی شود (پول بعداً در PaySubTransaction)
			if err := adjustBalanceAndStock(trx, tx, 0, false); err != nil {
				return err
			}
		}

		return nil
	})
}

// ---------------- READ ----------------
func GetTransactionsWithPagination(
	db *gorm.DB,
	page, pageSize int,
	search, startDate, endDate string,
) ([]models.Transaction, int64, int64, error) {
	var trxs []models.Transaction
	var total int64

	offset := (page - 1) * pageSize

	query := db.Model(&models.Transaction{}).
		Preload("SubTransactions").
		Preload("BankAccount").
		Preload("CashHolder").
		Preload("Contact").
		Preload("Category").
		Preload("Product").
		Preload("Attachments")

	// Search filter
	if search != "" {
		search = strings.TrimSpace(search)
		searchPattern := "%" + search + "%"

		query = query.Joins("LEFT JOIN contacts ON contacts.id = transactions.contact_id").
			Where(`
				contacts.first_name LIKE ? COLLATE NOCASE OR
				contacts.last_name LIKE ? COLLATE NOCASE OR
				transactions.notes LIKE ? COLLATE NOCASE OR
				transactions.id Like ? COLLATE NOCASE
			`, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	// Date range filter
	if startDate != "" && endDate != "" {
		query = query.Where("transactions.transaction_date BETWEEN ? AND ?", startDate, endDate)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, 0, err
	}

	// Fetch paginated results
	if err := query.Order("transactions.id DESC").Offset(offset).Limit(pageSize).Find(&trxs).Error; err != nil {
		return nil, 0, 0, err
	}

	// Calculate total pages
	totalPages := int64(math.Ceil(float64(total) / float64(pageSize)))

	return trxs, total, totalPages, nil
}

func GetTransactionByID(id uint, db *gorm.DB) (*models.Transaction, error) {
	var trx models.Transaction
	err := db.Preload("SubTransactions").
		Preload("BankAccount").
		Preload("CashHolder").
		Preload("Contact").
		Preload("Category").
		Preload("Product").
		Preload("Attachments").
		First(&trx, id).Error
	if err != nil {
		return nil, err
	}
	return &trx, nil
}

// ---------------- UPDATE ----------------
func UpdateTransaction(id uint, trx *models.Transaction, db *gorm.DB) error {
	if err := validateTransaction(trx, db); err != nil {
		return err
	}

	if err := db.Session(&gorm.Session{FullSaveAssociations: true}).Updates(trx).Error; err != nil {
		return err
	}

	if trx.IsPaid && len(trx.SubTransactions) == 0 {
		return adjustBalanceAndStock(trx, db, trx.Amount, false)
	}

	return nil
}

// ---------------- DELETE ----------------
func DeleteTransaction(id uint, db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		trx, err := GetTransactionByID(id, tx)
		if err != nil {
			return err
		}

		// همیشه همه چیز برگرده
		if err := revertBalanceAndStock(trx, tx); err != nil {
			return err
		}

		// حذف فایل‌های ضمیمه از سیستم
		for _, att := range trx.Attachments {
			_ = os.Remove("." + att.FilePath) // چون path مثل /uploads/... ذخیره کردی
		}

		// حذف از دیتابیس
		if err := tx.Select("SubTransactions", "Attachments").Delete(trx).Error; err != nil {
			return err
		}

		return nil
	})
}

// ---------------- SUBTRANSACTION ----------------
func PaySubTransaction(sub *models.SubTransaction, db *gorm.DB) error {
	return db.Transaction(func(tx *gorm.DB) error {
		// --- 1. بررسی پرداخت ---
		if sub.IsPaid {
			return nil
		}

		sub.IsPaid = true
		if err := tx.Save(sub).Error; err != nil {
			return err
		}

		// --- 2. دریافت تراکنش اصلی ---
		trx, err := GetTransactionByID(sub.TransactionID, tx)
		if err != nil {
			return err
		}

		// --- 3. به‌روزرسانی مانده حساب، صندوق، سهام (اما نه موجودی کالا) ---
		if err := adjustBalanceAndStock(trx, tx, sub.Amount, true); err != nil {
			return err
		}

		// --- 4. بررسی اینکه همه اقساط پرداخت شده‌اند یا نه ---
		allPaid := true
		for _, s := range trx.SubTransactions {
			if s.ID == sub.ID {
				continue
			}
			if !s.IsPaid {
				allPaid = false
				break
			}
		}

		// اگر همه اقساط پرداخت شدند، تراکنش اصلی را هم به حالت "پرداخت‌شده" تغییر دهیم
		if allPaid {
			trx.IsPaid = true
			if err := tx.Save(trx).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// ---------------- VALIDATION ----------------
func validateTransaction(trx *models.Transaction, db *gorm.DB) error {
	// Sub-transaction sum must match
	if len(trx.SubTransactions) > 0 {
		sum := 0.0
		for _, sub := range trx.SubTransactions {
			sum += sub.Amount
		}
		if sum != trx.Amount {
			return errors.New("مجموع اقساط اشتباه است")
		}
	}

	// Money source validation
	if trx.MoneySourceType == "bank" && trx.BankAccountID == nil {
		return errors.New("حساب بانکی الزامیست")
	}
	if trx.MoneySourceType == "cash" && trx.CashHolderID == nil {
		return errors.New("تنخواه الزامیست")
	}

	// Transaction type validation
	if trx.TransactionType != "income" && trx.TransactionType != "expense" && trx.TransactionType != "share" {
		return errors.New("نوع تراکنش اشتباه است")
	}

	// Product stock validation
	if trx.ProductID != nil && trx.Quantity > 0 {
		var product models.ProductService
		if err := db.First(&product, *trx.ProductID).Error; err != nil {
			return errors.New("محصول یافت نشد")
		}
		if product.Stock != nil {
			if trx.TransactionType == "income" {
				// فروش => باید موجودی کافی داشته باشیم
				if *product.Stock < int64(trx.Quantity) {
					return errors.New("موجودی کالا کافی نیست")
				}
			}
			// در expense (خرید) موجودی کم نمیاد، بلکه اضافه میشه
		}
	}

	return nil
}

func adjustBalanceAndStock(trx *models.Transaction, db *gorm.DB, overrideAmount float64, skipProductStock bool) error {
	amount := overrideAmount

	// --- 1. موجودی بانک یا صندوق ---
	if amount > 0 { // فقط وقتی مبلغی پرداخت شده
		switch trx.MoneySourceType {
		case "bank":
			if trx.BankAccountID != nil {
				var bank models.BankAccount
				if err := db.First(&bank, *trx.BankAccountID).Error; err != nil {
					return err
				}

				switch trx.TransactionType {
				case "income", "share":
					bank.Balance += amount
				case "expense", "share_reduction":
					if bank.Balance < amount {
						return errors.New("موجودی حساب بانکی کافی نیست")
					}
					bank.Balance -= amount
				}

				if err := db.Save(&bank).Error; err != nil {
					return err
				}
			}

		case "cash":
			if trx.CashHolderID != nil {
				var cash models.CashHolder
				if err := db.First(&cash, *trx.CashHolderID).Error; err != nil {
					return err
				}

				switch trx.TransactionType {
				case "income", "share":
					cash.Balance += amount
				case "expense", "share_reduction":
					if cash.Balance < amount {
						return errors.New("موجودی تنخواه کافی نیست")
					}
					cash.Balance -= amount
				}

				if err := db.Save(&cash).Error; err != nil {
					return err
				}
			}
		}
	}

	// --- 2. موجودی محصول ---
	if !skipProductStock && trx.ProductID != nil && trx.Quantity > 0 {
		var product models.ProductService
		if err := db.First(&product, *trx.ProductID).Error; err != nil {
			return err
		}

		if product.Stock != nil {
			qty := int64(trx.Quantity)
			if trx.TransactionType == "income" {
				// فروش → کم شدن موجودی
				if *product.Stock < qty {
					return errors.New("موجودی کالا کافی نیست")
				}
				*product.Stock -= qty
			} else if trx.TransactionType == "expense" {
				// خرید → افزایش موجودی
				*product.Stock += qty
			}
			if err := db.Save(&product).Error; err != nil {
				return err
			}
		}
	}

	// --- 3. سرمایه سهامدار ---
	if amount > 0 && trx.ContactID != 0 && trx.CategoryID != 0 {
		var category models.Category
		if err := db.First(&category, trx.CategoryID).Error; err != nil {
			return err
		}

		var shareholder models.Contact
		if err := db.First(&shareholder, trx.ContactID).Error; err != nil {
			return err
		}

		if shareholder.Amount == nil {
			shareholder.Amount = new(float64)
		}

		switch category.Name {
		case "افزایش سهام":
			*shareholder.Amount += amount
		case "کاهش سهام":
			if *shareholder.Amount < amount {
				return errors.New("میزان سهام کافی نیست")
			}
			*shareholder.Amount -= amount
		}

		if err := db.Save(&shareholder).Error; err != nil {
			return err
		}
	}

	return nil
}

func revertBalanceAndStock(trx *models.Transaction, db *gorm.DB) error {
	amount := trx.Amount

	// --- 1. موجودی بانک یا صندوق ---
	switch trx.MoneySourceType {
	case "bank":
		if trx.BankAccountID != nil {
			var bank models.BankAccount
			if err := db.First(&bank, *trx.BankAccountID).Error; err != nil {
				return err
			}
			switch trx.TransactionType {
			case "income", "share":
				// قبلاً اضافه شده → حالا کم می‌کنیم
				bank.Balance -= amount
			case "expense", "share_reduction":
				// قبلاً کم شده → حالا زیاد می‌کنیم
				bank.Balance += amount
			}
			if bank.Balance < 0 {
				bank.Balance = 0
			}
			if err := db.Save(&bank).Error; err != nil {
				return err
			}
		}
	case "cash":
		if trx.CashHolderID != nil {
			var cash models.CashHolder
			if err := db.First(&cash, *trx.CashHolderID).Error; err != nil {
				return err
			}
			switch trx.TransactionType {
			case "income", "share":
				cash.Balance -= amount
			case "expense", "share_reduction":
				cash.Balance += amount
			}
			if cash.Balance < 0 {
				cash.Balance = 0
			}
			if err := db.Save(&cash).Error; err != nil {
				return err
			}
		}
	}

	// --- 2. موجودی محصول ---
	if trx.ProductID != nil && trx.Quantity > 0 {
		var product models.ProductService
		if err := db.First(&product, *trx.ProductID).Error; err != nil {
			return err
		}
		if product.Stock != nil {
			qty := int64(trx.Quantity)
			if trx.TransactionType == "income" {
				// فروش → قبلاً کم شده → حالا زیاد می‌کنیم
				*product.Stock += qty
			} else if trx.TransactionType == "expense" {
				// خرید → قبلاً زیاد شده → حالا کم می‌کنیم
				if *product.Stock < qty {
					*product.Stock = 0
				} else {
					*product.Stock -= qty
				}
			}
			if err := db.Save(&product).Error; err != nil {
				return err
			}
		}
	}

	// --- 3. سرمایه سهامدار ---
	if trx.ContactID != 0 && trx.CategoryID != 0 {
		var category models.Category
		if err := db.First(&category, trx.CategoryID).Error; err != nil {
			return err
		}

		var shareholder models.Contact
		if err := db.First(&shareholder, trx.ContactID).Error; err != nil {
			return err
		}

		if shareholder.Amount == nil {
			shareholder.Amount = new(float64)
		}

		switch category.Name {
		case "افزایش سهام":
			// قبلاً اضافه شده → حالا کم می‌کنیم
			*shareholder.Amount -= amount
			if *shareholder.Amount < 0 {
				*shareholder.Amount = 0
			}
		case "کاهش سهام":
			// قبلاً کم شده → حالا زیاد می‌کنیم
			*shareholder.Amount += amount
		}

		if err := db.Save(&shareholder).Error; err != nil {
			return err
		}
	}

	return nil
}

func saveUploadedFile(file *multipart.FileHeader, path string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	dst, err := os.Create(path)
	if err != nil {
		return err
	}
	defer dst.Close()

	_, err = io.Copy(dst, src)
	return err
}
