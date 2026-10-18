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

const selectBarangView = `
SELECT * FROM v_barang_detail`

// BarangRepository: satu-satunya tempat SQL untuk tabel barang.
type BarangRepository struct {
	db *sqlx.DB
}

func NewBarangRepository(db *sqlx.DB) *BarangRepository {
	return &BarangRepository{db: db}
}

// List menyusun WHERE hanya dari filter yang diisi. Pola "(? = ” OR kolom = ?)" sengaja dihindari
// karena membuat optimizer MySQL sulit memakai index.
// Catatan: LIKE '%kata%' (contains) tidak bisa memakai index nama; LIKE 'kata%' (prefix) bisa.
func (r *BarangRepository) List(ctx context.Context, f BarangFilter) ([]BarangView, error) {
	query := selectBarangView
	var conds []string
	var args []any

	if f.Search != "" {
		conds = append(conds, "nama LIKE ?")
		args = append(args, "%"+f.Search+"%")
	}
	if f.Status != nil {
		conds = append(conds, "status = ?")
		args = append(args, *f.Status)
	}
	if len(conds) > 0 {
		query += " WHERE " + strings.Join(conds, " AND ")
	}
	query += " ORDER BY idbarang"

	out := []BarangView{} // bukan nil, supaya JSON jadi [] bukan null
	if err := r.db.SelectContext(ctx, &out, query, args...); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *BarangRepository) GetByID(ctx context.Context, id int) (*BarangView, error) {
	var b BarangView
	err := r.db.GetContext(ctx, &b, selectBarangView+" WHERE idbarang = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *BarangRepository) Create(ctx context.Context, b Barang) (int, error) {
	res, err := r.db.NamedExecContext(ctx, `
INSERT INTO barang (jenis, nama, idsatuan, status, harga)
VALUES (:jenis, :nama, :idsatuan, :status, :harga)`, b)
	if err != nil {
		return 0, mapBarangWriteError(err)
	}
	id, err := res.LastInsertId()
	return int(id), err
}

func (r *BarangRepository) Update(ctx context.Context, b Barang) error {
	res, err := r.db.NamedExecContext(ctx, `
UPDATE barang
SET jenis = :jenis, nama = :nama, idsatuan = :idsatuan, status = :status, harga = :harga
WHERE idbarang = :idbarang`, b)
	if err != nil {
		return mapBarangWriteError(err)
	}
	return database.RequireAffected(res)
}

func (r *BarangRepository) Delete(ctx context.Context, id int) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM barang WHERE idbarang = ?`, id)
	if err != nil {
		if database.IsFKRestrict(err) {
			return apperr.Wrap(apperr.ErrConflict,
				"Barang sudah dipakai transaksi dan tidak bisa dihapus. Nonaktifkan lewat status.")
		}
		return err
	}
	return database.RequireAffected(res)
}

func mapBarangWriteError(err error) error {
	if database.IsFKMissing(err) {
		return apperr.Wrap(apperr.ErrInvalid, "Satuan yang dipilih tidak ditemukan.")
	}
	return err
}