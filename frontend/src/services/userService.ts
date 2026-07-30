import { http } from './http'
import type { User, UserSettings } from '@/types/models'

// ---------- Perfil ----------

export const getProfile = () => http.get<User>('/users/me')

export const updateProfile = (data: {
  firstName?: string
  lastName?: string
  bio?: string
  phone?: string
}) => http.patch<User>('/users/me', data)

export const changePassword = (currentPassword: string, newPassword: string) =>
  http.post<null>('/users/me/password', { currentPassword, newPassword })

export const uploadAvatar = (file: File) => http.upload<User>('/users/me/avatar', file)

export const removeAvatar = () => http.delete<User>('/users/me/avatar')

// ---------- Ajustes ----------

export const getSettings = () => http.get<UserSettings>('/users/me/settings')

export const updateSettings = (data: {
  theme?: 'light' | 'dark' | 'system'
  density?: 'comfortable' | 'compact'
  language?: 'es' | 'en'
  notifyCoursework?: boolean
  notifyAnnouncements?: boolean
  notifyGrades?: boolean
  showArchived?: boolean
}) => http.patch<UserSettings>('/users/me/settings', data)
