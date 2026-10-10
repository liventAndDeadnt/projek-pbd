import { Link, useParams } from 'react-router-dom'
import { EmptyState, PageHeader, StatusBadge } from '../../shared/components'

export default function ReturnDetailPage() {
  const { id } = useParams()
  return <div className="module-page"><PageHeader eyebrow="RETUR VENDOR · DETAIL" title="Detail retur" description={`Referensi ${id ?? '—'} · Pengembalian barang ke vendor.`} action={<Link className="button button--secondary" to="/retur">← Kembali ke daftar</Link>} /><section className="panel-card detail-workflow"><div className="detail-workflow-heading"><div><span className="eyebrow">STATUS RETUR</span><h2>Data retur belum tersedia</h2><p>Rincian penerimaan dan item retur.</p></div><StatusBadge>Belum ada data</StatusBadge></div><div className="process-steps">{['Penerimaan', 'Pilih item', 'Jumlah & alasan', 'Konfirmasi'].map((step, index) => <div className="process-step" key={step}><span>{`0${index + 1}`}</span><strong>{step}</strong></div>)}</div></section><section className="panel-card resource-panel"><div className="table-scroll"><table className="data-table"><thead><tr>{['Barang', 'Jumlah', 'Alasan'].map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody /></table></div><EmptyState title="Belum ada item retur." detail="Riwayat pergerakan stok terkait retur." /></section></div>
}
