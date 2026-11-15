import { useState } from 'react'
import { borrarApunte, guardarApunte } from '../almacen.ts'
import { IconoAtras } from '../componentes/Iconos.tsx'
import SeleccionMultiple from '../componentes/SeleccionMultiple.tsx'
import SeleccionUnica from '../componentes/SeleccionUnica.tsx'
import {
  FASES_CICLO,
  FLUJOS,
  MEDICAMENTOS,
  NOMBRES_APUNTE,
  TOMAS,
  apunteCompleto,
  apunteNuevo,
} from '../datos.ts'
import type { Apunte, ClaseApunte } from '../tipos.ts'

type Props = {
  clase: ClaseApunte
  // Si se pasa un apunte, la pantalla lo edita (y deja borrarlo).
  apunteInicial?: Apunte
  alSalir: () => void
  alTerminar: () => void
}

const PREGUNTAS_TEXTO: Record<ClaseApunte, string> = {
  comida: '¿Qué has comido y bebido?',
  medicacion: '¿Cuál, cuánto y para qué?',
  ciclo: '¿Quieres añadir algo?',
}

const EJEMPLOS_TEXTO: Record<ClaseApunte, string> = {
  comida: 'Por ejemplo: macarrones con tomate, un yogur y agua',
  medicacion: 'Por ejemplo: 1 ibuprofeno de 400 para el dolor de cabeza',
  ciclo: '',
}

// Pantalla única para los tres apuntes rápidos: comida, medicación y regla.
// Cambia las preguntas según la clase.
export default function ApunteRapido({ clase, apunteInicial, alSalir, alTerminar }: Props) {
  const [apunte, setApunte] = useState<Apunte>(() => apunteInicial ?? apunteNuevo(clase))
  const [ocupado, setOcupado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState('')

  const editando = apunteInicial !== undefined

  function cambiar(cambios: Partial<Apunte>) {
    setApunte((previo) => ({ ...previo, ...cambios }))
  }

  async function guardar() {
    setOcupado(true)
    setError('')
    try {
      await guardarApunte(apunte)
      alTerminar()
    } catch {
      setError('No se ha podido guardar. Inténtalo otra vez.')
      setOcupado(false)
    }
  }

  async function borrar() {
    setOcupado(true)
    setError('')
    try {
      await borrarApunte(apunte.id)
      alTerminar()
    } catch {
      setError('No se ha podido borrar. Inténtalo otra vez.')
      setOcupado(false)
    }
  }

  return (
    <div className="pantalla">
      <main className="contenido">
        <div className="barra-superior">
          <button type="button" className="boton-redondo" aria-label="Volver" onClick={alSalir}>
            <IconoAtras />
          </button>
          <span className="paso">{editando ? 'Editar apunte' : 'Apunte rápido'}</span>
          {/* Hueco del mismo ancho que el botón para centrar el título. */}
          <span className="hueco-boton" aria-hidden="true" />
        </div>

        <header>
          <h1>{NOMBRES_APUNTE[clase]}</h1>
        </header>

        <section className="lista">
          <label htmlFor="momento">¿Cuándo?</label>
          <input
            id="momento"
            className="campo"
            type="datetime-local"
            value={apunte.momento}
            onChange={(evento) => cambiar({ momento: evento.target.value })}
          />
        </section>

        {clase === 'comida' && (
          <section className="lista">
            <h2>¿Qué comida es?</h2>
            <SeleccionUnica
              nombre="Comida del día"
              opciones={TOMAS}
              valor={apunte.toma}
              alCambiar={(toma) => cambiar({ toma })}
            />
          </section>
        )}

        {clase === 'medicacion' && (
          <section className="lista">
            <h2>¿Qué has tomado?</h2>
            <SeleccionMultiple
              nombre="Medicación"
              opciones={MEDICAMENTOS}
              valores={apunte.medicamentos}
              alCambiar={(medicamentos) => cambiar({ medicamentos })}
            />
          </section>
        )}

        {clase === 'ciclo' && (
          <>
            <section className="lista">
              <h2>¿Cómo va?</h2>
              <SeleccionUnica
                nombre="Momento de la regla"
                opciones={FASES_CICLO}
                valor={apunte.fase}
                alCambiar={(fase) => cambiar({ fase })}
              />
            </section>
            <section className="lista">
              <h2>¿Cuánto flujo?</h2>
              <SeleccionUnica
                nombre="Flujo"
                opciones={FLUJOS}
                valor={apunte.flujo}
                alCambiar={(flujo) => cambiar({ flujo })}
              />
            </section>
          </>
        )}

        <section className="lista">
          <label htmlFor="texto">{PREGUNTAS_TEXTO[clase]}</label>
          <textarea
            id="texto"
            className="campo"
            rows={3}
            placeholder={EJEMPLOS_TEXTO[clase]}
            value={apunte.texto}
            onChange={(evento) => cambiar({ texto: evento.target.value })}
          />
        </section>

        {error !== '' && (
          <p className="aviso" role="alert">
            {error}
          </p>
        )}

        <div className="pie-registro">
          <button
            type="button"
            className="boton-siguiente"
            disabled={!apunteCompleto(apunte) || ocupado}
            onClick={guardar}
          >
            Guardar
          </button>

          {editando && !confirmando && (
            <button
              type="button"
              className="boton-texto boton-texto-peligro"
              disabled={ocupado}
              onClick={() => setConfirmando(true)}
            >
              Borrar este apunte
            </button>
          )}
          {editando && confirmando && (
            <div className="tarjeta confirmacion" role="group" aria-label="Confirmar borrado">
              <p>
                <strong>¿Borrar este apunte?</strong> No se puede deshacer.
              </p>
              <div className="fila-botones">
                <button
                  type="button"
                  className="boton-secundario"
                  disabled={ocupado}
                  onClick={() => setConfirmando(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="boton-secundario boton-peligro"
                  disabled={ocupado}
                  onClick={borrar}
                >
                  Sí, borrar
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
