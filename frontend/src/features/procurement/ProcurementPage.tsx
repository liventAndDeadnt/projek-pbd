import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState, Field, Modal, PageHeader, StatusBadge, Toast } from '../../shared/components'
import { formatMoney } from '../../shared/format'
import { useAuth } from '../identity/useAuth'

type DraftLine = { name: string; price: string; qty: string }
const emptyLine = (): DraftLine => ({ name: '', price: '', qty: '' })
const statusSteps = ['Pending', 'Approved', 'Partial', 'Completed']

export function ProcurementPage() {
  const [status, setStatus] = useState('Semua status')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const tabs = ['Semua status', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Partial', 'Completed']
  return <div className="module-page">
    <PageHeader eyebrow="PROCUREMENT" title="Pengadaan" description="Buat dan pantau permintaan pengadaan barang." action={<Link className="button button--primary" to="/pengadaan/baru">＋ Buat pengadaan</Link>} />
    
    <section className="panel-card workflow-panel"><div className="workflow-title"><div><h2>Alur pengadaan</h2><p>Vendor → Pengadaan → Approval → Penerimaan → Selesai</p></div></div><div className="process-steps">{statusSteps.map((step, index) => <div className="process-step" key={step}><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></div>)}</div></section>
    <section className="panel-card resource-panel"><div className="table-toolbar"><div><h2>Daftar pengadaan</h2><p>Belum ada data pengadaan.</p></div><label className="search-box"><span>⌕</span><input aria-label="Cari pengadaan" placeholder="Cari ID pengadaan…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div><div className="filter-tabs" role="tablist" aria-label="Filter status pengadaan">{tabs.map((tab) => <button role="tab" aria-selected={status === tab} className={status === tab ? 'filter-tab filter-tab--active' : 'filter-tab'} key={tab} onClick={() => setStatus(tab)}>{tab}</button>)}</div><div className="table-scroll"><table className="data-table"><thead><tr>{['ID Pengadaan', 'Vendor', 'Pemohon', 'Tanggal', 'Subtotal', 'PPN', 'Total', 'Status', 'Aksi'].map((head) => <th key={head}>{head}</th>)}</tr></thead><tbody /></table></div><EmptyState title={query ? 'Tidak ada pengadaan yang cocok.' : status === 'Semua status' ? 'Belum ada pengadaan.' : `Belum ada pengadaan berstatus ${status}.`} detail="Belum ada pengadaan untuk ditampilkan." /><div className="table-footer"><span>0 pengadaan</span><div><button disabled className="button button--secondary button--small">Sebelumnya</button><span className="page-count">1</span><button disabled className="button button--secondary button--small">Lanjut</button></div></div></section>
    <section className="workflow-actions"><div><strong>Perlu membuat permintaan?</strong><span>Susun beberapa item dan lihat ringkasan biaya.</span></div><Link className="text-link" to="/pengadaan/baru">Buat pengadaan <span>→</span></Link></section>
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

export function ProcurementDetailPage() {
  const { id } = useParams()
  const [toast, setToast] = useState('')
  const [confirmAction, setConfirmAction] = useState('')
  return <div className="module-page"><PageHeader eyebrow="PROCUREMENT · DETAIL" title="Detail pengadaan" description={`Referensi ${id ?? '—'} · Rincian vendor, pemohon, dan item pengadaan.`} action={<Link className="button button--secondary" to="/pengadaan">← Kembali ke daftar</Link>} />
    <section className="panel-card detail-workflow"><div className="detail-workflow-heading"><div><span className="eyebrow">STATUS PENGADAAN</span><h2>Detail belum tersedia</h2><p>Tidak ada record pengadaan untuk ID ini.</p></div><StatusBadge>Data kosong</StatusBadge></div><div className="process-steps">{statusSteps.map((step, index) => <div className="process-step" key={step}><span>{`0${index + 1}`}</span><strong>{step}</strong></div>)}</div></section>
    <div className="dashboard-lower"><section className="panel-card"><div className="panel-heading"><div><span className="panel-icon">▤</span><div><h2>Informasi pengadaan</h2><p>Vendor, pemohon, waktu, subtotal, PPN, total</p></div></div></div><EmptyState title="Belum ada data pengadaan." detail="Belum ada rincian pengadaan." /></section><section className="panel-card"><div className="panel-heading"><div><span className="panel-icon">↧</span><div><h2>Progres penerimaan</h2><p>Ordered, received, remaining</p></div></div></div><EmptyState title="Belum ada detail item." detail="Penerimaan parsial per item." /><div className="panel-action"><button className="button button--secondary button--small" onClick={() => setToast('Selesai.')}>Setujui</button><button className="button button--danger button--small" onClick={() => setConfirmAction('pembatalan')}>Batalkan</button></div></section></div>{confirmAction && <Modal title="Konfirmasi pembatalan?" description="Tindakan ini akan membatalkan pengadaan." onClose={() => setConfirmAction('')}><p className="confirm-copy">Tinjau kembali tindakan ini sebelum melanjutkan.</p><div className="form-actions"><button className="button button--secondary" onClick={() => setConfirmAction('')}>Kembali</button><button className="button button--danger" onClick={() => { setConfirmAction(''); setToast('Pembatalan selesai.') }}>Konfirmasi</button></div></Modal>}{toast && <Toast message={toast} onClose={() => setToast('')} />}</div>
}

export function ProcurementFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState('')
  const [ppn, setPpn] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [toast, setToast] = useState('')
  const subtotal = lines.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0)
  const tax = subtotal * (Number(ppn) || 0) / 100
  const total = subtotal + tax

  function updateLine(index: number, key: keyof DraftLine, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setToast('Pengadaan selesai.')
  }

  return <div className="module-page">
    <PageHeader eyebrow="PROCUREMENT · PENGADAAN" title="Buat pengadaan" description="Susun vendor dan item. Tinjau nilai pengadaan sebelum disimpan." action={<button className="button button--secondary" onClick={() => navigate('/pengadaan')}>← Kembali</button>} />
    
    <form className="form-layout" onSubmit={submit}>
      <div className="form-main">
        <section className="panel-card form-section"><div className="form-section-heading"><span className="section-number">01</span><div><h2>Informasi pengadaan</h2><p>Pemohon diambil dari sesi login.</p></div></div><div className="form-grid"><Field label="Vendor" required hint="Pilih atau masukkan vendor."><input value={vendor} onChange={(event) => setVendor(event.target.value)} placeholder="Nama vendor" required /></Field><Field label="Pemohon"><input value={user?.username ?? 'Pengguna aktif'} readOnly /></Field><Field label="Catatan"><textarea rows={3} placeholder="Catatan opsional untuk permintaan" /></Field></div></section>
        <section className="panel-card form-section"><div className="form-section-heading"><span className="section-number">02</span><div><h2>Item pengadaan</h2><p>Tambah atau hapus item pengadaan.</p></div><button className="button button--secondary button--small" type="button" onClick={() => setLines((current) => [...current, emptyLine()])}>＋ Tambah item</button></div><div className="line-items">{lines.map((line, index) => <div className="line-item" key={index}><div className="line-item-number">{String(index + 1).padStart(2, '0')}</div><Field label="Barang" required><input value={line.name} onChange={(event) => updateLine(index, 'name', event.target.value)} placeholder="Nama barang" required /></Field><Field label="Harga satuan" required><input type="number" min="0" value={line.price} onChange={(event) => updateLine(index, 'price', event.target.value)} placeholder="0" required /></Field><Field label="Jumlah" required><input type="number" min="1" value={line.qty} onChange={(event) => updateLine(index, 'qty', event.target.value)} placeholder="1" required /></Field><strong className="line-subtotal">{formatMoney((Number(line.price) || 0) * (Number(line.qty) || 0))}</strong><button className="icon-button" type="button" aria-label="Hapus baris" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, i) => i !== index))}>×</button></div>)}</div></section>
      </div>
      <aside className="panel-card summary-panel"><div className="form-section-heading"><span className="section-number">03</span><div><h2>Ringkasan</h2><p>Perhitungan total</p></div></div><Field label="PPN (%)" hint="Masukkan tarif PPN yang berlaku."><input type="number" min="0" step="0.01" value={ppn} onChange={(event) => setPpn(event.target.value)} placeholder="0" /></Field><div className="summary-rows"><SummaryRow label="Subtotal" value={formatMoney(subtotal)} /><SummaryRow label={`PPN ${Number(ppn) || 0}%`} value={formatMoney(tax)} /><SummaryRow label="Total" value={formatMoney(total)} strong /></div><div className="status-timeline"><h3>Alur status</h3>{['Pending', 'Approved / Rejected', 'Partial receiving', 'Completed'].map((step, index) => <div className="timeline-step" key={step}><span>{index + 1}</span>{step}</div>)}</div><button className="button button--primary button--full" type="submit">Simpan</button><button className="button button--secondary button--full" type="button" onClick={() => navigate('/pengadaan')}>Batal</button></aside>
    </form>
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className={`summary-row${strong ? ' summary-row--strong' : ''}`}><span>{label}</span><strong>{value}</strong></div> }
