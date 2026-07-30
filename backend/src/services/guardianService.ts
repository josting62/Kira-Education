import * as guardianRepo from '../repositories/guardianRepository.ts'
import * as userRepo from '../repositories/userRepository.ts'
import { HttpError } from '../utils/httpError.ts'
import type { AuthPayload } from '../types/models.ts'

/** Estudiantes vinculados al acudiente autenticado. */
export const myStudents = (user: AuthPayload) => guardianRepo.listStudents(user.id)

/**
 * Comprueba que el usuario puede ver los datos de ese estudiante.
 * Un admin puede ver a cualquiera; un acudiente solo a los suyos.
 */
const requireAccess = async (user: AuthPayload, studentId: number) => {
  if (user.role === 'admin') return
  if (user.role !== 'guardian') {
    throw HttpError.forbidden('Este panel es para acudientes')
  }
  if (!(await guardianRepo.isLinked(user.id, studentId))) {
    throw HttpError.forbidden('No eres acudiente de este estudiante')
  }
}

/** Resumen de solo lectura: clases, notas devueltas y pendientes. */
export const studentSummary = async (user: AuthPayload, studentId: number) => {
  await requireAccess(user, studentId)

  const student = await userRepo.findById(studentId)
  if (!student) throw HttpError.notFound('El estudiante no existe')

  const grades = await guardianRepo.studentGrades(studentId)
  const returned = grades.filter((row) => row.state === 'returned' && row.grade !== null)

  // Promedio sobre 100, solo con lo ya calificado.
  const percentages = returned
    .filter((row) => row.max_points !== null && row.max_points > 0)
    .map((row) => (Number(row.grade) / Number(row.max_points)) * 100)

  const average =
    percentages.length > 0
      ? Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 10) / 10
      : null

  return {
    student: {
      id: student.id,
      name: `${student.first_name} ${student.last_name}`,
      email: student.email,
      avatar_url: student.avatar_url,
    },
    courses: await guardianRepo.studentCourses(studentId),
    pending: await guardianRepo.studentPending(studentId),
    grades,
    stats: {
      courses: (await guardianRepo.studentCourses(studentId)).length,
      graded: returned.length,
      pending: (await guardianRepo.studentPending(studentId)).length,
      late: returned.filter((row) => row.is_late === 1).length,
      average,
    },
  }
}

// ---------- Administracion de vinculos ----------

export const listGuardiansOf = (studentId: number) => guardianRepo.listGuardians(studentId)

export const link = async (guardianId: number, studentId: number, relation?: string) => {
  const guardian = await userRepo.findById(guardianId)
  const student = await userRepo.findById(studentId)

  if (!guardian || !student) throw HttpError.notFound('Usuario no encontrado')
  if (guardian.role_slug !== 'guardian') {
    throw HttpError.badRequest('El primer usuario debe tener el rol Acudiente')
  }
  if (student.role_slug !== 'student') {
    throw HttpError.badRequest('El segundo usuario debe tener el rol Estudiante')
  }

  await guardianRepo.link(guardianId, studentId, relation ?? null)
  return guardianRepo.listGuardians(studentId)
}

export const unlink = async (guardianId: number, studentId: number) => {
  await guardianRepo.unlink(guardianId, studentId)
  return guardianRepo.listGuardians(studentId)
}
