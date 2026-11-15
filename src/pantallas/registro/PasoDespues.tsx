import SeleccionMultiple from '../../componentes/SeleccionMultiple.tsx'
import SeleccionUnica from '../../componentes/SeleccionUnica.tsx'
import { AGRAVANTES, ALIVIOS, IMPACTOS, MEDICAMENTOS } from '../../datos.ts'
import type { PropsPaso } from '../../tipos.ts'

// Paso 4: medicación, qué alivia o empeora el dolor y cómo le afectó.
export default function PasoDespues({ borrador, alCambiar }: PropsPaso) {
  return (
    <>
      <section className="lista">
        <h2>¿Has tomado algo para el dolor?</h2>
        <SeleccionMultiple
          nombre="Medicación"
          opciones={MEDICAMENTOS}
          valores={borrador.medicacion}
          alCambiar={(medicacion) => alCambiar({ medicacion })}
        />
        {borrador.medicacion.length > 0 && (
          <>
            <label htmlFor="dosis" className="etiqueta-menor">
              ¿Cuál, cuánto y a qué hora?
            </label>
            <input
              id="dosis"
              className="campo"
              type="text"
              placeholder="Por ejemplo: 1 ibuprofeno de 400 a las 15:00"
              value={borrador.dosis}
              onChange={(evento) => alCambiar({ dosis: evento.target.value })}
            />
          </>
        )}
      </section>

      <section className="lista">
        <h2>¿Qué te alivia?</h2>
        <SeleccionMultiple
          nombre="Qué alivia el dolor"
          opciones={ALIVIOS}
          valores={borrador.alivia}
          alCambiar={(alivia) => alCambiar({ alivia })}
        />
      </section>

      <section className="lista">
        <h2>¿Qué lo empeora?</h2>
        <SeleccionMultiple
          nombre="Qué empeora el dolor"
          opciones={AGRAVANTES}
          valores={borrador.empeora}
          alCambiar={(empeora) => alCambiar({ empeora })}
        />
      </section>

      <section className="lista">
        <h2>¿Cómo te ha afectado?</h2>
        <SeleccionUnica
          nombre="Cómo ha afectado"
          opciones={IMPACTOS}
          valor={borrador.impacto}
          alCambiar={(impacto) => alCambiar({ impacto })}
        />
      </section>

      <section className="lista">
        <label htmlFor="notas">¿Quieres añadir algo?</label>
        <textarea
          id="notas"
          className="campo"
          rows={3}
          value={borrador.notas}
          onChange={(evento) => alCambiar({ notas: evento.target.value })}
        />
      </section>
    </>
  )
}
