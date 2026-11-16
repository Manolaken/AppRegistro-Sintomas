import { useEffect, useState } from 'react'
import {
  LARGO_CODIGO,
  comprobarCodigo,
  desbloquearConFaceId,
  hayFaceId,
  segundosDeEspera,
} from '../bloqueo.ts'
import { IconoCandado } from '../componentes/Iconos.tsx'
import TecladoCodigo from '../componentes/TecladoCodigo.tsx'

type Props = {
  alDesbloquear: () => void
}

// Pantalla que tapa la app hasta que se escribe el código o se pasa Face ID.
export default function Bloqueo({ alDesbloquear }: Props) {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [espera, setEspera] = useState(segundosDeEspera)
  const [ayuda, setAyuda] = useState(false)
  const conFaceId = hayFaceId()

  // Mientras haya que esperar, se actualiza la cuenta atrás cada segundo.
  useEffect(() => {
    if (espera <= 0) return
    const reloj = setInterval(() => setEspera(segundosDeEspera()), 1000)
    return () => clearInterval(reloj)
  }, [espera])

  function alTeclear(valor: string) {
    setMensaje('')
    if (valor.length < LARGO_CODIGO) {
      setCodigo(valor)
      return
    }
    const resultado = comprobarCodigo(valor)
    if (resultado === 'bien') {
      alDesbloquear()
      return
    }
    setCodigo('')
    setEspera(segundosDeEspera())
    if (resultado === 'mal') setMensaje('Código incorrecto.')
  }

  async function usarFaceId() {
    setMensaje('')
    if (await desbloquearConFaceId()) alDesbloquear()
    else setMensaje('No se ha podido usar Face ID. Escribe el código.')
  }

  return (
    <div className="pantalla">
      <main className="contenido bloqueo">
        <span className="bloqueo-icono">
          <IconoCandado />
        </span>
        <h1>Registro de Síntomas</h1>
        <p className="subtitulo" role="status">
          {espera > 0
            ? `Demasiados intentos. Espera ${espera} s.`
            : 'Escribe tu código para entrar.'}
        </p>

        <TecladoCodigo valor={codigo} alCambiar={alTeclear} desactivado={espera > 0} />

        {mensaje !== '' && (
          <p className="aviso" role="alert">
            {mensaje}
          </p>
        )}

        {conFaceId && (
          <button type="button" className="boton-secundario" onClick={usarFaceId}>
            Usar Face ID
          </button>
        )}

        <button type="button" className="boton-texto" onClick={() => setAyuda(!ayuda)}>
          ¿Has olvidado el código?
        </button>
        {ayuda && (
          <p className="tarjeta texto">
            {conFaceId
              ? 'Entra con Face ID y cambia el código en Ajustes.'
              : 'Sin el código no se puede entrar. La única salida es borrar la app de la pantalla de inicio y volver a instalarla: se pierden los registros que no estén en una copia de seguridad.'}
          </p>
        )}
      </main>
    </div>
  )
}
