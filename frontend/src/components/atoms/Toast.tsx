import { useEffect } from 'react'
import { Icon } from '@/assets/icons'

interface ToastProps {
  message: string
  onDismiss: () => void
  /** Milisegundos antes de desaparecer solo. */
  duration?: number
}

/** Aviso breve en la esquina inferior, al estilo de los snackbars de Classroom. */
export const Toast = ({ message, onDismiss, duration = 3000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm text-white shadow-raised"
    >
      <Icon.success className="size-4 shrink-0" aria-hidden />
      {message}
    </div>
  )
}
