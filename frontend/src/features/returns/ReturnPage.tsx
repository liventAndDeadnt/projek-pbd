import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  EmptyState,
  Field,
  FormActions,
  Modal,
  PageHeader,
  Toast,
} from '../../shared/components'
import { Icon } from '../../shared/icons'
import { useAuth } from '../identity/useAuth'

export default function ReturnPage({ startOpen = false }: { startOpen?: boolean }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(startOpen)
  const [toast, setToast] = useState('')
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  const canCreate = user?.role === 'admin' || user?.role === 'gudang'

  function closeForm() {
    setOpen(false)
    if (startOpen) navigate('/retur')
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpen(false)
    setConfirming(true)
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Gudang · retur vendor"
        title="Retur barang"
        description="Catat pengembalian item kepada vendor berdasarkan penerimaan."
        action={
          canCreate ? (
            <button className="btn btn--primary" type="button" onClick={() => setOpen(true)}>
              <Icon name="plus" size={15} />
              Buat retur
            </button>
          ) : undefined
        }
      />

      <section className="card workflow-card">
        <h2>Alur retur</h2>
        <p>Penerimaan → Pilih item → Jumlah & alasan → Konfirmasi</p>
        <div className="process-steps">
          {['Penerimaan', 'Barang', 'Jumlah & alasan', 'Konfirmasi'].map((step, index) => (
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
            <h2>Riwayat retur</h2>
            <p>Daftar pengembalian barang ke vendor.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID retur</th>
                <th>Penerimaan</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="rotate"
          title="Belum ada retur."
          detail="Riwayat retur akan tampil setelah modul retur terhubung ke API."
          action={
            canCreate ? (
              <button className="btn btn--secondary btn--sm" type="button" onClick={() => setOpen(true)}>
                Buat retur
              </button>
            ) : undefined
          }
        />
      </section>

      {open && (
        <Modal title="Buat retur" description="Isi detail pengembalian barang." onClose={closeForm}>
          <form onSubmit={submit}>
            <div className="form-grid">
              <Field label="ID penerimaan" required>
                <input placeholder="Masukkan referensi penerimaan" required />
              </Field>
              <Field label="Barang" required>
                <input placeholder="Nama barang" required />
              </Field>
              <Field label="Jumlah" required>
                <input type="number" min="1" placeholder="0" required />
              </Field>
              <Field label="Alasan" required full hint={`${reason.length}/200 karakter`}>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value.slice(0, 200))}
                  rows={4}
                  maxLength={200}
                  required
                />
              </Field>
            </div>
            <FormActions onCancel={closeForm} submit="Lanjutkan" />
          </form>
        </Modal>
      )}

      {confirming && (
        <Modal
          title="Konfirmasi retur?"
          description="Retur adalah pengembalian barang kepada vendor."
          onClose={() => {
            setConfirming(false)
            if (startOpen) navigate('/retur')
          }}
        >
          <p className="confirm-copy">
            Retur ini belum disimpan ke basis data karena modul backend masih dalam pengembangan.
          </p>
          <div className="form-actions">
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => {
                setConfirming(false)
                if (startOpen) navigate('/retur')
              }}
            >
              Kembali
            </button>
            <button
              className="btn btn--danger"
              type="button"
              onClick={() => {
                setConfirming(false)
                if (startOpen) navigate('/retur')
                setToast('Retur belum disimpan; modul ini masih pratinjau UI.')
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
