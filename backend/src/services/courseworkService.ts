import * as cwRepo from '../repositories/courseworkRepository.ts'
import * as subRepo from '../repositories/submissionRepository.ts'
import * as streamRepo from '../repositories/streamRepository.ts'
import * as notificationRepo from '../repositories/notificationRepository.ts'
import { requireMembership, requireTeacher } from './courseService.ts'
import { HttpError } from '../utils/httpError.ts'
import type { AuthPayload, CourseworkStatus, CourseworkType } from '../types/models.ts'

export const listByCourse = async (courseId: number, user: AuthPayload) => {
  const role = await requireMembership(courseId, user)
  const items = await cwRepo.listByCourse(courseId, role === 'teacher')
  const topics = await cwRepo.listTopics(courseId)
  return { items, topics }
}

export const detail = async (courseworkId: number, user: AuthPayload) => {
  const item = await cwRepo.findById(courseworkId)
  if (!item) throw HttpError.notFound('El trabajo no existe')

  const role = await requireMembership(item.course_id, user)
  if (role === 'student' && item.status === 'draft') {
    throw HttpError.forbidden('Este trabajo aun no esta publicado')
  }

  const attachments = await streamRepo.listAttachments('coursework', courseworkId)

  if (role === 'teacher') {
    const submissions = await subRepo.listByCoursework(courseworkId)

    // Los archivos de todas las entregas en una sola consulta.
    const files = await streamRepo.listAttachmentsForOwners(
      'submission',
      submissions.map((s) => s.id),
    )

    return {
      coursework: item,
      attachments,
      submissions: submissions.map((submission) => ({
        ...submission,
        attachments: files.filter((file) => file.owner_id === submission.id),
      })),
      stats: await subRepo.statsByCoursework(courseworkId),
    }
  }

  const submission = await subRepo.findOne(courseworkId, user.id)

  return {
    coursework: item,
    attachments,
    submission,
    submissionAttachments: submission
      ? await streamRepo.listAttachments('submission', submission.id)
      : [],
  }
}

export const create = async (
  courseId: number,
  user: AuthPayload,
  data: {
    type: CourseworkType
    title: string
    instructions?: string
    maxPoints?: number
    dueAt?: string
    topicId?: number
    status?: CourseworkStatus
  },
) => {
  await requireTeacher(courseId, user)
  const status = data.status ?? 'published'

  const id = await cwRepo.create({
    courseId,
    topicId: data.topicId ?? null,
    authorId: user.id,
    type: data.type,
    title: data.title,
    instructions: data.instructions ?? null,
    maxPoints: data.maxPoints ?? null,
    dueAt: data.dueAt ?? null,
    status,
  })

  if (status === 'published') {
    await notificationRepo.notifyCourseStudents({
      courseId,
      type: 'coursework',
      title: `Nuevo trabajo: ${data.title}`,
      body: data.dueAt ? `Vence el ${data.dueAt}` : 'Sin fecha de entrega',
      link: `/courses/${courseId}/work/${id}`,
      exceptUserId: user.id,
    })
  }

  return cwRepo.findById(id)
}

/** Lista blanca camelCase -> columna, para el UPDATE del trabajo. */
const CW_COLUMNS = {
  title: 'title',
  instructions: 'instructions',
  maxPoints: 'max_points',
  dueAt: 'due_at',
  topicId: 'topic_id',
} as const

export const update = async (
  courseworkId: number,
  user: AuthPayload,
  data: Record<string, string | number | null | undefined>,
) => {
  const item = await cwRepo.findById(courseworkId)
  if (!item) throw HttpError.notFound('El trabajo no existe')
  await requireTeacher(item.course_id, user)

  const columns: Record<string, string | number | null> = {}
  for (const [key, column] of Object.entries(CW_COLUMNS)) {
    if (data[key] !== undefined) columns[column] = data[key] ?? null
  }
  if (Object.keys(columns).length === 0) throw HttpError.badRequest('No hay nada que actualizar')

  await cwRepo.update(courseworkId, columns)
  return cwRepo.findById(courseworkId)
}

/** Devuelve el trabajo a borrador: deja de verse en el tablon. */
export const unpublish = async (courseworkId: number, user: AuthPayload) => {
  const item = await cwRepo.findById(courseworkId)
  if (!item) throw HttpError.notFound('El trabajo no existe')
  await requireTeacher(item.course_id, user)

  if (item.status === 'draft') throw HttpError.badRequest('Ya es un borrador')

  await cwRepo.unpublish(courseworkId)
  return cwRepo.findById(courseworkId)
}

