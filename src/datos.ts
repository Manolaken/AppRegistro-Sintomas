import { ahoraLocal, textoHora, textoMomento } from './fechas.ts'
import type {
  Actividad,
  Agravante,
  Agua,
  Alivio,
  Animo,
  Apunte,
  ClaseApunte,
  Duracion,
  Episodio,
  FaseCiclo,
  Flujo,
  Impacto,
  Medicamento,
  Opcion,
  Regla,
  Sintoma,
  Sueno,
  TiempoDesdeComida,
  TipoDolor,
  Toma,
  ZonaId,
} from './tipos.ts'

// El dolor se marca en una cuadrícula de 9 x 9 celdas sobre el abdomen:
// 9 cuadros grandes, cada uno dividido en 3 x 3.
// Cada celda se guarda como un número: fila * 9 + columna, empezando en 0
// por arriba a la izquierda de la pantalla.
export const CELDAS_POR_LADO = 9

// Las 9 regiones médicas del abdomen, de izquierda a derecha y de arriba
// abajo en la pantalla. El dibujo está de frente, así que el lado derecho de
// la persona queda a la izquierda de la pantalla. Cada región ocupa un
// cuadro de 3 x 3 celdas. "nombre" es el término médico (irá en el informe)
// y "etiqueta" es la descripción sencilla.
export const ZONAS: { id: ZonaId; nombre: string; etiqueta: string }[] = [
  { id: 'hipocondrio-derecho', nombre: 'Hipocondrio derecho', etiqueta: 'Arriba, tu derecha' },
  { id: 'epigastrio', nombre: 'Epigastrio', etiqueta: 'Arriba, centro' },
  { id: 'hipocondrio-izquierdo', nombre: 'Hipocondrio izquierdo', etiqueta: 'Arriba, tu izquierda' },
  { id: 'flanco-derecho', nombre: 'Flanco derecho', etiqueta: 'A la altura del ombligo, tu derecha' },
  { id: 'umbilical', nombre: 'Zona umbilical', etiqueta: 'Alrededor del ombligo' },
  { id: 'flanco-izquierdo', nombre: 'Flanco izquierdo', etiqueta: 'A la altura del ombligo, tu izquierda' },
  { id: 'fosa-iliaca-derecha', nombre: 'Fosa ilíaca derecha', etiqueta: 'Abajo, tu derecha' },
  { id: 'hipogastrio', nombre: 'Hipogastrio', etiqueta: 'Abajo, centro' },
  { id: 'fosa-iliaca-izquierda', nombre: 'Fosa ilíaca izquierda', etiqueta: 'Abajo, tu izquierda' },
]

export const TIPOS_DOLOR: Opcion<TipoDolor>[] = [
  { id: 'colico', etiqueta: 'Cólico' },
  { id: 'punzante', etiqueta: 'Punzante' },
  { id: 'ardor', etiqueta: 'Ardor' },
  { id: 'presion', etiqueta: 'Presión' },
]

export function textoIntensidad(valor: number): string {
  if (valor === 0) return 'Nada'
  if (valor <= 3) return 'Leve'
  if (valor <= 6) return 'Moderado'
  if (valor <= 8) return 'Fuerte'
  return 'Muy fuerte'
}

// Traduce las celdas pintadas a las regiones médicas que tocan. Servirá para
// el informe: el médico leerá "hipogastrio" en vez de una lista de celdas.
export function zonasDeCeldas(celdas: number[]): ZonaId[] {
  const lado = CELDAS_POR_LADO / 3
  const tocadas = new Set<ZonaId>()
  for (const celda of celdas) {
    const fila = Math.floor(celda / CELDAS_POR_LADO)
    const columna = celda % CELDAS_POR_LADO
    const indiceZona = Math.floor(fila / lado) * 3 + Math.floor(columna / lado)
    tocadas.add(ZONAS[indiceZona].id)
  }
  return ZONAS.filter((zona) => tocadas.has(zona.id)).map((zona) => zona.id)
}

// Nivel de dolor en tres escalones, para elegir el color con que se pinta:
// 0 = sin dolor, 1 = leve, 2 = moderado, 3 = fuerte.
export function nivelDolor(intensidad: number): 0 | 1 | 2 | 3 {
  if (intensidad <= 0) return 0
  if (intensidad <= 3) return 1
  if (intensidad <= 6) return 2
  return 3
}

// --- Opciones de los pasos 2 a 4 del registro ---

export const DURACIONES: Opcion<Duracion>[] = [
  { id: 'menos-15', etiqueta: 'Menos de 15 min' },
  { id: '15-30', etiqueta: '15 a 30 min' },
  { id: '30-60', etiqueta: '30 a 60 min' },
  { id: '1-2h', etiqueta: '1 a 2 horas' },
  { id: 'mas-2h', etiqueta: 'Más de 2 horas' },
  { id: 'sigue', etiqueta: 'Aún me duele' },
]

