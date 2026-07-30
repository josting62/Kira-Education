import { useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { IconButton } from '@/components/atoms/IconButton'
import { Icon } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { formatRelative } from '@/lib/dates'
import { useAuth } from '@/hooks/useAuth'
import { useFetch } from '@/hooks/useFetch'
import { createComment, deleteComment, listComments } from '@/services/commentService'
import type { CommentTarget } from '@/types/models'

interface CommentThreadProps {
  targetType: CommentTarget
  targetId: number
  /** Texto del campo vacio; cambia entre hilo de clase y privado. */
  placeholder?: string
  /** Arranca plegado y solo muestra el contador (util en el tablon). */
  collapsible?: boolean
  className?: string
}

/**
 * Hilo de comentarios reutilizable.
 *
 * Sirve para los tres tipos de hilo: la visibilidad la decide el backend
 * segun `targetType`, aqui no se envia. Los comentarios de una entrega
 * (`submission`) solo los ven el alumno y su docente.
 */
export const CommentThread = ({
  targetType,
  targetId,
  placeholder = 'Anade un comentario a la clase',
  collapsible = false,
  className,
}: CommentThreadProps) => {
  const { user } = useAuth()
  const [open, setOpen] = useState(!collapsible)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    data: comments,
    error: loadError,
    reload,
  } = useFetch(() => listComments(targetType, targetId), [targetType, targetId])

  const send = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return

    setError(null)
    setBusy(true)
    try {
      await createComment(targetType, targetId, text)
      setBody('')
      reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: number) => {
    setError(null)
    try {
      await deleteComment(id)
      reload()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const count = comments?.length ?? 0
  const problem = error ?? loadError

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {collapsible && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex items-center gap-1.5 self-start text-xs font-medium text-ink-soft hover:text-ink"
        >
          <Icon.comment className="size-3.5 text-icon-teal" aria-hidden />
          {count === 0
            ? 'Comentar'
            : `${count} ${count === 1 ? 'comentario' : 'comentarios'} de la clase`}
        </button>
      )}

      {open && (
        <>
          {count > 0 && (
            <ul className="flex flex-col gap-2.5">
              {comments!.map((comment) => (
                <li key={comment.id} className="flex gap-2.5">
                  <Avatar
                    name={comment.author_name}
                    src={comment.author_avatar ?? null}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-sm font-medium text-ink">{comment.author_name}</span>
                      <span className="text-[11px] text-ink-muted">
                        {formatRelative(comment.created_at)}
                      </span>
                    </p>
                    <p className="whitespace-pre-line text-sm text-ink-soft">{comment.body}</p>
                  </div>
                  {comment.author_id === user?.id && (
                    <IconButton
                      icon="delete"
                      label={`Eliminar mi comentario`}
                      className="size-7 shrink-0"
                      onClick={() => void remove(comment.id)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={send} className="flex items-start gap-2.5">
            <Avatar
              name={user ? `${user.first_name} ${user.last_name}` : ''}
              src={user?.avatar_url ?? null}
              size="sm"
            />
            <input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
              className="min-w-0 flex-1 rounded-full border border-line bg-field px-4 py-1.5 text-sm text-ink placeholder:text-ink-muted focus:border-accent-400 focus:outline-none"
            />
            <IconButton
              icon="send"
              label="Publicar comentario"
              type="submit"
              disabled={busy || body.trim().length === 0}
              className="text-icon-indigo"
            />
          </form>

          {problem && (
            <p role="alert" className="text-xs text-danger">
              {problem}
            </p>
          )}
        </>
      )}
    </div>
  )
}
