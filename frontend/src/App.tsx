import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './features/dashboard/AppShell'
import DashboardPage from './features/dashboard/DashboardPage'
import { ROLE_HOME, type Role } from './features/dashboard/roles'
import CatalogPage from './features/catalog/CatalogPage'
import VendorPage from './features/catalog/VendorPage'
import MarginPage from './features/catalog/MarginPage'
import LoginPage from './features/identity/LoginPage'
import RequireAuth from './features/identity/RequireAuth'
import RolePage from './features/identity/RolePage'
import UserPage from './features/identity/UserPage'
import { useAuth } from './features/identity/useAuth'
import { InventoryPage } from './features/inventory/InventoryPages'
import { ReceivingDetailPage, ReceivingFormPage, ReceivingPage } from './features/inventory/ReceivingPage'
import {
  ProcurementDetailPage,
  ProcurementFormPage,
  ProcurementPage,
} from './features/procurement/ProcurementPage'
import ReportsPage from './features/reporting/ReportsPage'
import ReturnDetailPage from './features/returns/ReturnDetailPage'
import ReturnPage from './features/returns/ReturnPage'
import PosPage from './features/sales/PosPage'
import SalesDetailPage from './features/sales/SalesDetailPage'
import SalesHistoryPage from './features/sales/SalesHistoryPage'

function RoleDashboardRedirect() {
  const { user } = useAuth()
  const path = user && user.role in ROLE_HOME ? ROLE_HOME[user.role as Role] : '/login'
  return <Navigate to={path} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<RoleDashboardRedirect />} />
        <Route path="/dashboard" element={<RoleDashboardRedirect />} />
        <Route element={<AppShell />}>
          <Route
            path="/dashboard/admin"
            element={
              <RequireAuth roles={['admin']}>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/purchasing"
            element={
              <RequireAuth roles={['purchasing']}>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/gudang"
            element={
              <RequireAuth roles={['gudang']}>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/kasir"
            element={
              <RequireAuth roles={['kasir']}>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route path="/barang" element={<CatalogPage kind="barang" />} />
          <Route
            path="/satuan"
            element={
              <RequireAuth roles={['admin', 'purchasing', 'gudang']}>
                <CatalogPage kind="satuan" />
              </RequireAuth>
            }
          />
          <Route
            path="/vendor"
            element={
              <RequireAuth roles={['admin', 'purchasing']}>
                <VendorPage />
              </RequireAuth>
            }
          />
          <Route
            path="/pengguna"
            element={
              <RequireAuth roles={['admin']}>
                <UserPage />
              </RequireAuth>
            }
          />
          <Route
            path="/role"
            element={
              <RequireAuth roles={['admin']}>
                <RolePage />
              </RequireAuth>
            }
          />
          <Route
            path="/margin"
            element={
              <RequireAuth roles={['admin']}>
                <MarginPage />
              </RequireAuth>
            }
          />
          <Route
            path="/pengadaan"
            element={
              <RequireAuth roles={['admin', 'purchasing', 'gudang']}>
                <ProcurementPage />
              </RequireAuth>
            }
          />
          <Route
            path="/pengadaan/baru"
            element={
              <RequireAuth roles={['admin', 'purchasing']}>
                <ProcurementFormPage />
              </RequireAuth>
            }
          />
          <Route
            path="/pengadaan/:id"
            element={
              <RequireAuth roles={['admin', 'purchasing', 'gudang']}>
                <ProcurementDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/penerimaan"
            element={
              <RequireAuth roles={['admin', 'purchasing', 'gudang']}>
                <ReceivingPage />
              </RequireAuth>
            }
          />
          <Route
            path="/penerimaan/baru"
            element={
              <RequireAuth roles={['admin', 'gudang']}>
                <ReceivingFormPage />
              </RequireAuth>
            }
          />
          <Route
            path="/penerimaan/:id"
            element={
              <RequireAuth roles={['admin', 'purchasing', 'gudang']}>
                <ReceivingDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/retur"
            element={
              <RequireAuth roles={['admin', 'purchasing', 'gudang']}>
                <ReturnPage />
              </RequireAuth>
            }
          />
          <Route
            path="/retur/baru"
            element={
              <RequireAuth roles={['admin', 'gudang']}>
                <ReturnPage startOpen />
              </RequireAuth>
            }
          />
          <Route
            path="/retur/:id"
            element={
              <RequireAuth roles={['admin', 'purchasing', 'gudang']}>
                <ReturnDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/stok"
            element={
              <RequireAuth roles={['admin', 'gudang']}>
                <InventoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/kartu-stok"
            element={
              <RequireAuth roles={['admin', 'gudang']}>
                <InventoryPage initialView="Kartu stok" />
              </RequireAuth>
            }
          />
          <Route
            path="/pos"
            element={
              <RequireAuth roles={['kasir']}>
                <PosPage />
              </RequireAuth>
            }
          />
          <Route
            path="/penjualan"
            element={
              <RequireAuth roles={['admin', 'kasir']}>
                <SalesHistoryPage />
              </RequireAuth>
            }
          />
          <Route
            path="/penjualan/:id"
            element={
              <RequireAuth roles={['admin', 'kasir']}>
                <SalesDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/laporan/:report"
            element={
              <RequireAuth roles={['admin']}>
                <ReportsPage />
              </RequireAuth>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<RoleDashboardRedirect />} />
    </Routes>
  )
}
