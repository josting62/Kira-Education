import { Link } from 'react-router-dom'
import { Card } from '@/components/atoms/Card'
import { CourseBanner } from '@/components/atoms/CourseBanner'
import { IconButton } from '@/components/atoms/IconButton'
import { Menu, type MenuItem } from '@/components/molecules/Menu'
import { Icon } from '@/assets/icons'
import type { Course } from '@/types/models'

interface CourseCardProps {
  course: Course
  /** Texto opcional al pie: el proximo pendiente del curso. */
  footnote?: string | null
  /** Opciones del menu de tres puntos. Si no llegan, el menu no se muestra. */
  menuItems?: MenuItem[]
}

/** Card de clase, con el encabezado personalizado, el docente y su menu. */
export const CourseCard = ({ course, footnote, menuItems }: CourseCardProps) => (
  // Sin overflow-hidden: el menu de opciones debe poder salir de la card.
  <Card interactive className="flex flex-col">
    <CourseBanner
      themeColor={course.theme_color}
      bannerKind={course.banner_kind}
      bannerUrl={course.banner_url}
      className="rounded-t-card p-4"
    >
      <Link to={`/courses/${course.id}`} className="block text-white hover:underline">
        <h3 className="font-display line-clamp-2 text-lg font-medium leading-tight">
          {course.name}
        </h3>
        {course.section && <p className="mt-0.5 text-xs text-white/85">{course.section}</p>}
      </Link>
      <p className="mt-6 text-xs text-white/90">{course.owner_name}</p>
    </CourseBanner>

    <div className="min-h-16 flex-1 border-t border-line px-4 py-3">
      {footnote ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-soft">
          <Icon.clock className="size-3.5 shrink-0 text-icon-amber" aria-hidden />
          {footnote}
        </p>
      ) : (
        <p className="text-xs text-ink-muted">Sin trabajo proximo</p>
      )}
    </div>

    <div className="flex items-center justify-end gap-1 rounded-b-card border-t border-line px-2 py-1.5">
      <Link
        to={`/courses/${course.id}/grades`}
        aria-label={`Ver progreso de ${course.name}`}
        title="Ver progreso"
        className="inline-flex size-9 items-center justify-center rounded-full text-icon-teal transition-colors hover:bg-hover"
      >
        <Icon.progress className="size-5" aria-hidden />
      </Link>
      <IconButton
        icon="topic"
        label={`Abrir carpeta de ${course.name}`}
        className="text-icon-indigo"
      />
      {menuItems && menuItems.length > 0 && (
        <Menu label={`Opciones de ${course.name}`} items={menuItems} direction="up" />
      )}
    </div>
  </Card>
)
