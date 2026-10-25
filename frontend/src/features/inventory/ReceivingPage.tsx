import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  EmptyState,
  Field,
  Modal,
  PageHeader,
  StatusBadge,
  Toast,
} from '../../shared/components'
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'

type ReceiveLine = { name: string; ordered: string; received: string; incoming: string }

const newLine = (): ReceiveLine => ({ name: '', ordered: '', received: '0', incoming: '' })

export function ReceivingPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('view') === 'riwayat' ? 'Riwayat' : 'Antrian'
  const canCreate = user?.role === 'admin' || user?.role === 'gudang'

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
        <p>Pantau jumlah diterima dan sisa kuantitas pada setiap batch.</p>
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
            <p>Pengadaan yang menunggu barang masuk.</p>
          </div>
          <div className="toolbar-actions">
            <StatusBadge tone="blue">Draft</StatusBadge>
            <StatusBadge tone="amber">Partial</StatusBadge>
            <StatusBadge tone="green">Completed</StatusBadge>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Pengadaan</th>
                <th>Vendor</th>
                <th className="num">Item</th>
                <th className="num">Dipesan</th>
                <th className="num">Diterima</th>
                <th className="num">Sisa</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="inbox"
          title={tab === 'Antrian' ? 'Tidak ada penerimaan dalam antrean.' : 'Belum ada riwayat penerimaan.'}
          detail="Data penerimaan akan tampil setelah modul penerimaan terhubung ke API."
        />
      </section>
    </div>
  )
}

export function ReceivingFormPage() {
  const navigate = useNavigate()
  const [po, setPo] = useState('')
  const [lines, setLines] = useState<ReceiveLine[]>([newLine()])
  const [toast, setToast] = useState('')
  const [confirming, setConfirming] = useState(false)

  function update(index: number, key: keyof ReceiveLine, value: string) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, [key]: value } : line)))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConfirming(true)
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

      <form className="card" onSubmit={submit}>
        <div className="card-head">
          <div>
            <h2>Referensi pengadaan</h2>
            <p>Pilih pengadaan yang akan diterima.</p>
          </div>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <Field label="ID pengadaan" required>
              <input
                value={po}
                onChange={(event) => setPo(event.target.value)}
                placeholder="Masukkan ID pengadaan"
                required
              />
            </Field>
            <Field label="Catatan batch">
              <input placeholder="Catatan opsional" />
            </Field>
          </div>

          <div className="divider" />

          <div className="card-head" style={{ padding: 0, borderBottom: 0 }}>
            <div>
              <h2>Barang yang diterima</h2>
              <p>Ordered, received, dan remaining ditampilkan per item.</p>
            </div>
            <button
              className="btn btn--secondary btn--sm"
              type="button"
              onClick={() => setLines((current) => [...current, newLine()])}
            >
              <Icon name="plus" size={13} />
              Tambah barang
            </button>
          </div>

          <div className="line-items" style={{ marginTop: 12 }}>
            {lines.map((line, index) => {
              const ordered = Number(line.ordered) || 0
              const received = Number(line.received) || 0
              const incoming = Number(line.incoming) || 0
              const maxIncoming = Math.max(0, ordered - received)
              const remaining = Math.max(0, maxIncoming - incoming)
              const progress = ordered ? Math.min(100, ((received + incoming) / ordered) * 100) : 0
              return (
                <div className="line-item" key={index}>
                  <div className="line-item-grid">
                    <Field label="Barang" required>
                      <input
                        value={line.name}
                        onChange={(event) => update(index, 'name', event.target.value)}
                        placeholder="Nama barang"
                        required
                      />
                    </Field>
                    <Field label="Dipesan">
                      <input
                        type="number"
                        min="0"
                        value={line.ordered}
                        onChange={(event) => update(index, 'ordered', event.target.value)}
                        placeholder="0"
                      />
                    </Field>
                    <Field label="Sudah diterima">
                      <input
                        type="number"
                        min="0"
                        value={line.received}
                        onChange={(event) => update(index, 'received', event.target.value)}
                      />
                    </Field>
                    <Field label="Diterima batch ini" required>
                      <input
                        type="number"
                        min="1"
                        max={ordered > 0 ? maxIncoming : undefined}
                        value={line.incoming}
                        onChange={(event) => update(index, 'incoming', event.target.value)}
                        placeholder="0"
                        required
                      />
                    </Field>
                    <strong className="line-subtotal">Sisa {remaining}</strong>
                  </div>
                  <div className="progress" aria-hidden="true">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="form-actions">
            <button className="btn btn--secondary" type="button" onClick={() => navigate('/penerimaan')}>
              Batal
            </button>
            <button className="btn btn--primary" type="submit">
              Konfirmasi batch
            </button>
          </div>
        </div>
      </form>

      {confirming && (
        <Modal
          title="Konfirmasi batch penerimaan?"
          description="Pastikan jumlah batch sudah sesuai draft."
          onClose={() => setConfirming(false)}
        >
          <p className="confirm-copy">
            Batch penerimaan ini belum disimpan ke basis data karena modul backend masih dalam
            pengembangan.
          </p>
          <div className="form-actions">
            <button className="btn btn--secondary" type="button" onClick={() => setConfirming(false)}>
              Kembali
            </button>
            <button
              className="btn btn--primary"
              type="button"
              onClick={() => {
                setConfirming(false)
                setToast('Penerimaan belum disimpan; modul ini masih pratinjau UI.')
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

export function ReceivingDetailPage() {
  const { id } = useParams()

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Gudang · detail penerimaan"
        title={`Penerimaan #${id ?? '—'}`}
        description="Rincian batch dan sisa kuantitas."
        action={
          <Link className="btn btn--secondary" to="/penerimaan">
            Kembali
          </Link>
        }
      />

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Progres penerimaan</h2>
            <p>PO → batch penerimaan → sisa → batch berikutnya → selesai</p>
          </div>
          <StatusBadge tone="blue">Draft</StatusBadge>
        </div>
        <div className="process-steps">
          {['Dipesan', 'Diterima sebagian', 'Sisa diproses', 'Selesai'].map((step, index) => (
            <div className="process-step" key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Rincian barang</h2>
            <p>Jumlah dipesan, diterima sebelumnya, batch ini, dan sisa.</p>
          </div>
          <Link className="btn btn--secondary btn--sm" to="/penerimaan/baru">
            Buat batch
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Barang</th>
                <th className="num">Dipesan</th>
                <th className="num">Diterima sebelumnya</th>
                <th className="num">Batch ini</th>
                <th className="num">Sisa</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="inbox"
          title="Belum ada item penerimaan."
          detail="Rincian barang akan tampil setelah penerimaan tersimpan."
        />
      </section>
    </div>
  )
}
