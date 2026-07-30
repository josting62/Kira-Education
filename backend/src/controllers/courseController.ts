import type { Request, Response } from 'express'
import * as courseService from '../services/courseService.ts'
import * as streamService from '../services/streamService.ts'
import { publicUrlFor } from '../config/uploads.ts'
import type { CourseStatus } from '../types/models.ts'

export const list = async (req: Request, res: Response) => {
  const status = (req.query.status as CourseStatus) ?? 'active'
  res.json({ ok: true, data: await courseService.list(req.user!, status) })
}

export const detail = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await courseService.detail(Number(req.params.id), req.user!) })
}

export const create = async (req: Request, res: Response) => {
  res.status(201).json({ ok: true, data: await courseService.create(req.user!, req.body) })
}

export const update = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await courseService.update(Number(req.params.id), req.user!, req.body) })
}

export const setBanner = async (req: Request, res: Response) => {
  const data = await courseService.setBanner(Number(req.params.id), req.user!, req.body)
  res.json({ ok: true, data })
}

/** Sube la imagen y la aplica como encabezado en una sola peticion. */
export const uploadBanner = async (req: Request, res: Response) => {
  const data = await courseService.setBanner(Number(req.params.id), req.user!, {
    bannerKind: 'upload',
    bannerUrl: publicUrlFor(req.file!.filename),
    themeColor: typeof req.body.themeColor === 'string' ? req.body.themeColor : undefined,
  })
  res.json({ ok: true, data })
}

export const copy = async (req: Request, res: Response) => {
  res.status(201).json({ ok: true, data: await courseService.copy(Number(req.params.id), req.user!) })
}

export const archive = async (req: Request, res: Response) => {
  const data = await courseService.archive(Number(req.params.id), req.user!, req.body.status)
  res.json({ ok: true, data })
}

export const remove = async (req: Request, res: Response) => {
  await courseService.remove(Number(req.params.id), req.user!)
  res.json({ ok: true, message: 'Curso eliminado' })
}

export const join = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await courseService.joinByCode(req.user!, req.body.code) })
}

export const leave = async (req: Request, res: Response) => {
  await courseService.leave(Number(req.params.id), req.user!)
  res.json({ ok: true, message: 'Saliste de la clase' })
}

export const members = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await courseService.members(Number(req.params.id), req.user!) })
}

export const removeMember = async (req: Request, res: Response) => {
  await courseService.removeMember(Number(req.params.id), req.user!, Number(req.params.memberId))
  res.json({ ok: true, message: 'Integrante retirado' })
}

export const stream = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await streamService.stream(Number(req.params.id), req.user!) })
}

export const createAnnouncement = async (req: Request, res: Response) => {
  const data = await streamService.createAnnouncement(Number(req.params.id), req.user!, req.body.body)
  res.status(201).json({ ok: true, data })
}
