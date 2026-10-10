import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../identity/useAuth'
import { isRole, ROLE_LABEL, ROLE_NAVIGATION } from './roles'
import './dashboard.css'

export default function AppShell() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const role = user && isRole(user.role) ? user.role : null

  const pageTitles: Record<string, string> = { dashboard: 'Dashboard', barang: 'Barang', satuan: 'Satuan', vendor: 'Vendor', pengguna: 'Pengguna', margin: 'Margin penjualan', pengadaan: 'Pengadaan', penerimaan: 'Penerimaan', retur: 'Retur', penjualan: 'Penjualan', 'kartu-stok': 'Kartu stok', stok: 'Stok', pos: 'POS', laporan: 'Laporan' }
  const currentPath = location.pathname.split('/').filter(Boolean).at(-1) ?? 'dashboard'
  const breadcrumbTitle = currentPath === 'baru' ? location.pathname.startsWith('/retur') ? 'Buat retur' : location.pathname.startsWith('/penerimaan') ? 'Buat penerimaan' : 'Buat pengadaan' : pageTitles[currentPath] ?? currentPath

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      // AuthProvider tetap membersihkan user lokal meski request logout gagal.
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-shell">
      {menuOpen && <button className="sidebar-backdrop" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-brand"><span className="brand-mark">I</span><span>Inventori<span className="brand-light"> GOstore</span></span></div>
        <div className="workspace-label">RUANG KERJA</div>
        <nav aria-label="Navigasi utama" className="nav-list">
          {(role ? ROLE_NAVIGATION[role] : []).map((group, index) => <div className="nav-group" key={group.label ?? `main-${index}`}>
            {group.label && <span className="nav-group-label">{group.label}</span>}
            {group.items.map((item) => <NavLink key={item.to} to={item.to} end onClick={() => setMenuOpen(false)} className={() => { const path = item.to.split('?')[0]; const selected = item.to.includes('?') ? location.search === item.to.slice(item.to.indexOf('?')) : location.pathname === path && !location.search; return `nav-link${selected ? ' nav-link--active' : ''}` }}><span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}</NavLink>)}
          </div>)}
        </nav>
        <div className="sidebar-footer"><span className="status-dot" />Sistem inventori internal</div>
      </aside>
      <div className="shell-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Buka menu" aria-expanded={menuOpen}>☰</button>
          <div className="breadcrumb"><span>Inventori GOstore</span><span className="crumb-separator">/</span><strong>{breadcrumbTitle}</strong></div>
          <div className="topbar-user"><div className="avatar" aria-hidden="true">{user?.username?.slice(0, 1).toUpperCase() ?? 'U'}</div><div className="user-copy"><strong>{user?.username}</strong><span>{role ? ROLE_LABEL[role] : user?.role}</span></div><button type="button" className="logout-button" onClick={handleLogout} disabled={loggingOut}>{loggingOut ? 'Keluar…' : 'Keluar'}</button></div>
        </header>
        <main className="page-content"><Outlet /></main>
      </div>
    </div>
  )
}
