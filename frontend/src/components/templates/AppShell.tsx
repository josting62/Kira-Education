import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TopBar } from '@/components/organisms/TopBar'
import { SideNav } from '@/components/organisms/SideNav'
import { ApiOfflineBanner } from '@/components/molecules/ApiOfflineBanner'
import { useFetch } from '@/hooks/useFetch'
import { useSettings } from '@/hooks/useSettings'
import { listCourses } from '@/services/courseService'
import { listNotifications } from '@/services/notificationService'

/** Plantilla de la app autenticada: topbar + menu lateral + contenido. */
export const AppShell = () => {
  // En movil arranca cerrado: ahi el menu se superpone al contenido.
  const [sidebarOpen, setSidebarOpen] = useState(
    () => typeof window === 'undefined' || window.innerWidth >= 768,
  )
  const { settings } = useSettings()

  const { data: courses } = useFetch(() => listCourses('active'))
  const { data: notifications } = useFetch(() => listNotifications())

  // Solo se piden si el ajuste lo permite (ver modulo Ajustes).
  const showArchived = settings?.show_archived === 1
  const { data: archived } = useFetch(
    () => (showArchived ? listCourses('archived') : Promise.resolve([])),
    [showArchived],
  )

  return (
    <div className="flex min-h-screen flex-col">
      <ApiOfflineBanner />
      <TopBar
        onToggleSidebar={() => setSidebarOpen((open) => !open)}
        unreadCount={notifications?.unread ?? 0}
      />
      <div className="flex flex-1">
        <SideNav
          open={sidebarOpen}
          courses={courses ?? []}
          archived={archived ?? []}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="min-w-0 flex-1 bg-canvas">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
