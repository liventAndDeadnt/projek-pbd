import { useMemo, useState, type FormEvent } from 'react'
import { EmptyState, Field, FormActions, Modal, PageHeader, Toast } from '../../shared/components'
import { formatMoney } from '../../shared/format'
import { useAuth } from '../identity/useAuth'
import { ACTIVE_MARGIN_PERCENT } from './sales.config'

type CartLine = { id: number; name: string; basePrice: number; qty: number }

export default function PosPage() {
  const { user } = useAuth()
  const [cart, setCart] = useState<CartLine[]>([])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  const [ppn, setPpn] = useState('')
  const [cash, setCash] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [toast, setToast] = useState('')
  const filtered = useMemo(() => cart.filter((line) => line.name.toLowerCase().includes(search.toLowerCase())), [cart, search])
  const subtotal = cart.reduce((sum, line) => sum + sellPrice(line.basePrice) * line.qty, 0)
  const tax = subtotal * (Number(ppn) || 0) / 100
  const total = subtotal + tax
  const change = Math.max(0, (Number(cash) || 0) - total)

  function addLine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const basePrice = Number(price)
    const quantity = Number(qty)
    setCart((current) => [...current, { id: Date.now(), name: name.trim(), basePrice, qty: quantity }])
    setName(''); setPrice(''); setQty('1'); setAddOpen(false)
  }
  function changeQty(id: number, delta: number) { setCart((current) => current.map((line) => line.id === id ? { ...line, qty: Math.max(1, line.qty + delta) } : line)) }
  function checkout() {
    if (cart.length === 0) { setPaymentError('Keranjang masih kosong. Tambahkan barang ke keranjang.'); return }
    if ((Number(cash) || 0) < total) { setPaymentError('Uang diterima belum mencukupi total pembayaran.'); return }
    setPaymentError(''); setReceiptOpen(true)
  }

  return <div className="module-page pos-page"><PageHeader eyebrow="KASIR · POS" title="Point of Sale" description="Kelola barang, pembayaran, dan struk penjualan." action={<span className="pos-margin">Margin <strong>{ACTIVE_MARGIN_PERCENT}%</strong></span>} />
    <div className="pos-layout"><section className="panel-card pos-products"><div className="pos-panel-heading"><div><h2>Pilih barang</h2><p>Pilih barang untuk ditambahkan ke transaksi.</p></div><button className="button button--secondary button--small" onClick={() => setAddOpen(true)}>＋ Tambah item</button></div><label className="search-box pos-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari barang…" aria-label="Cari barang" /></label>{filtered.length === 0 ? <EmptyState title={search ? 'Barang tidak ditemukan.' : 'Belum ada barang aktif untuk dipilih.'} detail={search ? 'Ubah kata pencarian atau tambahkan barang.' : 'Cari barang untuk ditambahkan ke keranjang.'} /> : <div className="pos-product-list">{filtered.map((item) => <article className="pos-product-row" key={item.id}><span className="product-placeholder">▦</span><div className="product-meta"><strong>{item.name}</strong><small>Harga dasar {formatMoney(item.basePrice)}</small></div><strong className="product-price">{formatMoney(sellPrice(item.basePrice))}</strong><button className="button button--secondary button--small" onClick={() => changeQty(item.id, 1)}>Tambah</button></article>)}</div>}</section>
      <section className="panel-card pos-cart"><div className="pos-panel-heading"><div><h2>Keranjang</h2><p>{cart.length} jenis item</p></div><button className="text-button" disabled={!cart.length} onClick={() => setCart([])}>Kosongkan</button></div>{cart.length === 0 ? <div className="cart-empty"><span aria-hidden="true">▱</span><strong>Keranjang masih kosong</strong><p>Tambahkan barang untuk memulai transaksi.</p><button className="button button--secondary" onClick={() => setAddOpen(true)}>Tambah item</button></div> : <div className="cart-lines">{cart.map((line) => <div className="cart-line" key={line.id}><div><strong>{line.name}</strong><small>{formatMoney(sellPrice(line.basePrice))} / item</small></div><div className="quantity-stepper"><button aria-label={`Kurangi jumlah ${line.name}`} onClick={() => changeQty(line.id, -1)}>−</button><span>{line.qty}</span><button aria-label={`Tambah jumlah ${line.name}`} onClick={() => changeQty(line.id, 1)}>+</button></div><strong>{formatMoney(sellPrice(line.basePrice) * line.qty)}</strong><button className="remove-line" aria-label={`Hapus ${line.name}`} onClick={() => setCart((current) => current.filter((item) => item.id !== line.id))}>×</button></div>)}</div>}
        <div className="payment-summary"><div className="payment-row"><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><Field label="PPN (%)" hint="Masukkan nilai PPN yang berlaku."><input type="number" min="0" step="0.01" value={ppn} onChange={(event) => setPpn(event.target.value)} placeholder="0" /></Field><div className="payment-row"><span>PPN</span><strong>{formatMoney(tax)}</strong></div><div className="payment-row payment-row--total"><span>Total</span><strong>{formatMoney(total)}</strong></div><Field label="Uang diterima"><input type="number" min="0" value={cash} onChange={(event) => { setCash(event.target.value); setPaymentError('') }} placeholder="Masukkan nominal" /></Field><div className="payment-row"><span>Kembalian</span><strong>{formatMoney(change)}</strong></div>{paymentError && <p className="payment-error" role="alert">{paymentError}</p>}<button className="button button--primary button--full checkout-button" onClick={checkout}>Selesaikan transaksi</button><p className="payment-footnote">Subtotal + PPN = total · Uang diterima − total = kembalian</p></div>
      </section></div>
    {addOpen && <Modal title="Tambah barang" description="Masukkan detail barang untuk ditambahkan ke transaksi." onClose={() => setAddOpen(false)}><form onSubmit={addLine}><div className="form-grid"><Field label="Nama barang" required><input value={name} onChange={(event) => setName(event.target.value)} required autoFocus /></Field><Field label="Harga dasar" required><input type="number" min="0" value={price} onChange={(event) => setPrice(event.target.value)} required /></Field><Field label="Jumlah" required><input type="number" min="1" value={qty} onChange={(event) => setQty(event.target.value)} required /></Field></div><div className="price-estimate"><span>Harga jual (dasar × (1 + margin))</span><strong>{formatMoney(sellPrice(Number(price) || 0))}</strong></div><FormActions onCancel={() => setAddOpen(false)} submit="Tambahkan ke transaksi" /></form></Modal>}
    {receiptOpen && <ReceiptModal cart={cart} subtotal={subtotal} tax={tax} total={total} cash={Number(cash) || 0} change={change} cashier={user?.username ?? 'Pengguna aktif'} onClose={() => { setReceiptOpen(false); setToast('Transaksi selesai.') }} />}
    {toast && <Toast message={toast} onClose={() => setToast('')} />}</div>
}

