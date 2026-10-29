package procurement

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/httpx"
	"projek-pbd/internal/platform/middleware"
)

type PenerimaanHandler struct {
	svc *PenerimaanService
}

func NewPenerimaanHandler(svc *PenerimaanService) *PenerimaanHandler {
	return &PenerimaanHandler{svc: svc}
}

func (h *PenerimaanHandler) List(c *gin.Context) {
	status := strings.ToUpper(strings.TrimSpace(c.Query("status")))
	if status != "" && status != "S" && status != "C" {
		httpx.Fail(c, http.StatusBadRequest, "Status penerimaan tidak valid.")
		return
	}

	data, err := h.svc.List(c.Request.Context(), PenerimaanFilter{
		Search: strings.TrimSpace(c.Query("search")),
		Status: status,
	})
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.OK(c, data)
}

func (h *PenerimaanHandler) Get(c *gin.Context) {
	id, ok := httpx.ParamInt64(c, "id")
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

func (h *PenerimaanHandler) Create(c *gin.Context) {
	claims, ok := middleware.Claims(c)
	if !ok {
		httpx.Error(c, apperr.ErrUnauthorized)
		return
	}

	var in CreatePenerimaanInput
	if err := c.ShouldBindJSON(&in); err != nil {
		httpx.Fail(c, http.StatusBadRequest, "Data penerimaan tidak valid.")
		return
	}

	data, err := h.svc.Create(c.Request.Context(), claims.UserID, in)
	if err != nil {
		httpx.Error(c, err)
		return
	}
	httpx.Created(c, data)
}
