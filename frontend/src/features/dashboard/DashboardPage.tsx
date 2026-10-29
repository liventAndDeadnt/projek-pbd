import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PageHeader, StatCard, StatusBadge } from '../../shared/components'
import { formatDay, formatMoney, formatNumber } from '../../shared/format'
import { Icon, type IconName } from '../../shared/icons'
import { listBarang, listSatuan, listVendor } from '../catalog/catalog.api'
import type { Barang } from '../catalog/catalog.types'
import { listPengadaan } from '../procurement/procurement.api'
import type { Pengadaan } from '../procurement/procurement.types'
import { listPenerimaan } from '../inventory/penerimaan.api'
import type { Penerimaan } from '../inventory/penerimaan.types'
import { listUsers } from '../identity/identity.api'
import { useAuth } from '../identity/useAuth'
import { useActiveMargin } from '../sales/useActiveMargin'
import { isRole, ROLE_LABEL, type Role } from './roles'

type QuickLink = { label: string; hint: string; to: string; icon: IconName }

const QUICK_LINKS: Record<Role, QuickLink[]> = {
  admin: [
    { label: 'Kelola barang', hint: 'Master data katalog', to: '/barang', icon: 'box' },
    { label: 'Atur margin', hint: 'Persentase harga jual', to: '/margin', icon: 'percent' },
    { label: 'Buka laporan', hint: 'Ringkasan penjualan', to: '/laporan/penjualan', icon: 'chart' },
  ],
  purchasing: [
    { label: 'Buat pengadaan', hint: 'Mulai permintaan baru', to: '/pengadaan/baru', icon: 'plus' },
    { label: 'Referensi vendor', hint: 'Daftar pemasok', to: '/vendor', icon: 'building' },
    { label: 'Katalog barang', hint: 'Barang yang tersedia', to: '/barang', icon: 'box' },
  ],
  gudang: [
    { label: 'Buat penerimaan', hint: 'Catat barang masuk', to: '/penerimaan/baru', icon: 'inbox' },
    { label: 'Buat retur', hint: 'Kembalikan ke vendor', to: '/retur/baru', icon: 'rotate' },
    { label: 'Kartu stok', hint: 'Riwayat pergerakan', to: '/kartu-stok', icon: 'package' },
  ],
  kasir: [
    { label: 'Buka POS', hint: 'Mulai transaksi baru', to: '/pos', icon: 'cart' },
    { label: 'Riwayat penjualan', hint: 'Transaksi sebelumnya', to: '/penjualan', icon: 'receipt' },
    { label: 'Katalog barang', hint: 'Harga dan satuan', to: '/barang', icon: 'box' },
  ],
}

