import { importarDatos, listarApuntes, listarEpisodios } from './almacen.ts'
import { apunteNuevo, episodioNuevo } from './datos.ts'
import { ahoraLocal, claveDia } from './fechas.ts'
import type { Apunte, Copia, Episodio } from './tipos.ts'

// Copia de seguridad: guardar todos los registros en un archivo JSON y
// recuperarlos después (por ejemplo al cambiar de teléfono).

// Dónde se apunta cuándo se hizo la última copia. Es solo una fecha, y se
// guarda en localStorage, un almacén sencillo del navegador para datos
// pequeños.
const CLAVE_ULTIMA_COPIA = 'registro-sintomas:ultima-copia'
// A partir de cuántos días sin copia se avisa en el inicio.
export const DIAS_PARA_AVISAR = 14

// Reúne todo lo guardado en un objeto listo para escribir en un archivo.
export async function crearCopia(): Promise<Copia> {
  const [episodios, apuntes] = await Promise.all([listarEpisodios(), listarApuntes()])
  return { app: 'registro-sintomas', formato: 1, creada: ahoraLocal(), episodios, apuntes }
}

// "registro-sintomas-2026-11-15.json"
function nombreArchivo(): string {
  return `registro-sintomas-${claveDia(new Date())}.json`
}

// Entrega el archivo a la persona. En el iPhone abre el menú Compartir,
// desde donde se guarda en Archivos o iCloud; donde no hay menú Compartir
// (un ordenador), lo descarga.
export async function entregarCopia(copia: Copia): Promise<'compartida' | 'descargada' | 'cancelada'> {
  const texto = JSON.stringify(copia, null, 2)
  const nombre = nombreArchivo()

  // Algunos navegadores solo dejan compartir ciertos tipos de archivo, así
  // que se prueba primero como JSON y después como texto normal.
  const candidatos = [
    new File([texto], nombre, { type: 'application/json' }),
    new File([texto], nombre, { type: 'text/plain' }),
  ]
  if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function') {
    for (const archivo of candidatos) {
      if (!navigator.canShare({ files: [archivo] })) continue
      try {
        await navigator.share({ files: [archivo] })
        marcarCopiaHecha()
        return 'compartida'
      } catch (error) {
        // Cerrar el menú sin elegir nada no es un fallo.
        if (error instanceof DOMException && error.name === 'AbortError') return 'cancelada'
        // Cualquier otro problema: se intenta la descarga normal.
        break
      }
    }
  }

  const url = URL.createObjectURL(candidatos[0])
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
  marcarCopiaHecha()
  return 'descargada'
}

// --- Leer una copia ---

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

// Comprueba un episodio leído del archivo y le pone valores por defecto en
// los campos que falten (por si la copia es de una versión más antigua).
function episodioDeCopia(valor: unknown): Episodio | null {
  if (!esObjeto(valor)) return null
  const episodio = { ...episodioNuevo(), ...valor } as Episodio
  const valido =
    typeof episodio.id === 'string' &&
    episodio.id !== '' &&
    typeof episodio.inicio === 'string' &&
    typeof episodio.intensidad === 'number' &&
    Array.isArray(episodio.celdas) &&
    episodio.celdas.every((celda) => Number.isInteger(celda) && celda >= 0 && celda < 81)
  return valido ? episodio : null
}

function apunteDeCopia(valor: unknown): Apunte | null {
  if (!esObjeto(valor)) return null
  const apunte = { ...apunteNuevo('comida'), ...valor } as Apunte
  const valido =
    typeof apunte.id === 'string' &&
    apunte.id !== '' &&
    typeof apunte.momento === 'string' &&
    typeof apunte.texto === 'string' &&
    ['comida', 'medicacion', 'ciclo'].includes(apunte.clase)
  return valido ? apunte : null
}

// Convierte el texto de un archivo en una copia comprobada. Si el archivo
// no es una copia de esta app, lanza un error con un mensaje para mostrar.
export function leerCopia(texto: string): Copia {
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  } catch {
    throw new Error('Ese archivo no es una copia de esta app.')
  }
  if (
    !esObjeto(datos) ||
    datos.app !== 'registro-sintomas' ||
    !Array.isArray(datos.episodios) ||
    !Array.isArray(datos.apuntes)
  ) {
    throw new Error('Ese archivo no es una copia de esta app.')
  }
  if (datos.formato !== 1) {
    throw new Error('Esa copia es de una versión más nueva de la app. Actualiza la app primero.')
  }

  const episodios = datos.episodios.map(episodioDeCopia)
  const apuntes = datos.apuntes.map(apunteDeCopia)
  if (episodios.includes(null) || apuntes.includes(null)) {
    throw new Error('La copia está dañada y no se puede leer.')
  }
  return {
    app: 'registro-sintomas',
    formato: 1,
    creada: typeof datos.creada === 'string' ? datos.creada : '',
    episodios: episodios as Episodio[],
    apuntes: apuntes as Apunte[],
  }
}

// Añade a este teléfono los registros de una copia. No borra nada.
export function recuperarCopia(copia: Copia): Promise<void> {
  return importarDatos(copia.episodios, copia.apuntes)
}

// --- Cuándo se hizo la última copia ---

function marcarCopiaHecha(): void {
  try {
    localStorage.setItem(CLAVE_ULTIMA_COPIA, claveDia(new Date()))
  } catch {
    // Si el navegador no deja escribir, simplemente no se recuerda la fecha.
  }
}

// Días desde la última copia: 0 si fue hoy, null si nunca se ha hecho.
export function diasSinCopia(): number | null {
  let guardada: string | null = null
  try {
    guardada = localStorage.getItem(CLAVE_ULTIMA_COPIA)
  } catch {
    return null
  }
  if (guardada === null) return null
  const fecha = new Date(`${guardada}T00:00`)
  if (Number.isNaN(fecha.getTime())) return null
  const hoy = new Date(`${claveDia(new Date())}T00:00`)
  return Math.max(0, Math.round((hoy.getTime() - fecha.getTime()) / 86400000))
}

// "Nunca", "Hoy", "Ayer" o "Hace 5 días".
export function textoUltimaCopia(): string {
  const dias = diasSinCopia()
  if (dias === null) return 'Nunca'
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  return `Hace ${dias} días`
}
