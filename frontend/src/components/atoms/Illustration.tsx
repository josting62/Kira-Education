import { cn } from '@/lib/cn'
import cat from '@/assets/images/cat.jpeg'
import fish from '@/assets/images/fish.jpeg'
import squirrel from '@/assets/images/squiller.jpeg'
import wolf from '@/assets/images/wolf.jpeg'

/**
 * Ilustraciones de los estados vacios.
 *
 * Las imagenes viven en frontend/src/assets/images y las importa Vite, asi
 * entran en el build con hash. Se pintan con mix-blend-multiply porque tienen
 * fondo blanco: de esa forma se integran tanto sobre una card blanca como
 * sobre el fondo gris de la aplicacion, sin recuadro visible.
 */
export type IllustrationName =
  | 'classwork'
  | 'stream'
  | 'done'
  | 'notifications'
  | 'archive'
  | 'grades'
  | 'notFound'

const SCENES: Record<IllustrationName, string> = {
  classwork: wolf, // lobo frente al portatil: aqui se asignan los trabajos
  stream: squirrel, // ardilla y utiles: el tablon de la clase
  done: fish, // pecera en calma: no queda nada pendiente
  notifications: fish,
  grades: cat, // gato sobre el cuaderno: libreta de calificaciones
  archive: cat,
  notFound: squirrel,
}

interface IllustrationProps {
  name: IllustrationName
  className?: string
}

export const Illustration = ({ name, className }: IllustrationProps) => (
  <img
    src={SCENES[name]}
    // Decorativa: el texto del estado vacio ya dice lo que pasa.
    alt=""
    aria-hidden
    data-illustration={name}
    className={cn('h-auto w-56 shrink-0 select-none mix-blend-multiply', className)}
  />
)
