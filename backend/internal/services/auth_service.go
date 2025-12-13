package services

import (
	"strings"

	"github.com/amirqodi/hgm/internal/models"
	"github.com/amirqodi/hgm/internal/repositories"
	"github.com/amirqodi/hgm/internal/utils"
	"github.com/gofiber/fiber/v2"
)

// Authenticate بررسی نام کاربری و رمز عبور و بازگرداندن خطاها با کلید مشخص
func Authenticate(username, password string) (*models.User, map[string][]string) {
	errorsMap := make(map[string][]string)

	user, err := repositories.FindByUsername(username)
	if err != nil {
		errorsMap["username"] = append(errorsMap["username"], "نام کاربری یافت نشد")
		return nil, errorsMap
	}

	if !utils.CheckPasswordHash(password, user.Password) {
		errorsMap["password"] = append(errorsMap["password"], "رمز عبور اشتباه است")
		return nil, errorsMap
	}

	return user, nil
}

func VerifyToken(c *fiber.Ctx) error {
	// گرفتن هدر Authorization
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "missing authorization header",
		})
	}

	// استخراج توکن (فرمت: "Bearer <token>")
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid authorization header",
		})
	}
	tokenStr := parts[1]

	// اعتبارسنجی توکن
	claims, err := utils.ParseJWT(tokenStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "invalid or expired token",
		})
	}

	// موفقیت → برگردوندن اطلاعات کاربر
	return c.JSON(fiber.Map{
		"valid":    true,
		"user_id":  (*claims)["user_id"],
		"username": (*claims)["username"],
	})
}
