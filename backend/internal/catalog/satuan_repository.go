package catalog

import (
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/database"
)

const selectSatuan = `
SELECT * FROM v_satuan_detail`

// SatuanRepository: satu-satunya tempat SQL untuk tabel satuan.
type SatuanRepository struct {
	db *sqlx.DB
}

func NewSatuanRepository(db *sqlx.DB) *SatuanRepository {
	return &SatuanRepository{db: db}
}

func (r *SatuanRepository) List(ctx context.Context, f SatuanFilter) ([]Satuan, error) {
	query := selectSatuan
	var conditions []string
	var args []any
	if f.Search != "" {
		conditions = append(conditions, "nama_satuan LIKE ?")
		args = append(args, "%"+f.Search+"%")
	}
	if f.Status != nil {
		conditions = append(conditions, "status = ?")
		args = append(args, *f.Status)
	}
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}
	query += " ORDER BY idsatuan"

	out := []Satuan{}
	err := r.db.SelectContext(ctx, &out, query, args...)
	return out, err
}

func (r *SatuanRepository) GetByID(ctx context.Context, id int) (*Satuan, error) {
	var s Satuan
	err := r.db.GetContext(ctx, &s, selectSatuan+" WHERE idsatuan = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *SatuanRepository) Create(ctx context.Context, namaSatuan string, status int) (int, error) {
	res, err := r.db.ExecContext(ctx,
		`INSERT INTO satuan (nama_satuan, status) VALUES (?, ?)`, namaSatuan, status)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	return int(id), err
}

func (r *SatuanRepository) Update(ctx context.Context, id int, namaSatuan string, status int) error {
	res, err := r.db.ExecContext(ctx,
		`UPDATE satuan SET nama_satuan = ?, status = ? WHERE idsatuan = ?`, namaSatuan, status, id)
	if err != nil {
		return err
	}
	return database.RequireAffected(res)
}

func (r *SatuanRepository) Delete(ctx context.Context, id int) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM satuan WHERE idsatuan = ?`, id)
	if err != nil {
		if database.IsFKRestrict(err) {
			return apperr.ErrConflict // masih dipakai tabel barang
		}
		return err
	}
	return database.RequireAffected(res)
}
