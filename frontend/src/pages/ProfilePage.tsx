import { useRef, useState } from 'react'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'
import { Input, Textarea } from '@/components/atoms/Input'
import { Toast } from '@/components/atoms/Toast'
import { Icon } from '@/assets/icons'
import { useAuth } from '@/hooks/useAuth'
import { changePassword, removeAvatar, updateProfile, uploadAvatar } from '@/services/userService'
import { formatDate } from '@/lib/dates'
import type { RoleSlug } from '@/types/models'

const ROLE_LABEL: Record<RoleSlug, string> = {
  admin: 'Administrador',
  teacher: 'Docente',
  student: 'Estudiante',
  guardian: 'Acudiente',
}

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth()
  const fileInput = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    firstName: user?.first_name ?? '',
    lastName: user?.last_name ?? '',
    bio: user?.bio ?? '',
    phone: user?.phone ?? '',
  })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [busy, setBusy] = useState<'profile' | 'password' | 'avatar' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!user) return null

  const fullName = `${user.first_name} ${user.last_name}`

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy('profile')
    try {
      await updateProfile(form)
      await refreshUser()
      setToast('Perfil actualizado')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (passwords.next !== passwords.confirm) {
      setError('La confirmacion no coincide con la nueva contrasena')
      return
    }
    setBusy('password')
    try {
      await changePassword(passwords.current, passwords.next)
      setPasswords({ current: '', next: '', confirm: '' })
      setToast('Contrasena actualizada')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const pickAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)
    setBusy('avatar')
    try {
      await uploadAvatar(file)
      await refreshUser()
      setToast('Foto actualizada')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(null)
      event.target.value = ''
    }
  }

  const clearAvatar = async () => {
    setBusy('avatar')
    try {
      await removeAvatar()
      await refreshUser()
      setToast('Foto eliminada')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="font-display mb-5 text-xl font-medium text-ink">Mi perfil</h1>

      {/* Identidad y foto */}
      <Card className="mb-4 flex flex-wrap items-center gap-4 p-5">
        <div className="relative">
          <Avatar name={fullName} src={user.avatar_url} size="lg" className="size-20 text-lg" />
          <button
            type="button"
            aria-label="Cambiar foto de perfil"
            title="Cambiar foto"
            onClick={() => fileInput.current?.click()}
            disabled={busy === 'avatar'}
            className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-line bg-surface text-icon-indigo shadow-card transition-colors hover:bg-hover disabled:opacity-50"
          >
            {busy === 'avatar' ? (
              <Icon.spinner className="size-4 animate-spin" aria-hidden />
            ) : (
              <Icon.camera className="size-4" aria-hidden />
            )}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => void pickAvatar(e)}
            className="hidden"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-lg font-medium text-ink">{fullName}</p>
            <Badge tone="accent">{ROLE_LABEL[user.role_slug]}</Badge>
            {user.status === 'inactive' && <Badge tone="danger">Inactivo</Badge>}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <Icon.mail className="size-3.5 text-icon-teal" aria-hidden />
            {user.email}
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">
            En Classroom desde {formatDate(user.created_at)}
          </p>
          {user.avatar_url && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1 -ml-3"
              onClick={() => void clearAvatar()}
            >
              Quitar foto
            </Button>
          )}
        </div>
      </Card>

      {/* Datos personales */}
      <Card className="mb-4 p-5">
        <h2 className="mb-4 text-sm font-medium text-ink">Datos personales</h2>
        <form onSubmit={saveProfile} className="flex flex-col gap-3.5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              name="firstName"
              required
              minLength={2}
              value={form.firstName}
              onChange={update('firstName')}
            />
            <Input
              label="Apellido"
              name="lastName"
              required
              minLength={2}
              value={form.lastName}
              onChange={update('lastName')}
            />
          </div>
          <Input
            label="Telefono"
            name="phone"
            value={form.phone}
            onChange={update('phone')}
            placeholder="300 123 4567"
          />
          <Textarea
            label="Sobre mi"
            name="bio"
            maxLength={280}
            value={form.bio}
            onChange={update('bio')}
            placeholder="Cuenta algo breve sobre ti"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={busy === 'profile'}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>

      {/* Contrasena */}
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-ink">
          <Icon.key className="size-4 text-icon-amber" aria-hidden />
          Cambiar contrasena
        </h2>
        <form onSubmit={savePassword} className="flex flex-col gap-3.5">
          <Input
            label="Contrasena actual"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nueva contrasena"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
            />
            <Input
              label="Confirmar"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" variant="secondary" loading={busy === 'password'}>
              Actualizar contrasena
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
