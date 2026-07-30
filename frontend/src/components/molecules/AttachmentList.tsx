import { useState } from 'react'
import { Icon } from '@/assets/icons'
import { IconButton } from '@/components/atoms/IconButton'
import { FilePreviewDialog } from '@/components/organisms/FilePreviewDialog'
import { iconForAttachment, labelForAttachment, previewable } from '@/lib/files'
import type { Attachment } from '@/types/models'

interface AttachmentListProps {
  attachments: Attachment[]
  /** Si se pasa, cada fila muestra el boton de quitar. */
  onRemove?: (attachment: Attachment) => void
  /** Deshabilita el boton de quitar mientras hay una operacion en curso. */
  busy?: boolean
}

/**
 * Lista de adjuntos.
 *
 * Los que el navegador sabe mostrar (imagen, PDF, texto) abren la vista previa;
 * el resto se descarga con su nombre original. Los enlaces van a otra pestana.
 */
export const AttachmentList = ({ attachments, onRemove, busy }: AttachmentListProps) => {
  const [preview, setPreview] = useState<Attachment | null>(null)

  if (attachments.length === 0) return null

  return (
    <>
      <ul className="divide-y divide-line">
        {attachments.map((attachment) => {
          const Glyph = Icon[iconForAttachment(attachment)]
          const isFile = attachment.kind === 'file'
          const canPreview = previewable(attachment)

          const inner = (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-hover">
                <Glyph className="size-4 text-icon-indigo" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{attachment.title}</span>
                <span className="block text-[11px] text-ink-muted">
                  {labelForAttachment(attachment)}
                  {canPreview && ' - toca para ver'}
                </span>
              </span>
            </>
          )

          return (
            <li key={attachment.id} className="density-row flex items-center gap-3 py-2.5">
              {canPreview ? (
                <button
                  type="button"
                  onClick={() => setPreview(attachment)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left hover:underline"
                >
                  {inner}
                </button>
              ) : (
                <a
                  href={attachment.url}
                  target={isFile ? undefined : '_blank'}
                  rel={isFile ? undefined : 'noreferrer'}
                  // Los archivos se descargan con el nombre que subio el usuario.
                  download={isFile ? attachment.title : undefined}
                  className="flex min-w-0 flex-1 items-center gap-3 hover:underline"
                >
                  {inner}
                </a>
              )}

              {onRemove && (
                <IconButton
                  icon="close"
                  label={`Quitar ${attachment.title}`}
                  className="size-8"
                  disabled={busy}
                  onClick={() => onRemove(attachment)}
                />
              )}
            </li>
          )
        })}
      </ul>

      {preview && <FilePreviewDialog attachment={preview} onClose={() => setPreview(null)} />}
    </>
  )
}
