package identity

import (
	"context"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"strings"

	"projek_pbd_go/internal/platform/apperr"
)

// Satu pesan untuk username salah maupun password salah, supaya tidak membocorkan username mana yang ada.
var errInvalidCredentials = apperr.Wrap(apperr.ErrUnauthorized, "Username atau password salah.")

type AuthService struct {
	users *UserRepository
}

func NewAuthService(users *UserRepository) *AuthService {
	return &AuthService{users: users}
}

func (s *AuthService) Login(ctx context.Context, in LoginInput) (*AuthUser, error) {
	rec, err := s.users.FindByUsername(ctx, strings.TrimSpace(in.Username))
	if errors.Is(err, apperr.ErrNotFound) {
		return nil, errInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	if !verifyPassword(in.Password, rec.Password) {
		return nil, errInvalidCredentials
	}
	return &AuthUser{
		IDUser:   rec.IDUser,
		Username: rec.Username,
		Role:     strings.ToLower(strings.TrimSpace(rec.NamaRole)),
	}, nil
}

// hashPassword = SHA-256 heksadesimal, identik dengan SHA2(x, 256) di MySQL (sesuai data seed).
// TODO: SHA-256 tanpa salt itu lemah; ganti ke bcrypt/argon2 kalau sudah boleh mengubah seed.
func hashPassword(plain string) string {
	sum := sha256.Sum256([]byte(plain))
	return hex.EncodeToString(sum[:])
}

func verifyPassword(plain, stored string) bool {
	got := hashPassword(plain)
	return subtle.ConstantTimeCompare([]byte(got), []byte(strings.ToLower(stored))) == 1
}
