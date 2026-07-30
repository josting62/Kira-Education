import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '@/components/templates/AuthLayout'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Icon } from '@/assets/icons'
import { useAuth } from '@/hooks/useAuth'

/** Cuentas sembradas por 002_seed.sql, para entrar rapido durante el desarrollo. */
const DEMO_ACCOUNTS = [
  { label: 'Docente', email: 'gersson@classroom.test' },
  { label: 'Estudiante', email: 'jostin@classroom.test' },
  { label: 'Admin', email: 'admin@classroom.test' },
]

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Inicia sesion"
      subtitle="Simulador academico de Google Classroom"
      footer={
        <>
          No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-accent-600 hover:underline">
            Registrate
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Correo electronico"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
        <Input
          label="Contrasena"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="******"
        />

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger"
          >
            <Icon.error className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Button type="submit" loading={loading} className="mt-1 w-full">
          Entrar
        </Button>
      </form>

      <div className="mt-6 border-t border-line pt-4">
        <p className="mb-2 text-[11px] text-ink-muted">
          Cuentas de prueba (contrasena <code className="text-ink-soft">123456</code>):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setEmail(account.email)
                setPassword('123456')
              }}
            >
              {account.label}
            </Button>
          ))}
        </div>
      </div>
    </AuthLayout>
  )
}
