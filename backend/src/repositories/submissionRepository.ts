import { execute, query, queryOne } from '../database/connection.ts'
import type { Submission } from '../types/models.ts'

const SELECT_SUB = `
  SELECT s.id, s.coursework_id, s.student_id,
         CONCAT(u.first_name, ' ', u.last_name) AS student_name,
         s.state, s.answer_text, s.submitted_at, s.returned_at,
         s.grade, s.draft_grade, s.is_late
  FROM submissions s
  JOIN users u ON u.id = s.student_id
`

/** Todas las entregas de una tarea (vista del docente). */
export const listByCoursework = (courseworkId: number) =>
  query<Submission>(`${SELECT_SUB} WHERE s.coursework_id = ? ORDER BY u.last_name`, [courseworkId])

/** Una entrega por su id. La usan los comentarios privados. */
export const findById = (id: number) =>
  queryOne<Submission>(`${SELECT_SUB} WHERE s.id = ?`, [id])

export const findOne = (courseworkId: number, studentId: number) =>
  queryOne<Submission>(`${SELECT_SUB} WHERE s.coursework_id = ? AND s.student_id = ?`, [
    courseworkId,
    studentId,
  ])

/**
 * Crea la fila de la entrega si aun no existe, sin cambiar su estado.
 * La usan los adjuntos del estudiante, que pueden llegar antes de entregar.
 */
export const ensure = (courseworkId: number, studentId: number) =>
  execute(
    `INSERT INTO submissions (coursework_id, student_id, state)
     VALUES (?, ?, 'assigned')
     ON DUPLICATE KEY UPDATE id = id`,
    [courseworkId, studentId],
  )

/** Crea la entrega si no existe, y la marca como entregada. */
export const turnIn = (
  courseworkId: number,
  studentId: number,
  answerText: string | null,
  isLate: boolean,
) =>
  execute(
    `INSERT INTO submissions (coursework_id, student_id, state, answer_text, submitted_at, is_late)
     VALUES (?, ?, 'turned_in', ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       state = 'turned_in', answer_text = VALUES(answer_text),
       submitted_at = NOW(), is_late = VALUES(is_late)`,
    [courseworkId, studentId, answerText, isLate ? 1 : 0],
  )

/** El estudiante retira su entrega para volver a trabajarla. */
export const reclaim = (courseworkId: number, studentId: number) =>
  execute(
    `UPDATE submissions SET state = 'reclaimed', submitted_at = NULL
     WHERE coursework_id = ? AND student_id = ? AND state = 'turned_in'`,
    [courseworkId, studentId],
  )

/** El docente guarda una nota en borrador (no visible al estudiante). */
export const saveDraftGrade = (courseworkId: number, studentId: number, grade: number) =>
  execute(
    `INSERT INTO submissions (coursework_id, student_id, draft_grade)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE draft_grade = VALUES(draft_grade)`,
    [courseworkId, studentId, grade],
  )

/** El docente devuelve la entrega y publica la nota. */
export const returnGrade = (courseworkId: number, studentId: number, grade: number) =>
  execute(
    `INSERT INTO submissions (coursework_id, student_id, state, grade, draft_grade, returned_at)
     VALUES (?, ?, 'returned', ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       state = 'returned', grade = VALUES(grade),
       draft_grade = VALUES(draft_grade), returned_at = NOW()`,
    [courseworkId, studentId, grade, grade],
  )

/** Libreta de calificaciones del curso (vista v_gradebook). */
export const gradebook = (courseId: number) =>
  query<{
    coursework_id: number
    coursework_title: string
    max_points: number | null
    due_at: string | null
    student_id: number
    student_name: string
    state: string
    grade: number | null
    is_late: 0 | 1
  }>(
    `SELECT coursework_id, coursework_title, max_points, due_at,
            student_id, student_name, state, grade, is_late
     FROM v_gradebook WHERE course_id = ?
     ORDER BY student_name, due_at IS NULL, due_at`,
    [courseId],
  )

/**
 * Entregas de los ultimos `days` dias que el docente aun no ha devuelto.
 * Alimenta la tarjeta "Pendientes de revision" del inicio.
 */
export const listToReviewForTeacher = (teacherId: number, days = 7) =>
  query<{
    course_id: number
    course_name: string
    coursework_id: number
    coursework_title: string
    student_id: number
    student_name: string
    submitted_at: string
    is_late: 0 | 1
  }>(
    `SELECT c.id AS course_id, c.name AS course_name,
            cw.id AS coursework_id, cw.title AS coursework_title,
            u.id AS student_id, CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            s.submitted_at, s.is_late
     FROM submissions s
     JOIN coursework  cw ON cw.id = s.coursework_id
     JOIN courses     c  ON c.id  = cw.course_id AND c.status = 'active'
     JOIN enrollments e  ON e.course_id = c.id AND e.user_id = ? AND e.course_role = 'teacher'
     JOIN users       u  ON u.id  = s.student_id
     WHERE s.state = 'turned_in'
       AND s.submitted_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
     ORDER BY s.submitted_at DESC`,
    [teacherId, days],
  )

/** Contadores "Entregado / Asignado / Calificado" del encabezado de una tarea. */
export const statsByCoursework = (courseworkId: number) =>
  queryOne<{ turned_in: number; assigned: number; graded: number; total_students: number }>(
    `SELECT
       SUM(s.state = 'turned_in')                    AS turned_in,
       SUM(s.state IS NULL OR s.state IN ('assigned','reclaimed')) AS assigned,
       SUM(s.state = 'returned')                     AS graded,
       COUNT(*)                                      AS total_students
     FROM coursework cw
     JOIN enrollments e ON e.course_id = cw.course_id AND e.course_role = 'student'
     LEFT JOIN submissions s ON s.coursework_id = cw.id AND s.student_id = e.user_id
     WHERE cw.id = ?`,
    [courseworkId],
  )
