import { Link } from 'react-router-dom'
import { EmptyState, PageHeader, StatusBadge } from '../../shared/components'
import { useAuth } from '../identity/useAuth'
import { formatMoney } from '../../shared/format'
import { isRole, ROLE_LABEL } from './roles'

const intro = {
  admin: ['Ikhtisar sistem', 'Pantau master data, transaksi, persediaan, dan laporan.'],
  purchasing: ['Ruang kerja purchasing', 'Lihat prioritas permintaan dan alur pengadaan.'],
  gudang: ['Operasional gudang', 'Pantau penerimaan, retur, dan pergerakan persediaan.'],
  kasir: ['Aktivitas kasir', 'Mulai transaksi penjualan dan akses riwayat.'],
}

export default function DashboardPage() {
  const { user } = useAuth()
  const role = user && isRole(user.role) ? user.role : 'admin'
  return <div className="module-page dashboard-page">
    <PageHeader eyebrow={`${ROLE_LABEL[role].toUpperCase()} · BERANDA`} title={intro[role][0]} description={`${intro[role][1]} Halo, ${user?.username ?? 'pengguna'}.`} />
    
    {role === 'admin' && <AdminDashboard />}
    {role === 'purchasing' && <PurchasingDashboard />}
    {role === 'gudang' && <WarehouseDashboard />}
    {role === 'kasir' && <CashierDashboard />}
  </div>
}

function AdminDashboard() {
  return <><div className="stat-grid stat-grid--four dashboard-stats"><Metric label="Penjualan hari ini" value={formatMoney(0)} /><Metric label="Pengadaan aktif" value="0" /><Metric label="Stok menipis" value="0" /><Metric label="Retur periode ini" value="0" /></div><div className="dashboard-lower"><section className="panel-card"><div className="panel-heading"><div><span className="panel-icon">⌁</span><div><h2>Ikhtisar operasional</h2><p>Ringkasan aktivitas operasional.</p></div></div></div><div className="overview-grid"><OverviewTile title="Penjualan" text="Belum ada ringkasan penjualan." /><OverviewTile title="Pengadaan" text="Belum ada progres pengadaan." /><OverviewTile title="Persediaan" text="Belum ada ringkasan stok." /><OverviewTile title="Retur" text="Belum ada ringkasan retur." /></div></section><section className="panel-card"><div className="panel-heading"><div><span className="panel-icon panel-icon--green">＋</span><div><h2>Akses cepat</h2><p>Menu administrasi utama</p></div></div></div><QuickLinks items={[["Tambah barang", "/barang"], ["Atur margin", "/margin"], ["Buka laporan", "/laporan/penjualan"]]} /></section></div><section className="panel-card dashboard-empty"><div className="panel-heading"><div><span className="panel-icon">◷</span><div><h2>Aktivitas terbaru</h2><p>Penjualan, pengadaan, penerimaan, dan retur</p></div></div><StatusBadge>Aktivitas</StatusBadge></div><EmptyState title="Belum ada aktivitas untuk ditampilkan." detail="Transaksi dan aktivitas operasional terbaru." /></section></>
}

function PurchasingDashboard() {
  return <><div className="dashboard-action-banner"><div><span className="eyebrow">PRIORITAS PENGADAAN</span><h2>Siapkan permintaan baru</h2><p>Buat pengadaan dengan vendor dan beberapa item.</p></div><Link className="button button--primary" to="/pengadaan/baru">＋ Buat pengadaan</Link></div><div className="stat-grid stat-grid--four dashboard-stats"><Metric label="Menunggu" value="0" /><Metric label="Disetujui" value="0" /><Metric label="Dalam penerimaan" value="0" /><Metric label="Selesai" value="0" /></div><section className="panel-card dashboard-empty"><div className="panel-heading"><div><span className="panel-icon">⇧</span><div><h2>Antrean pengadaan</h2><p>Status dan progres permintaan</p></div></div><Link className="text-link" to="/pengadaan">Lihat semua →</Link></div><EmptyState title="Belum ada pengadaan yang perlu diproses." detail="Belum ada pengadaan untuk ditampilkan." /><div className="process-steps dashboard-process">{['Draft', 'Approval', 'Penerimaan', 'Selesai'].map((item, index) => <div className="process-step" key={item}><span>{`0${index + 1}`}</span><strong>{item}</strong></div>)}</div></section><div className="dashboard-lower"><ShortcutCard title="Referensi vendor" text="Master data vendor yang digunakan pada permintaan." to="/vendor" /><ShortcutCard title="Riwayat pengadaan" text="Daftar permintaan dan status approval." to="/pengadaan" /></div></>
}

