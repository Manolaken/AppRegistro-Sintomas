import type { Opcion } from '../tipos.ts'

type Props<T extends string> = {
  // Nombre del grupo para lectores de pantalla.
  nombre: string
  opciones: Opcion<T>[]
  valor: T | null
  alCambiar: (valor: T | null) => void
}

// Fila de botones para elegir una sola opción. Tocar la que ya está
// elegida la desmarca.
export default function SeleccionUnica<T extends string>({
  nombre,
  opciones,
  valor,
  alCambiar,
}: Props<T>) {
  return (
    <div className="chips" role="group" aria-label={nombre}>
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          className={valor === opcion.id ? 'chip chip-activo' : 'chip'}
          aria-pressed={valor === opcion.id}
          onClick={() => alCambiar(valor === opcion.id ? null : opcion.id)}
        >
          {opcion.etiqueta}
        </button>
      ))}
    </div>
  )
}
