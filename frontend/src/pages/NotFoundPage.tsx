import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/molecules/EmptyState'
import { SiteFooter } from '@/components/organisms/SiteFooter'

export const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col bg-canvas">
    <div className="flex flex-1 flex-col items-center justify-center">
      <EmptyState
        illustration="notFound"
        title="Pagina no encontrada"
        description="La ruta que buscas no existe."
      />
      <Link to="/" className="text-xs font-medium text-accent-600 hover:underline">
        Volver al inicio
      </Link>
    </div>

    <SiteFooter />
  </div>
)
