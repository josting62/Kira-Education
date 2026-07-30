import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Avatar } from '@/components/atoms/Avatar'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Card } from '@/components/atoms/Card'
import { Input, Textarea } from '@/components/atoms/Input'
import { PageSpinner } from '@/components/atoms/Spinner'
import { IconButton } from '@/components/atoms/IconButton'
import { EmptyState } from '@/components/molecules/EmptyState'
import { AttachmentList } from '@/components/molecules/AttachmentList'
import { AttachmentPicker } from '@/components/molecules/AttachmentPicker'
import { CommentThread } from '@/components/molecules/CommentThread'
import { Icon } from '@/assets/icons'
import { useFetch } from '@/hooks/useFetch'
import {
  addAttachmentLink,
  deleteAttachment,
  deleteSubmissionFile,
  getCourseworkDetail,
  isTeacherDetail,
  reclaim,
  returnGrade,
  saveDraftGrade,
  turnIn,
  uploadAttachment,
  uploadSubmissionFile,
  type StudentCourseworkDetail,
  type TeacherCourseworkDetail,
  type TeacherSubmission,
} from '@/services/courseworkService'
import { formatDueDate } from '@/lib/dates'
import type { Attachment, SubmissionState } from '@/types/models'

const STATE_LABEL: Record<SubmissionState, string> = {
  assigned: 'Asignado',
  turned_in: 'Entregado',
  returned: 'Calificado',
  reclaimed: 'Retirado',
}

