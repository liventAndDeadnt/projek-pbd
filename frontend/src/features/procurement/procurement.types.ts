export type ProcurementStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Partial' | 'Completed'
export type DetailPengadaanDraft = { idbarang: number | null; nama_barang: string; harga_satuan: number; jumlah: number; sub_total: number }
export type PengadaanDraft = { idvendor: number | null; user_iduser: number | null; timestamp: string | null; status: ProcurementStatus; subtotal_nilai: number; ppn_persen: number; ppn: number; total_nilai: number; details: DetailPengadaanDraft[] }
