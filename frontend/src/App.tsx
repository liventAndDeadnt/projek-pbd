import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './features/dashboard/AppShell'
import DashboardPage from './features/dashboard/DashboardPage'
import { ROLE_HOME, type Role } from './features/dashboard/roles'
import CatalogPage from './features/catalog/CatalogPage'
import VendorPage from './features/catalog/VendorPage'
import UserPage from './features/catalog/UserPage'
import MarginPage from './features/catalog/MarginPage'
import RolePage from './features/identity/RolePage'
import { InventoryPage } from './features/inventory/InventoryPages'
import ReturnPage from './features/returns/ReturnPage'
import { ReceivingDetailPage, ReceivingFormPage, ReceivingPage } from './features/inventory/ReceivingPage'
import PosPage from './features/sales/PosPage'
import SalesDetailPage from './features/sales/SalesDetailPage'
import { ProcurementPage, ProcurementDetailPage, ProcurementFormPage } from './features/procurement/ProcurementPage'
import ReportsPage from './features/reporting/ReportsPage'
import ReturnDetailPage from './features/returns/ReturnDetailPage'
import ResourcePage from './features/mock/ResourcePage'
import LoginPage from './features/identity/LoginPage'
import RequireAuth from './features/identity/RequireAuth'
import { useAuth } from './features/identity/useAuth'

function RoleDashboardRedirect() {
  const { user } = useAuth()
  const path = user && user.role in ROLE_HOME ? ROLE_HOME[user.role as Role] : '/login'
  return <Navigate to={path} replace />
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<RequireAuth />}>
      <Route path="/" element={<RoleDashboardRedirect />} />
      <Route path="/dashboard" element={<RoleDashboardRedirect />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard/admin" element={<RequireAuth roles={['admin']} />}><Route index element={<DashboardPage />} /></Route>
        <Route path="/dashboard/purchasing" element={<RequireAuth roles={['purchasing']} />}><Route index element={<DashboardPage />} /></Route>
        <Route path="/dashboard/gudang" element={<RequireAuth roles={['gudang']} />}><Route index element={<DashboardPage />} /></Route>
        <Route path="/dashboard/kasir" element={<RequireAuth roles={['kasir']} />}><Route index element={<DashboardPage />} /></Route>
        <Route path="/barang" element={<CatalogPage kind="barang" />} />
        <Route path="/satuan" element={<RequireAuth roles={['admin', 'purchasing', 'gudang']} />}><Route index element={<CatalogPage kind="satuan" />} /></Route>
        <Route path="/vendor" element={<RequireAuth roles={['admin', 'purchasing']} />}><Route index element={<VendorPage />} /></Route>
        <Route path="/pengguna" element={<RequireAuth roles={['admin']} />}><Route index element={<UserPage />} /></Route>
        <Route path="/role" element={<RequireAuth roles={['admin']} />}><Route index element={<RolePage />} /></Route>
        <Route path="/margin" element={<RequireAuth roles={['admin']} />}><Route index element={<MarginPage />} /></Route>
        <Route path="/pengadaan" element={<RequireAuth roles={['admin', 'purchasing', 'gudang']} />}><Route index element={<ProcurementPage />} /></Route>
        <Route path="/pengadaan/baru" element={<RequireAuth roles={['admin', 'purchasing']} />}><Route index element={<ProcurementFormPage />} /></Route>
        <Route path="/pengadaan/:id" element={<RequireAuth roles={['admin', 'purchasing', 'gudang']} />}><Route index element={<ProcurementDetailPage />} /></Route>
        <Route path="/penerimaan" element={<RequireAuth roles={['admin', 'purchasing', 'gudang']} />}><Route index element={<ReceivingPage />} /></Route>
        <Route path="/penerimaan/baru" element={<RequireAuth roles={['admin', 'gudang']} />}><Route index element={<ReceivingFormPage />} /></Route>
        <Route path="/penerimaan/:id" element={<RequireAuth roles={['admin', 'purchasing', 'gudang']} />}><Route index element={<ReceivingDetailPage />} /></Route>
        <Route path="/retur" element={<RequireAuth roles={['admin', 'purchasing', 'gudang']} />}><Route index element={<ReturnPage />} /></Route>
        <Route path="/retur/baru" element={<RequireAuth roles={['admin', 'gudang']} />}><Route index element={<ReturnPage startOpen />} /></Route>
        <Route path="/retur/:id" element={<RequireAuth roles={['admin', 'purchasing', 'gudang']} />}><Route index element={<ReturnDetailPage />} /></Route>
        <Route path="/stok" element={<RequireAuth roles={['admin', 'gudang']} />}><Route index element={<InventoryPage />} /></Route>
        <Route path="/kartu-stok" element={<RequireAuth roles={['admin', 'gudang']} />}><Route index element={<InventoryPage initialView="Kartu stok" />} /></Route>
        <Route path="/pos" element={<RequireAuth roles={['kasir']} />}><Route index element={<PosPage />} /></Route>
        <Route path="/penjualan" element={<RequireAuth roles={['admin', 'kasir']} />}><Route index element={<ResourcePage resource="penjualan" />} /></Route>
        <Route path="/penjualan/:id" element={<RequireAuth roles={['admin', 'kasir']} />}><Route index element={<SalesDetailPage />} /></Route>
        <Route path="/laporan/:report" element={<RequireAuth roles={['admin']} />}><Route index element={<ReportsPage />} /></Route>
      </Route>
    </Route>
    <Route path="*" element={<RoleDashboardRedirect />} />
  </Routes>
}