const INTRO: Record<Role, string> = {
  admin: 'Pantau master data, transaksi, persediaan, dan laporan dari satu tempat.',
  purchasing: 'Kelola permintaan pengadaan dan pantau vendor yang bekerja sama.',
  gudang: 'Pantau penerimaan, retur, dan pergerakan stok barang.',
  kasir: 'Mulai transaksi penjualan dan akses riwayat dengan cepat.',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role: Role = user && isRole(user.role) ? user.role : 'admin'
  const { percent: marginPercent, loading: marginLoading } = useActiveMargin()
  const [barang, setBarang] = useState<Barang[]>([])
  const [pengadaanRows, setPengadaanRows] = useState<Pengadaan[]>([])
  const [penerimaanRows, setPenerimaanRows] = useState<Penerimaan[]>([])
  const [counts, setCounts] = useState({ satuan: 0, vendor: 0, users: 0 })
  const [active, setActive] = useState({ barang: 0, satuan: 0, vendor: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      const [barangResult, satuanResult, vendorResult, pengadaanResult] =
        await Promise.allSettled([
          listBarang('', ''),
          listSatuan('', ''),
          listVendor('', ''),
          role === 'purchasing' ? listPengadaan('', '') : Promise.resolve([]),
        ])

      if (!mounted) return

      const barangRows = barangResult.status === 'fulfilled' ? barangResult.value : []
      const satuanRows = satuanResult.status === 'fulfilled' ? satuanResult.value : []
      const vendorRows = vendorResult.status === 'fulfilled' ? vendorResult.value : []
      const pengadaanData = pengadaanResult.status === 'fulfilled' ? pengadaanResult.value : []

      setBarang(barangRows)
      setPengadaanRows(pengadaanData)
      setCounts({
        satuan: satuanRows.length,
        vendor: vendorRows.length,
        users: 0,
      })
      setActive({
        barang: barangRows.filter((row) => row.status === 1).length,
        satuan: satuanRows.filter((row) => row.status === 1).length,
        vendor: vendorRows.filter((row) => row.status === '1').length,
      })

      if (role === 'admin') {
        const usersResult = await listUsers('', '')
          .then((rows) => rows.length)
          .catch(() => 0)
        if (mounted) setCounts((current) => ({ ...current, users: usersResult }))
      }

      if (role === 'gudang') {
        const rows = await listPenerimaan('', '').catch(() => [])
        if (mounted) setPenerimaanRows(rows)
      }

      if (mounted) setLoading(false)
    }

    void load()
    return () => {
      mounted = false
    }
  }, [role])

  const latest = [...barang].sort((a, b) => b.idbarang - a.idbarang).slice(0, 5)
  const action =
    role === 'admin'
      ? { label: 'Buka katalog', to: '/barang', icon: 'box' as IconName }
      : role === 'purchasing'
        ? { label: 'Buat pengadaan', to: '/pengadaan/baru', icon: 'plus' as IconName }
        : role === 'gudang'
          ? { label: 'Buat penerimaan', to: '/penerimaan/baru', icon: 'inbox' as IconName }
          : { label: 'Buka POS', to: '/pos', icon: 'cart' as IconName }

  const stats =
    role === 'admin'
      ? [
          { label: 'Barang', value: barang.length, note: `${active.barang} aktif`, icon: 'box' as IconName },
          { label: 'Satuan', value: counts.satuan, note: `${active.satuan} aktif`, icon: 'layers' as IconName },
          { label: 'Vendor', value: counts.vendor, note: `${active.vendor} aktif`, icon: 'building' as IconName },
          { label: 'Pengguna', value: counts.users, note: 'Akun internal', icon: 'users' as IconName },
        ]
      : role === 'purchasing'
        ? [
            { label: 'Barang', value: barang.length, note: `${active.barang} aktif`, icon: 'box' as IconName },
            { label: 'Satuan', value: counts.satuan, note: `${active.satuan} aktif`, icon: 'layers' as IconName },
            { label: 'Vendor', value: counts.vendor, note: `${active.vendor} aktif`, icon: 'building' as IconName },
            {
              label: 'Pengadaan',
              value: pengadaanRows.length,
              note: `${pengadaanRows.filter((row) => row.status === 'P').length} pending`,
              icon: 'clipboard' as IconName,
            },
          ]
        : role === 'gudang'
          ? [
              { label: 'Barang', value: barang.length, note: `${active.barang} aktif`, icon: 'box' as IconName },
              { label: 'Satuan', value: counts.satuan, note: `${active.satuan} aktif`, icon: 'layers' as IconName },
              { label: 'Stok', value: 0, note: 'Belum tersedia', icon: 'package' as IconName },
              {
                label: 'Penerimaan',
                value: penerimaanRows.length,
                note: `${penerimaanRows.filter((row) => row.status === 'S').length} partial`,
                icon: 'inbox' as IconName,
              },
            ]
          : [
              { label: 'Barang', value: barang.length, note: `${active.barang} aktif`, icon: 'box' as IconName },
              {
                label: 'Margin aktif',
                value: `${formatNumber(marginPercent)}%`,
                note: 'Harga jual',
                icon: 'percent' as IconName,
              },
              { label: 'Penjualan hari ini', value: 0, note: 'Belum tersedia', icon: 'cart' as IconName },
              { label: 'Transaksi', value: 0, note: 'Belum tersedia', icon: 'receipt' as IconName },
            ]

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow={`${ROLE_LABEL[role]} · beranda`}
        title={`Selamat datang, ${user?.username ?? 'pengguna'}`}
        description={INTRO[role]}
        action={
          <>
            <span className="date-chip">
              <Icon name="calendar" size={14} />
              {formatDay()}
            </span>
            <Link className="btn btn--primary" to={action.to}>
              <Icon name={action.icon} size={15} />
              {action.label}
            </Link>
          </>
        }
      />

      <section className="stat-grid" aria-label="Ringkasan data">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            note={stat.note}
            icon={stat.icon}
            loading={loading || (stat.label === 'Margin aktif' && marginLoading)}
          />
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Barang terbaru</h2>
              <p>Lima barang terakhir yang tercatat di katalog.</p>
            </div>
            <Link className="card-link" to="/barang">
              Lihat semua
              <Icon name="arrowRight" size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="table-state" role="status">
              <span className="spinner" />
              Memuat data…
            </div>
          ) : latest.length === 0 ? (
            <EmptyState
              icon="box"
              title="Belum ada barang."
              detail="Tambahkan barang melalui halaman katalog untuk melihat ringkasannya di sini."
              action={
                role === 'admin' ? (
                  <Link className="btn btn--secondary btn--sm" to="/barang">
                    Buka katalog
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Barang</th>
                      <th className="hide-sm">Jenis</th>
                      <th className="hide-sm">Satuan</th>
                      <th className="num">Harga dasar</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.map((item) => (
                      <tr key={item.idbarang}>
                        <td>
                          <div className="cell">
                            <span className="cell-icon">
                              <Icon name="box" size={15} />
                            </span>
                            <span className="cell-copy">
                              <strong>{item.nama}</strong>
                              <small>ID #{item.idbarang}</small>
                            </span>
                          </div>
                        </td>
                        <td className="hide-sm">{item.jenis}</td>
                        <td className="hide-sm">{item.nama_satuan}</td>
                        <td className="num">{formatMoney(item.harga)}</td>
                        <td>
                          <StatusBadge tone={item.status ? 'green' : 'neutral'}>
                            {item.status ? 'Aktif' : 'Nonaktif'}
                          </StatusBadge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>Menampilkan {latest.length} dari {barang.length} barang</span>
                <Link className="card-link" to="/barang">
                  Kelola katalog
                  <Icon name="arrowRight" size={12} />
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <h2>Akses cepat</h2>
              <p>Menu yang paling sering dipakai untuk peranmu.</p>
            </div>
          </div>
          <div className="quick-list">
            {QUICK_LINKS[role].map((item) => (
              <Link className="quick-link" to={item.to} key={item.to}>
                <span className="quick-icon">
                  <Icon name={item.icon} size={15} />
                </span>
                <span className="quick-copy">
                  <strong>{item.label}</strong>
                  <span>{item.hint}</span>
                </span>
                <span className="quick-arrow">
                  <Icon name="chevronRight" size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="card activity-card">
        <div className="card-head">
          <div>
            <h2>Aktivitas terbaru</h2>
            <p>Penjualan, pengadaan, penerimaan, dan retur akan tampil di sini.</p>
          </div>
          <StatusBadge tone="neutral">Segera hadir</StatusBadge>
        </div>
        <div className="card-body">
          <EmptyState
            icon="clock"
            title="Belum ada aktivitas."
            detail="Data transaksi akan muncul setelah modul pengadaan, penerimaan, retur, dan penjualan terhubung ke basis data."
          />
        </div>
      </section>
    </div>
  )
}
