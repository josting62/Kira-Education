import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { Textarea } from '@/components/atoms/Input'
import { Toast } from '@/components/atoms/Toast'
import { EmptyState } from '@/components/molecules/EmptyState'
import { StreamItem } from '@/components/molecules/StreamItem'
import { Menu } from '@/components/molecules/Menu'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { useCourseContext } from '@/hooks/useCourseContext'
import { createAnnouncement, getStream, getCoursework } from '@/services/courseService'
import { formatDueDate, isOverdue } from '@/lib/dates'

export const StreamTab = () => {
  const { course } = useCourseContext()
  const { data, loading, reload } = useFetch(() => getStream(course.id), [course.id])
  const { data: work } = useFetch(() => getCoursework(course.id), [course.id])

  const [body, setBody] = useState('')
  const [composing, setComposing] = useState(false)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const isTeacher = course.course_role === 'teacher'
  const inviteLink = `${window.location.origin}/join/${course.class_code}`

  // Trabajo publicado con fecha futura, ordenado por vencimiento.
  const upcoming = (work?.items ?? [])
    .filter((item) => item.status === 'published' && item.due_at && !isOverdue(item.due_at))
    .sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? ''))

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast(message)
    } catch {
      setToast(text)
    }
  }

  const publish = async () => {
    if (!body.trim()) return
    setSending(true)
    try {
      await createAnnouncement(course.id, body.trim())
      setBody('')
      setComposing(false)
      reload()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Columna lateral */}
      <aside className="flex shrink-0 flex-col gap-3 lg:w-60">
        <Card className="px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-ink-muted">Codigo de clase</p>
            <Menu
              label="Opciones del codigo de clase"
              align="right"
              triggerClassName="size-7 -mr-1 -mt-1"
              items={[
                {
                  label: 'Copiar codigo',
                  icon: 'copy',
                  onSelect: () => void copy(course.class_code, 'Codigo copiado'),
                },
                {
                  label: 'Copiar enlace de invitacion',
                  icon: 'inviteLink',
                  onSelect: () => void copy(inviteLink, 'Enlace de invitacion copiado'),
                },
              ]}
            />
          </div>
          <code className="mt-1 block font-mono text-base text-accent-600">{course.class_code}</code>
        </Card>

        <Card className="px-4 py-3">
          <p className="text-sm font-medium text-ink">Proximas entregas</p>
          {upcoming.length === 0 ? (
            <p className="mt-1 text-xs text-ink-muted">No hay ninguna tarea proxima</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {upcoming.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <Link
                    to={`/courses/${course.id}/work/${item.id}`}
                    className="block text-xs text-ink-soft hover:text-accent-600"
                  >
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="text-ink-muted">{formatDueDate(item.due_at!)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link
            to={`/courses/${course.id}/work`}
            className="mt-3 inline-block text-xs font-medium text-accent-600 hover:underline"
          >
            Ver todo
          </Link>
        </Card>

        {course.room && (
          <Card className="px-4 py-3">
            <p className="text-xs text-ink-muted">Sala</p>
            <p className="mt-0.5 text-sm text-ink">{course.room}</p>
          </Card>
        )}
      </aside>

      {/* Columna principal: tablon */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {isTeacher && (
          <Card className="px-4 py-3">
            {composing ? (
              <div className="flex flex-col gap-3">
                <Textarea
                  autoFocus
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Comparte algo con tu clase"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setComposing(false)}>
                    Cancelar
                  </Button>
                  <Button size="sm" loading={sending} onClick={() => void publish()}>
                    Publicar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="flex w-full items-center gap-2 text-left text-sm text-ink-muted"
              >
                <Icon.edit className="size-4" aria-hidden />
                Anuncia algo a tu clase
              </button>
            )}
          </Card>
        )}

        {loading && <PageSpinner />}

        {!loading && data?.entries.length === 0 && (
          <Card>
            <EmptyState
              illustration="stream"
              title="Aqui puedes comunicarte con tu clase"
              description="Usa el tablon para publicar anuncios o tareas y responder a preguntas de los alumnos."
            />
          </Card>
        )}

        {data?.entries.map((entry) => (
          <StreamItem key={`${entry.kind}-${entry.id}`} entry={entry} courseId={course.id} />
        ))}
      </div>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
