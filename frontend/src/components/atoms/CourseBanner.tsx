import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { BannerKind } from '@/types/models'

interface CourseBannerProps {
  themeColor: string
  bannerKind: BannerKind
  bannerUrl: string | null
  className?: string
  children?: ReactNode
}

/**
 * Encabezado de una clase. Unico lugar donde se decide como se pinta:
 * color plano, imagen de galeria o imagen subida. El color siempre queda
 * de fondo, asi la imagen puede cargar sin parpadeo.
 */
export const CourseBanner = ({
  themeColor,
  bannerKind,
  bannerUrl,
  className,
  children,
}: CourseBannerProps) => {
  const showImage = bannerKind !== 'color' && Boolean(bannerUrl)

  return (
    <div
      // Los data-* exponen el estado del encabezado de forma estable,
      // para poder verificarlo sin depender del atributo style.
      data-banner="course"
      data-banner-kind={bannerKind}
      data-theme-color={themeColor}
      className={cn('relative overflow-hidden bg-cover bg-center', className)}
      style={{
        backgroundColor: themeColor,
        backgroundImage: showImage ? `url(${bannerUrl})` : undefined,
      }}
    >
      {/* Velo oscuro solo sobre imagen, para que el texto blanco siempre lea. */}
      {showImage && <div aria-hidden className="absolute inset-0 bg-black/25" />}
      {/* w-full: sin el, este contenedor se encoge al ancho del titulo y lo que
          se posicione contra sus esquinas (el boton Personalizar) acaba pegado
          al texto en vez de al borde del encabezado. */}
      <div className="relative w-full">{children}</div>
    </div>
  )
}
