import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './features/dashboard/DashboardPage'
import LoginPage from './features/identity/LoginPage'
import RequireAuth from './features/identity/RequireAuth'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<DashboardPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
