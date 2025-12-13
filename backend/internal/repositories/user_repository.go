package repositories

import (
	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
)

func FindByUsername(username string) (*models.User, error) {
	var user models.User
	result := database.DB.Where("username = ?", username).First(&user)
	if result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

func CreateUser(user *models.User) error {
	return database.DB.Create(user).Error
}
