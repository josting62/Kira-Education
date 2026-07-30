import type { Request, Response } from 'express'
import * as notificationRepo from '../repositories/notificationRepository.ts'

export const list = async (req: Request, res: Response) => {
  const items = await notificationRepo.listForUser(req.user!.id)
  const unread = await notificationRepo.countUnread(req.user!.id)
  res.json({ ok: true, data: { items, unread: unread?.total ?? 0 } })
}

export const markAsRead = async (req: Request, res: Response) => {
  await notificationRepo.markAsRead(Number(req.params.id), req.user!.id)
  res.json({ ok: true, message: 'Notificacion leida' })
}

export const markAllAsRead = async (req: Request, res: Response) => {
  await notificationRepo.markAllAsRead(req.user!.id)
  res.json({ ok: true, message: 'Todas las notificaciones leidas' })
}
