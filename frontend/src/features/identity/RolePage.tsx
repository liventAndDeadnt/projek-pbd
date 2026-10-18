import { useEffect, useState } from 'react'
import { ApiError } from '../../shared/api'
import { EmptyState, PageHeader } from '../../shared/components'
import { listRoles } from './identity.api'
import type { Role } from './identity.types'

type LoadState = 'loading' | 'success' | 'error'

export default function RolePage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState('')
  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    listRoles(search)
      .then((data) => {
        if (active) {
          setRoles(data)
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
  }, [search, reloadKey])

  return <div className="module-page">
    <PageHeader
      eyebrow="PENGELOLAAN AKSES"
      title="Role"
      description="Daftar role yang tersedia untuk akun pengguna internal."
    />

    <section className="panel-card resource-panel">
      <div className="resource-toolbar">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Cari role"
            placeholder="Cari nama role…"
            value={search}
            onChange={(event) => {
              setState('loading')
              setErrorMessage('')
              setSearch(event.target.value)
            }}
          />
        </label>
        <div className="toolbar-controls">
          <span className="result-count">{state === 'success' ? `${roles.length} data` : 'Memuat…'}</span>
        </div>
      </div>

      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data role…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert">
        <strong>Gagal memuat data role.</strong>
        <span>{errorMessage}</span>
        <button className="button button--secondary button--small" onClick={() => {
          setState('loading')
          setErrorMessage('')
          setReloadKey((key) => key + 1)
        }}>Coba lagi</button>
      </div>}
      {state === 'success' && roles.length === 0 && <EmptyState
        title="Role tidak ditemukan."
        detail={search ? 'Coba gunakan kata pencarian lain.' : 'Belum ada data role untuk ditampilkan.'}
      />}
      {state === 'success' && roles.length > 0 && <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Nama role</th></tr></thead>
          <tbody>{roles.map((role) => <tr key={role.idrole}>
            <td>{role.idrole}</td>
            <td><strong>{role.nama_role}</strong></td>
          </tr>)}</tbody>
        </table>
      </div>}

      <div className="table-footer">
        <span>{state === 'success' ? `Menampilkan ${roles.length} role` : ' '}</span>
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
  return 'Tidak dapat terhubung ke backend. Pastikan backend berjalan di port 8080 dan view v_role_detail tersedia.'
}
