package database

import (
	"log"
	"os"

	"github.com/amirqodi/hgm/internal/models"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dbPath := "./data/hgm.db"
	if _, err := os.Stat("./data"); os.IsNotExist(err) {
		os.Mkdir("./data", os.ModePerm)
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to SQLite database:", err)
	}

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
