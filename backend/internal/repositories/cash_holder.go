package repositories

import (
	"errors"
	"strings"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
)

// Create
func CreateCashHolder(cashHolder *models.CashHolder) error {
	return database.DB.Create(cashHolder).Error
}

// Get all
func GetCashHoldersWithPagination(page, pageSize int, search string) ([]models.CashHolder, int64, error) {
	var holders []models.CashHolder
	var total int64

	offset := (page - 1) * pageSize
	db := database.DB.Model(&models.CashHolder{})

	if search != "" {
		search = strings.TrimSpace(search)
		db = db.Where(
			"first_name ILIKE ? OR last_name ILIKE ? OR phone_number ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%",
		)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := db.Order("id DESC").Offset(offset).Limit(pageSize).Find(&holders).Error; err != nil {
		return nil, 0, err
	}

	return holders, total, nil
}

// Get single
func GetCashHolderByID(id uint) (models.CashHolder, error) {
	var holder models.CashHolder
	err := database.DB.First(&holder, id).Error
	if err != nil {
		return holder, err
	}
	return holder, nil
}

// Update
func UpdateCashHolder(id uint, data *models.CashHolder) (models.CashHolder, error) {
	var holder models.CashHolder
	if err := database.DB.First(&holder, id).Error; err != nil {
		return holder, err
	}
	if err := database.DB.Model(&holder).Updates(data).Error; err != nil {
		return holder, err
	}
	return holder, nil
}

// Delete
func DeleteCashHolder(id uint) error {
	var count int64

	// بررسی اینکه آیا صندوق در تراکنش‌ها استفاده شده یا نه
	if err := database.DB.Model(&models.Transaction{}).
		Where("cash_holder_id = ?", id).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("این صندوق در تراکنش‌ها استفاده شده و قابل حذف نیست")
	}

	// حذف اگر استفاده نشده
	if err := database.DB.Delete(&models.CashHolder{}, id).Error; err != nil {
		return err
	}

	return nil
}
