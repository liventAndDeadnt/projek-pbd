import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../shared/api'
import { EmptyState, Field, FormActions, Modal, PageHeader, Toast } from '../../shared/components'
import { ROLE_HOME } from '../dashboard/roles'
import { createRole, deleteRole, listRoles, updateRole } from './identity.api'
import type { Role } from './identity.types'

const builtInRoles = new Set(Object.keys(ROLE_HOME))

export default function RolePage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState('')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)
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
        if (active) {
          setRoles(data)
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

  return <div className="module-page">
    <PageHeader eyebrow="PENGELOLAAN AKSES" title="Role" description="Kelola role yang tersedia untuk akun pengguna internal." action={<button className="button button--primary" type="button" onClick={openCreate}>＋ Tambah role</button>} />
    <section className="panel-card resource-panel">
      <div className="resource-toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Cari role" placeholder="Cari nama role…" value={search} onChange={(event) => { setState('loading'); setSearch(event.target.value) }} /></label><div className="toolbar-controls"><span className="result-count">{state === 'success' ? `${roles.length} data` : 'Memuat…'}</span></div></div>
      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data role…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert"><strong>Gagal memuat data role.</strong><span>{errorMessage}</span><button className="button button--secondary button--small" type="button" onClick={refresh}>Coba lagi</button></div>}
      {state === 'success' && roles.length === 0 && <EmptyState title="Role tidak ditemukan." detail={search ? 'Coba gunakan kata pencarian lain.' : 'Belum ada data role untuk ditampilkan.'} />}
      {state === 'success' && roles.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Nama role</th><th>Keterangan</th><th>Aksi</th></tr></thead><tbody>{roles.map((role) => {
        const isBuiltIn = builtInRoles.has(role.nama_role.toLowerCase())
        return <tr key={role.idrole}><td>{role.idrole}</td><td><strong>{role.nama_role}</strong></td><td>{isBuiltIn ? 'Role bawaan aplikasi' : 'Role tambahan'}</td><td><div className="row-actions">{isBuiltIn ? <span className="result-count">Dilindungi</span> : <><button type="button" onClick={() => openEdit(role)}>Ubah</button><button type="button" className="row-action-danger" onClick={() => { setFormError(''); setDeleting(role) }}>Hapus</button></>}</div></td></tr>
      })}</tbody></table></div>}
      <div className="table-footer"><span>{state === 'success' ? `Menampilkan ${roles.length} role` : ' '}</span></div>
    </section>
    {formOpen && <Modal title={`${editing ? 'Ubah' : 'Tambah'} role`} description="Role tambahan perlu dikonfigurasi hak aksesnya di aplikasi." onClose={() => !saving && setFormOpen(false)}>
      <form onSubmit={submit}><Field label="Nama role" required hint="Maksimal 100 karakter. Nama akan disimpan dalam huruf kecil."><input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required /></Field>{formError && <p className="field-error" role="alert">{formError}</p>}<FormActions onCancel={() => setFormOpen(false)} submit={saving ? 'Menyimpan…' : 'Simpan'} disabled={saving} /></form>
    </Modal>}
    {deleting && <Modal title="Hapus role?" onClose={() => !deletingBusy && setDeleting(null)}>
      <p className="confirm-copy">Role <strong>{deleting.nama_role}</strong> akan dihapus permanen. Role yang masih dipakai akun tidak dapat dihapus.</p>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <div className="form-actions"><button className="button button--secondary" type="button" disabled={deletingBusy} onClick={() => setDeleting(null)}>Batal</button><button className="button button--danger" type="button" disabled={deletingBusy} onClick={() => void confirmDelete()}>{deletingBusy ? 'Menghapus…' : 'Hapus role'}</button></div>
    </Modal>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`
  return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
}
