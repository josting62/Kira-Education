import { http } from './http'
import type {
  BannerKind,
  Course,
  CourseMembers,
  CourseStatus,
  Coursework,
  PendingWork,
  StreamEntry,
  Topic,
} from '@/types/models'

export const listCourses = (status: CourseStatus = 'active') =>
  http.get<Course[]>(`/courses?status=${status}`)

export const getCourse = (id: number) => http.get<Course>(`/courses/${id}`)

export const createCourse = (data: {
  name: string
  section?: string
  subject?: string
  room?: string
}) => http.post<Course>('/courses', data)

export const updateCourse = (
  id: number,
  data: {
    name?: string
    section?: string
    subject?: string
    room?: string
    description?: string
    themeColor?: string
  },
) => http.patch<Course>(`/courses/${id}`, data)

export const copyCourse = (id: number) => http.post<Course>(`/courses/${id}/copy`)

/** Guarda color / imagen de galeria del encabezado. */
export const setBanner = (
  id: number,
  data: { bannerKind: BannerKind; themeColor?: string; bannerUrl?: string | null },
) => http.patch<Course>(`/courses/${id}/banner`, data)

/** Sube una imagen y la aplica como encabezado en una sola peticion. */
export const uploadBanner = (id: number, file: File, themeColor?: string) =>
  http.upload<Course>(
    `/courses/${id}/banner/upload`,
    file,
    themeColor ? { themeColor } : {},
  )

export const joinCourse = (code: string) => http.post<Course>('/courses/join', { code })

export const archiveCourse = (id: number, status: CourseStatus) =>
  http.patch<Course>(`/courses/${id}/status`, { status })

export const deleteCourse = (id: number) => http.delete<null>(`/courses/${id}`)

export const leaveCourse = (id: number) => http.post<null>(`/courses/${id}/leave`)

export interface ToReviewRow {
  course_id: number
  course_name: string
  coursework_id: number
  coursework_title: string
  student_id: number
  student_name: string
  submitted_at: string
  is_late: 0 | 1
}

/** Entregas recientes sin calificar en los cursos que dicta el usuario. */
export const getToReview = () => http.get<ToReviewRow[]>('/coursework/to-review')

export const getStream = (id: number) =>
  http.get<{ entries: StreamEntry[] }>(`/courses/${id}/stream`)

export const createAnnouncement = (id: number, body: string) =>
  http.post<unknown>(`/courses/${id}/announcements`, { body })

export const getMembers = (id: number) => http.get<CourseMembers>(`/courses/${id}/members`)

export const removeMember = (id: number, memberId: number) =>
  http.delete<null>(`/courses/${id}/members/${memberId}`)

export const getCoursework = (id: number) =>
  http.get<{ items: Coursework[]; topics: Topic[] }>(`/courses/${id}/coursework`)

export const getPendingWork = () => http.get<PendingWork[]>('/coursework/pending')

export interface GradebookRow {
  coursework_id: number
  coursework_title: string
  max_points: number | null
  due_at: string | null
  student_id: number
  student_name: string
  state: string
  grade: number | null
  is_late: 0 | 1
}

export const getGradebook = (id: number) => http.get<GradebookRow[]>(`/courses/${id}/gradebook`)
