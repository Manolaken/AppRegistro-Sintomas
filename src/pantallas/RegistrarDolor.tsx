import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { guardarEpisodio } from '../almacen.ts'
import { IconoAtras, IconoCerrar } from '../componentes/Iconos.tsx'
import { episodioNuevo } from '../datos.ts'
import type { Episodio } from '../tipos.ts'
import PasoAntes from './registro/PasoAntes.tsx'
import PasoDespues from './registro/PasoDespues.tsx'
import PasoDolor from './registro/PasoDolor.tsx'
import PasoMomento from './registro/PasoMomento.tsx'

type Props = {
  // Si se pasa un episodio, el asistente lo edita en vez de crear uno nuevo.
  episodioInicial?: Episodio
  alSalir: () => void
  alGuardar: (episodio: Episodio) => void
}

const PASOS = [
  { titulo: '¿Dónde te duele?', subtitulo: 'Pinta con el dedo donde notas el dolor.' },
  { titulo: '¿Cuándo ha sido?', subtitulo: 'Solo el primer dato es necesario.' },
  { titulo: '¿Qué pasó antes?', subtitulo: 'Rellena lo que recuerdes; todo es opcional.' },
  { titulo: '¿Y después?', subtitulo: 'Lo último. Todo es opcional.' },
]

// Asistente de 4 pasos para registrar un episodio de dolor. Esta pantalla
// guarda el "borrador" del episodio y cada paso modifica una parte.
export default function RegistrarDolor({ episodioInicial, alSalir, alGuardar }: Props) {
  const [paso, setPaso] = useState(0)
  const [borrador, setBorrador] = useState<Episodio>(() => episodioInicial ?? episodioNuevo())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const esUltimo = paso === PASOS.length - 1
  const puedeSeguir = borrador.celdas.length > 0 && borrador.inicio !== ''

  function cambiar(cambios: Partial<Episodio>) {
    setBorrador((previo) => ({ ...previo, ...cambios }))
  }

  // El mapa necesita actualizar las celdas a partir de su valor más reciente
  // (mientras el dedo se mueve llegan muchos cambios seguidos).
  const cambiarCeldas: Dispatch<SetStateAction<number[]>> = (accion) => {
    setBorrador((previo) => ({
      ...previo,
      celdas: typeof accion === 'function' ? accion(previo.celdas) : accion,
    }))
  }

  function irA(nuevoPaso: number) {
    setPaso(nuevoPaso)
    window.scrollTo(0, 0)
  }

  function atras() {
    if (paso === 0) alSalir()
    else irA(paso - 1)
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    try {
      await guardarEpisodio(borrador)
      alGuardar(borrador)
    } catch {
      setError('No se ha podido guardar. Inténtalo otra vez.')
      setGuardando(false)
    }
  }

  return (
    <div className="pantalla">
      <main className="contenido">
        <div className="barra-superior">
          <button type="button" className="boton-redondo" aria-label="Atrás" onClick={atras}>
            <IconoAtras />
          </button>
          <span className="paso">
            {episodioInicial ? 'Editar · ' : ''}Paso {paso + 1} de {PASOS.length}
          </span>
          <button type="button" className="boton-redondo" aria-label="Cerrar" onClick={alSalir}>
            <IconoCerrar />
          </button>
        </div>

        <div className="progreso" aria-hidden="true">
          {PASOS.map((datos, indice) => (
            <span key={datos.titulo} className={indice <= paso ? 'tramo tramo-hecho' : 'tramo'} />
          ))}
        </div>

        <header>
          <h1>{PASOS[paso].titulo}</h1>
          <p className="subtitulo">{PASOS[paso].subtitulo}</p>
        </header>

        {paso === 0 && (
          <PasoDolor borrador={borrador} alCambiar={cambiar} alCambiarCeldas={cambiarCeldas} />
        )}
        {paso === 1 && <PasoMomento borrador={borrador} alCambiar={cambiar} />}
        {paso === 2 && <PasoAntes borrador={borrador} alCambiar={cambiar} />}
        {paso === 3 && <PasoDespues borrador={borrador} alCambiar={cambiar} />}

        {error !== '' && (
          <p className="aviso" role="alert">
            {error}
          </p>
        )}

        <div className="pie-registro">
          {esUltimo ? (
            <button
              type="button"
              className="boton-siguiente"
              disabled={!puedeSeguir || guardando}
              onClick={guardar}
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          ) : (
            <button
              type="button"
              className="boton-siguiente"
              disabled={!puedeSeguir}
              onClick={() => irA(paso + 1)}
            >
              {puedeSeguir ? 'Siguiente' : 'Pinta dónde te duele'}
            </button>
          )}
          {/* Atajo: a partir del paso 2 se puede guardar sin rellenar el resto. */}
          {paso > 0 && !esUltimo && (
            <button type="button" className="boton-texto" disabled={guardando} onClick={guardar}>
              Guardar ya, sin más detalles
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
