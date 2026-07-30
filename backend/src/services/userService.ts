import bcrypt from 'bcryptjs'
import * as userRepo from '../repositories/userRepository.ts'
import { publicUrlFor } from '../config/uploads.ts'
import { HttpError } from '../utils/httpError.ts'
import type { AuthPayload, RoleSlug, User } from '../types/models.ts'

// ---------- Perfil propio ----------

/** Lista blanca camelCase -> columna, para el UPDATE del perfil. */
const PROFILE_COLUMNS = {
  firstName: 'first_name',
  lastName: 'last_name',
  bio: 'bio',
  phone: 'phone',
} as const

export const profile = async (userId: number): Promise<User> => {
  const user = await userRepo.findById(userId)
  if (!user) throw HttpError.notFound('Usuario no encontrado')
  return user
}

export const updateProfile = async (
  userId: number,
  data: Record<string, string | undefined>,
): Promise<User> => {
  const columns: Record<string, string | null> = {}
  for (const [key, column] of Object.entries(PROFILE_COLUMNS)) {
    if (data[key] !== undefined) columns[column] = data[key] === '' ? null : data[key]!
  }
  if (Object.keys(columns).length === 0) throw HttpError.badRequest('No hay nada que actualizar')

  await userRepo.updateProfile(userId, columns)
  return profile(userId)
}

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = await userRepo.findById(userId)
  if (!user) throw HttpError.notFound('Usuario no encontrado')

  const withPassword = await userRepo.findByEmail(user.email)
  const matches = await bcrypt.compare(currentPassword, withPassword!.password_hash)
  if (!matches) throw HttpError.badRequest('La contrasena actual no es correcta')

  await userRepo.updatePassword(userId, await bcrypt.hash(newPassword, 10))
}

export const setAvatar = async (userId: number, filename: string): Promise<User> => {
  await userRepo.updateProfile(userId, { avatar_url: publicUrlFor(filename) })
  return profile(userId)
}

export const removeAvatar = async (userId: number): Promise<User> => {
  await userRepo.updateProfile(userId, { avatar_url: null })
  return profile(userId)
}

// ---------- Ajustes ----------

const SETTINGS_COLUMNS = {
  theme: 'theme',
  density: 'density',
  language: 'language',
  notifyCoursework: 'notify_coursework',
  notifyAnnouncements: 'notify_announcements',
  notifyGrades: 'notify_grades',
  showArchived: 'show_archived',
} as const

export const settings = async (userId: number) => {
  const current = await userRepo.getSettings(userId)
  if (current) return current

  // Usuario creado antes de la tabla de ajustes: la creamos al vuelo.
  await userRepo.upsertSettings(userId, {})
  return userRepo.getSettings(userId)
}

export const updateSettings = async (
  userId: number,
  data: Record<string, string | boolean | undefined>,
) => {
  const columns: Record<string, string | number> = {}
  for (const [key, column] of Object.entries(SETTINGS_COLUMNS)) {
    const value = data[key]
    if (value === undefined) continue
    columns[column] = typeof value === 'boolean' ? Number(value) : value
  }
  if (Object.keys(columns).length === 0) throw HttpError.badRequest('No hay nada que actualizar')

  await userRepo.upsertSettings(userId, columns)
  return settings(userId)
}

// ---------- Administracion ----------

export const listUsers = (search?: string) => userRepo.listAll(search?.trim() ?? '')

export const createUser = async (data: {
  firstName: string
  lastName: string
  email: string
  password: string
  role: RoleSlug
}): Promise<User> => {
  const existing = await userRepo.findByEmail(data.email)
  if (existing) throw HttpError.conflict('Ya existe una cuenta con ese correo')

  const id = await userRepo.create({
    roleSlug: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    passwordHash: await bcrypt.hash(data.password, 10),
  })
  return profile(id)
}

export const setUserRole = async (
  actor: AuthPayload,
  userId: number,
  role: RoleSlug,
): Promise<User> => {
  if (actor.id === userId) throw HttpError.badRequest('No puedes cambiar tu propio rol')
  await userRepo.setRole(userId, role)
  return profile(userId)
}

export const setUserStatus = async (
  actor: AuthPayload,
  userId: number,
  status: 'active' | 'inactive',
): Promise<User> => {
  if (actor.id === userId) throw HttpError.badRequest('No puedes desactivar tu propia cuenta')
  await userRepo.setStatus(userId, status)
  return profile(userId)
}

export const resetPassword = async (userId: number, newPassword: string): Promise<void> => {
  const user = await userRepo.findById(userId)
  if (!user) throw HttpError.notFound('Usuario no encontrado')
  await userRepo.updatePassword(userId, await bcrypt.hash(newPassword, 10))
}

export const overview = async () => ({
  stats: await userRepo.stats(),
  roles: await userRepo.listRoles(),
})
