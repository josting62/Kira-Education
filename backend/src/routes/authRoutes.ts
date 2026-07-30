import { Router } from 'express'
import * as controller from '../controllers/authController.ts'
import { authenticate } from '../middlewares/authenticate.ts'
import { validate } from '../middlewares/validate.ts'
import { loginRateLimit } from '../middlewares/rateLimit.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import { loginSchema, registerSchema } from '../validators/schemas.ts'

export const authRoutes = Router()

// El limitador va primero: no gastamos un bcrypt por cada intento.
authRoutes.post(
  '/login',
  loginRateLimit,
  validate(loginSchema),
  asyncHandler(controller.login),
)
authRoutes.post(
  '/register',
  loginRateLimit,
  validate(registerSchema),
  asyncHandler(controller.register),
)
authRoutes.post('/logout', asyncHandler(controller.logout))
authRoutes.get('/me', authenticate, asyncHandler(controller.me))
authRoutes.get('/roles', asyncHandler(controller.roles))
