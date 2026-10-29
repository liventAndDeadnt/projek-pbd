import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../../shared/api'
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  StatusBadge,
  Toast,
} from '../../shared/components'
import { formatDate, formatMoney } from '../../shared/format'
import { Icon } from '../../shared/icons'
import { listBarang, listVendor } from '../catalog/catalog.api'
import type { Barang, Vendor } from '../catalog/catalog.types'
import { useAuth } from '../identity/useAuth'
import {
  changePengadaanStatus,
  createPengadaan,
  getPengadaan,
  listPengadaan,
} from './procurement.api'
import { PENGADAAN_TABS, statusMeta } from './procurement.config'
import type {
  CreatePengadaanItem,
  Pengadaan,
  PengadaanDetail,
  PengadaanStatus,
} from './procurement.types'

type DraftLine = { idbarang: number | null; name: string; price: string; qty: string }
type LoadState = 'loading' | 'error' | 'success'
type StatusAction = 'A' | 'R' | 'X'

const emptyLine = (): DraftLine => ({ idbarang: null, name: '', price: '', qty: '' })
const STATUS_STEPS = ['Pending', 'Approved', 'Partial', 'Completed']

const ACTION_COPY: Record<
  StatusAction,
  { title: string; description: string; body: string; confirm: string }
> = {
  A: {
    title: 'Setujui pengadaan?',
    description: 'Pengadaan akan disetujui dan siap diterima gudang.',
    body: 'Pastikan vendor, item, dan nilai pengadaan sudah benar.',
    confirm: 'Setujui',
  },
  R: {
    title: 'Tolak pengadaan?',
    description: 'Pengadaan akan ditolak dan tidak bisa diterima.',
    body: 'Pengadaan yang ditolak hanya bisa ditutup oleh admin.',
    confirm: 'Tolak',
  },
  X: {
    title: 'Batalkan pengadaan?',
    description: 'Pengadaan akan dibatalkan permanen.',
    body: 'Tindakan ini tidak bisa dibatalkan.',
    confirm: 'Batalkan',
  },
}

