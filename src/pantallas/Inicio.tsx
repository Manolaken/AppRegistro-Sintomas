import BarraPestanas from '../componentes/BarraPestanas.tsx'
import { IconoCiclo, IconoComida, IconoMas, IconoMedicacion } from '../componentes/Iconos.tsx'
import TarjetaApunte from '../componentes/TarjetaApunte.tsx'
import TarjetaEpisodio from '../componentes/TarjetaEpisodio.tsx'
import { nivelDolor } from '../datos.ts'
import { claveDia } from '../fechas.ts'
import type { Apunte, ClaseApunte, Episodio, Pestana } from '../tipos.ts'
import { useApuntes } from '../useApuntes.ts'
import { useEpisodios } from '../useEpisodios.ts'

type Props = {
  alRegistrar: () => void
  alAbrir: (episodio: Episodio) => void
  // Empezar un apunte rápido nuevo de comida, medicación o regla.
  alApuntar: (clase: ClaseApunte) => void
  alAbrirApunte: (apunte: Apunte) => void
  alIr: (pestana: Pestana) => void
}

const LETRAS_DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MAXIMO_EN_INICIO = 3

export default function Inicio({
  alRegistrar,
  alAbrir,
  alApuntar,
  alAbrirApunte,
  alIr,
}: Props) {
  const { episodios, error } = useEpisodios()
  const { apuntes, error: errorApuntes } = useApuntes()

  const hoy = new Date()
  const fecha = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(hoy)

  // Los 7 días de esta semana (de lunes a domingo) con el dolor más fuerte
  // registrado en cada uno.
  const indiceHoy = (hoy.getDay() + 6) % 7
  const semana = LETRAS_DIA.map((letra, indice) => {
    const dia = new Date(hoy)
    dia.setDate(hoy.getDate() - indiceHoy + indice)
    const clave = claveDia(dia)
    const intensidades = (episodios ?? [])
      .filter((episodio) => episodio.inicio.slice(0, 10) === clave)
      .map((episodio) => episodio.intensidad)
    const maxima = intensidades.length > 0 ? Math.max(...intensidades) : 0
    return { letra, esHoy: indice === indiceHoy, nivel: nivelDolor(maxima) }
  })

  // Apuntes de hoy, en el orden en que pasaron.
  const claveHoy = claveDia(hoy)
  const apuntesHoy = (apuntes ?? [])
    .filter((apunte) => apunte.momento.slice(0, 10) === claveHoy)
    .reverse()

  const total = episodios?.length ?? 0
  const recientes = (episodios ?? []).slice(0, MAXIMO_EN_INICIO)

  return (
    <div className="pantalla">
      <main className="contenido">
        <header>
          <p className="fecha">{fecha}</p>
          <h1>¿Cómo estás hoy?</h1>
        </header>

        <button type="button" className="boton-principal" onClick={alRegistrar}>
          <span className="boton-principal-texto">
            <strong>Registrar dolor</strong>
            <span>Menos de un minuto</span>
          </span>
          <span className="boton-principal-icono">
            <IconoMas />
          </span>
        </button>

        {/* Apuntes rápidos: se anotan aunque no haya dolor. */}
        <div className="acciones">
          <button type="button" className="accion" onClick={() => alApuntar('comida')}>
            <IconoComida />
            Comida
          </button>
          <button type="button" className="accion" onClick={() => alApuntar('medicacion')}>
            <IconoMedicacion />
            Medicación
          </button>
          <button type="button" className="accion" onClick={() => alApuntar('ciclo')}>
            <IconoCiclo />
            Regla
          </button>
        </div>

        <section className="tarjeta">
          <div className="tarjeta-cabecera">
            <h2>Esta semana</h2>
            <span className="nota">Más oscuro = más dolor</span>
          </div>
          <div className="semana">
            {semana.map((dia) => (
              <div key={dia.letra} className={dia.esHoy ? 'dia dia-hoy' : 'dia'}>
                {dia.letra}
                <span className={`dia-marca nivel-${dia.nivel}`} />
              </div>
            ))}
          </div>
        </section>

        {errorApuntes !== '' && (
          <p className="aviso" role="alert">
            {errorApuntes}
          </p>
        )}
        {apuntesHoy.length > 0 && (
          <section className="lista">
            <h2>Hoy has apuntado</h2>
            <ul className="registros">
              {apuntesHoy.map((apunte) => (
                <li key={apunte.id}>
                  <TarjetaApunte apunte={apunte} soloHora alAbrir={alAbrirApunte} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="lista">
          <h2>Últimos dolores</h2>
          {error !== '' && (
            <p className="aviso" role="alert">
              {error}
            </p>
          )}
          {episodios !== null && total === 0 && error === '' && (
            <p className="tarjeta vacio">
              Aún no hay ninguno. Cuando anotes un dolor aparecerá aquí.
            </p>
          )}
          {recientes.length > 0 && (
            <ul className="registros">
              {recientes.map((episodio) => (
                <li key={episodio.id}>
                  <TarjetaEpisodio episodio={episodio} alAbrir={alAbrir} />
                </li>
              ))}
            </ul>
          )}
          {total > MAXIMO_EN_INICIO && (
            <button type="button" className="boton-texto" onClick={() => alIr('historial')}>
              Ver los {total} en el historial
            </button>
          )}
        </section>
      </main>

      <BarraPestanas activa="inicio" alIr={alIr} />
    </div>
  )
}
