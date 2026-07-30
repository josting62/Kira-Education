import { execute, query, queryOne } from '../database/connection.ts'
import type { RoleSlug, User, UserSettings, UserWithPassword } from '../types/models.ts'

const SELECT_USER = `
  SELECT u.id, u.role_id, r.slug AS role_slug, u.first_name, u.last_name,
         u.email, u.avatar_url, u.bio, u.phone, u.status, u.created_at
  FROM users u
  JOIN roles r ON r.id = u.role_id
`

export const findById = (id: number) => queryOne<User>(`${SELECT_USER} WHERE u.id = ?`, [id])

export const findByEmail = (email: string) =>
  queryOne<UserWithPassword>(
    `SELECT u.id, u.role_id, r.slug AS role_slug, u.first_name, u.last_name, u.email,
            u.password_hash, u.avatar_url, u.bio, u.phone, u.status, u.created_at
     FROM users u JOIN roles r ON r.id = u.role_id
     WHERE u.email = ?`,
    [email],
  )

export const listAll = (search = '') => {
  const like = `%${search}%`
  return query<User>(
    `${SELECT_USER}
     WHERE (? = '' OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)
     ORDER BY r.id, u.last_name, u.first_name`,
    [search, like, like, like],
  )
}

export const create = async (data: {
  roleSlug: RoleSlug
  firstName: string
  lastName: string
  email: string
  passwordHash: string
}): Promise<number> => {
  const { insertId } = await execute(
    `INSERT INTO users (role_id, first_name, last_name, email, password_hash)
     VALUES ((SELECT id FROM roles WHERE slug = ?), ?, ?, ?, ?)`,
    [data.roleSlug, data.firstName, data.lastName, data.email, data.passwordHash],
  )
  await execute('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [insertId])
  return insertId
}

/** Actualiza el perfil. Recibe ya los nombres de columna. */
export const updateProfile = (id: number, columns: Record<string, string | null>) => {
  const fields = Object.keys(columns)
  if (fields.length === 0) return Promise.resolve({ insertId: 0, affectedRows: 0 })
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  return execute(`UPDATE users SET ${setClause} WHERE id = ?`, [...Object.values(columns), id])
}

export const updatePassword = (id: number, passwordHash: string) =>
  execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id])

export const setRole = (id: number, roleSlug: RoleSlug) =>
  execute('UPDATE users SET role_id = (SELECT id FROM roles WHERE slug = ?) WHERE id = ?', [
    roleSlug,
    id,
  ])

export const setStatus = (id: number, status: 'active' | 'inactive') =>
  execute('UPDATE users SET status = ? WHERE id = ?', [status, id])

export const listRoles = () =>
  query<{ id: number; slug: RoleSlug; name: string; description: string | null }>(
    'SELECT id, slug, name, description FROM roles ORDER BY id',
  )

// ---------- Ajustes ----------

export const getSettings = (userId: number) =>
  queryOne<UserSettings>(
    `SELECT user_id, theme, density, language, notify_coursework, notify_announcements,
            notify_grades, show_archived
     FROM user_settings WHERE user_id = ?`,
    [userId],
  )

/** Crea la fila si no existe y aplica los cambios recibidos. */
export const upsertSettings = async (
  userId: number,
  columns: Record<string, string | number>,
) => {
  await execute('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [userId])
  const fields = Object.keys(columns)
  if (fields.length === 0) return
  const setClause = fields.map((f) => `${f} = ?`).join(', ')
  await execute(`UPDATE user_settings SET ${setClause} WHERE user_id = ?`, [
    ...Object.values(columns),
    userId,
  ])
}

// ---------- Estadisticas para el panel de administracion ----------

export const stats = () =>
  queryOne<{
    users: number
    teachers: number
    students: number
    inactive: number
    courses: number
    archived: number
    coursework: number
    submissions: number
  }>(
    `SELECT
       (SELECT COUNT(*) FROM users)                                            AS users,
       (SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id
         WHERE r.slug = 'teacher')                                             AS teachers,
       (SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id
         WHERE r.slug = 'student')                                             AS students,
       (SELECT COUNT(*) FROM users WHERE status = 'inactive')                   AS inactive,
       (SELECT COUNT(*) FROM courses WHERE status = 'active')                   AS courses,
       (SELECT COUNT(*) FROM courses WHERE status = 'archived')                 AS archived,
       (SELECT COUNT(*) FROM coursework)                                        AS coursework,
       (SELECT COUNT(*) FROM submissions WHERE state <> 'assigned')             AS submissions`,
  )
