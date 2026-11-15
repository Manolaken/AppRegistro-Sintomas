import { detalleEpisodio, nivelDolor, tituloEpisodio } from '../datos.ts'
import type { Episodio } from '../tipos.ts'

type Props = {
  episodio: Episodio
  alAbrir: (episodio: Episodio) => void
}

// Un registro en una lista: la intensidad en un círculo, el título y cuándo
// fue. Al tocarlo se abre su ficha.
export default function TarjetaEpisodio({ episodio, alAbrir }: Props) {
  return (
    <button type="button" className="tarjeta registro" onClick={() => alAbrir(episodio)}>
      <span className={`insignia nivel-${nivelDolor(episodio.intensidad)}`}>
        {episodio.intensidad}
      </span>
      <span className="registro-texto">
        <strong>{tituloEpisodio(episodio)}</strong>
        <span className="nota">{detalleEpisodio(episodio)}</span>
      </span>
    </button>
  )
}
