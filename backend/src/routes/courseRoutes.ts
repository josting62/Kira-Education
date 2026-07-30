import { Router } from 'express'
import * as course from '../controllers/courseController.ts'
import * as cw from '../controllers/courseworkController.ts'
import { authenticate } from '../middlewares/authenticate.ts'
import { authorize } from '../middlewares/authorize.ts'
import { validate } from '../middlewares/validate.ts'
import { singleImage } from '../middlewares/upload.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import {
  archiveCourseSchema,
  renameTopicSchema,
  reorderTopicsSchema,
  reuseCourseworkSchema,
  setBannerSchema,
  createAnnouncementSchema,
  createCourseSchema,
  createCourseworkSchema,
  createTopicSchema,
  joinCourseSchema,
  updateCourseSchema,
} from '../validators/schemas.ts'

export const courseRoutes = Router()

courseRoutes.use(authenticate)

// Cursos
courseRoutes.get('/', asyncHandler(course.list))
courseRoutes.post(
  '/',
  authorize('teacher', 'admin'),
  validate(createCourseSchema),
  asyncHandler(course.create),
)
courseRoutes.post('/join', validate(joinCourseSchema), asyncHandler(course.join))
courseRoutes.get('/:id', asyncHandler(course.detail))
courseRoutes.patch('/:id', validate(updateCourseSchema), asyncHandler(course.update))
courseRoutes.post('/:id/copy', authorize('teacher', 'admin'), asyncHandler(course.copy))

// Personalizacion del encabezado
courseRoutes.patch('/:id/banner', validate(setBannerSchema), asyncHandler(course.setBanner))
courseRoutes.post('/:id/banner/upload', singleImage, asyncHandler(course.uploadBanner))

courseRoutes.patch('/:id/status', validate(archiveCourseSchema), asyncHandler(course.archive))
courseRoutes.delete('/:id', asyncHandler(course.remove))

// Integrantes
courseRoutes.post('/:id/leave', asyncHandler(course.leave))
courseRoutes.get('/:id/members', asyncHandler(course.members))
courseRoutes.delete('/:id/members/:memberId', asyncHandler(course.removeMember))

// Tablon de novedades
courseRoutes.get('/:id/stream', asyncHandler(course.stream))
courseRoutes.post(
  '/:id/announcements',
  validate(createAnnouncementSchema),
  asyncHandler(course.createAnnouncement),
)

// Trabajo en clase (anidado bajo el curso)
courseRoutes.get('/:courseId/coursework', asyncHandler(cw.listByCourse))
courseRoutes.post(
  '/:courseId/coursework',
  validate(createCourseworkSchema),
  asyncHandler(cw.create),
)
courseRoutes.get('/:courseId/gradebook', asyncHandler(cw.gradebook))
courseRoutes.get('/:courseId/gradebook.csv', asyncHandler(cw.gradebookCsv))

// Reutilizar publicacion de otra clase del mismo docente
courseRoutes.get('/:courseId/reusable', asyncHandler(cw.listReusable))
courseRoutes.post(
  '/:courseId/reuse',
  validate(reuseCourseworkSchema),
  asyncHandler(cw.reuse),
)

// Temas
courseRoutes.get('/:courseId/topics', asyncHandler(cw.listTopics))
courseRoutes.post('/:courseId/topics', validate(createTopicSchema), asyncHandler(cw.createTopic))
courseRoutes.patch(
  '/:courseId/topics/reorder',
  validate(reorderTopicsSchema),
  asyncHandler(cw.reorderTopics),
)
courseRoutes.patch(
  '/:courseId/topics/:topicId',
  validate(renameTopicSchema),
  asyncHandler(cw.renameTopic),
)
courseRoutes.delete('/:courseId/topics/:topicId', asyncHandler(cw.removeTopic))
