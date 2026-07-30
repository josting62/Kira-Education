import { Button } from '@/components/atoms/Button'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon } from '@/assets/icons'
import { formatBytes } from '@/lib/files'
import type { Attachment } from '@/types/models'

interface FilePreviewDialogProps {
  attachment: Attachment
  onClose: () => void
}

const isImage = (mime: string | null) => Boolean(mime?.startsWith('image/'))
const isPdf = (mime: string | null) => mime === 'application/pdf'
const isText = (mime: string | null) => mime === 'text/plain' || mime === 'text/csv'

/**
 * Vista previa a pantalla casi completa.
 *
 * No usa <Dialog> porque necesita ser mucho mas ancho y alto que un dialogo
 * de formulario. Las imagenes van en <img> y el resto en <iframe>; el iframe
 * queda aislado por la cabecera CSP con la que se sirven las subidas.
 */
export const FilePreviewDialog = ({ attachment, onClose }: FilePreviewDialogProps) => {
  const mime = attachment.mime_type

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Vista previa de ${attachment.title}`}
      className="fixed inset-0 z-50 flex flex-col bg-backdrop p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-card border border-line bg-surface shadow-raised"
      >
        <header className="flex items-center gap-3 border-b border-line px-4 py-3">
          <Icon.image className="size-4 shrink-0 text-icon-indigo" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{attachment.title}</span>
            <span className="block text-[11px] text-ink-muted">
              {formatBytes(attachment.size_bytes)}
            </span>
          </span>

          <a
            href={attachment.url}
            download={attachment.title}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:bg-hover"
          >
            <Icon.upload className="size-3.5 rotate-180" aria-hidden />
            Descargar
          </a>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar vista previa">
            <Icon.close className="size-4" aria-hidden />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-canvas p-3">
          {isImage(mime) ? (
            <img
              src={attachment.url}
              alt={attachment.title}
              className="mx-auto max-h-full max-w-full object-contain"
            />
          ) : isPdf(mime) || isText(mime) ? (
            <iframe
              src={attachment.url}
              title={attachment.title}
              className="size-full min-h-[60vh] rounded-lg border border-line bg-surface"
            />
          ) : (
            <EmptyState
              icon="material"
              title="Este formato no se puede previsualizar"
              description="Descargalo para abrirlo en tu equipo."
            />
          )}
        </div>
      </div>
    </div>
  )
}
