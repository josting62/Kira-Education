import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageSpinner } from '@/components/atoms/Spinner'
import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/molecules/EmptyState'
import { joinCourse } from '@/services/courseService'
import { ApiError } from '@/services/http'

/**
 * Destino del "enlace de invitacion": /join/:code
 * Inscribe al usuario y lo lleva a la clase. Si ya estaba inscrito, entra igual.
 */
export const JoinByLinkPage = () => {
  const { code } = useParams()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const attempted = useRef(false)

  useEffect(() => {
    if (!code || attempted.current) return
    attempted.current = true

    joinCourse(code.toLowerCase())
      .then((course) => navigate(`/courses/${course.id}`, { replace: true }))
      .catch((err: ApiError) => {
        // 409 = ya estabas inscrito; no es un fallo desde el punto de vista del usuario.
        setError(err.status === 409 ? 'Ya estabas inscrito en esta clase.' : err.message)
      })
  }, [code, navigate])

  if (!error) return <PageSpinner />

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <EmptyState
        icon="invite"
        title="No se pudo unir a la clase"
        description={error}
        action={
          <Button size="sm" onClick={() => navigate('/', { replace: true })}>
            Ir a mis clases
          </Button>
        }
      />
      <p className="mt-4 text-center text-xs text-ink-muted">
        Codigo usado: <code className="font-mono text-ink-soft">{code}</code> -{' '}
        <Link to="/" className="text-accent-600 hover:underline">
          Volver al inicio
        </Link>
      </p>
    </div>
  )
}
