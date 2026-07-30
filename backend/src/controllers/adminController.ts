import type { Request, Response } from 'express'
import * as userService from '../services/userService.ts'
import * as courseService from '../services/courseService.ts'
import type { CourseStatus } from '../types/models.ts'

export const overview = async (_req: Request, res: Response) => {
  res.json({ ok: true, data: await userService.overview() })
}

export const listUsers = async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined
  res.json({ ok: true, data: await userService.listUsers(search) })
}

export const createUser = async (req: Request, res: Response) => {
  res.status(201).json({ ok: true, data: await userService.createUser(req.body) })
}

export const setUserRole = async (req: Request, res: Response) => {
  const data = await userService.setUserRole(req.user!, Number(req.params.id), req.body.role)
  res.json({ ok: true, data })
}

export const setUserStatus = async (req: Request, res: Response) => {
  const data = await userService.setUserStatus(req.user!, Number(req.params.id), req.body.status)
  res.json({ ok: true, data })
}

export const resetPassword = async (req: Request, res: Response) => {
  await userService.resetPassword(Number(req.params.id), req.body.newPassword)
  res.json({ ok: true, message: 'Contrasena restablecida' })
}

/** Todos los cursos del sistema, para la tabla de administracion. */
export const listCourses = async (req: Request, res: Response) => {
  const status = (req.query.status as CourseStatus) ?? 'active'
  res.json({ ok: true, data: await courseService.list(req.user!, status) })
}
