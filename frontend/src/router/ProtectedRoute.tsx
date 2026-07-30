import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageSpinner } from '@/components/atoms/Spinner'
import { useAuth } from '@/hooks/useAuth'

/** Bloquea las rutas privadas hasta que haya una sesion valida. */
export const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />

  return <Outlet />
}

/** Impide volver al login cuando ya hay sesion. */
export const PublicOnlyRoute = () => {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (user) return <Navigate to="/" replace />

  return <Outlet />
}

/**
 * Modulo de administracion. El backend valida el rol de todas formas
 * (authorize('admin')); esto solo evita mostrar una pantalla que fallaria.
 */
export const AdminRoute = () => {
  const { isAdmin, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (!isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
