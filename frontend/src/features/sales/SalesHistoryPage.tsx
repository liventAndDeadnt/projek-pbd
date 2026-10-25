import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, Field, PageHeader, StatCard, Toast } from '../../shared/components'
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'

export default function SalesHistoryPage() {
  const { user } = useAuth()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [toast, setToast] = useState('')

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Penjualan"
        title="Riwayat penjualan"
        description="Daftar transaksi penjualan beserta ringkasan nilai dan statusnya."
        action={
          user?.role === 'kasir' ? (
            <Link className="btn btn--primary" to="/pos">
              <Icon name="cart" size={15} />
              Buka POS
            </Link>
          ) : undefined
        }
      />

      <section className="stat-grid stat-grid--three" aria-label="Ringkasan penjualan">
        <StatCard label="Transaksi" value={0} note="Belum tersedia" icon="receipt" />
        <StatCard label="Total penjualan" value="Rp 0" note="Belum tersedia" icon="cart" />
        <StatCard label="Rata-rata transaksi" value="Rp 0" note="Belum tersedia" icon="chart" />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Filter riwayat</h2>
            <p>Pilih rentang tanggal dan status transaksi.</p>
          </div>
        </div>
        <div className="report-filters">
          <Field label="Dari tanggal">
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="Sampai tanggal">
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Semua status</option>
              <option value="selesai">Selesai</option>
              <option value="draft">Draft</option>
            </select>
          </Field>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setToast('Filter diterapkan pada tampilan.')}
          >
            Terapkan filter
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Daftar transaksi</h2>
            <p>Transaksi akan tampil setelah modul penjualan terhubung ke API.</p>
          </div>
          <button
            className="btn btn--secondary btn--sm"
            type="button"
            onClick={() => setToast('Data penjualan belum tersedia untuk diekspor.')}
          >
            <Icon name="chart" size={14} />
            Ekspor
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID penjualan</th>
                <th>Waktu</th>
                <th>Kasir</th>
                <th className="num">Item</th>
                <th className="num">Subtotal</th>
                <th className="num">PPN</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="receipt"
          title="Belum ada transaksi."
          detail="Riwayat penjualan akan muncul di sini setelah transaksi tersimpan ke basis data."
          action={
            user?.role === 'kasir' ? (
              <Link className="btn btn--secondary btn--sm" to="/pos">
                Mulai transaksi
              </Link>
            ) : undefined
          }
        />
      </section>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
