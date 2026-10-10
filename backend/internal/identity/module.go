package identity

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"projek_pbd_go/internal/platform/auth"
)

// Register mendaftarkan route auth. public = tanpa login, protected = wajib login.
func Register(public, protected *gin.RouterGroup, db *sqlx.DB, jwt *auth.Manager, cookieSecure bool) {
	svc := NewAuthService(NewUserRepository(db))
	h := NewAuthHandler(svc, jwt, cookieSecure)

	public.POST("/auth/login", h.Login)
	public.POST("/auth/logout", h.Logout)
	protected.GET("/auth/me", h.Me)

	// TODO: CRUD user (admin only)
}
