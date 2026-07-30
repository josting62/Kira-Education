import { useEffect, useState } from 'react'
import { Icon } from '@/assets/icons'
import { checkHealth } from '@/services/http'

/**
 * Aviso fijo cuando la API no responde. Reintenta cada 5 s y desaparece solo
 * en cuanto el backend vuelve, sin necesidad de recargar la pagina.
 */
export const ApiOfflineBanner = () => {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    let active = true

    const ping = async () => {
      const healthy = await checkHealth()
      if (active) setOffline(!healthy)
    }

    void ping()
    const timer = setInterval(() => void ping(), 5000)

    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-danger px-4 py-2 text-center text-xs text-white"
    >
      <Icon.warning className="size-4 shrink-0" aria-hidden />
      <span>No hay conexion con la API.</span>
      <span className="text-white/80">
        Inicia MySQL en el panel de XAMPP y ejecuta <code className="font-mono">npm run dev</code>.
      </span>
    </div>
  )
}
