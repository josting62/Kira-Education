import * as courseRepo from '../repositories/courseRepository.ts'
import * as notificationRepo from '../repositories/notificationRepository.ts'
import { generateClassCode } from '../utils/classCode.ts'
import { HttpError } from '../utils/httpError.ts'
import type { AuthPayload, BannerKind, CourseRole, CourseStatus } from '../types/models.ts'

/** Colores de tema por defecto al crear una clase (tonos sobrios). */
const PALETTE = ['#4C5B8A', '#3F6B63', '#7A5C4B', '#5B6472', '#8C5F6E', '#5F6B45']

/**
 * Verifica que el usuario pertenezca al curso y devuelve su rol dentro de el.
 * El admin siempre puede entrar, como 'teacher'.
 */
export const requireMembership = async (
  courseId: number,
  user: AuthPayload,
): Promise<CourseRole> => {
  const course = await courseRepo.findById(courseId)
  if (!course) throw HttpError.notFound('El curso no existe')

  if (user.role === 'admin') return 'teacher'

  const enrollment = await courseRepo.findEnrollment(courseId, user.id)
  if (!enrollment) throw HttpError.forbidden('No perteneces a este curso')
  return enrollment.course_role
}

/** Igual que requireMembership pero exige rol de docente en el curso. */
export const requireTeacher = async (courseId: number, user: AuthPayload): Promise<void> => {
  const role = await requireMembership(courseId, user)
  if (role !== 'teacher') throw HttpError.forbidden('Solo el docente del curso puede hacer esto')
}

export const list = async (user: AuthPayload, status: CourseStatus = 'active') => {
  if (user.role === 'admin') return courseRepo.listAll(status)
  return courseRepo.listForUser(user.id, status)
}

export const detail = async (courseId: number, user: AuthPayload) => {
  const courseRole = await requireMembership(courseId, user)
  const course = await courseRepo.findById(courseId)
  return { ...course!, course_role: courseRole }
}

export const create = async (
  user: AuthPayload,
  data: {
    name: string
    section?: string
    subject?: string
    room?: string
    description?: string
    themeColor?: string
  },
) => {
  const themeColor = data.themeColor ?? PALETTE[Math.floor(Math.random() * PALETTE.length)]
  const classCode = await uniqueClassCode()

  const id = await courseRepo.create({ ...data, ownerId: user.id, classCode, themeColor })
  await courseRepo.enroll(id, user.id, 'teacher')
  return courseRepo.findById(id)
}

/** Genera un codigo de clase que no choque con uno existente. */
const uniqueClassCode = async (): Promise<string> => {
  let code = generateClassCode()
  for (let i = 0; i < 5 && (await courseRepo.findByCode(code)); i += 1) {
    code = generateClassCode()
  }
  return code
}

/** Duplica la clase con su trabajo en borrador, sin alumnos. */
export const copy = async (courseId: number, user: AuthPayload) => {
  await requireTeacher(courseId, user)
  const source = await courseRepo.findById(courseId)
  if (!source) throw HttpError.notFound('El curso no existe')

  const newId = await courseRepo.duplicate(
    courseId,
    user.id,
    `${source.name} (copia)`.slice(0, 120),
    await uniqueClassCode(),
  )
  return courseRepo.findById(newId)
}

/**
 * Traduce el cuerpo de la peticion (camelCase) a nombres de columna.
 * La lista blanca garantiza que solo estos campos lleguen al UPDATE.
 */
const COLUMN_MAP = {
  name: 'name',
  section: 'section',
  subject: 'subject',
  room: 'room',
  description: 'description',
  themeColor: 'theme_color',
} as const

export const update = async (
  courseId: number,
  user: AuthPayload,
  data: Record<string, string>,
) => {
  await requireTeacher(courseId, user)

  const columns: Record<string, string> = {}
  for (const [key, column] of Object.entries(COLUMN_MAP)) {
    if (data[key] !== undefined) columns[column] = data[key]
  }
  if (Object.keys(columns).length === 0) throw HttpError.badRequest('No hay nada que actualizar')

  await courseRepo.update(courseId, columns)
  return courseRepo.findById(courseId)
}

