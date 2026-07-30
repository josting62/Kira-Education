import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Toast } from '@/components/atoms/Toast'
import { CustomizeCourseDialog } from '@/components/organisms/CustomizeCourseDialog'
import type { MenuItem } from '@/components/molecules/Menu'
import { archiveCourse, copyCourse, deleteCourse, leaveCourse } from '@/services/courseService'
import { useAuth } from '@/hooks/useAuth'
import type { Course } from '@/types/models'

/**
 * Construye el menu de opciones de una clase segun el rol del usuario,
 * y devuelve los dialogos/avisos que hay que montar en la pagina.
 *
 *   const { buildMenu, overlays } = useCourseActions(reload)
 *   <CourseCard menuItems={buildMenu(course)} /> ... {overlays}
 */
export const useCourseActions = (onChanged: () => void) => {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Course | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const run = useCallback(
    async (action: () => Promise<unknown>, message: string) => {
      try {
        await action()
        setToast(message)
        onChanged()
      } catch (error) {
        setToast((error as Error).message)
      }
    },
    [onChanged],
  )

  const copyInviteLink = useCallback(async (course: Course) => {
    const link = `${window.location.origin}/join/${course.class_code}`
    try {
      await navigator.clipboard.writeText(link)
      setToast('Enlace de invitacion copiado')
    } catch {
      // Sin permiso de portapapeles (http en otro host): mostramos el enlace.
      setToast(link)
    }
  }, [])

  const buildMenu = useCallback(
    (course: Course): MenuItem[] => {
      const isTeacherHere = course.course_role === 'teacher' || course.owner_id === user?.id
      const canManage = isTeacherHere || isAdmin
      const archived = course.status === 'archived'

      if (!canManage) {
        return [
          {
            label: 'Copiar enlace de invitacion',
            icon: 'inviteLink',
            onSelect: () => void copyInviteLink(course),
          },
          {
            label: 'Anular inscripcion',
            icon: 'logout',
            danger: true,
            onSelect: () => {
              if (!window.confirm(`Salir de "${course.name}"?`)) return
              void run(() => leaveCourse(course.id), 'Saliste de la clase')
            },
          },
        ]
      }

      const items: MenuItem[] = [
        {
          label: 'Copiar enlace de invitacion',
          icon: 'inviteLink',
          onSelect: () => void copyInviteLink(course),
        },
        { label: 'Personalizar', icon: 'palette', onSelect: () => setEditing(course) },
        {
          label: 'Copiar',
          icon: 'copy',
          onSelect: () =>
            void run(async () => {
              const created = await copyCourse(course.id)
              navigate(`/courses/${created.id}`)
            }, 'Clase duplicada'),
        },
      ]

      if (archived) {
        items.push({
          label: 'Restaurar',
          icon: 'restore',
          onSelect: () => void run(() => archiveCourse(course.id, 'active'), 'Clase restaurada'),
        })
        items.push({
          label: 'Eliminar',
          icon: 'delete',
          danger: true,
          onSelect: () => {
            if (!window.confirm(`Eliminar "${course.name}" y todo su contenido? No se puede deshacer.`))
              return
            void run(() => deleteCourse(course.id), 'Clase eliminada')
          },
        })
      } else {
        items.push({
          label: 'Archivar',
          icon: 'archive',
          onSelect: () => {
            if (!window.confirm(`Archivar "${course.name}"?`)) return
            void run(() => archiveCourse(course.id, 'archived'), 'Clase archivada')
          },
        })
      }

      return items
    },
    [user?.id, isAdmin, copyInviteLink, run, navigate],
  )

  const overlays = (
    <>
      {editing && (
        <CustomizeCourseDialog
          course={editing}
          onClose={() => setEditing(null)}
          // Cada cambio confirmado refresca la pagina y el propio dialogo,
          // asi el banner se ve al instante sin recargar.
          onSaved={(updated) => {
            setEditing(updated)
            onChanged()
          }}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </>
  )

  return { buildMenu, overlays, openEditor: setEditing }
}
