import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { cn } from '@/lib/cn'
import { createUser } from '@/services/adminService'
import type { Role, RoleSlug } from '@/types/models'

interface CreateUserDialogProps {
  roles: Role[]
  onClose: () => void
  onCreated: (message: string) => void
}

/** Alta de usuarios desde el modulo de administracion. */
export const CreateUserDialog = ({ roles, onClose, onCreated }: CreateUserDialogProps) => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [role, setRole] = useState<RoleSlug>('student')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const created = await createUser({ ...form, role })
      onCreated(`Usuario ${created.first_name} ${created.last_name} creado`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      title="Crear usuario"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" form="create-user-form" type="submit" loading={loading}>
            Crear
          </Button>
        </>
      }
    >
      <form id="create-user-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
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
          label="Correo electronico"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={update('email')}
          placeholder="nombre@classroom.test"
        />
        <Input
          label="Contrasena temporal"
          name="password"
          type="password"
          required
          minLength={6}
          value={form.password}
          onChange={update('password')}
        />

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-xs font-medium text-ink-soft">Rol</legend>
          {roles.map((option) => (
            <label
              key={option.slug}
              className={cn(
                'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors',
                role === option.slug
                  ? 'border-accent-400 bg-accent-50'
                  : 'border-line hover:bg-hover',
              )}
            >
              <input
                type="radio"
                name="role"
                value={option.slug}
                checked={role === option.slug}
                onChange={() => setRole(option.slug)}
                className="mt-0.5 accent-accent-500"
              />
              <span>
                <span className="block text-sm text-ink">{option.name}</span>
                {option.description && (
                  <span className="block text-[11px] text-ink-muted">{option.description}</span>
                )}
              </span>
            </label>
          ))}
        </fieldset>

        {error && (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  )
}
