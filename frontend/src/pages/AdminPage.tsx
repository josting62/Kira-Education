import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'
import { Input } from '@/components/atoms/Input'
import { PageSpinner } from '@/components/atoms/Spinner'
import { Toast } from '@/components/atoms/Toast'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Menu } from '@/components/molecules/Menu'
import { CreateUserDialog } from '@/components/organisms/CreateUserDialog'
import { GuardianLinksDialog } from '@/components/organisms/GuardianLinksDialog'
import { Icon, type IconName } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/hooks/useAuth'
import {
  getOverview,
  listAllCourses,
  listUsers,
  resetUserPassword,
  setUserRole,
  setUserStatus,
} from '@/services/adminService'
import type { RoleSlug, User } from '@/types/models'

const ROLE_LABEL: Record<RoleSlug, string> = {
  admin: 'Administrador',
  teacher: 'Docente',
  student: 'Estudiante',
  guardian: 'Acudiente',
}

const ROLE_ICON: Record<RoleSlug, IconName> = {
  admin: 'admin',
  teacher: 'people',
  student: 'user',
  guardian: 'invite',
}

const STAT_CARDS: { key: keyof StatsShape; label: string; icon: IconName; color: string }[] = [
  { key: 'users', label: 'Usuarios', icon: 'people', color: 'text-icon-indigo' },
  { key: 'teachers', label: 'Docentes', icon: 'admin', color: 'text-icon-teal' },
  { key: 'students', label: 'Estudiantes', icon: 'user', color: 'text-icon-violet' },
  { key: 'inactive', label: 'Inactivos', icon: 'power', color: 'text-danger' },
  { key: 'courses', label: 'Clases activas', icon: 'course', color: 'text-icon-amber' },
  { key: 'archived', label: 'Archivadas', icon: 'archive', color: 'text-ink-muted' },
  { key: 'coursework', label: 'Trabajos', icon: 'classwork', color: 'text-icon-olive' },
  { key: 'submissions', label: 'Entregas', icon: 'grades', color: 'text-icon-rose' },
]

type StatsShape = {
  users: number
  teachers: number
  students: number
  inactive: number
  courses: number
  archived: number
  coursework: number
  submissions: number
}

type Tab = 'users' | 'courses'

