import type { Request, Response } from 'express'
import * as attachmentService from '../services/attachmentService.ts'

// ---------- Adjuntos de la tarea (docente) ----------

export const list = async (req: Request, res: Response) => {
  const data = await attachmentService.listForCoursework(Number(req.params.id), req.user!)
  res.json({ ok: true, data })
}

export const addLink = async (req: Request, res: Response) => {
  const data = await attachmentService.addLink(Number(req.params.id), req.user!, req.body)
  res.status(201).json({ ok: true, data })
}

export const addFile = async (req: Request, res: Response) => {
  const data = await attachmentService.addFile(Number(req.params.id), req.user!, req.file!)
  res.status(201).json({ ok: true, data })
}

export const remove = async (req: Request, res: Response) => {
  await attachmentService.removeFromCoursework(
    Number(req.params.id),
    req.user!,
    Number(req.params.attachmentId),
  )
  res.json({ ok: true, message: 'Adjunto eliminado' })
}

// ---------- Adjuntos de la entrega (estudiante) ----------

export const addSubmissionFile = async (req: Request, res: Response) => {
  const data = await attachmentService.addFileToSubmission(
    Number(req.params.id),
    req.user!,
    req.file!,
  )
  res.status(201).json({ ok: true, data })
}

export const removeSubmissionFile = async (req: Request, res: Response) => {
  await attachmentService.removeFromSubmission(
    Number(req.params.id),
    req.user!,
    Number(req.params.attachmentId),
  )
  res.json({ ok: true, message: 'Archivo eliminado de tu entrega' })
}
