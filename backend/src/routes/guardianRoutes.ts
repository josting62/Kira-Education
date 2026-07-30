import { Router } from 'express'
import * as guardian from '../controllers/guardianController.ts'
import { authenticate } from '../middlewares/authenticate.ts'
import { authorize } from '../middlewares/authorize.ts'
import { validate } from '../middlewares/validate.ts'
import { asyncHandler } from '../utils/asyncHandler.ts'
import { linkGuardianSchema } from '../validators/schemas.ts'

export const guardianRoutes = Router()

guardianRoutes.use(authenticate)

// El propio acudiente (y el admin, para poder revisar).
guardianRoutes.get('/me/students', authorize('guardian', 'admin'), asyncHandler(guardian.myStudents))
guardianRoutes.get(
  '/students/:studentId',
  authorize('guardian', 'admin'),
  asyncHandler(guardian.studentSummary),
)

// Gestion de vinculos: solo administracion.
guardianRoutes.get(
  '/students/:studentId/guardians',
  authorize('admin'),
  asyncHandler(guardian.listGuardiansOf),
)
guardianRoutes.post(
  '/links',
  authorize('admin'),
  validate(linkGuardianSchema),
  asyncHandler(guardian.link),
)
guardianRoutes.delete(
  '/links/:guardianId/:studentId',
  authorize('admin'),
  asyncHandler(guardian.unlink),
)
