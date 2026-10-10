import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, Field, FormActions, Modal, PageHeader, Toast } from '../../shared/components'
import { resources } from '../mock/resources'
import { useAuth } from '../identity/useAuth'

export default function ReturnPage({ startOpen = false }: { startOpen?: boolean }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(startOpen)
  const [toast, setToast] = useState('')
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  function closeForm() { setOpen(false); if (startOpen) navigate('/retur') }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setOpen(false); setConfirming(true) }
  return <div className="module-page"><PageHeader eyebrow="GUDANG · RETUR VENDOR" title="Retur barang" description="Catat pengembalian item kepada vendor berdasarkan penerimaan." action={user?.role !== 'purchasing' && <button className="button button--primary" onClick={() => setOpen(true)}>＋ Buat retur</button>} /><section className="panel-card workflow-panel"><div className="workflow-title"><div><h2>Alur retur</h2><p>Penerimaan → Pilih item → Jumlah & alasan → Konfirmasi</p></div></div><div className="process-steps">{['Penerimaan', 'Barang', 'Jumlah & alasan', 'Konfirmasi'].map((step, i) => <div className="process-step" key={step}><span>{`0${i + 1}`}</span><strong>{step}</strong></div>)}</div></section><section className="panel-card resource-panel"><div className="table-toolbar"><div><h2>Riwayat retur</h2><p>Daftar retur ke vendor</p></div><label className="search-box"><span>⌕</span><input placeholder="Cari ID retur…" aria-label="Cari retur" /></label></div><div className="table-scroll"><table className="data-table"><thead><tr>{resources.retur.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Aksi</th></tr></thead><tbody /></table></div><EmptyState title="Belum ada retur." detail="Belum ada riwayat retur." /></section>
    {open && <Modal title="Buat retur" description="Isi detail pengembalian." onClose={closeForm}><form onSubmit={submit}><div className="form-grid"><Field label="ID Penerimaan" required><input placeholder="Masukkan referensi penerimaan" required /></Field><Field label="Barang" required><input placeholder="Nama barang" required /></Field><Field label="Jumlah" required><input type="number" min="1" placeholder="0" required /></Field><Field label="Alasan" required hint={`${reason.length}/200 karakter`}><textarea value={reason} onChange={(event) => setReason(event.target.value.slice(0, 200))} rows={4} maxLength={200} required /></Field></div><FormActions onCancel={closeForm} submit="Lanjutkan" /></form></Modal>}
    {confirming && <Modal title="Konfirmasi retur?" description="Retur adalah pengembalian barang kepada vendor." onClose={() => { setConfirming(false); if (startOpen) navigate('/retur') }}><div className="form-actions"><button className="button button--secondary" onClick={() => { setConfirming(false); if (startOpen) navigate('/retur') }}>Kembali</button><button className="button button--danger" onClick={() => { setConfirming(false); if (startOpen) navigate('/retur'); setToast('Retur selesai.') }}>Konfirmasi</button></div></Modal>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}
