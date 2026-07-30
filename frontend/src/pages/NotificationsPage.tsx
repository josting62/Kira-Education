import { Link } from 'react-router-dom'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'
import { PageSpinner } from '@/components/atoms/Spinner'
import { EmptyState } from '@/components/molecules/EmptyState'
import { Icon, type IconName } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { listNotifications, markAllAsRead } from '@/services/notificationService'
import { formatRelative } from '@/lib/dates'
import { cn } from '@/lib/cn'

const TYPE_ICON: Record<string, IconName> = {
  coursework: 'assignment',
  announcement: 'comment',
  grade: 'grades',
  comment: 'comment',
  enrollment: 'invite',
}

export const NotificationsPage = () => {
  const { data, loading, reload } = useFetch(() => listNotifications())

  if (loading) return <PageSpinner />

  const items = data?.items ?? []

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Notificaciones</h1>
        {(data?.unread ?? 0) > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void markAllAsRead().then(reload)}
          >
            <Icon.checkAll className="size-4" aria-hidden />
            Marcar todas como leidas
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState illustration="notifications" title="No tienes notificaciones" />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {items.map((item) => {
            const Glyph = Icon[TYPE_ICON[item.type] ?? 'bell']
            const content = (
              <>
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    item.read_at ? 'bg-hover text-ink-muted' : 'bg-accent-100 text-accent-600',
                  )}
                >
                  <Glyph className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block truncate text-sm',
                      item.read_at ? 'text-ink-soft' : 'font-medium text-ink',
                    )}
                  >
                    {item.title}
                  </span>
                  {item.body && (
                    <span className="block truncate text-xs text-ink-muted">{item.body}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-ink-muted">
                  {formatRelative(item.created_at)}
                </span>
              </>
            )

            return item.link ? (
              <Link
                key={item.id}
                to={item.link}
                className="density-row flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 hover:bg-hover"
              >
                {content}
              </Link>
            ) : (
              <div
                key={item.id}
                className="density-row flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
              >
                {content}
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}
