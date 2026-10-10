import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../../shared/api'
import { AuthContext, type AuthUser } from './auth-context'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Saat halaman dimuat, tanya server apakah cookie sesi masih berlaku.
  useEffect(() => {
    let active = true
    api<AuthUser>('/auth/me')
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const u = await api<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    setUser(u)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api<null>('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
