import { useCallback, useEffect, useState } from 'react'

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

interface Snapshot<T> {
  /** Clave de la peticion que produjo este resultado. */
  key: string
  data: T | null
  error: string | null
}

/**
 * Carga datos de la API con estados de carga y error.
 * `deps` funciona igual que en useEffect: cambia -> vuelve a pedir.
 *
 * El estado se guarda junto con la clave de su peticion, asi `loading` se
 * deriva de comparar claves y no hace falta un setState dentro del efecto.
 */
export const useFetch = <T>(fetcher: () => Promise<T>, deps: unknown[] = []): FetchState<T> => {
  const [nonce, setNonce] = useState(0)
  const [snapshot, setSnapshot] = useState<Snapshot<T> | null>(null)

  const key = `${nonce}|${JSON.stringify(deps)}`
  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let active = true

    fetcher()
      .then((data) => {
        if (active) setSnapshot({ key, data, error: null })
      })
      .catch((err: Error) => {
        if (active) setSnapshot({ key, data: null, error: err.message })
      })

    return () => {
      active = false
    }
    // `fetcher` se recrea en cada render; la clave es la fuente de verdad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const fresh = snapshot?.key === key

  return {
    data: fresh ? snapshot.data : null,
    loading: !fresh,
    error: fresh ? snapshot.error : null,
    reload,
  }
}
