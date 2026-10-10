import { createContext } from 'react'

export type AuthUser = {
  iduser: number
  username: string
  role: string
}

export type AuthState = {
  user: AuthUser | null
  loading: boolean // true selama sesi lama sedang dicek ke server
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
