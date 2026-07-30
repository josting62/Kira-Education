import type { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { HttpError } from '../utils/httpError.ts'

type Source = 'body' | 'query' | 'params'

/** Valida y normaliza una parte de la peticion con un esquema de Zod. */
export const validate =
  (schema: ZodType, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      return next(
        HttpError.badRequest(
          'Datos invalidos',
          result.error.issues.map((i) => ({ campo: i.path.join('.'), error: i.message })),
        ),
      )
    }
    Object.assign(req[source] as object, result.data)
    next()
  }
