import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import * as authService from '@/services/authService'
import type { RoleSlug, User } from '@/types/models'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: RoleSlug
  }) => Promise<void>
  logout: () => Promise<void>
  /** Vuelve a leer el usuario de la API (tras editar el perfil o el avatar). */
  refreshUser: () => Promise<void>
  /** Atajos de rol usados por la UI para mostrar u ocultar modulos. */
  isTeacher: boolean
  isStudent: boolean
  isAdmin: boolean
  isGuardian: boolean
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * La marca `has_session` la pone el backend junto al token (ver authController).
 * No autoriza nada: solo evita preguntar por el usuario cuando no hay sesion.
 */
const hasSessionCookie = () =>
  document.cookie.split('; ').some((entry) => entry.startsWith('has_session='))

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(hasSessionCookie())

  // Rehidrata la sesion al cargar la app. Solo se pregunta a la API si la
  // cookie indicadora existe, para no provocar un 401 en la consola cuando
  // nadie ha iniciado sesion.
  useEffect(() => {
    if (!hasSessionCookie()) return
    let active = true

    authService
      .me()
      .then((loaded) => {
        if (active) setUser(loaded)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { user: logged } = await authService.login(email, password)
    setUser(logged)
  }, [])

  const register = useCallback<AuthContextValue['register']>(async (data) => {
    const { user: created } = await authService.register(data)
    setUser(created)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined)
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    setUser(await authService.me())
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isTeacher: user?.role_slug === 'teacher',
      isStudent: user?.role_slug === 'student',
      isAdmin: user?.role_slug === 'admin',
      isGuardian: user?.role_slug === 'guardian',
    }),
    [user, loading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
