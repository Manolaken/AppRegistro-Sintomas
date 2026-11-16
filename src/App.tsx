import { useEffect, useState } from 'react'
import { SEGUNDOS_EN_SEGUNDO_PLANO, hayCodigo } from './bloqueo.ts'
import Navegacion from './Navegacion.tsx'
import Bloqueo from './pantallas/Bloqueo.tsx'

// Raíz de la app. Decide si se ve la pantalla de bloqueo o la app normal.
function App() {
  // Si hay código puesto, la app arranca bloqueada.
  const [bloqueada, setBloqueada] = useState(hayCodigo)

  // Vuelve a bloquear si la app ha estado un rato en segundo plano.
  useEffect(() => {
    let ocultaDesde = 0
    function alCambiarVisibilidad() {
      if (document.visibilityState === 'hidden') {
        ocultaDesde = Date.now()
        return
      }
      const segundos = (Date.now() - ocultaDesde) / 1000
      if (ocultaDesde !== 0 && hayCodigo() && segundos > SEGUNDOS_EN_SEGUNDO_PLANO) {
        setBloqueada(true)
      }
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  }, [])

  // La app sigue montada debajo (oculta) para no perder lo que se estuviera
  // rellenando cuando salta el bloqueo.
  return (
    <>
      {bloqueada && <Bloqueo alDesbloquear={() => setBloqueada(false)} />}
      <div hidden={bloqueada}>
        <Navegacion />
      </div>
    </>
  )
}

export default App
