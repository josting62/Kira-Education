import { execute, query, queryOne } from '../database/connection.ts'
import type {
  Announcement,
  Attachment,
  AttachmentKind,
  AttachmentOwner,
  Comment,
  CommentTarget,
} from '../types/models.ts'

// ---------- Anuncios ----------

const SELECT_ANN = `
  SELECT a.id, a.course_id, a.author_id,
         CONCAT(u.first_name, ' ', u.last_name) AS author_name,
         a.body, a.created_at
  FROM announcements a
  JOIN users u ON u.id = a.author_id
`

export const listAnnouncements = (courseId: number) =>
  query<Announcement>(`${SELECT_ANN} WHERE a.course_id = ? ORDER BY a.created_at DESC`, [courseId])

export const findAnnouncement = (id: number) =>
  queryOne<Announcement>(`${SELECT_ANN} WHERE a.id = ?`, [id])

export const createAnnouncement = async (
  courseId: number,
  authorId: number,
  body: string,
): Promise<number> => {
  const { insertId } = await execute(
    'INSERT INTO announcements (course_id, author_id, body) VALUES (?, ?, ?)',
    [courseId, authorId, body],
  )
  return insertId
}

export const removeAnnouncement = (id: number) =>
  execute('DELETE FROM announcements WHERE id = ?', [id])

// ---------- Adjuntos ----------

export const findAttachment = (id: number) =>
  queryOne<Attachment>(
    `SELECT id, owner_type, owner_id, kind, title, url, mime_type, size_bytes
     FROM attachments WHERE id = ?`,
    [id],
  )

export const listAttachments = (ownerType: AttachmentOwner, ownerId: number) =>
  query<Attachment>(
    `SELECT id, owner_type, owner_id, kind, title, url, mime_type, size_bytes
     FROM attachments WHERE owner_type = ? AND owner_id = ? ORDER BY id`,
    [ownerType, ownerId],
  )

/** Adjuntos de varios dueños del mismo tipo, en una sola consulta. */
export const listAttachmentsForOwners = (ownerType: AttachmentOwner, ownerIds: number[]) => {
  if (ownerIds.length === 0) return Promise.resolve([])
  const placeholders = ownerIds.map(() => '?').join(', ')
  return query<Attachment>(
    `SELECT id, owner_type, owner_id, kind, title, url, mime_type, size_bytes
     FROM attachments
     WHERE owner_type = ? AND owner_id IN (${placeholders})
     ORDER BY id`,
    [ownerType, ...ownerIds],
  )
}

export const createAttachment = async (data: {
  ownerType: AttachmentOwner
  ownerId: number
  kind: AttachmentKind
  title: string
  url: string
  mimeType?: string | null
  sizeBytes?: number | null
}): Promise<number> => {
  const { insertId } = await execute(
    `INSERT INTO attachments (owner_type, owner_id, kind, title, url, mime_type, size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.ownerType,
      data.ownerId,
      data.kind,
      data.title,
      data.url,
      data.mimeType ?? null,
      data.sizeBytes ?? null,
    ],
  )
  return insertId
}

export const removeAttachment = (id: number) => execute('DELETE FROM attachments WHERE id = ?', [id])

// ---------- Comentarios ----------

export const listComments = (
  targetType: CommentTarget,
  targetId: number,
  visibility: 'class' | 'private' = 'class',
) =>
  query<Comment>(
    `SELECT c.id, c.target_type, c.target_id, c.author_id,
            CONCAT(u.first_name, ' ', u.last_name) AS author_name,
            u.avatar_url AS author_avatar,
            c.body, c.visibility, c.created_at
     FROM comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.target_type = ? AND c.target_id = ? AND c.visibility = ?
     ORDER BY c.created_at`,
    [targetType, targetId, visibility],
  )

export const findComment = (id: number) =>
  queryOne<{
    id: number
    target_type: CommentTarget
    target_id: number
    author_id: number
  }>('SELECT id, target_type, target_id, author_id FROM comments WHERE id = ?', [id])

export const createComment = async (data: {
  targetType: CommentTarget
  targetId: number
  authorId: number
  body: string
  visibility: 'class' | 'private'
}): Promise<number> => {
  const { insertId } = await execute(
    `INSERT INTO comments (target_type, target_id, author_id, body, visibility)
     VALUES (?, ?, ?, ?, ?)`,
    [data.targetType, data.targetId, data.authorId, data.body, data.visibility],
  )
  return insertId
}

export const removeComment = (id: number) => execute('DELETE FROM comments WHERE id = ?', [id])
