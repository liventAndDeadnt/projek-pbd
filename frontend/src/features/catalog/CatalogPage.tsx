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
import { formatMoney } from '../../shared/format'
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'
import {
  createBarang,
  createSatuan,
  deleteBarang,
  deleteSatuan,
  listBarang,
  listSatuan,
  updateBarang,
  updateSatuan,
} from './catalog.api'
import type { Barang, Satuan } from './catalog.types'

type CatalogKind = 'barang' | 'satuan'
type Draft = { nama: string; jenis: string; idsatuan: string; harga: string; status: string }

const emptyDraft = (): Draft => ({ nama: '', jenis: '', idsatuan: '', harga: '', status: '1' })

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message} (HTTP ${error.status})`
  return 'Tidak dapat terhubung ke backend. Periksa koneksi lalu coba lagi.'
}

export default function CatalogPage({ kind }: { kind: CatalogKind }) {
  const { user } = useAuth()
  const admin = user?.role === 'admin'
  const [rows, setRows] = useState<(Barang | Satuan)[]>([])
  const [units, setUnits] = useState<Satuan[]>([])
  const [unitsError, setUnitsError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Barang | Satuan | null>(null)
  const [deleting, setDeleting] = useState<Barang | Satuan | null>(null)
  const [detail, setDetail] = useState<Barang | Satuan | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [toast, setToast] = useState('')
  const title = kind === 'barang' ? 'Barang' : 'Satuan'
  const currentUnitID = kind === 'barang' && editing ? (editing as Barang).idsatuan : null

  useEffect(() => {
    if (kind !== 'barang') return
    let active = true
    listSatuan('', '')
      .then((data) => {
        if (active) {
          setUnits(data)
          setUnitsError('')
        }
      })
      .catch(() => {
        if (active) setUnitsError('Daftar satuan belum dapat dimuat.')
      })
    return () => {
      active = false
    }
  }, [kind, reloadKey])

  useEffect(() => {
    let active = true
    const request = kind === 'barang' ? listBarang(query, status) : listSatuan(query, status)
    request
      .then((data) => {
        if (!active) return
        setRows(data)
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
  }, [kind, query, status, reloadKey])

  function openCreate() {
    setEditing(null)
    setDraft(emptyDraft())
    setFormError('')
    setFormOpen(true)
  }

  function openEdit(row: Barang | Satuan) {
    setEditing(row)
    setDraft(
      kind === 'barang'
        ? {
            nama: (row as Barang).nama,
            jenis: (row as Barang).jenis,
            idsatuan: String((row as Barang).idsatuan),
            harga: String((row as Barang).harga),
            status: String(row.status),
          }
        : { ...emptyDraft(), nama: (row as Satuan).nama_satuan, status: String(row.status) },
    )
    setFormError('')
    setFormOpen(true)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const activeStatus = Number(draft.status) as 0 | 1
      if (kind === 'barang') {
        const input = {
          jenis: draft.jenis.trim(),
          nama: draft.nama.trim(),
          idsatuan: Number(draft.idsatuan),
          harga: Number(draft.harga),
          status: activeStatus,
        }
        if (editing) await updateBarang((editing as Barang).idbarang, input)
        else await createBarang(input)
      } else {
        const input = { nama_satuan: draft.nama.trim(), status: activeStatus }
        if (editing) await updateSatuan((editing as Satuan).idsatuan, input)
        else await createSatuan(input)
      }
      setFormOpen(false)
      setToast(`${title} berhasil ${editing ? 'diperbarui' : 'ditambahkan'}.`)
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
      if (kind === 'barang') await deleteBarang((deleting as Barang).idbarang)
      else await deleteSatuan((deleting as Satuan).idsatuan)
      setDeleting(null)
      setToast(`${title} berhasil dihapus.`)
      refresh()
    } catch (error) {
      setFormError(getErrorMessage(error))
    } finally {
      setDeletingBusy(false)
    }
  }

  function refresh() {
    setState('loading')
    setReloadKey((value) => value + 1)
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Master data · katalog"
        title={title}
        description={
          kind === 'barang'
            ? 'Referensi barang yang digunakan pada proses pengadaan dan penjualan.'
            : 'Satuan yang digunakan untuk mencatat barang.'
        }
        action={
          admin ? (
            <button className="btn btn--primary" type="button" onClick={openCreate}>
              <Icon name="plus" size={15} />
              Tambah {title.toLowerCase()}
            </button>
          ) : undefined
        }
      />

      <section className="card">
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={15} />
            <input
              aria-label={`Cari ${title.toLowerCase()}`}
              placeholder={`Cari ${title.toLowerCase()}…`}
              value={query}
              onChange={(event) => {
                setState('loading')
                setQuery(event.target.value)
              }}
            />
          </label>
          <div className="toolbar-actions">
            <select
              className="select"
              aria-label="Filter status"
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
              {state === 'success' ? `${rows.length} data` : 'Memuat…'}
            </span>
          </div>
        </div>

        {state === 'loading' && (
          <div className="table-state" role="status">
            <span className="spinner" />
            Memuat data…
          </div>
        )}

        {state === 'error' && (
          <div className="table-state table-state--error" role="alert">
            <strong>Gagal memuat data {title.toLowerCase()}.</strong>
            <span>{loadError}</span>
            <button className="btn btn--secondary btn--sm" type="button" onClick={refresh}>
              Coba lagi
            </button>
          </div>
        )}

        {state === 'success' && rows.length === 0 && (
          <EmptyState
            icon={kind === 'barang' ? 'box' : 'layers'}
            title={`Belum ada data ${title.toLowerCase()}.`}
            detail={
              query || status
                ? 'Coba ubah kata pencarian atau filter.'
                : 'Data katalog belum tersedia.'
            }
            action={
              admin ? (
                <button className="btn btn--secondary btn--sm" type="button" onClick={openCreate}>
                  Tambah {title.toLowerCase()}
                </button>
              ) : undefined
            }
          />
        )}

        {state === 'success' && rows.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    {kind === 'barang' ? (
                      <>
                        <th>Barang</th>
                        <th className="hide-sm">Jenis</th>
                        <th className="hide-sm">Satuan</th>
                        <th className="num">Harga dasar</th>
                        <th>Status</th>
                      </>
                    ) : (
                      <>
                        <th>Satuan</th>
                        <th>Status</th>
                      </>
                    )}
                    {admin && <th aria-label="Aksi" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) =>
                    kind === 'barang' ? (
                      <BarangRow
                        key={(row as Barang).idbarang}
                        row={row as Barang}
                        admin={admin}
                        onDetail={() => setDetail(row)}
                        onEdit={() => openEdit(row)}
                        onDelete={() => {
                          setFormError('')
                          setDeleting(row)
                        }}
                      />
                    ) : (
                      <SatuanRow
                        key={(row as Satuan).idsatuan}
                        row={row as Satuan}
                        admin={admin}
                        onDetail={() => setDetail(row)}
                        onEdit={() => openEdit(row)}
                        onDelete={() => {
                          setFormError('')
                          setDeleting(row)
                        }}
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Menampilkan {rows.length} data</span>
              <span>Diurutkan berdasarkan ID</span>
            </div>
          </>
        )}
      </section>

      {formOpen && (
        <Modal
          title={`${editing ? 'Ubah' : 'Tambah'} ${title.toLowerCase()}`}
          description={
            kind === 'barang'
              ? 'Lengkapi informasi barang dan satuan yang digunakan.'
              : 'Nama satuan harus jelas dan tidak duplikat.'
          }
          onClose={() => !saving && setFormOpen(false)}
        >
          <form onSubmit={submit}>
            <div className="form-grid">
              {kind === 'barang' ? (
                <>
                  <Field label="Nama barang" required full>
                    <input
                      value={draft.nama}
                      onChange={(event) => setDraft({ ...draft, nama: event.target.value })}
                      maxLength={45}
                      required
                    />
                  </Field>
                  <Field label="Jenis" required hint="Kode jenis satu karakter, misalnya M, I, A, atau K.">
                    <input
                      value={draft.jenis}
                      onChange={(event) =>
                        setDraft({ ...draft, jenis: event.target.value.slice(0, 1).toUpperCase() })
                      }
                      maxLength={1}
                      required
                    />
                  </Field>
                  <Field
                    label="Satuan"
                    required
                    hint={unitsError || 'Satuan nonaktif hanya dapat dipertahankan pada barang lama.'}
                  >
                    <select
                      value={draft.idsatuan}
                      onChange={(event) => setDraft({ ...draft, idsatuan: event.target.value })}
                      required
                    >
                      <option value="" disabled>
                        Pilih satuan
                      </option>
                      {units.map((unit) => (
                        <option
                          key={unit.idsatuan}
                          value={unit.idsatuan}
                          disabled={!unit.status && unit.idsatuan !== currentUnitID}
                        >
                          {unit.nama_satuan}
                          {unit.status ? '' : ' · nonaktif'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Harga dasar" required>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={draft.harga}
                      onChange={(event) => setDraft({ ...draft, harga: event.target.value })}
                      required
                    />
                  </Field>
                  <StatusField draft={draft} setDraft={setDraft} />
                </>
              ) : (
                <>
                  <Field label="Nama satuan" required full>
                    <input
                      value={draft.nama}
                      onChange={(event) => setDraft({ ...draft, nama: event.target.value })}
                      maxLength={45}
                      required
                    />
                  </Field>
                  <StatusField draft={draft} setDraft={setDraft} />
                </>
              )}
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
        <Modal
          title={`Hapus ${title.toLowerCase()}?`}
          onClose={() => !deletingBusy && setDeleting(null)}
        >
          <p className="confirm-copy">
            {kind === 'barang'
              ? (deleting as Barang).nama
              : (deleting as Satuan).nama_satuan}{' '}
            akan dihapus permanen jika belum dipakai data lain.
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
              {deletingBusy ? 'Menghapus…' : 'Hapus'}
            </button>
          </div>
        </Modal>
      )}

      {detail && (
        <Modal title={`Detail ${title.toLowerCase()}`} onClose={() => setDetail(null)}>
          <dl className="detail-grid">
            {detailEntries(detail, kind).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

function StatusField({ draft, setDraft }: { draft: Draft; setDraft: (value: Draft) => void }) {
  return (
    <Field label="Status" required>
      <select
        value={draft.status}
        onChange={(event) => setDraft({ ...draft, status: event.target.value })}
      >
        <option value="1">Aktif</option>
        <option value="0">Nonaktif</option>
      </select>
    </Field>
  )
}

function RowActions({
  onDetail,
  onEdit,
  onDelete,
}: {
  onDetail: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="table-actions">
      <button className="icon-btn icon-btn--sm" type="button" onClick={onDetail} title="Detail">
        <Icon name="eye" size={14} />
        <span className="sr-only">Detail</span>
      </button>
      <button className="icon-btn icon-btn--sm" type="button" onClick={onEdit} title="Ubah">
        <Icon name="edit" size={14} />
        <span className="sr-only">Ubah</span>
      </button>
      <button
        className="icon-btn icon-btn--sm icon-btn--danger"
        type="button"
        onClick={onDelete}
        title="Hapus"
      >
        <Icon name="trash" size={14} />
        <span className="sr-only">Hapus</span>
      </button>
    </div>
  )
}

function BarangRow({
  row,
  admin,
  onDetail,
  onEdit,
  onDelete,
}: {
  row: Barang
  admin: boolean
  onDetail: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <tr>
      <td>
        <div className="cell">
          <span className="cell-icon">
            <Icon name="box" size={15} />
          </span>
          <span className="cell-copy">
            <strong>{row.nama}</strong>
            <small>ID #{row.idbarang}</small>
          </span>
        </div>
      </td>
      <td className="hide-sm">{row.jenis}</td>
      <td className="hide-sm">{row.nama_satuan}</td>
      <td className="num">{formatMoney(row.harga)}</td>
      <td>
        <StatusBadge tone={row.status ? 'green' : 'neutral'}>
          {row.status ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      </td>
      {admin && (
        <td>
          <RowActions onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} />
        </td>
      )}
    </tr>
  )
}

function SatuanRow({
  row,
  admin,
  onDetail,
  onEdit,
  onDelete,
}: {
  row: Satuan
  admin: boolean
  onDetail: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <tr>
      <td>
        <div className="cell">
          <span className="cell-icon">
            <Icon name="layers" size={15} />
          </span>
          <span className="cell-copy">
            <strong>{row.nama_satuan}</strong>
            <small>ID #{row.idsatuan}</small>
          </span>
        </div>
      </td>
      <td>
        <StatusBadge tone={row.status ? 'green' : 'neutral'}>
          {row.status ? 'Aktif' : 'Nonaktif'}
        </StatusBadge>
      </td>
      {admin && (
        <td>
          <RowActions onDetail={onDetail} onEdit={onEdit} onDelete={onDelete} />
        </td>
      )}
    </tr>
  )
}

function detailEntries(row: Barang | Satuan, kind: CatalogKind): [string, string][] {
  if (kind === 'barang') {
    const item = row as Barang
    return [
      ['ID barang', String(item.idbarang)],
      ['Nama barang', item.nama],
      ['Jenis', item.jenis],
      ['Satuan', item.nama_satuan],
      ['Harga dasar', formatMoney(item.harga)],
      ['Status', item.status ? 'Aktif' : 'Nonaktif'],
    ]
  }
  const unit = row as Satuan
  return [
    ['ID satuan', String(unit.idsatuan)],
    ['Nama satuan', unit.nama_satuan],
    ['Status', unit.status ? 'Aktif' : 'Nonaktif'],
  ]
}
