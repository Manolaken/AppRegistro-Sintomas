import { useState } from 'react'
import Ajustes from './pantallas/Ajustes.tsx'
import ApunteRapido from './pantallas/ApunteRapido.tsx'
import DetalleEpisodio from './pantallas/DetalleEpisodio.tsx'
import Historial from './pantallas/Historial.tsx'
import Inicio from './pantallas/Inicio.tsx'
import RegistrarDolor from './pantallas/RegistrarDolor.tsx'
import type { Apunte, ClaseApunte, Episodio, Pantalla, Pestana } from './tipos.ts'

// Navegación sencilla: una variable de estado decide qué pantalla se ve.
function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('inicio')
  // El registro de dolor que se está viendo o editando.
  const [seleccionado, setSeleccionado] = useState<Episodio | null>(null)
  // El apunte rápido en curso: su clase y, si se edita uno, el apunte.
  const [apunte, setApunte] = useState<{ clase: ClaseApunte; inicial?: Apunte } | null>(null)
  // Desde qué pestaña se abrió, para volver al mismo sitio.
  const [origen, setOrigen] = useState<Pestana>('inicio')

  function ir(nuevaPantalla: Pantalla) {
    setPantalla(nuevaPantalla)
    window.scrollTo(0, 0)
  }

  function abrir(episodio: Episodio, desde: Pestana) {
    setSeleccionado(episodio)
    setOrigen(desde)
    ir('detalle')
  }

  function abrirApunte(inicial: Apunte, desde: Pestana) {
    setApunte({ clase: inicial.clase, inicial })
    setOrigen(desde)
    ir('apunte')
  }

  function apuntar(clase: ClaseApunte) {
    setApunte({ clase })
    setOrigen('inicio')
    ir('apunte')
  }

  if (pantalla === 'registrar') {
    return <RegistrarDolor alSalir={() => ir('inicio')} alGuardar={() => ir('inicio')} />
  }

  if (pantalla === 'apunte' && apunte !== null) {
    return (
      <ApunteRapido
        clase={apunte.clase}
        apunteInicial={apunte.inicial}
        alSalir={() => ir(origen)}
        alTerminar={() => ir(origen)}
      />
    )
  }

  if (pantalla === 'editar' && seleccionado !== null) {
    return (
      <RegistrarDolor
        episodioInicial={seleccionado}
        alSalir={() => ir('detalle')}
        alGuardar={(guardado) => {
          setSeleccionado(guardado)
          ir('detalle')
        }}
      />
    )
  }

  if (pantalla === 'detalle' && seleccionado !== null) {
    return (
      <DetalleEpisodio
        episodio={seleccionado}
        alVolver={() => ir(origen)}
        alEditar={() => ir('editar')}
        alBorrar={() => {
          setSeleccionado(null)
          ir(origen)
        }}
      />
    )
  }

  if (pantalla === 'ajustes') {
    return <Ajustes alIr={ir} />
  }

  if (pantalla === 'historial') {
    return (
      <Historial
        alAbrir={(episodio) => abrir(episodio, 'historial')}
        alAbrirApunte={(inicial) => abrirApunte(inicial, 'historial')}
        alIr={ir}
      />
    )
  }

  return (
    <Inicio
      alRegistrar={() => ir('registrar')}
      alAbrir={(episodio) => abrir(episodio, 'inicio')}
      alApuntar={apuntar}
      alAbrirApunte={(inicial) => abrirApunte(inicial, 'inicio')}
      alIr={ir}
    />
  )
}

export default App