/** Panel del estudiante: entregar o retirar, y ver su nota. */
const StudentPanel = ({
  detail,
  onChange,
}: {
  detail: StudentCourseworkDetail
  onChange: () => void
}) => {
  const { coursework, submission, submissionAttachments } = detail
  const [answer, setAnswer] = useState(submission?.answer_text ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const state = submission?.state ?? 'assigned'
  const turnedIn = state === 'turned_in' || state === 'returned'

  const act = async (fn: () => Promise<unknown>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
      onChange()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (coursework.type === 'material') {
    return (
      <Card className="p-4">
        <p className="text-sm text-ink-soft">Este es material de apoyo, no requiere entrega.</p>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Tu trabajo</p>
        <Badge tone={state === 'returned' ? 'success' : turnedIn ? 'accent' : 'neutral'}>
          {STATE_LABEL[state]}
        </Badge>
      </div>

      {submission?.grade !== null && submission?.grade !== undefined && (
        <p className="text-2xl font-medium text-ink">
          {submission.grade}
          <span className="text-sm text-ink-muted">/{coursework.max_points}</span>
        </p>
      )}

      {coursework.type === 'question' && !turnedIn && (
        <Textarea
          label="Tu respuesta"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribe tu respuesta"
        />
      )}

      {submission?.answer_text && turnedIn && (
        <p className="rounded-lg bg-hover px-3 py-2 text-sm text-ink-soft">
          {submission.answer_text}
        </p>
      )}

      {/* Archivos que el estudiante adjunta a su entrega */}
      <AttachmentList
        attachments={submissionAttachments}
        busy={busy}
        // Ya calificado: la entrega queda bloqueada.
        onRemove={
          state === 'returned'
            ? undefined
            : (attachment) =>
                void act(() => deleteSubmissionFile(coursework.id, attachment.id))
        }
      />

      {state !== 'returned' && (
        <AttachmentPicker
          busy={busy}
          onPickFile={(file) => void act(() => uploadSubmissionFile(coursework.id, file))}
          hint="Adjunta tu trabajo. Maximo 15 MB por archivo."
        />
      )}

      {submission?.is_late === 1 && <Badge tone="danger">Entregado con retraso</Badge>}

      {error && (
        <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      {/* Comentarios privados con el docente. Necesitan una entrega ya creada:
          se crea sola al adjuntar un archivo o al entregar. */}
      {submission ? (
        <div className="border-t border-line pt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
            <Icon.lock className="size-3.5 text-icon-amber" aria-hidden />
            Comentarios privados
          </p>
          <CommentThread
            targetType="submission"
            targetId={submission.id}
            placeholder="Escribe a tu docente"
          />
        </div>
      ) : (
        <p className="border-t border-line pt-3 text-[11px] text-ink-muted">
          Podras escribir comentarios privados a tu docente en cuanto adjuntes algo o entregues.
        </p>
      )}

      {turnedIn ? (
        <Button
          variant="secondary"
          loading={busy}
          disabled={state === 'returned'}
          onClick={() => void act(() => reclaim(coursework.id))}
        >
          {state === 'returned' ? 'Ya calificado' : 'Retirar la entrega'}
        </Button>
      ) : (
        <Button
          loading={busy}
          onClick={() => void act(() => turnIn(coursework.id, answer || undefined))}
        >
          <Icon.send className="size-4" aria-hidden />
          Entregar
        </Button>
      )}
    </Card>
  )
}

/** Panel del docente: contadores y calificacion por alumno. */
const TeacherPanel = ({
  detail,
  onChange,
}: {
  detail: TeacherCourseworkDetail
  onChange: () => void
}) => {
  const { coursework, submissions, stats } = detail
  const [grades, setGrades] = useState<Record<number, string>>({})
  const [busyId, setBusyId] = useState<number | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** Nota escrita, o la que ya haya guardada (nota o borrador). */
  const valueFor = (submission: TeacherSubmission) =>
    grades[submission.student_id] ??
    (submission.grade ?? submission.draft_grade ?? '').toString()

  const act = async (studentId: number, fn: () => Promise<unknown>) => {
    setError(null)
    setBusyId(studentId)
    try {
      await fn()
      onChange()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  /** Guarda la nota sin devolverla: el alumno todavia no la ve. */
  const saveDraft = (submission: TeacherSubmission) => {
    const value = Number(valueFor(submission))
    if (Number.isNaN(value)) return
    return act(submission.student_id, () =>
      saveDraftGrade(coursework.id, submission.student_id, value),
    )
  }

  const submit = (submission: TeacherSubmission) => {
    const value = Number(valueFor(submission))
    if (Number.isNaN(value)) return
    return act(submission.student_id, () =>
      returnGrade(coursework.id, submission.student_id, value),
    )
  }

  /** Entregas con nota (escrita o en borrador) que aun no se han devuelto. */
  const pendingBulk = submissions.filter(
    (submission) => submission.state !== 'returned' && valueFor(submission) !== '',
  )

  const returnAll = async () => {
    setError(null)
    setBulkBusy(true)
    try {
      for (const submission of pendingBulk) {
        const value = Number(valueFor(submission))
        if (Number.isNaN(value)) continue
        await returnGrade(coursework.id, submission.student_id, value)
      }
      setGrades({})
      onChange()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBulkBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {stats && (
        <Card className="flex divide-x divide-line px-4 py-3">
          {[
            ['Entregado', stats.turned_in],
            ['Asignado', stats.assigned],
            ['Calificado', stats.graded],
          ].map(([label, value]) => (
            <div key={label as string} className="flex-1 px-3 first:pl-0">
              <p className="text-xl font-medium text-ink">{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          ))}
        </Card>
      )}

      {/* Devolver en lote todo lo que tenga nota puesta */}
      {pendingBulk.length > 0 && (
        <Card className="flex flex-wrap items-center gap-3 px-4 py-3">
          <p className="min-w-0 flex-1 text-xs text-ink-soft">
            {pendingBulk.length} {pendingBulk.length === 1 ? 'entrega' : 'entregas'} con nota sin
            devolver.
          </p>
          <Button size="sm" loading={bulkBusy} onClick={() => void returnAll()}>
            <Icon.send className="size-4" aria-hidden />
            Devolver todas
          </Button>
        </Card>
      )}

      <Card className="overflow-hidden">
        {submissions.length === 0 ? (
          <EmptyState icon="people" title="Aun no hay alumnos con entregas" />
        ) : (
          submissions.map((submission) => {
            const open = expanded === submission.id
            return (
              <div key={submission.id} className="border-b border-line px-4 py-3 last:border-b-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Avatar name={submission.student_name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {submission.student_name}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {STATE_LABEL[submission.state]}
                      {submission.is_late === 1 && ' - con retraso'}
                      {submission.draft_grade !== null && submission.state !== 'returned' && (
                        <span className="text-warning"> - borrador {submission.draft_grade}</span>
                      )}
                      {submission.attachments.length > 0 &&
                        ` - ${submission.attachments.length} ${
                          submission.attachments.length === 1 ? 'archivo' : 'archivos'
                        }`}
                    </span>
                  </span>

                  {coursework.max_points !== null && (
                    <>
                      <Input
                        aria-label={`Nota de ${submission.student_name}`}
                        type="number"
                        min={0}
                        max={coursework.max_points}
                        className="w-20"
                        placeholder="--"
                        value={valueFor(submission)}
                        onChange={(e) =>
                          setGrades((prev) => ({
                            ...prev,
                            [submission.student_id]: e.target.value,
                          }))
                        }
                      />
                      {/* El nombre del alumno va en el aria-label: con varias
                          filas iguales hace falta para distinguirlas. */}
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Guardar borrador de ${submission.student_name}`}
                        title="Guardar sin que el alumno la vea"
                        loading={busyId === submission.student_id}
                        disabled={valueFor(submission) === ''}
                        onClick={() => void saveDraft(submission)}
                      >
                        Borrador
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        aria-label={`Devolver la nota de ${submission.student_name}`}
                        loading={busyId === submission.student_id}
                        disabled={valueFor(submission) === ''}
                        onClick={() => void submit(submission)}
                      >
                        Devolver
                      </Button>
                    </>
                  )}

                  <IconButton
                    icon={open ? 'chevronDown' : 'chevronRight'}
                    label={`Ver el trabajo de ${submission.student_name}`}
                    onClick={() => setExpanded(open ? null : submission.id)}
                  />
                </div>

                {open && (
                  <div className="mt-2 flex flex-col gap-3 pl-10">
                    {/* Respuesta escrita, en las preguntas */}
                    {submission.answer_text && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-ink-soft">Su respuesta</p>
                        <p className="whitespace-pre-line rounded-lg bg-hover px-3 py-2 text-sm text-ink-soft">
                          {submission.answer_text}
                        </p>
                      </div>
                    )}

                    {submission.attachments.length > 0 && (
                      <AttachmentList attachments={submission.attachments} />
                    )}

                    {!submission.answer_text && submission.attachments.length === 0 && (
                      <p className="text-xs text-ink-muted">
                        Este alumno todavia no ha adjuntado nada.
                      </p>
                    )}

                    <div className="border-t border-line pt-2">
                      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                        <Icon.lock className="size-3.5 text-icon-amber" aria-hidden />
                        Comentarios privados con {submission.student_name.split(' ')[0]}
                      </p>
                      <CommentThread
                        targetType="submission"
                        targetId={submission.id}
                        placeholder="Escribe a tu alumno"
                      />
                    </div>
                  </div>
                )}

                {/* Resumen de archivos cuando la fila esta plegada */}
                {!open && submission.attachments.length > 0 && (
                  <div className="mt-1 pl-10">
                    <AttachmentList attachments={submission.attachments} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </Card>

      {error && (
        <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Documentos y enlaces de la tarea. El docente puede anadir y quitar;
 * el estudiante solo los ve y los descarga.
 */
const CourseworkAttachments = ({
  courseworkId,
  attachments,
  canEdit,
  onChange,
}: {
  courseworkId: number
  attachments: Attachment[]
  canEdit: boolean
  onChange: () => void
}) => {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const act = async (fn: () => Promise<unknown>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
      onChange()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (attachments.length === 0 && !canEdit) return null

  return (
    <Card className="p-4">
      <p className="mb-1 text-sm font-medium text-ink">
        {attachments.length > 0 ? 'Material de la tarea' : 'Adjuntar material'}
      </p>

      <AttachmentList
        attachments={attachments}
        busy={busy}
        onRemove={
          canEdit
            ? (attachment) => void act(() => deleteAttachment(courseworkId, attachment.id))
            : undefined
        }
      />

      {canEdit && (
        <div className="mt-2">
          <AttachmentPicker
            busy={busy}
            onPickFile={(file) => void act(() => uploadAttachment(courseworkId, file))}
            onAddLink={(link) => void act(() => addAttachmentLink(courseworkId, link))}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
    </Card>
  )
}

export const CourseworkDetailPage = () => {
  const { courseId, courseworkId } = useParams()
  const id = Number(courseworkId)
  const { data, loading, error, reload } = useFetch(() => getCourseworkDetail(id), [id])

  if (loading) return <PageSpinner />
  if (error || !data) {
    return <EmptyState icon="error" title="No se pudo abrir el trabajo" description={error ?? ''} />
  }

  const { coursework, attachments } = data

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        to={`/courses/${courseId}/work`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-accent-600"
      >
        <Icon.back className="size-4" aria-hidden />
        Volver al trabajo en clase
      </Link>

      <div className="mb-5 flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-500 text-white">
          <Icon.assignment className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-medium leading-tight text-ink">{coursework.title}</h1>
          <p className="mt-1 text-xs text-ink-muted">
            {coursework.author_name}
            {coursework.max_points !== null && ` - ${coursework.max_points} puntos`}
          </p>
          {coursework.due_at && (
            <Badge tone="accent" className="mt-2">
              {formatDueDate(coursework.due_at)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-4">
          {coursework.instructions && (
            <Card className="p-4">
              <p className="whitespace-pre-line text-sm text-ink-soft">{coursework.instructions}</p>
            </Card>
          )}

          <CourseworkAttachments
            courseworkId={coursework.id}
            attachments={attachments}
            canEdit={isTeacherDetail(data)}
            onChange={reload}
          />

          {isTeacherDetail(data) && <TeacherPanel detail={data} onChange={reload} />}
        </div>

        {!isTeacherDetail(data) && <StudentPanel detail={data} onChange={reload} />}
      </div>
    </div>
  )
}
