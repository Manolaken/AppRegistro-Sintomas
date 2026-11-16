import { useState } from 'react'
import { LARGO_CODIGO, guardarCodigo } from '../bloqueo.ts'
import { IconoAtras } from '../componentes/Iconos.tsx'
import TecladoCodigo from '../componentes/TecladoCodigo.tsx'

type Props = {
  alTerminar: () => void
  alCancelar: () => void
}

// Poner o cambiar el código: se escribe dos veces para evitar despistes.
export default function ConfigurarCodigo({ alTerminar, alCancelar }: Props) {
  // El código elegido en el primer paso; vacío mientras no se ha escrito.
  const [primero, setPrimero] = useState('')
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')
  const repitiendo = primero !== ''

  function alTeclear(valor: string) {
    setMensaje('')
    if (valor.length < LARGO_CODIGO) {
      setCodigo(valor)
      return
    }
    setCodigo('')
    if (!repitiendo) {
      setPrimero(valor)
      return
    }
    if (valor === primero) {
      guardarCodigo(valor)
      alTerminar()
      return
    }
    setPrimero('')
    setMensaje('No coinciden. Empieza otra vez.')
  }

  return (
    <div className="pantalla">
      <main className="contenido bloqueo">
        <div className="barra-superior">
          <button type="button" className="boton-redondo" aria-label="Cancelar" onClick={alCancelar}>
            <IconoAtras />
          </button>
          <span className="paso">Código</span>
          <span className="hueco-boton" aria-hidden="true" />
        </div>
        <h1>{repitiendo ? 'Repite el código' : 'Elige un código'}</h1>
        <p className="subtitulo" role="status">
          {repitiendo
            ? 'Escríbelo otra vez para confirmarlo.'
            : `${LARGO_CODIGO} números que recuerdes bien. Si lo olvidas no hay forma de recuperarlo.`}
        </p>

        <TecladoCodigo valor={codigo} alCambiar={alTeclear} />

        {mensaje !== '' && (
          <p className="aviso" role="alert">
            {mensaje}
          </p>
        )}
      </main>
    </div>
  )
}
