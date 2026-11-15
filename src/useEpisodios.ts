import { useEffect, useState } from 'react'
import { listarEpisodios } from './almacen.ts'
import type { Episodio } from './tipos.ts'

// "Hook" compartido por Inicio e Historial: lee los episodios guardados en
// el teléfono al entrar en la pantalla.
// Se llama "use..." en inglés porque React exige ese prefijo en los hooks.
//   episodios: null mientras carga; después, la lista (puede estar vacía).
//   error: texto para mostrar si la lectura falla.
export function useEpisodios(): { episodios: Episodio[] | null; error: string } {
  const [episodios, setEpisodios] = useState<Episodio[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    listarEpisodios()
      .then((lista) => {
        if (!cancelado) setEpisodios(lista)
      })
      .catch(() => {
        if (!cancelado) {
          setEpisodios([])
          setError('No se han podido leer los registros guardados.')
        }
      })
    return () => {
      cancelado = true
    }
  }, [])

  return { episodios, error }
}
