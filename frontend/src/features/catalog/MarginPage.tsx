import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../shared/api'
import { EmptyState, Field, FormActions, Modal, PageHeader, Toast } from '../../shared/components'
import { useAuth } from '../identity/useAuth'
import { createMargin, deleteMargin, listMarginPenjualan, updateMargin } from './catalog.api'
import type { MarginPenjualan } from './catalog.types'

type LoadState = 'loading' | 'success' | 'error'
type Draft = { persen: string; status: '0' | '1' }
const emptyDraft = (): Draft => ({ persen: '', status: '1' })

const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

export default function MarginPage() {
  const { user } = useAuth()
  const admin = user?.role === 'admin'
  const [margins, setMargins] = useState<MarginPenjualan[]>([])
  const [status, setStatus] = useState('')
  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState<MarginPenjualan | null>(null)
  const [deleting, setDeleting] = useState<MarginPenjualan | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    listMarginPenjualan(status)
      .then((data) => {
        if (active) {
          setMargins(data)
          setState('success')
          setErrorMessage('')
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(getErrorMessage(error))
          setState('error')
        }
      })
    return () => { active = false }
  }, [status, reloadKey])

  function openCreate() {
    setEditing(null)
    setDraft(emptyDraft())
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(margin: MarginPenjualan) {
    setEditing(margin)
    setDraft({ persen: String(margin.persen ?? ''), status: margin.status === 1 ? '1' : '0' })
    setFormError('')
    setFormOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const input = { persen: Number(draft.persen), status: Number(draft.status) as 0 | 1 }
      if (editing) await updateMargin(editing.idmargin_penjualan, input)
      else await createMargin(input)
      setFormOpen(false)
      setToast(`Margin berhasil ${editing ? 'diperbarui' : 'ditambahkan'}.`)
      refresh()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    setFormError('')
    try {
      await deleteMargin(deleting.idmargin_penjualan)
      setDeleting(null)
      setToast('Margin berhasil dihapus.')
      refresh()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setDeletingBusy(false)
    }
  }

  function refresh() {
    setState('loading')
    setReloadKey((key) => key + 1)
  }

  return <div className="module-page">
    <PageHeader eyebrow="MASTER DATA · PENJUALAN" title="Margin penjualan" description="Persentase margin, status, waktu pencatatan, dan pembuatnya." action={admin ? <button className="button button--primary" type="button" onClick={openCreate}>＋ Tambah margin</button> : undefined} />
    <section className="panel-card resource-panel">
      <div className="resource-toolbar"><div><strong>Daftar margin</strong><p>Persentase yang digunakan untuk menghitung harga jual.</p></div><div className="toolbar-controls"><select aria-label="Filter status margin" value={status} onChange={(event) => { setState('loading'); setErrorMessage(''); setStatus(event.target.value) }}><option value="">Semua status</option><option value="Aktif">Aktif</option><option value="Nonaktif">Nonaktif</option></select><span className="result-count">{state === 'success' ? `${margins.length} data` : 'Memuat…'}</span></div></div>
      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data margin…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert"><strong>Gagal memuat data margin.</strong><span>{errorMessage}</span><button className="button button--secondary button--small" type="button" onClick={refresh}>Coba lagi</button></div>}
      {state === 'success' && margins.length === 0 && <EmptyState title="Data margin tidak ditemukan." detail={status ? 'Coba pilih filter status yang lain.' : 'Belum ada data margin untuk ditampilkan.'} />}
      {state === 'success' && margins.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Persen</th><th>Status</th><th>Dibuat pada</th><th>Pembuat</th>{admin && <th>Aksi</th>}</tr></thead><tbody>{margins.map((margin) => <tr key={margin.idmargin_penjualan}>
        <td>{margin.idmargin_penjualan}</td><td><strong>{margin.persen == null ? '—' : `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(margin.persen)}%`}</strong></td><td>{margin.status == null ? '—' : <StatusBadge active={margin.status === 1} />}</td><td>{formatCreatedAt(margin.created_at)}</td><td><strong>{margin.username || '—'}</strong></td>
        {admin && <td><div className="row-actions"><button type="button" onClick={() => openEdit(margin)}>Ubah</button><button type="button" className="row-action-danger" onClick={() => { setFormError(''); setDeleting(margin) }}>Hapus</button></div></td>}
      </tr>)}</tbody></table></div>}
      <div className="table-footer"><span>{state === 'success' ? `Menampilkan ${margins.length} data margin` : ' '}</span></div>
    </section>
    {formOpen && <Modal title={`${editing ? 'Ubah' : 'Tambah'} margin`} description="Pembuat margin otomatis diambil dari sesi admin yang sedang aktif." onClose={() => !saving && setFormOpen(false)}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Persentase margin" required hint="Nilai antara 0 sampai 100. Gunakan titik untuk angka desimal."><input type="number" min="0" max="100" step="0.01" value={draft.persen} onChange={(event) => setDraft({ ...draft, persen: event.target.value })} required /></Field>
          <Field label="Status" required><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as '0' | '1' })}><option value="1">Aktif</option><option value="0">Nonaktif</option></select></Field>
        </div>
        {formError && <p className="field-error" role="alert">{formError}</p>}
        <FormActions onCancel={() => setFormOpen(false)} submit={saving ? 'Menyimpan…' : 'Simpan'} disabled={saving} />
      </form>
    </Modal>}
    {deleting && <Modal title="Hapus margin?" onClose={() => !deletingBusy && setDeleting(null)}>
      <p className="confirm-copy">Margin <strong>{deleting.persen ?? '—'}%</strong> akan dihapus permanen. Margin yang sudah dipakai pada penjualan tidak dapat dihapus.</p>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <div className="form-actions"><button className="button button--secondary" type="button" disabled={deletingBusy} onClick={() => setDeleting(null)}>Batal</button><button className="button button--danger" type="button" disabled={deletingBusy} onClick={() => void confirmDelete()}>{deletingBusy ? 'Menghapus…' : 'Hapus margin'}</button></div>
    </Modal>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

function StatusBadge({ active }: { active: boolean }) {
  return <span className={`state-pill${active ? '' : ' state-pill--off'}`}>{active ? 'Aktif' : 'Nonaktif'}</span>
}

function formatCreatedAt(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`
  return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
}
