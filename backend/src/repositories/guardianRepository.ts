import { execute, query, queryOne } from '../database/connection.ts'

export interface GuardianLink {
  id: number
  student_id: number
  student_name: string
  student_email: string
  student_avatar: string | null
  relation: string | null
}

/** Estudiantes que puede consultar un acudiente. */
export const listStudents = (guardianId: number) =>
  query<GuardianLink>(
    `SELECT gs.id, u.id AS student_id,
            CONCAT(u.first_name, ' ', u.last_name) AS student_name,
            u.email AS student_email, u.avatar_url AS student_avatar,
            gs.relation
     FROM guardian_students gs
     JOIN users u ON u.id = gs.student_id
     WHERE gs.guardian_id = ?
     ORDER BY u.last_name, u.first_name`,
    [guardianId],
  )

/** Acudientes de un estudiante (lo usa el modulo de administracion). */
export const listGuardians = (studentId: number) =>
  query<{
    id: number
    guardian_id: number
    guardian_name: string
    guardian_email: string
    relation: string | null
  }>(
    `SELECT gs.id, u.id AS guardian_id,
            CONCAT(u.first_name, ' ', u.last_name) AS guardian_name,
            u.email AS guardian_email, gs.relation
     FROM guardian_students gs
     JOIN users u ON u.id = gs.guardian_id
     WHERE gs.student_id = ?
     ORDER BY u.last_name`,
    [studentId],
  )

/** true si el acudiente tiene permiso sobre ese estudiante. */
export const isLinked = async (guardianId: number, studentId: number): Promise<boolean> => {
  const row = await queryOne<{ id: number }>(
    'SELECT id FROM guardian_students WHERE guardian_id = ? AND student_id = ?',
    [guardianId, studentId],
  )
  return row !== null
}

export const link = (guardianId: number, studentId: number, relation: string | null) =>
  execute(
    `INSERT INTO guardian_students (guardian_id, student_id, relation) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE relation = VALUES(relation)`,
    [guardianId, studentId, relation],
  )

export const unlink = (guardianId: number, studentId: number) =>
  execute('DELETE FROM guardian_students WHERE guardian_id = ? AND student_id = ?', [
    guardianId,
    studentId,
  ])

// ---------- Consultas de solo lectura sobre el acudido ----------

/** Clases activas del estudiante, con su docente. */
export const studentCourses = (studentId: number) =>
  query<{
    id: number
    name: string
    section: string | null
    theme_color: string
    owner_name: string
  }>(
    `SELECT c.id, c.name, c.section, c.theme_color,
            CONCAT(o.first_name, ' ', o.last_name) AS owner_name
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id AND c.status = 'active'
     JOIN users   o ON o.id = c.owner_id
     WHERE e.user_id = ? AND e.course_role = 'student'
     ORDER BY c.name`,
    [studentId],
  )

/** Notas ya devueltas, lo unico que ve un acudiente. */
export const studentGrades = (studentId: number) =>
  query<{
    course_id: number
    course_name: string
    coursework_id: number
    coursework_title: string
    max_points: number | null
    grade: number | null
    state: string
    is_late: 0 | 1
    due_at: string | null
  }>(
    `SELECT course_id, course_name, coursework_id, coursework_title,
            max_points, grade, state, is_late, due_at
     FROM v_gradebook
     WHERE student_id = ?
     ORDER BY course_name, due_at IS NULL, due_at`,
    [studentId],
  )

/** Trabajo pendiente del estudiante. */
export const studentPending = (studentId: number) =>
  query<{
    course_id: number
    course_name: string
    coursework_id: number
    coursework_title: string
    due_at: string | null
  }>(
    `SELECT course_id, course_name, coursework_id, coursework_title, due_at
     FROM v_pending_work
     WHERE student_id = ?
     ORDER BY due_at IS NULL, due_at`,
    [studentId],
  )
