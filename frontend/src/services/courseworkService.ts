import { http } from './http'
import type { Attachment, Coursework, CourseworkType, Submission, Topic } from '@/types/models'

/** Una entrega vista por el docente, con los archivos del alumno. */
export type TeacherSubmission = Submission & { attachments: Attachment[] }

/** Vista del docente: incluye entregas, sus archivos y los contadores. */
export interface TeacherCourseworkDetail {
  coursework: Coursework
  attachments: Attachment[]
  submissions: TeacherSubmission[]
  stats: { turned_in: number; assigned: number; graded: number; total_students: number } | null
}

/** Vista del estudiante: solo su propia entrega y sus archivos. */
export interface StudentCourseworkDetail {
  coursework: Coursework
  attachments: Attachment[]
  submission: Submission | null
  submissionAttachments: Attachment[]
}

export type CourseworkDetail = TeacherCourseworkDetail | StudentCourseworkDetail

export const isTeacherDetail = (d: CourseworkDetail): d is TeacherCourseworkDetail =>
  'submissions' in d

export const getCourseworkDetail = (id: number) =>
  http.get<CourseworkDetail>(`/coursework/${id}`)

export const createCoursework = (
  courseId: number,
  data: {
    type: CourseworkType
    title: string
    instructions?: string
    maxPoints?: number
    dueAt?: string
    topicId?: number
    status?: 'draft' | 'published'
  },
) => http.post<Coursework>(`/courses/${courseId}/coursework`, data)

export const publishCoursework = (id: number) =>
  http.post<Coursework>(`/coursework/${id}/publish`)

export const deleteCoursework = (id: number) => http.delete<null>(`/coursework/${id}`)

export const turnIn = (id: number, answerText?: string) =>
  http.post<Submission>(`/coursework/${id}/turn-in`, { answerText })

export const reclaim = (id: number) => http.post<Submission>(`/coursework/${id}/reclaim`)

/** Guarda la nota sin devolverla: solo la ve el docente. */
export const saveDraftGrade = (id: number, studentId: number, grade: number) =>
  http.post<Submission>(`/coursework/${id}/draft-grade`, { studentId, grade })

export const returnGrade = (id: number, studentId: number, grade: number) =>
  http.post<Submission>(`/coursework/${id}/return-grade`, { studentId, grade })

// ---------- Editar / despublicar ----------

export const updateCoursework = (
  id: number,
  data: {
    title?: string
    instructions?: string | null
    maxPoints?: number | null
    dueAt?: string | null
    topicId?: number | null
  },
) => http.patch<Coursework>(`/coursework/${id}`, data)

/** Vuelve el trabajo a borrador: deja de verse en el tablon. */
export const unpublishCoursework = (id: number) =>
  http.post<Coursework>(`/coursework/${id}/unpublish`)

// ---------- Reutilizar publicacion ----------

export interface ReusableCoursework {
  id: number
  title: string
  type: CourseworkType
  max_points: number | null
  course_id: number
  course_name: string
  attachment_count: number
}

export const listReusable = (courseId: number) =>
  http.get<ReusableCoursework[]>(`/courses/${courseId}/reusable`)

export const reuseCoursework = (courseId: number, sourceId: number, topicId?: number | null) =>
  http.post<Coursework>(`/courses/${courseId}/reuse`, { sourceId, topicId: topicId ?? null })

// ---------- Temas ----------

export const listTopics = (courseId: number) =>
  http.get<Topic[]>(`/courses/${courseId}/topics`)

export const createTopic = (courseId: number, title: string) =>
  http.post<Topic>(`/courses/${courseId}/topics`, { title })

export const renameTopic = (courseId: number, topicId: number, title: string) =>
  http.patch<Topic>(`/courses/${courseId}/topics/${topicId}`, { title })

/** Guarda el orden completo; el backend valida que esten todos. */
export const reorderTopics = (courseId: number, order: number[]) =>
  http.patch<Topic[]>(`/courses/${courseId}/topics/reorder`, { order })

export const deleteTopic = (courseId: number, topicId: number) =>
  http.delete<null>(`/courses/${courseId}/topics/${topicId}`)

// ---------- Adjuntos de la tarea (docente) ----------

export const addAttachmentLink = (
  courseworkId: number,
  data: { kind: 'link' | 'drive' | 'youtube'; title: string; url: string },
) => http.post<Attachment>(`/coursework/${courseworkId}/attachments`, data)

export const uploadAttachment = (courseworkId: number, file: File) =>
  http.upload<Attachment>(`/coursework/${courseworkId}/attachments/upload`, file, {}, 'file')

export const deleteAttachment = (courseworkId: number, attachmentId: number) =>
  http.delete<null>(`/coursework/${courseworkId}/attachments/${attachmentId}`)

// ---------- Archivos de la entrega (estudiante) ----------

export const uploadSubmissionFile = (courseworkId: number, file: File) =>
  http.upload<Attachment>(`/coursework/${courseworkId}/submission/files`, file, {}, 'file')

export const deleteSubmissionFile = (courseworkId: number, attachmentId: number) =>
  http.delete<null>(`/coursework/${courseworkId}/submission/files/${attachmentId}`)
