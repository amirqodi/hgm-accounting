package handlers

import (
	"strconv"

	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/gofiber/fiber/v2"
)

// Create
func CreateCategoryHandler(c *fiber.Ctx) error {
	var cat models.Category
	if err := c.BodyParser(&cat); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}
	if err := repositories.CreateCategory(&cat); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not create category"})
	}
	return c.JSON(cat)
}

// Read all (flat)
func GetCategoriesHandler(c *fiber.Ctx) error {
	cats, err := repositories.GetCategories()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not fetch categories"})
	}
	return c.JSON(cats)
}

// Read single
func GetCategoryByIDHandler(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}
	cat, err := repositories.GetCategoryByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "category not found"})
	}
	return c.JSON(cat)
}

// Update
func UpdateCategoryHandler(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid ID"})
	}
	var data models.Category
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid request"})
	}
	updated, err := repositories.UpdateCategory(uint(id), &data)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "could not update category"})
	}
	return c.JSON(updated)
}

// Delete
func DeleteCategoryHandler(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "شناسه معتبر نیست",
		})
	}

	err = repositories.DeleteCategory(uint(id))
	if err != nil {
		if err.Error() == "این دسته‌بندی در تراکنش‌ها استفاده شده و قابل حذف نیست" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "مشکلی در حذف دسته‌بندی به وجود آمد"})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
