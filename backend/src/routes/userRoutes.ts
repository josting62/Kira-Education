import { Router } from 'express'
import * as user from '../controllers/userController.ts'
import { authenticate } from '../middlewares/authenticate.ts'
import { validate } from '../middlewares/validate.ts'
import { singleImage } from '../middlewares/upload.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import {
  changePasswordSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from '../validators/schemas.ts'

export const userRoutes = Router()

userRoutes.use(authenticate)

// Perfil
userRoutes.get('/me', asyncHandler(user.profile))
userRoutes.patch('/me', validate(updateProfileSchema), asyncHandler(user.updateProfile))
userRoutes.post(
  '/me/password',
  validate(changePasswordSchema),
  asyncHandler(user.changePassword),
)
userRoutes.post('/me/avatar', singleImage, asyncHandler(user.setAvatar))
userRoutes.delete('/me/avatar', asyncHandler(user.removeAvatar))

// Ajustes
userRoutes.get('/me/settings', asyncHandler(user.settings))
userRoutes.patch('/me/settings', validate(updateSettingsSchema), asyncHandler(user.updateSettings))
