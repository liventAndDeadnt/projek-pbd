import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState, Field, PageHeader, StatusBadge } from '../../shared/components'
import { errorMessage } from '../../shared/api'
import { formatDate, formatMoney, formatNumber } from '../../shared/format'
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'
import { getPengadaan, listPengadaan } from '../procurement/procurement.api'
import { statusMeta } from '../procurement/procurement.config'
import type { Pengadaan, PengadaanDetail } from '../procurement/procurement.types'
import { createPenerimaan, getPenerimaan, listPenerimaan } from './penerimaan.api'
import { penerimaanStatusMeta } from './penerimaan.config'
import type { Penerimaan, PenerimaanDetail } from './penerimaan.types'

async function loadOpenPOs(): Promise<Pengadaan[]> {
  const [approved, partial] = await Promise.all([
    listPengadaan('', 'A'),
    listPengadaan('', 'S'),
  ])
  return [...approved, ...partial].sort((a, b) => b.idpengadaan - a.idpengadaan)
}

export function ReceivingPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('view') === 'riwayat' ? 'Riwayat' : 'Antrian'
  const canCreate = user?.role === 'admin' || user?.role === 'gudang'
  const [openPOs, setOpenPOs] = useState<Pengadaan[]>([])
  const [receipts, setReceipts] = useState<Penerimaan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        if (tab === 'Antrian') {
          const rows = await loadOpenPOs()
          if (active) setOpenPOs(rows)
        } else {
          const rows = await listPenerimaan('', '')
          if (active) setReceipts(rows)
        }
      } catch (err) {
        if (active) setError(errorMessage(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [tab, reload])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Gudang · penerimaan"
        title="Penerimaan barang"
        description="Terima barang dari pengadaan secara bertahap dan pantau sisa kuantitas."
        action={
          canCreate ? (
            <Link className="btn btn--primary" to="/penerimaan/baru">
              <Icon name="plus" size={15} />
              Buat penerimaan
            </Link>
          ) : undefined
        }
      />

      <section className="card workflow-card">
        <h2>Penerimaan dapat dilakukan dalam beberapa batch</h2>
        <p>Setiap batch menambah stok dan memperbarui harga barang dari harga PO.</p>
        <div className="card-body" style={{ padding: '12px 0 0' }}>
          <div className="tabs" role="tablist" aria-label="Jenis daftar penerimaan">
            {['Antrian', 'Riwayat'].map((item) => (
              <button
                key={item}
                role="tab"
                aria-selected={tab === item}
                className={`tab${tab === item ? ' is-active' : ''}`}
                onClick={() => setSearchParams(item === 'Riwayat' ? { view: 'riwayat' } : {})}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>{tab === 'Antrian' ? 'Antrean penerimaan' : 'Riwayat penerimaan'}</h2>
            <p>
              {tab === 'Antrian'
                ? 'Pengadaan yang sudah disetujui dan masih memiliki sisa.'
                : 'Dokumen penerimaan yang sudah tersimpan.'}
            </p>
          </div>
          <button className="btn btn--secondary btn--sm" type="button" onClick={() => setReload((n) => n + 1)}>
            Muat ulang
          </button>
        </div>

        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <EmptyState icon="inbox" title="Memuat data…" detail="Mengambil data penerimaan dari server." />
        ) : tab === 'Antrian' ? (
          openPOs.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="Tidak ada pengadaan dalam antrean."
              detail="Semua PO yang disetujui sudah diterima penuh."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Pengadaan</th>
                    <th>Vendor</th>
                    <th className="num">Item</th>
                    <th className="num">Nilai PO</th>
                    <th>Status</th>
                    <th aria-label="Aksi" />
                  </tr>
                </thead>
                <tbody>
                  {openPOs.map((po) => {
                    const meta = statusMeta(po.status)
                    return (
                      <tr key={po.idpengadaan}>
                        <td>
                          <strong>PO #{po.idpengadaan}</strong>
                          <br />
                          <span>{formatDate(po.timestamp)}</span>
                        </td>
                        <td>{po.nama_vendor}</td>
                        <td className="num">{formatNumber(po.jumlah_item)}</td>
                        <td className="num">{formatMoney(po.total_nilai)}</td>
                        <td>
                          <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                        </td>
                        <td>
                          <Link
                            className="btn btn--secondary btn--sm"
                            to={`/penerimaan/baru?po=${po.idpengadaan}`}
                          >
                            Terima
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : receipts.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="Belum ada riwayat penerimaan."
            detail="Riwayat akan tampil setelah penerimaan pertama disimpan."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Penerimaan</th>
                  <th>Pengadaan</th>
                  <th>Vendor</th>
                  <th>Tanggal</th>
                  <th className="num">Total</th>
                  <th>Status</th>
                  <th aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => {
                  const meta = penerimaanStatusMeta(receipt.status)
                  return (
                    <tr key={receipt.idpenerimaan}>
                      <td>
                        <strong>#{receipt.idpenerimaan}</strong>
                      </td>
                      <td>PO #{receipt.idpengadaan}</td>
                      <td>{receipt.nama_vendor}</td>
                      <td>{formatDate(receipt.created_at)}</td>
                      <td className="num">{formatMoney(receipt.total_nilai)}</td>
                      <td>
                        <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      </td>
                      <td>
                        <Link
                          className="btn btn--secondary btn--sm"
                          to={`/penerimaan/${receipt.idpenerimaan}`}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

type ReceiveLine = {
  idbarang: number
  nama: string
  satuan: string
  ordered: number
  received: number
  remaining: number
  price: number
  qty: string
}

export function ReceivingFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [openPOs, setOpenPOs] = useState<Pengadaan[]>([])
  const [selectedId, setSelectedId] = useState(searchParams.get('po') ?? '')
  const [detail, setDetail] = useState<PengadaanDetail | null>(null)
  const [lines, setLines] = useState<ReceiveLine[]>([])
  const [loadingPOs, setLoadingPOs] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(Boolean(searchParams.get('po')))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    loadOpenPOs()
      .then((rows) => {
        if (active) setOpenPOs(rows)
      })
      .catch((err) => {
        if (active) setError(errorMessage(err))
      })
      .finally(() => {
        if (active) setLoadingPOs(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectedId) return

    let active = true
    getPengadaan(Number(selectedId))
      .then((data) => {
        if (!active) return
        if (data.status !== 'A' && data.status !== 'S') {
          setDetail(null)
          setLines([])
          setError('Pengadaan ini tidak bisa diterima karena statusnya sudah selesai atau dibatalkan.')
          return
        }
        setDetail(data)
        setLines(
          data.items.map((item) => ({
            idbarang: item.idbarang,
            nama: item.nama_barang,
            satuan: item.nama_satuan,
            ordered: item.jumlah,
            received: item.jumlah_diterima,
            remaining: Math.max(0, item.jumlah - item.jumlah_diterima),
            price: item.harga_satuan,
            qty: '',
          })),
        )
      })
      .catch((err) => {
        if (!active) return
        setDetail(null)
        setLines([])
        setError(errorMessage(err))
      })
      .finally(() => {
        if (active) setLoadingDetail(false)
      })

    return () => {
      active = false
    }
  }, [selectedId])

  const totalQty = lines.reduce((sum, line) => sum + (Number(line.qty) || 0), 0)
  const totalNilai = lines.reduce((sum, line) => sum + (Number(line.qty) || 0) * line.price, 0)

  function updateQty(idbarang: number, value: string) {
    setLines((current) =>
      current.map((line) => (line.idbarang === idbarang ? { ...line, qty: value } : line)),
    )
  }

  function selectPO(value: string) {
    setSelectedId(value)
    setDetail(null)
    setLines([])
    setError('')
    setLoadingDetail(Boolean(value))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!detail || submitting) return
    setError('')

    const items = lines
      .map((line) => ({ line, qty: Number(line.qty) || 0 }))
      .filter(({ qty }) => qty > 0)

    if (items.length === 0) {
      setError('Isi jumlah diterima untuk minimal satu barang.')
      return
    }
    for (const { line, qty } of items) {
      if (!Number.isInteger(qty) || qty > line.remaining) {
        setError(`Jumlah ${line.nama} harus bilangan bulat dan tidak melebihi sisa ${line.remaining}.`)
        return
      }
    }

    setSubmitting(true)
    try {
      const created = await createPenerimaan({
        idpengadaan: detail.idpengadaan,
        items: items.map(({ line, qty }) => ({ idbarang: line.idbarang, jumlah_terima: qty })),
      })
      navigate(`/penerimaan/${created.idpenerimaan}`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Gudang · penerimaan"
        title="Buat batch penerimaan"
        description="Masukkan jumlah yang diterima pada batch ini."
        action={
          <button className="btn btn--secondary" type="button" onClick={() => navigate('/penerimaan')}>
            Kembali
          </button>
        }
      />

      <form className="page-stack" onSubmit={submit}>
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Referensi pengadaan</h2>
              <p>Pilih PO yang sudah disetujui dan masih memiliki sisa.</p>
            </div>
          </div>
          <div className="card-body">
            <Field label="Pengadaan" required hint="Hanya PO dengan status Approved atau Partial.">
              <select
                value={selectedId}
                onChange={(event) => selectPO(event.target.value)}
                disabled={loadingPOs || submitting}
                required
              >
                <option value="">Pilih pengadaan</option>
                {openPOs.map((po) => (
                  <option key={po.idpengadaan} value={po.idpengadaan}>
                    PO #{po.idpengadaan} · {po.nama_vendor}
                  </option>
                ))}
              </select>
            </Field>

            {!loadingPOs && openPOs.length === 0 && (
              <EmptyState
                icon="inbox"
                title="Tidak ada PO yang bisa diterima."
                detail="Buat dan setujui pengadaan terlebih dahulu."
                action={
                  <Link className="btn btn--secondary btn--sm" to="/pengadaan">
                    Lihat pengadaan
                  </Link>
                }
              />
            )}

            {loadingDetail && <EmptyState icon="inbox" title="Memuat item…" detail="Mengambil rincian PO." />}

            {detail && (
              <div className="info-grid" style={{ marginTop: 16 }}>
                <div className="info-item">
                  <span>Vendor</span>
                  <strong>{detail.nama_vendor}</strong>
                </div>
                <div className="info-item">
                  <span>Pemohon</span>
                  <strong>{detail.username}</strong>
                </div>
                <div className="info-item">
                  <span>Total PO</span>
                  <strong>{formatMoney(detail.total_nilai)}</strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {detail && (
          <>
            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Barang yang diterima</h2>
                  <p>Isi jumlah batch ini. Baris dengan jumlah 0 tidak dikirim.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Barang</th>
                      <th className="num">Dipesan</th>
                      <th className="num">Diterima</th>
                      <th className="num">Sisa</th>
                      <th className="num">Harga</th>
                      <th className="num">Jumlah diterima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => (
                      <tr key={line.idbarang}>
                        <td>
                          <strong>{line.nama}</strong>
                          <br />
                          <span>{line.satuan}</span>
                        </td>
                        <td className="num">{formatNumber(line.ordered)}</td>
                        <td className="num">{formatNumber(line.received)}</td>
                        <td className="num">{formatNumber(line.remaining)}</td>
                        <td className="num">{formatMoney(line.price)}</td>
                        <td className="num">
                          <input
                            className="table-input"
                            type="number"
                            min="0"
                            max={line.remaining}
                            step="1"
                            inputMode="numeric"
                            aria-label={`Jumlah diterima ${line.nama}`}
                            value={line.qty}
                            onChange={(event) => updateQty(line.idbarang, event.target.value)}
                            placeholder="0"
                            disabled={line.remaining <= 0 || submitting}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <div>
                  <h2>Ringkasan batch</h2>
                  <p>Total dihitung dari harga PO dan jumlah yang kamu isi.</p>
                </div>
              </div>
              <div className="card-body">
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>Total qty</span>
                    <strong>{formatNumber(totalQty)}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Total nilai</span>
                    <strong>{formatMoney(totalNilai)}</strong>
                  </div>
                </div>
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="form-actions">
                  <button className="btn btn--secondary" type="button" onClick={() => navigate('/penerimaan')}>
                    Batal
                  </button>
                  <button className="btn btn--primary" type="submit" disabled={submitting}>
                    {submitting ? 'Menyimpan…' : 'Simpan penerimaan'}
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {error && !detail && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  )
}

export function ReceivingDetailPage() {
  const { id } = useParams()
  const validId = Number.isInteger(Number(id)) && Number(id) > 0
  const [data, setData] = useState<PenerimaanDetail | null>(null)
  const [loading, setLoading] = useState(validId)
  const [error, setError] = useState(validId ? '' : 'ID penerimaan tidak valid.')

  useEffect(() => {
    if (!validId) return

    let active = true
    getPenerimaan(Number(id))
      .then((detail) => {
        if (active) setData(detail)
      })
      .catch((err) => {
        if (active) setError(errorMessage(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id, validId])

  const meta = data ? penerimaanStatusMeta(data.status) : null

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Gudang · detail penerimaan"
        title={`Penerimaan #${validId ? id : '—'}`}
        description="Rincian batch yang sudah masuk ke stok."
        action={
          <Link className="btn btn--secondary" to="/penerimaan">
            Kembali
          </Link>
        }
      />

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <EmptyState icon="inbox" title="Memuat penerimaan…" detail="Mengambil rincian dari server." />
      ) : !data ? (
        <EmptyState icon="inbox" title="Penerimaan tidak ditemukan." detail="Periksa kembali ID penerimaan." />
      ) : (
        <>
          <section className="card">
            <div className="card-head">
              <div>
                <h2>Informasi penerimaan</h2>
                <p>Dokumen ini sudah menambah stok dan memperbarui harga barang.</p>
              </div>
              {meta && <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>}
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <span>Pengadaan</span>
                  <strong>PO #{data.idpengadaan}</strong>
                </div>
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
                  <strong>{formatDate(data.created_at)}</strong>
                </div>
                <div className="info-item">
                  <span>Total item</span>
                  <strong>{formatNumber(data.jumlah_item)}</strong>
                </div>
                <div className="info-item">
                  <span>Total nilai</span>
                  <strong>{formatMoney(data.total_nilai)}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-head">
              <div>
                <h2>Rincian barang</h2>
                <p>Qty dan harga yang masuk ke stok pada batch ini.</p>
              </div>
            </div>
            {data.items.length === 0 ? (
              <EmptyState icon="inbox" title="Belum ada item." detail="Penerimaan ini tidak memiliki detail barang." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Barang</th>
                      <th>Satuan</th>
                      <th className="num">Qty</th>
                      <th className="num">Harga</th>
                      <th className="num">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.iddetail_penerimaan}>
                        <td>{item.nama_barang}</td>
                        <td>{item.nama_satuan}</td>
                        <td className="num">{formatNumber(item.jumlah_terima)}</td>
                        <td className="num">{formatMoney(item.harga_satuan_terima)}</td>
                        <td className="num">{formatMoney(item.sub_total_terima)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
