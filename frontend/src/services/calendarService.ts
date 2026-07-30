import { http } from './http'
import type { CalendarEntry } from '@/types/models'

export const getMonth = (year: number, month: number) =>
  http.get<{ year: number; month: number; entries: CalendarEntry[] }>(
    `/calendar?year=${year}&month=${month}`,
  )
