import type { ResultSetHeader } from 'mysql2'
import { execute, query, queryOne, transaction } from '../database/connection.ts'
import type { Coursework, CourseworkStatus, CourseworkType, Topic } from '../types/models.ts'

const SELECT_CW = `
  SELECT cw.id, cw.course_id, cw.topic_id, t.title AS topic_title, cw.author_id,
         CONCAT(a.first_name, ' ', a.last_name) AS author_name,
         cw.type, cw.title, cw.instructions, cw.max_points, cw.due_at,
         cw.status, cw.published_at, cw.created_at
  FROM coursework cw
  JOIN users a ON a.id = cw.author_id
  LEFT JOIN topics t ON t.id = cw.topic_id
`

/** Trabajo del curso. Los estudiantes solo ven lo publicado. */
export const listByCourse = (courseId: number, includeDrafts: boolean) =>
  query<Coursework>(
    `${SELECT_CW} WHERE cw.course_id = ? ${includeDrafts ? '' : "AND cw.status = 'published'"}
     ORDER BY t.position IS NULL, t.position, cw.created_at DESC`,
    [courseId],
  )

export const findById = (id: number) => queryOne<Coursework>(`${SELECT_CW} WHERE cw.id = ?`, [id])

export const create = async (data: {
  courseId: number
  topicId: number | null
  authorId: number
  type: CourseworkType
  title: string
  instructions: string | null
  maxPoints: number | null
  dueAt: string | null
  status: CourseworkStatus
}): Promise<number> => {
  const { insertId } = await execute(
    `INSERT INTO coursework
       (course_id, topic_id, author_id, type, title, instructions, max_points, due_at, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.courseId,
      data.topicId,
      data.authorId,
      data.type,
      data.title,
      data.instructions,
      data.maxPoints,
      data.dueAt,
      data.status,
      data.status === 'published' ? new Date() : null,
    ],
  )
  return insertId
}

export const update = (
  id: number,
  data: Record<string, string | number | null>,
) => {
  const fields = Object.keys(data)
  if (fields.length === 0) return Promise.resolve({ insertId: 0, affectedRows: 0 })
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  return execute(`UPDATE coursework SET ${setClause} WHERE id = ?`, [...Object.values(data), id])
}

export const publish = (id: number) =>
  execute(
    "UPDATE coursework SET status = 'published', published_at = NOW() WHERE id = ? AND status = 'draft'",
    [id],
  )

export const remove = (id: number) => execute('DELETE FROM coursework WHERE id = ?', [id])

/** Vuelve a borrador: el trabajo desaparece del tablon de los alumnos. */
export const unpublish = (id: number) =>
  execute(
    "UPDATE coursework SET status = 'draft', published_at = NULL WHERE id = ? AND status = 'published'",
    [id],
  )

/**
 * Trabajo que el docente puede reutilizar: lo de todas sus clases menos
 * la clase de destino. Alimenta "Reutilizar publicacion".
 */
export const listReusable = (teacherId: number, exceptCourseId: number) =>
  query<{
    id: number
    title: string
    type: CourseworkType
    max_points: number | null
    course_id: number
    course_name: string
    attachment_count: number
  }>(
    `SELECT cw.id, cw.title, cw.type, cw.max_points,
            c.id AS course_id, c.name AS course_name,
            (SELECT COUNT(*) FROM attachments a
              WHERE a.owner_type = 'coursework' AND a.owner_id = cw.id) AS attachment_count
     FROM coursework cw
     JOIN courses     c ON c.id = cw.course_id
     JOIN enrollments e ON e.course_id = c.id AND e.user_id = ? AND e.course_role = 'teacher'
     WHERE c.id <> ?
     ORDER BY c.name, cw.created_at DESC`,
    [teacherId, exceptCourseId],
  )

/**
 * Copia un trabajo a otra clase, siempre como borrador y con sus adjuntos.
 * No copia entregas ni comentarios.
 */
export const duplicateInto = async (
  sourceId: number,
  targetCourseId: number,
  authorId: number,
  topicId: number | null,
): Promise<number> =>
  transaction(async (conn) => {
    const [created] = await conn.execute(
      `INSERT INTO coursework
         (course_id, topic_id, author_id, type, title, instructions, max_points, status)
       SELECT ?, ?, ?, type, title, instructions, max_points, 'draft'
       FROM coursework WHERE id = ?`,
      [targetCourseId, topicId, authorId, sourceId],
    )
    const newId = (created as ResultSetHeader).insertId

    // Los adjuntos se copian como registros nuevos apuntando al mismo archivo:
    // borrar la copia no debe borrar el archivo del original.
    await conn.execute(
      `INSERT INTO attachments (owner_type, owner_id, kind, title, url, mime_type, size_bytes)
       SELECT 'coursework', ?, kind, title, url, mime_type, size_bytes
       FROM attachments WHERE owner_type = 'coursework' AND owner_id = ?`,
      [newId, sourceId],
    )

    return newId
  })

// ---------- Temas ----------

export const listTopics = (courseId: number) =>
  query<Topic>(
    'SELECT id, course_id, title, position FROM topics WHERE course_id = ? ORDER BY position, title',
    [courseId],
  )

export const createTopic = async (courseId: number, title: string): Promise<number> => {
  const { insertId } = await execute(
    `INSERT INTO topics (course_id, title, position)
     VALUES (?, ?, (SELECT COALESCE(MAX(position), 0) + 1 FROM topics t WHERE t.course_id = ?))`,
    [courseId, title, courseId],
  )
  return insertId
}

export const findTopic = (id: number) =>
  queryOne<Topic>('SELECT id, course_id, title, position FROM topics WHERE id = ?', [id])

/** Renombra o mueve un tema. Recibe ya nombres de columna. */
export const updateTopic = (id: number, data: Record<string, string | number>) => {
  const fields = Object.keys(data)
  if (fields.length === 0) return Promise.resolve({ insertId: 0, affectedRows: 0 })
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  return execute(`UPDATE topics SET ${setClause} WHERE id = ?`, [...Object.values(data), id])
}

/** Guarda el orden completo de los temas de un curso, en una transaccion. */
export const reorderTopics = (courseId: number, orderedIds: number[]) =>
  transaction(async (conn) => {
    for (const [index, topicId] of orderedIds.entries()) {
      await conn.execute('UPDATE topics SET position = ? WHERE id = ? AND course_id = ?', [
        index + 1,
        topicId,
        courseId,
      ])
    }
  })

export const removeTopic = (id: number) => execute('DELETE FROM topics WHERE id = ?', [id])

/** Alimenta el bloque "Pronto se entregara" del inicio. */
export const listPendingForStudent = (studentId: number) =>
  query<{
    course_id: number
    course_name: string
    coursework_id: number
    coursework_title: string
    due_at: string | null
  }>(
    'SELECT course_id, course_name, coursework_id, coursework_title, due_at FROM v_pending_work WHERE student_id = ? ORDER BY due_at IS NULL, due_at',
    [studentId],
  )