export const SINTOMAS: Opcion<Sintoma>[] = [
  { id: 'nauseas', etiqueta: 'Náuseas' },
  { id: 'vomitos', etiqueta: 'Vómitos' },
  { id: 'fiebre', etiqueta: 'Fiebre' },
  { id: 'mareo', etiqueta: 'Mareo' },
  { id: 'hinchazon', etiqueta: 'Hinchazón' },
  { id: 'gases', etiqueta: 'Gases' },
  { id: 'diarrea', etiqueta: 'Diarrea' },
  { id: 'estrenimiento', etiqueta: 'Estreñimiento' },
  { id: 'acidez', etiqueta: 'Acidez' },
  { id: 'sin-apetito', etiqueta: 'Sin apetito' },
]

export const TIEMPOS_DESDE_COMIDA: Opcion<TiempoDesdeComida>[] = [
  { id: 'menos-1h', etiqueta: 'Menos de 1 hora' },
  { id: '1-2h', etiqueta: '1 a 2 horas' },
  { id: '2-4h', etiqueta: '2 a 4 horas' },
  { id: 'mas-4h', etiqueta: 'Más de 4 horas' },
]

export const SUENOS: Opcion<Sueno>[] = [
  { id: 'bien', etiqueta: 'Bien' },
  { id: 'regular', etiqueta: 'Regular' },
  { id: 'mal', etiqueta: 'Mal' },
]

export const ANIMOS: Opcion<Animo>[] = [
  { id: 'calma', etiqueta: 'Con calma' },
  { id: 'normal', etiqueta: 'Normal' },
  { id: 'nervios', etiqueta: 'Con nervios o estrés' },
]

export const ACTIVIDADES: Opcion<Actividad>[] = [
  { id: 'ninguna', etiqueta: 'Ninguno' },
  { id: 'suave', etiqueta: 'Suave' },
  { id: 'intensa', etiqueta: 'Intenso' },
]

export const AGUAS: Opcion<Agua>[] = [
  { id: 'poca', etiqueta: 'Poca' },
  { id: 'normal', etiqueta: 'Normal' },
  { id: 'mucha', etiqueta: 'Mucha' },
]

export const REGLAS: Opcion<Regla>[] = [
  { id: 'si', etiqueta: 'Sí' },
  { id: 'no', etiqueta: 'No' },
  { id: 'pronto', etiqueta: 'Me viene pronto' },
]

export const MEDICAMENTOS: Opcion<Medicamento>[] = [
  { id: 'paracetamol', etiqueta: 'Paracetamol' },
  { id: 'ibuprofeno', etiqueta: 'Ibuprofeno' },
  { id: 'otro', etiqueta: 'Otro' },
]

export const ALIVIOS: Opcion<Alivio>[] = [
  { id: 'reposo', etiqueta: 'Descansar' },
  { id: 'calor', etiqueta: 'Calor' },
  { id: 'bano', etiqueta: 'Ir al baño' },
  { id: 'comer', etiqueta: 'Comer' },
  { id: 'medicacion', etiqueta: 'La medicación' },
  { id: 'nada', etiqueta: 'Nada' },
]

export const AGRAVANTES: Opcion<Agravante>[] = [
  { id: 'comer', etiqueta: 'Comer' },
  { id: 'moverme', etiqueta: 'Moverme' },
  { id: 'tumbarme', etiqueta: 'Tumbarme' },
  { id: 'estres', etiqueta: 'Los nervios' },
  { id: 'nada', etiqueta: 'Nada' },
]

export const IMPACTOS: Opcion<Impacto>[] = [
  { id: 'normal', etiqueta: 'Seguí con lo que estaba haciendo' },
  { id: 'pausa', etiqueta: 'Tuve que parar un rato' },
  { id: 'impidio', etiqueta: 'No pude ir a clase o hacer mis planes' },
]

// Busca el texto de una opción a partir de su id.
export function etiquetaDe<T extends string>(opciones: Opcion<T>[], id: T | null): string {
  return opciones.find((opcion) => opcion.id === id)?.etiqueta ?? ''
}

// Un episodio recién empezado, con todo vacío y la hora actual.
export function episodioNuevo(): Episodio {
  return {
    // Identificador único: el instante de creación más unas letras al azar.
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    inicio: ahoraLocal(),
    duracion: null,
    celdas: [],
    intensidad: 5,
    tipo: null,
    sintomas: [],
    comida: '',
    tiempoDesdeComida: null,
    sueno: null,
    animo: null,
    actividad: null,
    agua: null,
    regla: null,
    medicacion: [],
    dosis: '',
    alivia: [],
    empeora: [],
    impacto: null,
    notas: '',
  }
}

