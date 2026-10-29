package procurement

import "time"

// Penerimaan adalah header satu dokumen penerimaan barang dari PO.
type Penerimaan struct {
	IDPenerimaan int64      `db:"idpenerimaan" json:"idpenerimaan"`
	CreatedAt    *time.Time `db:"created_at" json:"created_at"`
	Status       string     `db:"status" json:"status"`
	IDPengadaan  int64      `db:"idpengadaan" json:"idpengadaan"`
	IDVendor     int        `db:"vendor_idvendor" json:"vendor_idvendor"`
	NamaVendor   string     `db:"nama_vendor" json:"nama_vendor"`
	IDUser       int        `db:"iduser" json:"iduser"`
	Username     string     `db:"username" json:"username"`
	JumlahItem   int        `db:"jumlah_item" json:"jumlah_item"`
	TotalQty     int        `db:"total_qty" json:"total_qty"`
	TotalNilai   int        `db:"total_nilai" json:"total_nilai"`
}

// PenerimaanItem adalah satu baris barang yang diterima.
type PenerimaanItem struct {
	IDDetailPenerimaan int64  `db:"iddetail_penerimaan" json:"iddetail_penerimaan"`
	IDPenerimaan       int64  `db:"idpenerimaan" json:"idpenerimaan"`
	IDBarang           int    `db:"barang_idbarang" json:"idbarang"`
	NamaBarang         string `db:"nama_barang" json:"nama_barang"`
	Jenis              string `db:"jenis" json:"jenis"`
	NamaSatuan         string `db:"nama_satuan" json:"nama_satuan"`
	JumlahTerima       int    `db:"jumlah_terima" json:"jumlah_terima"`
	HargaSatuanTerima  int    `db:"harga_satuan_terima" json:"harga_satuan_terima"`
	SubTotalTerima     int    `db:"sub_total_terima" json:"sub_total_terima"`
}

type PenerimaanDetail struct {
	Penerimaan
	Items []PenerimaanItem `json:"items"`
}

type PenerimaanFilter struct {
	Search string
	Status string
}

type CreatePenerimaanInput struct {
	IDPengadaan int64                  `json:"idpengadaan" binding:"required"`
	Items       []CreatePenerimaanItem `json:"items" binding:"required,min=1,dive"`
}

type CreatePenerimaanItem struct {
	IDBarang     int `json:"idbarang" binding:"required"`
	JumlahTerima int `json:"jumlah_terima" binding:"required,min=1"`
}
