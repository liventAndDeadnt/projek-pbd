package procurement

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/jmoiron/sqlx"

	"projek-pbd/internal/platform/apperr"
	"projek-pbd/internal/platform/database"
)

const selectPengadaan = `
SELECT idpengadaan, timestamp, user_iduser, username, status,
       vendor_idvendor, nama_vendor, subtotal_nilai, ppn, total_nilai,
       jumlah_item, jumlah_penerimaan
FROM v_pengadaan_detail`

const selectPengadaanItems = `
SELECT iddetail_pengadaan, idpengadaan, idbarang, nama_barang, jenis,
       nama_satuan, harga_satuan, jumlah, sub_total, jumlah_diterima
FROM v_detail_pengadaan_detail`

// PengadaanRepository adalah satu-satunya lapisan SQL untuk pengadaan.
type PengadaanRepository struct {
	db *sqlx.DB
}

func NewPengadaanRepository(db *sqlx.DB) *PengadaanRepository {
	return &PengadaanRepository{db: db}
}

func (r *PengadaanRepository) List(ctx context.Context, f PengadaanFilter) ([]Pengadaan, error) {
	query := selectPengadaan
	var conds []string
	var args []any

	if f.Status != "" {
		conds = append(conds, "status = ?")
		args = append(args, f.Status)
	}
	if f.Search != "" {
		if id, err := strconv.ParseInt(f.Search, 10, 64); err == nil && id > 0 {
			conds = append(conds, "(idpengadaan = ? OR nama_vendor LIKE ?)")
			args = append(args, id, "%"+f.Search+"%")
		} else {
			conds = append(conds, "nama_vendor LIKE ?")
			args = append(args, "%"+f.Search+"%")
		}
	}
	if len(conds) > 0 {
		query += " WHERE " + strings.Join(conds, " AND ")
	}
	query += " ORDER BY timestamp DESC, idpengadaan DESC"

	out := []Pengadaan{}
	if err := r.db.SelectContext(ctx, &out, query, args...); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *PengadaanRepository) GetByID(ctx context.Context, id int64) (*PengadaanDetail, error) {
	var header Pengadaan
	err := r.db.GetContext(ctx, &header, selectPengadaan+" WHERE idpengadaan = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	items := []PengadaanItem{}
	if err := r.db.SelectContext(ctx, &items,
		selectPengadaanItems+" WHERE idpengadaan = ? ORDER BY iddetail_pengadaan", id); err != nil {
		return nil, err
	}

	return &PengadaanDetail{Pengadaan: header, Items: items}, nil
}

// Create memanggil sp_pengadaan_buat di dalam satu transaksi.
// OUT parameter dibaca lewat user variable pada koneksi yang sama.
func (r *PengadaanRepository) Create(ctx context.Context, actorID, vendorID, ppn int, items []CreateItem) (int64, error) {
	payload, err := json.Marshal(items)
	if err != nil {
		return 0, err
	}

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx,
		"CALL sp_pengadaan_buat(?, ?, ?, ?, @new_id)",
		actorID, vendorID, ppn, string(payload)); err != nil {
		return 0, mapProcedureError(err)
	}

	var id int64
	if err := tx.GetContext(ctx, &id, "SELECT @new_id"); err != nil {
		return 0, err
	}
	if id <= 0 {
		return 0, errors.New("stored procedure tidak mengembalikan id pengadaan")
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return id, nil
}

func (r *PengadaanRepository) ChangeStatus(
	ctx context.Context,
	id int64,
	status string,
	actorID int,
	ownerOnly bool,
) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx,
		"CALL sp_pengadaan_status(?, ?, ?, ?, @out_id)",
		id, status, actorID, ownerOnly); err != nil {
		return mapProcedureError(err)
	}

	var out int64
	if err := tx.GetContext(ctx, &out, "SELECT @out_id"); err != nil {
		return err
	}
	if out != id {
		return errors.New("stored procedure mengembalikan id pengadaan yang tidak sesuai")
	}
	return tx.Commit()
}

func mapProcedureError(err error) error {
	if database.IsRuleViolation(err) {
		return apperr.Wrap(apperr.ErrInvalid, database.RuleMessage(err))
	}
	// Backstop unique key: satu barang hanya boleh muncul sekali per PO.
	if database.IsDuplicate(err) {
		return apperr.Wrap(apperr.ErrConflict, "Barang yang sama tidak boleh dipilih dua kali.")
	}
	return err
}
