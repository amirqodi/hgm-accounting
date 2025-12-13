package models

import "time"

type Transaction struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// Relations
	ContactID  uint            `json:"contact_id"` // required
	Contact    Contact         `json:"contact"`
	CategoryID uint            `json:"category_id"` // required
	Category   Category        `json:"category"`
	ProductID  *uint           `json:"product_service_id,omitempty"`
	Product    *ProductService `json:"product,omitempty"`
	Quantity   uint            `json:"quantity"` // تعداد محصول

	// Money source (bank or cash)
	MoneySourceType string       `json:"money_source_type"` // "bank" or "cash"
	BankAccountID   *uint        `json:"bank_account_id,omitempty"`
	BankAccount     *BankAccount `json:"bank_account,omitempty"`
	CashHolderID    *uint        `json:"cash_holder_id,omitempty"`
	CashHolder      *CashHolder  `json:"cash_holder,omitempty"`

	// Transaction info
	TransactionType string     `json:"transaction_type"` // "income" or "expense" or "share"
	Amount          float64    `json:"amount"`
	PaymentMethod   string     `json:"payment_method"` // "cash", "cheque", "card", "installment"
	IsPaid          bool       `json:"is_paid"`
	TransactionDate *time.Time `json:"transaction_date"`

	// Installment / sub-transactions
	SubTransactions []SubTransaction `json:"sub_transactions,omitempty"`

	// Optional
	Notes       string                  `json:"notes,omitempty"`
	Attachments []TransactionAttachment `json:"attachments,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SubTransaction struct {
	ID            uint       `gorm:"primaryKey" json:"id"`
	TransactionID uint       `json:"transaction_id"`
	Amount        float64    `json:"amount"`
	DueDate       *time.Time `json:"due_date,omitempty"`
	IsPaid        bool       `json:"is_paid"`
}

type TransactionAttachment struct {
	ID            uint   `gorm:"primaryKey" json:"id"`
	TransactionID uint   `gorm:"constraint:OnDelete:CASCADE" json:"transaction_id"`
	FilePath      string `json:"file_path"`
	FileName      string `json:"file_name"`
}
