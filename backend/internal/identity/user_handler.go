package identity

import (
	"strings"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/httpx"
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
