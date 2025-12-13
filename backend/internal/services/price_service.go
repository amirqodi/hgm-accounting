package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/amirqodi/hgm/internal/database"
	"github.com/amirqodi/hgm/internal/models"
	"gorm.io/gorm"
)

// مدل پاسخ نواسـان
type NavasanItem struct {
	Value string `json:"value"`
}

// دریافت یک آیتم از نواسـان
func fetchItem(item string) (float64, error) {
	apiKey := os.Getenv("NAVASAN_API_KEY")
	url := fmt.Sprintf("http://api.navasan.tech/latest/?api_key=%s&item=%s", apiKey, item)

	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}

	var data map[string]NavasanItem
	if err := json.Unmarshal(body, &data); err != nil {
		fmt.Println("RAW NAVASAN RESPONSE:", string(body))
		return 0, err
	}

	for _, v := range data {
		val := strings.ReplaceAll(v.Value, ",", "")
		f, err := strconv.ParseFloat(val, 64)
		if err != nil {
			return 0, err
		}
		return f, nil
	}

	return 0, fmt.Errorf("no data for %s", item)
}

// دریافت قیمت‌ها و ذخیره در دیتابیس
func fetchAndSave() error {
	usd, err := fetchItem("usd_sell")
	if err != nil {
		return err
	}

	tether, err := fetchItem("usdt")
	if err != nil {
		tether = usd
	}

	gold18, err := fetchItem("18ayar")
	if err != nil {
		return err
	}

	price := models.Price{
		Dollar: usd,
		Tether: tether,
		Gold18: gold18,
	}
	database.DB.Create(&price)

	fmt.Println("Prices updated:", price)
	return nil
}

// دریافت آخرین قیمت از دیتابیس
func GetLastPrice() (usd, tether, gold18 float64, err error) {
	var price models.Price
	if err := database.DB.Order("created_at desc").First(&price).Error; err != nil {
		return 0, 0, 0, err
	}
	return price.Dollar, price.Tether, price.Gold18, nil
}

// آپدیت در شروع سرور فقط اگر آخرین رکورد > ۶ ساعت گذشته باشد
func UpdateOnStartup() {
	var last models.Price
	err := database.DB.Order("created_at desc").First(&last).Error

	// اگه هیچ رکوردی پیدا نشد → بلافاصله fetch کن
	if errors.Is(err, gorm.ErrRecordNotFound) {
		fmt.Println("No price data found, fetching initial prices...")
		if err := fetchAndSave(); err != nil {
			fmt.Println("Failed to fetch initial prices:", err)
		}
		return
	}

	// اگه خطای دیگه‌ای بود
	if err != nil {
		fmt.Println("DB error while checking last price:", err)
		return
	}

	// اگه رکورد هست ولی قدیمیه → fetch کن
	if time.Since(last.CreatedAt) > 6*time.Hour {
		fmt.Println("Last price is old, fetching new prices...")
		if err := fetchAndSave(); err != nil {
			fmt.Println("Failed to fetch prices on startup:", err)
		}
	} else {
		fmt.Println("Last price is recent, skipping startup fetch")
	}
}

// زمان‌بندی آپدیت قیمت‌ها هر ۶ ساعت
func StartPriceScheduler() {
	go func() {
		for {
			time.Sleep(6 * time.Hour) // ابتدا صبر ۶ ساعت
			if err := fetchAndSave(); err != nil {
				fmt.Println("Failed to fetch prices:", err)
			}
		}
	}()
}
