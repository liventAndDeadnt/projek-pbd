export type ReportDefinition = {
  key: string
  label: string
  description: string
  columns: string[]
}

export const REPORTS: ReportDefinition[] = [
  {
    key: 'penjualan',
    label: 'Penjualan',
    description: 'Ringkasan transaksi penjualan berdasarkan rentang tanggal.',
    columns: ['Tanggal', 'ID penjualan', 'Jumlah item', 'Subtotal', 'PPN', 'Total'],
  },
  {
    key: 'pengadaan',
    label: 'Pengadaan',
    description: 'Daftar pengadaan beserta vendor, status, dan total nilainya.',
    columns: ['Tanggal', 'ID pengadaan', 'Vendor', 'Status', 'Subtotal', 'PPN', 'Total'],
  },
  {
    key: 'stok',
    label: 'Stok',
    description: 'Saldo dan pergerakan stok per barang.',
    columns: ['Barang', 'Satuan', 'Stok masuk', 'Stok keluar', 'Saldo'],
  },
  {
    key: 'retur',
    label: 'Retur',
    description: 'Retur barang ke vendor dan statusnya.',
    columns: ['Tanggal', 'ID retur', 'Penerimaan', 'Jumlah item', 'Status'],
  },
  {
    key: 'margin',
    label: 'Margin / profit',
    description: 'Perbandingan harga dasar, margin, dan harga jual.',
    columns: ['Periode', 'Barang', 'Harga dasar', 'Margin', 'Harga jual'],
  },
]
