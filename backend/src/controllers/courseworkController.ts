import type { Request, Response } from 'express'
import * as cwService from '../services/courseworkService.ts'
import * as subService from '../services/submissionService.ts'

export const listByCourse = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await cwService.listByCourse(Number(req.params.courseId), req.user!) })
}

export const detail = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await cwService.detail(Number(req.params.id), req.user!) })
}

export const create = async (req: Request, res: Response) => {
  const data = await cwService.create(Number(req.params.courseId), req.user!, req.body)
  res.status(201).json({ ok: true, data })
}

export const update = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await cwService.update(Number(req.params.id), req.user!, req.body) })
}

export const publish = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await cwService.publish(Number(req.params.id), req.user!) })
}

export const remove = async (req: Request, res: Response) => {
  await cwService.remove(Number(req.params.id), req.user!)
  res.json({ ok: true, message: 'Trabajo eliminado' })
}

export const pendingForMe = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await cwService.pendingForMe(req.user!) })
}

// ---------- Temas ----------

export const createTopic = async (req: Request, res: Response) => {
  const data = await cwService.createTopic(Number(req.params.courseId), req.user!, req.body.title)
  res.status(201).json({ ok: true, data })
}

export const removeTopic = async (req: Request, res: Response) => {
  await cwService.removeTopic(Number(req.params.courseId), req.user!, Number(req.params.topicId))
  res.json({ ok: true, message: 'Tema eliminado' })
}

// ---------- Entregas ----------

export const turnIn = async (req: Request, res: Response) => {
  const data = await subService.turnIn(Number(req.params.id), req.user!, req.body.answerText)
  res.json({ ok: true, data })
}

export const reclaim = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await subService.reclaim(Number(req.params.id), req.user!) })
}

export const saveDraftGrade = async (req: Request, res: Response) => {
  const { studentId, grade } = req.body
  const data = await subService.saveDraftGrade(Number(req.params.id), req.user!, studentId, grade)
  res.json({ ok: true, data })
}

export const returnGrade = async (req: Request, res: Response) => {
  const { studentId, grade } = req.body
  const data = await subService.returnGrade(Number(req.params.id), req.user!, studentId, grade)
  res.json({ ok: true, data })
}

export const unpublish = async (req: Request, res: Response) => {
  const data = await cwService.unpublish(Number(req.params.id), req.user!)
  res.json({ ok: true, data })
}

// ---------- Temas ----------

export const listTopics = async (req: Request, res: Response) => {
  const data = await cwService.listTopics(Number(req.params.courseId), req.user!)
  res.json({ ok: true, data })
}

export const renameTopic = async (req: Request, res: Response) => {
  const data = await cwService.renameTopic(
    Number(req.params.courseId),
    req.user!,
    Number(req.params.topicId),
    req.body.title,
  )
  res.json({ ok: true, data })
}

export const reorderTopics = async (req: Request, res: Response) => {
  const data = await cwService.reorderTopics(
    Number(req.params.courseId),
    req.user!,
    req.body.order,
  )
  res.json({ ok: true, data })
}

// ---------- Reutilizar publicacion ----------

export const listReusable = async (req: Request, res: Response) => {
  const data = await cwService.listReusable(Number(req.params.courseId), req.user!)
  res.json({ ok: true, data })
}

export const reuse = async (req: Request, res: Response) => {
  const data = await cwService.reuse(
    Number(req.params.courseId),
    req.user!,
    req.body.sourceId,
    req.body.topicId ?? null,
  )
  res.status(201).json({ ok: true, data })
}

export const toReview = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await subService.toReview(req.user!) })
}

/**
 * Libreta en CSV. Una fila por alumno y una columna por trabajo, igual que
 * la tabla que se ve en pantalla. Con BOM para que Excel lea bien los acentos.
 */
export const gradebookCsv = async (req: Request, res: Response) => {
  const courseId = Number(req.params.courseId)
  const rows = await subService.gradebook(courseId, req.user!)

  // Columnas: los trabajos, en el orden en que aparecen.
  const works = new Map<number, string>()
  const students = new Map<number, { name: string; grades: Map<number, number | null> }>()

  for (const row of rows) {
    works.set(row.coursework_id, row.coursework_title)
    const student =
      students.get(row.student_id) ??
      { name: row.student_name, grades: new Map<number, number | null>() }
    student.grades.set(row.coursework_id, row.grade)
    students.set(row.student_id, student)
  }

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const workIds = [...works.keys()]

  const lines = [
    ['Alumno', ...workIds.map((id) => works.get(id)!)].map(escape).join(','),
    ...[...students.values()].map((student) =>
      [
        escape(student.name),
        ...workIds.map((id) => {
          const grade = student.grades.get(id)
          return grade === null || grade === undefined ? '' : String(grade)
        }),
      ].join(','),
    ),
  ]

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="libreta-clase-${courseId}.csv"`)
  // Excel necesita la marca BOM al inicio para leer bien los acentos.
  const bom = String.fromCharCode(0xfeff)
  res.send(`${bom}${lines.join('\r\n')}\r\n`)
}

export const gradebook = async (req: Request, res: Response) => {
  res.json({ ok: true, data: await subService.gradebook(Number(req.params.courseId), req.user!) })
}
