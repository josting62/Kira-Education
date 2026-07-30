/**
 * Tema claro / oscuro.
 *
 * La fuente de verdad es `user_settings.theme` en la base de datos, para que
 * la preferencia siga al usuario aunque cierre sesion o cambie de equipo.
 * En `localStorage` guardamos una copia con un unico proposito: que el script
 * inline de index.html pueda pintar el tema correcto antes del primer render.
 */

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

/** Debe coincidir con la clave que lee el script de index.html. */
const STORAGE_KEY = 'kiro-theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

export const prefersDark = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches

/** Convierte la preferencia en el tema que se pinta de verdad. */
export const resolveTheme = (preference: ThemePreference): ResolvedTheme =>
  preference === 'system' ? (prefersDark() ? 'dark' : 'light') : preference

/** Lee la copia local. Se usa antes de que la sesion este cargada. */
export const readStoredPreference = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
  } catch {
    return 'system'
  }
}

export const storePreference = (preference: ThemePreference): void => {
  try {
    localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Modo privado o almacenamiento lleno: no es critico, solo perdemos el
    // arranque sin parpadeo.
  }
}

/** Escribe el tema en <html data-theme>, que es lo que lee el CSS. */
export const applyTheme = (resolved: ResolvedTheme): void => {
  document.documentElement.dataset.theme = resolved
}

/**
 * Avisa cuando cambia la preferencia del sistema operativo.
 * Devuelve la funcion para dejar de escuchar.
 */
export const watchSystemTheme = (onChange: (dark: boolean) => void): (() => void) => {
  const media = window.matchMedia(DARK_QUERY)
  const handler = (event: MediaQueryListEvent) => onChange(event.matches)
  media.addEventListener('change', handler)
  return () => media.removeEventListener('change', handler)
}
