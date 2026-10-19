package catalog

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/apperr"
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
