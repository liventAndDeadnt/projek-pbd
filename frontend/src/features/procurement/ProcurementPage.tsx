import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  StatusBadge,
  Toast,
} from '../../shared/components'
import { formatMoney } from '../../shared/format'
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'

type DraftLine = { name: string; price: string; qty: string }

const emptyLine = (): DraftLine => ({ name: '', price: '', qty: '' })
const STATUS_STEPS = ['Pending', 'Approved', 'Partial', 'Completed']

export function ProcurementPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState('Semua status')
  const [query, setQuery] = useState('')
  const tabs = ['Semua status', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Partial', 'Completed']
  const canCreate = user?.role === 'admin' || user?.role === 'purchasing'

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
              placeholder="Cari ID pengadaan…"
              aria-label="Cari pengadaan"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="toolbar-actions">
            <span className="result-count">0 pengadaan</span>
          </div>
        </div>

        <div className="tabs" role="tablist" aria-label="Filter status pengadaan">
          {tabs.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={status === tab}
              className={`tab${status === tab ? ' is-active' : ''}`}
              onClick={() => setStatus(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID pengadaan</th>
                <th>Vendor</th>
                <th>Pemohon</th>
                <th>Tanggal</th>
                <th className="num">Subtotal</th>
                <th className="num">PPN</th>
                <th className="num">Total</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody />
          </table>
        </div>

        <EmptyState
          icon="clipboard"
          title={
            query
              ? 'Tidak ada pengadaan yang cocok.'
              : status === 'Semua status'
                ? 'Belum ada pengadaan.'
                : `Belum ada pengadaan berstatus ${status}.`
          }
          detail="Pengadaan akan tampil di sini setelah modul procurement terhubung ke API."
          action={
            canCreate ? (
              <Link className="btn btn--secondary btn--sm" to="/pengadaan/baru">
                Buat pengadaan pertama
              </Link>
            ) : undefined
          }
        />
      </section>
    </div>
  )
}

export function ProcurementDetailPage() {
  const { id } = useParams()
  const [confirmAction, setConfirmAction] = useState('')
  const [toast, setToast] = useState('')

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Procurement · detail"
        title={`Pengadaan #${id ?? '—'}`}
        description="Rincian vendor, pemohon, status, dan item pengadaan."
        action={
          <Link className="btn btn--secondary" to="/pengadaan">
            Kembali
          </Link>
        }
      />

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Informasi pengadaan</h2>
            <p>Data pengadaan belum tersedia dari API.</p>
          </div>
          <StatusBadge tone="neutral">Belum ada data</StatusBadge>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <span>Vendor</span>
              <strong>—</strong>
            </div>
            <div className="info-item">
              <span>Pemohon</span>
              <strong>—</strong>
            </div>
            <div className="info-item">
              <span>Tanggal</span>
              <strong>—</strong>
            </div>
            <div className="info-item">
              <span>Subtotal</span>
              <strong>Rp 0</strong>
            </div>
            <div className="info-item">
              <span>PPN</span>
              <strong>Rp 0</strong>
            </div>
            <div className="info-item">
              <span>Total</span>
              <strong>Rp 0</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Item pengadaan</h2>
            <p>Barang, harga satuan, jumlah, dan subtotal.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Barang</th>
                <th className="num">Harga satuan</th>
                <th className="num">Jumlah</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="box"
          title="Belum ada item."
          detail="Item pengadaan akan tampil setelah data tersimpan."
        />
        <div className="card-body">
          <div className="form-actions">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => setToast('Fitur persetujuan belum terhubung ke API.')}
            >
              Setujui
            </button>
            <button
              className="btn btn--danger"
              type="button"
              onClick={() => setConfirmAction('pembatalan')}
            >
              Batalkan
            </button>
          </div>
        </div>
      </section>

      {confirmAction && (
        <Modal
          title="Batalkan pengadaan?"
          description="Tindakan ini akan membatalkan pengadaan."
          onClose={() => setConfirmAction('')}
        >
          <p className="confirm-copy">Tinjau kembali tindakan ini sebelum melanjutkan.</p>
          <div className="form-actions">
            <button className="btn btn--secondary" type="button" onClick={() => setConfirmAction('')}>
              Kembali
            </button>
            <button
              className="btn btn--danger"
              type="button"
              onClick={() => {
                setConfirmAction('')
                setToast('Pembatalan belum terhubung ke API.')
              }}
            >
              Konfirmasi
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
  const [ppn, setPpn] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()])
  const [toast, setToast] = useState('')
  const subtotal = lines.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 0), 0)
  const tax = subtotal * ((Number(ppn) || 0) / 100)
  const total = subtotal + tax

  function updateLine(index: number, key: keyof DraftLine, value: string) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, [key]: value } : line)))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setToast('Pengadaan belum disimpan; modul ini masih berupa pratinjau UI.')
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Procurement · pengadaan"
        title="Buat pengadaan"
        description="Susun vendor dan item, lalu tinjau nilai pengadaan sebelum disimpan."
        action={
          <button className="btn btn--secondary" type="button" onClick={() => navigate('/pengadaan')}>
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
                <Field label="Vendor" required hint="Pilih atau masukkan nama vendor.">
                  <input
                    value={vendor}
                    onChange={(event) => setVendor(event.target.value)}
                    placeholder="Nama vendor"
                    required
                  />
                </Field>
                <Field label="Pemohon">
                  <input value={user?.username ?? 'Pengguna aktif'} readOnly />
                </Field>
                <Field label="Catatan" full>
                  <textarea rows={3} placeholder="Catatan opsional untuk permintaan" />
                </Field>
              </div>
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
                        <input
                          value={line.name}
                          onChange={(event) => updateLine(index, 'name', event.target.value)}
                          placeholder="Nama barang"
                          required
                        />
                      </Field>
                      <Field label="Harga satuan" required>
                        <input
                          type="number"
                          min="0"
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
                          setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))
                        }
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
            <Field label="PPN (%)" hint="Masukkan tarif PPN yang berlaku.">
              <input
                type="number"
                min="0"
                step="0.01"
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
            <button className="btn btn--primary btn--block" type="submit">
              Simpan pengadaan
            </button>
            <button
              className="btn btn--secondary btn--block"
              type="button"
              onClick={() => navigate('/pengadaan')}
            >
              Batal
            </button>
            <p className="result-count">Tombol simpan masih berupa pratinjau UI.</p>
          </div>
        </aside>
      </form>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
