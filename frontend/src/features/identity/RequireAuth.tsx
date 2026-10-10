import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

// Pembungkus route yang wajib login. `roles` (opsional) membatasi ke role tertentu.
export default function RequireAuth({ roles }: { roles?: string[] }) {
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
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
