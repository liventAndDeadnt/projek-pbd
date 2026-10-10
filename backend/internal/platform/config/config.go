// Package config membaca konfigurasi aplikasi dari environment variable.
package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port   string
	DBUser string
	DBPass string
	DBHost string
	DBPort string
	DBName string

	JWTSecret    string
	JWTTTL       time.Duration
	CookieSecure bool
}

func Load() Config {
	return Config{
		Port:   getenv("APP_PORT", "8080"),
		DBUser: getenv("DB_USER", "root"),
		DBPass: getenv("DB_PASS", ""),
		DBHost: getenv("DB_HOST", "127.0.0.1"),
		DBPort: getenv("DB_PORT", "3306"),
		DBName: getenv("DB_NAME", ""),

		JWTSecret:    os.Getenv("JWT_SECRET"),
		JWTTTL:       time.Duration(getenvInt("JWT_TTL_HOURS", 8)) * time.Hour,
		CookieSecure: os.Getenv("COOKIE_SECURE") == "true",
	}
}

// DSN membentuk connection string MySQL.
// clientFoundRows=true: RowsAffected() menghitung baris yang COCOK (bukan hanya yang berubah),
// jadi UPDATE dengan nilai sama tidak salah terbaca "data tidak ditemukan".
func (c Config) DSN() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?parseTime=true&clientFoundRows=true&charset=utf8mb4",
		c.DBUser, c.DBPass, c.DBHost, c.DBPort, c.DBName,
	)
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getenvInt(key string, fallback int) int {
	v, err := strconv.Atoi(os.Getenv(key))
	if err != nil || v <= 0 {
		return fallback
	}
	return v
}
