package models

import "time"

type DepositType string

const (
	DepositReceived DepositType = "received"
	DepositPaid     DepositType = "paid"
)

type Deposit struct {
	ID uint `gorm:"primaryKey" json:"id"`

	// روابط
	ContactID       uint         `json:"contact_id"` // مشتری، فروشنده یا سهامدار
	Contact         Contact      `json:"contact"`
	MoneySourceType string       `json:"money_source_type"` // "bank" یا "cash"
	BankAccountID   *uint        `json:"bank_account_id,omitempty"`
	BankAccount     *BankAccount `json:"bank_account,omitempty"`
	CashHolderID    *uint        `json:"cash_holder_id,omitempty"`
	CashHolder      *CashHolder  `json:"cash_holder,omitempty"`
	Status          string

	// جزئیات
	Type   DepositType `json:"type"` // received یا paid
	Amount float64     `json:"amount"`
	Notes  string      `json:"notes,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
