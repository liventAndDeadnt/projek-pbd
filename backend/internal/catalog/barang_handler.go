package catalog

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/httpx"
)

type BarangHandler struct {
	svc *BarangService
}

func NewBarangHandler(svc *BarangService) *BarangHandler {
	return &BarangHandler{svc: svc}
}

// List mendukung ?search=kata dan ?status=0|1
func (h *BarangHandler) List(c *gin.Context) {
	f := BarangFilter{Search: strings.TrimSpace(c.Query("search"))}
	if raw := c.Query("status"); raw != "" {
		v, err := strconv.Atoi(raw)
		if err != nil || (v != 0 && v != 1) {
			httpx.Fail(c, http.StatusBadRequest, "Status harus 0 atau 1.")
			return
		}
		f.Status = &v
	}
	data, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *BarangHandler) Get(c *gin.Context) {
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

func (h *BarangHandler) Create(c *gin.Context) {
	var in BarangInput
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

func (h *BarangHandler) Update(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	var in BarangInput
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

func (h *BarangHandler) Delete(c *gin.Context) {
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
