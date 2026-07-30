import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Eleva la sombra al pasar el mouse (para cards clicables). */
  interactive?: boolean
}

export const Card = ({ children, interactive, className, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-card border border-line bg-surface shadow-card',
      interactive && 'transition-shadow hover:shadow-raised',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)
