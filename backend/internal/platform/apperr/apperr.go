// Package apperr berisi error domain yang dipetakan ke HTTP status di lapisan handler.
// Pesan di sini tampil ke pengguna, jadi ditulis dalam kalimat biasa.
package apperr

import "errors"

var (
	ErrNotFound     = errors.New("Data tidak ditemukan.")
	ErrConflict     = errors.New("Data bentrok atau masih dipakai data lain.")
	ErrInvalid      = errors.New("Data tidak valid.")
	ErrUnauthorized = errors.New("Belum masuk atau sesi sudah berakhir.")
	ErrForbidden    = errors.New("Akun ini tidak punya akses ke fitur tersebut.")
)

// Error membungkus salah satu sentinel di atas dengan pesan khusus untuk client.
// errors.Is(err, ErrConflict) tetap true, tetapi err.Error() berisi pesan kustom.
type Error struct {
	Kind error
	Msg  string
}

func (e *Error) Error() string { return e.Msg }
func (e *Error) Unwrap() error { return e.Kind }

func Wrap(kind error, msg string) error { return &Error{Kind: kind, Msg: msg} }
