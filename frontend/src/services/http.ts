/** Cliente HTTP minimo sobre fetch. Envia cookies y desempaqueta { ok, data }. */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export const OFFLINE_MESSAGE =
  'No hay conexion con la API. Inicia MySQL en XAMPP y ejecuta "npm run dev".'

export class ApiError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

/** true cuando el fallo fue de conexion, no una respuesta de la API. */
export const isOffline = (error: unknown) => error instanceof ApiError && error.status === 0

/** Ping al endpoint de salud. Lo usa el aviso global de "API caida". */
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/health`, { credentials: 'include' })
    const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null
    return response.ok && payload?.ok === true
  } catch {
    return false
  }
}

interface ApiEnvelope<T> {
  ok: boolean
  data?: T
  message?: string
  details?: unknown
}

const send = async <T>(path: string, init: RequestInit): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...init })
  } catch {
    throw new ApiError(0, OFFLINE_MESSAGE)
  }

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

  // Si el proxy de Vite no alcanza la API, la respuesta no es JSON: lo tratamos
  // como "API caida" en lugar de mostrar un error genérico.
  if (payload === null && response.status >= 500) {
    throw new ApiError(0, OFFLINE_MESSAGE)
  }

  if (!response.ok || !payload?.ok) {
    throw new ApiError(
      response.status,
      payload?.message ?? 'Ocurrio un error inesperado',
      payload?.details,
    )
  }

  return payload.data as T
}

const withJson = <T>(method: string, path: string, body?: unknown) =>
  send<T>(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export const http = {
  get: <T>(path: string) => withJson<T>('GET', path),
  post: <T>(path: string, body?: unknown) => withJson<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => withJson<T>('PATCH', path, body),
  delete: <T>(path: string) => withJson<T>('DELETE', path),

  /**
   * Sube un archivo con multipart/form-data.
   * No fijamos Content-Type a proposito: el navegador anade el boundary.
   *
   * `field` debe coincidir con lo que espera el backend:
   *   'image' para avatares y encabezados, 'file' para documentos.
   */
  upload: <T>(
    path: string,
    file: File,
    fields: Record<string, string> = {},
    field: 'image' | 'file' = 'image',
  ) => {
    const form = new FormData()
    form.append(field, file)
    for (const [key, value] of Object.entries(fields)) form.append(key, value)
    return send<T>(path, { method: 'POST', body: form })
  },
}
