import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { Icon, type IconName } from '@/assets/icons'

export interface MenuItem {
  label: string
  icon?: IconName
  onSelect: () => void
  /** Marca la opcion como destructiva (rojo). */
  danger?: boolean
  disabled?: boolean
}

interface MenuProps {
  /** Texto para lectores de pantalla del boton que abre el menu. */
  label: string
  items: MenuItem[]
  icon?: IconName
  /** Si se pasa, el disparador muestra este texto junto al icono. */
  triggerLabel?: string
  /** Reemplaza por completo el contenido del disparador (ej: un avatar). */
  triggerContent?: ReactNode
  /** Clases del boton disparador (util sobre el banner de color). */
  triggerClassName?: string
  align?: 'left' | 'right'
  /** Hacia donde se despliega. 'up' cuando el boton esta al pie de una card. */
  direction?: 'down' | 'up'
}

/** Ancho minimo del panel (min-w-56) y margenes de seguridad, en pixeles. */
const MENU_WIDTH = 224
const GAP = 4
const EDGE = 8
/** Alto aproximado de una opcion: solo para decidir si el panel cabe abajo. */
const ITEM_HEIGHT = 38

interface Position {
  top?: number
  bottom?: number
  left?: number
  right?: number
  maxHeight: number
}

/**
 * Calcula la posicion del panel en coordenadas de ventana.
 *
 * El panel se pinta con `position: fixed` en un portal sobre el `body`, asi que
 * ningun `overflow-hidden` de las cards que lo contienen puede recortarlo. A
 * cambio hay que situarlo a mano a partir del rectangulo del disparador.
 */
const positionFor = (
  trigger: HTMLElement,
  count: number,
  align: 'left' | 'right',
  direction: 'down' | 'up',
): Position => {
  const rect = trigger.getBoundingClientRect()
  const { innerWidth: vw, innerHeight: vh } = window

  const height = count * ITEM_HEIGHT + 8
  const roomBelow = vh - rect.bottom - GAP - EDGE
  const roomAbove = rect.top - GAP - EDGE

  // Se respeta la direccion pedida salvo que no quepa y al otro lado si haya
  // mas sitio: un menu al pie de la pantalla se abre hacia arriba solo.
  const wantsUp = direction === 'up'
  const up = wantsUp ? roomAbove >= height || roomAbove >= roomBelow : roomBelow < height && roomAbove > roomBelow

  return {
    ...(up ? { bottom: Math.max(EDGE, vh - rect.top + GAP) } : { top: Math.max(EDGE, rect.bottom + GAP) }),
    // Anclar por el borde derecho evita que un texto largo se salga de la
    // ventana: el panel crece hacia la izquierda.
    ...(align === 'right'
      ? { right: Math.max(EDGE, vw - rect.right) }
      : { left: Math.max(EDGE, Math.min(rect.left, vw - MENU_WIDTH - EDGE)) }),
    maxHeight: Math.max(ITEM_HEIGHT * 2, up ? roomAbove : roomBelow),
  }
}

/**
 * Menu de opciones (los tres puntos de Classroom).
 * Cierra al hacer clic fuera, con Escape o al elegir una opcion.
 */
export const Menu = ({
  label,
  items,
  icon = 'more',
  triggerLabel,
  triggerContent,
  triggerClassName,
  align = 'right',
  direction = 'down',
}: MenuProps) => {
  // La posicion se guarda junto con el estado abierto: se calcula en el clic,
  // nunca dentro de un efecto.
  const [position, setPosition] = useState<Position | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const Glyph = Icon[icon]
  const open = position !== null

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      // El panel ya no esta dentro del disparador: hay que mirar los dos.
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setPosition(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPosition(null)
    }
    // Al desplazar o redimensionar, el panel sigue a su disparador.
    const reposition = () => {
      if (triggerRef.current) {
        setPosition(positionFor(triggerRef.current, items.length, align, direction))
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    // En captura para enterarse tambien del scroll de contenedores internos.
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open, items.length, align, direction])

  const toggle = () => {
    setPosition((current) =>
      current || !triggerRef.current
        ? null
        : positionFor(triggerRef.current, items.length, align, direction),
    )
  }

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel ? undefined : label}
        title={triggerLabel ? undefined : label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          'inline-flex items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-hover',
          triggerLabel ? 'h-8 gap-1.5 px-3 text-xs font-medium' : 'size-9',
          triggerClassName,
        )}
      >
        {triggerContent ?? (
          <>
            <Glyph className={triggerLabel ? 'size-4' : 'size-5'} aria-hidden />
            {triggerLabel}
          </>
        )}
      </button>

      {position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={position}
            className={cn(
              'fixed z-50 min-w-56 overflow-y-auto rounded-lg border border-line bg-surface py-1',
              'shadow-raised',
            )}
          >
            {items.map((item) => {
              const ItemGlyph = item.icon ? Icon[item.icon] : null
              return (
                <button
                  key={item.label}
                  role="menuitem"
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    setPosition(null)
                    item.onSelect()
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    item.danger ? 'text-danger hover:bg-accent-50' : 'text-ink-soft hover:bg-hover',
                  )}
                >
                  {ItemGlyph && <ItemGlyph className="size-4 shrink-0" aria-hidden />}
                  {item.label}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
