import { useEffect, useMemo, useState } from 'react'
import { EmptyState, Field, Modal, PageHeader, Toast } from '../../shared/components'
import { formatMoney, formatNumber } from '../../shared/format'
import { Icon } from '../../shared/icons'
import { listBarang } from '../catalog/catalog.api'
import type { Barang } from '../catalog/catalog.types'
import { useAuth } from '../identity/useAuth'
import { useActiveMargin } from './useActiveMargin'

type CartLine = {
  idbarang: number
  nama: string
  nama_satuan: string
  harga: number
  qty: number
}

function sellPrice(basePrice: number, percent: number): number {
  return Math.round(basePrice * (1 + percent / 100))
}

export default function PosPage() {
  const { user } = useAuth()
  const { percent: marginPercent, loading: marginLoading } = useActiveMargin()
  const [products, setProducts] = useState<Barang[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [ppn, setPpn] = useState('')
  const [cash, setCash] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptTime, setReceiptTime] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    let mounted = true

    listBarang('', 'Aktif')
      .then((rows) => {
        if (mounted) {
          setProducts(rows)
          setProductsError('')
        }
      })
      .catch(() => {
        if (mounted) setProductsError('Daftar barang belum dapat dimuat.')
      })
      .finally(() => {
        if (mounted) setProductsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((product) => product.nama.toLowerCase().includes(term))
  }, [products, search])

  const subtotal = cart.reduce((sum, line) => sum + sellPrice(line.harga, marginPercent) * line.qty, 0)
  const tax = subtotal * ((Number(ppn) || 0) / 100)
  const total = subtotal + tax
  const change = Math.max(0, (Number(cash) || 0) - total)

  function addToCart(product: Barang) {
    setCart((current) => {
      const existing = current.find((line) => line.idbarang === product.idbarang)
      if (existing) {
        return current.map((line) =>
          line.idbarang === product.idbarang ? { ...line, qty: line.qty + 1 } : line,
        )
      }
      return [
        ...current,
        {
          idbarang: product.idbarang,
          nama: product.nama,
          nama_satuan: product.nama_satuan,
          harga: product.harga,
          qty: 1,
        },
      ]
    })
    setPaymentError('')
  }

  function changeQty(idbarang: number, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.idbarang === idbarang ? { ...line, qty: Math.max(0, line.qty + delta) } : line,
        )
        .filter((line) => line.qty > 0),
    )
  }

  function removeLine(idbarang: number) {
    setCart((current) => current.filter((line) => line.idbarang !== idbarang))
  }

  function checkout() {
    if (cart.length === 0) {
      setPaymentError('Keranjang masih kosong. Tambahkan barang terlebih dahulu.')
      return
    }
    if ((Number(cash) || 0) < total) {
      setPaymentError('Uang diterima belum mencukupi total pembayaran.')
      return
    }
    setPaymentError('')
    setReceiptTime(new Date().toLocaleString('id-ID'))
    setReceiptOpen(true)
  }

  return (
    <div className="page-stack pos-page">
      <PageHeader
        eyebrow="Kasir · POS"
        title="Point of sale"
        description="Pilih barang, atur jumlah, lalu selesaikan pembayaran."
        action={
          <span className="margin-pill">
            <Icon name="percent" size={14} />
            Margin <strong>{marginLoading ? '…' : `${formatNumber(marginPercent)}%`}</strong>
          </span>
        }
      />

      <div className="pos-layout">
        <section className="card pos-products">
          <div className="card-head">
            <div>
              <h2>Pilih barang</h2>
              <p>{productsLoading ? 'Memuat katalog…' : `${filtered.length} barang aktif`}</p>
            </div>
          </div>
          <div className="card-body">
            <label className="search-field pos-search">
              <Icon name="search" size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari barang…"
                aria-label="Cari barang"
              />
            </label>

            {productsLoading ? (
              <div className="table-state" role="status">
                <span className="spinner" />
                Memuat barang…
              </div>
            ) : productsError ? (
              <EmptyState icon="alert" title="Gagal memuat barang." detail={productsError} />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="box"
                title={search ? 'Barang tidak ditemukan.' : 'Belum ada barang aktif.'}
                detail={
                  search
                    ? 'Coba kata pencarian lain.'
                    : 'Tambahkan barang melalui halaman katalog terlebih dahulu.'
                }
              />
            ) : (
              <div className="product-grid">
                {filtered.map((product) => (
                  <article className="product-card" key={product.idbarang}>
                    <div className="product-top">
                      <span className="product-icon">
                        <Icon name="box" size={15} />
                      </span>
                      <div className="product-info">
                        <strong>{product.nama}</strong>
                        <small>
                          {product.nama_satuan} · {product.jenis}
                        </small>
                      </div>
                    </div>
                    <div className="product-bottom">
                      <div>
                        <strong className="product-price">
                          {formatMoney(sellPrice(product.harga, marginPercent))}
                        </strong>
                        <span className="product-base">{formatMoney(product.harga)}</span>
                      </div>
                      <button
                        className="btn btn--secondary btn--sm"
                        type="button"
                        onClick={() => addToCart(product)}
                      >
                        <Icon name="plus" size={13} />
                        Tambah
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card pos-cart">
          <div className="card-head">
            <div>
              <h2>Keranjang</h2>
              <p>{cart.length} jenis item</p>
            </div>
            <button
              className="btn btn--ghost btn--sm"
              type="button"
              disabled={cart.length === 0}
              onClick={() => {
                setCart([])
                setPaymentError('')
              }}
            >
              Kosongkan
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <span className="empty-icon">
                <Icon name="cart" size={18} />
              </span>
              <strong>Keranjang masih kosong</strong>
              <p>Tambahkan barang dari daftar di sebelah kiri.</p>
            </div>
          ) : (
            <div className="cart-list">
              {cart.map((line) => (
                <div className="cart-line" key={line.idbarang}>
                  <div className="cart-line-main">
                    <strong>{line.nama}</strong>
                    <small>
                      {formatMoney(sellPrice(line.harga, marginPercent))} · {line.nama_satuan}
                    </small>
                  </div>
                  <div className="qty-stepper">
                    <button
                      type="button"
                      aria-label={`Kurangi jumlah ${line.nama}`}
                      onClick={() => changeQty(line.idbarang, -1)}
                    >
                      −
                    </button>
                    <span>{line.qty}</span>
                    <button
                      type="button"
                      aria-label={`Tambah jumlah ${line.nama}`}
                      onClick={() => changeQty(line.idbarang, 1)}
                    >
                      +
                    </button>
                  </div>
                  <strong className="cart-line-total">
                    {formatMoney(sellPrice(line.harga, marginPercent) * line.qty)}
                  </strong>
                  <button
                    className="remove-line"
                    type="button"
                    aria-label={`Hapus ${line.nama}`}
                    onClick={() => removeLine(line.idbarang)}
                  >
                    <Icon name="close" size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="payment-box">
            <div className="payment-row">
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <Field label="PPN (%)" hint="Opsional, sesuai tarif yang berlaku.">
              <input
                type="number"
                min="0"
                step="0.01"
                value={ppn}
                onChange={(event) => setPpn(event.target.value)}
                placeholder="0"
              />
            </Field>
            <div className="payment-row">
              <span>PPN</span>
              <strong>{formatMoney(tax)}</strong>
            </div>
            <div className="payment-row payment-row--total">
              <span>Total</span>
              <strong>{formatMoney(total)}</strong>
            </div>
            <Field label="Uang diterima">
              <input
                type="number"
                min="0"
                value={cash}
                onChange={(event) => {
                  setCash(event.target.value)
                  setPaymentError('')
                }}
                placeholder="Masukkan nominal"
              />
            </Field>
            <div className="payment-row">
              <span>Kembalian</span>
              <strong>{formatMoney(change)}</strong>
            </div>
            {paymentError && (
              <p className="payment-error" role="alert">
                {paymentError}
              </p>
            )}
            <button className="btn btn--primary btn--block checkout-btn" type="button" onClick={checkout}>
              Selesaikan transaksi
              <Icon name="arrowRight" size={15} />
            </button>
            <p className="result-count">Subtotal + PPN = total · Uang diterima − total = kembalian</p>
          </div>
        </section>
      </div>

      {receiptOpen && (
        <Modal
          title="Struk penjualan"
          description="Transaksi ini masih berupa draft tampilan dan belum disimpan ke basis data."
          onClose={() => {
            setReceiptOpen(false)
            setToast('Transaksi selesai. Struk belum disimpan ke basis data.')
          }}
        >
          <div className="receipt">
            <div className="receipt-brand">
              <strong>Inventori GOstore</strong>
              <span>BUKTI PEMBAYARAN</span>
            </div>
            <div className="receipt-meta">
              <span>No. transaksi</span>
              <strong>Belum disimpan</strong>
              <span>Kasir</span>
              <strong>{user?.username ?? '—'}</strong>
              <span>Waktu</span>
              <strong>{receiptTime || '—'}</strong>
            </div>
            <div className="receipt-items">
              {cart.map((line) => (
                <div key={line.idbarang}>
                  <span>
                    {line.nama} × {line.qty}
                  </span>
                  <strong>{formatMoney(sellPrice(line.harga, marginPercent) * line.qty)}</strong>
                </div>
              ))}
            </div>
            <div className="receipt-totals">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>
              <div>
                <span>PPN</span>
                <strong>{formatMoney(tax)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <div>
                <span>Tunai</span>
                <strong>{formatMoney(Number(cash) || 0)}</strong>
              </div>
              <div>
                <span>Kembalian</span>
                <strong>{formatMoney(change)}</strong>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn--secondary" type="button" onClick={() => window.print()}>
                Cetak struk
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => {
                  setReceiptOpen(false)
                  setToast('Transaksi selesai. Struk belum disimpan ke basis data.')
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
