package identity

import (
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/auth"
	"projek-pbd/internal/platform/middleware"
)

// Register mendaftarkan route auth. public = tanpa login, protected = wajib login.
func Register(public, protected *gin.RouterGroup, db *sqlx.DB, jwt *auth.Manager, cookieSecure bool) {
	svc := NewAuthService(NewUserRepository(db))
	h := NewAuthHandler(svc, jwt, cookieSecure)

	public.POST("/auth/login", h.Login)
	public.POST("/auth/logout", h.Logout)
	protected.GET("/auth/me", h.Me)

	users := NewUserHandler(NewUserService(NewUserRepository(db)))
	protected.GET("/users", middleware.RequireRole(auth.RoleAdmin), users.List)

	roles := NewRoleHandler(NewRoleService(NewRoleRepository(db)))
	protected.GET("/roles", middleware.RequireRole(auth.RoleAdmin), roles.List)
}
