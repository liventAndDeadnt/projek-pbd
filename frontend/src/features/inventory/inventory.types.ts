export type DetailPenerimaanDraft = { idbarang: number | null; jumlah_dipesan: number; jumlah_diterima_sebelumnya: number; jumlah_diterima_batch: number; sisa: number }
export type PenerimaanDraft = { idpengadaan: number | null; status: 'Draft' | 'Partial' | 'Completed'; details: DetailPenerimaanDraft[] }
export type DetailReturDraft = { iddetail_penerimaan: number | null; jumlah: number; alasan: string }
export type ReturDraft = { idpenerimaan: number | null; details: DetailReturDraft[] }
export type KartuStokRow = { jenis_transaksi: string; masuk: number; keluar: number; stock: number; created_at: string; idtransaksi: number; idbarang: number }
