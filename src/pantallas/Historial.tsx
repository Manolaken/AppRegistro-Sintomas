import BarraPestanas from '../componentes/BarraPestanas.tsx'
import TarjetaApunte from '../componentes/TarjetaApunte.tsx'
import TarjetaEpisodio from '../componentes/TarjetaEpisodio.tsx'
import type { Apunte, Episodio, Pestana } from '../tipos.ts'
import { useApuntes } from '../useApuntes.ts'
import { useEpisodios } from '../useEpisodios.ts'

type Props = {
  alAbrir: (episodio: Episodio) => void
  alAbrirApunte: (apunte: Apunte) => void
  alIr: (pestana: Pestana) => void
}

// Una línea del historial: un dolor o un apunte, con su momento para ordenar.
type Entrada =
  | { clase: 'episodio'; id: string; momento: string; episodio: Episodio }
  | { clase: 'apunte'; id: string; momento: string; apunte: Apunte }

// Nombre del mes de un momento, para agrupar la lista: "noviembre de 2026".
function mesDe(momento: string): string {
  const fecha = new Date(momento)
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(fecha)
}

function plural(cantidad: number, uno: string, varios: string): string {
  return cantidad === 1 ? `1 ${uno}` : `${cantidad} ${varios}`
}

// Todo lo anotado (dolores y apuntes rápidos), del más reciente al más
// antiguo y agrupado por mes.
export default function Historial({ alAbrir, alAbrirApunte, alIr }: Props) {
  const { episodios, error } = useEpisodios()
  const { apuntes, error: errorApuntes } = useApuntes()
  const cargado = episodios !== null && apuntes !== null

  const entradas: Entrada[] = [
    ...(episodios ?? []).map(
      (episodio): Entrada => ({
        clase: 'episodio',
        id: episodio.id,
        momento: episodio.inicio,
        episodio,
      }),
    ),
    ...(apuntes ?? []).map(
      (apunte): Entrada => ({ clase: 'apunte', id: apunte.id, momento: apunte.momento, apunte }),
    ),
  ].sort((a, b) => b.momento.localeCompare(a.momento))

  // Las entradas ya están ordenadas, así que basta con abrir un grupo
  // nuevo cada vez que cambia el mes.
  const grupos: { mes: string; entradas: Entrada[] }[] = []
  for (const entrada of entradas) {
    const mes = mesDe(entrada.momento)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo !== undefined && ultimo.mes === mes) ultimo.entradas.push(entrada)
    else grupos.push({ mes, entradas: [entrada] })
  }

  const hayError = error !== '' || errorApuntes !== ''

  return (
    <div className="pantalla">
      <main className="contenido">
        <header>
          <h1>Historial</h1>
          {cargado && (
            <p className="subtitulo">
              {plural((episodios ?? []).length, 'dolor', 'dolores')} y{' '}
              {plural((apuntes ?? []).length, 'apunte', 'apuntes')}
            </p>
          )}
        </header>

        {error !== '' && (
          <p className="aviso" role="alert">
            {error}
          </p>
        )}
        {errorApuntes !== '' && (
          <p className="aviso" role="alert">
            {errorApuntes}
          </p>
        )}

        {cargado && entradas.length === 0 && !hayError && (
          <p className="tarjeta vacio">Aún no hay nada anotado.</p>
        )}

        {grupos.map((grupo) => (
          <section key={grupo.mes} className="lista">
            <h2 className="mes">{grupo.mes}</h2>
            <ul className="registros">
              {grupo.entradas.map((entrada) => (
                <li key={`${entrada.clase}-${entrada.id}`}>
                  {entrada.clase === 'episodio' ? (
                    <TarjetaEpisodio episodio={entrada.episodio} alAbrir={alAbrir} />
                  ) : (
                    <TarjetaApunte apunte={entrada.apunte} alAbrir={alAbrirApunte} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <BarraPestanas activa="historial" alIr={alIr} />
    </div>
  )
}
