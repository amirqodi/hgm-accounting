package database

import (
	"fmt"
	"log"
	"os"

	"github.com/amirqodi/hgm/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB2 *gorm.DB

func Connect2() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Auto migrate
	if err := db.AutoMigrate(
		&models.User{},
		&models.Contact{},
		&models.BankAccount{},
		&models.CashHolder{},
		&models.ProductService{},
		&models.Category{},
		&models.Transaction{},
		&models.SubTransaction{},
		&models.TransactionAttachment{},
		&models.Price{},
		&models.Deposit{},
	); err != nil {
		log.Fatal("Migration failed:", err)
	}

	DB = db

	Seed()
}
