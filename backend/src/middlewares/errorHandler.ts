import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../utils/httpError.ts'
import { env } from '../config/env.ts'

/** 404 para rutas no registradas. */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`))
}

/** Traduce cualquier error a una respuesta JSON uniforme. */
export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ ok: false, message: error.message, details: error.details })
    return
  }

  const err = error as { code?: string; message?: string }

  if (err.code === 'ER_DUP_ENTRY') {
    res.status(409).json({ ok: false, message: 'Ese registro ya existe' })
    return
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    res.status(409).json({ ok: false, message: 'Conflicto de referencia entre tablas' })
    return
  }
  if (err.code === 'ECONNREFUSED') {
    res.status(503).json({
      ok: false,
      message: 'No hay conexion con MySQL. Verifica que XAMPP este iniciado.',
    })
    return
  }

  console.error('[error]', error)
  res.status(500).json({
    ok: false,
    message: 'Error interno del servidor',
    details: env.nodeEnv === 'development' ? err.message : undefined,
  })
}
