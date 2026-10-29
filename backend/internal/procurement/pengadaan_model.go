package procurement

import "time"

// Pengadaan adalah satu header dokumen pengadaan (PO).
type Pengadaan struct {
	IDPengadaan      int64      `db:"idpengadaan" json:"idpengadaan"`
	Timestamp        *time.Time `db:"timestamp" json:"timestamp"`
	IDUser           int        `db:"user_iduser" json:"user_iduser"`
	Username         string     `db:"username" json:"username"`
	Status           string     `db:"status" json:"status"`
	IDVendor         int        `db:"vendor_idvendor" json:"vendor_idvendor"`
	NamaVendor       string     `db:"nama_vendor" json:"nama_vendor"`
	SubtotalNilai    int        `db:"subtotal_nilai" json:"subtotal_nilai"`
	PPN              int        `db:"ppn" json:"ppn"`
	TotalNilai       int        `db:"total_nilai" json:"total_nilai"`
	JumlahItem       int        `db:"jumlah_item" json:"jumlah_item"`
	JumlahPenerimaan int        `db:"jumlah_penerimaan" json:"jumlah_penerimaan"`
}

// PengadaanItem adalah satu baris barang dalam PO.
type PengadaanItem struct {
	IDDetailPengadaan int64  `db:"iddetail_pengadaan" json:"iddetail_pengadaan"`
	IDPengadaan       int64  `db:"idpengadaan" json:"idpengadaan"`
	IDBarang          int    `db:"idbarang" json:"idbarang"`
	NamaBarang        string `db:"nama_barang" json:"nama_barang"`
	Jenis             string `db:"jenis" json:"jenis"`
	NamaSatuan        string `db:"nama_satuan" json:"nama_satuan"`
	HargaSatuan       int    `db:"harga_satuan" json:"harga_satuan"`
	Jumlah            int    `db:"jumlah" json:"jumlah"`
	SubTotal          int    `db:"sub_total" json:"sub_total"`
	JumlahDiterima    int    `db:"jumlah_diterima" json:"jumlah_diterima"`
}

// Permissions adalah aksi yang boleh dilakukan pengguna saat ini pada satu PO.
// Dihitung di server agar UI tidak menduplikasi aturan akses.
type Permissions struct {
	Approve bool `json:"approve"`
	Reject  bool `json:"reject"`
	Cancel  bool `json:"cancel"`
}

type PengadaanDetail struct {
	Pengadaan
	Items       []PengadaanItem `json:"items"`
	Permissions Permissions     `json:"permissions"`
}

type PengadaanFilter struct {
	Search string
	Status string
}

type CreateInput struct {
	IDVendor int          `json:"idvendor" binding:"required"`
	PPN      int          `json:"ppn" binding:"gte=0,lte=100"`
	Items    []CreateItem `json:"items" binding:"required,min=1,dive"`
}

type CreateItem struct {
	IDBarang    int `json:"idbarang" binding:"required"`
	Jumlah      int `json:"jumlah" binding:"required,min=1"`
	HargaSatuan int `json:"harga_satuan" binding:"gte=0"`
}

type StatusInput struct {
	Status string `json:"status" binding:"required,oneof=A R X"`
}
