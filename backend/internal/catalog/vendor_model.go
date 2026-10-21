package catalog

// Vendor merepresentasikan satu baris dari tabel vendor.
type Vendor struct {
	IDVendor   int    `db:"idvendor" json:"idvendor"`
	NamaVendor string `db:"nama_vendor" json:"nama_vendor"`
	BadanHukum string `db:"badan_hukum" json:"badan_hukum"`
	Status     string `db:"status" json:"status"`
}

// VendorFilter berisi filter opsional untuk daftar vendor.
// Status berupa pointer agar status "0" bisa dibedakan dari filter yang tidak dikirim.
type VendorFilter struct {
	Search string
	Status *string
}

type VendorInput struct {
	NamaVendor string `json:"nama_vendor" binding:"required,max=100"`
	BadanHukum string `json:"badan_hukum" binding:"required,oneof=Y N"`
	Status     string `json:"status" binding:"required,oneof=0 1"`
}
