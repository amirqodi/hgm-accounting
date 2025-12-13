package handlers

import (
	"strconv"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/gofiber/fiber/v2"
)

// ---------------- CREATE ----------------
// ---------------- CREATE ----------------
func CreateContact(c *fiber.Ctx) error {
	var contact models.Contact
	errorsMap := make(map[string][]string)

	if err := c.BodyParser(&contact); err != nil {
		errorsMap["error"] = append(errorsMap["error"], "داده‌های ارسال‌شده معتبر نیستند")
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	// ------------------ مقدار پیش‌فرض سرمایه اولیه ------------------
	if contact.Type == models.Shareholder && contact.Amount == nil {
		zero := 0.0
		contact.Amount = &zero
	}

	// اعتبارسنجی پایه
	if contact.FirstName == "" {
		errorsMap["first_name"] = append(errorsMap["first_name"], "نام نمی‌تواند خالی باشد")
	}
	if contact.LastName == "" {
		errorsMap["last_name"] = append(errorsMap["last_name"], "نام خانوادگی نمی‌تواند خالی باشد")
	}
	if contact.PhoneNumber == "" {
		errorsMap["phone_number"] = append(errorsMap["phone_number"], "شماره تلفن نمی‌تواند خالی باشد")
	}

	// اعتبارسنجی بر اساس نوع Contact
	switch contact.Type {
	case models.Shareholder:
		if contact.SharePercentage == nil {
			errorsMap["share_percentage"] = append(errorsMap["share_percentage"], "درصد سهم الزامی است")
		} else if *contact.SharePercentage > 100 {
			errorsMap["share_percentage"] = append(errorsMap["share_percentage"], "درصد سهم نمی‌تواند بیشتر از 100 باشد")
		} else {
			totalShare := repositories.SumSharePercentage() // مجموع سهام موجود
			if totalShare+*contact.SharePercentage > 100 {
				errorsMap["share_percentage"] = append(errorsMap["share_percentage"], "مجموع درصد سهام نمی‌تواند بیشتر از 100 باشد")
			}
		}
	case models.Customer:
		if contact.CarType == nil || *contact.CarType == "" {
			errorsMap["car_type"] = append(errorsMap["car_type"], "نوع خودرو الزامی است")
		}
		if contact.CarKilometer == nil || *contact.CarKilometer < 0 {
			errorsMap["car_kilometer"] = append(errorsMap["car_kilometer"], "کیلومتر خودرو نامعتبر است")
		}
	case models.Vendor:
		if contact.Address == nil || *contact.Address == "" {
			errorsMap["address"] = append(errorsMap["address"], "آدرس الزامی است")
		}
	}

	if len(errorsMap) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	if err := repositories.CreateContact(&contact); err != nil {
		errorsMap["error"] = append(errorsMap["error"], "مشکلی در ایجاد مخاطب به وجود آمد")
		return c.Status(fiber.StatusInternalServerError).JSON(errorsMap)
	}

	return c.Status(fiber.StatusCreated).JSON(contact)
}

// ---------------- READ ----------------
func GetContacts(c *fiber.Ctx) error {
	contactType := c.Query("type", "") // فیلتر بر اساس نوع
	search := c.Query("search", "")    // جستجو روی نام و شماره
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	var contacts []models.Contact
	var total int64
	db := database.DB.Model(&models.Contact{})

	// اعمال فیلتر نوع
	if contactType != "" {
		db = db.Where("type = ?", contactType)
	}

	// اعمال جستجو
	if search != "" {
		db = db.Where("first_name LIKE ? OR last_name LIKE ? OR phone_number LIKE ?",
			"%"+search+"%", "%"+search+"%", "%"+search+"%")
	}

	// گرفتن تعداد کل نتایج
	if err := db.Count(&total).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": []string{"خطا در شمارش مخاطبین"},
		})
	}

	// گرفتن نتایج با Pagination
	if err := db.Offset(offset).Limit(limit).Find(&contacts).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": []string{"خطا در دریافت لیست مخاطبین"},
		})
	}

	return c.JSON(fiber.Map{
		"data":       contacts,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

func GetContactByID(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"id": []string{"شناسه نامعتبر است"},
		})
	}

	contact, err := repositories.GetContactByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"id": []string{"مخاطب مورد نظر یافت نشد"},
		})
	}

	return c.JSON(contact)
}

// ---------------- UPDATE ----------------
func UpdateContact(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"id": []string{"شناسه نامعتبر است"},
		})
	}

	var updateData models.Contact
	errorsMap := make(map[string][]string)

	if err := c.BodyParser(&updateData); err != nil {
		errorsMap["error"] = append(errorsMap["error"], "داده‌های ارسال‌شده معتبر نیستند")
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	// اعتبارسنجی پایه
	if updateData.FirstName == "" {
		errorsMap["first_name"] = append(errorsMap["first_name"], "نام نمی‌تواند خالی باشد")
	}
	if updateData.LastName == "" {
		errorsMap["last_name"] = append(errorsMap["last_name"], "نام خانوادگی نمی‌تواند خالی باشد")
	}
	if updateData.PhoneNumber == "" {
		errorsMap["phone_number"] = append(errorsMap["phone_number"], "شماره تلفن نمی‌تواند خالی باشد")
	}

	// اعتبارسنجی بر اساس نوع Contact
	switch updateData.Type {
	case models.Shareholder:
		if updateData.SharePercentage == nil {
			errorsMap["share_percentage"] = append(errorsMap["share_percentage"], "درصد سهم الزامی است")
		} else if *updateData.SharePercentage > 100 {
			errorsMap["share_percentage"] = append(errorsMap["share_percentage"], "درصد سهم نمی‌تواند بیشتر از 100 باشد")
		} else {
			totalShare := repositories.SumSharePercentageExcludingID(uint(id))
			if totalShare+*updateData.SharePercentage > 100 {
				errorsMap["share_percentage"] = append(errorsMap["share_percentage"], "مجموع درصد سهام نمی‌تواند بیشتر از 100 باشد")
			}
		}
	case models.Customer:
		if updateData.CarType == nil || *updateData.CarType == "" {
			errorsMap["car_type"] = append(errorsMap["car_type"], "نوع خودرو الزامی است")
		}
		if updateData.CarKilometer == nil || *updateData.CarKilometer < 0 {
			errorsMap["car_kilometer"] = append(errorsMap["car_kilometer"], "کیلومتر خودرو نامعتبر است")
		}
	case models.Vendor:
		if updateData.Address == nil || *updateData.Address == "" {
			errorsMap["address"] = append(errorsMap["address"], "آدرس الزامی است")
		}
	}

	if len(errorsMap) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	updated, err := repositories.UpdateContact(uint(id), &updateData)
	if err != nil {
		errorsMap["error"] = append(errorsMap["error"], "خطا در بروزرسانی مخاطب")
		return c.Status(fiber.StatusInternalServerError).JSON(errorsMap)
	}

	return c.JSON(updated)
}

// ---------------- DELETE ----------------
func DeleteContact(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"id": []string{"شناسه نامعتبر است"},
		})
	}

	err = repositories.DeleteContact(uint(id))
	if err != nil {
		// اگر خطا از نوع استفاده در تراکنش باشد
		if err.Error() == "این مخاطب در تراکنش‌ها استفاده شده و قابل حذف نیست" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": []string{err.Error()},
			})
		}

		// سایر خطاها (مثلاً خطای دیتابیس)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": []string{"خطا در حذف مخاطب"},
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}
