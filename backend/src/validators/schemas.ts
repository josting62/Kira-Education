import { z } from 'zod'

const id = z.coerce.number().int().positive()

export const idParam = z.object({ id })
export const courseIdParam = z.object({ courseId: id })
export const courseworkIdParam = z.object({ courseworkId: id })

// ---------- Auth ----------

export const loginSchema = z.object({
  email: z.string().email('Correo invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
})

export const registerSchema = z.object({
  firstName: z.string().min(2, 'Minimo 2 caracteres').max(60),
  lastName: z.string().min(2, 'Minimo 2 caracteres').max(60),
  email: z.string().email('Correo invalido').max(120),
  password: z.string().min(6, 'Minimo 6 caracteres').max(72),
  role: z.enum(['teacher', 'student', 'guardian']),
})

// ---------- Cursos ----------

export const createCourseSchema = z.object({
  name: z.string().min(3, 'Minimo 3 caracteres').max(120),
  section: z.string().max(80).optional(),
  subject: z.string().max(80).optional(),
  room: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  themeColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hex').optional(),
})

export const updateCourseSchema = createCourseSchema.partial()

export const joinCourseSchema = z.object({
  code: z.string().length(8, 'El codigo tiene 8 caracteres'),
})

export const archiveCourseSchema = z.object({
  status: z.enum(['active', 'archived']),
})

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Debe ser un color hex tipo #4C5B8A')

export const setBannerSchema = z
  .object({
    bannerKind: z.enum(['color', 'gallery', 'upload']),
    themeColor: hexColor.optional(),
    // Solo rutas internas: /banners/... o /api/uploads/...
    bannerUrl: z
      .string()
      .regex(/^\/(banners|api\/uploads)\/[\w.-]+$/, 'Ruta de imagen no valida')
      .nullable()
      .optional(),
  })
  .refine((data) => data.bannerKind === 'color' || Boolean(data.bannerUrl), {
    message: 'Falta la imagen del encabezado',
    path: ['bannerUrl'],
  })

// ---------- Perfil y ajustes ----------

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Minimo 2 caracteres').max(60).optional(),
  lastName: z.string().min(2, 'Minimo 2 caracteres').max(60).optional(),
  bio: z.string().max(280).optional(),
  phone: z.string().max(30).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Minimo 6 caracteres'),
  newPassword: z.string().min(6, 'Minimo 6 caracteres').max(72),
})

export const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  density: z.enum(['comfortable', 'compact']).optional(),
  language: z.enum(['es', 'en']).optional(),
  notifyCoursework: z.boolean().optional(),
  notifyAnnouncements: z.boolean().optional(),
  notifyGrades: z.boolean().optional(),
  showArchived: z.boolean().optional(),
})

// ---------- Administracion ----------

export const createUserSchema = z.object({
  firstName: z.string().min(2, 'Minimo 2 caracteres').max(60),
  lastName: z.string().min(2, 'Minimo 2 caracteres').max(60),
  email: z.string().email('Correo invalido').max(120),
  password: z.string().min(6, 'Minimo 6 caracteres').max(72),
  role: z.enum(['admin', 'teacher', 'student', 'guardian']),
})

export const setRoleSchema = z.object({
  role: z.enum(['admin', 'teacher', 'student', 'guardian']),
})

export const setStatusSchema = z.object({
  status: z.enum(['active', 'inactive']),
})

export const linkGuardianSchema = z.object({
  guardianId: id,
  studentId: id,
  relation: z.string().max(40).optional(),
})

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Minimo 6 caracteres').max(72),
})

// ---------- Trabajo en clase ----------

export const createCourseworkSchema = z.object({
  type: z.enum(['assignment', 'material', 'question', 'quiz']),
  title: z.string().min(3, 'Minimo 3 caracteres').max(160),
  instructions: z.string().max(5000).optional(),
  maxPoints: z.coerce.number().min(0).max(1000).optional(),
  dueAt: z.string().datetime({ offset: true }).optional(),
  topicId: id.optional(),
  status: z.enum(['draft', 'published']).optional(),
})

export const updateCourseworkSchema = z.object({
  title: z.string().min(3).max(160).optional(),
  instructions: z.string().max(5000).nullable().optional(),
  max_points: z.coerce.number().min(0).max(1000).nullable().optional(),
  due_at: z.string().nullable().optional(),
  topic_id: id.nullable().optional(),
})

export const createTopicSchema = z.object({
  title: z.string().min(2, 'Minimo 2 caracteres').max(120),
})

// ---------- Entregas ----------

export const turnInSchema = z.object({
  answerText: z.string().max(5000).optional(),
})

export const gradeSchema = z.object({
  studentId: id,
  grade: z.coerce.number().min(0).max(1000),
})

// ---------- Tablon ----------

export const createAnnouncementSchema = z.object({
  body: z.string().min(1, 'Escribe algo').max(3000),
})

export const createCommentSchema = z.object({
  // 'submission' son los comentarios privados entre el alumno y su docente.
  targetType: z.enum(['announcement', 'coursework', 'submission']),
  targetId: id,
  body: z.string().min(1, 'Escribe algo').max(2000),
})

export const renameTopicSchema = z.object({
  title: z.string().min(2, 'Minimo 2 caracteres').max(120),
})

export const reorderTopicsSchema = z.object({
  order: z.array(id).min(1, 'Manda al menos un tema'),
})

export const reuseCourseworkSchema = z.object({
  sourceId: id,
  topicId: id.nullable().optional(),
})

export const createAttachmentSchema = z.object({
  kind: z.enum(['link', 'drive', 'youtube']),
  title: z.string().min(1).max(180),
  url: z.string().url('URL invalida').max(500),
})
