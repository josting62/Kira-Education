import { useOutletContext } from 'react-router-dom'
import type { Course } from '@/types/models'

/** Contexto que <CoursePage> entrega a sus pestanas. */
export const useCourseContext = () =>
  useOutletContext<{ course: Course; reloadCourse: () => void }>()
