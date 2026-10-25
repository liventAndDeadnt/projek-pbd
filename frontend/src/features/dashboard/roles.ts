import type { IconName } from '../../shared/icons'

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

export type NavigationItem = { label: string; to: string; icon: IconName }
export type NavigationGroup = { label?: string; items: NavigationItem[] }

const dashboard = (role: Role): NavigationItem => ({
  label: 'Dashboard',
  to: ROLE_HOME[role],
  icon: 'dashboard',
})

const barang: NavigationItem = { label: 'Barang', to: '/barang', icon: 'box' }
const satuan: NavigationItem = { label: 'Satuan', to: '/satuan', icon: 'layers' }
const vendor: NavigationItem = { label: 'Vendor', to: '/vendor', icon: 'building' }
const users: NavigationItem = { label: 'Pengguna', to: '/pengguna', icon: 'users' }
const roles: NavigationItem = { label: 'Role', to: '/role', icon: 'shield' }
const margin: NavigationItem = { label: 'Margin penjualan', to: '/margin', icon: 'percent' }
const pengadaan: NavigationItem = { label: 'Pengadaan', to: '/pengadaan', icon: 'clipboard' }
const penerimaan: NavigationItem = { label: 'Penerimaan', to: '/penerimaan', icon: 'inbox' }
const retur: NavigationItem = { label: 'Retur', to: '/retur', icon: 'rotate' }
const penjualan: NavigationItem = { label: 'Penjualan', to: '/penjualan', icon: 'cart' }
const kartuStok: NavigationItem = { label: 'Kartu stok', to: '/kartu-stok', icon: 'package' }
const laporan: NavigationItem = { label: 'Laporan', to: '/laporan/penjualan', icon: 'chart' }

export const ROLE_NAVIGATION: Record<Role, NavigationGroup[]> = {
  admin: [
    { items: [dashboard('admin')] },
    {
      label: 'Master data',
      items: [barang, satuan, vendor, users, roles, margin],
    },
    {
      label: 'Transaksi',
      items: [pengadaan, penerimaan, retur, penjualan, kartuStok],
    },
    { label: 'Laporan', items: [laporan] },
  ],
  purchasing: [
    { items: [dashboard('purchasing')] },
    {
      label: 'Pengadaan',
      items: [
        { label: 'Daftar pengadaan', to: '/pengadaan', icon: 'clipboard' },
        { label: 'Buat pengadaan', to: '/pengadaan/baru', icon: 'plus' },
      ],
    },
    { label: 'Referensi', items: [vendor, barang, satuan] },
    {
      label: 'Monitoring',
      items: [
        { label: 'Penerimaan', to: '/penerimaan', icon: 'inbox' },
        { label: 'Retur', to: '/retur', icon: 'rotate' },
      ],
    },
  ],
  gudang: [
    { items: [dashboard('gudang')] },
    {
      label: 'Penerimaan',
      items: [
        { label: 'Antrean penerimaan', to: '/penerimaan', icon: 'inbox' },
        { label: 'Riwayat penerimaan', to: '/penerimaan?view=riwayat', icon: 'clock' },
      ],
    },
    {
      label: 'Retur',
      items: [
        { label: 'Buat retur', to: '/retur/baru', icon: 'plus' },
        { label: 'Riwayat retur', to: '/retur', icon: 'rotate' },
      ],
    },
    {
      label: 'Stok',
      items: [
        { label: 'Ringkasan stok', to: '/stok', icon: 'package' },
        { label: 'Kartu stok', to: '/kartu-stok', icon: 'clipboard' },
      ],
    },
    {
      label: 'Referensi',
      items: [barang, satuan, { label: 'Pengadaan', to: '/pengadaan', icon: 'clipboard' }],
    },
  ],
  kasir: [
    { items: [dashboard('kasir')] },
    {
      label: 'Penjualan',
      items: [
        { label: 'POS', to: '/pos', icon: 'cart' },
        { label: 'Riwayat penjualan', to: '/penjualan', icon: 'clock' },
      ],
    },
    { label: 'Referensi', items: [barang] },
  ],
}
