import { useMemo, useState } from 'react'
import { EmptyState, Field, FormActions, Modal, PageHeader, Toast } from '../../shared/components'
import { resources, type ResourceKey, type ResourceSpec } from './resources'
import { useAuth } from '../identity/useAuth'
import { ACTIVE_MARGIN_PERCENT } from '../sales/sales.config'

export default function ResourcePage({ resource }: { resource: ResourceKey }) {
  const { user } = useAuth()
  const spec = resources[resource]
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('terbaru')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [toast, setToast] = useState('')
  const isEmpty = useMemo(() => !query && !status, [query, status])

  function saveResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormOpen(false)
    setToast('Selesai.')
  }

  return <div className="module-page">
    <PageHeader eyebrow={spec.eyebrow} title={spec.title} description={resource === 'penjualan' && user?.role === 'kasir' ? 'Riwayat transaksi kasir aktif.' : spec.description} action={resource === 'penjualan' ? <button className="button button--secondary" onClick={() => setReceiptOpen(true)}>Lihat struk</button> : spec.allowCreate === false ? undefined : <button className="button button--primary" onClick={() => { setFormMode('create'); setFormOpen(true) }}>＋ Tambah {spec.singular}</button>} />
    
    {resource === 'margin' && <div className="margin-summary"><div><span className="eyebrow">MARGIN PENJUALAN</span><strong>{ACTIVE_MARGIN_PERCENT}%</strong><p>Persentase yang digunakan untuk menghitung harga jual.</p></div></div>}
    <section className="panel-card resource-panel">
      <div className="resource-toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label={`Cari ${spec.title}`} placeholder={`Cari ${spec.title.toLowerCase()}…`} value={query} onChange={(event) => { setPage(1); setQuery(event.target.value) }} /></label><div className="toolbar-controls">{resource === 'penjualan' && <><Field label="Dari"><input type="date" /></Field><Field label="Sampai"><input type="date" /></Field></>}{spec.filters?.map((filter) => <select key={filter.label} aria-label={`Filter ${spec.title}`} value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }}><option value="">{filter.label}</option>{filter.options.map((option) => <option key={option}>{option}</option>)}</select>)}<select aria-label="Urutkan" value={sort} onChange={(event) => setSort(event.target.value)}><option value="terbaru">Urutkan: terbaru</option><option value="nama">Urutkan: nama</option><option value="status">Urutkan: status</option></select></div></div>
      <div className="table-scroll"><table className="data-table resource-table"><thead><tr>{spec.columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Aksi</th></tr></thead><tbody /></table></div>
      <EmptyState title={isEmpty ? `Belum ada data ${spec.singular}.` : 'Tidak ada hasil yang cocok.'} detail={spec.note ?? 'Belum ada data untuk ditampilkan.'} />
      <footer className="table-footer"><span>Menampilkan 0 data</span><div><button className="button button--secondary button--small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Sebelumnya</button><span className="page-count">{page}</span><button className="button button--secondary button--small" disabled>Lanjut</button></div></footer>
    </section>
    {formOpen && <ResourceForm spec={spec} mode={formMode} onClose={() => setFormOpen(false)} onSubmit={saveResource} />}
    {receiptOpen && <Modal title="Struk penjualan" onClose={() => setReceiptOpen(false)}><div className="receipt"><div className="receipt-brand"><strong>Inventori GOstore</strong><span>STRUK PENJUALAN</span></div><div className="receipt-meta"><span>No. transaksi</span><strong>—</strong><span>Kasir</span><strong>{user?.username ?? '—'}</strong><span>Waktu</span><strong>—</strong></div><EmptyState title="Belum ada item pada struk." detail="Rincian struk penjualan." /><div className="receipt-totals"><div><span>Subtotal</span><strong>Rp 0</strong></div><div><span>PPN</span><strong>Rp 0</strong></div><div><span>Total</span><strong>Rp 0</strong></div><div><span>Tunai</span><strong>Rp 0</strong></div><div><span>Kembalian</span><strong>Rp 0</strong></div></div><div className="form-actions"><button className="button button--secondary" onClick={() => window.print()}>Cetak layout</button><button className="button button--primary" onClick={() => setReceiptOpen(false)}>Tutup</button></div></div></Modal>}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}
  </div>
}

function ResourceForm({ spec, mode, onClose, onSubmit }: { spec: ResourceSpec; mode: 'create' | 'edit'; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <Modal title={`${mode === 'create' ? 'Tambah' : 'Ubah'} ${spec.singular}`} onClose={onClose}>
    <form onSubmit={onSubmit}>
      <div className="form-grid">{spec.fields.map((field) => <Field key={field.name} label={field.label} required={field.required} hint={field.hint}>
        {field.kind === 'select' ? <select name={field.name} required={field.required}><option value="">Pilih {field.label.toLowerCase()}</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.kind === 'textarea' ? <textarea name={field.name} required={field.required} rows={3} maxLength={field.maxLength} /> : <input name={field.name} type={field.kind ?? 'text'} required={field.required} min={field.kind === 'number' ? 0 : undefined} maxLength={field.maxLength} />}
      </Field>)}</div>
      
      <FormActions onCancel={onClose} />
    </form>
  </Modal>
}
