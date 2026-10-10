export type ReportKind = 'penjualan' | 'pengadaan' | 'stok' | 'retur' | 'margin'
export type ReportFilter = { from: string; to: string; status?: string; productId?: number }
export type EmptyReport<T> = { rows: T[]; sourceConnected: false }
