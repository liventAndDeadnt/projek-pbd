export type Barang = {
  idbarang: number
  jenis: string
  nama: string
  idsatuan: number
  nama_satuan: string
  status: 0 | 1
  harga: number
}

export type Satuan = {
  idsatuan: number
  nama_satuan: string
  status: 0 | 1
}

export type Vendor = {
  idvendor: number
  nama_vendor: string
  badan_hukum: 'Y' | 'N'
  status: '0' | '1'
}

export type MarginPenjualan = {
  idmargin_penjualan: number
  created_at: string | null
  persen: number | null
  status: 0 | 1 | null
  username: string
}
