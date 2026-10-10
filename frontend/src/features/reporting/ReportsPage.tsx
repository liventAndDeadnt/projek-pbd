import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, Field, PageHeader, Toast } from '../../shared/components'
import { reports } from '../mock/resources'

export default function ReportsPage() {
  const { report: routeReport } = useParams()
  const active = reports.some((item) => item.key === routeReport) ? routeReport! : reports[0]!.key
  const [toast, setToast] = useState('')
  const report = reports.find((item) => item.key === active) ?? reports[0]!
  return <div className="module-page"><PageHeader eyebrow="PELAPORAN" title={`Laporan ${report.label.toLowerCase()}`} description="Pilih filter untuk melihat data laporan." action={<button className="button button--secondary" onClick={() => setToast('Laporan siap diekspor.')}>⇩ Ekspor / cetak</button>} />
    <div className="page-tabs report-tabs" role="tablist" aria-label="Jenis laporan">{reports.map((item) => <Link key={item.key} role="tab" aria-selected={active === item.key} className={active === item.key ? 'page-tab page-tab--active' : 'page-tab'} to={`/laporan/${item.key}`}>{item.label}</Link>)}</div>
    <section className="panel-card report-filters"><Field label="Dari tanggal"><input type="date" /></Field><Field label="Sampai tanggal"><input type="date" /></Field>{active !== 'stok' && <Field label="Status"><select><option>Semua status</option><option>Aktif</option><option>Selesai</option></select></Field>}<button className="button button--primary" onClick={() => setToast('Filter laporan diterapkan.')}>Terapkan filter</button></section>
    <div className="stat-grid report-summary"><article className="stat-card"><span className="stat-label">Jumlah baris</span><strong className="stat-value">0</strong><span className="stat-note">Belum ada data untuk rentang ini</span></article><article className="stat-card"><span className="stat-label">Total nilai</span><strong className="stat-value">Rp 0</strong><span className="stat-note">Data laporan belum tersedia</span></article><article className="stat-card"><span className="stat-label">Periode laporan</span><strong className="stat-value report-period">Pilih tanggal</strong><span className="stat-note">Filter tanggal di atas</span></article></div>
    <section className="panel-card resource-panel"><div className="table-toolbar"><div><h2>Rincian laporan {report.label.toLowerCase()}</h2><p>Ringkasan dan rincian laporan.</p></div><button className="button button--secondary button--small" onClick={() => setToast('Laporan siap dicetak.')}>Cetak</button></div><div className="table-scroll"><table className="data-table"><thead><tr>{report.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody /></table></div><EmptyState title="Belum ada data laporan." detail="Belum ada data laporan untuk ditampilkan." /></section>
    {toast && <Toast message={toast} onClose={() => setToast('')} />}</div>
}
