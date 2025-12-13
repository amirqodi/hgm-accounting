package routes

import (
	"github.com/amirqodi/hgm/internal/handlers"
	"github.com/amirqodi/hgm/internal/middlewares"
	"github.com/amirqodi/hgm/internal/services"
	"github.com/gofiber/fiber/v2"
)

func Register(app *fiber.App) {
	api := app.Group("/api")

	// ---------------- Auth ----------------
	api.Post("/auth/login", handlers.Login)

	api.Get("/auth/me", middlewares.JWTProtected(), func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"user_id":  c.Locals("user_id"),
			"username": c.Locals("username"),
		})
	})

	api.Get("/verify-token", services.VerifyToken)

	// ---------------- Contacts ----------------
	contacts := api.Group("/contacts", middlewares.JWTProtected())
	contacts.Post("/", handlers.CreateContact)
	contacts.Get("/", handlers.GetContacts)
	contacts.Get("/:id", handlers.GetContactByID)
	contacts.Put("/:id", handlers.UpdateContact)
	contacts.Delete("/:id", handlers.DeleteContact)

	// ---------------- Bank Accounts ----------------
	bank := api.Group("/bank-accounts", middlewares.JWTProtected())
	bank.Post("/", handlers.CreateBankAccount)
	bank.Get("/", handlers.GetBankAccounts)
	bank.Get("/:id", handlers.GetBankAccountByID)
	bank.Put("/:id", handlers.UpdateBankAccount)
	bank.Delete("/:id", handlers.DeleteBankAccount)

	// ---------------- Cash Holders ----------------
	cash := api.Group("/cash-holders", middlewares.JWTProtected())
	cash.Post("/", handlers.CreateCashHolder)
	cash.Get("/", handlers.GetCashHolders)
	cash.Get("/:id", handlers.GetCashHolderByID)
	cash.Put("/:id", handlers.UpdateCashHolder)
	cash.Delete("/:id", handlers.DeleteCashHolder)

	// ---------------- Products / Services ----------------
	products := api.Group("/products", middlewares.JWTProtected())
	products.Post("/", handlers.CreateProductService)
	products.Get("/all", handlers.GetProductServices)
	products.Get("/products", handlers.GetProductsHandler)
	products.Get("/services", handlers.GetServicesHandler)
	products.Get("/:id", handlers.GetProductServiceByID)
	products.Put("/:id", handlers.UpdateProductService)
	products.Delete("/:id", handlers.DeleteProductService)

	// ---------------- Categories ----------------
	categories := api.Group("/categories", middlewares.JWTProtected())
	categories.Post("/", handlers.CreateCategoryHandler)
	categories.Get("/", handlers.GetCategoriesHandler)
	categories.Get("/:id", handlers.GetCategoryByIDHandler)
	categories.Put("/:id", handlers.UpdateCategoryHandler)
	categories.Delete("/:id", handlers.DeleteCategoryHandler)

	// ---------------- Transactions ----------------
	transactions := api.Group("/transactions", middlewares.JWTProtected())
	transactions.Post("/", handlers.CreateTransaction)                     // Create
	transactions.Get("/", handlers.GetTransactions)                        // Read all
	transactions.Get("/upcoming-sub", handlers.GetUpcomingSubTransactions) // Read unpaid subtransactions
	transactions.Get("/:id", handlers.GetTransactionByID)                  // Read single
	transactions.Put("/:id", handlers.UpdateTransaction)                   // Update
	transactions.Delete("/:id", handlers.DeleteTransaction)                // Delete
	transactions.Post("/sub/:id/pay", handlers.PaySubTransaction)          // Mark sub-transaction as paid

	// ---------------- Deposits ----------------
	deposits := api.Group("/deposits", middlewares.JWTProtected())
	deposits.Post("/", handlers.CreateDepositHandler)      // ایجاد ودیعه
	deposits.Put("/:id", handlers.UpdateDepositHandler)    // بروزرسانی ودیعه
	deposits.Delete("/:id", handlers.DeleteDepositHandler) // حذف ودیعه
	deposits.Put("/:id/pay", handlers.PayDepositHandler)   // پرداخت دستی ودیعه
	deposits.Get("/", handlers.GetDepositsHandler)         // لیست کامل ودیعه‌ها
	deposits.Get("/:id", handlers.GetDepositByIDHandler)   // مشاهده تک ودیعه

	reports := api.Group("/reports", middlewares.JWTProtected())
	reports.Get("/income-expense", handlers.GetIncomeExpenseReportHandler) // ?period=daily|weekly|monthly
	reports.Get("/latest", handlers.GetLatestTransactionsHandler)
	reports.Get("/total-balance", handlers.GetTotalBalanceHandler)
	reports.Get("/balance-sheet", handlers.GetBalanceSheetHandler)
	reports.Get("/summery", handlers.GetDashboardSummaryHandler)

	price := api.Group("/price", middlewares.JWTProtected())
	price.Get("/", handlers.GetPrices)

}
