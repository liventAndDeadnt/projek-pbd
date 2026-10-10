import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { EmptyState, Field, FormActions, Modal, PageHeader, Toast } from '../../shared/components'
import { useAuth } from '../identity/useAuth'
import { listBarang, listSatuan } from './catalog.api'
import type { Barang, Satuan } from './catalog.types'

type CatalogKind = 'barang' | 'satuan'
type Draft = { nama: string; jenis: string; idsatuan: string; harga: string; status: string }
const emptyDraft = (): Draft => ({ nama: '', jenis: '', idsatuan: '', harga: '', status: '1' })

export default function CatalogPage({ kind }: { kind: CatalogKind }) {
  const { user } = useAuth()
  const admin = user?.role === 'admin'
  const [rows, setRows] = useState<(Barang | Satuan)[]>([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Barang | Satuan | null>(null)
  const [deleting, setDeleting] = useState<Barang | Satuan | null>(null)
  const [detail, setDetail] = useState<Barang | Satuan | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState('')
  const title = kind === 'barang' ? 'Barang' : 'Satuan'

  useEffect(() => {
    let alive = true
    const request = kind === 'barang' ? listBarang(query, status) : listSatuan(status)
    request
      .then((data) => { if (alive) { setRows(data); setState('success') } })
      .catch(() => { if (alive) setState('error') })
    return () => { alive = false }
  }, [kind, query, status, reloadKey])

  const list = useMemo(() => rows, [rows])
  function openCreate() { setEditing(null); setDraft(emptyDraft()); setFormError(''); setFormOpen(true) }
  function openEdit(row: Barang | Satuan) {
    setEditing(row)
    setDraft(kind === 'barang' ? { nama: (row as Barang).nama, jenis: (row as Barang).jenis, idsatuan: String((row as Barang).idsatuan), harga: String((row as Barang).harga), status: String(row.status) } : { ...emptyDraft(), nama: (row as Satuan).nama_satuan, status: String(row.status) })
    setFormError(''); setFormOpen(true)
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (kind === 'barang' && Number(draft.harga) < 0) { setFormError('Harga dasar tidak boleh negatif.'); return }
    setFormOpen(false)
    setToast(`Perubahan selesai.`)
  }
  function confirmDelete() { setDeleting(null); setToast(`Proses selesai.`) }

  return <div className="module-page">
    <PageHeader eyebrow="MASTER DATA · KATALOG" title={title} description={kind === 'barang' ? 'Referensi barang yang digunakan pada proses pengadaan dan penjualan.' : 'Satuan yang digunakan untuk mencatat barang.'} action={admin ? <button className="button button--primary" onClick={openCreate}>＋ Tambah {title.toLowerCase()}</button> : undefined} />
    <section className="panel-card resource-panel"><div className="resource-toolbar"><label className="search-box"><span>⌕</span><input aria-label={`Cari ${title.toLowerCase()}`} placeholder={`Cari ${title.toLowerCase()}…`} value={query} onChange={(event) => { setState('loading'); setQuery(event.target.value) }} /></label><div className="toolbar-controls"><select aria-label="Filter status" value={status} onChange={(event) => { setState('loading'); setStatus(event.target.value) }}><option value="">Semua status</option><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select><span className="result-count">{state === 'success' ? `${list.length} data` : 'Memuat…'}</span></div></div>
      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert"><strong>Gagal memuat data katalog.</strong><span>Coba muat ulang halaman.</span><button className="button button--secondary button--small" onClick={() => setReloadKey((n) => n + 1)}>Coba lagi</button></div>}
      {state === 'success' && list.length === 0 && <EmptyState title={`Belum ada data ${title.toLowerCase()}.`} detail={query ? 'Coba kata pencarian lain.' : 'Data katalog belum tersedia.'} />}
      {state === 'success' && list.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr>{kind === 'barang' ? <><th>Nama barang</th><th>Jenis</th><th>Satuan</th><th>Harga dasar</th><th>Status</th></> : <><th>Nama satuan</th><th>Status</th></>}{admin && <th>Aksi</th>}</tr></thead><tbody>{list.map((row) => kind === 'barang' ? <BarangRow key={(row as Barang).idbarang} row={row as Barang} admin={admin} onDetail={() => setDetail(row)} onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} /> : <SatuanRow key={(row as Satuan).idsatuan} row={row as Satuan} admin={admin} onDetail={() => setDetail(row)} onEdit={() => openEdit(row)} onDelete={() => setDeleting(row)} />)}</tbody></table></div>}
      <div className="table-footer"><span>{state === 'success' ? `Menampilkan ${list.length} data` : ' '}</span><div><button disabled className="button button--secondary button--small">Sebelumnya</button><span className="page-count">1</span><button disabled className="button button--secondary button--small">Lanjut</button></div></div>
    </section>
    {formOpen && <Modal title={`${editing ? 'Ubah' : 'Tambah'} ${title.toLowerCase()}`} onClose={() => setFormOpen(false)}><form onSubmit={submit}><div className="form-grid">{kind === 'barang' ? <><Field label="Nama barang" required><input value={draft.nama} onChange={(event) => setDraft({ ...draft, nama: event.target.value })} maxLength={45} required /></Field><Field label="Jenis" required hint="Masukkan kode jenis satu karakter."><input value={draft.jenis} onChange={(event) => setDraft({ ...draft, jenis: event.target.value.slice(0, 1) })} maxLength={1} required /></Field><Field label="ID satuan" required><input type="number" min="1" value={draft.idsatuan} onChange={(event) => setDraft({ ...draft, idsatuan: event.target.value })} required /></Field><Field label="Harga dasar" required><input type="number" min="0" value={draft.harga} onChange={(event) => setDraft({ ...draft, harga: event.target.value })} required /></Field><StatusField draft={draft} setDraft={setDraft} /></> : <><Field label="Nama satuan" required><input value={draft.nama} onChange={(event) => setDraft({ ...draft, nama: event.target.value })} maxLength={45} required /></Field><StatusField draft={draft} setDraft={setDraft} /></>}</div>{formError && <p className="field-error" role="alert">{formError}</p>}<FormActions onCancel={() => setFormOpen(false)} submit="Simpan" /></form></Modal>}
    {deleting && <Modal title={`Hapus ${title.toLowerCase()}?`} onClose={() => setDeleting(null)}><p className="confirm-copy">{kind === 'barang' ? (deleting as Barang).nama : (deleting as Satuan).nama_satuan} dipilih untuk dihapus.</p><div className="form-actions"><button className="button button--secondary" onClick={() => setDeleting(null)}>Batal</button><button className="button button--danger" onClick={confirmDelete}>Hapus</button></div></Modal>}
    {detail && <Modal title="Detail katalog" onClose={() => setDetail(null)}><dl className="detail-list">{Object.entries(detail).filter(([key]) => key !== 'idbarang' && key !== 'idsatuan').map(([key, value]) => <div key={key}><dt>{key.replaceAll('_', ' ')}</dt><dd>{key === 'status' ? Number(value) ? 'Aktif' : 'Nonaktif' : key === 'harga' ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)) : String(value)}</dd></div>)}</dl></Modal>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

function StatusField({ draft, setDraft }: { draft: Draft; setDraft: (value: Draft) => void }) { return <Field label="Status" required><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></Field> }
function RowActions({ onDetail, onEdit, onDelete }: { onDetail: () => void; onEdit: () => void; onDelete: () => void }) { return <div className="row-actions"><button onClick={onDetail}>Detail</button><button onClick={onEdit}>Ubah</button><button className="row-action-danger" onClick={onDelete}>Hapus</button></div> }
function BarangRow({ row, admin, onDetail, onEdit, onDelete }: { row: Barang; admin: boolean; onDetail: () => void; onEdit: () => void; onDelete: () => void }) { return <tr><td><strong>{row.nama}</strong></td><td>{row.jenis}</td><td>{row.nama_satuan}</td><td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.harga)}</td><td><span className={`state-pill${row.status ? '' : ' state-pill--off'}`}>{row.status ? 'Aktif' : 'Nonaktif'}</span></td>{admin && <td><RowActions {...{ onDetail, onEdit, onDelete }} /></td>}</tr> }
function SatuanRow({ row, admin, onDetail, onEdit, onDelete }: { row: Satuan; admin: boolean; onDetail: () => void; onEdit: () => void; onDelete: () => void }) { return <tr><td><strong>{row.nama_satuan}</strong></td><td><span className={`state-pill${row.status ? '' : ' state-pill--off'}`}>{row.status ? 'Aktif' : 'Nonaktif'}</span></td>{admin && <td><RowActions {...{ onDetail, onEdit, onDelete }} /></td>}</tr> }
