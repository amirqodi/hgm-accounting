package handlers

import (
	"encoding/json"
	"errors"
	"mime/multipart"
	"strconv"
	"time"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ---------------- CREATE ----------------
func CreateTransaction(c *fiber.Ctx) error {
	trx := new(models.Transaction)

	// -------- Parse basic fields --------
	if id, err := strconv.Atoi(c.FormValue("contact_id")); err == nil {
		trx.ContactID = uint(id)
	}
	if id, err := strconv.Atoi(c.FormValue("category_id")); err == nil {
		trx.CategoryID = uint(id)
	}
	if amount, err := strconv.ParseFloat(c.FormValue("amount"), 64); err == nil {
		trx.Amount = amount
	}
	trx.TransactionType = c.FormValue("transaction_type")
	trx.PaymentMethod = c.FormValue("payment_method")
	trx.MoneySourceType = c.FormValue("money_source_type")
	trx.Notes = c.FormValue("notes")
	trx.IsPaid, _ = strconv.ParseBool(c.FormValue("is_paid"))

	// Optional IDs
	if bankID := c.FormValue("bank_account_id"); bankID != "" {
		if id, err := strconv.Atoi(bankID); err == nil {
			trx.BankAccountID = uintPtr(uint(id))
		}
	}
	if cashID := c.FormValue("cash_holder_id"); cashID != "" {
		if id, err := strconv.Atoi(cashID); err == nil {
			trx.CashHolderID = uintPtr(uint(id))
		}
	}
	if productID := c.FormValue("product_service_id"); productID != "" {
		if id, err := strconv.Atoi(productID); err == nil {
			trx.ProductID = uintPtr(uint(id))
		}
	}
	if qty := c.FormValue("quantity"); qty != "" {
		if q, err := strconv.Atoi(qty); err == nil {
			trx.Quantity = uint(q)
		}
	}

	// -------- Parse dates --------
	layout := time.RFC3339 // چون تاریخ تو ISO هست (2025-07-14T20:30:00.000Z)
	dateStr := c.FormValue("transaction_date")
	if dateStr != "" {
		parsedDate, err := time.Parse(layout, dateStr)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "invalid transaction_date format",
			})
		}
		trx.TransactionDate = &parsedDate
	}

	// -------- Parse sub-transactions (JSON array) --------
	if subsJSON := c.FormValue("sub_transactions"); subsJSON != "" {
		var subs []models.SubTransaction
		if err := json.Unmarshal([]byte(subsJSON), &subs); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid sub_transactions"})
		}
		trx.SubTransactions = subs
	}

	// -------- Handle file uploads --------
	form, _ := c.MultipartForm()
	var files []*multipart.FileHeader
	if form != nil {
		files = form.File["attachments"]
	}

	// -------- Save transaction using repository --------
	if err := repositories.CreateTransaction(trx, files, database.DB); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(trx)
}

// Helper to convert uint to *uint
func uintPtr(u uint) *uint {
	return &u
}

// ---------------- READ ----------------
func GetTransactions(c *fiber.Ctx) error {
	// Query parameters
	pageParam := c.Query("page", "1")
	pageSizeParam := c.Query("page_size", "10")
	search := c.Query("search", "")
	startDate := c.Query("start_date", "")
	endDate := c.Query("end_date", "")

	page, err := strconv.Atoi(pageParam)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeParam)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	trxs, total, totalPages, err := repositories.GetTransactionsWithPagination(
		database.DB, page, pageSize, search, startDate, endDate,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"results":    trxs,
		"count":      total,
		"page":       page,
		"page_size":  pageSize,
		"totalPages": totalPages,
	})
}

func GetTransactionByID(c *fiber.Ctx) error {

	id, _ := strconv.Atoi(c.Params("id"))

	trx, err := repositories.GetTransactionByID(uint(id), database.DB)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "transaction not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(trx)
}

// ---------------- UPDATE ----------------
func UpdateTransaction(c *fiber.Ctx) error {

	id, _ := strconv.Atoi(c.Params("id"))

	var trx models.Transaction
	if err := c.BodyParser(&trx); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	if err := repositories.UpdateTransaction(uint(id), &trx, database.DB); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(trx)
}

// ---------------- DELETE ----------------
func DeleteTransaction(c *fiber.Ctx) error {

	id, _ := strconv.Atoi(c.Params("id"))

	if err := repositories.DeleteTransaction(uint(id), database.DB); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// ---------------- PAY SUB-TRANSACTION ----------------
func PaySubTransaction(c *fiber.Ctx) error {
	subID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid sub-transaction ID"})
	}

	var sub models.SubTransaction
	if err := database.DB.First(&sub, uint(subID)).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "sub-transaction not found"})
	}

	if sub.IsPaid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "sub-transaction already paid"})
	}

	// پرداخت ساب تراکنش
	if err := repositories.PaySubTransaction(&sub, database.DB); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// بررسی همه ساب‌تراکنش‌های تراکنش اصلی
	var trx models.Transaction
	if err := database.DB.Preload("SubTransactions").First(&trx, sub.TransactionID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "parent transaction not found"})
	}

	allPaid := true
	for _, s := range trx.SubTransactions {
		if !s.IsPaid {
			allPaid = false
			break
		}
	}

	if allPaid {
		trx.IsPaid = true
		if err := database.DB.Save(&trx).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "failed to update parent transaction"})
		}
	}

	return c.JSON(sub)
}

type UpcomingSubResponse struct {
	Total int                     `json:"total"`
	Data  []models.SubTransaction `json:"data"`
}

func GetUpcomingSubTransactions(c *fiber.Ctx) error {
	now := time.Now()
	twoDaysLater := now.Add(48 * time.Hour) // ۲ روز بعد

	// دریافت پارامتر limit از query string
	limitStr := c.Query("limit", "10") // پیش‌فرض 10
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	var total int64
	database.DB.Model(&models.SubTransaction{}).
		Where("is_paid = ? AND due_date <= ?", false, twoDaysLater).
		Count(&total)

	var subTransactions []models.SubTransaction
	err = database.DB.
		Where("is_paid = ? AND due_date <= ?", false, twoDaysLater).
		Order("due_date ASC").
		Limit(limit).
		Find(&subTransactions).Error
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch upcoming sub-transactions",
		})
	}

	return c.JSON(UpcomingSubResponse{
		Total: int(total),
		Data:  subTransactions,
	})
}
