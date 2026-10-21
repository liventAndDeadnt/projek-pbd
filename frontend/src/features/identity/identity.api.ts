import { api } from '../../shared/api'
import type { Role, User } from './identity.types'

export function listRoles(search: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  return api<Role[]>(`/roles${params.size ? `?${params}` : ''}`)
}

export function createRole(input: Pick<Role, 'nama_role'>) {
  return api<Role>('/roles', { method: 'POST', body: JSON.stringify(input) })
}

export function updateRole(id: number, input: Pick<Role, 'nama_role'>) {
  return api<Role>(`/roles/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteRole(id: number) {
  return api<null>(`/roles/${id}`, { method: 'DELETE' })
}

export function listUsers(search: string, role: string) {
  const params = new URLSearchParams()
  if (search.trim()) params.set('search', search.trim())
  if (role) params.set('role', role)
  return api<User[]>(`/users${params.size ? `?${params}` : ''}`)
}

export type UserCreateInput = { username: string; idrole: number; password: string }
export type UserUpdateInput = { username: string; idrole: number; password?: string }

export function createUser(input: UserCreateInput) {
  return api<User>('/users', { method: 'POST', body: JSON.stringify(input) })
}

export function updateUser(id: number, input: UserUpdateInput) {
  return api<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteUser(id: number) {
  return api<null>(`/users/${id}`, { method: 'DELETE' })
}
