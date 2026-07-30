import type { Request, Response } from 'express'
import * as calendarService from '../services/calendarService.ts'

export const month = async (req: Request, res: Response) => {
  const now = new Date()
  const year = Number(req.query.year ?? now.getFullYear())
  const monthNumber = Number(req.query.month ?? now.getMonth() + 1)

  res.json({ ok: true, data: await calendarService.month(req.user!, year, monthNumber) })
}
