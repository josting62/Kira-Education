import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { joinCourse } from '@/services/courseService'

interface JoinCourseDialogProps {
  onClose: () => void
  onJoined: () => void
}

export const JoinCourseDialog = ({ onClose, onJoined }: JoinCourseDialogProps) => {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await joinCourse(code.trim().toLowerCase())
      onJoined()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      title="Unirse a una clase"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" form="join-course-form" type="submit" loading={loading}>
            Unirse
          </Button>
        </>
      }
    >
      <form id="join-course-form" onSubmit={submit} className="flex flex-col gap-3">
        <p className="text-xs text-ink-muted">
          Pide a tu docente el codigo de la clase: 8 letras o numeros.
        </p>
        <Input
          label="Codigo de la clase"
          name="code"
          required
          minLength={8}
          maxLength={8}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6gmc6sgt"
          className="font-mono tracking-wider"
        />
        {error && (
          <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
      </form>
    </Dialog>
  )
}
