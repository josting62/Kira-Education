import { Link } from 'react-router-dom'
import { Card } from '@/components/atoms/Card'
import { Badge } from '@/components/atoms/Badge'
import { PageSpinner } from '@/components/atoms/Spinner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { getPendingWork } from '@/services/courseService'
import { formatDueDate, isOverdue } from '@/lib/dates'

/** Lista de trabajo pendiente del estudiante, ordenada por fecha de entrega. */
export const TodoPage = () => {
  const { data, loading } = useFetch(() => getPendingWork())

  if (loading) return <PageSpinner />

  const items = data ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-xl font-medium text-ink">Pendientes</h1>

      {items.length === 0 ? (
        <Card>
          <EmptyState
            illustration="done"
            title="Estas al dia"
            description="No tienes trabajo pendiente por entregar."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {items.map((item) => (
            <Link
              key={item.coursework_id}
              to={`/courses/${item.course_id}/work/${item.coursework_id}`}
              className="density-row flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-hover"
            >
              <Icon.assignment className="size-4 shrink-0 text-accent-500" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{item.coursework_title}</span>
                <span className="block truncate text-xs text-ink-muted">{item.course_name}</span>
              </span>
              {item.due_at && (
                <Badge tone={isOverdue(item.due_at) ? 'danger' : 'accent'}>
                  {formatDueDate(item.due_at)}
                </Badge>
              )}
            </Link>
          ))}
        </Card>
      )}
    </div>
  )
}
