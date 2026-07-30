import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/assets/icons'
import { Illustration, type IllustrationName } from '@/components/atoms/Illustration'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  /** Ilustracion grande. Tiene prioridad sobre `icon`. */
  illustration?: IllustrationName
  /** Alternativa compacta cuando no hace falta ilustracion. */
  icon?: IconName
}

export const EmptyState = ({
  title,
  description,
  action,
  illustration,
  icon = 'course',
}: EmptyStateProps) => {
  const Glyph = Icon[icon]

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      {illustration ? (
        <Illustration name={illustration} />
      ) : (
        <span className="flex size-12 items-center justify-center rounded-full bg-hover">
          <Glyph className="size-6 text-ink-muted" aria-hidden />
        </span>
      )}

      <div>
        <p className="text-base font-medium text-ink">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{description}</p>
        )}
      </div>

      {action}
    </div>
  )
}
