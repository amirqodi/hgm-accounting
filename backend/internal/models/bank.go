package models

import "time"

type BankAccount struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	BankName      string  `gorm:"size:100;not null" json:"bank_name"`
	AccountNumber string  `gorm:"size:32;not null;unique" json:"account_number"`
	CardNumber    string  `gorm:"size:16;not null;unique" json:"card_number"`
	IBAN          string  `gorm:"size:26;not null;unique" json:"iban"`
	Balance       float64 `gorm:"not null;default:0" json:"balance"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
