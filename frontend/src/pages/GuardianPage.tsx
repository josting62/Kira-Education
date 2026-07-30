import { useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon, type IconName } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { useFetch } from '@/hooks/useFetch'
import { getStudentSummary, myStudents } from '@/services/guardianService'
import { formatDueDate, isOverdue } from '@/lib/dates'

const STAT_CARDS: {
  key: 'courses' | 'graded' | 'pending' | 'late'
  label: string
  icon: IconName
  color: string
}[] = [
  { key: 'courses', label: 'Clases', icon: 'course', color: 'text-icon-indigo' },
  { key: 'graded', label: 'Calificadas', icon: 'grades', color: 'text-icon-teal' },
  { key: 'pending', label: 'Pendientes', icon: 'classwork', color: 'text-icon-amber' },
  { key: 'late', label: 'Con retraso', icon: 'clock', color: 'text-danger' },
]

/**
 * Panel del acudiente: solo lectura.
 *
 * Muestra las clases, el promedio, lo pendiente y las notas ya devueltas del
 * estudiante a su cargo. No puede entrar a las clases ni comentar; el backend
 * valida el vinculo en cada peticion.
 */
export const GuardianPage = () => {
  const { data: students, loading } = useFetch(() => myStudents())
  const [selected, setSelected] = useState<number | null>(null)

  // Por defecto, el primer acudido.
  const studentId = selected ?? students?.[0]?.student_id ?? null

  const { data: summary, loading: loadingSummary } = useFetch(
    () => (studentId === null ? Promise.resolve(null) : getStudentSummary(studentId)),
    [studentId],
  )

  if (loading) return <PageSpinner />

  if (!students || students.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h1 className="font-display mb-5 text-xl font-medium text-ink">Seguimiento</h1>
        <Card>
          <EmptyState
            illustration="done"
            title="Todavia no tienes estudiantes asociados"
            description="Un administrador debe vincular tu cuenta con la de tu acudido."
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <h1 className="font-display mb-5 flex items-center gap-2 text-xl font-medium text-ink">
        <Icon.invite className="size-5 text-icon-indigo" aria-hidden />
        Seguimiento
      </h1>

      {/* Selector cuando hay mas de un acudido */}
      {students.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {students.map((link) => (
            <button
              key={link.student_id}
              type="button"
              aria-pressed={studentId === link.student_id}
              onClick={() => setSelected(link.student_id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors',
                studentId === link.student_id
                  ? 'border-accent-400 bg-accent-50 font-medium text-accent-700'
                  : 'border-line text-ink-soft hover:bg-hover',
              )}
            >
              <Avatar name={link.student_name} src={link.student_avatar} className="size-5 text-[9px]" />
              {link.student_name}
            </button>
          ))}
        </div>
      )}

      {loadingSummary || !summary ? (
        <PageSpinner />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Identidad y promedio */}
          <Card className="flex flex-wrap items-center gap-4 p-5">
            <Avatar
              name={summary.student.name}
              src={summary.student.avatar_url}
              className="size-14 text-base"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-medium text-ink">{summary.student.name}</p>
              <p className="text-xs text-ink-muted">{summary.student.email}</p>
              {students.find((l) => l.student_id === summary.student.id)?.relation && (
                <Badge tone="neutral" className="mt-1">
                  {students.find((l) => l.student_id === summary.student.id)!.relation}
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="font-display text-3xl font-medium text-ink">
                {summary.stats.average === null ? '--' : `${summary.stats.average}%`}
              </p>
              <p className="text-xs text-ink-muted">Promedio</p>
            </div>
          </Card>

          {/* Metricas */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STAT_CARDS.map((card) => {
              const Glyph = Icon[card.icon]
              return (
                <Card key={card.key} className="px-4 py-3">
                  <Glyph className={cn('size-4', card.color)} aria-hidden />
                  <p className="font-display mt-1.5 text-2xl font-medium text-ink">
                    {summary.stats[card.key]}
                  </p>
                  <p className="text-xs text-ink-muted">{card.label}</p>
                </Card>
              )
            })}
          </div>

          {/* Clases */}
          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 text-sm font-medium text-ink">Clases</h2>
            {summary.courses.length === 0 ? (
              <p className="px-4 py-3 text-xs text-ink-muted">No esta inscrito en ninguna clase.</p>
            ) : (
              summary.courses.map((course) => (
                <div
                  key={course.id}
                  className="density-row flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                >
                  <span
                    aria-hidden
                    className="size-7 shrink-0 rounded-full"
                    style={{ backgroundColor: course.theme_color }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{course.name}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {course.owner_name}
                      {course.section && ` - ${course.section}`}
                    </span>
                  </span>
                </div>
              ))
            )}
          </Card>

          {/* Pendientes */}
          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 text-sm font-medium text-ink">
              Trabajo pendiente
            </h2>
            {summary.pending.length === 0 ? (
              <p className="px-4 py-3 text-xs text-ink-muted">Esta al dia.</p>
            ) : (
              summary.pending.map((item) => (
                <div
                  key={item.coursework_id}
                  className="density-row flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                >
                  <Icon.assignment className="size-4 shrink-0 text-icon-amber" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {item.coursework_title}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {item.course_name}
                    </span>
                  </span>
                  {item.due_at && (
                    <Badge tone={isOverdue(item.due_at) ? 'danger' : 'accent'}>
                      {formatDueDate(item.due_at)}
                    </Badge>
                  )}
                </div>
              ))
            )}
          </Card>

          {/* Notas devueltas */}
          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-4 py-3 text-sm font-medium text-ink">
              Calificaciones
            </h2>
            {summary.grades.filter((row) => row.grade !== null).length === 0 ? (
              <p className="px-4 py-3 text-xs text-ink-muted">
                Todavia no hay calificaciones devueltas.
              </p>
            ) : (
              summary.grades
                .filter((row) => row.grade !== null)
                .map((row) => (
                  <div
                    key={row.coursework_id}
                    className="density-row flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {row.coursework_title}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">
                        {row.course_name}
                      </span>
                    </span>
                    {row.is_late === 1 && <Badge tone="danger">Con retraso</Badge>}
                    <span className="shrink-0 font-medium text-ink">
                      {row.grade}
                      <span className="text-xs text-ink-muted">/{row.max_points}</span>
                    </span>
                  </div>
                ))
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
