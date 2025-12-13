package models

import "time"

type CashHolder struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	FirstName   string  `gorm:"size:100;not null" json:"first_name"`
	LastName    string  `gorm:"size:100;not null" json:"last_name"`
	PhoneNumber string  `gorm:"size:11;not null;unique" json:"phone_number"`
	Balance     float64 `gorm:"not null;default:0" json:"balance"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