/**
 * Guarda la personalizacion del encabezado.
 *
 *   color   -> solo el color, se borra la imagen anterior
 *   gallery -> imagen de /banners/*.svg que sirve el frontend
 *   upload  -> imagen subida por el docente (ya guardada en /api/uploads)
 */
export const setBanner = async (
  courseId: number,
  user: AuthPayload,
  data: { themeColor?: string; bannerKind: BannerKind; bannerUrl?: string | null },
) => {
  await requireTeacher(courseId, user)
  const course = await courseRepo.findById(courseId)
  if (!course) throw HttpError.notFound('El curso no existe')

  const themeColor = data.themeColor ?? course.theme_color
  const bannerUrl = data.bannerKind === 'color' ? null : (data.bannerUrl ?? course.banner_url)

  if (data.bannerKind !== 'color' && !bannerUrl) {
    throw HttpError.badRequest('Falta la imagen del encabezado')
  }

  await courseRepo.setBanner(courseId, themeColor, data.bannerKind, bannerUrl)
  return courseRepo.findById(courseId)
}

export const archive = async (courseId: number, user: AuthPayload, status: CourseStatus) => {
  await requireTeacher(courseId, user)
  await courseRepo.setStatus(courseId, status)
  return courseRepo.findById(courseId)
}

export const remove = async (courseId: number, user: AuthPayload) => {
  const course = await courseRepo.findById(courseId)
  if (!course) throw HttpError.notFound('El curso no existe')
  if (user.role !== 'admin' && course.owner_id !== user.id) {
    throw HttpError.forbidden('Solo el propietario o un admin puede eliminar el curso')
  }
  await courseRepo.remove(courseId)
}

/** Un estudiante se une con el codigo de la clase. */
export const joinByCode = async (user: AuthPayload, code: string) => {
  const course = await courseRepo.findByCode(code.trim().toLowerCase())
  if (!course) throw HttpError.notFound('No existe una clase con ese codigo')
  if (course.status === 'archived') throw HttpError.badRequest('Esa clase esta archivada')

  const existing = await courseRepo.findEnrollment(course.id, user.id)
  if (existing) throw HttpError.conflict('Ya estas inscrito en esta clase')

  const role: CourseRole = user.role === 'teacher' ? 'teacher' : 'student'
  await courseRepo.enroll(course.id, user.id, role)

  await notificationRepo.notifyUser({
    userId: course.owner_id,
    courseId: course.id,
    type: 'enrollment',
    title: 'Nuevo integrante',
    body: `${user.email} se unio a ${course.name}`,
    link: `/courses/${course.id}/people`,
  })

  return course
}

export const members = async (courseId: number, user: AuthPayload) => {
  await requireMembership(courseId, user)
  const all = await courseRepo.listMembers(courseId)
  return {
    teachers: all.filter((m) => m.course_role === 'teacher'),
    students: all.filter((m) => m.course_role === 'student'),
  }
}

/** El propio usuario anula su inscripcion. El propietario no puede salir. */
export const leave = async (courseId: number, user: AuthPayload) => {
  const course = await courseRepo.findById(courseId)
  if (!course) throw HttpError.notFound('El curso no existe')
  if (course.owner_id === user.id) {
    throw HttpError.badRequest('Eres el propietario: archiva o elimina la clase en su lugar')
  }

  const { affectedRows } = await courseRepo.unenroll(courseId, user.id)
  if (affectedRows === 0) throw HttpError.badRequest('No estas inscrito en esta clase')
}

export const removeMember = async (courseId: number, user: AuthPayload, memberId: number) => {
  await requireTeacher(courseId, user)
  const course = await courseRepo.findById(courseId)
  if (course?.owner_id === memberId) {
    throw HttpError.badRequest('No se puede retirar al propietario del curso')
  }
  await courseRepo.unenroll(courseId, memberId)
}
