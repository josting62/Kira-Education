/** Error con codigo HTTP, para que el middleware de errores lo traduzca. */
export class HttpError extends Error {
  readonly status: number
  readonly details?: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }

  static badRequest(message = 'Solicitud invalida', details?: unknown) {
    return new HttpError(400, message, details)
  }
  static unauthorized(message = 'No autenticado') {
    return new HttpError(401, message)
  }
  static forbidden(message = 'No tienes permiso para esta accion') {
    return new HttpError(403, message)
  }
  static notFound(message = 'Recurso no encontrado') {
    return new HttpError(404, message)
  }
  static conflict(message = 'El recurso ya existe') {
    return new HttpError(409, message)
  }
}
