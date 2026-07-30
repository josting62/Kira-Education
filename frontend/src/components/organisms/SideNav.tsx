import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from '@/assets/icons'
import { useAuth } from '@/hooks/useAuth'
import type { Course } from '@/types/models'

interface SideNavProps {
  open: boolean
  courses: Course[]
  /** Solo llegan si el ajuste "Mostrar clases archivadas" esta activo. */
  archived?: Course[]
  /** Cierra el menu al tocar fuera; solo pasa en movil. */
  onClose: () => void
}

const ITEM_BASE = 'flex items-center gap-3 rounded-r-full px-6 py-2.5 text-sm transition-colors'
const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(ITEM_BASE, isActive ? 'bg-accent-100 font-medium text-accent-700' : 'text-ink-soft hover:bg-hover')

const NavItem = ({
  to,
  icon,
  label,
  end,
}: {
  to: string
  icon: IconName
  label: string
  end?: boolean
}) => {
  const Glyph = Icon[icon]
  return (
    <NavLink to={to} end={end} className={itemClass}>
      <Glyph className="size-5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

/** Fila de curso: circulo con la inicial en el color del tema. */
const CourseItem = ({ course }: { course: Course }) => (
  <NavLink
    to={`/courses/${course.id}`}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-3 rounded-r-full px-6 py-2 text-sm transition-colors',
        isActive ? 'bg-accent-100 font-medium text-accent-700' : 'text-ink-soft hover:bg-hover',
      )
    }
  >
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: course.theme_color }}
    >
      {course.name.slice(0, 1).toUpperCase()}
    </span>
    <span className="min-w-0 truncate">
      <span className="block truncate">{course.name}</span>
      {course.section && (
        <span className="block truncate text-[11px] text-ink-muted">{course.section}</span>
      )}
    </span>
  </NavLink>
)

/** Grupo colapsable de clases ("Clases impartidas" / "Clases inscritas"). */
const CourseGroup = ({
  title,
  icon,
  courses,
}: {
  title: string
  icon: IconName
  courses: Course[]
}) => {
  const [expanded, setExpanded] = useState(true)
  const Glyph = Icon[icon]

  if (courses.length === 0) return null

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className={cn(ITEM_BASE, 'w-full text-ink-soft hover:bg-hover')}
      >
        <Glyph className="size-5 shrink-0" aria-hidden />
        <span className="flex-1 truncate text-left">{title}</span>
        <Icon.chevronDown
          className={cn('size-4 shrink-0 transition-transform', !expanded && '-rotate-90')}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="flex flex-col gap-0.5">
          {courses.map((course) => (
            <CourseItem key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}

/** Menu lateral. Los modulos visibles dependen del rol del usuario. */
export const SideNav = ({ open, courses, archived = [], onClose }: SideNavProps) => {
  const { user, isTeacher, isStudent, isAdmin, isGuardian } = useAuth()

  // Un docente puede estar inscrito como alumno en otra clase: separamos los grupos.
  const teaching = courses.filter(
    (course) => course.owner_id === user?.id || course.course_role === 'teacher',
  )
  const enrolled = courses.filter((course) => !teaching.includes(course))

  return (
    <>
      {/* En movil el menu se superpone; este velo lo cierra al tocar fuera. */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar el menu"
          onClick={onClose}
          className="fixed inset-0 top-16 z-20 bg-backdrop md:hidden"
        />
      )}

      <nav
        aria-label="Menu principal"
        className={cn(
          'overflow-y-auto border-r border-line bg-surface py-3 transition-all',
          // Movil: panel flotante sobre el contenido.
          'fixed bottom-0 left-0 top-16 z-30 md:static md:z-auto',
          open ? 'w-64' : 'w-0 border-r-0',
          // Fuera de movil ocupa su hueco y no tapa nada.
          'md:shrink-0',
        )}
      >
        <div className={cn('flex flex-col gap-0.5', !open && 'hidden')}>
        <NavItem to="/" icon="home" label="Inicio" end />
        <NavItem to="/calendar" icon="calendar" label="Calendario" />

        <hr className="my-2 border-line" />

        {(isStudent || isAdmin) && <NavItem to="/todo" icon="classwork" label="Pendientes" />}
        {(isTeacher || isAdmin) && (
          <NavItem to="/to-review" icon="grades" label="Pendientes de revision" />
        )}
        {isGuardian && <NavItem to="/seguimiento" icon="invite" label="Seguimiento" />}

        <hr className="my-2 border-line" />

        <CourseGroup title="Clases impartidas" icon="people" courses={teaching} />
        <CourseGroup title="Clases inscritas" icon="course" courses={enrolled} />

        {archived.length > 0 && <CourseGroup title="Archivadas" icon="archive" courses={archived} />}

        <hr className="my-2 border-line" />

        <NavItem to="/archived" icon="archive" label="Clases archivadas" />
        {isAdmin && <NavItem to="/admin" icon="admin" label="Administracion" />}
          <NavItem to="/profile" icon="user" label="Mi perfil" />
          <NavItem to="/settings" icon="settings" label="Ajustes" />
        </div>
      </nav>
    </>
  )
}
