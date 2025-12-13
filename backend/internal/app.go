package internal

import (
	"github.com/amirqodi/hgm/internal/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func Setup(app *fiber.App) {
	// Allow only frontend domain
	// frontendURL := os.Getenv("FRONTEND_URL") // put in .env
	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000", // e.g. "http://localhost:3000"
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET,POST,PUT,DELETE",
		AllowCredentials: true,
	}))

	// Register routes
	routes.Register(app)
}
