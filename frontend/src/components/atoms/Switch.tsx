import { cn } from '@/lib/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

/** Interruptor accesible (role=switch) para los ajustes. */
export const Switch = ({ checked, onChange, label, description, disabled }: SwitchProps) => (
  <label className="density-row flex cursor-pointer items-start justify-between gap-4 py-2.5">
    <span className="min-w-0">
      <span className="block text-sm text-ink">{label}</span>
      {description && <span className="block text-xs text-ink-muted">{description}</span>}
    </span>

    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50',
        checked ? 'bg-accent-500' : 'bg-line-strong',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-knob transition-transform',
          checked ? 'translate-x-4.5' : 'translate-x-0.5',
        )}
      />
    </button>
  </label>
)
