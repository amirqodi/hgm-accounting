package models

import "time"

type Price struct {
	ID        uint    `gorm:"primaryKey"`
	Dollar    float64 `gorm:"not null"`
	Tether    float64 `gorm:"not null"`
	Gold18    float64 `gorm:"not null"`
	CreatedAt time.Time
}
