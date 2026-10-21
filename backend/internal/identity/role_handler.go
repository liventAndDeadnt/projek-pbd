package identity

import (
	"net/http"
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

func (h *RoleHandler) Get(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	data, err := h.svc.Get(c.Request.Context(), id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *RoleHandler) Create(c *gin.Context) {
	var in RoleInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	data, err := h.svc.Create(c.Request.Context(), in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, data)
}

func (h *RoleHandler) Update(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	var in RoleInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	data, err := h.svc.Update(c.Request.Context(), id, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *RoleHandler) Delete(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, nil)
}
