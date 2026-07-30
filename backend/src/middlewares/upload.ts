import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { MulterError } from 'multer'
import { uploadDocument, uploadImage } from '../config/uploads.ts'
import { HttpError } from '../utils/httpError.ts'

/** Envuelve multer para traducir sus errores al formato de la API. */
const wrap = (
  handler: RequestHandler,
  what: string,
  limitMessage: string,
): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (error: unknown) => {
      if (error instanceof MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') return next(HttpError.badRequest(limitMessage))
        return next(HttpError.badRequest(`No se pudo subir el ${what}: ${error.message}`))
      }
      if (error) return next(error)
      if (!req.file) return next(HttpError.badRequest(`No se recibio ningun ${what}`))
      next()
    })
  }

/** Sube una imagen (campo `image`). Deja el archivo en `req.file`. */
export const singleImage = wrap(
  uploadImage,
  'archivo',
  'La imagen supera el limite de 4 MB',
)

/** Sube un documento o imagen (campo `file`). Deja el archivo en `req.file`. */
export const singleDocument = wrap(
  uploadDocument,
  'archivo',
  'El archivo supera el limite de 15 MB',
)
