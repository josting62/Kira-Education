/**
 * Formatos que acepta el backend para los adjuntos de tareas y entregas.
 * Debe coincidir con DOCUMENT_TYPES de backend/src/config/uploads.ts
 */
export const DOCUMENT_ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/webp',
].join(',')

/** Colores de tema disponibles al personalizar una clase (tonos sobrios). */
export const COURSE_COLORS = [
  { value: '#4C5B8A', label: 'Indigo' },
  { value: '#3F6B63', label: 'Verde' },
  { value: '#5B6472', label: 'Gris' },
  { value: '#7A5C4B', label: 'Marron' },
  { value: '#8C5F6E', label: 'Rosa' },
  { value: '#5F6B45', label: 'Oliva' },
  { value: '#A8762F', label: 'Ambar' },
  { value: '#6B5B8A', label: 'Violeta' },
] as const

/**
 * Galeria de encabezados. Los SVG viven en frontend/public/banners,
 * asi la URL guardada en la base de datos es estable.
 */
export const BANNER_GALLERY = [
  { url: '/banners/code.svg', label: 'Codigo', color: '#4C5B8A' },
  { url: '/banners/books.svg', label: 'Libros', color: '#3F6B63' },
  { url: '/banners/grid.svg', label: 'Rejilla', color: '#5B6472' },
  { url: '/banners/dots.svg', label: 'Puntos', color: '#7A5C4B' },
  { url: '/banners/waves.svg', label: 'Ondas', color: '#8C5F6E' },
  { url: '/banners/leaves.svg', label: 'Hojas', color: '#5F6B45' },
] as const
