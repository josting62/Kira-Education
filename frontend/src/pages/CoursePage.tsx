import { NavLink, Outlet, useParams } from 'react-router-dom'
import { PageSpinner } from '@/components/atoms/Spinner'
import { Button } from '@/components/atoms/Button'
import { CourseBanner } from '@/components/atoms/CourseBanner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Menu } from '@/components/molecules/Menu'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { useCourseActions } from '@/hooks/useCourseActions'
import { getCourse } from '@/services/courseService'
import { cn } from '@/lib/cn'

const TABS = [
  { to: '', label: 'Tablon', end: true },
  { to: 'work', label: 'Trabajo de clase' },
  { to: 'people', label: 'Personas' },
  { to: 'grades', label: 'Calificaciones', teacherOnly: true },
]

export const CoursePage = () => {
  const { courseId } = useParams()
  const id = Number(courseId)
  const { data: course, loading, error, reload } = useFetch(() => getCourse(id), [id])
  const { buildMenu, overlays, openEditor } = useCourseActions(reload)

  if (loading) return <PageSpinner />
  if (error || !course) {
    return <EmptyState icon="error" title="No se pudo abrir la clase" description={error ?? ''} />
  }

  const isTeacher = course.course_role === 'teacher'
  const visibleTabs = TABS.filter((tab) => !tab.teacherOnly || isTeacher)

  return (
    <div>
      {/* Encabezado con pestanas y ajustes de la clase */}
      <div className="flex flex-wrap items-center gap-1 border-b border-line px-4 sm:px-6">
        <nav aria-label="Secciones de la clase" className="flex gap-1">
          {visibleTabs.map((tab) => (
            <NavLink
              key={tab.label}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                cn(
                  '-mb-px border-b-2 px-4 py-3 text-sm transition-colors',
                  isActive
                    ? 'border-accent-500 font-medium text-accent-600'
                    : 'border-transparent text-ink-soft hover:text-ink',
                )
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {isTeacher && (
          <div className="ml-auto flex items-center gap-1">
            <Menu
              label="Ajustes de la clase"
              icon="settings"
              items={buildMenu(course)}
            />
          </div>
        )}
      </div>

      {/* Banner de la clase */}
      <CourseBanner
        themeColor={course.theme_color}
        bannerKind={course.banner_kind}
        bannerUrl={course.banner_url}
        className="mx-4 mt-4 flex h-44 rounded-card sm:mx-6"
      >
        <div className="flex h-44 flex-col justify-end p-6">
          <h1 className="font-display text-3xl font-medium leading-tight text-white">
            {course.name}
          </h1>
          {course.section && <p className="mt-1 text-sm text-white/85">{course.section}</p>}
        </div>
        {isTeacher && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute right-4 top-4"
            onClick={() => openEditor(course)}
          >
            <Icon.palette className="size-4 text-icon-rose" aria-hidden />
            Personalizar
          </Button>
        )}
      </CourseBanner>

      <div className="px-4 py-5 sm:px-6">
        <Outlet context={{ course, reloadCourse: reload }} />
      </div>

      {overlays}
    </div>
  )
}
