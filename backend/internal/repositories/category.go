package repositories

import (
	"errors"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
)

func CreateCategory(cat *models.Category) error {
	return database.DB.Create(cat).Error
}

func GetCategories() ([]models.Category, error) {
	var cats []models.Category
	result := database.DB.Find(&cats)
	return cats, result.Error
}

func GetCategoryByID(id uint) (models.Category, error) {
	var cat models.Category
	result := database.DB.First(&cat, id)
	if result.Error != nil {
		return cat, errors.New("category not found")
	}
	return cat, nil
}

func UpdateCategory(id uint, data *models.Category) (models.Category, error) {
	cat, err := GetCategoryByID(id)
	if err != nil {
		return cat, err
	}
	result := database.DB.Model(&cat).Updates(data)
	return cat, result.Error
}

func DeleteCategory(id uint) error {
	var count int64

	// بررسی اینکه آیا این دسته‌بندی در تراکنش‌ها استفاده شده یا نه
	if err := database.DB.Model(&models.Transaction{}).
		Where("category_id = ?", id).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("این دسته‌بندی در تراکنش‌ها استفاده شده و قابل حذف نیست")
	}

	if err := database.DB.Delete(&models.Category{}, id).Error; err != nil {
		return err
	}

	return nil
}
