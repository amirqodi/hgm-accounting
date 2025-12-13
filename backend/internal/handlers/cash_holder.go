package handlers

import (
	"strconv"

	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/gofiber/fiber/v2"
)

// Create
func CreateCashHolder(c *fiber.Ctx) error {
	var holder models.CashHolder
	if err := c.BodyParser(&holder); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	if err := repositories.CreateCashHolder(&holder); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create cash holder"})
	}

	return c.Status(fiber.StatusCreated).JSON(holder)
}

// Get all
func GetCashHolders(c *fiber.Ctx) error {
	// پارامترهای کوئری
	pageParam := c.Query("page", "1")
	pageSizeParam := c.Query("page_size", "10")
	search := c.Query("search", "")

	page, err := strconv.Atoi(pageParam)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeParam)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	holders, total, err := repositories.GetCashHoldersWithPagination(page, pageSize, search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "خطا در دریافت لیست نگه‌دارنده‌های نقدی",
		})
	}

	return c.JSON(fiber.Map{
		"results":   holders,
		"count":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// Get single
func GetCashHolderByID(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}

	holder, err := repositories.GetCashHolderByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "cash holder not found"})
	}

	return c.JSON(holder)
}

// Update
func UpdateCashHolder(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}

	var data models.CashHolder
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}

	updated, err := repositories.UpdateCashHolder(uint(id), &data)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not update cash holder"})
	}

	return c.JSON(updated)
}

// Delete
func DeleteCashHolder(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "شناسه معتبر نیست",
		})
	}

	err = repositories.DeleteCashHolder(uint(id))
	if err != nil {
		if err.Error() == "این صندوق در تراکنش‌ها استفاده شده و قابل حذف نیست" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "مشکلی در حذف صندوق به وجود آمد"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
