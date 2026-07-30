import type { Attachment, AttachmentKind } from '@/types/models'
import type { IconName } from '@/assets/icons'

/** Tamano legible: 512 B, 24 KB, 1.4 MB. */
export const formatBytes = (bytes: number | null): string => {
  if (bytes === null) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Icono segun el tipo de adjunto y, si es archivo, segun su mime. */
export const iconForAttachment = (attachment: Attachment): IconName => {
  const byKind: Partial<Record<AttachmentKind, IconName>> = {
    youtube: 'video',
    drive: 'topic',
    link: 'link',
  }
  if (attachment.kind !== 'file') return byKind[attachment.kind] ?? 'link'

  const mime = attachment.mime_type ?? ''
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'assignment'
  if (mime.includes('sheet') || mime.includes('excel') || mime === 'text/csv') return 'grades'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'quiz'
  if (mime.includes('zip')) return 'topic'
  return 'material'
}

/** Tipos que el navegador sabe mostrar sin ayuda. */
const PREVIEWABLE_MIMES = ['application/pdf', 'text/plain', 'text/csv']

/** true si el adjunto se puede abrir en la vista previa en vez de descargarlo. */
export const previewable = (attachment: Attachment): boolean => {
  if (attachment.kind !== 'file') return false
  const mime = attachment.mime_type ?? ''
  return mime.startsWith('image/') || PREVIEWABLE_MIMES.includes(mime)
}

/** Etiqueta corta del tipo, para la esquina derecha de la fila. */
export const labelForAttachment = (attachment: Attachment): string => {
  if (attachment.kind === 'youtube') return 'YouTube'
  if (attachment.kind === 'drive') return 'Drive'
  if (attachment.kind === 'link') return 'Enlace'
  return formatBytes(attachment.size_bytes)
}
