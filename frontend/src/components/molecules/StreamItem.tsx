import { Link } from 'react-router-dom'
import { Card } from '@/components/atoms/Card'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { CommentThread } from '@/components/molecules/CommentThread'
import { Icon, type IconName } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { formatRelative, formatDueDate } from '@/lib/dates'
import type { StreamEntry } from '@/types/models'

const WORK_ICON: Record<string, IconName> = {
  assignment: 'assignment',
  material: 'material',
  question: 'question',
  quiz: 'quiz',
}

const WORK_LABEL: Record<string, string> = {
  assignment: 'publico una tarea',
  material: 'publico material',
  question: 'publico una pregunta',
  quiz: 'publico un cuestionario',
}

/** Cada tipo de trabajo tiene su propio color de icono. */
const WORK_COLOR: Record<string, string> = {
  assignment: 'bg-icon-indigo',
  material: 'bg-icon-teal',
  question: 'bg-icon-amber',
  quiz: 'bg-icon-violet',
}

/** Una entrada del tablon: anuncio del docente o trabajo publicado. */
export const StreamItem = ({ entry, courseId }: { entry: StreamEntry; courseId: number }) => {
  if (entry.kind === 'announcement') {
    return (
      <Card className="p-4">
        <div className="flex gap-3">
          <Avatar name={entry.author_name} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{entry.author_name}</p>
            <p className="text-xs text-ink-muted">{formatRelative(entry.created_at)}</p>
            <p className="mt-3 whitespace-pre-line text-sm text-ink-soft">{entry.body}</p>

            <CommentThread
              targetType="announcement"
              targetId={entry.id}
              collapsible
              className="mt-3 border-t border-line pt-3"
            />
          </div>
        </div>
      </Card>
    )
  }

  const Glyph = Icon[WORK_ICON[entry.type] ?? 'assignment']

  return (
    <Card className="p-4">
      <Link
        to={`/courses/${courseId}/work/${entry.id}`}
        className="flex gap-3 transition-opacity hover:opacity-80"
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full text-white',
            WORK_COLOR[entry.type] ?? 'bg-icon-indigo',
          )}
        >
          <Glyph className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">
            <span className="font-medium">{entry.author_name}</span>{' '}
            <span className="text-ink-muted">{WORK_LABEL[entry.type] ?? 'publico'}:</span>{' '}
            {entry.title}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-ink-muted">{formatRelative(entry.created_at)}</span>
            {entry.due_at && <Badge tone="accent">{formatDueDate(entry.due_at)}</Badge>}
          </div>
        </div>
      </Link>

      <CommentThread
        targetType="coursework"
        targetId={entry.id}
        collapsible
        className="mt-3 border-t border-line pt-3 pl-12"
      />
    </Card>
  )
}
