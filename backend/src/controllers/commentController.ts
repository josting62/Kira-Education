import type { Request, Response } from 'express'
import * as streamService from '../services/streamService.ts'
import type { CommentTarget } from '../types/models.ts'

export const list = async (req: Request, res: Response) => {
  const targetType = req.params.targetType as CommentTarget
  const data = await streamService.listComments(targetType, Number(req.params.targetId), req.user!)
  res.json({ ok: true, data })
}

export const remove = async (req: Request, res: Response) => {
  await streamService.removeComment(Number(req.params.id), req.user!)
  res.json({ ok: true, message: 'Comentario eliminado' })
}

export const create = async (req: Request, res: Response) => {
  const { targetType, targetId, body } = req.body
  const data = await streamService.createComment(targetType, targetId, req.user!, body)
  res.status(201).json({ ok: true, data })
}
