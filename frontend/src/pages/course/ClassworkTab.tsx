import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/atoms/Badge'
import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { Toast } from '@/components/atoms/Toast'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Menu, type MenuItem } from '@/components/molecules/Menu'
import { CreateCourseworkDialog } from '@/components/organisms/CreateCourseworkDialog'
import { EditCourseworkDialog } from '@/components/organisms/EditCourseworkDialog'
import { ReusePostDialog } from '@/components/organisms/ReusePostDialog'
import { TopicsDialog } from '@/components/organisms/TopicsDialog'
import { Icon, type IconName } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { useFetch } from '@/hooks/useFetch'
import { useCourseContext } from '@/hooks/useCourseContext'
import { getCoursework } from '@/services/courseService'
import {
  deleteCoursework,
  publishCoursework,
  unpublishCoursework,
} from '@/services/courseworkService'
import { formatDueDate } from '@/lib/dates'
import type { Coursework, CourseworkType, Topic } from '@/types/models'

const TYPE_ICON: Record<CourseworkType, IconName> = {
  assignment: 'assignment',
  material: 'material',
  question: 'question',
  quiz: 'quiz',
}

/** El color del icono identifica el tipo de trabajo de un vistazo. */
const TYPE_COLOR: Record<CourseworkType, string> = {
  assignment: 'text-icon-indigo',
  material: 'text-icon-teal',
  question: 'text-icon-amber',
  quiz: 'text-icon-violet',
}

