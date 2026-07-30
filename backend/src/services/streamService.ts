import * as streamRepo from '../repositories/streamRepository.ts'
import * as cwRepo from '../repositories/courseworkRepository.ts'
import * as subRepo from '../repositories/submissionRepository.ts'
import * as courseRepo from '../repositories/courseRepository.ts'
import * as notificationRepo from '../repositories/notificationRepository.ts'
import { requireMembership, requireTeacher } from './courseService.ts'
import { HttpError } from '../utils/httpError.ts'
import type { AuthPayload, CommentTarget } from '../types/models.ts'

/** Tablon "Novedades": anuncios + trabajo publicado, ordenados por fecha. */
export const stream = async (courseId: number, user: AuthPayload) => {
  const role = await requireMembership(courseId, user)

  const announcements = await streamRepo.listAnnouncements(courseId)
  const coursework = await cwRepo.listByCourse(courseId, role === 'teacher')

  const entries = [
    ...announcements.map((a) => ({
      kind: 'announcement' as const,
      id: a.id,
      author_name: a.author_name,
      created_at: a.created_at,
      body: a.body,
    })),
    ...coursework
      .filter((c) => c.status === 'published')
      .map((c) => ({
        kind: 'coursework' as const,
        id: c.id,
        author_name: c.author_name,
        created_at: c.published_at ?? c.created_at,
        type: c.type,
        title: c.title,
        due_at: c.due_at,
      })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at))

  return { entries }
}

export const createAnnouncement = async (courseId: number, user: AuthPayload, body: string) => {
  await requireTeacher(courseId, user)
  const id = await streamRepo.createAnnouncement(courseId, user.id, body)

  await notificationRepo.notifyCourseStudents({
    courseId,
    type: 'announcement',
    title: 'Nuevo anuncio',
    body: body.slice(0, 120),
    link: `/courses/${courseId}`,
    exceptUserId: user.id,
  })

  return streamRepo.findAnnouncement(id)
}

export const removeAnnouncement = async (announcementId: number, user: AuthPayload) => {
  const ann = await streamRepo.findAnnouncement(announcementId)
  if (!ann) throw HttpError.notFound('El anuncio no existe')
  if (ann.author_id !== user.id && user.role !== 'admin') {
    await requireTeacher(ann.course_id, user)
  }
  await streamRepo.removeAnnouncement(announcementId)
}

/**
 * Contexto de un hilo de comentarios: a que curso pertenece, si es publico o
 * privado y a quien hay que avisar.
 *
 *   announcement / coursework -> comentario de clase, lo ve todo el curso
 *   submission                -> comentario privado entre el alumno y el docente
 */
interface CommentContext {
  courseId: number
  visibility: 'class' | 'private'
  /** Solo en entregas: el dueño del trabajo. */
  studentId?: number
  courseworkId?: number
}

const resolveContext = async (
  targetType: CommentTarget,
  targetId: number,
  user: AuthPayload,
): Promise<CommentContext> => {
  if (targetType === 'announcement') {
    const ann = await streamRepo.findAnnouncement(targetId)
    if (!ann) throw HttpError.notFound('El anuncio no existe')
    await requireMembership(ann.course_id, user)
    return { courseId: ann.course_id, visibility: 'class' }
  }

  if (targetType === 'coursework') {
    const cw = await cwRepo.findById(targetId)
    if (!cw) throw HttpError.notFound('El trabajo no existe')
    await requireMembership(cw.course_id, user)
    return { courseId: cw.course_id, visibility: 'class', courseworkId: cw.id }
  }

  // Entrega: privado. Solo el dueño y el docente del curso.
  const submission = await subRepo.findById(targetId)
  if (!submission) throw HttpError.notFound('La entrega no existe')

  const cw = await cwRepo.findById(submission.coursework_id)
  if (!cw) throw HttpError.notFound('El trabajo no existe')

  const role = await requireMembership(cw.course_id, user)
  if (role !== 'teacher' && submission.student_id !== user.id) {
    throw HttpError.forbidden('Solo el alumno y su docente ven estos comentarios')
  }

  return {
    courseId: cw.course_id,
    visibility: 'private',
    studentId: submission.student_id,
    courseworkId: cw.id,
  }
}

export const listComments = async (
  targetType: CommentTarget,
  targetId: number,
  user: AuthPayload,
) => {
  const context = await resolveContext(targetType, targetId, user)
  return streamRepo.listComments(targetType, targetId, context.visibility)
}

export const createComment = async (
  targetType: CommentTarget,
  targetId: number,
  user: AuthPayload,
  body: string,
) => {
  const context = await resolveContext(targetType, targetId, user)

  const id = await streamRepo.createComment({
    targetType,
    targetId,
    authorId: user.id,
    body,
    visibility: context.visibility,
  })

  await notifyComment(context, targetType, user, body)

  const comments = await streamRepo.listComments(targetType, targetId, context.visibility)
  return comments.find((c) => c.id === id) ?? null
}

/** Avisa a quien corresponda segun el tipo de hilo. */
const notifyComment = async (
  context: CommentContext,
  targetType: CommentTarget,
  author: AuthPayload,
  body: string,
) => {
  const link = context.courseworkId
    ? `/courses/${context.courseId}/work/${context.courseworkId}`
    : `/courses/${context.courseId}`

  if (targetType === 'submission') {
    // Privado: el mensaje va a la otra parte, no a la clase.
    const target =
      author.id === context.studentId
        ? await courseRepo.findById(context.courseId).then((c) => c?.owner_id)
        : context.studentId

    if (target && target !== author.id) {
      await notificationRepo.notifyUser({
        userId: target,
        courseId: context.courseId,
        type: 'comment',
        title: 'Nuevo comentario privado',
        body: body.slice(0, 120),
        link,
      })
    }
    return
  }

  await notificationRepo.notifyCourseStudents({
    courseId: context.courseId,
    type: 'comment',
    title: 'Nuevo comentario en la clase',
    body: body.slice(0, 120),
    link,
    exceptUserId: author.id,
  })
}

/** Borra un comentario propio; el docente puede borrar los de su clase. */
export const removeComment = async (commentId: number, user: AuthPayload) => {
  const comment = await streamRepo.findComment(commentId)
  if (!comment) throw HttpError.notFound('El comentario no existe')

  if (comment.author_id !== user.id && user.role !== 'admin') {
    const context = await resolveContext(comment.target_type, comment.target_id, user)
    await requireTeacher(context.courseId, user)
  }

  await streamRepo.removeComment(commentId)
}

// Los adjuntos de tareas y entregas viven en attachmentService.ts