function sellPrice(basePrice: number) { return Math.round(basePrice * (1 + ACTIVE_MARGIN_PERCENT / 100)) }

function ReceiptModal({ cart, subtotal, tax, total, cash, change, cashier, onClose }: { cart: CartLine[]; subtotal: number; tax: number; total: number; cash: number; change: number; cashier: string; onClose: () => void }) {
  return <Modal title="Lihat struk" onClose={onClose}><div className="receipt"><div className="receipt-brand"><strong>Inventori GOstore</strong><span>BUKTI PEMBAYARAN</span></div><div className="receipt-meta"><span>No. transaksi</span><strong>—</strong><span>Kasir</span><strong>{cashier}</strong><span>Waktu</span><strong>—</strong></div><div className="receipt-items">{cart.map((line) => <div key={line.id}><span>{line.name} × {line.qty}</span><strong>{formatMoney(sellPrice(line.basePrice) * line.qty)}</strong></div>)}</div><div className="receipt-totals"><div><span>Subtotal</span><strong>{formatMoney(subtotal)}</strong></div><div><span>PPN</span><strong>{formatMoney(tax)}</strong></div><div><span>Total</span><strong>{formatMoney(total)}</strong></div><div><span>Tunai</span><strong>{formatMoney(cash)}</strong></div><div><span>Kembalian</span><strong>{formatMoney(change)}</strong></div></div><div className="form-actions"><button className="button button--secondary" onClick={() => window.print()}>Cetak struk</button><button className="button button--primary" onClick={onClose}>Selesai</button></div></div></Modal>
}
