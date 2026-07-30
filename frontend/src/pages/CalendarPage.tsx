import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'
import { IconButton } from '@/components/atoms/IconButton'
import { PageSpinner } from '@/components/atoms/Spinner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon, type IconName } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { useFetch } from '@/hooks/useFetch'
import { getMonth } from '@/services/calendarService'
import type { CalendarEntry, CourseworkType } from '@/types/models'

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
const MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const TYPE_ICON: Record<CourseworkType, IconName> = {
  assignment: 'assignment',
  material: 'material',
  question: 'question',
  quiz: 'quiz',
}

/** Lunes = 0 ... Domingo = 6, para que la rejilla empiece en lunes. */
const mondayIndex = (date: Date) => (date.getDay() + 6) % 7

/** Agrupa las entradas por dia del mes. */
const groupByDay = (entries: CalendarEntry[]) => {
  const byDay = new Map<number, CalendarEntry[]>()
  for (const entry of entries) {
    const day = Number(entry.due_at.slice(8, 10))
    const list = byDay.get(day) ?? []
    list.push(entry)
    byDay.set(day, list)
  }
  return byDay
}

export const CalendarPage = () => {
  const today = new Date()
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  })

  const { data, loading } = useFetch(
    () => getMonth(cursor.year, cursor.month),
    [cursor.year, cursor.month],
  )

  const shift = (delta: number) =>
    setCursor((prev) => {
      const next = new Date(prev.year, prev.month - 1 + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() + 1 }
    })

  const byDay = groupByDay(data?.entries ?? [])
  const firstOfMonth = new Date(cursor.year, cursor.month - 1, 1)
  const daysInMonth = new Date(cursor.year, cursor.month, 0).getDate()
  const leadingBlanks = mondayIndex(firstOfMonth)

  const isCurrentMonth =
    cursor.year === today.getFullYear() && cursor.month === today.getMonth() + 1

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display flex items-center gap-2 text-xl font-medium text-ink">
          <Icon.calendar className="size-5 text-icon-indigo" aria-hidden />
          Calendario
        </h1>
        <div className="ml-auto flex items-center gap-1">
          <IconButton icon="chevronLeft" label="Mes anterior" onClick={() => shift(-1)} />
          <span className="min-w-40 text-center text-sm font-medium capitalize text-ink">
            {MONTHS[cursor.month - 1]} {cursor.year}
          </span>
          <IconButton icon="chevronRight" label="Mes siguiente" onClick={() => shift(1)} />
          {!isCurrentMonth && (
            <Button
              variant="secondary"
              size="sm"
              className="ml-1"
              onClick={() =>
                setCursor({ year: today.getFullYear(), month: today.getMonth() + 1 })
              }
            >
              Hoy
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : (
        <>
          <Card className="overflow-hidden">
            <div className="grid grid-cols-7 border-b border-line bg-canvas">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-2 py-2 text-center text-[11px] font-medium text-ink-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <div key={`blank-${i}`} className="min-h-24 border-b border-r border-line bg-canvas/40" />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const entries = byDay.get(day) ?? []
                const isToday =
                  isCurrentMonth && day === today.getDate()

                return (
                  <div
                    key={day}
                    className="min-h-24 border-b border-r border-line p-1.5 last:border-r-0"
                  >
                    <span
                      className={cn(
                        'inline-flex size-6 items-center justify-center rounded-full text-xs',
                        isToday
                          ? 'bg-accent-500 font-semibold text-white'
                          : 'text-ink-muted',
                      )}
                    >
                      {day}
                    </span>

                    <div className="mt-1 flex flex-col gap-1">
                      {entries.slice(0, 3).map((entry) => {
                        const Glyph = Icon[TYPE_ICON[entry.type]]
                        return (
                          <Link
                            key={entry.coursework_id}
                            to={`/courses/${entry.course_id}/work/${entry.coursework_id}`}
                            title={`${entry.title} — ${entry.course_name}`}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] text-ink-soft transition-colors hover:bg-hover"
                          >
                            <span
                              aria-hidden
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: entry.theme_color }}
                            />
                            <Glyph className="size-3 shrink-0 text-ink-muted" aria-hidden />
                            <span className="truncate">{entry.title}</span>
                          </Link>
                        )
                      })}
                      {entries.length > 3 && (
                        <span className="px-1 text-[10px] text-ink-muted">
                          +{entries.length - 3} mas
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {data?.entries.length === 0 && (
            <Card className="mt-4">
              <EmptyState
                icon="calendar"
                title="Sin entregas este mes"
                description="El trabajo con fecha de entrega de tus clases aparecera aqui."
              />
            </Card>
          )}
        </>
      )}
    </div>
  )
}
