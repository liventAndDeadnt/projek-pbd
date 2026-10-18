// Package catalog: modul master data barang & satuan.
//
// Pola tiap entity: model -> repository (SQL) -> service (aturan bisnis) -> handler (HTTP).
// Modul lain hanya boleh memakai service milik modul ini, bukan repository-nya.
package catalog

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/auth"
	"projek-pbd/internal/platform/middleware"
)

// Register merakit dependensi modul dan mendaftarkan route.
// rg harus group yang sudah dipasangi middleware.Auth (semua route di sini wajib login).
// Baca: semua role. Tulis: admin saja.
func Register(rg *gin.RouterGroup, db *sqlx.DB) {
	adminOnly := middleware.RequireRole(auth.RoleAdmin)

	satuan := NewSatuanHandler(NewSatuanService(NewSatuanRepository(db)))
	s := rg.Group("/satuan")
	s.GET("", satuan.List)
	s.GET("/:id", satuan.Get)
	s.POST("", adminOnly, satuan.Create)
	s.PUT("/:id", adminOnly, satuan.Update)
	s.DELETE("/:id", adminOnly, satuan.Delete)

	barang := NewBarangHandler(NewBarangService(NewBarangRepository(db)))
	b := rg.Group("/barang")
	b.GET("", barang.List)
	b.GET("/:id", barang.Get)
	b.POST("", adminOnly, barang.Create)
	b.PUT("/:id", adminOnly, barang.Update)
	b.DELETE("/:id", adminOnly, barang.Delete)

	vendor := NewVendorHandler(NewVendorService(NewVendorRepository(db)))
	v := rg.Group("/vendor")
	v.GET("", vendor.List)
	v.GET("/:id", vendor.Get)

	margin := NewMarginHandler(NewMarginService(NewMarginRepository(db)))
	m := rg.Group("/margin")
	m.GET("", margin.List)
	m.GET("/:id", margin.Get)
}
