package handlers

import (
	"github.com/amirqodi/hgm/internal/services"
	"github.com/gofiber/fiber/v2"
)

func GetPrices(c *fiber.Ctx) error {
	usd, tether, gold18, err := services.GetLastPrice()
	if err != nil {
		// اگر خطا بود، آخرین قیمت ذخیره‌شده را برگردان
		usd, tether, gold18, err = services.GetLastPrice()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error": "failed to fetch or retrieve prices",
			})
		}
	}

	return c.JSON(fiber.Map{
		"usd":    usd,
		"tether": tether,
		"gold18": gold18,
	})
}
