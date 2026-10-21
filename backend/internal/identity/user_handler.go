package identity

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/httpx"
	"projek-pbd/internal/platform/middleware"
)

type UserHandler struct {
	svc *UserService
}

func NewUserHandler(svc *UserService) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) List(c *gin.Context) {
	filter := UserFilter{
		Search: strings.TrimSpace(c.Query("search")),
		Role:   strings.TrimSpace(c.Query("role")),
	}

	users, err := h.svc.List(c.Request.Context(), filter)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, users)
}

func (h *UserHandler) Get(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	user, err := h.svc.Get(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, user)
}

func (h *UserHandler) Create(c *gin.Context) {
	var in UserCreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	user, err := h.svc.Create(c.Request.Context(), in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, user)
}

func (h *UserHandler) Update(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	var in UserUpdateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Error(c, apperr.ErrUnauthorized)
		return
	}
	if claims.UserID == id {
		current, err := h.svc.Get(c.Request.Context(), id)
		if err != nil {
			httpx.Error(c, err)
			return
		}
		if current.IDRole != in.IDRole {
			httpx.Error(c, apperr.Wrap(apperr.ErrConflict, "Role akun yang sedang digunakan tidak bisa diubah dari sesi ini."))
			return
		}
	}
	user, err := h.svc.Update(c.Request.Context(), id, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, user)
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Error(c, apperr.ErrUnauthorized)
		return
	}
	if claims.UserID == id {
		httpx.Error(c, apperr.Wrap(apperr.ErrConflict, "Akun yang sedang digunakan tidak bisa dihapus."))
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, nil)
}
