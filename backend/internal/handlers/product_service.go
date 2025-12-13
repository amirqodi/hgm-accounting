package handlers

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/gofiber/fiber/v2"
)

// ---------------- CREATE ----------------
func CreateProductService(c *fiber.Ctx) error {
	var p models.ProductService
	errorsMap := make(map[string][]string)

	// پارس کردن بدنه
	if err := c.BodyParser(&p); err != nil {
		errorsMap["error"] = append(errorsMap["error"], "داده‌های ارسال‌شده معتبر نیستند")
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	// ------------------ تولید کد خودکار در صورت خالی بودن ------------------
	if p.Code == "" {
		p.Code = generateProductCode() // تابع برای تولید کد
	}

	if p.Stock == nil {
		var zero int64 = 0
		p.Stock = &zero
	}

	// اعتبارسنجی فیلدها
	if p.Name == "" {
		errorsMap["name"] = append(errorsMap["name"], "نام محصول یا خدمت نمی‌تواند خالی باشد")
	}
	if p.BuyingPrice != nil && *p.BuyingPrice < 0 {
		errorsMap["buyingPrice"] = append(errorsMap["buyingPrice"], "قیمت خرید نمی‌تواند منفی باشد")
	}
	if p.SellingPrice < 0 {
		errorsMap["sellingPrice"] = append(errorsMap["sellingPrice"], "قیمت فروش نمی‌تواند منفی باشد")
	}

	// بررسی وجود نام و کد در دیتابیس
	var count int64
	count = repositories.CountProductByName(p.Name)
	if count > 0 {
		errorsMap["name"] = append(errorsMap["name"], "محصول یا خدمت دیگری با همین نام از قبل وجود دارد")
	}
	count = repositories.CountProductByCode(p.Code)
	if count > 0 {
		errorsMap["code"] = append(errorsMap["code"], "کد محصول یا خدمت تکراری است")
	}

	// ارسال خطاها اگر وجود دارند
	if len(errorsMap) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	// ذخیره در دیتابیس
	if err := repositories.CreateProductService(&p); err != nil {
		errorsMap["error"] = append(errorsMap["error"], "مشکلی در ذخیره‌سازی محصول یا خدمت به وجود آمد")
		return c.Status(fiber.StatusInternalServerError).JSON(errorsMap)
	}

	return c.Status(fiber.StatusCreated).JSON(p)
}

// ---------------- READ ----------------
func GetProductServices(c *fiber.Ctx) error {
	// پارامترهای query
	search := c.Query("search", "")
	limit, _ := strconv.Atoi(c.Query("limit", "10")) // پیش‌فرض ۱۰
	page, _ := strconv.Atoi(c.Query("page", "1"))    // پیش‌فرض صفحه ۱

	products, total, err := repositories.GetAllProductServices(search, limit, page)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": []string{"خطا در دریافت لیست محصولات/خدمات"},
		})
	}

	return c.JSON(fiber.Map{
		"results": products,
		"count":   total,
		"page":    page,
		"limit":   limit,
	})
}

func GetProductsHandler(c *fiber.Ctx) error {
	// پارامترهای query
	pageParam := c.Query("page", "1")
	pageSizeParam := c.Query("page_size", "10")
	searchParam := c.Query("search", "")

	page, err := strconv.Atoi(pageParam)
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(pageSizeParam)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	// URL decode search
	search, _ := url.QueryUnescape(searchParam)
	search = strings.TrimSpace(search)

	products, total, err := repositories.GetProductsWithPagination(page, pageSize, search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": []string{"خطا در دریافت لیست محصولات"},
		})
	}

	return c.JSON(fiber.Map{
		"results":   products,
		"count":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetServicesHandler(c *fiber.Ctx) error {
	// پارامترهای query
	pageParam := c.Query("page", "1")
	pageSizeParam := c.Query("page_size", "10")
	searchParam := c.Query("search", "")

	page, err := strconv.Atoi(pageParam)
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(pageSizeParam)
	if err != nil || pageSize < 1 {
		pageSize = 10
	}

	search, _ := url.QueryUnescape(searchParam)
	search = strings.TrimSpace(search)

	services, total, err := repositories.GetServicesWithPagination(page, pageSize, search)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": []string{"خطا در دریافت لیست خدمات"},
		})
	}

	return c.JSON(fiber.Map{
		"results":   services,
		"count":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetProductServiceByID(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"id": []string{"شناسه نامعتبر است"},
		})
	}

	product, err := repositories.GetProductServiceByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"id": []string{"محصول یا خدمت مورد نظر یافت نشد"},
		})
	}

	return c.JSON(product)
}

// ---------------- UPDATE ----------------
func UpdateProductService(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"id": []string{"شناسه (ID) نامعتبر است"},
		})
	}

	var data models.ProductService
	errorsMap := make(map[string][]string)

	if err := c.BodyParser(&data); err != nil {
		errorsMap["error"] = append(errorsMap["error"], "داده‌های ارسال‌شده معتبر نیستند")
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	// ولیدیشن فیلدها
	if data.Name == "" {
		errorsMap["name"] = append(errorsMap["name"], "نام محصول یا خدمت نمی‌تواند خالی باشد")
	}
	if data.BuyingPrice != nil && *data.BuyingPrice < 0 {
		errorsMap["buyingPrice"] = append(errorsMap["buyingPrice"], "قیمت خرید نمی‌تواند منفی باشد")
	}
	if data.SellingPrice < 0 {
		errorsMap["sellingPrice"] = append(errorsMap["sellingPrice"], "قیمت فروش نمی‌تواند منفی باشد")
	}

	// بررسی وجود نام و کد (به جز همین رکورد)
	var count int64
	count = repositories.CountProductByNameExcludingID(data.Name, uint(id))
	if count > 0 {
		errorsMap["name"] = append(errorsMap["name"], "محصول یا خدمت دیگری با همین نام از قبل وجود دارد")
	}
	count = repositories.CountProductByCodeExcludingID(data.Code, uint(id))
	if count > 0 {
		errorsMap["code"] = append(errorsMap["code"], "کد محصول یا خدمت تکراری است")
	}

	if len(errorsMap) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	updated, err := repositories.UpdateProductService(uint(id), &data)
	if err != nil {
		errorsMap["error"] = append(errorsMap["error"], "خطا در بروزرسانی محصول یا خدمت")
		return c.Status(fiber.StatusInternalServerError).JSON(errorsMap)
	}

	return c.JSON(updated)
}

// ---------------- DELETE ----------------
func DeleteProductService(c *fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"id": []string{"شناسه (ID) نامعتبر است"},
		})
	}

	err = repositories.DeleteProductService(uint(id))
	if err != nil {
		if err.Error() == "این محصول یا خدمت در تراکنش‌ها استفاده شده و قابل حذف نیست" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": []string{err.Error()},
			})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": []string{"خطا در حذف محصول یا خدمت"},
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func generateProductCode() string {
	// مثال: PS- + timestamp به میلی‌ثانیه
	return fmt.Sprintf("PS-%d", time.Now().UnixNano()/1e6)
}
