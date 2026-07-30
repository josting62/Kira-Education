import { Router } from 'express'
import * as admin from '../controllers/adminController.ts'
import { authenticate } from '../middlewares/authenticate.ts'
import { authorize } from '../middlewares/authorize.ts'
import { validate } from '../middlewares/validate.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import {
  createUserSchema,
  resetPasswordSchema,
  setRoleSchema,
  setStatusSchema,
} from '../validators/schemas.ts'

export const adminRoutes = Router()

// Todo el modulo requiere rol admin.
adminRoutes.use(authenticate, authorize('admin'))

adminRoutes.get('/overview', asyncHandler(admin.overview))
adminRoutes.get('/courses', asyncHandler(admin.listCourses))

adminRoutes.get('/users', asyncHandler(admin.listUsers))
adminRoutes.post('/users', validate(createUserSchema), asyncHandler(admin.createUser))
adminRoutes.patch('/users/:id/role', validate(setRoleSchema), asyncHandler(admin.setUserRole))
adminRoutes.patch('/users/:id/status', validate(setStatusSchema), asyncHandler(admin.setUserStatus))
adminRoutes.post(
  '/users/:id/password',
  validate(resetPasswordSchema),
  asyncHandler(admin.resetPassword),
)
