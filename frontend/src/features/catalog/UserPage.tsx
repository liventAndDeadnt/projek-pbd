import { useEffect, useState } from 'react'
import { ApiError } from '../../shared/api'
import { EmptyState, PageHeader } from '../../shared/components'
import { listUser } from './catalog.api'
import type { User } from './catalog.types'

type LoadState = 'loading' | 'success' | 'error'

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    listUser(search, role)
      .then((data) => {
        if (active) {
          setUsers(data)
          setState('success')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(getLoadErrorMessage(error))
          setState('error')
        }
      })

    return () => { active = false }
  }, [search, role, reloadKey])

  return <div className="module-page">
    <PageHeader
      eyebrow="PENGELOLAAN AKSES"
      title="Pengguna"
      description="Daftar akun dan role pengguna internal aplikasi."
    />

    <section className="panel-card resource-panel">
      <div className="resource-toolbar">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Cari username"
            placeholder="Cari username…"
            value={search}
            onChange={(event) => {
              setState('loading')
              setErrorMessage('')
              setSearch(event.target.value)
            }}
          />
        </label>
        <div className="toolbar-controls">
          <select aria-label="Filter role" value={role} onChange={(event) => {
            setState('loading')
            setErrorMessage('')
            setRole(event.target.value)
          }}>
            <option value="">Semua role</option>
            <option value="admin">Admin</option>
            <option value="purchasing">Purchasing</option>
            <option value="gudang">Gudang</option>
            <option value="kasir">Kasir</option>
          </select>
          <span className="result-count">{state === 'success' ? `${users.length} data` : 'Memuat…'}</span>
        </div>
      </div>

      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data pengguna…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert">
        <strong>Gagal memuat data pengguna.</strong>
        <span>{errorMessage}</span>
        <button className="button button--secondary button--small" onClick={() => {
          setState('loading')
          setErrorMessage('')
          setReloadKey((key) => key + 1)
        }}>Coba lagi</button>
      </div>}
      {state === 'success' && users.length === 0 && <EmptyState
        title="Pengguna tidak ditemukan."
        detail={search || role ? 'Coba ubah pencarian atau filter role.' : 'Data pengguna belum tersedia.'}
      />}
      {state === 'success' && users.length > 0 && <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Username</th><th>Role</th></tr></thead>
          <tbody>{users.map((user) => <tr key={user.iduser}>
            <td>{user.iduser}</td>
            <td><strong>{user.username}</strong></td>
            <td>{user.role}</td>
          </tr>)}</tbody>
        </table>
      </div>}

      <div className="table-footer">
        <span>{state === 'success' ? `Menampilkan ${users.length} pengguna` : ' '}</span>
      </div>
    </section>
  </div>
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sesi login tidak terbaca atau sudah berakhir (HTTP 401). Silakan login ulang.'
    if (error.status === 403) return 'Akun yang aktif tidak memiliki akses admin (HTTP 403).'
    return `${error.message} (HTTP ${error.status})`
  }
  return 'Tidak dapat terhubung ke backend. Pastikan backend berjalan di port 8080.'
}