function WarehouseDashboard() {
  return <><div className="stat-grid stat-grid--four dashboard-stats"><Metric label="Penerimaan dalam antrean" value="0" /><Metric label="Penerimaan parsial" value="0" /><Metric label="Retur menunggu" value="0" /><Metric label="Barang stok rendah" value="0" /></div><div className="dashboard-lower"><section className="panel-card"><div className="panel-heading"><div><span className="panel-icon">↧</span><div><h2>Antrean penerimaan</h2><p>PO dapat diterima dalam beberapa batch.</p></div></div><Link className="text-link" to="/penerimaan">Buka antrean →</Link></div><EmptyState title="Tidak ada penerimaan dalam antrean." detail="Saat tersedia, setiap baris menampilkan jumlah dipesan, diterima, dan sisa." /></section><section className="panel-card"><div className="panel-heading"><div><span className="panel-icon panel-icon--green">▦</span><div><h2>Ringkasan stok</h2><p>Ledger baca-saja</p></div></div></div><EmptyState title="Belum ada data stok." detail="Ringkasan pergerakan stok barang." /><div className="panel-action"><Link className="button button--secondary button--small" to="/kartu-stok">Buka kartu stok</Link></div></section></div><section className="panel-card dashboard-empty"><div className="panel-heading"><div><span className="panel-icon">↶</span><div><h2>Retur ke vendor</h2><p>Retur terkait barang yang pernah diterima</p></div></div><Link className="text-link" to="/retur">Lihat retur →</Link></div><EmptyState title="Belum ada retur yang perlu ditangani." detail="Belum ada retur untuk ditampilkan." /></section></>
}

function CashierDashboard() {
  return <><div className="pos-hero"><div><span className="eyebrow">KASIR</span><h2>Siap melayani penjualan?</h2><p>Buka POS untuk memulai transaksi penjualan.</p></div><Link className="button button--primary pos-hero-cta" to="/pos">Buka POS <span>→</span></Link></div><div className="stat-grid stat-grid--three dashboard-stats"><Metric label="Penjualan hari ini" value={formatMoney(0)} /><Metric label="Transaksi hari ini" value="0" /><Metric label="Rata-rata transaksi" value={formatMoney(0)} /></div><section className="panel-card dashboard-empty"><div className="panel-heading"><div><span className="panel-icon">◷</span><div><h2>Transaksi terbaru</h2><p>Riwayat transaksi kasir aktif</p></div></div><Link className="text-link" to="/penjualan">Riwayat penjualan →</Link></div><EmptyState title="Belum ada transaksi hari ini." detail="Ringkasan penjualan dan pembayaran." /></section><div className="dashboard-lower"><ShortcutCard title="Katalog barang" text="Referensi barang tersedia pada modul katalog." to="/barang" /><section className="panel-card cashier-note"><div className="panel-heading"><div><span className="panel-icon">i</span><div><h2>Harga jual</h2><p>Margin penjualan</p></div></div></div><div className="cashier-margin"><strong>10%</strong><span>Margin yang digunakan untuk menghitung harga jual.</span></div></section></div></>
}

function Metric({ label, value }: { label: string; value: string }) { return <article className="stat-card metric-card"><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">Belum ada data</span></article> }
function OverviewTile({ title, text }: { title: string; text: string }) { return <div className="overview-tile"><strong>{title}</strong><p>{text}</p></div> }
function QuickLinks({ items }: { items: [string, string][] }) { return <div className="workflow-list">{items.map(([label, to]) => <Link className="workflow-row" to={to} key={label}><span className="row-mark">↗</span><span className="workflow-text"><strong>{label}</strong><small>Buka halaman</small></span><span className="row-arrow">→</span></Link>)}</div> }
function ShortcutCard({ title, text, to }: { title: string; text: string; to: string }) { return <section className="panel-card shortcut-card"><div><span className="panel-icon panel-icon--green">↗</span><h2>{title}</h2><p>{text}</p></div><Link className="text-link" to={to}>Buka halaman →</Link></section> }
