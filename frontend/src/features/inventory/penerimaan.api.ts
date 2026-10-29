import { api } from '../../shared/api'
import type {
  CreatePenerimaanInput,
  Penerimaan,
  PenerimaanDetail,
  PenerimaanStatus,
} from './penerimaan.types'

export function listPenerimaan(search: string, status: PenerimaanStatus | '') {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  return api<Penerimaan[]>(`/penerimaan${params.size ? `?${params}` : ''}`)
}

export function getPenerimaan(id: number) {
  return api<PenerimaanDetail>(`/penerimaan/${id}`)
}

export function createPenerimaan(input: CreatePenerimaanInput) {
  return api<PenerimaanDetail>('/penerimaan', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
