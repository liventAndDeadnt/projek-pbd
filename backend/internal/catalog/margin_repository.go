package catalog

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/database"
)

const selectMargin = `
SELECT idmargin_penjualan, persen, status, created_at, username
FROM v_margin_detail`

type MarginRepository struct {
	db *sqlx.DB
}

func NewMarginRepository(db *sqlx.DB) *MarginRepository {
	return &MarginRepository{db: db}
}

func (r *MarginRepository) List(ctx context.Context, f MarginFilter) ([]MarginView, error) {
	query := selectMargin
	var args []any
	if f.Status != nil {
		query += " WHERE status = ?"
		args = append(args, *f.Status)
	}
	query += " ORDER BY idmargin_penjualan"

	out := []MarginView{}
	if err := r.db.SelectContext(ctx, &out, query, args...); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *MarginRepository) GetByID(ctx context.Context, id int) (*MarginView, error) {
	var margin MarginView
	err := r.db.GetContext(ctx, &margin, selectMargin+" WHERE idmargin_penjualan = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &margin, nil
}

func (r *MarginRepository) Create(ctx context.Context, m Margin) (int, error) {
	res, err := r.db.NamedExecContext(ctx, `
	INSERT INTO margin_penjualan (persen, status, iduser, created_at)
	VALUES (:persen, :status, :iduser, CURRENT_TIMESTAMP)`, m)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	return int(id), err
}

func (r *MarginRepository) Update(ctx context.Context, m Margin) error {
	res, err := r.db.NamedExecContext(ctx, `
	UPDATE margin_penjualan
	SET persen = :persen, status = :status, updated_at = CURRENT_TIMESTAMP
	WHERE idmargin_penjualan = :idmargin_penjualan`, m)
	if err != nil {
		return err
	}
	return database.RequireAffected(res)
}

func (r *MarginRepository) Delete(ctx context.Context, id int) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM margin_penjualan WHERE idmargin_penjualan = ?`, id)
	if err != nil {
		if database.IsFKRestrict(err) {
			return apperr.Wrap(apperr.ErrConflict,
				"Margin ini digunakan dalam penjualan dan tidak bisa dihapus.")
		}
		return err
	}
	return database.RequireAffected(res)
}
