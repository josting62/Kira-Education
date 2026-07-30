import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { getToReview } from '@/services/courseService'
import { formatRelative } from '@/lib/dates'

/** Entregas de los ultimos 7 dias que el docente aun no ha calificado. */
export const ToReviewPage = () => {
  const { data, loading } = useFetch(() => getToReview())

  if (loading) return <PageSpinner />

  const rows = data ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-xl font-medium text-ink">Pendientes de revision</h1>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            illustration="done"
            title="No hay tareas recientes que revisar"
            description="Consulta las tareas de los ultimos 7 dias que debes revisar."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {rows.map((row) => (
            <Link
              key={`${row.coursework_id}-${row.student_id}`}
              to={`/courses/${row.course_id}/work/${row.coursework_id}`}
              className="density-row flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-hover"
            >
              <Icon.grades className="size-4 shrink-0 text-accent-500" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{row.coursework_title}</span>
                <span className="block truncate text-xs text-ink-muted">
                  {row.student_name} - {row.course_name}
                </span>
              </span>
              {row.is_late === 1 && <Badge tone="danger">Con retraso</Badge>}
              <span className="shrink-0 text-xs text-ink-muted">
                {formatRelative(row.submitted_at)}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}
