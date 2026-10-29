package procurement

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/auth"
	"projek-pbd/internal/platform/middleware"
)

// Register merakit modul pengadaan dan penerimaan.
// Pembacaan: admin, purchasing, gudang. Penulisan pengadaan: admin dan
// purchasing; penerimaan: admin dan gudang. Aturan status diperiksa lagi
// di service dan stored procedure.
func Register(rg *gin.RouterGroup, db *sqlx.DB) {
	h := NewPengadaanHandler(NewPengadaanService(NewPengadaanRepository(db)))
	penerimaan := NewPenerimaanHandler(NewPenerimaanService(NewPenerimaanRepository(db)))

	viewers := middleware.RequireRole(auth.RoleAdmin, auth.RolePurchasing, auth.RoleGudang)
	writers := middleware.RequireRole(auth.RoleAdmin, auth.RolePurchasing)
	receivers := middleware.RequireRole(auth.RoleAdmin, auth.RoleGudang)

	g := rg.Group("/pengadaan")
	g.GET("", viewers, h.List)
	g.GET("/:id", viewers, h.Get)
	g.POST("", writers, h.Create)
	g.PATCH("/:id/status", writers, h.ChangeStatus)

	p := rg.Group("/penerimaan")
	p.GET("", viewers, penerimaan.List)
	p.GET("/:id", viewers, penerimaan.Get)
	p.POST("", receivers, penerimaan.Create)
}
