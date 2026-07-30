import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { Input, Textarea } from '@/components/atoms/Input'
import { updateCoursework } from '@/services/courseworkService'
import type { Coursework, Topic } from '@/types/models'

interface EditCourseworkDialogProps {
  coursework: Coursework
  topics: Topic[]
  onClose: () => void
  onSaved: (message: string) => void
}

/** Convierte 'YYYY-MM-DD HH:mm:ss' a lo que espera un input datetime-local. */
const toInputValue = (dueAt: string | null): string =>
  dueAt ? dueAt.replace(' ', 'T').slice(0, 16) : ''

export const EditCourseworkDialog = ({
  coursework,
  topics,
  onClose,
  onSaved,
}: EditCourseworkDialogProps) => {
  const [title, setTitle] = useState(coursework.title)
  const [instructions, setInstructions] = useState(coursework.instructions ?? '')
  const [maxPoints, setMaxPoints] = useState(
    coursework.max_points === null ? '' : String(coursework.max_points),
  )
  const [dueAt, setDueAt] = useState(toInputValue(coursework.due_at))
  const [topicId, setTopicId] = useState(
    coursework.topic_id === null ? '' : String(coursework.topic_id),
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gradable = coursework.type !== 'material'

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await updateCoursework(coursework.id, {
        title,
        instructions: instructions || null,
        maxPoints: gradable && maxPoints ? Number(maxPoints) : null,
        // El input da hora local; el backend espera ISO con offset.
        dueAt: gradable && dueAt ? new Date(dueAt).toISOString() : null,
        topicId: topicId ? Number(topicId) : null,
      })
      onSaved('Trabajo actualizado')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      title="Editar trabajo"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" form="edit-cw-form" type="submit" loading={busy}>
            Guardar
          </Button>
        </>
      }
    >
      <form id="edit-cw-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <Input
          label="Titulo"
          name="title"
          required
          minLength={3}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Instrucciones"
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
              placeholder="Sin calificacion"
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

        {topics.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-topic" className="text-xs font-medium text-ink-soft">
              Tema
            </label>
            <select
              id="edit-topic"
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
