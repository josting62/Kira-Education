import type { Request, Response } from 'express'
import * as guardianService from '../services/guardianService.ts'

/** Estudiantes del acudiente autenticado. */
export const myStudents = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await guardianService.myStudents(req.user!) })
}

/** Resumen de solo lectura de un acudido. */
export const studentSummary = async (req: Request, res: Response) => {
  const data = await guardianService.studentSummary(req.user!, Number(req.params.studentId))
  res.json({ ok: true, data })
}

// ---------- Vinculos (solo admin) ----------

export const listGuardiansOf = async (req: Request, res: Response) => {
  const data = await guardianService.listGuardiansOf(Number(req.params.studentId))
  res.json({ ok: true, data })
}

export const link = async (req: Request, res: Response) => {
  const data = await guardianService.link(
    req.body.guardianId,
    req.body.studentId,
    req.body.relation,
  )
  res.status(201).json({ ok: true, data })
}

export const unlink = async (req: Request, res: Response) => {
  const data = await guardianService.unlink(
    Number(req.params.guardianId),
    Number(req.params.studentId),
  )
  res.json({ ok: true, data })
}
