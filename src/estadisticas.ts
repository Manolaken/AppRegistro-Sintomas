import {
  AGRAVANTES,
  ALIVIOS,
  ANIMOS,
  DURACIONES,
  IMPACTOS,
  MEDICAMENTOS,
  REGLAS,
  SINTOMAS,
  SUENOS,
  TIEMPOS_DESDE_COMIDA,
  TIPOS_DOLOR,
  ZONAS,
  zonasDeCeldas,
} from './datos.ts'
import { claveDia } from './fechas.ts'
import type { Apunte, Episodio, Opcion } from './tipos.ts'

// Cálculos para el informe: a partir de los registros de un periodo saca
// los totales y recuentos que le interesan al médico. Aquí no se dibuja
// nada; eso lo hace informe.ts.

// Cuántas veces aparece algo: { etiqueta: 'Náuseas', veces: 4 }.
export type Recuento = { etiqueta: string; veces: number }

export type DiaResumen = {
  // "2026-11-15"
  clave: string
  // Dolor más fuerte de ese día (0 si no hubo ninguno).
  maxima: number
  episodios: number
}

export type Resumen = {
  desde: string
  hasta: string
  diasPeriodo: number
  // Del más antiguo al más reciente.
  episodios: Episodio[]
  apuntes: Apunte[]
  diasConDolor: number
  intensidadMedia: number | null
  intensidadMaxima: number | null
  porDia: DiaResumen[]
  // Para cada una de las 81 celdas del mapa, en cuántos episodios se pintó.
  porCelda: number[]
  zonas: Recuento[]
  franjas: Recuento[]
  diasSemana: Recuento[]
  tipos: Recuento[]
  duraciones: Recuento[]
  sintomas: Recuento[]
  alivia: Recuento[]
  empeora: Recuento[]
  medicacion: Recuento[]
  impacto: Recuento[]
  tiempoComida: Recuento[]
  regla: Recuento[]
  sueno: Recuento[]
  animo: Recuento[]
}

const UN_DIA = 86400000

// Convierte "2026-11-15" en una fecha a mediodía, para que los cambios de
// hora de verano e invierno no desplacen el día.
function fechaDeClave(clave: string): Date {
  return new Date(`${clave}T12:00`)
}

// Suma (o resta) días a una clave de día.
export function sumarDias(clave: string, dias: number): string {
  const fecha = fechaDeClave(clave)
  fecha.setDate(fecha.getDate() + dias)
  return claveDia(fecha)
}

// Cuenta cuántas veces sale cada opción y descarta las que no salen nunca.
// Sirve igual para campos de un valor (tipo) que de varios (síntomas).
function contar<T extends string>(opciones: Opcion<T>[], valores: (T | null)[]): Recuento[] {
  return opciones
    .map((opcion) => ({
      etiqueta: opcion.etiqueta,
      veces: valores.filter((valor) => valor === opcion.id).length,
    }))
    .filter((recuento) => recuento.veces > 0)
}

// Ordena de más a menos frecuente.
function ordenar(recuentos: Recuento[]): Recuento[] {
  return [...recuentos].sort((a, b) => b.veces - a.veces)
}

