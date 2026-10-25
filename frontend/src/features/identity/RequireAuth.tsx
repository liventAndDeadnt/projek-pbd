import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROLE_HOME, type Role } from '../dashboard/roles'
import { useAuth } from './useAuth'

// Pembungkus route yang wajib login. `roles` (opsional) membatasi ke role tertentu.
// Bisa dipakai sebagai layout route (tanpa children) atau membungkus satu halaman.
export default function RequireAuth({ roles, children }: { roles?: string[]; children?: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="screen-center" role="status">
        Memeriksa sesi…
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!(user.role in ROLE_HOME)) {
    return <Navigate to="/login" replace />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role as Role]} replace />
  }
  return children ? <>{children}</> : <Outlet />
}
