import type { NextFunction, Request, RequestHandler, Response } from 'express'

/** Envuelve un handler async y reenvia cualquier rechazo al middleware de errores. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    void fn(req, res, next).catch(next)
  }
