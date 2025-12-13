package database

import (
	"log"

	"github.com/amirqodi/hgm/internal/config"
	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/utils"
)

func Seed() {
	adminUser := config.Get("ADMIN_USERNAME", "admin")
	adminPass := config.Get("ADMIN_PASSWORD", "admin123")

	hashed, _ := utils.HashPassword(adminPass)

	user := models.User{
		Username: adminUser,
		Password: hashed,
	}

	if err := DB.FirstOrCreate(&user, models.User{Username: adminUser}).Error; err != nil {
		log.Println("Seeder error:", err)
	} else {
		log.Println("Admin user seeded:", adminUser)
	}
}
