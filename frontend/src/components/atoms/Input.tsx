import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const BASE =
  'w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-ink placeholder:text-ink-muted ' +
  'transition-colors focus:border-accent-400 focus:outline-none disabled:bg-hover'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = ({ label, error, className, id, ...props }: InputProps) => {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-soft">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(BASE, error && 'border-danger', className)}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = ({ label, error, className, id, ...props }: TextareaProps) => {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-ink-soft">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        className={cn(BASE, 'min-h-20 resize-y', error && 'border-danger', className)}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  )
}
