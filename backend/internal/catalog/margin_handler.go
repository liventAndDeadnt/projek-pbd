package catalog

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/httpx"
	"projek-pbd/internal/platform/middleware"
)

type MarginHandler struct {
	svc *MarginService
}

func NewMarginHandler(svc *MarginService) *MarginHandler {
	return &MarginHandler{svc: svc}
}

func (h *MarginHandler) List(c *gin.Context) {
	f := MarginFilter{}
	if raw := c.Query("status"); raw != "" {
		status, err := strconv.Atoi(raw)
		if err != nil || (status != 0 && status != 1) {
			httpx.Fail(c, http.StatusBadRequest, "Status harus 0 atau 1.")
			return
		}
		f.Status = &status
	}

	data, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *MarginHandler) Get(c *gin.Context) {
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

func (h *MarginHandler) Create(c *gin.Context) {
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Error(c, apperr.ErrUnauthorized)
		return
	}

	var in MarginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, err.Error())
		return
	}
	data, err := h.svc.Create(c.Request.Context(), claims.UserID, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, data)
}

func (h *MarginHandler) Update(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	var in MarginInput
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

func (h *MarginHandler) Delete(c *gin.Context) {
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
