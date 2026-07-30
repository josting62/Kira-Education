/** Tipos que reflejan las tablas de classroom_db. */

export type RoleSlug = 'admin' | 'teacher' | 'student' | 'guardian'
export type CourseRole = 'teacher' | 'student'
export type CourseStatus = 'active' | 'archived'
export type CourseworkType = 'assignment' | 'material' | 'question' | 'quiz'
export type CourseworkStatus = 'draft' | 'published'
export type SubmissionState = 'assigned' | 'turned_in' | 'returned' | 'reclaimed'
export type AttachmentOwner = 'coursework' | 'submission' | 'announcement'
export type AttachmentKind = 'link' | 'file' | 'drive' | 'youtube'
export type CommentTarget = 'announcement' | 'coursework' | 'submission'
export type BannerKind = 'color' | 'gallery' | 'upload'
export type NotificationType = 'coursework' | 'announcement' | 'grade' | 'comment' | 'enrollment'

export interface Role {
  id: number
  slug: RoleSlug
  name: string
  description: string | null
}

export interface User {
  id: number
  role_id: number
  role_slug: RoleSlug
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  bio: string | null
  phone: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export type ThemePreference = 'light' | 'dark' | 'system'

export interface UserSettings {
  user_id: number
  theme: ThemePreference
  density: 'comfortable' | 'compact'
  language: 'es' | 'en'
  notify_coursework: 0 | 1
  notify_announcements: 0 | 1
  notify_grades: 0 | 1
  show_archived: 0 | 1
}

export interface UserWithPassword extends User {
  password_hash: string
}

export interface Course {
  id: number
  name: string
  section: string | null
  subject: string | null
  room: string | null
  description: string | null
  owner_id: number
  owner_name: string
  class_code: string
  theme_color: string
  banner_kind: BannerKind
  banner_url: string | null
  status: CourseStatus
  created_at: string
  /** Rol del usuario autenticado dentro de este curso. */
  course_role?: CourseRole
}

export interface Topic {
  id: number
  course_id: number
  title: string
  position: number
}

export interface Coursework {
  id: number
  course_id: number
  topic_id: number | null
  topic_title: string | null
  author_id: number
  author_name: string
  type: CourseworkType
  title: string
  instructions: string | null
  max_points: number | null
  due_at: string | null
  status: CourseworkStatus
  published_at: string | null
  created_at: string
}

export interface Submission {
  id: number
  coursework_id: number
  student_id: number
  student_name: string
  state: SubmissionState
  answer_text: string | null
  submitted_at: string | null
  returned_at: string | null
  grade: number | null
  draft_grade: number | null
  is_late: 0 | 1
}

export interface Announcement {
  id: number
  course_id: number
  author_id: number
  author_name: string
  body: string
  created_at: string
}

export interface Attachment {
  id: number
  owner_type: AttachmentOwner
  owner_id: number
  kind: AttachmentKind
  title: string
  url: string
  mime_type: string | null
  size_bytes: number | null
}

export interface Comment {
  id: number
  target_type: CommentTarget
  target_id: number
  author_id: number
  author_name: string
  author_avatar: string | null
  body: string
  visibility: 'class' | 'private'
  created_at: string
}

export interface Notification {
  id: number
  user_id: number
  course_id: number | null
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

/** Payload que viaja dentro del JWT. */
export interface AuthPayload {
  id: number
  email: string
  role: RoleSlug
}
