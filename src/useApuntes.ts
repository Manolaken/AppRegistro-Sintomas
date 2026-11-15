import { useEffect, useState } from 'react'
import { listarApuntes } from './almacen.ts'
import type { Apunte } from './tipos.ts'

// Igual que useEpisodios, pero para los apuntes rápidos.
//   apuntes: null mientras carga; después, la lista (puede estar vacía).
//   error: texto para mostrar si la lectura falla.
export function useApuntes(): { apuntes: Apunte[] | null; error: string } {
  const [apuntes, setApuntes] = useState<Apunte[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    listarApuntes()
      .then((lista) => {
        if (!cancelado) setApuntes(lista)
      })
      .catch(() => {
        if (!cancelado) {
          setApuntes([])
          setError('No se han podido leer los apuntes guardados.')
        }
      })
    return () => {
      cancelado = true
    }
  }, [])

  return { apuntes, error }
}
