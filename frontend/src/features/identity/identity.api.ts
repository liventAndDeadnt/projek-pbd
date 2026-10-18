import { api } from '../../shared/api'
import type { Role } from './identity.types'

export function listRoles(search: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  return api<Role[]>(`/roles${params.size ? `?${params}` : ''}`)
}
