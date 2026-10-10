import { useState } from 'react'
import { useAuth } from '../identity/useAuth'
import './dashboard.css'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await logout() // setelah user null, RequireAuth otomatis mengarahkan ke /login
  }

  return (
    <div className="shell">
      <header className="shell-bar">
        <p className="brand">Inventori PBD</p>
        <div className="shell-user">
          <span>
            {user?.username} <span className="shell-role">{user?.role}</span>
          </span>
          <button type="button" className="shell-logout" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? 'Keluar…' : 'Keluar'}
          </button>
        </div>
      </header>
      <main className="shell-main">
        <h1>Beranda</h1>
        <p>Kamu masuk sebagai {user?.role}. Menu sesuai peran akan muncul di sini.</p>
      </main>
    </div>
  )
}
