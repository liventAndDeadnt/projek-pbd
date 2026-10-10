import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError } from '../../shared/api'
import { useAuth } from './useAuth'
import { isRole, ROLE_HOME } from '../dashboard/roles'
import './login.css'

export default function LoginPage() {
  const { user, loading, login, logout } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pengguna yang sudah login diarahkan ke dashboard sesuai role dari /auth/me.
  if (!loading && user && isRole(user.role)) return <Navigate to={ROLE_HOME[user.role]} replace />

  if (!loading && user) {
    return <div className="screen-center"><div className="role-error"><strong>Role akun belum dikenali.</strong><p>Hubungi administrator untuk memeriksa akses akun ini.</p><button type="button" onClick={() => void logout()}>Keluar</button></div></div>
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.',
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="login">
      <main className="login-card-wrap">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <div className="login-brand"><span className="login-brand-mark" aria-hidden="true">I</span><span>Inventori GOstore</span></div>
          <h1>Selamat datang</h1>
          <p className="lead">Masuk dengan akun yang diberikan admin.</p>

          {error && (
            <p className="form-error" id="login-error" role="alert">
              {error}
            </p>
          )}

          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              className="input"
              type="text"
              autoComplete="username"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-row">
              <input
                id="password"
                name="password"
                className="input input--toggle"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
              />
              <button type="button" className="toggle" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Sembunyikan' : 'Tampilkan'}
              </button>
            </div>
          </div>

          <button type="submit" className="submit" disabled={submitting || !username.trim() || !password}>
            {submitting ? 'Memeriksa…' : 'Masuk'}
          </button>
        </form>
      </main>
    </div>
  )
}
