package handlers

import (
	"github.com/amirqodi/hgm/internal/services"
	"github.com/amirqodi/hgm/internal/utils"
	"github.com/gofiber/fiber/v2"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func Login(c *fiber.Ctx) error {
	var body LoginRequest
	errorsMap := make(map[string][]string)

	// پارس کردن بدنه
	if err := c.BodyParser(&body); err != nil {
		errorsMap["_error"] = append(errorsMap["_error"], "داده‌های ارسال‌شده معتبر نیستند")
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	// اعتبارسنجی پایه
	if body.Username == "" {
		errorsMap["username"] = append(errorsMap["username"], "نام کاربری الزامی است")
	}
	if body.Password == "" {
		errorsMap["password"] = append(errorsMap["password"], "رمز عبور الزامی است")
	}
	if len(errorsMap) > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(errorsMap)
	}

	// احراز هویت
	user, authErrors := services.Authenticate(body.Username, body.Password)
	if authErrors != nil && len(authErrors) > 0 {
		return c.Status(fiber.StatusUnauthorized).JSON(authErrors)
	}

	// ایجاد توکن
	token, err := utils.GenerateJWT(user.ID, user.Username)
	if err != nil {
		errorsMap["_error"] = append(errorsMap["_error"], "خطا در ایجاد توکن")
		return c.Status(fiber.StatusInternalServerError).JSON(errorsMap)
	}

	return c.JSON(fiber.Map{
		"token": token,
	})
}
