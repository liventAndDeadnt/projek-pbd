// Package httpx: helper response HTTP supaya format JSON seragam di semua modul.
package httpx

import (
	"errors"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"projek-pbd/internal/platform/apperr"
)

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, gin.H{"success": true, "data": data})
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": data})
}

func Fail(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{"success": false, "message": message})
}

// Error memetakan error dari service/repository ke HTTP status.
// Error tak dikenal dicatat ke log, detailnya TIDAK dikirim ke client.
func Error(c *gin.Context, err error) {
	switch {
	case errors.Is(err, apperr.ErrNotFound):
		Fail(c, http.StatusNotFound, err.Error())
	case errors.Is(err, apperr.ErrConflict):
		Fail(c, http.StatusConflict, err.Error())
	case errors.Is(err, apperr.ErrInvalid):
		Fail(c, http.StatusBadRequest, err.Error())
	case errors.Is(err, apperr.ErrUnauthorized):
		Fail(c, http.StatusUnauthorized, err.Error())
	case errors.Is(err, apperr.ErrForbidden):
		Fail(c, http.StatusForbidden, err.Error())
	default:
		slog.Error("request gagal", "path", c.FullPath(), "error", err)
		Fail(c, http.StatusInternalServerError, "Terjadi kesalahan pada server.")
	}
}

// ParamInt membaca path param integer positif. Jika tidak valid, langsung
// menulis response 400 dan mengembalikan ok=false (handler tinggal return).
func ParamInt(c *gin.Context, name string) (int, bool) {
	v, err := strconv.Atoi(c.Param(name))
	if err != nil || v <= 0 {
		Fail(c, http.StatusBadRequest, "Parameter "+name+" tidak valid.")
		return 0, false
	}
	return v, true
}

// ParamInt64 dipakai untuk primary key BIGINT seperti idpengadaan.
func ParamInt64(c *gin.Context, name string) (int64, bool) {
	v, err := strconv.ParseInt(c.Param(name), 10, 64)
	if err != nil || v <= 0 {
		Fail(c, http.StatusBadRequest, "Parameter "+name+" tidak valid.")
		return 0, false
	}
	return v, true
}
