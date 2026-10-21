package identity

import (
	"context"
	"database/sql"
	"errors"
	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/database"
	"strings"

	"github.com/jmoiron/sqlx"
)

const selectRole = `
SELECT idrole, nama_role
FROM v_role_detail`

type RoleRepository struct {
	db *sqlx.DB
}

func NewRoleRepository(db *sqlx.DB) *RoleRepository {
	return &RoleRepository{db: db}
}

func (r *RoleRepository) List(ctx context.Context, f RoleFilter) ([]Role, error) {
	query := selectRole
	var conds []string
	var args []any

	if f.Search != "" {
		conds = append(conds, "nama_role LIKE ?")
		args = append(args, "%"+f.Search+"%")
	}

	if len(conds) > 0 {
		query += " WHERE " + strings.Join(conds, " AND ")
	}
	query += " ORDER BY idrole"

	out := []Role{}
	if err := r.db.SelectContext(ctx, &out, query, args...); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *RoleRepository) GetByID(ctx context.Context, id int) (*Role, error) {
	var role Role
	err := r.db.GetContext(ctx, &role, selectRole+" WHERE idrole = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *RoleRepository) ExistsByName(ctx context.Context, name string, excludeID int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM role WHERE LOWER(nama_role) = LOWER(?))`
	args := []any{name}
	if excludeID > 0 {
		query = `SELECT EXISTS(SELECT 1 FROM role WHERE LOWER(nama_role) = LOWER(?) AND idrole <> ?)`
		args = append(args, excludeID)
	}
	if err := r.db.GetContext(ctx, &exists, query, args...); err != nil {
		return false, err
	}
	return exists, nil
}

func (r *RoleRepository) Create(ctx context.Context, p Role) (int, error) {
	res, err := r.db.NamedExecContext(ctx, `
	INSERT INTO role (nama_role)
	VALUES (:nama_role)`, p)
	if err != nil {
		return 0, mapRoleWriteError(err)
	}
	id, err := res.LastInsertId()
	return int(id), err
}

func (r *RoleRepository) Update(ctx context.Context, p Role) error {
	res, err := r.db.NamedExecContext(ctx, `
	UPDATE role
	SET nama_role = :nama_role
	WHERE idrole = :idrole`, p)
	if err != nil {
		return mapRoleWriteError(err)
	}
	return database.RequireAffected(res)
}

func (r *RoleRepository) Delete(ctx context.Context, id int) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM role WHERE idrole = ?`, id)
	if err != nil {
		if database.IsFKRestrict(err) {
			return apperr.Wrap(apperr.ErrConflict,
				"Role masih digunakan oleh satu atau lebih akun dan tidak bisa dihapus.")
		}
		return err
	}
	return database.RequireAffected(res)
}

func mapRoleWriteError(err error) error {
	if database.IsDuplicate(err) {
		return apperr.Wrap(apperr.ErrConflict, "Nama role sudah digunakan.")
	}
	return err
}
