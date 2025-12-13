package models

import "time"

type ContactType string

const (
	Shareholder ContactType = "shareholder"
	Customer    ContactType = "customer"
	Vendor      ContactType = "vendor"
)

type Contact struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	FirstName   string      `json:"first_name"`
	LastName    string      `json:"last_name"`
	PhoneNumber string      `json:"phone_number"`
	Type        ContactType `json:"type"`

	// Shareholder fields
	SharePercentage *float64 `json:"share_percentage,omitempty"`
	Amount          *float64 `json:"amount,omitempty"`

	// Customer fields
	CarType      *string `json:"car_type,omitempty"`
	CarKilometer *int    `json:"car_kilometer,omitempty"`

	// Vendor field
	Address *string `json:"address,omitempty"`

	CreatedAt time.Time
	UpdatedAt time.Time
}
