/** Espejo de los tipos del backend (backend/src/types/models.ts). */

export type RoleSlug = 'admin' | 'teacher' | 'student' | 'guardian'
export type CourseRole = 'teacher' | 'student'
export type CourseStatus = 'active' | 'archived'
export type CourseworkType = 'assignment' | 'material' | 'question' | 'quiz'
export type CourseworkStatus = 'draft' | 'published'
export type SubmissionState = 'assigned' | 'turned_in' | 'returned' | 'reclaimed'
export type BannerKind = 'color' | 'gallery' | 'upload'

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

export interface Role {
  id: number
  slug: RoleSlug
  name: string
  description: string | null
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

export interface AdminStats {
  users: number
  teachers: number
  students: number
  inactive: number
  courses: number
  archived: number
  coursework: number
  submissions: number
}

export interface CalendarEntry {
  coursework_id: number
  title: string
  type: CourseworkType
  due_at: string
  course_id: number
  course_name: string
  theme_color: string
  my_state: SubmissionState | null
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

export type AttachmentKind = 'link' | 'file' | 'drive' | 'youtube'

export interface Attachment {
  id: number
  owner_type: 'coursework' | 'submission' | 'announcement'
  owner_id: number
  kind: AttachmentKind
  title: string
  url: string
  mime_type: string | null
  size_bytes: number | null
}

export type CommentTarget = 'announcement' | 'coursework' | 'submission'

export interface Comment {
  id: number
  author_id: number
  author_name: string
  author_avatar?: string | null
  body: string
  visibility: 'class' | 'private'
  created_at: string
}

export interface Notification {
  id: number
  course_id: number | null
  type: 'coursework' | 'announcement' | 'grade' | 'comment' | 'enrollment'
  title: string
  body: string | null
  link: string | null
  read_at: string | null
  created_at: string
}

export interface PendingWork {
  course_id: number
  course_name: string
  coursework_id: number
  coursework_title: string
  due_at: string | null
}

export type StreamEntry =
  | {
      kind: 'announcement'
      id: number
      author_name: string
      created_at: string
      body: string
    }
  | {
      kind: 'coursework'
      id: number
      author_name: string
      created_at: string
      type: CourseworkType
      title: string
      due_at: string | null
    }

export interface CourseMembers {
  teachers: (User & { course_role: CourseRole })[]
  students: (User & { course_role: CourseRole })[]
}
