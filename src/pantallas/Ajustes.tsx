import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import BarraPestanas from '../componentes/BarraPestanas.tsx'
import { crearCopia, entregarCopia, leerCopia, recuperarCopia, textoUltimaCopia } from '../copia.ts'
import { textoFechaLarga } from '../fechas.ts'
import type { Copia, Pestana } from '../tipos.ts'

type Props = {
  alIr: (pestana: Pestana) => void
}

// "3 dolores y 1 apunte"
function resumen(copia: Copia): string {
  const dolores = copia.episodios.length === 1 ? '1 dolor' : `${copia.episodios.length} dolores`
  const apuntes = copia.apuntes.length === 1 ? '1 apunte' : `${copia.apuntes.length} apuntes`
  return `${dolores} y ${apuntes}`
}

// Ajustes. De momento solo tiene la copia de seguridad.
export default function Ajustes({ alIr }: Props) {
  // Mensajes de la parte de guardar.
  const [ocupado, setOcupado] = useState(false)
  const [hecho, setHecho] = useState('')
  const [error, setError] = useState('')
  const [ultima, setUltima] = useState(textoUltimaCopia)

  // Parte de recuperar: la copia leída del archivo, pendiente de confirmar.
  const selector = useRef<HTMLInputElement>(null)
  const [pendiente, setPendiente] = useState<Copia | null>(null)
  const [recuperado, setRecuperado] = useState('')
  const [errorRecuperar, setErrorRecuperar] = useState('')

  async function guardarCopia() {
    setOcupado(true)
    setHecho('')
    setError('')
    try {
      const copia = await crearCopia()
      const resultado = await entregarCopia(copia)
      if (resultado === 'compartida') setHecho(`Copia creada con ${resumen(copia)}.`)
      if (resultado === 'descargada') {
        setHecho(`Copia descargada con ${resumen(copia)}. Búscala en la carpeta de descargas.`)
      }
      setUltima(textoUltimaCopia())
    } catch {
      setError('No se ha podido crear la copia. Inténtalo otra vez.')
    }
    setOcupado(false)
  }

  async function alElegirArchivo(evento: ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0]
    // Se vacía el selector para poder elegir el mismo archivo otra vez.
    evento.target.value = ''
    if (archivo === undefined) return
    setRecuperado('')
    setErrorRecuperar('')
    setPendiente(null)
    try {
      setPendiente(leerCopia(await archivo.text()))
    } catch (problema) {
      setErrorRecuperar(
        problema instanceof Error ? problema.message : 'No se ha podido leer el archivo.',
      )
    }
  }

  async function recuperar() {
    if (pendiente === null) return
    setOcupado(true)
    setErrorRecuperar('')
    try {
      await recuperarCopia(pendiente)
      setRecuperado(`Recuperados ${resumen(pendiente)}. Ya están en el historial.`)
      setPendiente(null)
    } catch {
      setErrorRecuperar('No se ha podido recuperar la copia. No se ha cambiado nada.')
    }
    setOcupado(false)
  }

  return (
    <div className="pantalla">
      <main className="contenido">
        <header>
          <h1>Ajustes</h1>
        </header>

        <section className="tarjeta">
          <h2>Guardar una copia</h2>
          <p className="texto">
            Tus registros solo están en este teléfono. Guarda una copia de vez en cuando, por si
            cambias de móvil o se borra la app.
          </p>
          <p className="texto">
            Última copia: <strong>{ultima}</strong>
          </p>
          <button
            type="button"
            className="boton-secundario boton-lleno"
            disabled={ocupado}
            onClick={guardarCopia}
          >
            Guardar una copia
          </button>
          <p className="nota">
            La copia es un archivo con todos tus registros. Guárdalo en Archivos o en iCloud y no
            lo compartas con quien no quieras que los lea.
          </p>
          {hecho !== '' && (
            <p className="confirmado" role="status">
              {hecho}
            </p>
          )}
          {error !== '' && (
            <p className="aviso" role="alert">
              {error}
            </p>
          )}
        </section>

        <section className="tarjeta">
          <h2>Recuperar una copia</h2>
          <p className="texto">
            Añade a este teléfono los registros de una copia. No borra nada de lo que ya tengas.
          </p>
          <input
            ref={selector}
            type="file"
            accept=".json,.txt,application/json,text/plain"
            className="oculto"
            aria-label="Archivo de la copia"
            onChange={alElegirArchivo}
          />
          {pendiente === null ? (
            <button
              type="button"
              className="boton-secundario"
              disabled={ocupado}
              onClick={() => selector.current?.click()}
            >
              Elegir archivo
            </button>
          ) : (
            <>
              <p className="texto">
                <strong>Copia con {resumen(pendiente)}</strong>
                {pendiente.creada !== '' && <>, hecha el {textoFechaLarga(pendiente.creada)}</>}.
              </p>
              <div className="fila-botones">
                <button
                  type="button"
                  className="boton-secundario"
                  disabled={ocupado}
                  onClick={() => setPendiente(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="boton-secundario boton-lleno"
                  disabled={ocupado}
                  onClick={recuperar}
                >
                  Recuperar
                </button>
              </div>
            </>
          )}
          {recuperado !== '' && (
            <p className="confirmado" role="status">
              {recuperado}
            </p>
          )}
          {errorRecuperar !== '' && (
            <p className="aviso" role="alert">
              {errorRecuperar}
            </p>
          )}
        </section>
      </main>

      <BarraPestanas activa="ajustes" alIr={alIr} />
    </div>
  )
}
