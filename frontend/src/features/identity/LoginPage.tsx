import { useState, type CSSProperties, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ApiError } from '../../shared/api'
import { useAuth } from './useAuth'
import './login.css'

// Contoh isi kartu stok. Dekoratif: menunjukkan apa yang dicatat sistem ini.
const LEDGER = [
  { tgl: '1 Okt', ket: 'Penerimaan dari vendor', masuk: 120, keluar: null, stok: 120 },
  { tgl: '2 Okt', ket: 'Penjualan', masuk: null, keluar: 8, stok: 112 },
  { tgl: '3 Okt', ket: 'Penjualan', masuk: null, keluar: 15, stok: 97 },
  { tgl: '5 Okt', ket: 'Retur ke vendor', masuk: null, keluar: 6, stok: 91 },
  { tgl: '6 Okt', ket: 'Penerimaan dari vendor', masuk: 60, keluar: null, stok: 151 },
  { tgl: '7 Okt', ket: 'Penjualan', masuk: null, keluar: 22, stok: 129 },
] as const

export default function LoginPage() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sudah login (atau baru saja berhasil login): langsung ke halaman tujuan.
  if (!loading && user) return <Navigate to={from} replace />

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
      <aside className="ledger">
        <p className="brand">Inventori PBD</p>

        <div className="ledger-sheet">
          <div aria-hidden="true">
            <h2>Kartu stok</h2>
            <p className="ledger-item">Kabel LAN 5 m, satuan pcs</p>
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Keterangan</th>
                  <th className="num">Masuk</th>
                  <th className="num">Keluar</th>
                  <th className="num">Stok</th>
                </tr>
              </thead>
              <tbody>
                {LEDGER.map((row, i) => (
                  <tr key={row.tgl + row.ket} style={{ '--i': i } as CSSProperties}>
                    <td>{row.tgl}</td>
                    <td>{row.ket}</td>
                    <td className="num">{row.masuk ?? '–'}</td>
                    <td className="num">{row.keluar ?? '–'}</td>
                    <td className="num balance">{row.stok}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ledger-note">
            Setiap penerimaan, penjualan, dan retur tercatat otomatis di kartu stok.
          </p>
        </div>
      </aside>

      <main className="panel">
        <form className="panel-inner" onSubmit={handleSubmit} noValidate>
          <h1>Masuk ke sistem</h1>
          <p className="lead">Pakai akun yang diberikan admin.</p>

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
