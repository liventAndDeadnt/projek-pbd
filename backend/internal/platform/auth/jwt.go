// Package auth: pembuatan & verifikasi JWT, nama cookie sesi, dan konstanta role.
package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	CookieName = "access_token"
	issuer     = "projek-pbd"
)

// Nama role harus sama (huruf kecil) dengan isi kolom role.nama_role di database.
const (
	RoleAdmin      = "admin"
	RolePurchasing = "purchasing"
	RoleGudang     = "gudang"
	RoleKasir      = "kasir"
)

type Claims struct {
	UserID   int    `json:"uid"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

type Manager struct {
	secret []byte
	ttl    time.Duration
}

func NewManager(secret string, ttl time.Duration) *Manager {
	return &Manager{secret: []byte(secret), ttl: ttl}
}

func (m *Manager) TTL() time.Duration { return m.ttl }

func (m *Manager) Issue(userID int, username, role string) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    issuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(m.ttl)),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
}

func (m *Manager) Parse(raw string) (*Claims, error) {
	var claims Claims
	tok, err := jwt.ParseWithClaims(raw, &claims,
		func(*jwt.Token) (any, error) { return m.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(issuer),
	)
	if err != nil {
		return nil, err
	}
	if !tok.Valid {
		return nil, errors.New("token tidak valid")
	}
	return &claims, nil
}
