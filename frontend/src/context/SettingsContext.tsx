import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as userService from '@/services/userService'
import { useAuth } from '@/hooks/useAuth'
import {
  applyTheme,
  readStoredPreference,
  resolveTheme,
  storePreference,
  watchSystemTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme'
import type { UserSettings } from '@/types/models'

type SettingsPatch = Parameters<typeof userService.updateSettings>[0]

interface SettingsContextValue {
  settings: UserSettings | null
  loading: boolean
  save: (patch: SettingsPatch) => Promise<void>
  /** Preferencia elegida: puede ser 'system'. */
  theme: ThemePreference
  /** Tema que se esta pintando de verdad. */
  resolvedTheme: ResolvedTheme
  setTheme: (preference: ThemePreference) => Promise<void>
  /** Alterna claro/oscuro partiendo de lo que se ve ahora mismo. */
  toggleTheme: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const SettingsContext = createContext<SettingsContextValue | null>(null)

/** Traduce el patch camelCase al shape que devuelve la API (snake_case). */
const toColumns = (patch: SettingsPatch): Partial<UserSettings> => ({
  ...(patch.theme !== undefined && { theme: patch.theme }),
  ...(patch.density !== undefined && { density: patch.density }),
  ...(patch.language !== undefined && { language: patch.language }),
  ...(patch.notifyCoursework !== undefined && {
    notify_coursework: Number(patch.notifyCoursework) as 0 | 1,
  }),
  ...(patch.notifyAnnouncements !== undefined && {
    notify_announcements: Number(patch.notifyAnnouncements) as 0 | 1,
  }),
  ...(patch.notifyGrades !== undefined && {
    notify_grades: Number(patch.notifyGrades) as 0 | 1,
  }),
  ...(patch.showArchived !== undefined && {
    show_archived: Number(patch.showArchived) as 0 | 1,
  }),
})

/** Resultado cacheado junto al usuario al que pertenece. */
interface Snapshot {
  userId: number
  settings: UserSettings | null
}

/**
 * Carga los ajustes del usuario y los aplica de verdad:
 * el tema se escribe en <html data-theme> y la densidad en <html data-density>.
 *
 * El estado guarda a que usuario pertenece, asi al cambiar de sesion los
 * ajustes viejos se descartan sin necesidad de un setState dentro del efecto.
 */
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  // Mientras no hay sesion vale la copia local (la que uso el script inline).
  const [fallbackTheme, setFallbackTheme] = useState<ThemePreference>(readStoredPreference)

  // Cambia cuando el sistema operativo cambia de tema, solo importa si la
  // preferencia es 'system'.
  const [systemDark, setSystemDark] = useState(() => resolveTheme('system') === 'dark')

  const userId = user?.id ?? null
  const fresh = userId !== null && snapshot?.userId === userId
  const settings = fresh ? snapshot.settings : null

  const theme: ThemePreference = settings?.theme ?? fallbackTheme
  const resolvedTheme: ResolvedTheme =
    theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    if (userId === null) return
    let active = true

    userService
      .getSettings()
      .then((loaded) => {
        if (active) setSnapshot({ userId, settings: loaded })
      })
      .catch(() => {
        if (active) setSnapshot({ userId, settings: null })
      })

    return () => {
      active = false
    }
  }, [userId])

  useEffect(() => watchSystemTheme(setSystemDark), [])

  // Pinta el tema y deja la copia local lista para el proximo arranque.
  useEffect(() => {
    applyTheme(resolvedTheme)
    storePreference(theme)
  }, [resolvedTheme, theme])

  useEffect(() => {
    document.documentElement.dataset.density = settings?.density ?? 'comfortable'
  }, [settings?.density])

  const save = useCallback(
    async (patch: SettingsPatch) => {
      if (userId === null) return

      // Optimista: el cambio se ve al instante y se confirma con la respuesta.
      setSnapshot((prev) =>
        prev?.settings ? { userId, settings: { ...prev.settings, ...toColumns(patch) } } : prev,
      )
      setSnapshot({ userId, settings: await userService.updateSettings(patch) })
    },
    [userId],
  )

  const setTheme = useCallback(
    async (preference: ThemePreference) => {
      // Se aplica siempre, aunque no haya sesion (pantalla de login).
      setFallbackTheme(preference)
      if (userId !== null) await save({ theme: preference })
    },
    [userId, save],
  )

  const toggleTheme = useCallback(
    () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
    [resolvedTheme, setTheme],
  )

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      loading: userId !== null && !fresh,
      save,
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [settings, userId, fresh, save, theme, resolvedTheme, setTheme, toggleTheme],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
