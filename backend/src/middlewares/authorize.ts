import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../utils/httpError.ts'
import type { RoleSlug } from '../types/models.ts'

/**
 * Restringe una ruta a ciertos roles globales.
 * Ej: router.post('/', authenticate, authorize('teacher', 'admin'), handler)
 */
export const authorize =
  (...roles: RoleSlug[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(HttpError.unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(HttpError.forbidden(`Esta accion requiere el rol: ${roles.join(' o ')}`))
    }
    next()
  }
