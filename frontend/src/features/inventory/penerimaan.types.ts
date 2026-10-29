export type PenerimaanStatus = 'S' | 'C'

export type Penerimaan = {
  idpenerimaan: number
  created_at: string | null
  status: PenerimaanStatus
  idpengadaan: number
  vendor_idvendor: number
  nama_vendor: string
  iduser: number
  username: string
  jumlah_item: number
  total_qty: number
  total_nilai: number
}

export type PenerimaanItem = {
  iddetail_penerimaan: number
  idpenerimaan: number
  idbarang: number
  nama_barang: string
  jenis: string
  nama_satuan: string
  jumlah_terima: number
  harga_satuan_terima: number
  sub_total_terima: number
}

export type PenerimaanDetail = Penerimaan & {
  items: PenerimaanItem[]
}

export type CreatePenerimaanItem = {
  idbarang: number
  jumlah_terima: number
}

export type CreatePenerimaanInput = {
  idpengadaan: number
  items: CreatePenerimaanItem[]
}
