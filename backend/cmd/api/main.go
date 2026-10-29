package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"projek-pbd/internal/catalog"
	"projek-pbd/internal/identity"
	"projek-pbd/internal/platform/auth"
	"projek-pbd/internal/platform/config"
	"projek-pbd/internal/platform/database"
	"projek-pbd/internal/platform/middleware"
	"projek-pbd/internal/procurement"
)

func main() {
	_ = godotenv.Load() // opsional: kalau .env tidak ada, pakai env sistem
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	cfg := config.Load()
	if len(cfg.JWTSecret) < 32 {
		slog.Error("JWT_SECRET wajib diisi minimal 32 karakter (lihat .env.example)")
		os.Exit(1)
	}

	db, err := database.Connect(cfg.DSN())
	if err != nil {
		slog.Error("gagal konek database", "error", err)
		os.Exit(1)
	}
	defer db.Close()
	slog.Info("berhasil konek database")

	jwtManager := auth.NewManager(cfg.JWTSecret, cfg.JWTTTL)

	r := gin.Default()
	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api")                                  // publik
	protected := api.Group("", middleware.Auth(jwtManager)) // wajib login

	identity.Register(api, protected, db, jwtManager, cfg.CookieSecure)
	catalog.Register(protected, db)
	procurement.Register(protected, db)
	// TODO: sales.Register(protected, db), inventory.Register(protected, db), ...

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: r}

	go func() {
		slog.Info("server jalan", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server berhenti", "error", err)
			os.Exit(1)
		}
	}()

	// graceful shutdown: tunggu Ctrl+C, beri waktu request yang lagi jalan selesai
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("shutdown paksa", "error", err)
	}
}
