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

	adminOnly := middleware.RequireRole(auth.RoleAdmin)
	users := NewUserHandler(NewUserService(NewUserRepository(db)))
	u := protected.Group("/users")
	u.GET("", adminOnly, users.List)
	u.GET("/:id", adminOnly, users.Get)
	u.POST("", adminOnly, users.Create)
	u.PUT("/:id", adminOnly, users.Update)
	u.DELETE("/:id", adminOnly, users.Delete)

	roles := NewRoleHandler(NewRoleService(NewRoleRepository(db)))
	p := protected.Group("/roles")
	p.GET("", adminOnly, roles.List)
	p.GET("/:id", adminOnly, roles.Get)
	p.POST("", adminOnly, roles.Create)
	p.PUT("/:id", adminOnly, roles.Update)
	p.DELETE("/:id", adminOnly, roles.Delete)
}