export function ProcurementPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<PengadaanStatus | ''>('')
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Pengadaan[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const canCreate = user?.role === 'admin' || user?.role === 'purchasing'

  useEffect(() => {
    let active = true

    listPengadaan(query, status)
      .then((data) => {
        if (!active) return
        setRows(data)
        setState('success')
      })
      .catch((error) => {
        if (!active) return
        setLoadError(errorMessage(error))
        setState('error')
      })

    return () => {
      active = false
    }
  }, [query, status, reloadKey])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Procurement"
        title="Pengadaan"
        description="Buat dan pantau permintaan pengadaan barang dari vendor."
        action={
          canCreate ? (
            <Link className="btn btn--primary" to="/pengadaan/baru">
              <Icon name="plus" size={15} />
              Buat pengadaan
            </Link>
          ) : undefined
        }
      />

      <section className="card workflow-card">
        <h2>Alur pengadaan</h2>
        <p>Vendor → Pengadaan → Approval → Penerimaan → Selesai</p>
        <div className="process-steps">
          {STATUS_STEPS.map((step, index) => (
            <div className="process-step" key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="toolbar">
          <label className="search-field">
            <Icon name="search" size={15} />
            <input
              placeholder="Cari ID atau vendor…"
              aria-label="Cari pengadaan"
              value={query}
              onChange={(event) => {
                setState('loading')
                setQuery(event.target.value)
              }}
            />
          </label>
          <div className="toolbar-actions">
            <span className="result-count">
              {state === 'success'
                ? `${rows.length} pengadaan`
                : state === 'loading'
                  ? 'Memuat…'
                  : '—'}
            </span>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Filter status pengadaan">
          {PENGADAAN_TABS.map((tab) => (
            <button
              key={tab.value || 'all'}
              role="tab"
              aria-selected={status === tab.value}
              className={`tab${status === tab.value ? ' is-active' : ''}`}
              onClick={() => {
                if (status === tab.value) return
                setState('loading')
                setStatus(tab.value)
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {state === 'loading' && (
          <div className="table-state" role="status">
            <span className="spinner" />
            Memuat pengadaan…
          </div>
        )}

        {state === 'error' && (
          <div className="table-state table-state--error" role="alert">
            <strong>Gagal memuat pengadaan.</strong>
            <span>{loadError}</span>
            <button
              className="btn btn--secondary btn--sm"
              type="button"
              onClick={() => {
                setState('loading')
                setReloadKey((current) => current + 1)
              }}
            >
              Coba lagi
            </button>
          </div>
        )}

        {state === 'success' && rows.length === 0 && (
          <EmptyState
            icon="clipboard"
            title={
              query
                ? 'Tidak ada pengadaan yang cocok.'
                : status
                  ? `Belum ada pengadaan berstatus ${statusMeta(status).label}.`
                  : 'Belum ada pengadaan.'
            }
            detail={
              query || status
                ? 'Coba ubah kata pencarian atau filter status.'
                : 'Pengadaan akan tampil di sini setelah dibuat.'
            }
            action={
              canCreate ? (
                <Link className="btn btn--secondary btn--sm" to="/pengadaan/baru">
                  Buat pengadaan pertama
                </Link>
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
                    <th>ID pengadaan</th>
                    <th>Vendor</th>
                    <th className="hide-sm">Pemohon</th>
                    <th className="hide-sm">Tanggal</th>
                    <th className="num hide-sm">Subtotal</th>
                    <th className="num hide-sm">PPN</th>
                    <th className="num">Total</th>
                    <th>Status</th>
                    <th aria-label="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const meta = statusMeta(row.status)
                    return (
                      <tr key={row.idpengadaan}>
                        <td>#{row.idpengadaan}</td>
                        <td>{row.nama_vendor}</td>
                        <td className="hide-sm">{row.username}</td>
                        <td className="hide-sm">{formatDate(row.timestamp)}</td>
                        <td className="num hide-sm">{formatMoney(row.subtotal_nilai)}</td>
                        <td className="num hide-sm">{row.ppn}%</td>
                        <td className="num">{formatMoney(row.total_nilai)}</td>
                        <td>
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link
                              className="btn btn--ghost btn--sm"
                              to={`/pengadaan/${row.idpengadaan}`}
                            >
                              Detail
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>Menampilkan {rows.length} pengadaan</span>
              <span>Diurutkan dari yang terbaru</span>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export function ProcurementDetailPage() {
  const { id: idParam } = useParams()
  const id = Number(idParam)
  const validId = Number.isInteger(id) && id > 0
  const [data, setData] = useState<PengadaanDetail | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [loadError, setLoadError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [action, setAction] = useState<StatusAction | null>(null)
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!validId) return

    let active = true

    getPengadaan(id)
      .then((detail) => {
        if (!active) return
        setData(detail)
        setNotFound(false)
        setState('success')
      })
      .catch((error) => {
        if (!active) return
        const missing = error instanceof ApiError && error.status === 404
        setNotFound(missing)
        setLoadError(missing ? 'Pengadaan tidak ditemukan.' : errorMessage(error))
        setState('error')
      })

    return () => {
      active = false
    }
  }, [id, validId, reloadKey])

  const loading = state === 'loading' || (state === 'success' && data?.idpengadaan !== id)

  function openAction(next: StatusAction) {
    setActionError('')
    setAction(next)
  }

  async function confirmAction() {
    if (!action || !data || submitting) return
    setSubmitting(true)
    setActionError('')

    try {
      const updated = await changePengadaanStatus(data.idpengadaan, action)
      setData(updated)
      setAction(null)
      setToast(
        action === 'A'
          ? 'Pengadaan disetujui.'
          : action === 'R'
            ? 'Pengadaan ditolak.'
            : 'Pengadaan dibatalkan.',
      )
    } catch (error) {
      setActionError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const meta = data ? statusMeta(data.status) : null
  const copy = action ? ACTION_COPY[action] : null

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Procurement · detail"
        title={`Pengadaan #${validId ? id : '—'}`}
        description="Rincian vendor, pemohon, status, dan item pengadaan."
        action={
          <Link className="btn btn--secondary" to="/pengadaan">
            Kembali
          </Link>
        }
      />

      {!validId && (
        <section className="card">
          <EmptyState
            icon="clipboard"
            title="ID pengadaan tidak valid."
            detail="Periksa kembali alamat halaman atau kembali ke daftar."
            action={
              <Link className="btn btn--secondary btn--sm" to="/pengadaan">
                Kembali ke daftar
              </Link>
            }
          />
        </section>
      )}

      {validId && loading && (
        <section className="card">
          <div className="table-state" role="status">
            <span className="spinner" />
            Memuat detail pengadaan…
          </div>
        </section>
      )}

      {validId && state === 'error' && notFound && (
        <section className="card">
          <EmptyState
            icon="clipboard"
            title={loadError}
            detail="Periksa kembali ID pengadaan atau kembali ke daftar."
            action={
              <Link className="btn btn--secondary btn--sm" to="/pengadaan">
                Kembali ke daftar
              </Link>
            }
          />
        </section>
      )}

      {validId && state === 'error' && !notFound && (
        <section className="card">
          <div className="table-state table-state--error" role="alert">
            <strong>Gagal memuat detail pengadaan.</strong>
            <span>{loadError}</span>
            <button
              className="btn btn--secondary btn--sm"
              type="button"
              onClick={() => {
                setState('loading')
                setReloadKey((current) => current + 1)
              }}
            >
              Coba lagi
            </button>
          </div>
        </section>
      )}

      {validId && state === 'success' && data && data.idpengadaan === id && meta && (
        <>
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Informasi pengadaan</h2>
                <p>Vendor, pemohon, nilai, dan status terbaru.</p>
              </div>
              <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span>Vendor</span>
                  <strong>{data.nama_vendor}</strong>
                </div>
                <div className="info-item">
                  <span>Pemohon</span>
                  <strong>{data.username}</strong>
                </div>
                <div className="info-item">
                  <span>Tanggal</span>
                  <strong>{formatDate(data.timestamp)}</strong>
                </div>
                <div className="info-item">
                  <span>Subtotal</span>
                  <strong>{formatMoney(data.subtotal_nilai)}</strong>
                </div>
                <div className="info-item">
                  <span>PPN</span>
                  <strong>
                    {data.ppn}% · {formatMoney(data.total_nilai - data.subtotal_nilai)}
                  </strong>
                </div>
                <div className="info-item">
                  <span>Total</span>
                  <strong>{formatMoney(data.total_nilai)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Item pengadaan</h2>
                <p>Barang, harga satuan, jumlah, dan penerimaan.</p>
              </div>
            </div>
            {data.items.length === 0 ? (
              <div className="table-state">Belum ada item pada pengadaan ini.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Barang</th>
                      <th className="hide-sm">Satuan</th>
                      <th className="num">Harga satuan</th>
                      <th className="num">Jumlah</th>
                      <th className="num">Diterima</th>
                      <th className="num">Sisa</th>
                      <th className="num">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.iddetail_pengadaan}>
                        <td>{item.nama_barang}</td>
                        <td className="hide-sm">{item.nama_satuan}</td>
                        <td className="num">{formatMoney(item.harga_satuan)}</td>
                        <td className="num">{item.jumlah}</td>
                        <td className="num">{item.jumlah_diterima}</td>
                        <td className="num">{item.jumlah - item.jumlah_diterima}</td>
                        <td className="num">{formatMoney(item.sub_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="table-footer">
              <span>{data.jumlah_item} baris barang</span>
              <span>
                {data.jumlah_penerimaan > 0
                  ? `${data.jumlah_penerimaan} batch penerimaan`
                  : 'Belum ada penerimaan'}
              </span>
            </div>
          </section>

          {(data.permissions.approve ||
            data.permissions.reject ||
            data.permissions.cancel) && (
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Tindakan</h2>
                  <p>Pilih keputusan untuk pengadaan ini.</p>
                </div>
              </div>
              <div className="card-body">
                <div className="form-actions">
                  {data.permissions.approve && (
                    <button
                      className="btn btn--primary"
                      type="button"
                      onClick={() => openAction('A')}
                    >
                      Setujui
                    </button>
                  )}
                  {data.permissions.reject && (
                    <button
                      className="btn btn--secondary"
                      type="button"
                      onClick={() => openAction('R')}
                    >
                      Tolak
                    </button>
                  )}
                  {data.permissions.cancel && (
                    <button
                      className="btn btn--danger"
                      type="button"
                      onClick={() => openAction('X')}
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {action && copy && (
        <Modal
          title={copy.title}
          description={copy.description}
          onClose={() => {
            if (!submitting) setAction(null)
          }}
        >
          <p className="confirm-copy">{copy.body}</p>
          {actionError && (
            <p className="field-error" role="alert">
              {actionError}
            </p>
          )}
          <div className="form-actions">
            <button
              className="btn btn--secondary"
              type="button"
              disabled={submitting}
              onClick={() => setAction(null)}
            >
              Kembali
            </button>
            <button
              className={`btn ${action === 'A' ? 'btn--primary' : 'btn--danger'}`}
              type="button"
              disabled={submitting}
              onClick={() => void confirmAction()}
            >
              {submitting ? 'Memproses…' : copy.confirm}
            </button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

export function ProcurementFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState('')
  const [idVendor, setIDVendor] = useState<number | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Barang[]>([])
  const [lookupLoading, setLookupLoading] = useState(true)
  const [lookupError, setLookupError] = useState('')
  const [vendorOpen, setVendorOpen] = useState(false)
  const [activeProductLine, setActiveProductLine] = useState<number | null>(null)
  const [ppn, setPpn] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const vendorMatches = useMemo(() => filterVendors(vendors, vendor), [vendors, vendor])
  const subtotal = lines.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0,
  )
  const tax = Math.round(subtotal * ((Number(ppn) || 0) / 100))
  const total = subtotal + tax

  useEffect(() => {
    let active = true

    Promise.all([listVendor('', 'Aktif'), listBarang('', 'Aktif')])
      .then(([vendorRows, productRows]) => {
        if (!active) return
        setVendors(vendorRows)
        setProducts(productRows)
        setLookupError('')
      })
      .catch(() => {
        if (active) setLookupError('Daftar vendor dan barang belum dapat dimuat.')
      })
      .finally(() => {
        if (active) setLookupLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  function updateVendor(value: string) {
    setVendor(value)
    setIDVendor(null)
    setVendorOpen(true)
  }

  function selectVendor(item: Vendor) {
    setVendor(item.nama_vendor)
    setIDVendor(item.idvendor)
    setVendorOpen(false)
  }

  function updateLine(index: number, key: 'name' | 'price' | 'qty', value: string) {
    setLines((current) =>
      current.map((line, i) =>
        i === index
          ? key === 'name'
            ? { ...line, name: value, idbarang: null }
            : { ...line, [key]: value }
          : line,
      ),
    )
  }

  function selectProduct(index: number, product: Barang) {
    if (lines.some((line, i) => i !== index && line.idbarang === product.idbarang)) {
      setFormError('Barang ini sudah ada di baris lain.')
      setActiveProductLine(null)
      return
    }
    setFormError('')
    setLines((current) =>
      current.map((line, i) =>
        i === index
          ? {
              ...line,
              idbarang: product.idbarang,
              name: product.nama,
              price: String(product.harga),
            }
          : line,
      ),
    )
    setActiveProductLine(null)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setFormError('')

    if (!idVendor) {
      setFormError('Pilih vendor dari daftar terlebih dahulu.')
      return
    }

    const ppnValue = Number(ppn || 0)
    if (!Number.isInteger(ppnValue) || ppnValue < 0 || ppnValue > 100) {
      setFormError('PPN harus bilangan bulat 0 sampai 100.')
      return
    }

    const items: CreatePengadaanItem[] = []
    const seen = new Set<number>()

    for (const line of lines) {
      if (!line.idbarang) {
        setFormError('Pilih setiap barang dari daftar yang tersedia.')
        return
      }
      if (seen.has(line.idbarang)) {
        setFormError('Barang yang sama tidak boleh dipilih dua kali.')
        return
      }
      seen.add(line.idbarang)

      const jumlah = Number(line.qty)
      const harga = Number(line.price)
      if (!Number.isInteger(jumlah) || jumlah <= 0) {
        setFormError('Jumlah setiap barang harus bilangan bulat lebih dari 0.')
        return
      }
      if (!Number.isInteger(harga) || harga < 0) {
        setFormError('Harga satuan harus bilangan bulat dan tidak negatif.')
        return
      }

      items.push({ idbarang: line.idbarang, jumlah, harga_satuan: harga })
    }

    setSubmitting(true)
    try {
      const created = await createPengadaan({ idvendor: idVendor, ppn: ppnValue, items })
      navigate(`/pengadaan/${created.idpengadaan}`)
    } catch (error) {
      setFormError(errorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Procurement · pengadaan"
        title="Buat pengadaan"
        description="Susun vendor dan item, lalu tinjau nilai pengadaan sebelum disimpan."
        action={
          <button
            className="btn btn--secondary"
            type="button"
            onClick={() => navigate('/pengadaan')}
          >
            Kembali
          </button>
        }
      />

      <form className="form-layout" onSubmit={submit}>
        <div className="form-main">
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Informasi pengadaan</h2>
                <p>Pemohon diambil dari sesi login.</p>
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <Field
                  label="Vendor"
                  required
                  hint="Ketik minimal satu huruf, lalu pilih vendor aktif."
                >
                  <div className="lookup">
                    <input
                      value={vendor}
                      onChange={(event) => updateVendor(event.target.value)}
                      onFocus={() => setVendorOpen(true)}
                      onBlur={() => setVendorOpen(false)}
                      placeholder="Cari vendor"
                      autoComplete="off"
                      aria-autocomplete="list"
                      aria-expanded={vendorOpen && vendor.trim().length > 0}
                      required
                    />
                    {vendorOpen && vendor.trim().length > 0 && (
                      <LookupList
                        loading={lookupLoading}
                        emptyText="Vendor aktif tidak ditemukan."
                        items={vendorMatches.map((item) => ({
                          id: item.idvendor,
                          label: item.nama_vendor,
                          detail: item.badan_hukum === 'Y' ? 'Berbadan hukum' : 'Perorangan',
                        }))}
                        onSelect={(id) => {
                          const item = vendors.find((candidate) => candidate.idvendor === id)
                          if (item) selectVendor(item)
                        }}
                      />
                    )}
                  </div>
                </Field>
                <Field label="Pemohon">
                  <input value={user?.username ?? 'Pengguna aktif'} readOnly />
                </Field>
              </div>
              {lookupError && (
                <p className="field-error" role="alert">
                  {lookupError}
                </p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Item pengadaan</h2>
                <p>Tambah atau hapus item pengadaan.</p>
              </div>
              <button
                className="btn btn--secondary btn--sm"
                type="button"
                onClick={() => setLines((current) => [...current, emptyLine()])}
              >
                <Icon name="plus" size={13} />
                Tambah item
              </button>
            </div>
            <div className="card-body">
              <div className="line-items">
                {lines.map((line, index) => (
                  <div className="line-item" key={index}>
                    <div className="line-item-grid">
                      <Field label="Barang" required>
                        <div className="lookup">
                          <input
                            value={line.name}
                            onChange={(event) => updateLine(index, 'name', event.target.value)}
                            onFocus={() => setActiveProductLine(index)}
                            onBlur={() => setActiveProductLine(null)}
                            placeholder="Cari barang"
                            autoComplete="off"
                            aria-autocomplete="list"
                            aria-expanded={
                              activeProductLine === index && line.name.trim().length > 0
                            }
                            required
                          />
                          {activeProductLine === index && line.name.trim().length > 0 && (
                            <LookupList
                              loading={lookupLoading}
                              emptyText="Barang aktif tidak ditemukan."
                              items={filterProducts(products, line.name).map((item) => ({
                                id: item.idbarang,
                                label: item.nama,
                                detail: `${item.nama_satuan} · ${item.jenis}`,
                              }))}
                              onSelect={(id) => {
                                const item = products.find(
                                  (candidate) => candidate.idbarang === id,
                                )
                                if (item) selectProduct(index, item)
                              }}
                            />
                          )}
                        </div>
                      </Field>
                      <Field label="Harga satuan" required>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={line.price}
                          onChange={(event) => updateLine(index, 'price', event.target.value)}
                          placeholder="0"
                          required
                        />
                      </Field>
                      <Field label="Jumlah" required>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.qty}
                          onChange={(event) => updateLine(index, 'qty', event.target.value)}
                          placeholder="1"
                          required
                        />
                      </Field>
                      <strong className="line-subtotal">
                        {formatMoney((Number(line.price) || 0) * (Number(line.qty) || 0))}
                      </strong>
                      <button
                        className="icon-btn icon-btn--sm icon-btn--danger"
                        type="button"
                        aria-label="Hapus baris"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((current) =>
                            current.filter((_, lineIndex) => lineIndex !== index),
                          )
                        }
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {formError && (
                <p className="field-error" role="alert">
                  {formError}
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="card summary-card">
          <div className="card-head">
            <div>
              <h2>Ringkasan</h2>
              <p>Perhitungan total pengadaan.</p>
            </div>
          </div>
          <div className="card-body">
            <Field
              label="PPN (%)"
              hint="Isi persen 0–100, bukan nominal rupiah. Contoh: 11 untuk 11%."
            >
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                inputMode="numeric"
                value={ppn}
                onChange={(event) => setPpn(event.target.value)}
                placeholder="0"
              />
            </Field>
            <div className="summary-rows">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span>PPN {Number(ppn) || 0}%</span>
                <strong>{formatMoney(tax)}</strong>
              </div>
              <div className="summary-row summary-row--strong">
                <span>Total</span>
                <strong>{formatMoney(total)}</strong>
              </div>
            </div>
            <button
              className="btn btn--primary btn--block"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Menyimpan…' : 'Simpan pengadaan'}
            </button>
            <button
              className="btn btn--secondary btn--block"
              type="button"
              disabled={submitting}
              onClick={() => navigate('/pengadaan')}
            >
              Batal
            </button>
          </div>
        </aside>
      </form>
    </div>
  )
}

type LookupItem = { id: number; label: string; detail: string }

function LookupList({
  loading,
  emptyText,
  items,
  onSelect,
}: {
  loading: boolean
  emptyText: string
  items: LookupItem[]
  onSelect: (id: number) => void
}) {
  if (loading) return <div className="lookup-list lookup-list--state">Memuat data…</div>
  if (items.length === 0) return <div className="lookup-list lookup-list--state">{emptyText}</div>

  return (
    <ul className="lookup-list" role="listbox">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            role="option"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(item.id)}
          >
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </button>
        </li>
      ))}
    </ul>
  )
}

function filterVendors(items: Vendor[], query: string): Vendor[] {
  const term = query.trim().toLowerCase()
  if (!term) return []
  return items.filter((item) => item.nama_vendor.toLowerCase().includes(term)).slice(0, 8)
}

function filterProducts(items: Barang[], query: string): Barang[] {
  const term = query.trim().toLowerCase()
  if (!term) return []
  return items.filter((item) => item.nama.toLowerCase().includes(term)).slice(0, 8)
}
