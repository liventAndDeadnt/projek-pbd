package identity

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/apperr"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*userRecord, error) {
	var u userRecord
	err := r.db.GetContext(ctx, &u, `
SELECT u.iduser, u.username, u.password, r.nama_role
FROM user u
JOIN role r ON r.idrole = u.idrole
WHERE u.username = ?`, username)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}
