import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/templates/AuthLayout'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Icon } from '@/assets/icons'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/cn'
import type { RoleSlug } from '@/types/models'

const ROLES: { slug: RoleSlug; label: string; hint: string }[] = [
  { slug: 'student', label: 'Estudiante', hint: 'Me uno a clases y entrego trabajo' },
  { slug: 'teacher', label: 'Docente', hint: 'Creo clases y califico' },
  { slug: 'guardian', label: 'Acudiente', hint: 'Consulto el progreso' },
]

export const RegisterPage = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
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
      await register({ ...form, role })
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Crear cuenta"
      subtitle="Simulador academico de Google Classroom"
      footer={
        <>
          Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-accent-600 hover:underline">
            Inicia sesion
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nombre" name="firstName" required value={form.firstName} onChange={update('firstName')} />
          <Input label="Apellido" name="lastName" required value={form.lastName} onChange={update('lastName')} />
        </div>
        <Input
          label="Correo electronico"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={update('email')}
        />
        <Input
          label="Contrasena"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={form.password}
          onChange={update('password')}
        />

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1 text-xs font-medium text-ink-soft">Tipo de cuenta</legend>
          {ROLES.map((option) => (
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
                <span className="block text-sm text-ink">{option.label}</span>
                <span className="block text-[11px] text-ink-muted">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger"
          >
            <Icon.error className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Crear cuenta
        </Button>
      </form>
    </AuthLayout>
  )
}
