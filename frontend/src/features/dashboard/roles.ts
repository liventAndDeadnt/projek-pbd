export const ROLE_HOME = {
  admin: '/dashboard/admin',
  purchasing: '/dashboard/purchasing',
  gudang: '/dashboard/gudang',
  kasir: '/dashboard/kasir',
} as const

export type Role = keyof typeof ROLE_HOME

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  purchasing: 'Purchasing',
  gudang: 'Gudang',
  kasir: 'Kasir',
}

export function isRole(value: string): value is Role {
  return value in ROLE_HOME
}

export type NavigationGroup = { label?: string; items: { label: string; to: string; icon: string }[] }

const dashboard = (role: Role) => ({ label: 'Dashboard', to: ROLE_HOME[role], icon: '◫' })
const barang = { label: 'Barang', to: '/barang', icon: '▦' }
const satuan = { label: 'Satuan', to: '/satuan', icon: '◈' }
const vendor = { label: 'Vendor', to: '/vendor', icon: '◇' }

export const ROLE_NAVIGATION: Record<Role, NavigationGroup[]> = {
  admin: [
    { items: [dashboard('admin')] },
    { label: 'Master data', items: [barang, satuan, vendor, { label: 'Pengguna', to: '/pengguna', icon: '◎' }, { label: 'Role', to: '/role', icon: '◇' }, { label: 'Margin penjualan', to: '/margin', icon: '%' }] },
    { label: 'Transaksi', items: [{ label: 'Pengadaan', to: '/pengadaan', icon: '⇧' }, { label: 'Penerimaan', to: '/penerimaan', icon: '↧' }, { label: 'Retur', to: '/retur', icon: '↶' }, { label: 'Penjualan', to: '/penjualan', icon: '↗' }, { label: 'Kartu stok', to: '/kartu-stok', icon: '▤' }] },
    { label: 'Laporan', items: [{ label: 'Penjualan', to: '/laporan/penjualan', icon: '⌁' }, { label: 'Pengadaan', to: '/laporan/pengadaan', icon: '⌁' }, { label: 'Stok', to: '/laporan/stok', icon: '⌁' }, { label: 'Retur', to: '/laporan/retur', icon: '⌁' }, { label: 'Margin / profit', to: '/laporan/margin', icon: '⌁' }] },
  ],
  purchasing: [
    { items: [dashboard('purchasing')] },
    { label: 'Pengadaan', items: [{ label: 'Daftar pengadaan', to: '/pengadaan', icon: '⇧' }, { label: 'Buat pengadaan', to: '/pengadaan/baru', icon: '＋' }] },
    { label: 'Referensi', items: [vendor, barang, satuan] },
    { label: 'Monitoring', items: [{ label: 'Penerimaan', to: '/penerimaan', icon: '↧' }, { label: 'Retur', to: '/retur', icon: '↶' }] },
  ],
  gudang: [
    { items: [dashboard('gudang')] },
    { label: 'Penerimaan', items: [{ label: 'Antrian penerimaan', to: '/penerimaan', icon: '↧' }, { label: 'Riwayat penerimaan', to: '/penerimaan?view=riwayat', icon: '◷' }] },
    { label: 'Retur', items: [{ label: 'Buat retur', to: '/retur/baru', icon: '＋' }, { label: 'Riwayat retur', to: '/retur', icon: '↶' }] },
    { label: 'Stok', items: [{ label: 'Ringkasan stok', to: '/stok', icon: '▦' }, { label: 'Kartu stok', to: '/kartu-stok', icon: '▤' }] },
    { label: 'Referensi', items: [barang, satuan, { label: 'Pengadaan', to: '/pengadaan', icon: '⇧' }] },
  ],
  kasir: [
    { items: [dashboard('kasir')] },
    { label: 'Penjualan', items: [{ label: 'POS', to: '/pos', icon: '▣' }, { label: 'Riwayat penjualan', to: '/penjualan', icon: '◷' }] },
    { label: 'Referensi', items: [barang] },
  ],
}
