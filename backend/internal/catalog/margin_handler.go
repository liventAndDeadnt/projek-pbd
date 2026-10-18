package catalog

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/httpx"
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
