import { useState } from 'react'
import { Link } from 'react-router-dom'
import { isToday, isTomorrow, parseISO } from 'date-fns'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { CourseCard } from '@/components/molecules/CourseCard'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Menu } from '@/components/molecules/Menu'
import { CreateCourseDialog } from '@/components/organisms/CreateCourseDialog'
import { JoinCourseDialog } from '@/components/organisms/JoinCourseDialog'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/hooks/useAuth'
import { useCourseActions } from '@/hooks/useCourseActions'
import { getPendingWork, getToReview, listCourses } from '@/services/courseService'
import { formatDueDate, formatRelative } from '@/lib/dates'

/** Contadores del bloque "Pronto se entregara" del inicio. */
const bucketPending = (dates: (string | null)[]) => {
  let today = 0
  let tomorrow = 0
  let later = 0
  for (const value of dates) {
    if (!value) continue
    const date = parseISO(value.replace(' ', 'T'))
    if (isToday(date)) today += 1
    else if (isTomorrow(date)) tomorrow += 1
    else later += 1
  }
  return { today, tomorrow, later }
}

export const HomePage = () => {
  const { isTeacher, isAdmin, isStudent } = useAuth()
  const [dialog, setDialog] = useState<'create' | 'join' | null>(null)

  const { data: courses, loading, reload } = useFetch(() => listCourses('active'))
  const { buildMenu, overlays } = useCourseActions(reload)

  const { data: pending } = useFetch(
    () => (isStudent ? getPendingWork() : Promise.resolve([])),
    [isStudent],
  )
  const { data: toReview } = useFetch(
    () => (isTeacher || isAdmin ? getToReview() : Promise.resolve([])),
    [isTeacher, isAdmin],
  )

  const canManage = isTeacher || isAdmin
  const counts = bucketPending((pending ?? []).map((p) => p.due_at))

  const nextByCourse = new Map<number, string>()
  for (const item of pending ?? []) {
    if (item.due_at && !nextByCourse.has(item.course_id)) {
      nextByCourse.set(item.course_id, `${formatDueDate(item.due_at)} - ${item.coursework_title}`)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* --- Pendientes de revision (docente) --- */}
      {canManage && (
        <section className="mb-6">
          <h2 className="mb-3 text-base font-medium text-ink">Pendientes de revision</h2>
          {toReview?.length ? (
            <Card className="overflow-hidden">
              {toReview.slice(0, 5).map((row) => (
                <Link
                  key={`${row.coursework_id}-${row.student_id}`}
                  to={`/courses/${row.course_id}/work/${row.coursework_id}`}
                  className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-hover"
                >
                  <Icon.grades className="size-4 shrink-0 text-accent-500" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {row.student_name} entrego {row.coursework_title}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">{row.course_name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {formatRelative(row.submitted_at)}
                  </span>
                </Link>
              ))}
              {toReview.length > 5 && (
                <Link
                  to="/to-review"
                  className="block px-4 py-2.5 text-center text-xs font-medium text-accent-600 hover:bg-hover"
                >
                  Ver las {toReview.length} entregas
                </Link>
              )}
            </Card>
          ) : (
            <Card>
              <EmptyState
                illustration="done"
                title="No hay tareas recientes que revisar"
                description="Aqui apareceran las entregas de los ultimos 7 dias que debes revisar."
              />
            </Card>
          )}
        </section>
      )}

      {/* --- Pronto se entregara (estudiante) --- */}
      {isStudent && (pending?.length ?? 0) > 0 && (
        <Card className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
          <div className="min-w-40">
            <p className="text-sm font-medium text-ink">Pronto se entregara</p>
            <Link to="/todo" className="text-xs font-medium text-accent-600 hover:underline">
              Ver lista de tareas pendientes
            </Link>
          </div>
          <dl className="flex items-center divide-x divide-line">
            {[
              ['Hoy', counts.today],
              ['Manana', counts.tomorrow],
              ['Mas tarde', counts.later],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-baseline gap-1.5 px-5 first:pl-0">
                <dd className="text-xl font-medium text-ink">{value}</dd>
                <dt className="text-xs text-ink-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {/* --- Clases --- */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-medium text-ink">Clases</h2>
          {canManage ? (
            <Menu
              label="Anadir clase"
              icon="add"
              triggerLabel="Anadir clase"
              items={[
                { label: 'Crear clase', icon: 'course', onSelect: () => setDialog('create') },
                { label: 'Unirse a una clase', icon: 'invite', onSelect: () => setDialog('join') },
              ]}
              triggerClassName="text-accent-600 hover:bg-accent-50"
            />
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setDialog('join')}>
              <Icon.invite className="size-4" aria-hidden />
              Unirse a una clase
            </Button>
          )}
        </div>

        {courses?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                footnote={nextByCourse.get(course.id) ?? null}
                menuItems={buildMenu(course)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              illustration="classwork"
              title="Todavia no tienes clases"
              description={
                canManage
                  ? 'Crea tu primera clase o unete a una con un codigo.'
                  : 'Pide el codigo de la clase a tu docente para unirte.'
              }
              action={
                <Button size="sm" onClick={() => setDialog(canManage ? 'create' : 'join')}>
                  {canManage ? 'Crear clase' : 'Unirse a una clase'}
                </Button>
              }
            />
          </Card>
        )}
      </section>

      {dialog === 'create' && (
        <CreateCourseDialog
          onClose={() => setDialog(null)}
          onCreated={() => {
            setDialog(null)
            reload()
          }}
        />
      )}
      {dialog === 'join' && (
        <JoinCourseDialog
          onClose={() => setDialog(null)}
          onJoined={() => {
            setDialog(null)
            reload()
          }}
        />
      )}

      {overlays}
    </div>
  )
}
