import type { Request, Response } from 'express'
import * as authService from '../services/authService.ts'
import * as userRepo from '../repositories/userRepository.ts'
import { env } from '../config/env.ts'

const COOKIE = 'token'

/** El token: no accesible desde JS. */
const tokenCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: env.nodeEnv === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

/**
 * Marca legible por el frontend. No da acceso a nada: solo le dice a la SPA
 * que existe una sesion, para no pedir /auth/me (y provocar un 401 en la
 * consola) cuando nadie ha iniciado sesion.
 */
const FLAG_COOKIE = 'has_session'
const flagCookie = { ...tokenCookie, httpOnly: false }

const withSession = (res: Response, token: string) =>
  res.cookie(COOKIE, token, tokenCookie).cookie(FLAG_COOKIE, '1', flagCookie)

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body
  const { user, token } = await authService.login(email, password)
  withSession(res, token).json({ ok: true, data: { user, token } })
}

export const register = async (req: Request, res: Response) => {
  const { user, token } = await authService.register(req.body)
  withSession(res, token).status(201).json({ ok: true, data: { user, token } })
}

export const logout = async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE).clearCookie(FLAG_COOKIE).json({ ok: true, message: 'Sesion cerrada' })
}

export const me = async (req: Request, res: Response) => {
  const user = await authService.me(req.user!.id)
  res.json({ ok: true, data: user })
}

export const roles = async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await userRepo.listRoles() })
}