const CourseworkRow = ({
  item,
  courseId,
  menuItems,
}: {
  item: Coursework
  courseId: number
  menuItems?: MenuItem[]
}) => {
  const Glyph = Icon[TYPE_ICON[item.type]]
  return (
    <div className="density-row flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-hover">
      <Link
        to={`/courses/${courseId}/work/${item.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hover">
          <Glyph className={cn('size-4', TYPE_COLOR[item.type])} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-ink">{item.title}</span>
          {item.due_at && (
            <span className="text-xs text-ink-muted">{formatDueDate(item.due_at)}</span>
          )}
        </span>
        {item.status === 'draft' && <Badge tone="warning">Borrador</Badge>}
        {item.max_points !== null && (
          <span className="shrink-0 text-xs text-ink-muted">{item.max_points} pts</span>
        )}
      </Link>

      {menuItems ? (
        <Menu label={`Opciones de ${item.title}`} items={menuItems} />
      ) : (
        <Icon.chevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />
      )}
    </div>
  )
}

type Overlay =
  | { kind: 'create'; type: CourseworkType }
  | { kind: 'reuse' }
  | { kind: 'topics' }
  | { kind: 'edit'; coursework: Coursework }
  | null

export const ClassworkTab = () => {
  const { course } = useCourseContext()
  const { data, loading, reload } = useFetch(() => getCoursework(course.id), [course.id])
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [toast, setToast] = useState<string | null>(null)

  const isTeacher = course.course_role === 'teacher'

  if (loading) return <PageSpinner />

  const items = data?.items ?? []
  const topics: Topic[] = data?.topics ?? []
  const withoutTopic = items.filter((item) => item.topic_id === null)

  const act = async (fn: () => Promise<unknown>, message: string) => {
    try {
      await fn()
      setToast(message)
      reload()
    } catch (error) {
      setToast((error as Error).message)
    }
  }

  /** Opciones del menu de cada trabajo. Solo para el docente. */
  const rowMenu = (item: Coursework): MenuItem[] => [
    { label: 'Editar', icon: 'edit', onSelect: () => setOverlay({ kind: 'edit', coursework: item }) },
    item.status === 'draft'
      ? {
          label: 'Publicar',
          icon: 'send',
          onSelect: () => void act(() => publishCoursework(item.id), 'Trabajo publicado'),
        }
      : {
          label: 'Volver a borrador',
          icon: 'restore',
          onSelect: () =>
            void act(() => unpublishCoursework(item.id), 'El trabajo volvio a borrador'),
        },
    {
      label: 'Eliminar',
      icon: 'delete',
      danger: true,
      onSelect: () => {
        const ok = window.confirm(
          `Eliminar "${item.title}"? Se borran tambien las entregas y los comentarios.`,
        )
        if (ok) void act(() => deleteCoursework(item.id), 'Trabajo eliminado')
      },
    },
  ]

  /** Menu "Crear", igual que en Classroom. */
  const createMenu: MenuItem[] = [
    { label: 'Tarea', icon: 'assignment', onSelect: () => setOverlay({ kind: 'create', type: 'assignment' }) },
    { label: 'Tarea de cuestionario', icon: 'quiz', onSelect: () => setOverlay({ kind: 'create', type: 'quiz' }) },
    { label: 'Pregunta', icon: 'question', onSelect: () => setOverlay({ kind: 'create', type: 'question' }) },
    { label: 'Material', icon: 'material', onSelect: () => setOverlay({ kind: 'create', type: 'material' }) },
    { label: 'Reutilizar publicacion', icon: 'copy', onSelect: () => setOverlay({ kind: 'reuse' }) },
    { label: 'Tema', icon: 'topic', onSelect: () => setOverlay({ kind: 'topics' }) },
  ]

  return (
    <div className="mx-auto max-w-3xl">
      {isTeacher && (
        <div className="mb-4">
          <Menu
            label="Crear trabajo en clase"
            icon="add"
            triggerLabel="Crear"
            align="left"
            items={createMenu}
            triggerClassName="h-9 gap-1.5 bg-accent-500 px-4 text-sm text-white hover:bg-accent-600"
          />
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <EmptyState
            illustration="classwork"
            title={isTeacher ? 'Aqui podras asignar trabajos' : 'Aun no hay trabajo en esta clase'}
            description={
              isTeacher
                ? 'Puedes anadir tareas y otros trabajos para la clase y, despues, organizarlos por temas.'
                : 'Tu docente publicara el trabajo aqui.'
            }
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {topics.map((topic) => {
            const topicItems = items.filter((item) => item.topic_id === topic.id)
            if (topicItems.length === 0) return null
            return (
              <section key={topic.id}>
                <h2 className="mb-2 border-b border-line pb-2 text-base font-medium text-accent-700">
                  {topic.title}
                </h2>
                <Card className="overflow-hidden">
                  {topicItems.map((item) => (
                    <CourseworkRow
                      key={item.id}
                      item={item}
                      courseId={course.id}
                      menuItems={isTeacher ? rowMenu(item) : undefined}
                    />
                  ))}
                </Card>
              </section>
            )
          })}

          {withoutTopic.length > 0 && (
            <section>
              {topics.length > 0 && (
                <h2 className="mb-2 border-b border-line pb-2 text-base font-medium text-ink-soft">
                  Sin tema
                </h2>
              )}
              <Card className="overflow-hidden">
                {withoutTopic.map((item) => (
                  <CourseworkRow
                    key={item.id}
                    item={item}
                    courseId={course.id}
                    menuItems={isTeacher ? rowMenu(item) : undefined}
                  />
                ))}
              </Card>
            </section>
          )}
        </div>
      )}

      {overlay?.kind === 'create' && (
        <CreateCourseworkDialog
          courseId={course.id}
          topics={topics}
          initialType={overlay.type}
          onClose={() => setOverlay(null)}
          onCreated={() => {
            setOverlay(null)
            setToast('Trabajo publicado')
            reload()
          }}
        />
      )}

      {overlay?.kind === 'reuse' && (
        <ReusePostDialog
          courseId={course.id}
          topics={topics}
          onClose={() => setOverlay(null)}
          onReused={(message) => {
            setOverlay(null)
            setToast(message)
            reload()
          }}
        />
      )}

      {overlay?.kind === 'topics' && (
        <TopicsDialog
          courseId={course.id}
          topics={topics}
          onClose={() => setOverlay(null)}
          onChanged={reload}
        />
      )}

      {overlay?.kind === 'edit' && (
        <EditCourseworkDialog
          coursework={overlay.coursework}
          topics={topics}
          onClose={() => setOverlay(null)}
          onSaved={(message) => {
            setOverlay(null)
            setToast(message)
            reload()
          }}
        />
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
