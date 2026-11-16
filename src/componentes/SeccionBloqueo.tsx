import { useEffect, useState } from 'react'
import {
  activarFaceId,
  desactivarFaceId,
  faceIdDisponible,
  hayCodigo,
  hayFaceId,
  quitarBloqueo,
} from '../bloqueo.ts'

type Props = {
  // Abre la pantalla para poner o cambiar el código.
  alConfigurar: () => void
}

// Tarjeta de Ajustes para el bloqueo con código y Face ID.
export default function SeccionBloqueo({ alConfigurar }: Props) {
  const [conCodigo, setConCodigo] = useState(hayCodigo)
  const [conFaceId, setConFaceId] = useState(hayFaceId)
  // null mientras se pregunta al teléfono si tiene Face ID o huella.
  const [disponible, setDisponible] = useState<boolean | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    faceIdDisponible().then((respuesta) => {
      if (!cancelado) setDisponible(respuesta)
    })
    return () => {
      cancelado = true
    }
  }, [])

  async function activar() {
    setError('')
    try {
      await activarFaceId()
      setConFaceId(true)
    } catch {
      setError('No se ha podido activar Face ID. Puedes seguir usando el código.')
    }
  }

  function desactivar() {
    desactivarFaceId()
    setConFaceId(false)
  }

  function quitar() {
    quitarBloqueo()
    setConCodigo(false)
    setConFaceId(false)
    setConfirmando(false)
  }

  if (!conCodigo) {
    return (
      <section className="tarjeta">
        <h2>Bloqueo</h2>
        <p className="texto">
          Pon un código para que nadie más pueda abrir la app y ver tus registros.
        </p>
        <button type="button" className="boton-secundario" onClick={alConfigurar}>
          Poner un código
        </button>
      </section>
    )
  }

  return (
    <section className="tarjeta">
      <h2>Bloqueo</h2>
      <p className="texto">
        <strong>Activado.</strong> La app pide el código al abrirla y al volver después de un rato.
      </p>

      {disponible === true &&
        (conFaceId ? (
          <button type="button" className="boton-secundario" onClick={desactivar}>
            Dejar de usar Face ID
          </button>
        ) : (
          <button type="button" className="boton-secundario boton-lleno" onClick={activar}>
            Entrar también con Face ID
          </button>
        ))}
      {disponible === false && (
        <p className="nota">Face ID o huella no están disponibles en este dispositivo.</p>
      )}
      {error !== '' && (
        <p className="aviso" role="alert">
          {error}
        </p>
      )}

      {confirmando ? (
        <>
          <p className="texto">
            <strong>¿Quitar el bloqueo?</strong> Cualquiera que abra la app verá tus registros.
          </p>
          <div className="fila-botones">
            <button type="button" className="boton-secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </button>
            <button type="button" className="boton-secundario boton-peligro" onClick={quitar}>
              Sí, quitar
            </button>
          </div>
        </>
      ) : (
        <div className="fila-botones">
          <button
            type="button"
            className="boton-secundario boton-peligro"
            onClick={() => setConfirmando(true)}
          >
            Quitar
          </button>
          <button type="button" className="boton-secundario" onClick={alConfigurar}>
            Cambiar código
          </button>
        </div>
      )}
      <p className="nota">
        El bloqueo impide abrir la app, pero no cifra los datos. Guarda las copias de seguridad en
        un sitio que solo veas tú.
      </p>
    </section>
  )
}
