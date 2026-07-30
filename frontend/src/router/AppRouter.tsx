import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { SettingsProvider } from '@/context/SettingsContext'
import { ProtectedRoute, PublicOnlyRoute, AdminRoute } from './ProtectedRoute'
import { AppShell } from '@/components/templates/AppShell'

import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { HomePage } from '@/pages/HomePage'
import { CoursePage } from '@/pages/CoursePage'
import { StreamTab } from '@/pages/course/StreamTab'
import { ClassworkTab } from '@/pages/course/ClassworkTab'
import { PeopleTab } from '@/pages/course/PeopleTab'
import { GradesTab } from '@/pages/course/GradesTab'
import { CourseworkDetailPage } from '@/pages/CourseworkDetailPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { TodoPage } from '@/pages/TodoPage'
import { ToReviewPage } from '@/pages/ToReviewPage'
import { ArchivedPage } from '@/pages/ArchivedPage'
import { JoinByLinkPage } from '@/pages/JoinByLinkPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { AdminPage } from '@/pages/AdminPage'
import { GuardianPage } from '@/pages/GuardianPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const AppRouter = () => (
  <BrowserRouter>
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          {/* Publicas */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Privadas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="todo" element={<TodoPage />} />
              <Route path="to-review" element={<ToReviewPage />} />
              <Route path="archived" element={<ArchivedPage />} />
              <Route path="join/:code" element={<JoinByLinkPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="seguimiento" element={<GuardianPage />} />

              {/* Solo admin */}
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminPage />} />
              </Route>

              {/* Curso con pestanas */}
              <Route path="courses/:courseId" element={<CoursePage />}>
                <Route index element={<StreamTab />} />
                <Route path="work" element={<ClassworkTab />} />
                <Route path="people" element={<PeopleTab />} />
                <Route path="grades" element={<GradesTab />} />
              </Route>

              {/* Detalle de un trabajo, fuera de las pestanas */}
              <Route
                path="courses/:courseId/work/:courseworkId"
                element={<CourseworkDetailPage />}
              />
            </Route>
          </Route>

          <Route path="/index.html" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  </BrowserRouter>
)
