import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from '@/assets/icons'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName
  /** Obligatorio: el boton no tiene texto visible. */
  label: string
}

export const IconButton = ({ icon, label, className, ...props }: IconButtonProps) => {
  const Glyph = Icon[icon]
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full text-ink-soft',
        'transition-colors hover:bg-hover disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <Glyph className="size-5" aria-hidden />
    </button>
  )
}
