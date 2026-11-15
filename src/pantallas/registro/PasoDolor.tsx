import type { Dispatch, SetStateAction } from 'react'
import MapaAbdomen from '../../componentes/MapaAbdomen.tsx'
import SeleccionUnica from '../../componentes/SeleccionUnica.tsx'
import { TIPOS_DOLOR, textoIntensidad } from '../../datos.ts'
import type { PropsPaso } from '../../tipos.ts'

type Props = PropsPaso & {
  alCambiarCeldas: Dispatch<SetStateAction<number[]>>
}

// Paso 1: dónde duele, cuánto y cómo es el dolor.
export default function PasoDolor({ borrador, alCambiar, alCambiarCeldas }: Props) {
  return (
    <>
      <MapaAbdomen celdas={borrador.celdas} alCambiar={alCambiarCeldas} />

      <section className="tarjeta">
        <div className="tarjeta-cabecera">
          <label htmlFor="intensidad">Intensidad</label>
          <span className="nota">
            <strong className="numero">{borrador.intensidad}</strong> de 10 ·{' '}
            {textoIntensidad(borrador.intensidad)}
          </span>
        </div>
        <input
          id="intensidad"
          type="range"
          min={0}
          max={10}
          step={1}
          value={borrador.intensidad}
          onChange={(evento) => alCambiar({ intensidad: Number(evento.target.value) })}
        />
      </section>

      <section className="lista">
        <h2>¿Cómo es el dolor?</h2>
        <SeleccionUnica
          nombre="Tipo de dolor"
          opciones={TIPOS_DOLOR}
          valor={borrador.tipo}
          alCambiar={(tipo) => alCambiar({ tipo })}
        />
      </section>
    </>
  )
}