// Resume los registros que caen entre dos días, ambos incluidos.
export function resumir(
  todosEpisodios: Episodio[],
  todosApuntes: Apunte[],
  desde: string,
  hasta: string,
): Resumen {
  const dentro = (momento: string) => {
    const dia = momento.slice(0, 10)
    return dia >= desde && dia <= hasta
  }
  const episodios = todosEpisodios
    .filter((episodio) => dentro(episodio.inicio))
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
  const apuntes = todosApuntes
    .filter((apunte) => dentro(apunte.momento))
    .sort((a, b) => a.momento.localeCompare(b.momento))

  const diasPeriodo =
    Math.round((fechaDeClave(hasta).getTime() - fechaDeClave(desde).getTime()) / UN_DIA) + 1

  // Un elemento por cada día del periodo, haya dolor o no.
  const porDia: DiaResumen[] = []
  for (let indice = 0; indice < diasPeriodo; indice += 1) {
    const clave = sumarDias(desde, indice)
    const delDia = episodios.filter((episodio) => episodio.inicio.slice(0, 10) === clave)
    porDia.push({
      clave,
      maxima: delDia.length > 0 ? Math.max(...delDia.map((episodio) => episodio.intensidad)) : 0,
      episodios: delDia.length,
    })
  }

  const porCelda = Array.from({ length: 81 }, () => 0)
  for (const episodio of episodios) {
    for (const celda of new Set(episodio.celdas)) {
      if (celda >= 0 && celda < 81) porCelda[celda] += 1
    }
  }

  const zonasTocadas = episodios.flatMap((episodio) => zonasDeCeldas(episodio.celdas))
  const zonas = ZONAS.map((zona) => ({
    etiqueta: zona.nombre,
    veces: zonasTocadas.filter((id) => id === zona.id).length,
  })).filter((recuento) => recuento.veces > 0)

  // Franja del día en la que empezó cada episodio.
  const horas = episodios.map((episodio) => Number(episodio.inicio.slice(11, 13)))
  const franjas: Recuento[] = [
    { etiqueta: 'Madrugada (0 a 6 h)', veces: horas.filter((hora) => hora < 6).length },
    { etiqueta: 'Mañana (6 a 12 h)', veces: horas.filter((hora) => hora >= 6 && hora < 12).length },
    { etiqueta: 'Tarde (12 a 20 h)', veces: horas.filter((hora) => hora >= 12 && hora < 20).length },
    { etiqueta: 'Noche (20 a 24 h)', veces: horas.filter((hora) => hora >= 20).length },
  ]

  // Día de la semana, con el lunes primero.
  const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const indicesDia = episodios.map(
    (episodio) => (fechaDeClave(episodio.inicio.slice(0, 10)).getDay() + 6) % 7,
  )
  const diasSemana = nombresDias.map((etiqueta, indice) => ({
    etiqueta,
    veces: indicesDia.filter((dia) => dia === indice).length,
  }))

  const intensidades = episodios.map((episodio) => episodio.intensidad)

  return {
    desde,
    hasta,
    diasPeriodo,
    episodios,
    apuntes,
    diasConDolor: porDia.filter((dia) => dia.episodios > 0).length,
    intensidadMedia:
      intensidades.length > 0
        ? intensidades.reduce((suma, valor) => suma + valor, 0) / intensidades.length
        : null,
    intensidadMaxima: intensidades.length > 0 ? Math.max(...intensidades) : null,
    porDia,
    porCelda,
    zonas: ordenar(zonas),
    franjas,
    diasSemana,
    tipos: ordenar(contar(TIPOS_DOLOR, episodios.map((episodio) => episodio.tipo))),
    duraciones: contar(DURACIONES, episodios.map((episodio) => episodio.duracion)),
    sintomas: ordenar(contar(SINTOMAS, episodios.flatMap((episodio) => episodio.sintomas))),
    alivia: ordenar(contar(ALIVIOS, episodios.flatMap((episodio) => episodio.alivia))),
    empeora: ordenar(contar(AGRAVANTES, episodios.flatMap((episodio) => episodio.empeora))),
    medicacion: ordenar(contar(MEDICAMENTOS, episodios.flatMap((episodio) => episodio.medicacion))),
    impacto: contar(IMPACTOS, episodios.map((episodio) => episodio.impacto)),
    tiempoComida: contar(TIEMPOS_DESDE_COMIDA, episodios.map((episodio) => episodio.tiempoDesdeComida)),
    regla: contar(REGLAS, episodios.map((episodio) => episodio.regla)),
    sueno: contar(SUENOS, episodios.map((episodio) => episodio.sueno)),
    animo: contar(ANIMOS, episodios.map((episodio) => episodio.animo)),
  }
}
