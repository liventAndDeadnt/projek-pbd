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

const selectVendor = `
SELECT idvendor, nama_vendor, badan_hukum, status
FROM v_vendor_detail`

// VendorRepository menjadi satu-satunya lapisan yang menjalankan SQL untuk vendor.
type VendorRepository struct {
	db *sqlx.DB
}

func NewVendorRepository(db *sqlx.DB) *VendorRepository {
	return &VendorRepository{db: db}
}

func (r *VendorRepository) List(ctx context.Context, f VendorFilter) ([]Vendor, error) {
	query := selectVendor
	var conds []string
	var args []any

	if f.Search != "" {
		conds = append(conds, "nama_vendor LIKE ?")
		args = append(args, "%"+f.Search+"%")
	}
	if f.Status != nil {
		conds = append(conds, "status = ?")
		args = append(args, *f.Status)
	}
	if len(conds) > 0 {
		query += " WHERE " + strings.Join(conds, " AND ")
	}
	query += " ORDER BY idvendor"

	out := []Vendor{}
	if err := r.db.SelectContext(ctx, &out, query, args...); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *VendorRepository) GetByID(ctx context.Context, id int) (*Vendor, error) {
	var vendor Vendor
	err := r.db.GetContext(ctx, &vendor, selectVendor+" WHERE idvendor = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &vendor, nil
}

func (r *VendorRepository) Create(ctx context.Context, v Vendor) (int, error) {
	res, err := r.db.NamedExecContext(ctx, `
	INSERT INTO vendor (nama_vendor, badan_hukum, status)
	VALUES (:nama_vendor, :badan_hukum, :status)`, v)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	return int(id), err
}

func (r *VendorRepository) Update(ctx context.Context, v Vendor) error {
	res, err := r.db.NamedExecContext(ctx, `
	UPDATE vendor
	SET nama_vendor = :nama_vendor, badan_hukum = :badan_hukum, status = :status
	WHERE idvendor = :idvendor`, v)
	if err != nil {
		return err
	}
	return database.RequireAffected(res)
}

func (r *VendorRepository) Delete(ctx context.Context, id int) error {
	res, err := r.db.ExecContext(ctx, `DELETE FROM vendor WHERE idvendor = ?`, id)
	if err != nil {
		if database.IsFKRestrict(err) {
			return apperr.Wrap(apperr.ErrConflict,
				"Vendor sudah digunakan dalam pengadaan dan tidak bisa dihapus. Nonaktifkan lewat status.")
		}
		return err
	}
	return database.RequireAffected(res)
}
