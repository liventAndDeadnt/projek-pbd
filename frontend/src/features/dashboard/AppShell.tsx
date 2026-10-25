import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../shared/icons'
import { initials } from '../../shared/format'
import { useMediaQuery } from '../../shared/useMediaQuery'
import { useAuth } from '../identity/useAuth'
import {
  isRole,
  ROLE_HOME,
  ROLE_LABEL,
  ROLE_NAVIGATION,
  type NavigationItem,
} from './roles'

const PAGE_TITLES: Record<string, string> = {
  admin: 'Dashboard',
  purchasing: 'Dashboard',
  gudang: 'Dashboard',
  kasir: 'Dashboard',
  barang: 'Barang',
  satuan: 'Satuan',
  vendor: 'Vendor',
  pengguna: 'Pengguna',
  role: 'Role',
  margin: 'Margin penjualan',
  pengadaan: 'Pengadaan',
  penerimaan: 'Penerimaan',
  retur: 'Retur',
  penjualan: 'Riwayat penjualan',
  stok: 'Stok',
  'kartu-stok': 'Kartu stok',
  pos: 'POS',
}

const REPORT_TITLES: Record<string, string> = {
  penjualan: 'Penjualan',
  pengadaan: 'Pengadaan',
  stok: 'Stok',
  retur: 'Retur',
  margin: 'Margin / profit',
}

function getPageTitle(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  const last = segments.at(-1) ?? ''
  const parent = segments.at(-2) ?? ''

  if (last === 'baru') {
    if (segments[0] === 'pengadaan') return 'Pengadaan baru'
    if (segments[0] === 'penerimaan') return 'Penerimaan baru'
    if (segments[0] === 'retur') return 'Retur baru'
  }

  if (segments[0] === 'laporan') {
    const report = REPORT_TITLES[segments[1] ?? '']
    return report ? `Laporan ${report}` : 'Laporan'
  }

  if (/^\d+$/.test(last)) {
    return `${PAGE_TITLES[parent] ?? 'Detail'} #${last}`
  }

  return PAGE_TITLES[last] ?? 'Dashboard'
}

function isItemActive(item: NavigationItem, pathname: string, search: string): boolean {
  if (item.to.includes('?')) {
    const [path, query] = item.to.split('?')
    return pathname === path && search === `?${query}`
  }
  if (item.to === '/laporan/penjualan') {
    return pathname.startsWith('/laporan/')
  }
  if (item.to.startsWith('/dashboard/')) {
    return pathname === item.to
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const role = user && isRole(user.role) ? user.role : null
  const title = getPageTitle(location.pathname)
  const home = role ? ROLE_HOME[role] : '/login'
  const menuVisible = menuOpen && isMobile

  useEffect(() => {
    if (!menuVisible) return
    document.body.classList.add('no-scroll')
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('no-scroll')
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuVisible])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
    } catch {
      // AuthProvider tetap membersihkan sesi lokal meskipun request logout gagal.
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Lewati ke konten utama
      </a>
      <aside
        id="app-sidebar"
        className={`sidebar${menuVisible ? ' is-open' : ''}`}
        aria-label="Navigasi utama"
        aria-hidden={isMobile && !menuVisible ? true : undefined}
        inert={isMobile && !menuVisible ? true : undefined}
      >
        <div className="sidebar-head">
          <NavLink to={home} className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              G
            </span>
            <span className="brand-copy">
              <strong>GOstore</strong>
              <small>Inventori</small>
            </span>
          </NavLink>
          <button
            className="icon-btn icon-btn--sm sidebar-close"
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="workspace-card">
          <span className="workspace-dot" aria-hidden="true" />
          <span className="workspace-copy">
            <span>Ruang kerja</span>
            <strong>{role ? ROLE_LABEL[role] : 'Pengguna'}</strong>
          </span>
        </div>

        <nav className="sidebar-nav">
          {(role ? ROLE_NAVIGATION[role] : []).map((group, index) => (
            <div className="nav-group" key={group.label ?? `main-${index}`}>
              {group.label && <span className="nav-group-label">{group.label}</span>}
              {group.items.map((item) => (
                <NavLink
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  aria-current={
                    isItemActive(item, location.pathname, location.search) ? 'page' : undefined
                  }
                  className={`nav-link${isItemActive(item, location.pathname, location.search) ? ' is-active' : ''}`}
                >
                  <span className="nav-icon">
                    <Icon name={item.icon} size={16} />
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-user">
            <span className="avatar" aria-hidden="true">
              {initials(user?.username ?? 'U')}
            </span>
            <span className="sidebar-user-copy">
              <strong>{user?.username ?? 'Pengguna'}</strong>
              <span>{role ? ROLE_LABEL[role] : user?.role}</span>
            </span>
          </div>
          <button
            className="btn btn--ghost btn--sm sidebar-logout"
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            <Icon name="logout" size={15} />
            {loggingOut ? 'Keluar…' : 'Keluar'}
          </button>
          <p className="sidebar-meta">Inventori GOstore · v1</p>
        </div>
      </aside>

      {menuVisible && (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Tutup menu navigasi"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            type="button"
            aria-label="Buka menu"
            aria-expanded={menuVisible}
            aria-controls="app-sidebar"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={18} />
          </button>

          <div className="breadcrumb">
            <span>GOstore</span>
            <Icon name="chevronRight" size={12} />
            <strong>{title}</strong>
          </div>

          <div className="topbar-actions">
            <span className="role-chip">{role ? ROLE_LABEL[role] : 'Pengguna'}</span>
            <span className="topbar-divider" aria-hidden="true" />
            <div className="topbar-user">
              <span className="avatar" aria-hidden="true">
                {initials(user?.username ?? 'U')}
              </span>
              <div className="user-meta">
                <strong>{user?.username}</strong>
                <span>{role ? ROLE_LABEL[role] : user?.role}</span>
              </div>
            </div>
            <button
              className="icon-btn"
              type="button"
              aria-label="Keluar dari akun"
              title="Keluar"
              onClick={() => void handleLogout()}
              disabled={loggingOut}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </header>

        <main id="main-content" className="page-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
