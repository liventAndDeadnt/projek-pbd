import { useEffect, useState } from 'react'
import { ApiError } from '../../shared/api'
import { EmptyState, PageHeader } from '../../shared/components'
import { listMarginPenjualan } from './catalog.api'
import type { MarginPenjualan } from './catalog.types'

type LoadState = 'loading' | 'success' | 'error'

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export default function MarginPage() {
  const [margins, setMargins] = useState<MarginPenjualan[]>([])
  const [status, setStatus] = useState('')
  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    listMarginPenjualan(status)
      .then((data) => {
        if (active) {
          setMargins(data)
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
  }, [status, reloadKey])

  return <div className="module-page">
    <PageHeader
      eyebrow="MASTER DATA · PENJUALAN"
      title="Margin penjualan"
      description="Riwayat persentase margin yang digunakan dalam penjualan."
    />

    <section className="panel-card resource-panel">
      <div className="resource-toolbar">
        <div>
          <strong>Daftar margin</strong>
          <p>Persentase, status, dan waktu pencatatan margin.</p>
        </div>
        <div className="toolbar-controls">
          <select aria-label="Filter status margin" value={status} onChange={(event) => {
            setState('loading')
            setErrorMessage('')
            setStatus(event.target.value)
          }}>
            <option value="">Semua status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
          <span className="result-count">{state === 'success' ? `${margins.length} data` : 'Memuat…'}</span>
        </div>
      </div>

      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data margin…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert">
        <strong>Gagal memuat data margin.</strong>
        <span>{errorMessage}</span>
        <button className="button button--secondary button--small" onClick={() => {
          setState('loading')
          setErrorMessage('')
          setReloadKey((key) => key + 1)
        }}>Coba lagi</button>
      </div>}
      {state === 'success' && margins.length === 0 && <EmptyState
        title="Data margin tidak ditemukan."
        detail={status ? 'Coba pilih filter status yang lain.' : 'Belum ada data margin untuk ditampilkan.'}
      />}
      {state === 'success' && margins.length > 0 && <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Persen</th><th>Status</th><th>Dibuat pada</th></tr></thead>
          <tbody>{margins.map((margin) => <tr key={margin.idmargin_penjualan}>
            <td>{margin.idmargin_penjualan}</td>
            <td><strong>{margin.persen == null ? '—' : `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(margin.persen)}%`}</strong></td>
            <td>{margin.status == null
              ? '—'
              : <span className={`state-pill${margin.status === 1 ? '' : ' state-pill--off'}`}>{margin.status === 1 ? 'Aktif' : 'Nonaktif'}</span>}</td>
            <td>{formatCreatedAt(margin.created_at)}</td>
          </tr>)}</tbody>
        </table>
      </div>}

      <div className="table-footer">
        <span>{state === 'success' ? `Menampilkan ${margins.length} data margin` : ' '}</span>
      </div>
    </section>
  </div>
}

function formatCreatedAt(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sesi login tidak terbaca atau sudah berakhir (HTTP 401). Silakan login ulang.'
    if (error.status === 403) return 'Akun yang aktif tidak memiliki akses admin (HTTP 403).'
    return `${error.message} (HTTP ${error.status})`
  }
  return 'Tidak dapat terhubung ke backend. Pastikan backend berjalan di port 8080 dan view v_margin_detail tersedia.'
}
