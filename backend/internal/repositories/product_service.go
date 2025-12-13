package repositories

import (
	"errors"
	"strings"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
)

// ---------------- CREATE ----------------
func CreateProductService(p *models.ProductService) error {
	return database.DB.Create(p).Error
}

// ---------------- READ ----------------
func GetProductServices() ([]models.ProductService, error) {
	var products []models.ProductService
	err := database.DB.Find(&products).Error
	return products, err
}

func GetProducts() ([]models.ProductService, error) {
	var products []models.ProductService
	err := database.DB.
		Where("buying_price IS NOT NULL OR stock IS NOT NULL").
		Find(&products).Error
	return products, err
}

func GetServices() ([]models.ProductService, error) {
	var services []models.ProductService
	err := database.DB.
		Where("buying_price IS NULL AND stock IS NULL").
		Find(&services).Error
	return services, err
}

func GetProductServiceByID(id uint) (models.ProductService, error) {
	var product models.ProductService
	err := database.DB.First(&product, id).Error
	return product, err
}

// ---------------- UPDATE ----------------
func UpdateProductService(id uint, data *models.ProductService) (models.ProductService, error) {
	var product models.ProductService
	if err := database.DB.First(&product, id).Error; err != nil {
		return product, err
	}
	if err := database.DB.Model(&product).Updates(data).Error; err != nil {
		return product, err
	}
	return product, nil
}

// ---------------- DELETE ----------------
func DeleteProductService(id uint) error {
	var count int64

	// بررسی اینکه آیا این محصول در تراکنش‌ها استفاده شده یا نه
	if err := database.DB.Model(&models.Transaction{}).
		Where("product_id = ?", id).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("این محصول یا خدمت در تراکنش‌ها استفاده شده و قابل حذف نیست")
	}

	// اگر استفاده نشده، حذف شود
	if err := database.DB.Delete(&models.ProductService{}, id).Error; err != nil {
		return err
	}

	return nil
}

// ---------------- CHECK EXISTENCE ----------------

// بررسی وجود نام (برای Create)
func IsProductNameExists(name string) bool {
	var count int64
	database.DB.Model(&models.ProductService{}).Where("name = ?", name).Count(&count)
	return count > 0
}

// بررسی وجود کد (برای Create)
func IsProductCodeExists(code string) bool {
	var count int64
	database.DB.Model(&models.ProductService{}).Where("code = ?", code).Count(&count)
	return count > 0
}

// بررسی وجود نام، به جز رکورد فعلی (برای Update)
func CountProductByNameExcludingID(name string, id uint) int64 {
	var count int64
	database.DB.Model(&models.ProductService{}).
		Where("name = ? AND id <> ?", name, id).
		Count(&count)
	return count
}

// بررسی وجود کد، به جز رکورد فعلی (برای Update)
func CountProductByCodeExcludingID(code string, id uint) int64 {
	var count int64
	database.DB.Model(&models.ProductService{}).
		Where("code = ? AND id <> ?", code, id).
		Count(&count)
	return count
}

// بررسی وجود نام برای Create (می‌توان با Count هم استفاده کرد)
func CountProductByName(name string) int64 {
	var count int64
	database.DB.Model(&models.ProductService{}).Where("name = ?", name).Count(&count)
	return count
}

// بررسی وجود کد برای Create
func CountProductByCode(code string) int64 {
	var count int64
	database.DB.Model(&models.ProductService{}).Where("code = ?", code).Count(&count)
	return count
}

func GetAllProductServices(search string, limit, page int) ([]models.ProductService, int64, error) {
	var products []models.ProductService
	var total int64

	query := database.DB.Model(&models.ProductService{})

	// فیلتر بر اساس search (روی name)
	if search != "" {
		search = strings.TrimSpace(search)
		searchPattern := "%" + search + "%"

		query = query.Where("name LIKE ? COLLATE NOCASE", searchPattern)
	}

	// گرفتن تعداد کل رکوردها برای pagination
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// pagination و مرتب‌سازی
	offset := (page - 1) * limit
	if err := query.Order("id DESC").Limit(limit).Offset(offset).Find(&products).Error; err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

func GetProductsWithPagination(page, pageSize int, search string) ([]models.ProductService, int64, error) {
	var products []models.ProductService
	var total int64

	offset := (page - 1) * pageSize
	db := database.DB.Model(&models.ProductService{})

	// فقط محصولات واقعی (مثلاً فرض می‌کنیم Stock != NULL یعنی محصول)
	db = db.Where("stock IS NOT NULL")

	if search != "" {
		search = strings.TrimSpace(search)
		searchPattern := "%" + search + "%"

		db = db.Where(`
		name LIKE ? COLLATE NOCASE 
		OR COALESCE(code, '') LIKE ? COLLATE NOCASE
	`, searchPattern, searchPattern)
	}

	// تعداد کل رکوردها
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// گرفتن رکوردها با pagination
	if err := db.Order("id DESC").Offset(offset).Limit(pageSize).Find(&products).Error; err != nil {
		return nil, 0, err
	}

	return products, total, nil
}

// ---------------- Services ----------------
func GetServicesWithPagination(page, pageSize int, search string) ([]models.ProductService, int64, error) {
	var services []models.ProductService
	var total int64

	offset := (page - 1) * pageSize
	db := database.DB.Model(&models.ProductService{})

	// فقط خدمات (فرض می‌کنیم Stock == NULL یعنی خدمت)
	db = db.Where("stock IS NULL")

	if search != "" {
		search = strings.TrimSpace(search)
		searchPattern := "%" + search + "%"

		db = db.Where(`
		name LIKE ? COLLATE NOCASE OR 
		COALESCE(code, '') LIKE ? COLLATE NOCASE
	`, searchPattern, searchPattern)
	}

	// تعداد کل رکوردها
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// گرفتن رکوردها با pagination
	if err := db.Order("id DESC").Offset(offset).Limit(pageSize).Find(&services).Error; err != nil {
		return nil, 0, err
	}

	return services, total, nil
}
