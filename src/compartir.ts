// Entrega un archivo a la persona. En el iPhone abre el menú Compartir,
// desde donde se guarda en Archivos, se envía por correo, etc.; donde no
// hay menú Compartir (un ordenador), lo descarga.
//
// Se pasan uno o varios "candidatos": el mismo archivo con distintos tipos.
// Algunos navegadores solo dejan compartir ciertos tipos, así que se usa el
// primero que acepten.
export async function entregarArchivo(
  candidatos: File[],
): Promise<'compartida' | 'descargada' | 'cancelada'> {
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    for (const archivo of candidatos) {
      if (!navigator.canShare({ files: [archivo] })) continue
      try {
        await navigator.share({ files: [archivo] })
        return 'compartida'
      } catch (error) {
        // Cerrar el menú sin elegir nada no es un fallo.
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelada'
        // Cualquier otro problema: se intenta la descarga normal.
        break
      }
    }
  }

  const archivo = candidatos[0]
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = archivo.name
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  return 'descargada'
}
