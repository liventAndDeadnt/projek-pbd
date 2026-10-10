import { useEffect, useState } from 'react'
import { EmptyState, PageHeader } from '../../shared/components'
import { listVendor } from './catalog.api'
import type { Vendor } from './catalog.types'

type LoadState = 'loading' | 'success' | 'error'

export default function VendorPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [state, setState] = useState<LoadState>('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    listVendor(search, status)
      .then((data) => {
        if (active) {
          setVendors(data)
          setState('success')
        }
      })
      .catch(() => {
        if (active) setState('error')
      })

    return () => { active = false }
  }, [search, status, reloadKey])

  return <div className="module-page">
    <PageHeader
      eyebrow="MASTER DATA · KATALOG"
      title="Vendor"
      description="Daftar vendor yang menjadi referensi proses pengadaan."
    />

    <section className="panel-card resource-panel">
      <div className="resource-toolbar">
        <label className="search-box">
          <span>⌕</span>
          <input
            aria-label="Cari vendor"
            placeholder="Cari nama vendor…"
            value={search}
            onChange={(event) => {
              setState('loading')
              setSearch(event.target.value)
            }}
          />
        </label>
        <div className="toolbar-controls">
          <select aria-label="Filter status vendor" value={status} onChange={(event) => {
            setState('loading')
            setStatus(event.target.value)
          }}>
            <option value="">Semua status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
          <span className="result-count">{state === 'success' ? `${vendors.length} data` : 'Memuat…'}</span>
        </div>
      </div>

      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data vendor…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert">
        <strong>Gagal memuat data vendor.</strong>
        <span>Periksa koneksi atau coba lagi.</span>
        <button className="button button--secondary button--small" onClick={() => {
          setState('loading')
          setReloadKey((key) => key + 1)
        }}>Coba lagi</button>
      </div>}
      {state === 'success' && vendors.length === 0 && <EmptyState
        title="Vendor tidak ditemukan."
        detail={search || status ? 'Coba ubah pencarian atau filter status.' : 'Data vendor belum tersedia.'}
      />}
      {state === 'success' && vendors.length > 0 && <div className="table-scroll">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Nama vendor</th><th>Badan hukum</th><th>Status</th></tr></thead>
          <tbody>{vendors.map((vendor) => <tr key={vendor.idvendor}>
            <td>{vendor.idvendor}</td>
            <td><strong>{vendor.nama_vendor}</strong></td>
            <td>{vendor.badan_hukum === 'Y' ? 'Ya' : vendor.badan_hukum === 'N' ? 'Tidak' : vendor.badan_hukum}</td>
            <td><span className={`state-pill${vendor.status === '1' ? '' : ' state-pill--off'}`}>{vendor.status === '1' ? 'Aktif' : 'Nonaktif'}</span></td>
          </tr>)}</tbody>
        </table>
      </div>}

      <div className="table-footer">
        <span>{state === 'success' ? `Menampilkan ${vendors.length} vendor` : ' '}</span>
      </div>
    </section>
  </div>
}
