import type { Pestana } from '../tipos.ts'
import { IconoAjustes, IconoHistorial, IconoInforme, IconoInicio } from './Iconos.tsx'

type Props = {
  activa: Pestana
  alIr: (pestana: Pestana) => void
}

// Barra inferior con las secciones de la app.
export default function BarraPestanas({ activa, alIr }: Props) {
  return (
    <nav className="pestanas" aria-label="Secciones">
      <button
        type="button"
        className={activa === 'inicio' ? 'pestana pestana-activa' : 'pestana'}
        aria-current={activa === 'inicio' ? 'page' : undefined}
        onClick={() => alIr('inicio')}
      >
        <IconoInicio />
        Inicio
      </button>
      <button
        type="button"
        className={activa === 'historial' ? 'pestana pestana-activa' : 'pestana'}
        aria-current={activa === 'historial' ? 'page' : undefined}
        onClick={() => alIr('historial')}
      >
        <IconoHistorial />
        Historial
      </button>
      <button
        type="button"
        className={activa === 'informe' ? 'pestana pestana-activa' : 'pestana'}
        aria-current={activa === 'informe' ? 'page' : undefined}
        onClick={() => alIr('informe')}
      >
        <IconoInforme />
        Informe
      </button>
      <button
        type="button"
        className={activa === 'ajustes' ? 'pestana pestana-activa' : 'pestana'}
        aria-current={activa === 'ajustes' ? 'page' : undefined}
        onClick={() => alIr('ajustes')}
      >
        <IconoAjustes />
        Ajustes
      </button>
    </nav>
  )
}
