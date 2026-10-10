import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState, Field, Modal, PageHeader, StatusBadge, Toast } from '../../shared/components'
import { useAuth } from '../identity/useAuth'

type ReceiveLine = { name: string; ordered: string; received: string; incoming: string }
const newLine = (): ReceiveLine => ({ name: '', ordered: '', received: '0', incoming: '' })

export function ReceivingPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('view') === 'riwayat' ? 'Riwayat' : 'Antrian'
  return <div className="module-page">
    <PageHeader eyebrow="GUDANG · PENERIMAAN" title="Penerimaan barang" description="Terima barang dari pengadaan secara bertahap dan pantau sisa kuantitas." action={user?.role !== 'purchasing' && <Link className="button button--primary" to="/penerimaan/baru">＋ Buat penerimaan</Link>} />
    
    <div className="workflow-banner"><div className="workflow-banner-icon">↧</div><div><strong>Penerimaan dapat dilakukan dalam beberapa batch</strong><p>Pantau jumlah diterima dan sisa kuantitas pada setiap batch.</p></div><div className="workflow-tags"><StatusBadge tone="blue">Draft</StatusBadge><StatusBadge tone="amber">Partial</StatusBadge><StatusBadge tone="green">Completed</StatusBadge></div></div>
    <section className="panel-card resource-panel"><div className="filter-tabs" role="tablist" aria-label="Jenis daftar penerimaan">{['Antrian', 'Riwayat'].map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'filter-tab filter-tab--active' : 'filter-tab'} onClick={() => setSearchParams(item === 'Riwayat' ? { view: 'riwayat' } : {})}>{item}</button>)}</div><div className="table-scroll"><table className="data-table"><thead><tr>{['Pengadaan', 'Vendor', 'Item', 'Dipesan', 'Diterima', 'Sisa', 'Status', 'Aksi'].map((item) => <th key={item}>{item}</th>)}</tr></thead><tbody /></table></div><EmptyState title={tab === 'Antrian' ? 'Tidak ada penerimaan dalam antrean.' : 'Belum ada riwayat penerimaan.'} detail="Belum ada penerimaan untuk ditampilkan." /></section>
  </div>
}

export function ReceivingFormPage() {
  const navigate = useNavigate()
  const [po, setPo] = useState('')
  const [lines, setLines] = useState<ReceiveLine[]>([newLine()])
  const [toast, setToast] = useState('')
  const [confirming, setConfirming] = useState(false)
  function update(index: number, key: keyof ReceiveLine, value: string) { setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line)) }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setConfirming(true) }
  return <div className="module-page">
    <PageHeader eyebrow="GUDANG · PENERIMAAN" title="Buat batch penerimaan" description="Masukkan jumlah yang diterima pada batch ini." action={<button className="button button--secondary" onClick={() => navigate('/penerimaan')}>← Kembali</button>} />
    
    <form className="form-layout" onSubmit={submit}><div className="panel-card form-section"><div className="form-section-heading"><span className="section-number">01</span><div><h2>Referensi pengadaan</h2><p>Pilih pengadaan untuk penerimaan.</p></div></div><div className="form-grid"><Field label="ID Pengadaan" required><input value={po} onChange={(event) => setPo(event.target.value)} placeholder="Masukkan ID pengadaan" required /></Field><Field label="Catatan batch"><input placeholder="Catatan opsional" /></Field></div><div className="section-divider"/><div className="form-section-heading"><span className="section-number">02</span><div><h2>Barang yang diterima</h2><p>Ordered, received, dan remaining ditampilkan per item.</p></div><button type="button" className="button button--secondary button--small" onClick={() => setLines((current) => [...current, newLine()])}>＋ Tambah barang</button></div><div className="receiving-lines">{lines.map((line, index) => { const ordered = Number(line.ordered) || 0; const received = Number(line.received) || 0; const incoming = Number(line.incoming) || 0; const maxIncoming = Math.max(0, ordered - received); const remaining = Math.max(0, maxIncoming - incoming); const progress = ordered ? Math.min(100, (received + incoming) / ordered * 100) : 0; return <div className="receiving-line" key={index}><Field label="Barang" required><input value={line.name} onChange={(event) => update(index, 'name', event.target.value)} placeholder="Nama barang" required /></Field><Field label="Dipesan"><input type="number" min="0" value={line.ordered} onChange={(event) => update(index, 'ordered', event.target.value)} placeholder="0" /></Field><Field label="Sudah diterima"><input type="number" min="0" value={line.received} onChange={(event) => update(index, 'received', event.target.value)} /></Field><Field label="Diterima batch ini" required><input type="number" min="1" max={ordered > 0 ? maxIncoming : undefined} value={line.incoming} onChange={(event) => update(index, 'incoming', event.target.value)} placeholder="0" required /></Field><div className="remaining-box"><span>Sisa setelah batch</span><strong>{remaining}</strong><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div><button className="icon-button" type="button" aria-label="Hapus item" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, i) => i !== index))}>×</button></div> })}</div><div className="form-actions"><button className="button button--secondary" type="button" onClick={() => navigate('/penerimaan')}>Batal</button><button className="button button--secondary" type="button" onClick={() => setToast('Draft penerimaan selesai.')}>Simpan draft</button><button className="button button--primary" type="submit">Konfirmasi</button></div></div></form>
    {confirming && <Modal title="Konfirmasi batch penerimaan?" description="Pastikan jumlah batch sudah sesuai draft." onClose={() => setConfirming(false)}><div className="form-actions"><button className="button button--secondary" onClick={() => setConfirming(false)}>Kembali</button><button className="button button--primary" onClick={() => { setConfirming(false); setToast('Penerimaan selesai.') }}>Konfirmasi</button></div></Modal>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

export function ReceivingDetailPage() {
  const { id } = useParams()
  return <div className="module-page"><PageHeader eyebrow="GUDANG · DETAIL PENERIMAAN" title="Detail penerimaan" description={`Referensi ${id ?? '—'} · Rincian batch dan sisa kuantitas.`} action={<Link className="button button--secondary" to="/penerimaan">← Kembali ke daftar</Link>} /><section className="detail-workflow panel-card"><div className="detail-workflow-heading"><div><span className="eyebrow">PROGRES PENERIMAAN</span><h2>Belum ada batch penerimaan</h2><p>PO → batch penerimaan → sisa → batch berikutnya → selesai</p></div><StatusBadge tone="blue">Draft</StatusBadge></div><div className="process-steps">{['Dipesan', 'Diterima sebagian', 'Sisa diproses', 'Selesai'].map((step, index) => <div className="process-step" key={step}><span>{`0${index + 1}`}</span><strong>{step}</strong></div>)}</div></section><section className="panel-card resource-panel"><div className="table-toolbar"><div><h2>Rincian barang</h2><p>Jumlah dipesan, diterima sebelumnya, batch ini, dan sisa</p></div><Link className="button button--primary button--small" to="/penerimaan/baru">Buat batch</Link></div><div className="table-scroll"><table className="data-table"><thead><tr>{['Barang', 'Dipesan', 'Diterima sebelumnya', 'Batch ini', 'Sisa', 'Status'].map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody /></table></div><EmptyState title="Belum ada item penerimaan." detail="Belum ada item untuk ditampilkan." /></section></div>
}
