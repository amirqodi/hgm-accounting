package handlers

import (
	"strconv"
	"time"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/services"
	"github.com/gofiber/fiber/v2"
)

type LatestTransactionDTO struct {
	ID              uint      `json:"id"`
	Amount          float64   `json:"amount"`
	TransactionDate time.Time `json:"transaction_date"`
	IsPaid          bool      `json:"is_paid"`
	TransactionType string    `json:"transaction_type"`
}

type DashboardSummaryDTO struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	NetProfit    float64 `json:"net_profit"`
}

func GetIncomeExpenseReportHandler(c *fiber.Ctx) error {
	period := c.Query("period", "monthly")
	report, err := services.GetIncomeExpenseReport(database.DB, period)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(report)
}

func GetLatestTransactionsHandler(c *fiber.Ctx) error {
	// گرفتن limit از query، پیش‌فرض 10
	limitStr := c.Query("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}

	var txs []LatestTransactionDTO
	if err := database.DB.Model(&models.Transaction{}).
		Select("id, amount, transaction_date, is_paid, transaction_type").
		Order("created_at desc").
		Limit(limit).
		Scan(&txs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(txs)
}

func GetTotalBalanceHandler(c *fiber.Ctx) error {
	result, err := services.GetTotalBalance(database.DB)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

func GetBalanceSheetHandler(c *fiber.Ctx) error {
	result, err := services.GetBalanceSheet(database.DB)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(result)
}

func GetDashboardSummaryHandler(c *fiber.Ctx) error {
	var summary DashboardSummaryDTO

	// جمع کل درآمد
	if err := database.DB.Model(&models.Transaction{}).
		Where("transaction_type = ?", "income").
		Select("COALESCE(SUM(amount),0)").Scan(&summary.TotalIncome).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// جمع کل هزینه
	if err := database.DB.Model(&models.Transaction{}).
		Where("transaction_type = ?", "expense").
		Select("COALESCE(SUM(amount),0)").Scan(&summary.TotalExpense).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// سود خالص
	summary.NetProfit = summary.TotalIncome - summary.TotalExpense

	return c.JSON(summary)
}
