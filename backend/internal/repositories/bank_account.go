package repositories

import (
	"errors"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
)

// Create
func CreateBankAccount(account *models.BankAccount) error {
	return database.DB.Create(account).Error
}

// Get all
func GetBankAccounts() ([]models.BankAccount, error) {
	var accounts []models.BankAccount
	err := database.DB.Find(&accounts).Error
	return accounts, err
}

// Get single
func GetBankAccountByID(id uint) (models.BankAccount, error) {
	var account models.BankAccount
	err := database.DB.First(&account, id).Error
	if err != nil {
		return account, err
	}
	return account, nil
}

// Update
func UpdateBankAccount(id uint, data *models.BankAccount) (models.BankAccount, error) {
	var account models.BankAccount
	if err := database.DB.First(&account, id).Error; err != nil {
		return account, err
	}
	if err := database.DB.Model(&account).Updates(data).Error; err != nil {
		return account, err
	}
	return account, nil
}

// Delete
func DeleteBankAccount(id uint) error {
	var count int64
	// بررسی اینکه آیا حساب بانکی در تراکنش‌ها استفاده شده یا نه
	if err := database.DB.Model(&models.Transaction{}).
		Where("bank_account_id = ?", id).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("این حساب بانکی در تراکنش‌ها استفاده شده و قابل حذف نیست")
	}

	// اگر استفاده نشده، حذف کن
	if err := database.DB.Delete(&models.BankAccount{}, id).Error; err != nil {
		return err
	}

	return nil
}
