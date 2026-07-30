import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { useCourseContext } from '@/hooks/useCourseContext'
import { getGradebook, type GradebookRow } from '@/services/courseService'
import { cn } from '@/lib/cn'

/** Convierte las filas planas de v_gradebook en una matriz alumno x tarea. */
const pivot = (rows: GradebookRow[]) => {
  const assignments = new Map<number, string>()
  const students = new Map<number, { name: string; grades: Map<number, GradebookRow> }>()

  for (const row of rows) {
    assignments.set(row.coursework_id, row.coursework_title)
    if (!students.has(row.student_id)) {
      students.set(row.student_id, { name: row.student_name, grades: new Map() })
    }
    students.get(row.student_id)!.grades.set(row.coursework_id, row)
  }

  return { assignments: [...assignments], students: [...students] }
}

export const GradesTab = () => {
  const { course } = useCourseContext()
  const { data, loading } = useFetch(() => getGradebook(course.id), [course.id])

  if (loading) return <PageSpinner />

  if (!data || data.length === 0) {
    return (
      <Card>
        <EmptyState
          illustration="grades"
          title="Todavia no hay nada que calificar"
          description="Publica una tarea con puntaje para ver la libreta de calificaciones."
        />
      </Card>
    )
  }

  const { assignments, students } = pivot(data)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        {/* Descarga directa: el navegador sigue el enlace y la API responde
            con Content-Disposition, sin necesidad de JavaScript. */}
        <a
          href={`/api/courses/${course.id}/gradebook.csv`}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-1.5 text-xs text-ink-soft transition-colors hover:bg-hover"
        >
          <Icon.grades className="size-3.5 text-icon-teal" aria-hidden />
          Exportar a CSV
        </a>
      </div>

      <Card className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="sticky left-0 bg-surface px-4 py-3 text-left text-xs font-medium text-ink-muted">
              Alumno
            </th>
            {assignments.map(([id, title]) => (
              <th
                key={id}
                className="max-w-32 px-4 py-3 text-left text-xs font-medium text-ink-soft"
              >
                <span className="line-clamp-2">{title}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(([studentId, student]) => (
            <tr key={studentId} className="border-b border-line last:border-b-0 hover:bg-hover">
              <td className="sticky left-0 bg-surface px-4 py-2.5 text-ink">{student.name}</td>
              {assignments.map(([courseworkId]) => {
                const cell = student.grades.get(courseworkId)
                return (
                  <td key={courseworkId} className="px-4 py-2.5">
                    {cell?.grade !== null && cell?.grade !== undefined ? (
                      <span className="font-medium text-ink">
                        {cell.grade}
                        <span className="text-xs text-ink-muted">/{cell.max_points}</span>
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'text-xs',
                          cell?.state === 'turned_in' ? 'text-success' : 'text-ink-muted',
                        )}
                      >
                        {cell?.state === 'turned_in' ? 'Entregado' : 'Sin calificar'}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        </table>
      </Card>
    </div>
  )
}
