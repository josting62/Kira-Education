import { randomInt } from 'node:crypto'

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789' // sin caracteres ambiguos

/** Genera un codigo de clase de 8 caracteres, al estilo de Google Classroom. */
export const generateClassCode = (): string =>
  Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
