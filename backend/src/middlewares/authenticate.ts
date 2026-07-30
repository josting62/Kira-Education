import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../utils/httpError.ts'
import { verifyToken } from '../utils/token.ts'
import type { AuthPayload } from '../types/models.ts'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

/** Exige un JWT valido en la cookie `token` o en el header Authorization. */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined
  const token = bearer ?? (req.cookies?.token as string | undefined)

  if (!token) return next(HttpError.unauthorized('Inicia sesion para continuar'))

  try {
    req.user = verifyToken(token)
    next()
  } catch {
    next(HttpError.unauthorized('Sesion expirada o token invalido'))
  }
}
