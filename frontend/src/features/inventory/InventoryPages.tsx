import { useState } from 'react'
import { EmptyState, PageHeader, StatCard, Toast } from '../../shared/components'
import { Icon } from '../../shared/icons'

const VIEWS = ['Ringkasan stok', 'Kartu stok'] as const

export function InventoryPage({ initialView = 'Ringkasan stok' }: { initialView?: string }) {
  const [view, setView] = useState(initialView)
  const [query, setQuery] = useState('')
  const [type, setType] = useState('Semua transaksi')
  const [toast, setToast] = useState('')

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Persediaan"
        title="Stok & kartu stok"
        description="Ledger baca-saja untuk pergerakan barang masuk dan keluar."
        action={
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => setToast('Data stok belum tersedia untuk diekspor.')}
          >
            <Icon name="chart" size={15} />
            Ekspor
          </button>
        }
      />

      <div className="tabs" role="tablist" aria-label="Tampilan persediaan">
        {VIEWS.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={view === item}
            className={`tab${view === item ? ' is-active' : ''}`}
            onClick={() => setView(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>

      {view === 'Ringkasan stok' ? (
        <>
          <section className="stat-grid" aria-label="Ringkasan stok">
            <StatCard label="Total barang" value={0} note="Belum tersedia" icon="box" />
            <StatCard label="Stok menipis" value={0} note="Belum tersedia" icon="alert" />
            <StatCard label="Barang aktif" value={0} note="Belum tersedia" icon="check" />
            <StatCard label="Mutasi periode ini" value={0} note="Belum tersedia" icon="rotate" />
          </section>

          <section className="card">
            <div className="toolbar">
              <label className="search-field">
                <Icon name="search" size={15} />
                <input
                  aria-label="Cari barang stok"
                  placeholder="Cari barang…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="toolbar-actions">
                <span className="result-count">0 barang</span>
              </div>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Barang</th>
                    <th>Satuan</th>
                    <th className="num">Stok masuk</th>
                    <th className="num">Stok keluar</th>
                    <th className="num">Saldo</th>
                  </tr>
                </thead>
                <tbody />
              </table>
            </div>
            <EmptyState
              icon="package"
              title="Belum ada data stok."
              detail="Saldo barang akan tersedia setelah trigger kartu stok dan modul transaksi berjalan."
            />
          </section>
        </>
      ) : (
        <section className="card">
          <div className="toolbar">
            <label className="search-field">
              <Icon name="search" size={15} />
              <input
                aria-label="Cari kartu stok"
                placeholder="Cari barang…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="toolbar-actions">
              <select
                className="select"
                aria-label="Filter jenis transaksi"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                <option>Semua transaksi</option>
                <option>Masuk</option>
                <option>Keluar</option>
              </select>
              <span className="result-count">0 mutasi</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Barang</th>
                  <th>Jenis transaksi</th>
                  <th className="num">Masuk</th>
                  <th className="num">Keluar</th>
                  <th className="num">Saldo</th>
                  <th>ID transaksi</th>
                </tr>
              </thead>
              <tbody />
            </table>
          </div>
          <EmptyState
            icon="clipboard"
            title="Belum ada mutasi stok."
            detail="Kartu stok akan terisi otomatis dari penerimaan, penjualan, dan retur."
          />
        </section>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
