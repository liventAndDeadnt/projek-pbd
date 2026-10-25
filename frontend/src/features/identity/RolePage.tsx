import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../shared/api'
import {
  EmptyState,
  Field,
  FormActions,
  Modal,
  PageHeader,
  StatCard,
  StatusBadge,
  Toast,
} from '../../shared/components'
import { Icon } from '../../shared/icons'
import { ROLE_HOME } from '../dashboard/roles'
import { createRole, deleteRole, listRoles, updateRole } from './identity.api'
import type { Role } from './identity.types'

// Kolom role.nama_role di database saat ini VARCHAR(45). Frontend dibatasi
// agar input panjang tidak berakhir sebagai HTTP 500 dari MySQL.
const ROLE_NAME_MAX_LENGTH = 45

const builtInRoles = new Set(Object.keys(ROLE_HOME))

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`
  return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
}

export default function RolePage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState('')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
  const [detail, setDetail] = useState<Role | null>(null)
  const [name, setName] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    listRoles(search)
      .then((data) => {
        if (!active) return
        setRoles(data)
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
  }, [search, reloadKey])

  function openCreate() {
    setEditing(null)
    setName('')
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(role: Role) {
    setEditing(role)
    setName(role.nama_role)
    setFormError('')
    setFormOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const input = { nama_role: name.trim() }
      if (editing) await updateRole(editing.idrole, input)
      else await createRole(input)
      setFormOpen(false)
      setToast(`Role berhasil ${editing ? 'diperbarui' : 'ditambahkan'}.`)
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
      await deleteRole(deleting.idrole)
      setDeleting(null)
      setToast('Role berhasil dihapus.')
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

  const builtInCount = roles.filter((role) => builtInRoles.has(role.nama_role.toLowerCase())).length
  const customCount = roles.length - builtInCount

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Pengelolaan akses"
        title="Role"
        description="Kelola role yang tersedia untuk akun pengguna internal."
        action={
          <button className="btn btn--primary" type="button" onClick={openCreate}>
            <Icon name="plus" size={15} />
            Tambah role
          </button>
        }
      />

      <section className="stat-grid stat-grid--three">
        <StatCard
          label="Total role"
          value={state === 'success' ? roles.length : '—'}
          note="Seluruh role"
          icon="shield"
          loading={state === 'loading'}
        />
        <StatCard
          label="Role bawaan"
          value={state === 'success' ? builtInCount : '—'}
          note="Dilindungi aplikasi"
          icon="check"
          loading={state === 'loading'}
        />
        <StatCard
          label="Role tambahan"
          value={state === 'success' ? customCount : '—'}
          note="Perlu konfigurasi akses"
          icon="layers"
          loading={state === 'loading'}
        />
      </section>

      <section className="card">
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={15} />
            <input
              aria-label="Cari role"
              placeholder="Cari nama role…"
              value={search}
              onChange={(event) => {
                setState('loading')
                setSearch(event.target.value)
              }}
            />
          </label>
          <div className="toolbar-actions">
            <span className="result-count">
              {state === 'success' ? `${roles.length} data` : 'Memuat…'}
            </span>
          </div>
        </div>

        {state === 'loading' && (
          <div className="table-state" role="status">
            <span className="spinner" />
            Memuat data role…
          </div>
        )}

        {state === 'error' && (
          <div className="table-state table-state--error" role="alert">
            <strong>Gagal memuat data role.</strong>
            <span>{errorMessage}</span>
            <button className="btn btn--secondary btn--sm" type="button" onClick={refresh}>
              Coba lagi
            </button>
          </div>
        )}

        {state === 'success' && roles.length === 0 && (
          <EmptyState
            icon="shield"
            title="Role tidak ditemukan."
            detail={search ? 'Coba gunakan kata pencarian lain.' : 'Belum ada data role.'}
          />
        )}

        {state === 'success' && roles.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Jenis</th>
                    <th className="hide-sm">Akses</th>
                    <th aria-label="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => {
                    const isBuiltIn = builtInRoles.has(role.nama_role.toLowerCase())
                    return (
                      <tr key={role.idrole}>
                        <td>
                          <div className="cell">
                            <span className="cell-icon">
                              <Icon name="shield" size={15} />
                            </span>
                            <span className="cell-copy">
                              <strong>{role.nama_role}</strong>
                              <small>ID #{role.idrole}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge tone={isBuiltIn ? 'blue' : 'neutral'}>
                            {isBuiltIn ? 'Bawaan' : 'Tambahan'}
                          </StatusBadge>
                        </td>
                        <td className="hide-sm">
                          <span className="result-count">
                            {isBuiltIn ? 'Navigasi dan izin sudah dikonfigurasi' : 'Belum dikonfigurasi'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-btn icon-btn--sm"
                              type="button"
                              onClick={() => setDetail(role)}
                              title="Detail"
                            >
                              <Icon name="eye" size={14} />
                              <span className="sr-only">Detail</span>
                            </button>
                            {isBuiltIn ? (
                              <StatusBadge tone="neutral">Dilindungi</StatusBadge>
                            ) : (
                              <>
                                <button
                                  className="icon-btn icon-btn--sm"
                                  type="button"
                                  onClick={() => openEdit(role)}
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
                                    setDeleting(role)
                                  }}
                                  title="Hapus"
                                >
                                  <Icon name="trash" size={14} />
                                  <span className="sr-only">Hapus</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Menampilkan {roles.length} role</span>
              <span>Role bawaan tidak dapat diubah atau dihapus</span>
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <Modal
          title={`${editing ? 'Ubah' : 'Tambah'} role`}
          description="Role tambahan perlu dikonfigurasi hak aksesnya di aplikasi."
          onClose={() => !saving && setFormOpen(false)}
        >
          <form onSubmit={submit}>
            <Field
              label="Nama role"
              required
              hint={`Maksimal ${ROLE_NAME_MAX_LENGTH} karakter. Nama disimpan dalam huruf kecil.`}
            >
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={ROLE_NAME_MAX_LENGTH}
                required
              />
            </Field>
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
        <Modal title="Hapus role?" onClose={() => !deletingBusy && setDeleting(null)}>
          <p className="confirm-copy">
            Role <strong>{deleting.nama_role}</strong> akan dihapus permanen. Role yang masih dipakai
            akun tidak dapat dihapus.
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
              {deletingBusy ? 'Menghapus…' : 'Hapus role'}
            </button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title="Detail role" onClose={() => setDetail(null)}>
          <dl className="detail-grid">
            <div>
              <dt>ID role</dt>
              <dd>{detail.idrole}</dd>
            </div>
            <div>
              <dt>Nama role</dt>
              <dd>{detail.nama_role}</dd>
            </div>
            <div>
              <dt>Jenis</dt>
              <dd>
                {builtInRoles.has(detail.nama_role.toLowerCase()) ? 'Role bawaan' : 'Role tambahan'}
              </dd>
            </div>
            <div>
              <dt>Akses</dt>
              <dd>
                {builtInRoles.has(detail.nama_role.toLowerCase())
                  ? 'Sudah dikonfigurasi'
                  : 'Belum dikonfigurasi'}
              </dd>
            </div>
          </dl>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
