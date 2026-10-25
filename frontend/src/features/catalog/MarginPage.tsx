import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../shared/api'
import {
  EmptyState,
  Field,
  FormActions,
  Modal,
  PageHeader,
  StatusBadge,
  Toast,
} from '../../shared/components'
import { formatDate, formatNumber } from '../../shared/format'
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'
import { createMargin, deleteMargin, listMarginPenjualan, updateMargin } from './catalog.api'
import type { MarginPenjualan } from './catalog.types'

type LoadState = 'loading' | 'success' | 'error'
type Draft = { persen: string; status: '0' | '1' }

const emptyDraft = (): Draft => ({ persen: '', status: '1' })

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`
  return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
}

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
  const [detail, setDetail] = useState<MarginPenjualan | null>(null)
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
        if (!active) return
        setMargins(data)
        setState('success')
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (!active) return
        setErrorMessage(getErrorMessage(error))
        setState('error')
      })
    return () => {
      active = false
    }
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

  const activeMargin = margins.find((margin) => margin.status === 1)

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Master data · penjualan"
        title="Margin penjualan"
        description="Atur persentase margin yang dipakai untuk menghitung harga jual."
        action={
          admin ? (
            <button className="btn btn--primary" type="button" onClick={openCreate}>
              <Icon name="plus" size={15} />
              Tambah margin
            </button>
          ) : undefined
        }
      />

      <section className="stat-grid stat-grid--three">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Margin aktif</span>
            <span className="stat-icon">
              <Icon name="percent" size={15} />
            </span>
          </div>
          <strong className="stat-value">
            {state === 'success' ? `${formatNumber(activeMargin?.persen ?? 0)}%` : '—'}
          </strong>
          <span className="stat-note">Dipakai pada perhitungan harga jual</span>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Total aturan</span>
            <span className="stat-icon">
              <Icon name="layers" size={15} />
            </span>
          </div>
          <strong className="stat-value">{state === 'success' ? margins.length : '—'}</strong>
          <span className="stat-note">Seluruh riwayat margin</span>
        </article>
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-label">Pembuat terakhir</span>
            <span className="stat-icon">
              <Icon name="users" size={15} />
            </span>
          </div>
          <strong className="stat-value stat-value--text">
            {state === 'success' ? (margins.at(-1)?.username ?? '—') : '—'}
          </strong>
          <span className="stat-note">Diambil dari sesi login</span>
        </article>
      </section>

      <section className="card">
        <div className="toolbar">
          <div>
            <h2 className="toolbar-title">Daftar margin</h2>
            <p className="toolbar-subtitle">Persentase dan status yang tersedia.</p>
          </div>
          <div className="toolbar-actions">
            <select
              className="select"
              aria-label="Filter status margin"
              value={status}
              onChange={(event) => {
                setState('loading')
                setErrorMessage('')
                setStatus(event.target.value)
              }}
            >
              <option value="">Semua status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
            <span className="result-count">
              {state === 'success' ? `${margins.length} data` : 'Memuat…'}
            </span>
          </div>
        </div>

        {state === 'loading' && (
          <div className="table-state" role="status">
            <span className="spinner" />
            Memuat data margin…
          </div>
        )}

        {state === 'error' && (
          <div className="table-state table-state--error" role="alert">
            <strong>Gagal memuat data margin.</strong>
            <span>{errorMessage}</span>
            <button className="btn btn--secondary btn--sm" type="button" onClick={refresh}>
              Coba lagi
            </button>
          </div>
        )}

        {state === 'success' && margins.length === 0 && (
          <EmptyState
            icon="percent"
            title="Data margin tidak ditemukan."
            detail={status ? 'Coba pilih filter status yang lain.' : 'Belum ada data margin.'}
          />
        )}

        {state === 'success' && margins.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Margin</th>
                    <th className="num">Persentase</th>
                    <th>Status</th>
                    <th className="hide-sm">Dibuat</th>
                    <th className="hide-sm">Pembuat</th>
                    {admin && <th aria-label="Aksi" />}
                  </tr>
                </thead>
                <tbody>
                  {margins.map((margin) => (
                    <tr key={margin.idmargin_penjualan}>
                      <td>
                        <div className="cell">
                          <span className="cell-icon">
                            <Icon name="percent" size={15} />
                          </span>
                          <span className="cell-copy">
                            <strong>Margin #{margin.idmargin_penjualan}</strong>
                            <small>{margin.status === 1 ? 'Sedang berlaku' : 'Arsip'}</small>
                          </span>
                        </div>
                      </td>
                      <td className="num">
                        <strong>{margin.persen == null ? '—' : `${formatNumber(margin.persen)}%`}</strong>
                      </td>
                      <td>
                        <StatusBadge tone={margin.status === 1 ? 'green' : 'neutral'}>
                          {margin.status == null ? '—' : margin.status === 1 ? 'Aktif' : 'Nonaktif'}
                        </StatusBadge>
                      </td>
                      <td className="hide-sm">{formatDate(margin.created_at)}</td>
                      <td className="hide-sm">{margin.username || '—'}</td>
                      {admin && (
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-btn icon-btn--sm"
                              type="button"
                              onClick={() => setDetail(margin)}
                              title="Detail"
                            >
                              <Icon name="eye" size={14} />
                              <span className="sr-only">Detail</span>
                            </button>
                            <button
                              className="icon-btn icon-btn--sm"
                              type="button"
                              onClick={() => openEdit(margin)}
                              title="Ubah"
                            >
                              <Icon name="edit" size={14} />
                              <span className="sr-only">Ubah</span>
                            </button>
                            <button
                              className="icon-btn icon-btn--sm icon-btn--danger"
                              type="button"
                              onClick={() => {
                                setFormError('')
                                setDeleting(margin)
                              }}
                              title="Hapus"
                            >
                              <Icon name="trash" size={14} />
                              <span className="sr-only">Hapus</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Menampilkan {margins.length} data margin</span>
              <span>Hanya satu margin yang sebaiknya aktif</span>
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <Modal
          title={`${editing ? 'Ubah' : 'Tambah'} margin`}
          description="Pembuat margin otomatis diambil dari sesi login yang aktif."
          onClose={() => !saving && setFormOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field
                label="Persentase margin"
                required
                hint="Nilai antara 0 sampai 100. Gunakan titik untuk desimal."
              >
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={draft.persen}
                  onChange={(event) => setDraft({ ...draft, persen: event.target.value })}
                  required
                />
              </Field>
              <Field label="Status" required>
                <select
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as '0' | '1' })}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </Field>
            </div>
            {formError && (
              <p className="field-error" role="alert">
                {formError}
              </p>
            )}
            <FormActions
              onCancel={() => setFormOpen(false)}
              submit={saving ? 'Menyimpan…' : 'Simpan'}
              disabled={saving}
            />
          </form>
        </Modal>
      )}

      {deleting && (
        <Modal title="Hapus margin?" onClose={() => !deletingBusy && setDeleting(null)}>
          <p className="confirm-copy">
            Margin <strong>{deleting.persen ?? '—'}%</strong> akan dihapus permanen. Margin yang sudah
            dipakai pada penjualan tidak dapat dihapus.
          </p>
          {formError && (
            <p className="field-error" role="alert">
              {formError}
            </p>
          )}
          <div className="form-actions">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={deletingBusy}
              onClick={() => setDeleting(null)}
            >
              Batal
            </button>
            <button
              className="btn btn--danger"
              type="button"
              disabled={deletingBusy}
              onClick={() => void confirmDelete()}
            >
              {deletingBusy ? 'Menghapus…' : 'Hapus margin'}
            </button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title="Detail margin" onClose={() => setDetail(null)}>
          <dl className="detail-grid">
            <div>
              <dt>ID margin</dt>
              <dd>{detail.idmargin_penjualan}</dd>
            </div>
            <div>
              <dt>Persentase</dt>
              <dd>{detail.persen == null ? '—' : `${formatNumber(detail.persen)}%`}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{detail.status === 1 ? 'Aktif' : 'Nonaktif'}</dd>
            </div>
            <div>
              <dt>Dibuat</dt>
              <dd>{formatDate(detail.created_at)}</dd>
            </div>
            <div>
              <dt>Pembuat</dt>
              <dd>{detail.username || '—'}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
