package models

import "time"

type ProductService struct {
	ID           uint     `gorm:"primaryKey" json:"id"`
	Code         string   `gorm:"size:50;not null;unique" json:"code"` // product code
	Name         string   `gorm:"size:200;not null;unique" json:"name"`
	SellingPrice float64  `gorm:"not null" json:"selling_price"`
	BuyingPrice  *float64 `json:"buying_price,omitempty"` // optional for services
	Stock        *int64   `json:"stock,omitempty"`        // optional for service-type products

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
