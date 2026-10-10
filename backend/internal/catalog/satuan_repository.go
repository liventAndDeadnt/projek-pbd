package catalog

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"

	"projek_pbd_go/internal/platform/apperr"
	"projek_pbd_go/internal/platform/database"
)

// SatuanRepository: satu-satunya tempat SQL untuk tabel satuan.
type SatuanRepository struct {
	db *sqlx.DB
}

func NewSatuanRepository(db *sqlx.DB) *SatuanRepository {
	return &SatuanRepository{db: db}
}

func (r *SatuanRepository) List(ctx context.Context) ([]Satuan, error) {
	out := []Satuan{} // bukan nil, supaya JSON jadi [] bukan null
	err := r.db.SelectContext(ctx, &out,
		`SELECT idsatuan, nama_satuan, status FROM satuan ORDER BY idsatuan`)
	return out, err
}

func (r *SatuanRepository) GetByID(ctx context.Context, id int) (*Satuan, error) {
	var s Satuan
	err := r.db.GetContext(ctx, &s,
		`SELECT idsatuan, nama_satuan, status FROM satuan WHERE idsatuan = ?`, id)
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
