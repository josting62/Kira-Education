import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { IconButton } from '@/components/atoms/IconButton'
import { Icon } from '@/assets/icons'
import {
  createTopic,
  deleteTopic,
  renameTopic,
  reorderTopics,
} from '@/services/courseworkService'
import type { Topic } from '@/types/models'

interface TopicsDialogProps {
  courseId: number
  topics: Topic[]
  onClose: () => void
  onChanged: () => void
}

/**
 * Gestion de temas: crear, renombrar, reordenar y borrar.
 *
 * El reordenado usa botones de subir/bajar en vez de arrastrar: funciona con
 * teclado y en movil, y no necesita ninguna dependencia extra.
 */
export const TopicsDialog = ({ courseId, topics, onClose, onChanged }: TopicsDialogProps) => {
  // Copia local para poder reordenar sin esperar al servidor en cada clic.
  const [order, setOrder] = useState<Topic[]>(topics)
  const [nuevo, setNuevo] = useState('')
  const [editing, setEditing] = useState<{ id: number; title: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
      onChanged()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = nuevo.trim()
    if (title.length < 2) return

    await run(async () => {
      const created = await createTopic(courseId, title)
      setOrder((prev) => [...prev, created])
      setNuevo('')
    })
  }

  const rename = async () => {
    if (!editing || editing.title.trim().length < 2) return
    const { id, title } = editing
    await run(async () => {
      await renameTopic(courseId, id, title.trim())
      setOrder((prev) => prev.map((t) => (t.id === id ? { ...t, title: title.trim() } : t)))
      setEditing(null)
    })
  }

  const remove = async (topic: Topic) => {
    const ok = window.confirm(
      `Borrar el tema "${topic.title}"? El trabajo que lo usaba pasara a "Sin tema".`,
    )
    if (!ok) return

    await run(async () => {
      await deleteTopic(courseId, topic.id)
      setOrder((prev) => prev.filter((t) => t.id !== topic.id))
    })
  }

  const move = async (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= order.length) return

    const next = [...order]
    ;[next[index], next[target]] = [next[target], next[index]]
    setOrder(next)

    await run(() => reorderTopics(courseId, next.map((t) => t.id)))
  }

  return (
    <Dialog
      title="Temas de la clase"
      onClose={onClose}
      footer={
        <Button size="sm" onClick={onClose}>
          Listo
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {order.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Todavia no hay temas. Los temas agrupan el trabajo en clase.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {order.map((topic, index) => (
              <li key={topic.id} className="density-row flex items-center gap-2 py-2">
                {editing?.id === topic.id ? (
                  <>
                    <Input
                      aria-label={`Nuevo nombre de ${topic.title}`}
                      autoFocus
                      value={editing.title}
                      onChange={(e) => setEditing({ id: topic.id, title: e.target.value })}
                      className="flex-1"
                    />
                    <Button size="sm" loading={busy} onClick={() => void rename()}>
                      Guardar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Icon.topic className="size-4 shrink-0 text-icon-teal" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{topic.title}</span>

                    <IconButton
                      icon="chevronUp"
                      label={`Subir ${topic.title}`}
                      className="size-8"
                      disabled={busy || index === 0}
                      onClick={() => void move(index, -1)}
                    />
                    <IconButton
                      icon="chevronDown"
                      label={`Bajar ${topic.title}`}
                      className="size-8"
                      disabled={busy || index === order.length - 1}
                      onClick={() => void move(index, 1)}
                    />
                    <IconButton
                      icon="edit"
                      label={`Renombrar ${topic.title}`}
                      className="size-8"
                      disabled={busy}
                      onClick={() => setEditing({ id: topic.id, title: topic.title })}
                    />
                    <IconButton
                      icon="delete"
                      label={`Borrar ${topic.title}`}
                      className="size-8 text-danger"
                      disabled={busy}
                      onClick={() => void remove(topic)}
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={add} className="flex items-end gap-2 border-t border-line pt-3">
          <Input
            label="Nuevo tema"
            name="topic"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Ej: Bases de datos"
            className="flex-1"
          />
          <Button type="submit" size="sm" loading={busy} disabled={nuevo.trim().length < 2}>
            <Icon.add className="size-4" aria-hidden />
            Anadir
          </Button>
        </form>

        {error && (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
