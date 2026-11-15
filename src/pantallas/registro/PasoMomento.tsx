import SeleccionMultiple from '../../componentes/SeleccionMultiple.tsx'
import SeleccionUnica from '../../componentes/SeleccionUnica.tsx'
import { DURACIONES, SINTOMAS } from '../../datos.ts'
import type { PropsPaso } from '../../tipos.ts'

// Paso 2: cuándo empezó, cuánto duró y qué otros síntomas hay.
export default function PasoMomento({ borrador, alCambiar }: PropsPaso) {
  return (
    <>
      <section className="lista">
        <label htmlFor="inicio">¿Cuándo empezó?</label>
        <input
          id="inicio"
          className="campo"
          type="datetime-local"
          value={borrador.inicio}
          onChange={(evento) => alCambiar({ inicio: evento.target.value })}
        />
      </section>

      <section className="lista">
        <h2>¿Cuánto ha durado?</h2>
        <SeleccionUnica
          nombre="Duración"
          opciones={DURACIONES}
          valor={borrador.duracion}
          alCambiar={(duracion) => alCambiar({ duracion })}
        />
      </section>

      <section className="lista">
        <h2>¿Notas algo más?</h2>
        <SeleccionMultiple
          nombre="Otros síntomas"
          opciones={SINTOMAS}
          valores={borrador.sintomas}
          alCambiar={(sintomas) => alCambiar({ sintomas })}
        />
      </section>
    </>
  )
}
