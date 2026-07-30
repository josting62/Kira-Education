import { cn } from '@/lib/cn'
import { Icon } from '@/assets/icons'

export const Spinner = ({ className }: { className?: string }) => (
  <Icon.spinner
    role="status"
    aria-label="Cargando"
    className={cn('size-5 animate-spin text-accent-500', className)}
  />
)

export const PageSpinner = () => (
  <div className="flex min-h-60 items-center justify-center">
    <Spinner className="size-7" />
  </div>
)
