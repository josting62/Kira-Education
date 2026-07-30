import { Icon } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { useSettings } from '@/hooks/useSettings'

/**
 * Boton de la barra superior que alterna claro / oscuro.
 *
 * Parte del tema que se ve ahora mismo, asi que si la preferencia era
 * 'system' el primer clic la fija al contrario de lo que muestra el sistema,
 * que es lo que espera cualquiera al pulsar el boton.
 */
export const ThemeToggle = ({ className }: { className?: string }) => {
  const { resolvedTheme, toggleTheme } = useSettings()
  const dark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => void toggleTheme()}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'inline-flex size-9 items-center justify-center rounded-full transition-colors',
        'text-icon-violet hover:bg-hover',
        className,
      )}
    >
      {dark ? (
        <Icon.light className="size-5" aria-hidden />
      ) : (
        <Icon.dark className="size-5" aria-hidden />
      )}
    </button>
  )
}
