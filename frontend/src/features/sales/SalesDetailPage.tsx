import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState, Modal, PageHeader, StatusBadge, Toast } from '../../shared/components'
import { Icon } from '../../shared/icons'

export default function SalesDetailPage() {
  const { id } = useParams()
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [toast, setToast] = useState('')

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Penjualan · detail"
        title={`Transaksi #${id ?? '—'}`}
        description="Informasi transaksi, rincian item, dan struk pembayaran."
        action={
          <>
            <button className="btn btn--secondary" type="button" onClick={() => setReceiptOpen(true)}>
              <Icon name="receipt" size={15} />
              Lihat struk
            </button>
            <Link className="btn btn--secondary" to="/penjualan">
              Kembali
            </Link>
          </>
        }
      />

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Informasi transaksi</h2>
            <p>Data transaksi belum tersedia dari API.</p>
          </div>
          <StatusBadge tone="neutral">Belum tersimpan</StatusBadge>
        </div>
        <div className="card-body">
          <dl className="detail-grid">
            <div>
              <dt>ID penjualan</dt>
              <dd>{id ?? '—'}</dd>
            </div>
            <div>
              <dt>Waktu</dt>
              <dd>—</dd>
            </div>
            <div>
              <dt>Kasir</dt>
              <dd>—</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>Belum tersedia</dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>Rp 0</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>Rp 0</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Rincian item</h2>
            <p>Barang, jumlah, harga satuan, dan subtotal.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Barang</th>
                <th className="num">Jumlah</th>
                <th className="num">Harga satuan</th>
                <th className="num">Subtotal</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="receipt"
          title="Belum ada detail item."
          detail="Rincian transaksi akan tampil setelah modul penjualan tersimpan ke basis data."
        />
      </section>

      {receiptOpen && (
        <Modal
          title="Struk penjualan"
          description="Pratinjau struk untuk transaksi ini."
          onClose={() => setReceiptOpen(false)}
        >
          <div className="receipt">
            <div className="receipt-brand">
              <strong>Inventori GOstore</strong>
              <span>STRUK PENJUALAN</span>
            </div>
            <div className="receipt-meta">
              <span>No. transaksi</span>
              <strong>#{id ?? '—'}</strong>
              <span>Kasir</span>
              <strong>—</strong>
              <span>Waktu</span>
              <strong>—</strong>
            </div>
            <EmptyState
              icon="receipt"
              title="Belum ada item untuk dicetak."
              detail="Struk akan memuat barang, jumlah, harga, subtotal, PPN, total, tunai, dan kembalian."
            />
            <div className="receipt-totals">
              <div>
                <span>Subtotal</span>
                <strong>Rp 0</strong>
              </div>
              <div>
                <span>PPN</span>
                <strong>Rp 0</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>Rp 0</strong>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="btn btn--secondary"
                type="button"
                onClick={() => setToast('Transaksi belum tersedia untuk dicetak.')}
              >
                Cetak ulang
              </button>
              <button className="btn btn--primary" type="button" onClick={() => setReceiptOpen(false)}>
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
