import { useEffect, useRef, useState } from 'react'
import { Dialog } from './Dialog'
import { Button } from '@/components/atoms/Button'
import { Input, Textarea } from '@/components/atoms/Input'
import { CourseBanner } from '@/components/atoms/CourseBanner'
import { Icon } from '@/assets/icons'
import { cn } from '@/lib/cn'
import { BANNER_GALLERY, COURSE_COLORS } from '@/constants/theme'
import { setBanner, updateCourse, uploadBanner } from '@/services/courseService'
import type { BannerKind, Course } from '@/types/models'

interface CustomizeCourseDialogProps {
  course: Course
  onClose: () => void
  /** Se llama en cada cambio confirmado, con el curso ya actualizado. */
  onSaved: (course: Course) => void
}

type Tab = 'info' | 'appearance'

/**
 * Personalizacion de la clase: datos, color, galeria e imagen propia.
 *
 * La apariencia se aplica al instante: cada eleccion guarda en la base de
 * datos y propaga el curso actualizado hacia arriba (onSaved), asi el banner
 * de la pagina cambia sin recargar. La vista previa del dialogo usa el mismo
 * componente <CourseBanner> que la pagina real.
 */
export const CustomizeCourseDialog = ({
  course,
  onClose,
  onSaved,
}: CustomizeCourseDialogProps) => {
  const [tab, setTab] = useState<Tab>('appearance')

  // Estado local del encabezado: es lo que pinta la vista previa.
  const [themeColor, setThemeColor] = useState(course.theme_color)
  const [bannerKind, setBannerKind] = useState<BannerKind>(course.banner_kind)
  const [bannerUrl, setBannerUrl] = useState<string | null>(course.banner_url)

  const [form, setForm] = useState({
    name: course.name,
    section: course.section ?? '',
    subject: course.subject ?? '',
    room: course.room ?? '',
    description: course.description ?? '',
  })

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Si la subida crea una URL temporal (preview local), la liberamos al salir.
  const objectUrl = useRef<string | null>(null)
  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    [],
  )

  const applyBanner = async (next: {
    bannerKind: BannerKind
    themeColor?: string
    bannerUrl?: string | null
  }) => {
    // Optimista: la vista previa cambia ya, sin esperar al servidor.
    setBannerKind(next.bannerKind)
    if (next.themeColor) setThemeColor(next.themeColor)
    if (next.bannerUrl !== undefined) setBannerUrl(next.bannerUrl)

    setError(null)
    setBusy(true)
    try {
      onSaved(await setBanner(course.id, next))
    } catch (err) {
      setError((err as Error).message)
      // Vuelve a lo que hay guardado en el curso.
      setBannerKind(course.banner_kind)
      setThemeColor(course.theme_color)
      setBannerUrl(course.banner_url)
    } finally {
      setBusy(false)
    }
  }

  const onPickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Vista previa inmediata con la imagen local, antes de que suba.
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setBannerKind('upload')
    setBannerUrl(objectUrl.current)

    setError(null)
    setBusy(true)
    try {
      const updated = await uploadBanner(course.id, file, themeColor)
      setBannerUrl(updated.banner_url)
      onSaved(updated)
    } catch (err) {
      setError((err as Error).message)
      setBannerKind(course.banner_kind)
      setBannerUrl(course.banner_url)
    } finally {
      setBusy(false)
      event.target.value = ''
    }
  }

  const saveInfo = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      onSaved(
        await updateCourse(course.id, {
          name: form.name,
          section: form.section || undefined,
          subject: form.subject || undefined,
          room: form.room || undefined,
          description: form.description || undefined,
        }),
      )
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const update =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <Dialog
      title="Personalizar clase"
      onClose={onClose}
      footer={
        tab === 'info' ? (
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button size="sm" form="course-info-form" type="submit" loading={busy}>
              Guardar
            </Button>
          </>
        ) : (
          <>
            <span className="mr-auto flex items-center gap-1.5 text-xs text-ink-muted">
              {busy ? (
                <>
                  <Icon.spinner className="size-3.5 animate-spin" aria-hidden />
                  Guardando...
                </>
              ) : (
                <>
                  <Icon.success className="size-3.5 text-success" aria-hidden />
                  Los cambios se aplican al instante
                </>
              )}
            </span>
            <Button size="sm" onClick={onClose}>
              Listo
            </Button>
          </>
        )
      }
    >
      {/* Pestanas del dialogo */}
      <div className="mb-4 flex gap-1 border-b border-line">
        {(
          [
            ['appearance', 'Apariencia'],
            ['info', 'Datos de la clase'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-current={tab === value}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm transition-colors',
              tab === value
                ? 'border-accent-500 font-medium text-accent-600'
                : 'border-transparent text-ink-soft hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'appearance' ? (
        <div className="flex flex-col gap-5">
          {/* Vista previa en vivo */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-soft">Vista previa</p>
            <CourseBanner
              themeColor={themeColor}
              bannerKind={bannerKind}
              bannerUrl={bannerUrl}
              className="flex h-28 flex-col justify-end rounded-card p-4"
            >
              <p className="font-display text-lg font-medium leading-tight text-white">
                {form.name}
              </p>
              {form.section && <p className="text-xs text-white/85">{form.section}</p>}
            </CourseBanner>
          </div>

          {/* Color */}
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-ink-soft">Color del tema</legend>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  aria-label={color.label}
                  title={color.label}
                  aria-pressed={themeColor === color.value}
                  onClick={() =>
                    void applyBanner({ bannerKind: 'color', themeColor: color.value })
                  }
                  style={{ backgroundColor: color.value }}
                  className={cn(
                    'size-8 rounded-full transition-transform',
                    themeColor === color.value && bannerKind === 'color'
                      ? 'ring-2 ring-ink ring-offset-2'
                      : 'hover:scale-110',
                  )}
                />
              ))}
            </div>

            <label className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
              Color personalizado
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                onBlur={() => void applyBanner({ bannerKind: 'color', themeColor })}
                className="h-8 w-12 cursor-pointer rounded border border-line bg-field p-0.5"
              />
              <code className="font-mono text-ink-muted">{themeColor}</code>
            </label>
          </fieldset>

          {/* Galeria */}
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-ink-soft">
              Imagen de la galeria
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {BANNER_GALLERY.map((banner) => (
                <button
                  key={banner.url}
                  type="button"
                  aria-label={banner.label}
                  aria-pressed={bannerUrl === banner.url}
                  onClick={() =>
                    void applyBanner({
                      bannerKind: 'gallery',
                      bannerUrl: banner.url,
                      themeColor: banner.color,
                    })
                  }
                  className={cn(
                    'h-14 overflow-hidden rounded-lg border-2 bg-cover bg-center transition-colors',
                    bannerUrl === banner.url ? 'border-ink' : 'border-transparent hover:border-line-strong',
                  )}
                  style={{ backgroundImage: `url(${banner.url})` }}
                />
              ))}
            </div>
          </fieldset>

          {/* Subir imagen */}
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-ink-soft">Subir una foto</legend>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => void onPickFile(e)}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
              >
                <Icon.upload className="size-4" aria-hidden />
                Elegir imagen
              </Button>
              {bannerKind === 'upload' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    void applyBanner({ bannerKind: 'color', themeColor })
                  }
                >
                  Quitar imagen
                </Button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-ink-muted">
              PNG, JPG, WEBP o SVG. Maximo 4 MB.
            </p>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </div>
      ) : (
        <form id="course-info-form" onSubmit={saveInfo} className="flex flex-col gap-3.5">
          <Input
            label="Nombre de la clase"
            name="name"
            required
            minLength={3}
            value={form.name}
            onChange={update('name')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Seccion" name="section" value={form.section} onChange={update('section')} />
            <Input label="Materia" name="subject" value={form.subject} onChange={update('subject')} />
          </div>
          <Input label="Sala" name="room" value={form.room} onChange={update('room')} />
          <Textarea
            label="Descripcion"
            name="description"
            value={form.description}
            onChange={update('description')}
          />
          {error && (
            <p role="alert" className="rounded-lg bg-accent-50 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          )}
        </form>
      )}
    </Dialog>
  )
}
