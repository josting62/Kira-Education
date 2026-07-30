import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { CourseCard } from '@/components/molecules/CourseCard'
import { EmptyState } from '@/components/molecules/EmptyState'
import { useFetch } from '@/hooks/useFetch'
import { useCourseActions } from '@/hooks/useCourseActions'
import { listCourses } from '@/services/courseService'

export const ArchivedPage = () => {
  const { data, loading, reload } = useFetch(() => listCourses('archived'))
  const { buildMenu, overlays } = useCourseActions(reload)

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <h1 className="mb-5 text-xl font-medium text-ink">Clases archivadas</h1>
      {data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((course) => (
            <CourseCard key={course.id} course={course} menuItems={buildMenu(course)} />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            illustration="archive"
            title="No tienes clases archivadas"
            description="Las clases que archives desde el menu de opciones apareceran aqui."
          />
        </Card>
      )}
      {overlays}
    </div>
  )
}
