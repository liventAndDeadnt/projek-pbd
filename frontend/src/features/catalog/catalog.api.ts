import { api } from '../../shared/api'
import type { Barang, Satuan, Vendor, MarginPenjualan } from './catalog.types'

export type BarangInput = Pick<Barang, 'jenis' | 'nama' | 'idsatuan' | 'harga' | 'status'>
export type SatuanInput = Pick<Satuan, 'nama_satuan' | 'status'>
export type VendorInput = Pick<Vendor, 'nama_vendor' | 'badan_hukum' | 'status'>
export type MarginInput = Pick<MarginPenjualan, 'persen' | 'status'>

// Adaptor untuk endpoint katalog yang memang sudah tersedia di sistem.
export function listBarang(search: string, status: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status === 'Aktif' ? '1' : '0')
  return api<Barang[]>(`/barang${params.size ? `?${params}` : ''}`)
}

export function createBarang(input: BarangInput) {
  return api<Barang>('/barang', { method: 'POST', body: JSON.stringify(input) })
}

export function updateBarang(id: number, input: BarangInput) {
  return api<Barang>(`/barang/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteBarang(id: number) {
  return api<null>(`/barang/${id}`, { method: 'DELETE' })
}

export function listSatuan(search: string, status: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status === 'Aktif' ? '1' : '0')
  return api<Satuan[]>(`/satuan${params.size ? `?${params}` : ''}`)
}

export function createSatuan(input: SatuanInput) {
  return api<Satuan>('/satuan', { method: 'POST', body: JSON.stringify(input) })
}

export function updateSatuan(id: number, input: SatuanInput) {
  return api<Satuan>(`/satuan/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteSatuan(id: number) {
  return api<null>(`/satuan/${id}`, { method: 'DELETE' })
}

export function listVendor(search: string, status: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status === 'Aktif' ? '1' : '0')
  return api<Vendor[]>(`/vendor${params.size ? `?${params}` : ''}`)
}

export function createVendor(input: VendorInput) {
  return api<Vendor>('/vendor', { method: 'POST', body: JSON.stringify(input) })
}

export function updateVendor(id: number, input: VendorInput) {
  return api<Vendor>(`/vendor/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteVendor(id: number) {
  return api<null>(`/vendor/${id}`, { method: 'DELETE' })
}

export function listMarginPenjualan(status: string) {
  const params = new URLSearchParams()
  if (status) params.set('status', status === 'Aktif' ? '1' : '0')
  return api<MarginPenjualan[]>(`/margin${params.size ? `?${params}` : ''}`)
}

export function createMargin(input: MarginInput) {
  return api<MarginPenjualan>('/margin', { method: 'POST', body: JSON.stringify(input) })
}

export function updateMargin(id: number, input: MarginInput) {
  return api<MarginPenjualan>(`/margin/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteMargin(id: number) {
  return api<null>(`/margin/${id}`, { method: 'DELETE' })
}
