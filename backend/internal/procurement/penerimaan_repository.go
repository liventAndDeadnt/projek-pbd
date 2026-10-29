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
)

const selectPenerimaan = `
SELECT idpenerimaan, created_at, status, idpengadaan,
       vendor_idvendor, nama_vendor, iduser, username,
       jumlah_item, total_qty, total_nilai
FROM v_penerimaan_detail`

const selectPenerimaanItems = `
SELECT iddetail_penerimaan, idpenerimaan, barang_idbarang,
       nama_barang, jenis, nama_satuan,
       jumlah_terima, harga_satuan_terima, sub_total_terima
FROM v_detail_penerimaan_detail`

type PenerimaanRepository struct {
	db *sqlx.DB
}

func NewPenerimaanRepository(db *sqlx.DB) *PenerimaanRepository {
	return &PenerimaanRepository{db: db}
}

func (r *PenerimaanRepository) List(ctx context.Context, f PenerimaanFilter) ([]Penerimaan, error) {
	query := selectPenerimaan
	var conds []string
	var args []any

	if f.Status != "" {
		conds = append(conds, "status = ?")
		args = append(args, f.Status)
	}
	if f.Search != "" {
		if id, err := strconv.ParseInt(f.Search, 10, 64); err == nil && id > 0 {
			conds = append(conds, "(idpenerimaan = ? OR idpengadaan = ? OR nama_vendor LIKE ?)")
			args = append(args, id, id, "%"+f.Search+"%")
		} else {
			conds = append(conds, "nama_vendor LIKE ?")
			args = append(args, "%"+f.Search+"%")
		}
	}
	if len(conds) > 0 {
		query += " WHERE " + strings.Join(conds, " AND ")
	}
	query += " ORDER BY created_at DESC, idpenerimaan DESC"

	out := []Penerimaan{}
	if err := r.db.SelectContext(ctx, &out, query, args...); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *PenerimaanRepository) GetByID(ctx context.Context, id int64) (*PenerimaanDetail, error) {
	var header Penerimaan
	err := r.db.GetContext(ctx, &header, selectPenerimaan+" WHERE idpenerimaan = ?", id)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, apperr.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	items := []PenerimaanItem{}
	if err := r.db.SelectContext(ctx, &items,
		selectPenerimaanItems+" WHERE idpenerimaan = ? ORDER BY iddetail_penerimaan", id); err != nil {
		return nil, err
	}
	return &PenerimaanDetail{Penerimaan: header, Items: items}, nil
}

// Create memanggil sp_penerimaan_buat di dalam satu transaksi.
func (r *PenerimaanRepository) Create(
	ctx context.Context,
	actorID int,
	pengadaanID int64,
	items []CreatePenerimaanItem,
) (int64, error) {
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
		"CALL sp_penerimaan_buat(?, ?, ?, @new_id)",
		pengadaanID, actorID, string(payload)); err != nil {
		return 0, mapProcedureError(err)
	}

	var id int64
	if err := tx.GetContext(ctx, &id, "SELECT @new_id"); err != nil {
		return 0, err
	}
	if id <= 0 {
		return 0, errors.New("stored procedure tidak mengembalikan id penerimaan")
	}
	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return id, nil
}
