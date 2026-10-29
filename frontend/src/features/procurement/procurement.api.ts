import { api } from '../../shared/api'
import type {
  CreatePengadaanInput,
  Pengadaan,
  PengadaanDetail,
  PengadaanStatus,
} from './procurement.types'

export function listPengadaan(search: string, status: PengadaanStatus | '') {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  return api<Pengadaan[]>(`/pengadaan${params.size ? `?${params}` : ''}`)
}

export function getPengadaan(id: number) {
  return api<PengadaanDetail>(`/pengadaan/${id}`)
}

export function createPengadaan(input: CreatePengadaanInput) {
  return api<PengadaanDetail>('/pengadaan', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function changePengadaanStatus(id: number, status: 'A' | 'R' | 'X') {
  return api<PengadaanDetail>(`/pengadaan/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
