package identity

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/auth"
	"projek-pbd/internal/platform/httpx"
	"projek-pbd/internal/platform/middleware"
)

type AuthHandler struct {
	svc    *AuthService
	jwt    *auth.Manager
	secure bool // flag Secure pada cookie; true kalau HTTPS
}

func NewAuthHandler(svc *AuthService, jwt *auth.Manager, secure bool) *AuthHandler {
	return &AuthHandler{svc: svc, jwt: jwt, secure: secure}
}

// Login memverifikasi kredensial lalu menaruh JWT di cookie httpOnly (tidak terbaca JavaScript).
// TODO: batasi percobaan login (rate limit) sebelum dipublikasikan.
func (h *AuthHandler) Login(c *gin.Context) {
	var in LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Username dan password wajib diisi.")
		return
	}
	user, err := h.svc.Login(c.Request.Context(), in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	token, err := h.jwt.Issue(user.IDUser, user.Username, user.Role)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	h.setSessionCookie(c, token, int(h.jwt.TTL().Seconds()))
	httpx.OK(c, user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	h.setSessionCookie(c, "", -1)
	httpx.OK(c, nil)
}

// Me mengembalikan user dari token (tanpa query DB). Dipakai frontend untuk memulihkan sesi saat halaman dimuat.
func (h *AuthHandler) Me(c *gin.Context) {
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Fail(c, http.StatusUnauthorized, "Belum masuk atau sesi sudah berakhir.")
		return
	}
	httpx.OK(c, AuthUser{IDUser: claims.UserID, Username: claims.Username, Role: claims.Role})
}

func (h *AuthHandler) setSessionCookie(c *gin.Context, value string, maxAge int) {
	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(auth.CookieName, value, maxAge, "/", "", h.secure, true)
}
