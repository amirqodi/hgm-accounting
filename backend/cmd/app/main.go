package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/amirqodi/hgm/internal"
	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	dotenvPath := os.Getenv("DOTENV_PATH")
	if dotenvPath == "" {
		dotenvPath = filepath.Join(".", ".env") // مسیر جاری backend
	}

	if err := godotenv.Load(dotenvPath); err != nil {
		fmt.Println("⚠️ No .env file found at", dotenvPath)
	}

	// DB connect
	database.Connect()

	// Fiber app
	app := fiber.New()
	app.Static("/uploads", "./uploads")

	// Price services
	services.UpdateOnStartup()
	services.StartPriceScheduler()

	// Routes
	internal.Setup(app)

	log.Fatal(app.Listen(":8000"))
}
