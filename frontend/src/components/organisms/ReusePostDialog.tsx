import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { PageSpinner } from '@/components/atoms/Spinner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon, type IconName } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { useFetch } from '@/hooks/useFetch'
import { listReusable, reuseCoursework } from '@/services/courseworkService'
import type { CourseworkType, Topic } from '@/types/models'

const TYPE_ICON: Record<CourseworkType, IconName> = {
  assignment: 'assignment',
  material: 'material',
  question: 'question',
  quiz: 'quiz',
}

const TYPE_LABEL: Record<CourseworkType, string> = {
  assignment: 'Tarea',
  material: 'Material',
  question: 'Pregunta',
  quiz: 'Cuestionario',
}

interface ReusePostDialogProps {
  courseId: number
  topics: Topic[]
  onClose: () => void
  onReused: (message: string) => void
}

/**
 * "Reutilizar publicacion": copia un trabajo de otra clase del docente.
 * Llega siempre como borrador, para poder ajustar fechas antes de publicar.
 */
export const ReusePostDialog = ({
  courseId,
  topics,
  onClose,
  onReused,
}: ReusePostDialogProps) => {
  const { data, loading } = useFetch(() => listReusable(courseId), [courseId])
  const [selected, setSelected] = useState<number | null>(null)
  const [topicId, setTopicId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = async () => {
    if (selected === null) return
    setError(null)
    setBusy(true)
    try {
      const created = await reuseCoursework(
        courseId,
        selected,
        topicId ? Number(topicId) : null,
      )
      onReused(`"${created.title}" se copio como borrador`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="Reutilizar publicacion"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" loading={busy} disabled={selected === null} onClick={() => void copy()}>
            Copiar aqui
          </Button>
        </>
      }
    >
      {loading ? (
        <PageSpinner />
      ) : data && data.length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-xs text-ink-muted">
            Se copiara como borrador, con sus adjuntos y sin las entregas.
          </p>

          <ul className="max-h-72 divide-y divide-line overflow-y-auto rounded-lg border border-line">
            {data.map((item) => {
              const Glyph = Icon[TYPE_ICON[item.type]]
              const active = selected === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelected(item.id)}
                    className={cn(
                      'density-row flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                      active ? 'bg-accent-50' : 'hover:bg-hover',
                    )}
                  >
                    <Glyph className="size-4 shrink-0 text-icon-indigo" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{item.title}</span>
                      <span className="block truncate text-[11px] text-ink-muted">
                        {item.course_name} - {TYPE_LABEL[item.type]}
                        {item.attachment_count > 0 &&
                          ` - ${item.attachment_count} ${
                            item.attachment_count === 1 ? 'adjunto' : 'adjuntos'
                          }`}
                      </span>
                    </span>
                    {active && <Icon.success className="size-4 shrink-0 text-success" aria-hidden />}
                  </button>
                </li>
              )
            })}
          </ul>

          {topics.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reuse-topic" className="text-xs font-medium text-ink-soft">
                Tema en esta clase
              </label>
              <select
                id="reuse-topic"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                className="w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-ink focus:border-accent-400 focus:outline-none"
              >
                <option value="">Sin tema</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      ) : (
        <EmptyState
          icon="copy"
          title="No hay nada que reutilizar"
          description="Aqui apareceria el trabajo de tus otras clases."
        />
      )}
    </Dialog>
  )
}
