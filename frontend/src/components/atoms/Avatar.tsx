import { cn } from '@/lib/cn'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'size-7 text-[10px]',
  md: 'size-9 text-xs',
  lg: 'size-12 text-sm',
}

/** Color estable derivado del nombre, para que cada persona tenga el mismo tono. */
const TONES = [
  'bg-icon-indigo',
  'bg-icon-teal',
  'bg-icon-violet',
  'bg-icon-amber',
  'bg-icon-olive',
  'bg-icon-rose',
]
const toneFor = (name: string) =>
  TONES[[...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % TONES.length]

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export const Avatar = ({ name, src, size = 'md', className }: AvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', SIZES[size], className)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        toneFor(name),
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
