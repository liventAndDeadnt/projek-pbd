import { api } from '../../shared/api'
import type { Barang, Satuan, Vendor } from './catalog.types'

// Adaptor untuk endpoint katalog yang memang sudah tersedia di sistem.
export function listBarang(search: string, status: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status === 'Aktif' ? '1' : '0')
  return api<Barang[]>(`/barang${params.size ? `?${params}` : ''}`)
}

export function listSatuan(status: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status === 'Aktif' ? '1' : '0')
  return api<Satuan[]>(`/satuan${params.size ? `?${params}` : ''}`)
}

export function listVendor(search: string, status: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status === 'Aktif' ? '1' : '0')
  return api<Vendor[]>(`/vendor${params.size ? `?${params}` : ''}`)
}
