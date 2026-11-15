import { useRef } from 'react'
import type { Dispatch, PointerEvent, SetStateAction } from 'react'
import { CELDAS_POR_LADO, ZONAS } from '../datos.ts'

type Props = {
  // Índices de las celdas pintadas (0 = arriba a la izquierda de la pantalla).
  celdas: number[]
  // Recibe el "setState" del padre para poder actualizar a partir del valor
  // más reciente mientras el dedo se mueve. Si no se pasa, el mapa es de
  // solo lectura: enseña lo pintado y no se puede tocar.
  alCambiar?: Dispatch<SetStateAction<number[]>>
}

// Posiciones 0 a 8 dentro de un cuadro de 3 x 3.
const NUEVE = [0, 1, 2, 3, 4, 5, 6, 7, 8]

// Índice global de una celda a partir del cuadro grande en el que está
// (0 a 8) y de su posición dentro de ese cuadro (0 a 8).
function indiceDeCelda(cuadro: number, posicion: number): number {
  const fila = Math.floor(cuadro / 3) * 3 + Math.floor(posicion / 3)
  const columna = (cuadro % 3) * 3 + (posicion % 3)
  return fila * CELDAS_POR_LADO + columna
}

// Dibujo de un torso de frente con 9 cuadros grandes sobre el abdomen (las
// 9 regiones médicas), cada uno dividido en 3 x 3 celdas: 81 en total.
// Se pinta deslizando el dedo: si se empieza sobre una celda vacía
// se pinta, y si se empieza sobre una ya pintada se borra.
export default function MapaAbdomen({ celdas, alCambiar }: Props) {
  // Qué está haciendo el dedo ahora mismo: pintar, borrar o nada.
  const modo = useRef<'pintar' | 'borrar' | null>(null)
  const soloLectura = alCambiar === undefined

  function aplicar(indice: number, accion: 'pintar' | 'borrar') {
    if (alCambiar === undefined) return
    alCambiar((previas) => {
      const estaba = previas.includes(indice)
      if (accion === 'pintar') return estaba ? previas : [...previas, indice]
      return estaba ? previas.filter((celda) => celda !== indice) : previas
    })
  }

  // Devuelve el índice de la celda que hay bajo un punto de la pantalla.
  function celdaEn(x: number, y: number): number | null {
    const elemento = document.elementFromPoint(x, y)
    if (!(elemento instanceof HTMLElement)) return null
    const valor = elemento.dataset.celda
    return valor === undefined ? null : Number(valor)
  }

  function alPulsar(evento: PointerEvent<HTMLDivElement>) {
    const indice = celdaEn(evento.clientX, evento.clientY)
    if (indice === null) return
    modo.current = celdas.includes(indice) ? 'borrar' : 'pintar'
    aplicar(indice, modo.current)
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    if (modo.current === null) return
    // Con ratón: si se soltó el botón fuera de la cuadrícula, dejamos de pintar.
    if (evento.pointerType === 'mouse' && evento.buttons === 0) {
      modo.current = null
      return
    }
    const indice = celdaEn(evento.clientX, evento.clientY)
    if (indice !== null) aplicar(indice, modo.current)
  }

  function alSoltar() {
    modo.current = null
  }

  // Para quien use teclado: Enter o Espacio sobre una celda la alterna.
  // Los toques y clics de ratón ya se gestionan en alPulsar (detail > 0).
  function alActivarConTeclado(indice: number, detalle: number) {
    if (detalle !== 0) return
    aplicar(indice, celdas.includes(indice) ? 'borrar' : 'pintar')
  }

  return (
    <div className="tarjeta mapa">
      <div className="mapa-lados">
        <span>Tu derecha</span>
        <span>Tu izquierda</span>
      </div>
      <div className="mapa-lienzo">
        <svg aria-hidden="true" viewBox="0 0 260 270">
          <path
            d="M72 8C48 12 34 30 34 58l10 102c2 40-6 75-12 104h196c-6-29-14-64-12-104l10-102c0-28-14-46-38-50-12 16-34 24-58 24S84 24 72 8z"
            fill="var(--piel)"
            stroke="var(--tinta)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
        <div
          className="mapa-rejilla"
          role="group"
          aria-label="Cuadrícula del abdomen"
          onPointerDown={soloLectura ? undefined : alPulsar}
          onPointerMove={soloLectura ? undefined : alMover}
          onPointerUp={soloLectura ? undefined : alSoltar}
          onPointerCancel={soloLectura ? undefined : alSoltar}
        >
          {ZONAS.map((zona, cuadro) => (
            <div key={zona.id} className="cuadro">
              {NUEVE.map((posicion) => {
                const indice = indiceDeCelda(cuadro, posicion)
                const pintada = celdas.includes(indice)
                return (
                  <button
                    key={indice}
                    type="button"
                    data-celda={indice}
                    className={pintada ? 'celda celda-pintada' : 'celda'}
                    aria-label={`${zona.etiqueta}, casilla ${posicion + 1} de 9`}
                    aria-pressed={pintada}
                    disabled={soloLectura}
                    onClick={(evento) => alActivarConTeclado(indice, evento.detail)}
                  />
                )
              })}
            </div>
          ))}
        </div>
        <span className="mapa-ombligo" aria-hidden="true" />
      </div>
      {alCambiar !== undefined && (
        <div className="mapa-pie">
          <p className="nota">El punto del centro es el ombligo.</p>
          {celdas.length > 0 && (
            <button type="button" className="boton-texto" onClick={() => alCambiar([])}>
              Borrar todo
            </button>
          )}
        </div>
      )}
    </div>
  )
}
