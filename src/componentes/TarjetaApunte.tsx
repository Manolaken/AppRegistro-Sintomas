import { momentoApunte, resumenApunte, tituloApunte } from '../datos.ts'
import type { Apunte } from '../tipos.ts'
import { IconoCiclo, IconoComida, IconoMedicacion } from './Iconos.tsx'

type Props = {
  apunte: Apunte
  // En la lista de hoy basta con la hora; en el historial va el día también.
  soloHora?: boolean
  alAbrir: (apunte: Apunte) => void
}

// Un apunte rápido en una lista. Al tocarlo se abre para corregirlo o borrarlo.
export default function TarjetaApunte({ apunte, soloHora = false, alAbrir }: Props) {
  const resumen = resumenApunte(apunte)
  return (
    <button type="button" className="tarjeta registro apunte" onClick={() => alAbrir(apunte)}>
      <span className="insignia insignia-apunte">
        {apunte.clase === 'comida' && <IconoComida />}
        {apunte.clase === 'medicacion' && <IconoMedicacion />}
        {apunte.clase === 'ciclo' && <IconoCiclo />}
      </span>
      <span className="registro-texto">
        <strong>
          {tituloApunte(apunte)} · {momentoApunte(apunte, soloHora)}
        </strong>
        {resumen !== '' && <span className="nota">{resumen}</span>}
      </span>
    </button>
  )
}
