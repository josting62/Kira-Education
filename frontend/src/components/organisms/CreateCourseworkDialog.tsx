import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { Input, Textarea } from '@/components/atoms/Input'
import {
  addAttachmentLink,
  createCoursework,
  uploadAttachment,
} from '@/services/courseworkService'
import { AttachmentPicker } from '@/components/molecules/AttachmentPicker'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/files'
import { Icon, type IconName } from '@/assets/icons'
import type { CourseworkType, Topic } from '@/types/models'

const TYPES: { value: CourseworkType; label: string; icon: IconName }[] = [
  { value: 'assignment', label: 'Tarea', icon: 'assignment' },
  { value: 'quiz', label: 'Cuestionario', icon: 'quiz' },
  { value: 'question', label: 'Pregunta', icon: 'question' },
  { value: 'material', label: 'Material', icon: 'material' },
]

interface CreateCourseworkDialogProps {
  courseId: number
  topics: Topic[]
  /** Tipo preseleccionado segun la opcion elegida en el menu Crear. */
  initialType?: CourseworkType
  onClose: () => void
  onCreated: () => void
}

export const CreateCourseworkDialog = ({
  courseId,
  topics,
  initialType = 'assignment',
  onClose,
  onCreated,
}: CreateCourseworkDialogProps) => {
  const [type, setType] = useState<CourseworkType>(initialType)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [maxPoints, setMaxPoints] = useState('100')
  const [dueAt, setDueAt] = useState('')
  const [topicId, setTopicId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Los adjuntos se acumulan aqui y se suben cuando la tarea ya tiene id.
  const [files, setFiles] = useState<File[]>([])
  const [links, setLinks] = useState<{ kind: 'link' | 'youtube'; title: string; url: string }[]>([])

  const gradable = type !== 'material'

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const created = await createCoursework(courseId, {
        type,
        title,
        instructions: instructions || undefined,
        maxPoints: gradable && maxPoints ? Number(maxPoints) : undefined,
        // El input datetime-local da 'YYYY-MM-DDTHH:mm'; el backend espera ISO con offset.
        dueAt: gradable && dueAt ? new Date(dueAt).toISOString() : undefined,
        topicId: topicId ? Number(topicId) : undefined,
      })

      // Los adjuntos necesitan el id de la tarea, asi que van despues.
      for (const file of files) await uploadAttachment(created.id, file)
      for (const link of links) await addAttachmentLink(created.id, link)

      onCreated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      title="Crear trabajo en clase"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" form="create-cw-form" type="submit" loading={loading}>
            Publicar
          </Button>
        </>
      }
    >
      <form id="create-cw-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-ink-soft">Tipo</legend>
          <div className="grid grid-cols-4 gap-1.5">
            {TYPES.map((option) => {
              const Glyph = Icon[option.icon]
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  aria-pressed={type === option.value}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-[11px] transition-colors',
                    type === option.value
                      ? 'border-accent-400 bg-accent-50 text-accent-700'
                      : 'border-line text-ink-soft hover:bg-hover',
                  )}
                >
                  <Glyph className="size-4" aria-hidden />
                  {option.label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <Input
          label="Titulo"
          name="title"
          required
          minLength={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Actividad 3 CRUD"
        />

        <Textarea
          label="Instrucciones (opcional)"
          name="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        {gradable && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Puntos"
              name="maxPoints"
              type="number"
              min={0}
              max={1000}
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
            />
            <Input
              label="Fecha de entrega"
              name="dueAt"
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>
        )}

        {/* Adjuntar documentos y enlaces a la tarea */}
        <fieldset className="rounded-lg border border-line p-3">
          <legend className="px-1 text-xs font-medium text-ink-soft">Adjuntar</legend>

          {(files.length > 0 || links.length > 0) && (
            <ul className="mb-2 divide-y divide-line">
              {files.map((file, index) => (
                <li key={`${file.name}-${index}`} className="flex items-center gap-2 py-2">
                  <Icon.material className="size-4 shrink-0 text-icon-indigo" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{file.name}</span>
                  <span className="text-[11px] text-ink-muted">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    aria-label={`Quitar ${file.name}`}
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    className="text-ink-muted hover:text-danger"
                  >
                    <Icon.close className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
              {links.map((link, index) => (
                <li key={`${link.url}-${index}`} className="flex items-center gap-2 py-2">
                  <Icon.link className="size-4 shrink-0 text-icon-teal" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{link.title}</span>
                  <button
                    type="button"
                    aria-label={`Quitar ${link.title}`}
                    onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
                    className="text-ink-muted hover:text-danger"
                  >
                    <Icon.close className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <AttachmentPicker
            onPickFile={(file) => setFiles((prev) => [...prev, file])}
            onAddLink={(link) => setLinks((prev) => [...prev, link])}
            hint="Se subiran al publicar la tarea. Maximo 15 MB por archivo."
          />
        </fieldset>

        {topics.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="topicId" className="text-xs font-medium text-ink-soft">
              Tema
            </label>
            <select
              id="topicId"
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
      </form>
    </Dialog>
  )
}
