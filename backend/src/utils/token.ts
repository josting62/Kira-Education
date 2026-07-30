import jwt from 'jsonwebtoken'
import { env } from '../config/env.ts'
import type { AuthPayload } from '../types/models.ts'

export const signToken = (payload: AuthPayload): string =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn } as jwt.SignOptions)

export const verifyToken = (token: string): AuthPayload =>
  jwt.verify(token, env.jwt.secret) as AuthPayload