// ---------- Reutilizar publicacion ----------

/** Trabajo de las otras clases del docente, para copiarlo a esta. */
export const listReusable = async (courseId: number, user: AuthPayload) => {
  await requireTeacher(courseId, user)
  return cwRepo.listReusable(user.id, courseId)
}

export const reuse = async (
  courseId: number,
  user: AuthPayload,
  sourceId: number,
  topicId?: number | null,
) => {
  await requireTeacher(courseId, user)

  const source = await cwRepo.findById(sourceId)
  if (!source) throw HttpError.notFound('El trabajo que quieres copiar no existe')

  // El origen tiene que ser de una clase donde el usuario tambien sea docente.
  await requireTeacher(source.course_id, user)

  if (topicId !== undefined && topicId !== null) {
    const topic = await cwRepo.findTopic(topicId)
    if (!topic || topic.course_id !== courseId) {
      throw HttpError.badRequest('El tema no pertenece a esta clase')
    }
  }

  const newId = await cwRepo.duplicateInto(sourceId, courseId, user.id, topicId ?? null)
  return cwRepo.findById(newId)
}

export const publish = async (courseworkId: number, user: AuthPayload) => {
  const item = await cwRepo.findById(courseworkId)
  if (!item) throw HttpError.notFound('El trabajo no existe')
  await requireTeacher(item.course_id, user)

  await cwRepo.publish(courseworkId)
  await notificationRepo.notifyCourseStudents({
    courseId: item.course_id,
    type: 'coursework',
    title: `Nuevo trabajo: ${item.title}`,
    body: null,
    link: `/courses/${item.course_id}/work/${courseworkId}`,
    exceptUserId: user.id,
  })

  return cwRepo.findById(courseworkId)
}

export const remove = async (courseworkId: number, user: AuthPayload) => {
  const item = await cwRepo.findById(courseworkId)
  if (!item) throw HttpError.notFound('El trabajo no existe')
  await requireTeacher(item.course_id, user)
  await cwRepo.remove(courseworkId)
}

// ---------- Temas ----------

export const createTopic = async (courseId: number, user: AuthPayload, title: string) => {
  await requireTeacher(courseId, user)
  const id = await cwRepo.createTopic(courseId, title)
  return { id, course_id: courseId, title }
}

export const listTopics = async (courseId: number, user: AuthPayload) => {
  await requireMembership(courseId, user)
  return cwRepo.listTopics(courseId)
}

/** Comprueba que el tema exista y pertenezca al curso indicado. */
const requireTopicOfCourse = async (courseId: number, topicId: number) => {
  const topic = await cwRepo.findTopic(topicId)
  if (!topic || topic.course_id !== courseId) {
    throw HttpError.notFound('El tema no pertenece a esta clase')
  }
  return topic
}

export const renameTopic = async (
  courseId: number,
  user: AuthPayload,
  topicId: number,
  title: string,
) => {
  await requireTeacher(courseId, user)
  await requireTopicOfCourse(courseId, topicId)
  await cwRepo.updateTopic(topicId, { title })
  return cwRepo.findTopic(topicId)
}

/** Guarda el orden completo. El frontend manda los ids ya ordenados. */
export const reorderTopics = async (
  courseId: number,
  user: AuthPayload,
  orderedIds: number[],
) => {
  await requireTeacher(courseId, user)

  const existing = await cwRepo.listTopics(courseId)
  const known = new Set(existing.map((topic) => topic.id))
  if (orderedIds.length !== known.size || orderedIds.some((id) => !known.has(id))) {
    throw HttpError.badRequest('La lista debe incluir exactamente los temas de esta clase')
  }

  await cwRepo.reorderTopics(courseId, orderedIds)
  return cwRepo.listTopics(courseId)
}

/**
 * Borra el tema. El trabajo que lo usaba no se borra: la clave foranea
 * tiene ON DELETE SET NULL, asi que pasa a "Sin tema".
 */
export const removeTopic = async (courseId: number, user: AuthPayload, topicId: number) => {
  await requireTeacher(courseId, user)
  await requireTopicOfCourse(courseId, topicId)
  await cwRepo.removeTopic(topicId)
}

/** Trabajo pendiente del estudiante autenticado. */
export const pendingForMe = (user: AuthPayload) => cwRepo.listPendingForStudent(user.id)
