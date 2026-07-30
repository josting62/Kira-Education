import multer from 'multer'
import path from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { HttpError } from '../utils/httpError.ts'

/** Carpeta fisica donde viven los archivos subidos. */
export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')

/** Prefijo publico. Va bajo /api para que el proxy de Vite lo cubra. */
export const UPLOADS_PUBLIC_PATH = '/api/uploads'

if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

// -------------------------------------------------------------
// Imagenes (avatares y encabezados de clase)
// -------------------------------------------------------------

const IMAGE_TYPES = new Map([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/svg+xml', '.svg'],
])

// -------------------------------------------------------------
// Documentos (adjuntos de tareas y entregas)
// -------------------------------------------------------------

const DOCUMENT_TYPES = new Map([
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/vnd.ms-excel', '.xls'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
  ['application/vnd.ms-powerpoint', '.ppt'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
  ['text/plain', '.txt'],
  ['text/csv', '.csv'],
  ['application/zip', '.zip'],
  ['application/x-zip-compressed', '.zip'],
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
])

const DOCUMENT_LABEL = 'PDF, Word, Excel, PowerPoint, TXT, CSV, ZIP, PNG, JPG o WEBP'

const storageFor = (types: Map<string, string>) =>
  multer.diskStorage({
    destination: (_req, _file, done) => done(null, UPLOADS_DIR),
    // Nombre aleatorio en disco: el nombre original se guarda en la base de
    // datos (attachments.title), asi no hay colisiones ni rutas manipulables.
    filename: (_req, file, done) => {
      const ext = types.get(file.mimetype) ?? '.bin'
      done(null, `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`)
    },
  })

/** Un archivo, maximo 4 MB, solo imagenes. */
export const uploadImage = multer({
  storage: storageFor(IMAGE_TYPES),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!IMAGE_TYPES.has(file.mimetype)) {
      done(HttpError.badRequest('Formato no admitido. Usa PNG, JPG, WEBP o SVG.'))
      return
    }
    done(null, true)
  },
}).single('image')

/** Un archivo, maximo 15 MB, documentos e imagenes. */
export const uploadDocument = multer({
  storage: storageFor(DOCUMENT_TYPES),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!DOCUMENT_TYPES.has(file.mimetype)) {
      done(HttpError.badRequest(`Formato no admitido. Usa ${DOCUMENT_LABEL}.`))
      return
    }
    done(null, true)
  },
}).single('file')

/** Convierte el nombre de archivo guardado en la URL publica. */
export const publicUrlFor = (filename: string) => `${UPLOADS_PUBLIC_PATH}/${filename}`

/** Nombre en disco a partir de una URL publica, para poder borrar el archivo. */
export const filenameFromUrl = (url: string): string | null => {
  if (!url.startsWith(`${UPLOADS_PUBLIC_PATH}/`)) return null
  const filename = path.basename(url)
  // Solo aceptamos el patron que genera storageFor: nada de rutas relativas.
  return /^\d+-[0-9a-f]{12}\.[a-z0-9]+$/i.test(filename) ? filename : null
}
