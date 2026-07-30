import { useRef, useState } from 'react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Icon } from '@/assets/icons'
import { DOCUMENT_ACCEPT } from '@/constants/theme'

interface AttachmentPickerProps {
  onPickFile: (file: File) => void
  /** Si no se pasa, solo se ofrece subir archivo. */
  onAddLink?: (data: { kind: 'link' | 'youtube'; title: string; url: string }) => void
  busy?: boolean
  /** Texto de ayuda bajo los botones. */
  hint?: string
}

/**
 * Barra "Adjuntar": subir un archivo del equipo o pegar un enlace
 * (se detecta YouTube por la URL, como hace Classroom).
 */
export const AttachmentPicker = ({
  onPickFile,
  onAddLink,
  busy,
  hint = 'PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP o imagen. Maximo 15 MB.',
}: AttachmentPickerProps) => {
  const fileInput = useRef<HTMLInputElement>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')

  const submitLink = (event: React.FormEvent) => {
    event.preventDefault()
    if (!onAddLink || !url.trim()) return

    const isYoutube = /(?:youtube\.com|youtu\.be)/i.test(url)
    onAddLink({
      kind: isYoutube ? 'youtube' : 'link',
      title: title.trim() || url.trim(),
      url: url.trim(),
    })
    setUrl('')
    setTitle('')
    setLinkOpen(false)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept={DOCUMENT_ACCEPT}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onPickFile(file)
            event.target.value = ''
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          <Icon.upload className="size-4 text-icon-indigo" aria-hidden />
          Subir archivo
        </Button>

        {onAddLink && (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => setLinkOpen((open) => !open)}
          >
            <Icon.link className="size-4 text-icon-teal" aria-hidden />
            Enlace
          </Button>
        )}

        {busy && (
          <span className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Icon.spinner className="size-3.5 animate-spin" aria-hidden />
            Subiendo...
          </span>
        )}
      </div>

      {linkOpen && onAddLink && (
        <form onSubmit={submitLink} className="mt-3 flex flex-col gap-2">
          <Input
            name="attachmentUrl"
            type="url"
            required
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
          />
          <Input
            name="attachmentTitle"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titulo (opcional)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setLinkOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Anadir enlace
            </Button>
          </div>
        </form>
      )}

      <p className="mt-1.5 text-[11px] text-ink-muted">{hint}</p>
    </div>
  )
}
