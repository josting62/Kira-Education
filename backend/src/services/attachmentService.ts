import { unlink } from 'node:fs/promises'
import path from 'node:path'
import * as streamRepo from '../repositories/streamRepository.ts'
import * as cwRepo from '../repositories/courseworkRepository.ts'
import * as subRepo from '../repositories/submissionRepository.ts'
import { requireMembership, requireTeacher } from './courseService.ts'
import { UPLOADS_DIR, filenameFromUrl, publicUrlFor } from '../config/uploads.ts'
import { HttpError } from '../utils/httpError.ts'
import type { Attachment, AttachmentKind, AuthPayload } from '../types/models.ts'

const loadCoursework = async (courseworkId: number) => {
  const item = await cwRepo.findById(courseworkId)
  if (!item) throw HttpError.notFound('El trabajo no existe')
  return item
}

/** Borra el archivo del disco si el adjunto era una subida nuestra. */
const removeFileIfLocal = async (attachment: Attachment) => {
  const filename = filenameFromUrl(attachment.url)
  if (!filename) return
  // Si el archivo ya no esta, no es un error: el registro se borra igual.
  await unlink(path.join(UPLOADS_DIR, filename)).catch(() => undefined)
}

// =============================================================
//  Adjuntos de la tarea (los pone el docente)
// =============================================================

export const listForCoursework = async (courseworkId: number, user: AuthPayload) => {
  const item = await loadCoursework(courseworkId)
  await requireMembership(item.course_id, user)
  return streamRepo.listAttachments('coursework', courseworkId)
}

/** Adjunto por enlace: Drive, YouTube o URL suelta. */
export const addLink = async (
  courseworkId: number,
  user: AuthPayload,
  data: { kind: 'link' | 'drive' | 'youtube'; title: string; url: string },
) => {
  const item = await loadCoursework(courseworkId)
  await requireTeacher(item.course_id, user)

  const id = await streamRepo.createAttachment({
    ownerType: 'coursework',
    ownerId: courseworkId,
    ...data,
  })
  return { id, owner_type: 'coursework', owner_id: courseworkId, ...data }
}

/** Adjunto por archivo subido. El nombre original se guarda como titulo. */
export const addFile = async (
  courseworkId: number,
  user: AuthPayload,
  file: Express.Multer.File,
) => {
  const item = await loadCoursework(courseworkId)
  await requireTeacher(item.course_id, user)

  const id = await streamRepo.createAttachment({
    ownerType: 'coursework',
    ownerId: courseworkId,
    kind: 'file',
    title: originalName(file),
    url: publicUrlFor(file.filename),
    mimeType: file.mimetype,
    sizeBytes: file.size,
  })

  return streamRepo.findAttachment(id)
}

export const removeFromCoursework = async (
  courseworkId: number,
  user: AuthPayload,
  attachmentId: number,
) => {
  const item = await loadCoursework(courseworkId)
  await requireTeacher(item.course_id, user)

  const attachment = await streamRepo.findAttachment(attachmentId)
  if (!attachment || attachment.owner_type !== 'coursework' || attachment.owner_id !== courseworkId) {
    throw HttpError.notFound('El adjunto no pertenece a esta tarea')
  }

  await removeFileIfLocal(attachment)
  await streamRepo.removeAttachment(attachmentId)
}

// =============================================================
//  Adjuntos de la entrega (los pone el estudiante)
// =============================================================

/** Crea la entrega si hace falta y devuelve su id. */
const ownSubmissionId = async (courseworkId: number, user: AuthPayload): Promise<number> => {
  const item = await loadCoursework(courseworkId)
  const role = await requireMembership(item.course_id, user)
  if (role !== 'student') throw HttpError.forbidden('Solo los estudiantes adjuntan su trabajo')
  if (item.type === 'material') throw HttpError.badRequest('El material no se entrega')

  const existing = await subRepo.findOne(courseworkId, user.id)
  if (existing) {
    if (existing.state === 'returned') {
      throw HttpError.badRequest('La entrega ya fue calificada: no se puede modificar')
    }
    return existing.id
  }

  await subRepo.ensure(courseworkId, user.id)
  const created = await subRepo.findOne(courseworkId, user.id)
  if (!created) throw HttpError.badRequest('No se pudo preparar la entrega')
  return created.id
}

export const addFileToSubmission = async (
  courseworkId: number,
  user: AuthPayload,
  file: Express.Multer.File,
) => {
  const submissionId = await ownSubmissionId(courseworkId, user)

  const id = await streamRepo.createAttachment({
    ownerType: 'submission',
    ownerId: submissionId,
    kind: 'file',
    title: originalName(file),
    url: publicUrlFor(file.filename),
    mimeType: file.mimetype,
    sizeBytes: file.size,
  })

  return streamRepo.findAttachment(id)
}

export const removeFromSubmission = async (
  courseworkId: number,
  user: AuthPayload,
  attachmentId: number,
) => {
  const submissionId = await ownSubmissionId(courseworkId, user)

  const attachment = await streamRepo.findAttachment(attachmentId)
  if (!attachment || attachment.owner_type !== 'submission' || attachment.owner_id !== submissionId) {
    throw HttpError.notFound('El adjunto no pertenece a tu entrega')
  }

  await removeFileIfLocal(attachment)
  await streamRepo.removeAttachment(attachmentId)
}

/**
 * multer entrega el nombre original en latin1; lo pasamos a UTF-8 para que
 * los acentos y las enes se guarden bien.
 */
const originalName = (file: Express.Multer.File): string => {
  const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8')
  return decoded.slice(0, 180)
}

export type { AttachmentKind }
