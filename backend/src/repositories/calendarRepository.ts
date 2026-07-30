import { query } from '../database/connection.ts'
import type { CourseworkType, SubmissionState } from '../types/models.ts'

export interface CalendarEntry {
  coursework_id: number
  title: string
  type: CourseworkType
  due_at: string
  course_id: number
  course_name: string
  theme_color: string
  /** Estado de la entrega del propio usuario. NULL si es el docente. */
  my_state: SubmissionState | null
}

/**
 * Trabajo con fecha de entrega dentro del rango, en los cursos del usuario.
 * Sirve igual para docente y estudiante: el docente ve todo lo publicado de
 * sus clases, el estudiante ve lo suyo mas el estado de su entrega.
 */
export const listRange = (userId: number, from: string, to: string) =>
  query<CalendarEntry>(
    `SELECT cw.id       AS coursework_id,
            cw.title    AS title,
            cw.type     AS type,
            cw.due_at   AS due_at,
            c.id        AS course_id,
            c.name      AS course_name,
            c.theme_color,
            s.state     AS my_state
     FROM coursework cw
     JOIN courses     c ON c.id = cw.course_id AND c.status = 'active'
     JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
     LEFT JOIN submissions s ON s.coursework_id = cw.id AND s.student_id = ?
     WHERE cw.due_at IS NOT NULL
       AND cw.due_at >= ? AND cw.due_at < ?
       AND (cw.status = 'published' OR e.course_role = 'teacher')
     ORDER BY cw.due_at`,
    [userId, userId, from, to],
  )
