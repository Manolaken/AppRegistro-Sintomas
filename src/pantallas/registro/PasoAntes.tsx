import SeleccionUnica from '../../componentes/SeleccionUnica.tsx'
import {
  ACTIVIDADES,
  AGUAS,
  ANIMOS,
  REGLAS,
  SUENOS,
  TIEMPOS_DESDE_COMIDA,
} from '../../datos.ts'
import type { PropsPaso } from '../../tipos.ts'

// Paso 3: lo que pasó antes del dolor (comida, sueño, ánimo...).
export default function PasoAntes({ borrador, alCambiar }: PropsPaso) {
  return (
    <>
      <section className="lista">
        <label htmlFor="comida">¿Qué comiste o bebiste antes?</label>
        <textarea
          id="comida"
          className="campo"
          rows={3}
          placeholder="Por ejemplo: macarrones con tomate y un yogur"
          value={borrador.comida}
          onChange={(evento) => alCambiar({ comida: evento.target.value })}
        />
      </section>

      <section className="lista">
        <h2>¿Cuánto hacía que habías comido?</h2>
        <SeleccionUnica
          nombre="Tiempo desde la última comida"
          opciones={TIEMPOS_DESDE_COMIDA}
          valor={borrador.tiempoDesdeComida}
          alCambiar={(tiempoDesdeComida) => alCambiar({ tiempoDesdeComida })}
        />
      </section>

      <section className="lista">
        <h2>¿Cómo dormiste anoche?</h2>
        <SeleccionUnica
          nombre="Sueño"
          opciones={SUENOS}
          valor={borrador.sueno}
          alCambiar={(sueno) => alCambiar({ sueno })}
        />
      </section>

      <section className="lista">
        <h2>¿Cómo estabas de ánimo?</h2>
        <SeleccionUnica
          nombre="Ánimo"
          opciones={ANIMOS}
          valor={borrador.animo}
          alCambiar={(animo) => alCambiar({ animo })}
        />
      </section>

      <section className="lista">
        <h2>¿Has hecho ejercicio hoy?</h2>
        <SeleccionUnica
          nombre="Ejercicio"
          opciones={ACTIVIDADES}
          valor={borrador.actividad}
          alCambiar={(actividad) => alCambiar({ actividad })}
        />
      </section>

      <section className="lista">
        <h2>¿Cuánta agua has bebido hoy?</h2>
        <SeleccionUnica
          nombre="Agua"
          opciones={AGUAS}
          valor={borrador.agua}
          alCambiar={(agua) => alCambiar({ agua })}
        />
      </section>

      <section className="lista">
        <h2>¿Tienes la regla?</h2>
        <SeleccionUnica
          nombre="Regla"
          opciones={REGLAS}
          valor={borrador.regla}
          alCambiar={(regla) => alCambiar({ regla })}
        />
      </section>
    </>
  )
}
