package catalog

// Barang = 1 baris tabel barang (dipakai juga sebagai parameter INSERT/UPDATE lewat tag db).
type Barang struct {
	IDBarang int    `db:"idbarang" json:"idbarang"`
	Jenis    string `db:"jenis" json:"jenis"`
	Nama     string `db:"nama" json:"nama"`
	IDSatuan int    `db:"idsatuan" json:"idsatuan"`
	Status   int    `db:"status" json:"status"`
	Harga    int    `db:"harga" json:"harga"`
}

// BarangView = hasil JOIN barang + satuan untuk list/detail.
// Embed anonim: kolom tetap datar, jadi sqlx dan JSON memperlakukannya seperti satu struct besar.
type BarangView struct {
	Barang
	NamaSatuan string `db:"nama_satuan" json:"nama_satuan"`
}

// BarangFilter = parameter opsional untuk list.
type BarangFilter struct {
	Search string
	Status *int
}

// BarangInput = body request create/update. Pointer dipakai supaya nilai 0 (harga gratis / status nonaktif)
// bisa dibedakan dari "field tidak dikirim".
type BarangInput struct {
	Jenis    string `json:"jenis" binding:"required,len=1"`
	Nama     string `json:"nama" binding:"required,max=45"`
	IDSatuan int    `json:"idsatuan" binding:"required,gt=0"`
	Status   *int   `json:"status" binding:"omitempty,oneof=0 1"`
	Harga    *int   `json:"harga" binding:"required,gte=0"`
}
