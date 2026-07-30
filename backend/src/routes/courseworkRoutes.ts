import { Router } from 'express'
import * as cw from '../controllers/courseworkController.ts'
import * as attachment from '../controllers/attachmentController.ts'
import { authenticate } from '../middlewares/authenticate.ts'
import { validate } from '../middlewares/validate.ts'
import { singleDocument } from '../middlewares/upload.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import {
  createAttachmentSchema,
  gradeSchema,
  turnInSchema,
  updateCourseworkSchema,
} from '../validators/schemas.ts'

export const courseworkRoutes = Router()

courseworkRoutes.use(authenticate)

courseworkRoutes.get('/pending', asyncHandler(cw.pendingForMe))
courseworkRoutes.get('/to-review', asyncHandler(cw.toReview))
courseworkRoutes.get('/:id', asyncHandler(cw.detail))
courseworkRoutes.patch('/:id', validate(updateCourseworkSchema), asyncHandler(cw.update))
courseworkRoutes.post('/:id/publish', asyncHandler(cw.publish))
courseworkRoutes.post('/:id/unpublish', asyncHandler(cw.unpublish))
courseworkRoutes.delete('/:id', asyncHandler(cw.remove))

// Adjuntos de la tarea (docente)
courseworkRoutes.get('/:id/attachments', asyncHandler(attachment.list))
courseworkRoutes.post(
  '/:id/attachments',
  validate(createAttachmentSchema),
  asyncHandler(attachment.addLink),
)
courseworkRoutes.post('/:id/attachments/upload', singleDocument, asyncHandler(attachment.addFile))
courseworkRoutes.delete('/:id/attachments/:attachmentId', asyncHandler(attachment.remove))

// Archivos de la entrega (estudiante)
courseworkRoutes.post(
  '/:id/submission/files',
  singleDocument,
  asyncHandler(attachment.addSubmissionFile),
)
courseworkRoutes.delete(
  '/:id/submission/files/:attachmentId',
  asyncHandler(attachment.removeSubmissionFile),
)

// Entregas y calificacion
courseworkRoutes.post('/:id/turn-in', validate(turnInSchema), asyncHandler(cw.turnIn))
courseworkRoutes.post('/:id/reclaim', asyncHandler(cw.reclaim))
courseworkRoutes.post('/:id/draft-grade', validate(gradeSchema), asyncHandler(cw.saveDraftGrade))
courseworkRoutes.post('/:id/return-grade', validate(gradeSchema), asyncHandler(cw.returnGrade))
