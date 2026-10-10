package middleware

import (
	"slices"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/auth"
	"projek-pbd/internal/platform/httpx"
)

const claimsKey = "auth.claims"

// Auth membaca JWT dari cookie httpOnly, memverifikasinya, lalu menyimpan claims di context.
func Auth(m *auth.Manager) gin.HandlerFunc {
	return func(c *gin.Context) {
		raw, err := c.Cookie(auth.CookieName)
		if err != nil || raw == "" {
			abort(c, apperr.ErrUnauthorized)
			return
		}
		claims, err := m.Parse(raw)
		if err != nil {
			abort(c, apperr.ErrUnauthorized)
			return
		}
		c.Set(claimsKey, claims)
		c.Next()
	}
}

// RequireRole membatasi route ke role tertentu. Pasang SETELAH Auth.
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, ok := Claims(c)
		if !ok {
			abort(c, apperr.ErrUnauthorized)
			return
		}
		if !slices.Contains(roles, claims.Role) {
			abort(c, apperr.ErrForbidden)
			return
		}
		c.Next()
	}
}

// Claims mengambil data user yang sedang login dari context.
func Claims(c *gin.Context) (*auth.Claims, bool) {
	v, ok := c.Get(claimsKey)
	if !ok {
		return nil, false
	}
	claims, ok := v.(*auth.Claims)
	return claims, ok
}

func abort(c *gin.Context, err error) {
	httpx.Error(c, err)
	c.Abort()
}
