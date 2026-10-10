package catalog

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/httpx"
)

// VendorHandler menangani HTTP request untuk data vendor.
type VendorHandler struct {
	svc *VendorService
}

func NewVendorHandler(svc *VendorService) *VendorHandler {
	return &VendorHandler{svc: svc}
}

func (h *VendorHandler) List(c *gin.Context) {
	f := VendorFilter{Search: strings.TrimSpace(c.Query("search"))}
	if raw := c.Query("status"); raw != "" {
		if raw != "0" && raw != "1" {
			httpx.Fail(c, http.StatusBadRequest, "Status harus 0 atau 1.")
			return
		}
		f.Status = &raw
	}

	data, err := h.svc.List(c.Request.Context(), f)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *VendorHandler) Get(c *gin.Context) {
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
