import type { ResultSetHeader } from 'mysql2'
import { execute, query, queryOne, transaction } from '../database/connection.ts'
import type { BannerKind, Course, CourseRole, CourseStatus, User } from '../types/models.ts'

const SELECT_COURSE = `
  SELECT c.id, c.name, c.section, c.subject, c.room, c.description, c.owner_id,
         CONCAT(o.first_name, ' ', o.last_name) AS owner_name,
         c.class_code, c.theme_color, c.banner_kind, c.banner_url, c.status, c.created_at
  FROM courses c
  JOIN users o ON o.id = c.owner_id
`

/** Cursos donde el usuario esta inscrito (como docente o estudiante). */
export const listForUser = (userId: number, status: CourseStatus = 'active') =>
  query<Course>(
    `${SELECT_COURSE}
     JOIN enrollments e ON e.course_id = c.id AND e.user_id = ?
     WHERE c.status = ?
     ORDER BY c.created_at DESC`,
    [userId, status],
  )

/** Todos los cursos: solo para el rol admin. */
export const listAll = (status: CourseStatus = 'active') =>
  query<Course>(`${SELECT_COURSE} WHERE c.status = ? ORDER BY c.created_at DESC`, [status])

export const findById = (id: number) =>
  queryOne<Course>(`${SELECT_COURSE} WHERE c.id = ?`, [id])

export const findByCode = (code: string) =>
  queryOne<Course>(`${SELECT_COURSE} WHERE c.class_code = ?`, [code])

export const create = async (data: {
  name: string
  section?: string | null
  subject?: string | null
  room?: string | null
  description?: string | null
  ownerId: number
  classCode: string
  themeColor: string
}): Promise<number> => {
  const { insertId } = await execute(
    `INSERT INTO courses (name, section, subject, room, description, owner_id, class_code, theme_color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.section ?? null,
      data.subject ?? null,
      data.room ?? null,
      data.description ?? null,
      data.ownerId,
      data.classCode,
      data.themeColor,
    ],
  )
  return insertId
}

/** Recibe ya los nombres de columna, filtrados por courseService.COLUMN_MAP. */
export const update = (id: number, data: Record<string, string>) => {
  const fields = Object.keys(data)
  if (fields.length === 0) return Promise.resolve({ insertId: 0, affectedRows: 0 })
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  return execute(`UPDATE courses SET ${setClause} WHERE id = ?`, [...Object.values(data), id])
}

export const setStatus = (id: number, status: CourseStatus) =>
  execute('UPDATE courses SET status = ? WHERE id = ?', [status, id])

/** Guarda la personalizacion del encabezado (color, galeria o imagen subida). */
export const setBanner = (
  id: number,
  themeColor: string,
  bannerKind: BannerKind,
  bannerUrl: string | null,
) =>
  execute('UPDATE courses SET theme_color = ?, banner_kind = ?, banner_url = ? WHERE id = ?', [
    themeColor,
    bannerKind,
    bannerUrl,
    id,
  ])

export const remove = (id: number) => execute('DELETE FROM courses WHERE id = ?', [id])

/**
 * Duplica un curso: copia sus temas y su trabajo en clase (siempre como borrador),
 * sin alumnos ni entregas ni anuncios. Todo dentro de una transaccion.
 */
export const duplicate = async (
  sourceId: number,
  ownerId: number,
  newName: string,
  classCode: string,
): Promise<number> =>
  transaction(async (conn) => {
    const [[source]] = (await conn.query('SELECT * FROM courses WHERE id = ?', [sourceId])) as [
      Course[],
      unknown,
    ]

    const [created] = await conn.execute(
      `INSERT INTO courses (name, section, subject, room, description, owner_id, class_code,
                            theme_color, banner_kind, banner_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newName,
        source.section,
        source.subject,
        source.room,
        source.description,
        ownerId,
        classCode,
        source.theme_color,
        source.banner_kind,
        source.banner_url,
      ],
    )
    const newId = (created as ResultSetHeader).insertId

    await conn.execute(
      "INSERT INTO enrollments (course_id, user_id, course_role) VALUES (?, ?, 'teacher')",
      [newId, ownerId],
    )

    // Los temas se copian primero para poder mapear los ids viejos a los nuevos.
    const [topics] = (await conn.query(
      'SELECT id, title, position FROM topics WHERE course_id = ? ORDER BY position',
      [sourceId],
    )) as [{ id: number; title: string; position: number }[], unknown]

    const topicMap = new Map<number, number>()
    for (const topic of topics) {
      const [inserted] = await conn.execute(
        'INSERT INTO topics (course_id, title, position) VALUES (?, ?, ?)',
        [newId, topic.title, topic.position],
      )
      topicMap.set(topic.id, (inserted as ResultSetHeader).insertId)
    }

    await conn.execute(
      `INSERT INTO coursework (course_id, topic_id, author_id, type, title, instructions, max_points, status)
       SELECT ?, NULL, ?, type, title, instructions, max_points, 'draft'
       FROM coursework WHERE course_id = ? AND topic_id IS NULL`,
      [newId, ownerId, sourceId],
    )

    for (const [oldTopicId, newTopicId] of topicMap) {
      await conn.execute(
        `INSERT INTO coursework (course_id, topic_id, author_id, type, title, instructions, max_points, status)
         SELECT ?, ?, ?, type, title, instructions, max_points, 'draft'
         FROM coursework WHERE course_id = ? AND topic_id = ?`,
        [newId, newTopicId, ownerId, sourceId, oldTopicId],
      )
    }

    return newId
  })

// ---------- Inscripciones ----------

export const findEnrollment = (courseId: number, userId: number) =>
  queryOne<{ course_role: CourseRole }>(
    'SELECT course_role FROM enrollments WHERE course_id = ? AND user_id = ?',
    [courseId, userId],
  )

export const enroll = (courseId: number, userId: number, role: CourseRole) =>
  execute(
    `INSERT INTO enrollments (course_id, user_id, course_role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE course_role = VALUES(course_role)`,
    [courseId, userId, role],
  )

export const unenroll = (courseId: number, userId: number) =>
  execute('DELETE FROM enrollments WHERE course_id = ? AND user_id = ?', [courseId, userId])

/** Integrantes del curso, separables por course_role en el servicio. */
export const listMembers = (courseId: number) =>
  query<User & { course_role: CourseRole }>(
    `SELECT u.id, u.role_id, r.slug AS role_slug, u.first_name, u.last_name, u.email,
            u.avatar_url, u.status, u.created_at, e.course_role
     FROM enrollments e
     JOIN users u ON u.id = e.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE e.course_id = ?
     ORDER BY e.course_role, u.last_name, u.first_name`,
    [courseId],
  )
