import { useEffect } from 'react'
import { LARGO_CODIGO } from '../bloqueo.ts'
import { IconoBorrar } from './Iconos.tsx'

type Props = {
  // Lo tecleado hasta ahora, por ejemplo "12".
  valor: string
  alCambiar: (valor: string) => void
  desactivado?: boolean
}

const TECLAS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

// Teclado numérico para escribir el código, con cuatro puntos que se van
// rellenando. No muestra los números tecleados.
export default function TecladoCodigo({ valor, alCambiar, desactivado = false }: Props) {
  function pulsar(tecla: string) {
    if (desactivado || valor.length >= LARGO_CODIGO) return
    alCambiar(valor + tecla)
  }

  function borrar() {
    if (desactivado) return
    alCambiar(valor.slice(0, -1))
  }

  // En el ordenador también se puede escribir con el teclado de verdad.
  useEffect(() => {
    function alTeclear(evento: KeyboardEvent) {
      if (/^[0-9]$/.test(evento.key)) pulsar(evento.key)
      if (evento.key === 'Backspace') borrar()
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  })

  return (
    <div className="teclado">
      <div
        className="puntos"
        role="status"
        aria-label={`${valor.length} de ${LARGO_CODIGO} números escritos`}
      >
        {Array.from({ length: LARGO_CODIGO }, (_, indice) => (
          <span key={indice} className={indice < valor.length ? 'punto punto-lleno' : 'punto'} />
        ))}
      </div>
      <div className="teclas">
        {TECLAS.map((tecla) => (
          <button
            key={tecla}
            type="button"
            className="tecla"
            disabled={desactivado}
            onClick={() => pulsar(tecla)}
          >
            {tecla}
          </button>
        ))}
        <span />
        <button type="button" className="tecla" disabled={desactivado} onClick={() => pulsar('0')}>
          0
        </button>
        <button
          type="button"
          className="tecla tecla-borrar"
          aria-label="Borrar"
          disabled={desactivado || valor.length === 0}
          onClick={borrar}
        >
          <IconoBorrar />
        </button>
      </div>
    </div>
  )
}
