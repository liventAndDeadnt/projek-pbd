import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ApiError } from '../../shared/api'
import { Icon } from '../../shared/icons'
import { isRole, ROLE_HOME } from '../dashboard/roles'
import { useAuth } from './useAuth'

const COPYRIGHT_YEAR = new Date().getFullYear()

export default function LoginPage() {
  const { user, loading, login, logout } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="screen-center" role="status">
        Memeriksa sesi…
      </div>
    )
  }

  if (user && isRole(user.role)) {
    return <Navigate to={ROLE_HOME[user.role]} replace />
  }

  if (user) {
    return (
      <div className="screen-center">
        <div className="role-error-card">
          <strong>Role akun belum dikenali.</strong>
          <p>Hubungi administrator untuk memeriksa akses akun ini.</p>
          <button className="btn btn--secondary btn--sm" type="button" onClick={() => void logout()}>
            Keluar
          </button>
        </div>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    try {
      await login(username.trim(), password)
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.',
      )
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <aside className="login-aside">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            G
          </span>
          <span className="brand-copy">
            <strong>GOstore</strong>
            <small>Inventori</small>
          </span>
        </div>

        <div className="login-aside-copy">
          <p className="eyebrow">Sistem inventori internal</p>
          <h1>Kelola stok dan transaksi dalam satu ruang kerja.</h1>
          <p>
            Satu tempat untuk master data, pengadaan, penerimaan, retur, penjualan, dan laporan
            operasional toko.
          </p>
          <ul className="login-points">
            <li className="login-point">
              <span aria-hidden="true">
                <Icon name="check" size={12} />
              </span>
              Master data barang, satuan, vendor, dan margin penjualan
            </li>
            <li className="login-point">
              <span aria-hidden="true">
                <Icon name="check" size={12} />
              </span>
              Alur pengadaan sampai penerimaan barang di gudang
            </li>
            <li className="login-point">
              <span aria-hidden="true">
                <Icon name="check" size={12} />
              </span>
              Akses sesuai peran: admin, purchasing, gudang, dan kasir
            </li>
          </ul>
        </div>

        <p className="login-copyright">© {COPYRIGHT_YEAR} Inventori GOstore</p>
      </aside>

      <main className="login-main">
        <div className="login-card">
          <div className="login-brand-mobile brand">
            <span className="brand-mark" aria-hidden="true">
              G
            </span>
            <span className="brand-copy">
              <strong>GOstore</strong>
              <small>Inventori</small>
            </span>
          </div>

          <h2>Masuk ke akun</h2>
          <p className="lead">Gunakan akun internal yang diberikan administrator.</p>

          {error && (
            <p className="login-error" id="login-error" role="alert">
              {error}
            </p>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'login-error' : undefined}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
            </div>

            <button
              className="btn btn--primary btn--block login-submit"
              type="submit"
              disabled={submitting || !username.trim() || !password}
            >
              {submitting ? 'Memeriksa…' : 'Masuk'}
              {!submitting && <Icon name="arrowRight" size={15} />}
            </button>
          </form>

          <p className="login-help">Butuh bantuan akses? Hubungi administrator.</p>
        </div>
      </main>
    </div>
  )
}
