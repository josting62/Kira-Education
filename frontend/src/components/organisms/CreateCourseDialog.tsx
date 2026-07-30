import { useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { createCourse } from '@/services/courseService'

interface CreateCourseDialogProps {
  onClose: () => void
  onCreated: () => void
}

export const CreateCourseDialog = ({ onClose, onCreated }: CreateCourseDialogProps) => {
  const [form, setForm] = useState({ name: '', section: '', subject: '', room: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createCourse({
        name: form.name,
        section: form.section || undefined,
        subject: form.subject || undefined,
        room: form.room || undefined,
      })
      onCreated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      title="Crear clase"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" form="create-course-form" type="submit" loading={loading}>
            Crear
          </Button>
        </>
      }
    >
      <form id="create-course-form" onSubmit={submit} className="flex flex-col gap-3.5">
        <Input
          label="Nombre de la clase (obligatorio)"
          name="name"
          required
          minLength={3}
          value={form.name}
          onChange={update('name')}
          placeholder="Ej: Tecnica en Programacion de Software"
        />
        <Input
          label="Seccion"
          name="section"
          value={form.section}
          onChange={update('section')}
          placeholder="Ej: Martes y Jueves"
        />
        <Input
          label="Materia"
          name="subject"
          value={form.subject}
          onChange={update('subject')}
          placeholder="Ej: Programacion"
        />
        <Input
          label="Sala"
          name="room"
          value={form.room}
          onChange={update('room')}
          placeholder="Ej: Sala 3"
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
