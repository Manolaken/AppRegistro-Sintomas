// Utilidades de fecha. Las fechas se guardan como texto en hora local con
// el formato "2026-11-15T14:20", que es el que usa <input type="datetime-local">.

function dosCifras(numero: number): string {
  return String(numero).padStart(2, '0')
}

// "2026-11-15" para una fecha dada.
export function claveDia(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosCifras(fecha.getMonth() + 1)}-${dosCifras(fecha.getDate())}`
}

// El momento actual con el formato de guardado.
export function ahoraLocal(): string {
  const ahora = new Date()
  return `${claveDia(ahora)}T${dosCifras(ahora.getHours())}:${dosCifras(ahora.getMinutes())}`
}

// Texto corto para las listas: "Hoy, 14:20", "Ayer, 21:05" o "vie 13 nov, 21:05".
export function textoMomento(inicio: string): string {
  const fecha = new Date(inicio)
  if (Number.isNaN(fecha.getTime())) return ''

  const hora = `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)

  if (claveDia(fecha) === claveDia(hoy)) return `Hoy, ${hora}`
  if (claveDia(fecha) === claveDia(ayer)) return `Ayer, ${hora}`

  const dia = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(fecha)
  return `${dia}, ${hora}`
}

// Texto completo para la ficha de un registro:
// "domingo, 15 de noviembre de 2026, 14:20".
export function textoFechaLarga(inicio: string): string {
  const fecha = new Date(inicio)
  if (Number.isNaN(fecha.getTime())) return ''
  const dia = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha)
  return `${dia}, ${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`
}

// Solo la hora de un momento guardado: "14:20".
export function textoHora(momento: string): string {
  const fecha = new Date(momento)
  if (Number.isNaN(fecha.getTime())) return ''
  return `${dosCifras(fecha.getHours())}:${dosCifras(fecha.getMinutes())}`
}
