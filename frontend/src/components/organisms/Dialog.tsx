import { useEffect, type ReactNode } from 'react'
import { IconButton } from '@/components/atoms/IconButton'

interface DialogProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Modal minimalista. Cierra con Escape o clic en el fondo. */
export const Dialog = ({ title, onClose, children, footer }: DialogProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-backdrop px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-card border border-line bg-surface shadow-raised"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-base font-medium text-ink">{title}</h2>
          <IconButton icon="close" label="Cerrar" onClick={onClose} />
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  )
}
