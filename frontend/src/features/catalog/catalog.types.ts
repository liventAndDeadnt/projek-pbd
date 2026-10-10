export type Barang = {
  idbarang: number
  jenis: string
  nama: string
  idsatuan: number
  nama_satuan: string
  status: 0 | 1
  harga: number
}

export type Satuan = { idsatuan: number; nama_satuan: string; status: 0 | 1 }
export type Vendor = { idvendor: number; nama_vendor: string; badan_hukum: string; status: string }
export type Role = { idrole: number; nama_role: string }
export type User = { iduser: number; username: string; idrole: number }
export type MarginPenjualan = { idmargin_penjualan: number; created_at: string; persen: number; status: 0 | 1; iduser: number; updated_at: string }
