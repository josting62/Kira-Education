import { http } from './http'
import type { AdminStats, Course, CourseStatus, Role, RoleSlug, User } from '@/types/models'

export const getOverview = () =>
  http.get<{ stats: AdminStats; roles: Role[] }>('/admin/overview')

export const listUsers = (search = '') =>
  http.get<User[]>(`/admin/users?search=${encodeURIComponent(search)}`)

export const createUser = (data: {
  firstName: string
  lastName: string
  email: string
  password: string
  role: RoleSlug
}) => http.post<User>('/admin/users', data)

export const setUserRole = (id: number, role: RoleSlug) =>
  http.patch<User>(`/admin/users/${id}/role`, { role })

export const setUserStatus = (id: number, status: 'active' | 'inactive') =>
  http.patch<User>(`/admin/users/${id}/status`, { status })

export const resetUserPassword = (id: number, newPassword: string) =>
  http.post<null>(`/admin/users/${id}/password`, { newPassword })

export const listAllCourses = (status: CourseStatus = 'active') =>
  http.get<Course[]>(`/admin/courses?status=${status}`)
