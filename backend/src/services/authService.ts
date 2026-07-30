import bcrypt from 'bcryptjs'
import * as userRepo from '../repositories/userRepository.ts'
import { HttpError } from '../utils/httpError.ts'
import { signToken } from '../utils/token.ts'
import type { RoleSlug, User } from '../types/models.ts'

export const login = async (email: string, password: string) => {
  const user = await userRepo.findByEmail(email)
  if (!user) throw HttpError.unauthorized('Correo o contrasena incorrectos')
  if (user.status !== 'active') throw HttpError.forbidden('Esta cuenta esta inactiva')

  const matches = await bcrypt.compare(password, user.password_hash)
  if (!matches) throw HttpError.unauthorized('Correo o contrasena incorrectos')

  const { password_hash: _omit, ...safeUser } = user
  return { user: safeUser as User, token: signToken({ id: user.id, email: user.email, role: user.role_slug }) }
}

export const register = async (data: {
  firstName: string
  lastName: string
  email: string
  password: string
  role: RoleSlug
}) => {
  const existing = await userRepo.findByEmail(data.email)
  if (existing) throw HttpError.conflict('Ya existe una cuenta con ese correo')

  const passwordHash = await bcrypt.hash(data.password, 10)
  const id = await userRepo.create({
    roleSlug: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    passwordHash,
  })

  const user = await userRepo.findById(id)
  if (!user) throw HttpError.badRequest('No se pudo crear el usuario')

  return { user, token: signToken({ id: user.id, email: user.email, role: user.role_slug }) }
}

export const me = async (userId: number): Promise<User> => {
  const user = await userRepo.findById(userId)
  if (!user) throw HttpError.notFound('Usuario no encontrado')
  return user
}
