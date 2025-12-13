package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

func Load() {
	// Load .env file (if exists)
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}
}

func Get(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
