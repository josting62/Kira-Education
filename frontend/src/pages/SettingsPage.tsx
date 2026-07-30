import { Link } from 'react-router-dom'
import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { Switch } from '@/components/atoms/Switch'
import { Icon } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { useAuth } from '@/hooks/useAuth'
import { useSettings } from '@/hooks/useSettings'

export const SettingsPage = () => {
  const { user } = useAuth()
  const { settings, save, theme, resolvedTheme, setTheme } = useSettings()

  if (!settings) return <PageSpinner />

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="font-display mb-5 flex items-center gap-2 text-xl font-medium text-ink">
        <Icon.settings className="size-5 text-icon-indigo" aria-hidden />
        Ajustes
      </h1>

      {/* Cuenta */}
      <Card className="mb-4 p-5">
        <h2 className="mb-2 text-sm font-medium text-ink">Cuenta</h2>
        <p className="text-xs text-ink-muted">
          Sesion iniciada como <span className="text-ink-soft">{user?.email}</span>
        </p>
        <Link
          to="/profile"
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:underline"
        >
          <Icon.user className="size-3.5" aria-hidden />
          Editar mi perfil
        </Link>
      </Card>

      {/* Apariencia */}
      <Card className="mb-4 p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          <Icon.palette className="size-4 text-icon-violet" aria-hidden />
          Apariencia
        </h2>

        <p className="mb-2 text-xs font-medium text-ink-soft">Tema</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['light', 'Claro', 'light'],
              ['dark', 'Oscuro', 'dark'],
              ['system', 'Del sistema', 'system'],
            ] as const
          ).map(([value, label, icon]) => {
            const Glyph = Icon[icon]
            return (
              <button
                key={value}
                type="button"
                aria-pressed={theme === value}
                onClick={() => void setTheme(value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs transition-colors',
                  theme === value
                    ? 'border-accent-400 bg-accent-50 font-medium text-accent-700'
                    : 'border-line text-ink-soft hover:bg-hover',
                )}
              >
                <Glyph className="size-3.5" aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">
          {theme === 'system'
            ? `Sigue tu sistema operativo; ahora mismo se ve en ${
                resolvedTheme === 'dark' ? 'oscuro' : 'claro'
              }.`
            : 'Se guarda en tu cuenta: al volver a entrar seguira igual.'}
        </p>

        <p className="mb-2 mt-4 text-xs font-medium text-ink-soft">Densidad de las listas</p>
        <div className="flex gap-2">
          {(
            [
              ['comfortable', 'Comoda'],
              ['compact', 'Compacta'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={settings.density === value}
              onClick={() => void save({ density: value })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs transition-colors',
                settings.density === value
                  ? 'border-accent-400 bg-accent-50 font-medium text-accent-700'
                  : 'border-line text-ink-soft hover:bg-hover',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">
          El cambio se aplica al instante en toda la aplicacion.
        </p>

        <p className="mb-2 mt-4 text-xs font-medium text-ink-soft">Idioma</p>
        <div className="flex gap-2">
          {(
            [
              ['es', 'Espanol'],
              ['en', 'English'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={settings.language === value}
              onClick={() => void save({ language: value })}
              className={cn(
                'rounded-full border px-4 py-1.5 text-xs transition-colors',
                settings.language === value
                  ? 'border-accent-400 bg-accent-50 font-medium text-accent-700'
                  : 'border-line text-ink-soft hover:bg-hover',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">
          La preferencia queda guardada; la traduccion de la interfaz aun no esta implementada.
        </p>
      </Card>

      {/* Notificaciones */}
      <Card className="mb-4 p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-ink">
          <Icon.bell className="size-4 text-icon-amber" aria-hidden />
          Notificaciones
        </h2>
        <div className="divide-y divide-line">
          <Switch
            label="Trabajo nuevo"
            description="Cuando se publica una tarea, material o cuestionario"
            checked={settings.notify_coursework === 1}
            onChange={(value) => void save({ notifyCoursework: value })}
          />
          <Switch
            label="Anuncios"
            description="Publicaciones del docente en el tablon"
            checked={settings.notify_announcements === 1}
            onChange={(value) => void save({ notifyAnnouncements: value })}
          />
          <Switch
            label="Calificaciones"
            description="Cuando se devuelve una entrega calificada"
            checked={settings.notify_grades === 1}
            onChange={(value) => void save({ notifyGrades: value })}
          />
        </div>
      </Card>

      {/* Clases */}
      <Card className="p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-medium text-ink">
          <Icon.course className="size-4 text-icon-teal" aria-hidden />
          Clases
        </h2>
        <Switch
          label="Mostrar clases archivadas en el menu"
          description="Las anade al menu lateral junto a las activas"
          checked={settings.show_archived === 1}
          onChange={(value) => void save({ showArchived: value })}
        />
      </Card>
    </div>
  )
}
