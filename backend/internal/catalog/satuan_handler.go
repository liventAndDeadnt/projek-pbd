package catalog

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/httpx"
)

// SatuanHandler: lapisan HTTP saja (bind, validasi, response). Tidak ada SQL di sini.
type SatuanHandler struct {
	svc *SatuanService
}

func NewSatuanHandler(svc *SatuanService) *SatuanHandler {
	return &SatuanHandler{svc: svc}
}

func (h *SatuanHandler) List(c *gin.Context) {
	data, err := h.svc.List(c.Request.Context())
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *SatuanHandler) Get(c *gin.Context) {
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

func (h *SatuanHandler) Create(c *gin.Context) {
	var in SatuanInput
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

func (h *SatuanHandler) Update(c *gin.Context) {
	id, ok := httpx.ParamInt(c, "id")
	if !ok {
		return
	}
	var in SatuanInput
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

func (h *SatuanHandler) Delete(c *gin.Context) {
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
