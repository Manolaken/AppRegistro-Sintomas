import { useState } from 'react'
import { borrarEpisodio } from '../almacen.ts'
import { IconoAtras } from '../componentes/Iconos.tsx'
import MapaAbdomen from '../componentes/MapaAbdomen.tsx'
import {
  ACTIVIDADES,
  AGRAVANTES,
  AGUAS,
  ALIVIOS,
  ANIMOS,
  DURACIONES,
  IMPACTOS,
  MEDICAMENTOS,
  REGLAS,
  SINTOMAS,
  SUENOS,
  TIEMPOS_DESDE_COMIDA,
  TIPOS_DOLOR,
  etiquetaDe,
  etiquetasDe,
  nombresDeZonas,
  textoIntensidad,
} from '../datos.ts'
import { textoFechaLarga } from '../fechas.ts'
import type { Episodio } from '../tipos.ts'

type Props = {
  episodio: Episodio
  alVolver: () => void
  alEditar: () => void
  alBorrar: () => void
}

// Ficha completa de un registro. Solo enseña los datos que se rellenaron.
export default function DetalleEpisodio({ episodio, alVolver, alEditar, alBorrar }: Props) {
  // Borrar pide confirmación: el primer toque solo enseña la pregunta.
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const [error, setError] = useState('')

  async function borrar() {
    setBorrando(true)
    setError('')
    try {
      await borrarEpisodio(episodio.id)
      alBorrar()
    } catch {
      setError('No se ha podido borrar. Inténtalo otra vez.')
      setBorrando(false)
    }
  }

  // Cada fila es [pregunta, respuesta]; las vacías no se muestran.
  const medicacion = [etiquetasDe(MEDICAMENTOS, episodio.medicacion), episodio.dosis.trim()]
    .filter((texto) => texto !== '')
    .join(' · ')
  const filas: [string, string][] = [
    ['Cuándo', textoFechaLarga(episodio.inicio)],
    ['Duración', etiquetaDe(DURACIONES, episodio.duracion)],
    ['Intensidad', `${episodio.intensidad} de 10 · ${textoIntensidad(episodio.intensidad)}`],
    ['Tipo de dolor', etiquetaDe(TIPOS_DOLOR, episodio.tipo)],
    ['Zona', nombresDeZonas(episodio.celdas).join(', ')],
    ['Otros síntomas', etiquetasDe(SINTOMAS, episodio.sintomas)],
    ['Comida y bebida antes', episodio.comida.trim()],
    ['Tiempo desde la última comida', etiquetaDe(TIEMPOS_DESDE_COMIDA, episodio.tiempoDesdeComida)],
    ['Sueño la noche anterior', etiquetaDe(SUENOS, episodio.sueno)],
    ['Ánimo', etiquetaDe(ANIMOS, episodio.animo)],
    ['Ejercicio ese día', etiquetaDe(ACTIVIDADES, episodio.actividad)],
    ['Agua ese día', etiquetaDe(AGUAS, episodio.agua)],
    ['Regla', etiquetaDe(REGLAS, episodio.regla)],
    ['Medicación', medicacion],
    ['Qué alivia', etiquetasDe(ALIVIOS, episodio.alivia)],
    ['Qué empeora', etiquetasDe(AGRAVANTES, episodio.empeora)],
    ['Cómo afectó', etiquetaDe(IMPACTOS, episodio.impacto)],
    ['Notas', episodio.notas.trim()],
  ]
  const filasConDatos = filas.filter(([, respuesta]) => respuesta !== '')

  return (
    <div className="pantalla">
      <main className="contenido">
        <div className="barra-superior">
          <button type="button" className="boton-redondo" aria-label="Volver" onClick={alVolver}>
            <IconoAtras />
          </button>
          <span className="paso">Registro</span>
          {/* Hueco del mismo ancho que el botón para centrar el título. */}
          <span className="hueco-boton" aria-hidden="true" />
        </div>

        <MapaAbdomen celdas={episodio.celdas} />

        <dl className="tarjeta ficha">
          {filasConDatos.map(([pregunta, respuesta]) => (
            <div key={pregunta} className="ficha-fila">
              <dt>{pregunta}</dt>
              <dd>{respuesta}</dd>
            </div>
          ))}
        </dl>

        {error !== '' && (
          <p className="aviso" role="alert">
            {error}
          </p>
        )}

        {confirmando ? (
          <div className="tarjeta confirmacion" role="group" aria-label="Confirmar borrado">
            <p>
              <strong>¿Borrar este registro?</strong> No se puede deshacer.
            </p>
            <div className="fila-botones">
              <button
                type="button"
                className="boton-secundario"
                disabled={borrando}
                onClick={() => setConfirmando(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="boton-secundario boton-peligro"
                disabled={borrando}
                onClick={borrar}
              >
                {borrando ? 'Borrando…' : 'Sí, borrar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="fila-botones">
            <button
              type="button"
              className="boton-secundario boton-peligro"
              onClick={() => setConfirmando(true)}
            >
              Borrar
            </button>
            <button type="button" className="boton-secundario" onClick={alEditar}>
              Editar
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
