import { http } from './http'
import type { CourseworkType, SubmissionState } from '@/types/models'

export interface GuardianStudent {
  id: number
  student_id: number
  student_name: string
  student_email: string
  student_avatar: string | null
  relation: string | null
}

export interface GuardianGradeRow {
  course_id: number
  course_name: string
  coursework_id: number
  coursework_title: string
  max_points: number | null
  grade: number | null
  state: SubmissionState
  is_late: 0 | 1
  due_at: string | null
}

export interface GuardianSummary {
  student: { id: number; name: string; email: string; avatar_url: string | null }
  courses: {
    id: number
    name: string
    section: string | null
    theme_color: string
    owner_name: string
  }[]
  pending: {
    course_id: number
    course_name: string
    coursework_id: number
    coursework_title: string
    due_at: string | null
  }[]
  grades: GuardianGradeRow[]
  stats: {
    courses: number
    graded: number
    pending: number
    late: number
    /** Promedio sobre 100, o null si aun no hay nada calificado. */
    average: number | null
  }
}

export interface GuardianLink {
  id: number
  guardian_id: number
  guardian_name: string
  guardian_email: string
  relation: string | null
}

export const myStudents = () => http.get<GuardianStudent[]>('/guardian/me/students')

export const getStudentSummary = (studentId: number) =>
  http.get<GuardianSummary>(`/guardian/students/${studentId}`)

// ---------- Administracion de vinculos ----------

export const listGuardiansOf = (studentId: number) =>
  http.get<GuardianLink[]>(`/guardian/students/${studentId}/guardians`)

export const linkGuardian = (guardianId: number, studentId: number, relation?: string) =>
  http.post<GuardianLink[]>('/guardian/links', { guardianId, studentId, relation })

export const unlinkGuardian = (guardianId: number, studentId: number) =>
  http.delete<GuardianLink[]>(`/guardian/links/${guardianId}/${studentId}`)

export type { CourseworkType }
