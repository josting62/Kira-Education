import { Avatar } from '@/components/atoms/Avatar'
import { Card } from '@/components/atoms/Card'
import { IconButton } from '@/components/atoms/IconButton'
import { PageSpinner } from '@/components/atoms/Spinner'
import { useFetch } from '@/hooks/useFetch'
import { useCourseContext } from '@/hooks/useCourseContext'
import { getMembers, removeMember } from '@/services/courseService'
import type { CourseMembers } from '@/types/models'

const MemberList = ({
  title,
  members,
  canRemove,
  onRemove,
}: {
  title: string
  members: CourseMembers['students']
  canRemove: boolean
  onRemove: (id: number) => void
}) => (
  <section>
    <div className="mb-1 flex items-baseline justify-between border-b-2 border-accent-300 pb-2">
      <h2 className="text-lg font-medium text-accent-700">{title}</h2>
      <span className="text-xs text-ink-muted">
        {members.length} {members.length === 1 ? 'persona' : 'personas'}
      </span>
    </div>
    <Card className="overflow-hidden">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0"
        >
          <Avatar name={`${member.first_name} ${member.last_name}`} src={member.avatar_url} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-ink">
              {member.first_name} {member.last_name}
            </span>
            <span className="block truncate text-xs text-ink-muted">{member.email}</span>
          </span>
          {canRemove && (
            <IconButton
              icon="delete"
              label={`Retirar a ${member.first_name}`}
              onClick={() => onRemove(member.id)}
            />
          )}
        </div>
      ))}
    </Card>
  </section>
)

export const PeopleTab = () => {
  const { course } = useCourseContext()
  const { data, loading, reload } = useFetch(() => getMembers(course.id), [course.id])

  const isTeacher = course.course_role === 'teacher'

  if (loading) return <PageSpinner />

  const remove = async (memberId: number) => {
    await removeMember(course.id, memberId)
    reload()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <MemberList
        title="Profesores"
        members={data?.teachers ?? []}
        canRemove={false}
        onRemove={() => undefined}
      />
      <MemberList
        title="Alumnos"
        members={data?.students ?? []}
        canRemove={isTeacher}
        onRemove={(id) => void remove(id)}
      />
    </div>
  )
}
