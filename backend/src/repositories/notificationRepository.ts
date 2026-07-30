import { execute, query, queryOne } from '../database/connection.ts'
import type { Notification, NotificationType } from '../types/models.ts'

export const listForUser = (userId: number, limit = 30) =>
  query<Notification>(
    `SELECT id, user_id, course_id, type, title, body, link, read_at, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit],
  )

export const countUnread = (userId: number) =>
  queryOne<{ total: number }>(
    'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND read_at IS NULL',
    [userId],
  )

export const markAsRead = (id: number, userId: number) =>
  execute('UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?', [id, userId])

export const markAllAsRead = (userId: number) =>
  execute('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL', [userId])

/** Notifica a todos los estudiantes de un curso (nueva tarea, anuncio, etc.). */
export const notifyCourseStudents = (data: {
  courseId: number
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  exceptUserId?: number
}) =>
  execute(
    `INSERT INTO notifications (user_id, course_id, type, title, body, link)
     SELECT e.user_id, ?, ?, ?, ?, ?
     FROM enrollments e
     WHERE e.course_id = ? AND e.course_role = 'student' AND e.user_id <> ?`,
    [
      data.courseId,
      data.type,
      data.title,
      data.body,
      data.link,
      data.courseId,
      data.exceptUserId ?? 0,
    ],
  )

export const notifyUser = (data: {
  userId: number
  courseId: number | null
  type: NotificationType
  title: string
  body: string | null
  link: string | null
}) =>
  execute(
    `INSERT INTO notifications (user_id, course_id, type, title, body, link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.userId, data.courseId, data.type, data.title, data.body, data.link],
  )
