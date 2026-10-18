package identity

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/apperr"
)

// login
const selectUserByUsername = `
SELECT u.iduser, u.username, u.password, r.nama_role
FROM user u
JOIN role r ON r.idrole = u.idrole
WHERE u.username = ?`

// read
const selectUserList = `
SELECT * FROM v_user_detail`

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) FindByUsername(ctx context.Context, username string) (*userRecord, error) {
	var u userRecord
	err := r.db.GetContext(ctx, &u, selectUserByUsername, username)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) List(ctx context.Context, f UserFilter) ([]UserView, error) {
	query := selectUserList
	var conditions []string
	var args []any

	if f.Search != "" {
		conditions = append(conditions, "username LIKE ?")
		args = append(args, "%"+f.Search+"%")
	}
	if f.Role != "" {
		conditions = append(conditions, "LOWER(nama_role) = ?")
		args = append(args, strings.ToLower(f.Role))
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY iduser"

	users := []UserView{}
	if err := r.db.SelectContext(ctx, &users, query, args...); err != nil {
		return nil, err
	}
	return users, nil
}