// Junta en una frase los textos de varias opciones: "Náuseas, Gases".
export function etiquetasDe<T extends string>(opciones: Opcion<T>[], ids: T[]): string {
  return opciones
    .filter((opcion) => ids.includes(opcion.id))
    .map((opcion) => opcion.etiqueta)
    .join(', ')
}

// Nombres médicos de las regiones que toca un episodio.
export function nombresDeZonas(celdas: number[]): string[] {
  const ids = zonasDeCeldas(celdas)
  return ZONAS.filter((zona) => ids.includes(zona.id)).map((zona) => zona.nombre)
}

// Título de un episodio en las listas: "Cólico · Hipogastrio".
export function tituloEpisodio(episodio: Episodio): string {
  const tipo = etiquetaDe(TIPOS_DOLOR, episodio.tipo) || 'Dolor'
  const zonas = nombresDeZonas(episodio.celdas)
  if (zonas.length === 0) return tipo
  if (zonas.length <= 2) return `${tipo} · ${zonas.join(' y ')}`
  return `${tipo} · ${zonas[0]} y ${zonas.length - 1} zonas más`
}

// Segunda línea en las listas: "Hoy, 14:20 · 30 a 60 min".
export function detalleEpisodio(episodio: Episodio): string {
  const duracion = etiquetaDe(DURACIONES, episodio.duracion)
  const momento = textoMomento(episodio.inicio)
  return duracion === '' ? momento : `${momento} · ${duracion}`
}

// --- Apuntes rápidos ---

export const NOMBRES_APUNTE: Record<ClaseApunte, string> = {
  comida: 'Comida',
  medicacion: 'Medicación',
  ciclo: 'Regla',
}

export const TOMAS: Opcion<Toma>[] = [
  { id: 'desayuno', etiqueta: 'Desayuno' },
  { id: 'almuerzo', etiqueta: 'Almuerzo' },
  { id: 'comida', etiqueta: 'Comida' },
  { id: 'merienda', etiqueta: 'Merienda' },
  { id: 'cena', etiqueta: 'Cena' },
  { id: 'picoteo', etiqueta: 'Entre horas' },
]

export const FASES_CICLO: Opcion<FaseCiclo>[] = [
  { id: 'empieza', etiqueta: 'Me ha venido hoy' },
  { id: 'sigue', etiqueta: 'Sigo con ella' },
  { id: 'termina', etiqueta: 'Se me ha acabado' },
]

export const FLUJOS: Opcion<Flujo>[] = [
  { id: 'poco', etiqueta: 'Poco' },
  { id: 'normal', etiqueta: 'Normal' },
  { id: 'mucho', etiqueta: 'Mucho' },
]

// Un apunte recién empezado, vacío y con la hora actual.
export function apunteNuevo(clase: ClaseApunte): Apunte {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    clase,
    momento: ahoraLocal(),
    texto: '',
    toma: null,
    medicamentos: [],
    fase: null,
    flujo: null,
  }
}

// Si el apunte tiene lo mínimo para guardarse.
export function apunteCompleto(apunte: Apunte): boolean {
  if (apunte.momento === '') return false
  if (apunte.clase === 'comida') return apunte.texto.trim() !== ''
  if (apunte.clase === 'medicacion') {
    return apunte.medicamentos.length > 0 || apunte.texto.trim() !== ''
  }
  return apunte.fase !== null
}

// Título de un apunte en las listas: "Cena", "Medicación" o "Regla".
export function tituloApunte(apunte: Apunte): string {
  if (apunte.clase === 'comida') return etiquetaDe(TOMAS, apunte.toma) || 'Comida'
  return NOMBRES_APUNTE[apunte.clase]
}

// Resumen de un apunte en una línea: "Ibuprofeno · 1 de 400".
export function resumenApunte(apunte: Apunte): string {
  const partes: string[] = []
  if (apunte.clase === 'medicacion') partes.push(etiquetasDe(MEDICAMENTOS, apunte.medicamentos))
  if (apunte.clase === 'ciclo') {
    partes.push(etiquetaDe(FASES_CICLO, apunte.fase))
    const flujo = etiquetaDe(FLUJOS, apunte.flujo)
    if (flujo !== '') partes.push(`Flujo: ${flujo.toLowerCase()}`)
  }
  partes.push(apunte.texto.trim())
  return partes.filter((parte) => parte !== '').join(' · ')
}

// Cuándo fue un apunte. En la lista de hoy basta con la hora.
export function momentoApunte(apunte: Apunte, soloHora: boolean): string {
  return soloHora ? textoHora(apunte.momento) : textoMomento(apunte.momento)
}