export const AdminPage = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('users')
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [guardiansOf, setGuardiansOf] = useState<User | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const { data: overview, reload: reloadOverview } = useFetch(() => getOverview())
  const { data: users, loading, reload } = useFetch(() => listUsers(search), [search])
  // Lista sin filtrar: el desplegable de acudientes no debe depender de la busqueda.
  const { data: allUsers } = useFetch(() => listUsers(''))
  const { data: courses } = useFetch(() => listAllCourses('active'))

  const act = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action()
      setToast(message)
      reload()
      reloadOverview()
    } catch (error) {
      setToast((error as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display flex items-center gap-2 text-xl font-medium text-ink">
          <Icon.admin className="size-5 text-icon-indigo" aria-hidden />
          Administracion
        </h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Icon.invite className="size-4" aria-hidden />
          Crear usuario
        </Button>
      </div>

      {/* Metricas */}
      {overview?.stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STAT_CARDS.map((card) => {
            const Glyph = Icon[card.icon]
            return (
              <Card key={card.key} className="px-4 py-3">
                <Glyph className={cn('size-4', card.color)} aria-hidden />
                <p className="font-display mt-1.5 text-2xl font-medium text-ink">
                  {overview.stats[card.key]}
                </p>
                <p className="text-xs text-ink-muted">{card.label}</p>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pestanas */}
      <div className="mb-4 flex gap-1 border-b border-line">
        {(
          [
            ['users', 'Usuarios'],
            ['courses', 'Clases'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors',
              tab === value
                ? 'border-accent-500 font-medium text-accent-600'
                : 'border-transparent text-ink-soft hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <>
          <div className="mb-3 max-w-xs">
            <Input
              name="search"
              placeholder="Buscar por nombre o correo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <PageSpinner />
          ) : users?.length ? (
            <Card className="overflow-hidden">
              {users.map((row) => {
                const RoleGlyph = Icon[ROLE_ICON[row.role_slug]]
                const isSelf = row.id === user?.id
                return (
                  <div
                    key={row.id}
                    className="density-row flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
                  >
                    <Avatar
                      name={`${row.first_name} ${row.last_name}`}
                      src={row.avatar_url}
                      size="sm"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">
                        {row.first_name} {row.last_name}
                        {isSelf && <span className="text-ink-muted"> (tu)</span>}
                      </span>
                      <span className="block truncate text-xs text-ink-muted">{row.email}</span>
                    </span>

                    <Badge tone="neutral">
                      <RoleGlyph className="size-3" aria-hidden />
                      {ROLE_LABEL[row.role_slug]}
                    </Badge>
                    <Badge tone={row.status === 'active' ? 'success' : 'danger'}>
                      {row.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>

                    <Menu
                      label={`Opciones de ${row.first_name}`}
                      items={[
                        ...(['admin', 'teacher', 'student', 'guardian'] as RoleSlug[])
                          .filter((slug) => slug !== row.role_slug)
                          .map((slug) => ({
                            label: `Cambiar a ${ROLE_LABEL[slug]}`,
                            icon: ROLE_ICON[slug],
                            disabled: isSelf,
                            onSelect: () =>
                              void act(
                                () => setUserRole(row.id, slug),
                                `${row.first_name} ahora es ${ROLE_LABEL[slug]}`,
                              ),
                          })),
                        ...(row.role_slug === 'student'
                          ? [
                              {
                                label: 'Acudientes',
                                icon: 'invite' as IconName,
                                onSelect: () => setGuardiansOf(row),
                              },
                            ]
                          : []),
                        {
                          label: 'Restablecer contrasena',
                          icon: 'key' as IconName,
                          onSelect: () => {
                            const next = window.prompt(
                              `Nueva contrasena para ${row.first_name} (minimo 6 caracteres):`,
                            )
                            if (!next || next.length < 6) return
                            void act(
                              () => resetUserPassword(row.id, next),
                              'Contrasena restablecida',
                            )
                          },
                        },
                        {
                          label: row.status === 'active' ? 'Desactivar' : 'Activar',
                          icon: 'power' as IconName,
                          danger: row.status === 'active',
                          disabled: isSelf,
                          onSelect: () =>
                            void act(
                              () =>
                                setUserStatus(
                                  row.id,
                                  row.status === 'active' ? 'inactive' : 'active',
                                ),
                              row.status === 'active' ? 'Cuenta desactivada' : 'Cuenta activada',
                            ),
                        },
                      ]}
                    />
                  </div>
                )
              })}
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon="people"
                title="Sin resultados"
                description={
                  search ? `Ningun usuario coincide con "${search}".` : 'No hay usuarios todavia.'
                }
              />
            </Card>
          )}
        </>
      ) : (
        <Card className="overflow-hidden">
          {courses?.length ? (
            courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="density-row flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0 hover:bg-hover"
              >
                <span
                  aria-hidden
                  className="size-7 shrink-0 rounded-full"
                  style={{ backgroundColor: course.theme_color }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{course.name}</span>
                  <span className="block truncate text-xs text-ink-muted">
                    {course.owner_name}
                    {course.section && ` · ${course.section}`}
                  </span>
                </span>
                <code className="font-mono text-xs text-ink-muted">{course.class_code}</code>
                <Icon.chevronRight className="size-4 shrink-0 text-ink-muted" aria-hidden />
              </Link>
            ))
          ) : (
            <EmptyState icon="course" title="No hay clases activas" />
          )}
        </Card>
      )}

      {creating && (
        <CreateUserDialog
          roles={overview?.roles ?? []}
          onClose={() => setCreating(false)}
          onCreated={(message) => {
            setCreating(false)
            setToast(message)
            reload()
            reloadOverview()
          }}
        />
      )}
      {guardiansOf && (
        <GuardianLinksDialog
          student={guardiansOf}
          guardians={(allUsers ?? []).filter((row) => row.role_slug === 'guardian')}
          onClose={() => setGuardiansOf(null)}
        />
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
