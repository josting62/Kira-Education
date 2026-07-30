import type { Request, Response } from 'express'
import * as userService from '../services/userService.ts'

// ---------- Perfil propio ----------

export const profile = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await userService.profile(req.user!.id) })
}

export const updateProfile = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await userService.updateProfile(req.user!.id, req.body) })
}

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body
  await userService.changePassword(req.user!.id, currentPassword, newPassword)
  res.json({ ok: true, message: 'Contrasena actualizada' })
}

export const setAvatar = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await userService.setAvatar(req.user!.id, req.file!.filename) })
}

export const removeAvatar = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await userService.removeAvatar(req.user!.id) })
}

// ---------- Ajustes ----------

export const settings = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await userService.settings(req.user!.id) })
}

export const updateSettings = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await userService.updateSettings(req.user!.id, req.body) })
}
