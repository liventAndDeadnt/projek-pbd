package procurement

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/httpx"
	"projek-pbd/internal/platform/middleware"
)

type PengadaanHandler struct {
	svc *PengadaanService
}

func NewPengadaanHandler(svc *PengadaanService) *PengadaanHandler {
	return &PengadaanHandler{svc: svc}
}

func (h *PengadaanHandler) List(c *gin.Context) {
	status := strings.ToUpper(strings.TrimSpace(c.Query("status")))
	if status != "" && !validPengadaanStatus(status) {
		httpx.Fail(c, http.StatusBadRequest, "Status pengadaan tidak valid.")
		return
	}

	data, err := h.svc.List(c.Request.Context(), PengadaanFilter{
		Search: strings.TrimSpace(c.Query("search")),
		Status: status,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *PengadaanHandler) Get(c *gin.Context) {
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Error(c, apperr.ErrUnauthorized)
		return
	}
	id, ok := httpx.ParamInt64(c, "id")
	if !ok {
		return
	}

	data, err := h.svc.Get(c.Request.Context(), claims.UserID, claims.Role, id)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *PengadaanHandler) Create(c *gin.Context) {
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Error(c, apperr.ErrUnauthorized)
		return
	}

	var in CreateInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Data pengadaan tidak valid.")
		return
	}

	data, err := h.svc.Create(c.Request.Context(), claims.UserID, claims.Role, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, data)
}

func (h *PengadaanHandler) ChangeStatus(c *gin.Context) {
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Error(c, apperr.ErrUnauthorized)
		return
	}
	id, ok := httpx.ParamInt64(c, "id")
	if !ok {
		return
	}

	var in StatusInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Status pengadaan tidak valid.")
		return
	}

	data, err := h.svc.ChangeStatus(c.Request.Context(), claims.UserID, claims.Role, id, in.Status)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func validPengadaanStatus(status string) bool {
	switch status {
	case "P", "A", "R", "X", "S", "C":
		return true
	default:
		return false
	}
}
