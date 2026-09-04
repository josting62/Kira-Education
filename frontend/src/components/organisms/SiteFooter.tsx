import { Icon } from '@/assets/icons'
import escudo from '@/assets/logos/escudo.png'
import { cn } from '@/lib/cn'

/** Autoras del proyecto. Se listan en el pie de todas las pantallas. */
const AUTHORS = ['Jesica Alexandra Carrillo Bonilla', 'Maria Valentina Elizalde Galvis']

interface SiteFooterProps {
  className?: string
}

/**
 * Pie de pagina con la autoria del proyecto. Vive en las dos plantillas
 * (AppShell y AuthLayout), asi que aparece en todos los modulos.
 */
export const SiteFooter = ({ className }: SiteFooterProps) => (
  <footer className={cn('mt-auto border-t border-line bg-surface px-4 py-6', className)}>
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 text-center">
      <img src={escudo} alt="" aria-hidden className="h-12 w-auto select-none" />

      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
        Realizado por
      </p>

      <ul className="flex flex-col items-center gap-x-4 gap-y-1 sm:flex-row">
        {AUTHORS.map((author) => (
          <li key={author} className="flex items-center gap-1.5 text-sm text-ink-soft">
            <Icon.user className="size-3.5 shrink-0 text-icon-rose" aria-hidden />
            {author}
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-ink-muted">
        2026 Kiro Education &middot; Proyecto Expotecnica 2026
      </p>
    </div>
  </footer>
)
