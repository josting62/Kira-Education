import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Icon } from '@/assets/icons'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent-500 text-white hover:bg-accent-600 disabled:bg-accent-200',
  secondary: 'bg-surface text-ink-soft border border-line hover:bg-hover',
  ghost: 'text-ink-soft hover:bg-hover',
  danger: 'bg-surface text-danger border border-line hover:bg-accent-50',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children?: ReactNode
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) => (
  <button
    className={cn(
      'inline-flex items-center justify-center rounded-full font-medium transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-60',
      VARIANTS[variant],
      SIZES[size],
      className,
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading && <Icon.spinner className="size-4 animate-spin" aria-hidden />}
    {children}
  </button>
)
