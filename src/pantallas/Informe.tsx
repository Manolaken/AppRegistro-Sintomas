import { useEffect, useState } from 'react'
import BarraPestanas from '../componentes/BarraPestanas.tsx'
import SeleccionUnica from '../componentes/SeleccionUnica.tsx'
import { entregarArchivo } from '../compartir.ts'
import { PERIODOS_INFORME } from '../datos.ts'
import { resumir, sumarDias } from '../estadisticas.ts'
import { claveDia } from '../fechas.ts'
import type { PeriodoInforme, Pestana } from '../tipos.ts'
import { useApuntes } from '../useApuntes.ts'
import { useEpisodios } from '../useEpisodios.ts'

type Props = {
  alIr: (pestana: Pestana) => void
}

// Pantalla para crear el informe en PDF que se enseña o envía al médico.
export default function Informe({ alIr }: Props) {
  const { episodios, error: errorEpisodios } = useEpisodios()
  const { apuntes, error: errorApuntes } = useApuntes()
  const [periodo, setPeriodo] = useState<PeriodoInforme>('30')
  // El nombre es opcional y no se guarda: solo sale en este informe.
  const [nombre, setNombre] = useState('')
  const [creando, setCreando] = useState(false)
  const [hecho, setHecho] = useState('')
  const [error, setError] = useState('')

  // El código que dibuja el PDF pesa bastante y va en un archivo aparte que
  // solo se descarga cuando hace falta. Se pide al entrar en esta pantalla
  // para que ya esté guardado si después no hay conexión.
  useEffect(() => {
    import('../informe.ts').catch(() => {})
  }, [])

  const cargando = episodios === null || apuntes === null
  const hoy = claveDia(new Date())

  // Primer día del periodo. Con "Todo" es el día del registro más antiguo.
  let desde = hoy
  if (periodo === '30') desde = sumarDias(hoy, -29)
  if (periodo === '90') desde = sumarDias(hoy, -89)
  if (periodo === 'todo') {
    const dias = [
      ...(episodios ?? []).map((episodio) => episodio.inicio.slice(0, 10)),
      ...(apuntes ?? []).map((apunte) => apunte.momento.slice(0, 10)),
    ].filter((dia) => dia !== '' && dia <= hoy)
    desde = dias.length > 0 ? dias.reduce((menor, dia) => (dia < menor ? dia : menor)) : hoy
  }

  const resumen = resumir(episodios ?? [], apuntes ?? [], desde, hoy)
  const dolores = resumen.episodios.length
  const numeroApuntes = resumen.apuntes.length
  const vacio = dolores + numeroApuntes === 0

  async function crear() {
    setCreando(true)
    setHecho('')
    setError('')
    try {
      const { crearArchivoInforme } = await import('../informe.ts')
      const archivo = await crearArchivoInforme(resumen, nombre)
      const resultado = await entregarArchivo([archivo])
      if (resultado === 'compartida') setHecho('Informe creado.')
      if (resultado === 'descargada') {
        setHecho('Informe descargado. Búscalo en la carpeta de descargas.')
      }
    } catch {
      setError('No se ha podido crear el informe. Comprueba la conexión e inténtalo otra vez.')
    }
    setCreando(false)
  }

  return (
    <div className="pantalla">
      <main className="contenido">
        <header>
          <h1>Informe</h1>
          <p className="subtitulo">Un PDF con tus registros para enseñar o enviar al médico.</p>
        </header>

        {(errorEpisodios !== '' || errorApuntes !== '') && (
          <p className="aviso" role="alert">
            {errorEpisodios || errorApuntes}
          </p>
        )}

        <section className="lista">
          <h2>¿De cuándo?</h2>
          <SeleccionUnica
            nombre="Periodo del informe"
            opciones={PERIODOS_INFORME}
            valor={periodo}
            alCambiar={(valor) => {
              // Siempre tiene que haber un periodo elegido.
              if (valor !== null) setPeriodo(valor)
            }}
          />
        </section>

        <section className="lista">
          <label htmlFor="nombre">Tu nombre (opcional)</label>
          <input
            id="nombre"
            className="campo"
            type="text"
            autoComplete="off"
            placeholder="Para que el médico sepa de quién es"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />
        </section>

        <section className="tarjeta">
          <h2>Qué incluirá</h2>
          {cargando ? (
            <p className="texto">Leyendo tus registros…</p>
          ) : vacio ? (
            <p className="texto">No hay nada registrado en ese periodo.</p>
          ) : (
            <>
              <p className="texto">
                <strong>
                  {dolores === 1 ? '1 dolor' : `${dolores} dolores`} y{' '}
                  {numeroApuntes === 1 ? '1 apunte' : `${numeroApuntes} apuntes`}
                </strong>
                {periodo === 'todo' ? ' en total.' : ` de los últimos ${resumen.diasPeriodo} días.`}
              </p>
              <p className="nota">
                Lleva un resumen con gráficas, el mapa de las zonas que más te duelen, el detalle
                de cada dolor y el diario de comidas, medicación y regla.
              </p>
            </>
          )}
          <button
            type="button"
            className="boton-secundario boton-lleno"
            disabled={cargando || vacio || creando}
            onClick={crear}
          >
            {creando ? 'Creando…' : 'Crear informe'}
          </button>
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
      </main>

      <BarraPestanas activa="informe" alIr={alIr} />
    </div>
  )
}
