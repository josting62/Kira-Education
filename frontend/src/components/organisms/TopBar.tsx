import { Link, useNavigate } from 'react-router-dom'
import { Avatar } from '@/components/atoms/Avatar'
import { IconButton } from '@/components/atoms/IconButton'
import { Menu } from '@/components/molecules/Menu'
import { ThemeToggle } from '@/components/molecules/ThemeToggle'
import { Icon } from '@/assets/icons'
import { useAuth } from '@/hooks/useAuth'

interface TopBarProps {
  onToggleSidebar: () => void
  unreadCount?: number
}

export const TopBar = ({ onToggleSidebar, unreadCount = 0 }: TopBarProps) => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const fullName = user ? `${user.first_name} ${user.last_name}` : ''

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
      <IconButton icon="menu" label="Abrir menu principal" onClick={onToggleSidebar} />

      <Link to="/" className="flex items-center gap-2 pl-1">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-500 text-white">
          <Icon.course className="size-4" aria-hidden />
        </span>
        <span className="font-display text-xl font-semibold tracking-tight text-ink">
          Kiro Education
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <Link
          to="/notifications"
          className="relative inline-flex size-9 items-center justify-center rounded-full text-icon-amber transition-colors hover:bg-hover"
          aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        >
          <Icon.bell className="size-5" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {user && (
          <Menu
            label={`Cuenta de ${fullName}`}
            icon="user"
            align="right"
            items={[
              { label: 'Mi perfil', icon: 'user', onSelect: () => navigate('/profile') },
              { label: 'Ajustes', icon: 'settings', onSelect: () => navigate('/settings') },
              ...(isAdmin
                ? [
                    {
                      label: 'Administracion',
                      icon: 'admin' as const,
                      onSelect: () => navigate('/admin'),
                    },
                  ]
                : []),
              {
                label: 'Cerrar sesion',
                icon: 'logout',
                danger: true,
                onSelect: () => void logout(),
              },
            ]}
            triggerClassName="ml-1 size-9 p-0 hover:bg-transparent"
            triggerContent={
              <Avatar name={fullName} src={user.avatar_url} className="size-9" />
            }
          />
        )}
      </div>
    </header>
  )
}
