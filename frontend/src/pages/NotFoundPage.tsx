import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/molecules/EmptyState'

export const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-canvas">
    <EmptyState
      illustration="notFound"
      title="Pagina no encontrada"
      description="La ruta que buscas no existe."
    />
    <Link to="/" className="text-xs font-medium text-accent-600 hover:underline">
      Volver al inicio
    </Link>
  </div>
)
