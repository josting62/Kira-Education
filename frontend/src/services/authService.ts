import { http } from './http'
import type { RoleSlug, User } from '@/types/models'

export const login = (email: string, password: string) =>
  http.post<{ user: User; token: string }>('/auth/login', { email, password })

export const register = (data: {
  firstName: string
  lastName: string
  email: string
  password: string
  role: RoleSlug
}) => http.post<{ user: User; token: string }>('/auth/register', data)

export const logout = () => http.post<null>('/auth/logout')

export const me = () => http.get<User>('/auth/me')
