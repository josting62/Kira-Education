import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../utils/httpError.ts'

interface Bucket {
  count: number
  /** Momento en que el contador vuelve a cero. */
  resetAt: number
}

/**
 * Limitador de intentos en memoria.
 *
 * Suficiente para un prototipo de un solo proceso: si algun dia hay varias
 * instancias hay que mover los contadores a Redis o a la base de datos.
 */
export const rateLimit = ({
  windowMs,
  max,
  message,
}: {
  windowMs: number
  max: number
  message: string
}) => {
  const buckets = new Map<string, Bucket>()

  // Limpieza periodica para que el mapa no crezca sin freno.
  const sweeper = setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
  }, windowMs)
  // No debe impedir que el proceso termine.
  sweeper.unref()

  return (req: Request, res: Response, next: NextFunction): void => {
    // La IP mas el correo: asi un atacante no bloquea a un usuario concreto
    // desde otra maquina, y probar muchos correos desde una IP tambien cuenta.
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''
    const key = `${req.ip ?? 'sin-ip'}|${email}`

    const now = Date.now()
    const bucket = buckets.get(key)

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      next()
      return
    }

    if (bucket.count >= max) {
      const seconds = Math.ceil((bucket.resetAt - now) / 1000)
      res.setHeader('Retry-After', String(seconds))
      next(new HttpError(429, `${message} Intenta de nuevo en ${seconds} s.`))
      return
    }

    bucket.count += 1
    forgetIfSuccessful(res, buckets, key)
    next()
  }
}

/**
 * Solo penalizamos los intentos FALLIDOS: si la contrasena era correcta el
 * contador se borra. Asi un usuario legitimo nunca se queda fuera por entrar
 * y salir varias veces, y la fuerza bruta (que solo produce fallos) si topa.
 */
const forgetIfSuccessful = (res: Response, buckets: Map<string, Bucket>, key: string) => {
  res.on('finish', () => {
    if (res.statusCode < 400) buckets.delete(key)
  })
}

/** 10 fallos por minuto y correo: molesto para un script, invisible para un humano. */
export const loginRateLimit = rateLimit({
  windowMs: 60_000,
  max: 10,
  message: 'Demasiados intentos fallidos de inicio de sesion.',
})
