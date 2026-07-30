import { http } from './http'
import type { Comment, CommentTarget } from '@/types/models'

/**
 * Hilos de comentarios.
 *
 *   announcement / coursework -> comentario de clase, lo ve todo el curso
 *   submission                -> privado entre el alumno y su docente
 *
 * El backend decide la visibilidad segun el tipo, el frontend no la envia.
 */
export const listComments = (targetType: CommentTarget, targetId: number) =>
  http.get<Comment[]>(`/comments/${targetType}/${targetId}`)

export const createComment = (targetType: CommentTarget, targetId: number, body: string) =>
  http.post<Comment>('/comments', { targetType, targetId, body })

export const deleteComment = (id: number) => http.delete<null>(`/comments/${id}`)
