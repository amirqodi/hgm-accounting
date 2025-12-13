package handlers

import (
	"strconv"

	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/gofiber/fiber/v2"
)

// Create
func CreateBankAccount(c *fiber.Ctx) error {
	var account models.BankAccount
	if err := c.BodyParser(&account); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	if err := repositories.CreateBankAccount(&account); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create bank account"})
	}

	return c.Status(fiber.StatusCreated).JSON(account)
}

// Get all
func GetBankAccounts(c *fiber.Ctx) error {
	accounts, err := repositories.GetBankAccounts()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not fetch accounts"})
	}
	return c.JSON(accounts)
}

// Get single
func GetBankAccountByID(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}

	account, err := repositories.GetBankAccountByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "account not found"})
	}

	return c.JSON(account)
}

// Update
func UpdateBankAccount(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}

	var data models.BankAccount
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	updated, err := repositories.UpdateBankAccount(uint(id), &data)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not update account"})
	}

	return c.JSON(updated)
}

// Delete
func DeleteBankAccount(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "شناسه معتبر نیست"})
	}

	err = repositories.DeleteBankAccount(uint(id))
	if err != nil {
		if err.Error() == "این حساب بانکی در تراکنش‌ها استفاده شده و قابل حذف نیست" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "مشکلی در حذف حساب بانکی به وجود آمد"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
