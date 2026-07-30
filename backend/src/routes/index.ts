import { Router } from 'express'
import { authRoutes } from './authRoutes.ts'
import { userRoutes } from './userRoutes.ts'
import { adminRoutes } from './adminRoutes.ts'
import { guardianRoutes } from './guardianRoutes.ts'
import { courseRoutes } from './courseRoutes.ts'
import { courseworkRoutes } from './courseworkRoutes.ts'
import * as calendar from '../controllers/calendarController.ts'
import * as comment from '../controllers/commentController.ts'
import * as notification from '../controllers/notificationController.ts'
import { authenticate } from '../middlewares/authenticate.ts'
import { validate } from '../middlewares/validate.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import { createCommentSchema } from '../validators/schemas.ts'
import { verifyConnection } from '../database/connection.ts'

export const apiRoutes = Router()

apiRoutes.get(
  '/health',
  asyncHandler(async (_req, res) => {
    await verifyConnection()
    res.json({ ok: true, message: 'API y MySQL operativos' })
  }),
)

apiRoutes.use('/auth', authRoutes)
apiRoutes.use('/users', userRoutes)
apiRoutes.use('/admin', adminRoutes)
apiRoutes.use('/guardian', guardianRoutes)
apiRoutes.use('/courses', courseRoutes)
apiRoutes.use('/coursework', courseworkRoutes)

apiRoutes.get('/calendar', authenticate, asyncHandler(calendar.month))

apiRoutes.get('/comments/:targetType/:targetId', authenticate, asyncHandler(comment.list))
apiRoutes.post('/comments', authenticate, validate(createCommentSchema), asyncHandler(comment.create))
apiRoutes.delete('/comments/:id', authenticate, asyncHandler(comment.remove))

apiRoutes.get('/notifications', authenticate, asyncHandler(notification.list))
apiRoutes.patch('/notifications/read-all', authenticate, asyncHandler(notification.markAllAsRead))
apiRoutes.patch('/notifications/:id/read', authenticate, asyncHandler(notification.markAsRead))
