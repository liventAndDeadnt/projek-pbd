import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, Field, PageHeader, StatCard, Toast } from '../../shared/components'
import { Icon } from '../../shared/icons'
import { REPORTS } from './reports'

export default function ReportsPage() {
  const { report: routeReport } = useParams()
  const active = REPORTS.some((item) => item.key === routeReport) ? routeReport! : REPORTS[0]!.key
  const report = REPORTS.find((item) => item.key === active) ?? REPORTS[0]!
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [toast, setToast] = useState('')

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Pelaporan"
        title={`Laporan ${report.label.toLowerCase()}`}
        description={report.description}
        action={
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => setToast('Data laporan belum tersedia untuk diekspor.')}
          >
            <Icon name="chart" size={15} />
            Ekspor / cetak
          </button>
        }
      />

      <div className="tabs report-tabs" role="tablist" aria-label="Jenis laporan">
        {REPORTS.map((item) => (
          <Link
            key={item.key}
            role="tab"
            aria-selected={active === item.key}
            className={`tab${active === item.key ? ' is-active' : ''}`}
            to={`/laporan/${item.key}`}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Filter laporan</h2>
            <p>Pilih rentang tanggal dan status data.</p>
          </div>
        </div>
        <div className="report-filters">
          <Field label="Dari tanggal">
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </Field>
          <Field label="Sampai tanggal">
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </Field>
          {active !== 'stok' && (
            <Field label="Status">
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">Semua status</option>
                <option value="aktif">Aktif</option>
                <option value="selesai">Selesai</option>
              </select>
            </Field>
          )}
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setToast('Filter laporan diterapkan pada tampilan.')}
          >
            Terapkan filter
          </button>
        </div>
      </section>

      <section className="stat-grid report-summary" aria-label="Ringkasan laporan">
        <StatCard label="Jumlah baris" value={0} note="Belum ada data" icon="layers" />
        <StatCard label="Total nilai" value="Rp 0" note="Belum ada data" icon="chart" />
        <StatCard
          label="Periode laporan"
          value={from || to ? `${from || '…'} — ${to || '…'}` : 'Pilih tanggal'}
          note="Filter tanggal di atas"
          icon="calendar"
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Rincian laporan {report.label.toLowerCase()}</h2>
            <p>Ringkasan dan rincian data laporan.</p>
          </div>
          <button
            className="btn btn--secondary btn--sm"
            type="button"
            onClick={() => setToast('Laporan belum tersedia untuk dicetak.')}
          >
            Cetak
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {report.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="chart"
          title="Belum ada data laporan."
          detail="Laporan akan tampil setelah modul transaksi dan view laporan tersedia."
        />
      </section>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
