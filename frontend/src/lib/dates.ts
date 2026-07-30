import { format, formatDistanceToNow, isPast, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

/** MySQL devuelve 'YYYY-MM-DD HH:mm:ss'; lo normalizamos a ISO. */
const toDate = (value: string): Date => parseISO(value.replace(' ', 'T'))

export const formatRelative = (value: string): string => {
  const date = toDate(value)
  if (isToday(date)) return `hoy, ${format(date, 'HH:mm')}`
  return formatDistanceToNow(date, { locale: es, addSuffix: true })
}

export const formatDate = (value: string): string =>
  format(toDate(value), "d 'de' MMMM", { locale: es })

export const formatDateTime = (value: string): string =>
  format(toDate(value), "d MMM, HH:mm", { locale: es })

/** Etiqueta de fecha de entrega, al estilo "Vence manana, 23:00". */
export const formatDueDate = (value: string): string => {
  const date = toDate(value)
  const time = format(date, 'HH:mm')
  if (isToday(date)) return `Vence hoy, ${time}`
  if (isTomorrow(date)) return `Vence manana, ${time}`
  if (isPast(date)) return `Vencio el ${format(date, 'd MMM', { locale: es })}`
  return `Vence el ${format(date, 'd MMM', { locale: es })}, ${time}`
}

export const isOverdue = (value: string | null): boolean =>
  value !== null && isPast(toDate(value))
