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
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'
import { createVendor, deleteVendor, listVendor, updateVendor } from './catalog.api'
import type { Vendor } from './catalog.types'

type Draft = { nama_vendor: string; badan_hukum: 'Y' | 'N'; status: '0' | '1' }

const emptyDraft = (): Draft => ({ nama_vendor: '', badan_hukum: 'Y', status: '1' })

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`
  return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
}

export default function VendorPage() {
  const { user } = useAuth()
  const admin = user?.role === 'admin'
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [deleting, setDeleting] = useState<Vendor | null>(null)
  const [detail, setDetail] = useState<Vendor | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    listVendor(search, status)
      .then((data) => {
        if (!active) return
        setVendors(data)
        setState('success')
        setLoadError('')
      })
      .catch((error: unknown) => {
        if (!active) return
        setLoadError(getErrorMessage(error))
        setState('error')
      })
    return () => {
      active = false
    }
  }, [search, status, reloadKey])

  function openCreate() {
    setEditing(null)
    setDraft(emptyDraft())
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(vendor: Vendor) {
    setEditing(vendor)
    setDraft({ nama_vendor: vendor.nama_vendor, badan_hukum: vendor.badan_hukum, status: vendor.status })
    setFormError('')
    setFormOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const input = { ...draft, nama_vendor: draft.nama_vendor.trim() }
      if (editing) await updateVendor(editing.idvendor, input)
      else await createVendor(input)
      setFormOpen(false)
      setToast(`Vendor berhasil ${editing ? 'diperbarui' : 'ditambahkan'}.`)
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
      await deleteVendor(deleting.idvendor)
      setDeleting(null)
      setToast('Vendor berhasil dihapus.')
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

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Master data · katalog"
        title="Vendor"
        description="Daftar vendor yang menjadi referensi proses pengadaan."
        action={
          admin ? (
            <button className="btn btn--primary" type="button" onClick={openCreate}>
              <Icon name="plus" size={15} />
              Tambah vendor
            </button>
          ) : undefined
        }
      />

      <section className="card">
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={15} />
            <input
              aria-label="Cari vendor"
              placeholder="Cari nama vendor…"
              value={search}
              onChange={(event) => {
                setState('loading')
                setSearch(event.target.value)
              }}
            />
          </label>
          <div className="toolbar-actions">
            <select
              className="select"
              aria-label="Filter status vendor"
              value={status}
              onChange={(event) => {
                setState('loading')
                setStatus(event.target.value)
              }}
            >
              <option value="">Semua status</option>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
            <span className="result-count">
              {state === 'success' ? `${vendors.length} data` : 'Memuat…'}
            </span>
          </div>
        </div>

        {state === 'loading' && (
          <div className="table-state" role="status">
            <span className="spinner" />
            Memuat data vendor…
          </div>
        )}

        {state === 'error' && (
          <div className="table-state table-state--error" role="alert">
            <strong>Gagal memuat data vendor.</strong>
            <span>{loadError}</span>
            <button className="btn btn--secondary btn--sm" type="button" onClick={refresh}>
              Coba lagi
            </button>
          </div>
        )}

        {state === 'success' && vendors.length === 0 && (
          <EmptyState
            icon="building"
            title="Vendor tidak ditemukan."
            detail={
              search || status
                ? 'Coba ubah pencarian atau filter status.'
                : 'Data vendor belum tersedia.'
            }
            action={
              admin ? (
                <button className="btn btn--secondary btn--sm" type="button" onClick={openCreate}>
                  Tambah vendor
                </button>
              ) : undefined
            }
          />
        )}

        {state === 'success' && vendors.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th className="hide-sm">Badan hukum</th>
                    <th>Status</th>
                    {admin && <th aria-label="Aksi" />}
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.idvendor}>
                      <td>
                        <div className="cell">
                          <span className="cell-icon">
                            <Icon name="building" size={15} />
                          </span>
                          <span className="cell-copy">
                            <strong>{vendor.nama_vendor}</strong>
                            <small>ID #{vendor.idvendor}</small>
                          </span>
                        </div>
                      </td>
                      <td className="hide-sm">
                        <StatusBadge tone={vendor.badan_hukum === 'Y' ? 'blue' : 'neutral'}>
                          {vendor.badan_hukum === 'Y' ? 'Berbadan hukum' : 'Perorangan'}
                        </StatusBadge>
                      </td>
                      <td>
                        <StatusBadge tone={vendor.status === '1' ? 'green' : 'neutral'}>
                          {vendor.status === '1' ? 'Aktif' : 'Nonaktif'}
                        </StatusBadge>
                      </td>
                      {admin && (
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-btn icon-btn--sm"
                              type="button"
                              onClick={() => setDetail(vendor)}
                              title="Detail"
                            >
                              <Icon name="eye" size={14} />
                              <span className="sr-only">Detail</span>
                            </button>
                            <button
                              className="icon-btn icon-btn--sm"
                              type="button"
                              onClick={() => openEdit(vendor)}
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
                                setDeleting(vendor)
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
              <span>Menampilkan {vendors.length} vendor</span>
              <span>Diurutkan berdasarkan ID</span>
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <Modal
          title={`${editing ? 'Ubah' : 'Tambah'} vendor`}
          description="Vendor yang sudah dipakai pengadaan tidak dapat dihapus."
          onClose={() => !saving && setFormOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="Nama vendor" required full>
                <input
                  value={draft.nama_vendor}
                  onChange={(event) => setDraft({ ...draft, nama_vendor: event.target.value })}
                  maxLength={100}
                  required
                />
              </Field>
              <Field label="Badan hukum" required>
                <select
                  value={draft.badan_hukum}
                  onChange={(event) =>
                    setDraft({ ...draft, badan_hukum: event.target.value as 'Y' | 'N' })
                  }
                >
                  <option value="Y">Berbadan hukum</option>
                  <option value="N">Perorangan</option>
                </select>
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
        <Modal title="Hapus vendor?" onClose={() => !deletingBusy && setDeleting(null)}>
          <p className="confirm-copy">
            <strong>{deleting.nama_vendor}</strong> akan dihapus permanen. Vendor yang sudah digunakan
            dalam pengadaan tidak dapat dihapus.
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
              {deletingBusy ? 'Menghapus…' : 'Hapus vendor'}
            </button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title="Detail vendor" onClose={() => setDetail(null)}>
          <dl className="detail-grid">
            <div>
              <dt>ID vendor</dt>
              <dd>{detail.idvendor}</dd>
            </div>
            <div>
              <dt>Nama vendor</dt>
              <dd>{detail.nama_vendor}</dd>
            </div>
            <div>
              <dt>Badan hukum</dt>
              <dd>{detail.badan_hukum === 'Y' ? 'Berbadan hukum' : 'Perorangan'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{detail.status === '1' ? 'Aktif' : 'Nonaktif'}</dd>
            </div>
          </dl>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
