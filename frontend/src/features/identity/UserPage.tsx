import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '../../shared/api'
import { EmptyState, Field, FormActions, Modal, PageHeader, Toast } from '../../shared/components'
import { ROLE_HOME } from '../dashboard/roles'
import { useAuth } from './useAuth'
import { createUser, deleteUser, listRoles, listUsers, updateUser } from './identity.api'
import type { Role, User } from './identity.types'

type Draft = { username: string; idrole: string; password: string }
const emptyDraft = (): Draft => ({ username: '', idrole: '', password: '' })

export default function UserPage() {
  const { user: activeUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editing, setEditing] = useState<User | null>(null)
  const [deleting, setDeleting] = useState<User | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [formOpen, setFormOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listUsers(search, role), listRoles('')])
      .then(([userRows, roleRows]) => {
        if (active) {
          setUsers(userRows)
          setRoles(roleRows)
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
  }, [search, role, reloadKey])

  function openCreate() {
    setEditing(null)
    setDraft({ ...emptyDraft(), idrole: roles[0] ? String(roles[0].idrole) : '' })
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(row: User) {
    setEditing(row)
    setDraft({ username: row.username, idrole: String(row.idrole), password: '' })
    setFormError('')
    setFormOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const username = draft.username.trim()
      const idrole = Number(draft.idrole)
      if (editing) {
        const input = { username, idrole, ...(draft.password ? { password: draft.password } : {}) }
        await updateUser(editing.iduser, input)
      } else {
        await createUser({ username, idrole, password: draft.password })
      }
      setFormOpen(false)
      setToast(`Pengguna berhasil ${editing ? 'diperbarui' : 'ditambahkan'}.`)
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
      await deleteUser(deleting.iduser)
      setDeleting(null)
      setToast('Pengguna berhasil dihapus.')
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
    <PageHeader eyebrow="PENGELOLAAN AKSES" title="Pengguna" description="Kelola akun dan role pengguna internal aplikasi." action={<button className="button button--primary" type="button" onClick={openCreate}>＋ Tambah pengguna</button>} />
    <section className="panel-card resource-panel">
      <div className="resource-toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Cari username" placeholder="Cari username…" value={search} onChange={(event) => { setState('loading'); setErrorMessage(''); setSearch(event.target.value) }} /></label><div className="toolbar-controls"><select aria-label="Filter role" value={role} onChange={(event) => { setState('loading'); setErrorMessage(''); setRole(event.target.value) }}><option value="">Semua role</option>{roles.map((item) => <option key={item.idrole} value={item.nama_role}>{item.nama_role}</option>)}</select><span className="result-count">{state === 'success' ? `${users.length} data` : 'Memuat…'}</span></div></div>
      {state === 'loading' && <div className="table-state" role="status"><span className="loader" />Memuat data pengguna…</div>}
      {state === 'error' && <div className="table-state table-state--error" role="alert"><strong>Gagal memuat data pengguna.</strong><span>{errorMessage}</span><button className="button button--secondary button--small" type="button" onClick={refresh}>Coba lagi</button></div>}
      {state === 'success' && users.length === 0 && <EmptyState title="Pengguna tidak ditemukan." detail={search || role ? 'Coba ubah pencarian atau filter role.' : 'Data pengguna belum tersedia.'} />}
      {state === 'success' && users.length > 0 && <div className="table-scroll"><table className="data-table"><thead><tr><th>ID</th><th>Username</th><th>Role</th><th>Aksi</th></tr></thead><tbody>{users.map((row) => {
        const isCurrentUser = row.iduser === activeUser?.iduser
        return <tr key={row.iduser}><td>{row.iduser}</td><td><strong>{row.username}</strong>{isCurrentUser && <span className="result-count"> · sesi ini</span>}</td><td>{row.role}</td><td><div className="row-actions"><button type="button" onClick={() => openEdit(row)}>Ubah</button><button type="button" className="row-action-danger" disabled={isCurrentUser} title={isCurrentUser ? 'Akun yang sedang digunakan tidak bisa dihapus.' : undefined} onClick={() => { setFormError(''); setDeleting(row) }}>Hapus</button></div></td></tr>
      })}</tbody></table></div>}
      <div className="table-footer"><span>{state === 'success' ? `Menampilkan ${users.length} pengguna` : ' '}</span></div>
    </section>
    {formOpen && <Modal title={`${editing ? 'Ubah' : 'Tambah'} pengguna`} description={editing ? 'Kosongkan password jika tidak ingin menggantinya.' : 'Password akun akan disimpan oleh backend sebagai hash.'} onClose={() => !saving && setFormOpen(false)}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <Field label="Username" required><input value={draft.username} onChange={(event) => setDraft({ ...draft, username: event.target.value })} maxLength={45} autoComplete="off" required /></Field>
          <Field label="Role" required hint={editing?.iduser === activeUser?.iduser ? 'Role akun yang sedang dipakai tidak dapat diubah dari sesi ini.' : 'Role tambahan harus dikonfigurasi hak aksesnya di aplikasi.'}><select value={draft.idrole} disabled={editing?.iduser === activeUser?.iduser} onChange={(event) => setDraft({ ...draft, idrole: event.target.value })} required><option value="" disabled>Pilih role</option>{roles.map((item) => { const known = item.nama_role.toLowerCase() in ROLE_HOME; return <option key={item.idrole} value={item.idrole}>{item.nama_role}{known ? '' : ' · akses belum dikonfigurasi'}</option> })}</select></Field>
          <Field label={editing ? 'Password baru (opsional)' : 'Password'} required={!editing} hint="Maksimal 100 karakter."><input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} maxLength={100} autoComplete="new-password" required={!editing} /></Field>
        </div>
        {formError && <p className="field-error" role="alert">{formError}</p>}
        <FormActions onCancel={() => setFormOpen(false)} submit={saving ? 'Menyimpan…' : 'Simpan'} disabled={saving} />
      </form>
    </Modal>}
    {deleting && <Modal title="Hapus pengguna?" onClose={() => !deletingBusy && setDeleting(null)}>
      <p className="confirm-copy">Akun <strong>{deleting.username}</strong> akan dihapus permanen. Akun yang sedang digunakan tidak dapat dihapus, dan admin terakhir tidak dapat dihapus.</p>
      {formError && <p className="field-error" role="alert">{formError}</p>}
      <div className="form-actions"><button className="button button--secondary" type="button" disabled={deletingBusy} onClick={() => setDeleting(null)}>Batal</button><button className="button button--danger" type="button" disabled={deletingBusy} onClick={() => void confirmDelete()}>{deletingBusy ? 'Menghapus…' : 'Hapus pengguna'}</button></div>
    </Modal>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`
  return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
}
