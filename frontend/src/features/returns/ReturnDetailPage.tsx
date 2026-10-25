import { Link, useParams } from 'react-router-dom'
import { EmptyState, PageHeader, StatusBadge } from '../../shared/components'

export default function ReturnDetailPage() {
  const { id } = useParams()

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Retur vendor · detail"
        title={`Retur #${id ?? '—'}`}
        description="Pengembalian barang ke vendor berdasarkan penerimaan."
        action={
          <Link className="btn btn--secondary" to="/retur">
            Kembali
          </Link>
        }
      />

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Informasi retur</h2>
            <p>Rincian penerimaan dan item retur.</p>
          </div>
          <StatusBadge tone="neutral">Belum ada data</StatusBadge>
        </div>
        <div className="card-body">
          <div className="info-grid">
            <div className="info-item">
              <span>ID retur</span>
              <strong>{id ?? '—'}</strong>
            </div>
            <div className="info-item">
              <span>Penerimaan</span>
              <strong>—</strong>
            </div>
            <div className="info-item">
              <span>Tanggal</span>
              <strong>—</strong>
            </div>
            <div className="info-item">
              <span>Status</span>
              <strong>Belum tersedia</strong>
            </div>
            <div className="info-item">
              <span>Dibuat oleh</span>
              <strong>—</strong>
            </div>
            <div className="info-item">
              <span>Total item</span>
              <strong>0</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Item retur</h2>
            <p>Barang, jumlah, dan alasan pengembalian.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Barang</th>
                <th className="num">Jumlah</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <EmptyState
          icon="rotate"
          title="Belum ada item retur."
          detail="Riwayat pergerakan stok terkait retur akan tampil di sini."
        />
      </section>
    </div>
  )
}
