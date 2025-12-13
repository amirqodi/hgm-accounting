package handlers

import (
	"strconv"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func GetDepositsHandler(c *fiber.Ctx) error {
	db := database.DB

	var deposits []models.Deposit
	if err := db.Preload("Contact").Preload("BankAccount").Preload("CashHolder").Find(&deposits).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "خطا در دریافت لیست ودیعه‌ها"})
	}

	return c.Status(fiber.StatusOK).JSON(deposits)
}

// CreateDepositHandler creates a new deposit
func CreateDepositHandler(c *fiber.Ctx) error {
	var dep models.Deposit

	// Parse JSON body
	if err := c.BodyParser(&dep); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "داده‌ها معتبر نیست"})
	}

	// اعتبارسنجی اولیه
	if dep.MoneySourceType == "bank" && dep.BankAccountID == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "حساب بانکی الزامیست"})
	}
	if dep.MoneySourceType == "cash" && dep.CashHolderID == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "تنخواه الزامیست"})
	}
	if dep.Amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "مبلغ باید بیشتر از صفر باشد"})
	}

	// ایجاد ودیعه با repository
	if err := repositories.CreateDeposit(&dep, database.DB); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(dep)
}

func DeleteDepositHandler(c *fiber.Ctx) error {
	db := database.DB

	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "آیدی نامعتبر است"})
	}

	var dep models.Deposit
	if err := db.First(&dep, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "ودیعه یافت نشد"})
	}

	// Revert balance
	if err := repositories.RevertDeposit(&dep, db); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// حذف ودیعه
	if err := db.Delete(&dep).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "خطا در حذف ودیعه"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "ودیعه با موفقیت حذف شد"})
}

func UpdateDepositHandler(c *fiber.Ctx) error {
	db := database.DB

	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "آیدی نامعتبر است"})
	}

	var existing models.Deposit
	if err := db.First(&existing, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "ودیعه یافت نشد"})
	}

	var updated models.Deposit
	if err := c.BodyParser(&updated); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "داده‌ها معتبر نیست"})
	}

	// Revert previous balance first
	if err := repositories.RevertDeposit(&existing, db); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// Save updated deposit
	updated.ID = existing.ID
	if err := db.Session(&gorm.Session{FullSaveAssociations: true}).Updates(&updated).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "خطا در بروزرسانی ودیعه"})
	}

	// Adjust balance for updated deposit
	if err := repositories.AdjustDepositBalance(&updated, db); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(fiber.StatusOK).JSON(updated)
}

func PayDepositHandler(c *fiber.Ctx) error {
	db := database.DB
	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "آیدی نامعتبر است"})
	}

	var dep models.Deposit
	if err := db.First(&dep, id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "ودیعه یافت نشد"})
	}

	// بررسی وضعیت
	if dep.Status == "completed" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "ودیعه قبلاً پرداخت شده"})
	}

	// بروزرسانی موجودی بانک یا تنخواه
	if err := repositories.AdjustDepositBalance(&dep, db); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	// تغییر وضعیت به پرداخت شده
	dep.Status = "completed"
	if err := db.Save(&dep).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "خطا در بروزرسانی وضعیت ودیعه"})
	}

	return c.Status(fiber.StatusOK).JSON(dep)
}

func GetDepositByIDHandler(c *fiber.Ctx) error {
	db := database.DB

	idStr := c.Params("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "آیدی نامعتبر است"})
	}

	var dep models.Deposit
	if err := db.Preload("Contact").Preload("BankAccount").Preload("CashHolder").
		First(&dep, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "ودیعه یافت نشد"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "خطا در دریافت ودیعه"})
	}

	return c.Status(fiber.StatusOK).JSON(dep)
}
