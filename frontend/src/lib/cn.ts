import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Une clases condicionales y resuelve conflictos de Tailwind. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
