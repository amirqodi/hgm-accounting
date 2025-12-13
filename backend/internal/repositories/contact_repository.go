package repositories

import (
	"errors"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
	"gorm.io/gorm"
)

// ---------------- Create ----------------
func CreateContact(contact *models.Contact) error {
	result := database.DB.Create(contact)
	return result.Error
}

// ---------------- Read All ----------------
func GetContacts() ([]models.Contact, error) {
	var contacts []models.Contact
	result := database.DB.Find(&contacts)
	return contacts, result.Error
}

// ---------------- Read By Type ----------------
func GetContactsByType(contactType string) ([]models.Contact, error) {
	var contacts []models.Contact
	result := database.DB.Where("type = ?", contactType).Find(&contacts)
	return contacts, result.Error
}

// ---------------- Read Single ----------------
func GetContactByID(id uint) (models.Contact, error) {
	var contact models.Contact
	if err := database.DB.First(&contact, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return contact, errors.New("contact not found")
		}
		return contact, err
	}
	return contact, nil
}

// ---------------- Update ----------------
func UpdateContact(id uint, data *models.Contact) (models.Contact, error) {
	var contact models.Contact

	// Find first
	if err := database.DB.First(&contact, id).Error; err != nil {
		return contact, err
	}

	// Update fields (GORM only updates non-zero values)
	if err := database.DB.Model(&contact).Updates(data).Error; err != nil {
		return contact, err
	}

	// Return updated contact
	return contact, nil
}

// ---------------- Delete ----------------
func DeleteContact(id uint) error {
	var count int64

	// بررسی اینکه آیا مخاطب در تراکنش‌ها استفاده شده است
	if err := database.DB.Model(&models.Transaction{}).
		Where("contact_id = ?", id).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("این مخاطب در تراکنش‌ها استفاده شده و قابل حذف نیست")
	}

	// اگر استفاده نشده، حذف انجام شود
	if err := database.DB.Delete(&models.Contact{}, id).Error; err != nil {
		return err
	}

	return nil
}

// مجموع درصد سهم همه سهامداران (برای Create)
func SumSharePercentage() float64 {
	var total float64
	database.DB.Model(&models.Contact{}).
		Where("type = ?", models.Shareholder).
		Select("COALESCE(SUM(share_percentage),0)").
		Row().Scan(&total)
	return total
}

// مجموع درصد سهم همه سهامداران به جز یک ID مشخص (برای Update)
func SumSharePercentageExcludingID(id uint) float64 {
	var total float64
	database.DB.Model(&models.Contact{}).
		Where("type = ? AND id <> ?", models.Shareholder, id).
		Select("COALESCE(SUM(share_percentage),0)").
		Row().Scan(&total)
	return total
}

// جستجو بر اساس نوع و متن
func GetContactsByTypeAndSearch(contactType, search string) ([]models.Contact, error) {
	var contacts []models.Contact
	err := database.DB.
		Where("type = ? AND (first_name ILIKE ? OR last_name ILIKE ? OR phone_number ILIKE ?)",
			contactType, "%"+search+"%", "%"+search+"%", "%"+search+"%").
		Find(&contacts).Error
	return contacts, err
}

// جستجو فقط بر اساس متن
func GetContactsBySearch(search string) ([]models.Contact, error) {
	var contacts []models.Contact
	err := database.DB.
		Where("first_name ILIKE ? OR last_name ILIKE ? OR phone_number ILIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%").
		Find(&contacts).Error
	return contacts, err
}
