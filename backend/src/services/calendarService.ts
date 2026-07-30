import * as calendarRepo from '../repositories/calendarRepository.ts'
import { HttpError } from '../utils/httpError.ts'
import type { AuthPayload } from '../types/models.ts'

/** Formatea una fecha como 'YYYY-MM-DD HH:mm:ss' para MySQL. */
const toMysql = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ')

/**
 * Trabajo del mes indicado (1-12). Devuelve tambien los limites usados,
 * para que el frontend pinte la rejilla sin recalcular.
 */
export const month = async (user: AuthPayload, year: number, month: number) => {
  if (month < 1 || month > 12) throw HttpError.badRequest('El mes debe estar entre 1 y 12')
  if (year < 2000 || year > 2100) throw HttpError.badRequest('Ano fuera de rango')

  const from = new Date(Date.UTC(year, month - 1, 1))
  const to = new Date(Date.UTC(year, month, 1))

  return {
    year,
    month,
    entries: await calendarRepo.listRange(user.id, toMysql(from), toMysql(to)),
  }
}
