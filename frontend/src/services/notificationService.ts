import { http } from './http'
import type { Notification } from '@/types/models'

export const listNotifications = () =>
  http.get<{ items: Notification[]; unread: number }>('/notifications')

export const markAsRead = (id: number) => http.patch<null>(`/notifications/${id}/read`)

export const markAllAsRead = () => http.patch<null>('/notifications/read-all')
