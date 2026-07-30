import * as cwRepo from '../repositories/courseworkRepository.ts'
import * as subRepo from '../repositories/submissionRepository.ts'
import * as notificationRepo from '../repositories/notificationRepository.ts'
import { requireMembership, requireTeacher } from './courseService.ts'
import { HttpError } from '../utils/httpError.ts'
import type { AuthPayload } from '../types/models.ts'

const loadCoursework = async (courseworkId: number) => {
  const item = await cwRepo.findById(courseworkId)
  if (!item) throw HttpError.notFound('El trabajo no existe')
  return item
}

/** El estudiante entrega. Marca `is_late` si ya paso la fecha limite. */
export const turnIn = async (courseworkId: number, user: AuthPayload, answerText?: string) => {
  const item = await loadCoursework(courseworkId)
  const role = await requireMembership(item.course_id, user)
  if (role !== 'student') throw HttpError.forbidden('Solo los estudiantes pueden entregar')
  if (item.type === 'material') throw HttpError.badRequest('El material no se entrega')

  const isLate = item.due_at ? new Date() > new Date(item.due_at) : false
  await subRepo.turnIn(courseworkId, user.id, answerText ?? null, isLate)

  await notificationRepo.notifyUser({
    userId: item.author_id,
    courseId: item.course_id,
    type: 'coursework',
    title: `Entrega recibida: ${item.title}`,
    body: isLate ? 'Entregada con retraso' : 'Entregada a tiempo',
    link: `/courses/${item.course_id}/work/${courseworkId}`,
  })

  return subRepo.findOne(courseworkId, user.id)
}

/** El estudiante retira su entrega. */
export const reclaim = async (courseworkId: number, user: AuthPayload) => {
  const item = await loadCoursework(courseworkId)
  const role = await requireMembership(item.course_id, user)
  if (role !== 'student') throw HttpError.forbidden('Solo los estudiantes pueden retirar su entrega')

  const { affectedRows } = await subRepo.reclaim(courseworkId, user.id)
  if (affectedRows === 0) throw HttpError.badRequest('No hay una entrega activa para retirar')

  return subRepo.findOne(courseworkId, user.id)
}

const assertGradeInRange = (grade: number, maxPoints: number | null) => {
  if (grade < 0) throw HttpError.badRequest('La nota no puede ser negativa')
  if (maxPoints !== null && grade > Number(maxPoints)) {
    throw HttpError.badRequest(`La nota no puede superar ${maxPoints} puntos`)
  }
}

/** El docente guarda la nota como borrador (no visible al estudiante). */
export const saveDraftGrade = async (
  courseworkId: number,
  user: AuthPayload,
  studentId: number,
  grade: number,
) => {
  const item = await loadCoursework(courseworkId)
  await requireTeacher(item.course_id, user)
  assertGradeInRange(grade, item.max_points)

  await subRepo.saveDraftGrade(courseworkId, studentId, grade)
  return subRepo.findOne(courseworkId, studentId)
}

/** El docente devuelve la entrega y publica la nota. */
export const returnGrade = async (
  courseworkId: number,
  user: AuthPayload,
  studentId: number,
  grade: number,
) => {
  const item = await loadCoursework(courseworkId)
  await requireTeacher(item.course_id, user)
  assertGradeInRange(grade, item.max_points)

  await subRepo.returnGrade(courseworkId, studentId, grade)
  await notificationRepo.notifyUser({
    userId: studentId,
    courseId: item.course_id,
    type: 'grade',
    title: 'Calificacion publicada',
    body: `${item.title}: ${grade}/${item.max_points ?? '-'}`,
    link: `/courses/${item.course_id}/work/${courseworkId}`,
  })

  return subRepo.findOne(courseworkId, studentId)
}

export const gradebook = async (courseId: number, user: AuthPayload) => {
  await requireTeacher(courseId, user)
  return subRepo.gradebook(courseId)
}

/** Entregas recientes sin calificar en los cursos que dicta el usuario. */
export const toReview = (user: AuthPayload) => subRepo.listToReviewForTeacher(user.id)
