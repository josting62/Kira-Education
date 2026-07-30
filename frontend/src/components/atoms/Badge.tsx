import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const TONES: Record<Tone, string> = {
  neutral: 'bg-hover text-ink-soft',
  accent: 'bg-accent-100 text-accent-700',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
}

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
}

export const Badge = ({ tone = 'neutral', children, className }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
      TONES[tone],
      className,
    )}
  >
    {children}
  </span>
)
