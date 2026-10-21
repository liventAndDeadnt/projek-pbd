package catalog

// Satuan = representasi 1 baris tabel satuan.
type Satuan struct {
	IDSatuan   int    `db:"idsatuan" json:"idsatuan"`
	NamaSatuan string `db:"nama_satuan" json:"nama_satuan"`
	Status     int    `db:"status" json:"status"`
}

// SatuanInput = body request create/update. Status pointer supaya nilai 0 bisa dibedakan dari "tidak diisi".
type SatuanInput struct {
	NamaSatuan string `json:"nama_satuan" binding:"required,max=45"`
	Status     *int   `json:"status" binding:"omitempty,oneof=0 1"`
}

// SatuanFilter berisi filter opsional untuk daftar satuan.
type SatuanFilter struct {
	Search string
	Status *int
}
