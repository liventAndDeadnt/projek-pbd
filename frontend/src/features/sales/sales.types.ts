export type DetailPenjualanDraft = { idbarang: number | null; harga_satuan: number; jumlah: number; sub_total: number }
export type PenjualanDraft = { iduser: number | null; subtotal_nilai: number; ppn: number; total_nilai: number; details: DetailPenjualanDraft[] }
export type PosCartItem = { temporaryId: number; nama_barang: string; harga_dasar: number; jumlah: number }
