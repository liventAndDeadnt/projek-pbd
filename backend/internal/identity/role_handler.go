package identity

import (
	"strings"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/httpx"
)

type RoleHandler struct {
	svc *RoleService
}

func NewRoleHandler(svc *RoleService) *RoleHandler {
	return &RoleHandler{svc: svc}
}

func (h *RoleHandler) List(c *gin.Context) {
	filter := RoleFilter{
		Search: strings.TrimSpace(c.Query("search")),
	}

	roles, err := h.svc.List(c.Request.Context(), filter)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, roles)
}
