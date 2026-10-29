export type PengadaanStatus = 'P' | 'A' | 'R' | 'X' | 'S' | 'C'

export type Pengadaan = {
  idpengadaan: number
  timestamp: string | null
  user_iduser: number
  username: string
  status: PengadaanStatus
  vendor_idvendor: number
  nama_vendor: string
  subtotal_nilai: number
  ppn: number
  total_nilai: number
  jumlah_item: number
  jumlah_penerimaan: number
}

export type PengadaanItem = {
  iddetail_pengadaan: number
  idpengadaan: number
  idbarang: number
  nama_barang: string
  jenis: string
  nama_satuan: string
  harga_satuan: number
  jumlah: number
  sub_total: number
  jumlah_diterima: number
}

export type PengadaanPermissions = {
  approve: boolean
  reject: boolean
  cancel: boolean
}

export type PengadaanDetail = Pengadaan & {
  items: PengadaanItem[]
  permissions: PengadaanPermissions
}

export type CreatePengadaanItem = {
  idbarang: number
  jumlah: number
  harga_satuan: number
}

export type CreatePengadaanInput = {
  idvendor: number
  ppn: number
  items: CreatePengadaanItem[]
}
