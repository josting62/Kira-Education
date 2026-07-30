import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { IconButton } from '@/components/atoms/IconButton'
import { Input } from '@/components/atoms/Input'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import { linkGuardian, listGuardiansOf, unlinkGuardian } from '@/services/guardianService'
import type { User } from '@/types/models'

interface GuardianLinksDialogProps {
  student: User
  /** Usuarios con rol acudiente, para el desplegable. */
  guardians: User[]
  onClose: () => void
}

/**
 * Vincula acudientes con un estudiante. Solo administracion.
 * El acudiente vera despues un panel de solo lectura en /seguimiento.
 */
export const GuardianLinksDialog = ({
  student,
  guardians,
  onClose,
}: GuardianLinksDialogProps) => {
  const { data, reload } = useFetch(() => listGuardiansOf(student.id), [student.id])
  const [guardianId, setGuardianId] = useState('')
  const [relation, setRelation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
      reload()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const add = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!guardianId) return
    await run(async () => {
      await linkGuardian(Number(guardianId), student.id, relation || undefined)
      setGuardianId('')
      setRelation('')
    })
  }

  // Los que aun no estan vinculados.
  const linkedIds = new Set((data ?? []).map((link) => link.guardian_id))
  const available = guardians.filter((guardian) => !linkedIds.has(guardian.id))

  return (
    <Dialog
      title={`Acudientes de ${student.first_name} ${student.last_name}`}
      onClose={onClose}
      footer={
        <Button size="sm" onClick={onClose}>
          Listo
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {data && data.length > 0 ? (
          <ul className="divide-y divide-line">
            {data.map((link) => (
              <li key={link.id} className="density-row flex items-center gap-3 py-2.5">
                <Icon.invite className="size-4 shrink-0 text-icon-indigo" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{link.guardian_name}</span>
                  <span className="block truncate text-[11px] text-ink-muted">
                    {link.guardian_email}
                    {link.relation && ` - ${link.relation}`}
                  </span>
                </span>
                <IconButton
                  icon="delete"
                  label={`Desvincular ${link.guardian_name}`}
                  className="size-8 text-danger"
                  disabled={busy}
                  onClick={() => void run(() => unlinkGuardian(link.guardian_id, student.id))}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Este estudiante no tiene acudientes vinculados.</p>
        )}

        <form onSubmit={add} className="flex flex-col gap-3 border-t border-line pt-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="guardian" className="text-xs font-medium text-ink-soft">
              Vincular un acudiente
            </label>
            <select
              id="guardian"
              value={guardianId}
              onChange={(e) => setGuardianId(e.target.value)}
              className="w-full rounded-lg border border-line bg-field px-3 py-2 text-sm text-ink focus:border-accent-400 focus:outline-none"
            >
              <option value="">Elige un acudiente</option>
              {available.map((guardian) => (
                <option key={guardian.id} value={guardian.id}>
                  {guardian.first_name} {guardian.last_name} ({guardian.email})
                </option>
              ))}
            </select>
            {available.length === 0 && (
              <p className="text-[11px] text-ink-muted">
                No hay mas usuarios con rol Acudiente. Crealos desde "Crear usuario".
              </p>
            )}
          </div>

          <Input
            label="Parentesco (opcional)"
            name="relation"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="Madre, padre, tutor..."
          />

          <div className="flex justify-end">
            <Button type="submit" size="sm" loading={busy} disabled={!guardianId}>
              Vincular
            </Button>
          </div>
        </form>

        {error && (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  )
}
