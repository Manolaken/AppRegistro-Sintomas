import type { Opcion } from '../tipos.ts'

type Props<T extends string> = {
  // Nombre del grupo para lectores de pantalla.
  nombre: string
  opciones: Opcion<T>[]
  valores: T[]
  alCambiar: (valores: T[]) => void
}

// Fila de botones para elegir varias opciones a la vez.
export default function SeleccionMultiple<T extends string>({
  nombre,
  opciones,
  valores,
  alCambiar,
}: Props<T>) {
  function alternar(id: T) {
    if (valores.includes(id)) {
      alCambiar(valores.filter((valor) => valor !== id))
    } else {
      alCambiar([...valores, id])
    }
  }

  return (
    <div className="chips" role="group" aria-label={nombre}>
      {opciones.map((opcion) => {
        const activa = valores.includes(opcion.id)
        return (
          <button
            key={opcion.id}
            type="button"
            className={activa ? 'chip chip-activo' : 'chip'}
            aria-pressed={activa}
            onClick={() => alternar(opcion.id)}
          >
            {opcion.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
