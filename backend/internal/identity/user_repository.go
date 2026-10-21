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

// login
const selectUserByUsername = `
SELECT u.iduser, u.username, u.password, r.nama_role
FROM user u
JOIN role r ON r.idrole = u.idrole
WHERE u.username = ?`

// read
const selectUserList = `
SELECT iduser, username, idrole, nama_role
FROM v_user_detail`

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

func (r *UserRepository) GetByID(ctx context.Context, id int) (*UserView, error) {
	var user UserView
	err := r.db.GetContext(ctx, &user, selectUserList+" WHERE iduser = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) ExistsByUsername(ctx context.Context, username string, excludeID int) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM user WHERE LOWER(username) = LOWER(?))`
	args := []any{username}
	if excludeID > 0 {
		query = `SELECT EXISTS(SELECT 1 FROM user WHERE LOWER(username) = LOWER(?) AND iduser <> ?)`
		args = append(args, excludeID)
	}
	if err := r.db.GetContext(ctx, &exists, query, args...); err != nil {
		return false, err
	}
	return exists, nil
}

func (r *UserRepository) GetRoleName(ctx context.Context, idRole int) (string, error) {
	var name string
	err := r.db.GetContext(ctx, &name, `SELECT nama_role FROM role WHERE idrole = ?`, idRole)
	if errors.Is(err, sql.ErrNoRows) {
		return "", apperr.ErrNotFound
	}
	return name, err
}

func (r *UserRepository) CountByRole(ctx context.Context, roleName string) (int, error) {
	var count int
	err := r.db.GetContext(ctx, &count, `
		SELECT COUNT(*)
		FROM user u
		JOIN role r ON r.idrole = u.idrole
		WHERE LOWER(r.nama_role) = LOWER(?)`, roleName)
	return count, err
}

func (r *UserRepository) Create(ctx context.Context, u User) (int, error) {
	res, err := r.db.NamedExecContext(ctx, `
	INSERT INTO user (username, idrole, password)
	VALUES (:username, :idrole, :password)`, u)
	if err != nil {
		return 0, mapUserWriteError(err)
	}
	id, err := res.LastInsertId()
	return int(id), err
}

func (r *UserRepository) Update(ctx context.Context, u User, updatePassword bool) error {
	query := `
	UPDATE user
	SET username = :username, idrole = :idrole
	WHERE iduser = :iduser`
	if updatePassword {
		query = `
		UPDATE user
		SET username = :username, idrole = :idrole, password = :password
		WHERE iduser = :iduser`
	}
	res, err := r.db.NamedExecContext(ctx, query, u)
	if err != nil {
		return mapUserWriteError(err)
	}
	return database.RequireAffected(res)
}

func (r *UserRepository) Delete(ctx context.Context, id int) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM user WHERE iduser = ?`, id)
	if err != nil {
		if database.IsFKRestrict(err) {
			return apperr.Wrap(apperr.ErrConflict,
				"User masih digunakan oleh data lain dan tidak bisa dihapus.")
		}
		return err
	}
	return database.RequireAffected(res)
}

func mapUserWriteError(err error) error {
	if database.IsDuplicate(err) {
		return apperr.Wrap(apperr.ErrConflict, "Username sudah digunakan.")
	}
	if database.IsFKMissing(err) {
		return apperr.Wrap(apperr.ErrInvalid, "Role yang dipilih tidak ditemukan.")
	}
	return err
}
