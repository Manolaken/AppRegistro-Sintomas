import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { PDFFont, PDFPage, RGB } from 'pdf-lib'
import {
  ACTIVIDADES,
  AGRAVANTES,
  AGUAS,
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
  etiquetaDe,
  etiquetasDe,
  nombresDeZonas,
  resumenApunte,
  textoIntensidad,
  tituloApunte,
} from './datos.ts'
import type { Recuento, Resumen } from './estadisticas.ts'
import { claveDia, textoFechaLarga, textoHora } from './fechas.ts'
import type { Episodio } from './tipos.ts'

// Dibuja el informe para el médico en un PDF. Usa la librería pdf-lib, que
// solo sabe colocar textos, líneas y rectángulos en coordenadas: aquí se
// decide dónde va cada cosa y cuándo hay que saltar de página.
//
// Las medidas están en puntos (1 punto = 1/72 de pulgada). En un PDF el
// origen está abajo a la izquierda, así que la "y" baja al avanzar el texto.

const ANCHO = 595.28 // A4
const ALTO = 841.89
const MARGEN = 42
const UTIL = ANCHO - MARGEN * 2
const PIE = 30 // espacio reservado abajo para el pie de página

const TINTA = rgb(0.07, 0.07, 0.07)
const GRIS = rgb(0.38, 0.38, 0.38)
const LINEA = rgb(0.8, 0.8, 0.8)
const FONDO = rgb(0.95, 0.96, 0.98)
// Azules de menos a más dolor: leve, moderado y fuerte.
const AZULES = [rgb(0.75, 0.82, 1), rgb(0.44, 0.56, 1), rgb(0.11, 0.23, 0.72)]
const AZUL = AZULES[1]

// Contorno del torso: el mismo trazado que usa MapaAbdomen.tsx en la app.
const CONTORNO_TORSO =
  'M72 8C48 12 34 30 34 58l10 102c2 40-6 75-12 104h196c-6-29-14-64-12-104l10-102c0-28-14-46-38-50-12 16-34 24-58 24S84 24 72 8z'

// "2026-11-15" -> "15 nov 2026"
function fechaCorta(clave: string, conAnio = true): string {
  const fecha = new Date(`${clave}T12:00`)
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: conAnio ? 'numeric' : undefined,
  }).format(fecha)
}

// "2026-11-15" -> "domingo, 15 de noviembre de 2026"
function fechaDiaLargo(clave: string): string {
  const fecha = new Date(`${clave}T12:00`)
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(fecha)
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Color de una barra según la intensidad (0 a 10).
function colorIntensidad(intensidad: number): RGB {
  if (intensidad <= 3) return AZULES[0]
  if (intensidad <= 6) return AZULES[1]
  return AZULES[2]
}

// Nombre del archivo: "informe-sintomas-2026-11-15.pdf".
export function nombreInforme(): string {
  return `informe-sintomas-${claveDia(new Date())}.pdf`
}

// Crea el PDF y devuelve sus bytes. "nombre" es opcional: si se da, sale
// en la cabecera para que el médico sepa de quién es el informe.
export async function crearInformePdf(resumen: Resumen, nombre: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.setTitle('Registro de síntomas: informe')
  doc.setCreator('Registro de Síntomas')
  const normal = await doc.embedFont(StandardFonts.Helvetica)
  const negrita = await doc.embedFont(StandardFonts.HelveticaBold)

  // Las fuentes estándar de un PDF no tienen todos los caracteres (emojis,
  // flechas...). Lo que no exista se quita para que no falle.
  const admitidos = new Set(normal.getCharacterSet())
  function limpiar(texto: string): string {
    return Array.from(texto.replace(/[\t\u00a0\u202f]/g, ' '))
      .filter((letra) => letra === '\n' || admitidos.has(letra.codePointAt(0) ?? 0))
      .join('')
      .replace(/ {2,}/g, ' ')
  }

  // Parte un texto en las líneas que caben en un ancho dado.
  function partir(texto: string, fuente: PDFFont, tamano: number, ancho: number): string[] {
    const lineas: string[] = []
    for (const parrafo of limpiar(texto).split('\n')) {
      let linea = ''
      for (const palabra of parrafo.split(' ')) {
        const prueba = linea === '' ? palabra : `${linea} ${palabra}`
        if (fuente.widthOfTextAtSize(prueba, tamano) <= ancho) {
          linea = prueba
          continue
        }
        if (linea !== '') lineas.push(linea)
        // Una palabra más ancha que la línea se corta letra a letra.
        let resto = palabra
        while (fuente.widthOfTextAtSize(resto, tamano) > ancho && resto.length > 1) {
          let corte = resto.length - 1
          while (corte > 1 && fuente.widthOfTextAtSize(resto.slice(0, corte), tamano) > ancho) {
            corte -= 1
          }
          lineas.push(resto.slice(0, corte))
          resto = resto.slice(corte)
        }
        linea = resto
      }
      lineas.push(linea)
    }
    return lineas
  }

  // --- Estado de la página actual ---
  let pagina: PDFPage = doc.addPage([ANCHO, ALTO])
  // Posición vertical de escritura: empieza arriba y va bajando.
  let y = ALTO - MARGEN

  function nuevaPagina() {
    pagina = doc.addPage([ANCHO, ALTO])
    y = ALTO - MARGEN
  }

  // Si no queda sitio para algo de esa altura, salta de página.
  function asegurar(alto: number) {
    if (y - alto < MARGEN + PIE) nuevaPagina()
  }

  type Estilo = {
    x?: number
    ancho?: number
    tamano?: number
    fuente?: PDFFont
    color?: RGB
  }

  // Escribe un texto (con saltos de línea automáticos) y baja la posición.
  function escribir(texto: string, estilo: Estilo = {}) {
    const { x = MARGEN, ancho = UTIL, tamano = 10, fuente = normal, color = TINTA } = estilo
    const interlineado = tamano * 1.32
    for (const linea of partir(texto, fuente, tamano, ancho)) {
      asegurar(interlineado)
      pagina.drawText(linea, { x, y: y - tamano, size: tamano, font: fuente, color })
      y -= interlineado
    }
  }

  // Texto de una sola línea en una posición fija, sin mover "y".
  function rotular(texto: string, x: number, yBase: number, estilo: Estilo = {}) {
    const { tamano = 9, fuente = normal, color = TINTA } = estilo
    pagina.drawText(limpiar(texto), { x, y: yBase, size: tamano, font: fuente, color })
  }

  function anchoDe(texto: string, tamano: number, fuente: PDFFont = normal): number {
    return fuente.widthOfTextAtSize(limpiar(texto), tamano)
  }

  function seccion(titulo: string, altoMinimo = 60) {
    asegurar(altoMinimo + 34)
    y -= 12
    pagina.drawText(limpiar(titulo), { x: MARGEN, y: y - 13, size: 13, font: negrita, color: TINTA })
    y -= 19
    pagina.drawLine({
      start: { x: MARGEN, y },
      end: { x: MARGEN + UTIL, y },
      thickness: 1,
      color: TINTA,
    })
    y -= 10
  }

  // --- Cabecera ---
  escribir('Registro de síntomas', { tamano: 21, fuente: negrita })
  y -= 2
  escribir(`Informe del ${fechaCorta(resumen.desde)} al ${fechaCorta(resumen.hasta)}`, {
    tamano: 12,
  })
  if (nombre.trim() !== '') escribir(nombre.trim(), { tamano: 12, fuente: negrita })
  escribir(
    `Creado el ${fechaCorta(claveDia(new Date()))}. Datos anotados por la propia persona en la app; no es un diagnóstico.`,
    { tamano: 9, color: GRIS },
  )

  const total = resumen.episodios.length

  // --- Resumen en cuatro cifras ---
  seccion('Resumen', 60)
  const media =
    resumen.intensidadMedia === null ? '-' : resumen.intensidadMedia.toFixed(1).replace('.', ',')
  const cifras: [string, string][] = [
    [String(total), total === 1 ? 'episodio de dolor' : 'episodios de dolor'],
    [`${resumen.diasConDolor} de ${resumen.diasPeriodo}`, 'días con dolor'],
    [media, 'intensidad media (0 a 10)'],
    [resumen.intensidadMaxima === null ? '-' : String(resumen.intensidadMaxima), 'intensidad máxima'],
  ]
  const separacion = 8
  const anchoCaja = (UTIL - separacion * 3) / 4
  cifras.forEach(([cifra, etiqueta], indice) => {
    const x = MARGEN + indice * (anchoCaja + separacion)
    pagina.drawRectangle({ x, y: y - 50, width: anchoCaja, height: 50, color: FONDO })
    rotular(cifra, x + 10, y - 26, { tamano: 18, fuente: negrita })
    rotular(etiqueta, x + 10, y - 41, { tamano: 8.5, color: GRIS })
  })
  y -= 58

  if (total === 0) {
    escribir('No hay episodios de dolor registrados en este periodo.', { tamano: 11 })
  }

  // --- Evolución: una barra por día (o por semana si el periodo es largo) ---
  if (total > 0) {
    const porSemanas = resumen.diasPeriodo > 92
    const puntos: { clave: string; maxima: number }[] = []
    if (porSemanas) {
      for (let inicio = 0; inicio < resumen.porDia.length; inicio += 7) {
        const semana = resumen.porDia.slice(inicio, inicio + 7)
        puntos.push({
          clave: semana[0].clave,
          maxima: Math.max(...semana.map((dia) => dia.maxima)),
        })
      }
    } else {
      for (const dia of resumen.porDia) puntos.push({ clave: dia.clave, maxima: dia.maxima })
    }

    seccion(
      porSemanas
        ? 'Evolución: dolor más fuerte de cada semana'
        : 'Evolución: dolor más fuerte de cada día',
      120,
    )
    const altoGrafica = 84
    const izquierda = MARGEN + 18
    const anchoGrafica = UTIL - 18
    const base = y - altoGrafica
    // Líneas de referencia en 0, 5 y 10.
    for (const valor of [0, 5, 10]) {
      const yLinea = base + (valor / 10) * altoGrafica
      pagina.drawLine({
        start: { x: izquierda, y: yLinea },
        end: { x: izquierda + anchoGrafica, y: yLinea },
        thickness: valor === 0 ? 0.8 : 0.4,
        color: valor === 0 ? TINTA : LINEA,
      })
      rotular(String(valor), MARGEN, yLinea - 3, { tamano: 8, color: GRIS })
    }
    const paso = anchoGrafica / puntos.length
    const anchoBarra = Math.max(1, Math.min(paso * 0.72, 14))
    puntos.forEach((punto, indice) => {
      if (punto.maxima <= 0) return
      pagina.drawRectangle({
        x: izquierda + indice * paso + (paso - anchoBarra) / 2,
        y: base,
        width: anchoBarra,
        height: (punto.maxima / 10) * altoGrafica,
        color: colorIntensidad(punto.maxima),
      })
    })
    // Fechas bajo el eje: unas pocas, repartidas.
    const marcas = Math.min(6, puntos.length)
    for (let marca = 0; marca < marcas; marca += 1) {
      const indice = marcas === 1 ? 0 : Math.round((marca * (puntos.length - 1)) / (marcas - 1))
      const texto = fechaCorta(puntos[indice].clave, false)
      const centro = izquierda + indice * paso + paso / 2
      const ancho = anchoDe(texto, 8)
      const x = Math.min(Math.max(centro - ancho / 2, izquierda), izquierda + anchoGrafica - ancho)
      rotular(texto, x, base - 11, { tamano: 8, color: GRIS })
    }
    y = base - 18
    // Leyenda de colores.
    let xLeyenda = izquierda
    const leyenda: [RGB, string][] = [
      [AZULES[0], 'Leve (1 a 3)'],
      [AZULES[1], 'Moderado (4 a 6)'],
      [AZULES[2], 'Fuerte (7 a 10)'],
    ]
    for (const [color, texto] of leyenda) {
      pagina.drawRectangle({ x: xLeyenda, y: y - 8, width: 8, height: 8, color })
      rotular(texto, xLeyenda + 12, y - 7.5, { tamano: 8, color: GRIS })
      xLeyenda += anchoDe(texto, 8) + 30
    }
    y -= 14
  }

  // Altura que ocupa una tabla de recuentos con su título.
  const ALTO_FILA = 13
  function altoRecuentos(recuentos: Recuento[]): number {
    return 16 + recuentos.length * ALTO_FILA
  }

  // Tabla de recuentos con barras: "Náuseas  ████  4 (33 %)".
  function dibujarRecuentos(
    titulo: string,
    recuentos: Recuento[],
    x: number,
    ancho: number,
    yArriba: number,
  ) {
    rotular(titulo, x, yArriba - 10, { tamano: 10, fuente: negrita })
    const anchoEtiqueta = ancho * 0.5
    const anchoCifra = 46
    const anchoBarras = ancho - anchoEtiqueta - anchoCifra - 6
    const maximo = Math.max(1, ...recuentos.map((recuento) => recuento.veces))
    recuentos.forEach((recuento, indice) => {
      const yFila = yArriba - 16 - (indice + 1) * ALTO_FILA + 4
      const etiqueta = partir(recuento.etiqueta, normal, 9, anchoEtiqueta - 4)[0]
      rotular(etiqueta, x, yFila, { tamano: 9 })
      if (recuento.veces > 0) {
        pagina.drawRectangle({
          x: x + anchoEtiqueta,
          y: yFila - 1,
          width: Math.max(1.5, (recuento.veces / maximo) * anchoBarras),
          height: 8,
          color: AZUL,
        })
      }
      const porcentaje = total > 0 ? Math.round((recuento.veces / total) * 100) : 0
      rotular(`${recuento.veces} (${porcentaje} %)`, x + ancho - anchoCifra, yFila, {
        tamano: 8.5,
        color: GRIS,
      })
    })
  }

  if (total > 0) {
    // --- Localización: el mismo torso de la app, con las zonas más repetidas ---
    // El dibujo de la app mide 260 x 270 y su cuadrícula ocupa el cuadrado
    // que va de (44, 84) a (216, 256). Aquí se reduce todo con la misma
    // escala para que el mapa coincida con lo que se ve al registrar.
    const escala = 0.86
    const anchoTorso = 260 * escala
    const altoTorso = 270 * escala
    const celda = (172 * escala) / 9
    const lado = celda * 9
    seccion('Localización del dolor', altoTorso + 30)
    const xTorso = MARGEN
    const yTorso = y - 12 // deja sitio para los rótulos de arriba
    const xMapa = xTorso + 44 * escala
    const yMapa = yTorso - 84 * escala
    rotular('Lado derecho', xTorso, y - 8, { tamano: 8, color: GRIS })
    const textoIzquierdo = 'Lado izquierdo'
    rotular(textoIzquierdo, xTorso + anchoTorso - anchoDe(textoIzquierdo, 8), y - 8, {
      tamano: 8,
      color: GRIS,
    })
    pagina.drawSvgPath(CONTORNO_TORSO, {
      x: xTorso,
      y: yTorso,
      scale: escala,
      color: FONDO,
      borderColor: TINTA,
      borderWidth: 1,
    })
    const maximoCelda = Math.max(1, ...resumen.porCelda)
    resumen.porCelda.forEach((veces, indice) => {
      const fila = Math.floor(indice / 9)
      const columna = indice % 9
      // Mezcla entre blanco y azul oscuro según lo repetida que esté la celda.
      const fuerza = veces / maximoCelda
      pagina.drawRectangle({
        x: xMapa + columna * celda,
        y: yMapa - (fila + 1) * celda,
        width: celda,
        height: celda,
        color: rgb(1 - fuerza * 0.89, 1 - fuerza * 0.77, 1 - fuerza * 0.28),
        borderColor: LINEA,
        borderWidth: 0.4,
      })
    })
    // Líneas más marcadas entre las 9 regiones, y el ombligo en el centro.
    for (let linea = 0; linea <= 3; linea += 1) {
      const desplazamiento = linea * celda * 3
      pagina.drawLine({
        start: { x: xMapa + desplazamiento, y: yMapa },
        end: { x: xMapa + desplazamiento, y: yMapa - lado },
        thickness: 1,
        color: TINTA,
      })
      pagina.drawLine({
        start: { x: xMapa, y: yMapa - desplazamiento },
        end: { x: xMapa + lado, y: yMapa - desplazamiento },
        thickness: 1,
        color: TINTA,
      })
    }
    pagina.drawEllipse({
      x: xMapa + lado / 2,
      y: yMapa - lado / 2,
      xScale: 2.2,
      yScale: 3,
      color: TINTA,
      borderColor: rgb(1, 1, 1),
      borderWidth: 0.8,
    })
    rotular(
      'Vista de frente. Más oscuro = zona marcada en más episodios. El punto es el ombligo.',
      xTorso,
      yTorso - altoTorso - 11,
      { tamano: 7.5, color: GRIS },
    )
    // A la derecha del torso, las regiones por frecuencia.
    const xLista = xTorso + anchoTorso + 22
    dibujarRecuentos('Regiones afectadas', resumen.zonas, xLista, MARGEN + UTIL - xLista, y)
    y = Math.min(yTorso - altoTorso - 18, y - altoRecuentos(resumen.zonas)) - 4

    // --- Tablas de recuentos, de dos en dos ---
    seccion('Características de los episodios', 80)
    const tablas: [string, Recuento[]][] = [
      ['Momento del día', resumen.franjas],
      ['Día de la semana', resumen.diasSemana],
      ['Tipo de dolor', resumen.tipos],
      ['Duración', resumen.duraciones],
      ['Otros síntomas', resumen.sintomas],
      ['Cómo afectó', resumen.impacto],
      ['Qué lo alivia', resumen.alivia],
      ['Qué lo empeora', resumen.empeora],
      ['Medicación tomada', resumen.medicacion],
      ['Tiempo desde la última comida', resumen.tiempoComida],
      ['Regla en el momento del dolor', resumen.regla],
      ['Sueño la noche anterior', resumen.sueno],
      ['Ánimo', resumen.animo],
    ]
    const conDatos = tablas.filter(([, recuentos]) => recuentos.some((recuento) => recuento.veces > 0))
    const anchoColumna = (UTIL - 24) / 2
    for (let indice = 0; indice < conDatos.length; indice += 2) {
      const pareja = conDatos.slice(indice, indice + 2)
      const alto = Math.max(...pareja.map(([, recuentos]) => altoRecuentos(recuentos)))
      asegurar(alto + 8)
      pareja.forEach(([titulo, recuentos], columna) => {
        dibujarRecuentos(titulo, recuentos, MARGEN + columna * (anchoColumna + 24), anchoColumna, y)
      })
      y -= alto + 10
    }
    escribir(
      'Los porcentajes son sobre el total de episodios. No todos los datos se rellenan siempre, así que pueden no sumar 100 %.',
      { tamano: 8, color: GRIS },
    )

    // --- Detalle de cada episodio ---
    seccion('Detalle de los episodios', 60)
    for (const episodio of resumen.episodios) {
      escribirEpisodio(episodio)
    }
  }

  // Escribe un episodio completo. Si no cabe entero en lo que queda de
  // página, empieza en la siguiente para no partirlo.
  function escribirEpisodio(episodio: Episodio) {
    const duracion = etiquetaDe(DURACIONES, episodio.duracion)
    const cabecera = [
      mayuscula(textoFechaLarga(episodio.inicio)),
      `Intensidad ${episodio.intensidad}/10 (${textoIntensidad(episodio.intensidad).toLowerCase()})`,
      duracion,
    ]
      .filter((parte) => parte !== '')
      .join(' · ')

    const medicacion = [etiquetasDe(MEDICAMENTOS, episodio.medicacion), episodio.dosis.trim()]
      .filter((parte) => parte !== '')
      .join(': ')
    // Une varios datos cortos en una sola línea: "Sueño: mal · Ánimo: normal".
    const unir = (campos: [string, string][]) =>
      campos
        .filter(([, valor]) => valor !== '')
        .map(([etiqueta, valor]) => `${etiqueta}: ${valor}`)
        .join(' · ')

    const lineas = [
      unir([
        ['Zona', nombresDeZonas(episodio.celdas).join(', ')],
        ['Tipo', etiquetaDe(TIPOS_DOLOR, episodio.tipo)],
        ['Otros síntomas', etiquetasDe(SINTOMAS, episodio.sintomas)],
      ]),
      unir([
        ['Comió o bebió antes', episodio.comida.trim()],
        ['Tiempo desde la comida', etiquetaDe(TIEMPOS_DESDE_COMIDA, episodio.tiempoDesdeComida)],
      ]),
      unir([
        ['Sueño', etiquetaDe(SUENOS, episodio.sueno)],
        ['Ánimo', etiquetaDe(ANIMOS, episodio.animo)],
        ['Ejercicio', etiquetaDe(ACTIVIDADES, episodio.actividad)],
        ['Agua', etiquetaDe(AGUAS, episodio.agua)],
        ['Regla', etiquetaDe(REGLAS, episodio.regla)],
      ]),
      unir([
        ['Medicación', medicacion],
        ['Alivia', etiquetasDe(ALIVIOS, episodio.alivia)],
        ['Empeora', etiquetasDe(AGRAVANTES, episodio.empeora)],
      ]),
      unir([['Cómo afectó', etiquetaDe(IMPACTOS, episodio.impacto)]]),
      unir([['Notas', episodio.notas.trim()]]),
    ].filter((linea) => linea !== '')

    // Altura aproximada del bloque para decidir si salta de página.
    const altoCabecera = partir(cabecera, negrita, 10, UTIL).length * 13.2
    const altoLineas = lineas.reduce(
      (suma, linea) => suma + partir(linea, normal, 9, UTIL - 10).length * 11.9,
      0,
    )
    const altoBloque = altoCabecera + altoLineas + 12
    if (altoBloque < ALTO - MARGEN * 2 - PIE) asegurar(altoBloque)

    escribir(cabecera, { tamano: 10, fuente: negrita })
    for (const linea of lineas) escribir(linea, { x: MARGEN + 10, ancho: UTIL - 10, tamano: 9 })
    y -= 4
    asegurar(8)
    pagina.drawLine({
      start: { x: MARGEN, y },
      end: { x: MARGEN + UTIL, y },
      thickness: 0.4,
      color: LINEA,
    })
    y -= 8
  }

  // --- Apuntes: comidas, medicación y regla, día a día ---
  if (resumen.apuntes.length > 0) {
    seccion('Diario de comidas, medicación y regla', 60)
    let diaActual = ''
    for (const apunte of resumen.apuntes) {
      const dia = apunte.momento.slice(0, 10)
      if (dia !== diaActual) {
        diaActual = dia
        y -= 3
        asegurar(30)
        escribir(mayuscula(fechaDiaLargo(dia)), { tamano: 9.5, fuente: negrita })
      }
      const detalle = resumenApunte(apunte)
      const titulo = tituloApunte(apunte)
      const texto = detalle === '' ? titulo : `${titulo}: ${detalle}`
      asegurar(12)
      rotular(textoHora(apunte.momento), MARGEN + 10, y - 9, { tamano: 9, color: GRIS })
      escribir(texto, { x: MARGEN + 44, ancho: UTIL - 44, tamano: 9 })
    }
  }

  // --- Pie de página, ahora que se sabe cuántas hay ---
  const paginas = doc.getPages()
  paginas.forEach((hoja, indice) => {
    const texto = `Registro de síntomas · Página ${indice + 1} de ${paginas.length}`
    hoja.drawText(limpiar(texto), {
      x: MARGEN,
      y: MARGEN - 4,
      size: 8,
      font: normal,
      color: GRIS,
    })
  })

  return doc.save()
}

// Crea el informe y lo devuelve como archivo listo para compartir.
export async function crearArchivoInforme(resumen: Resumen, nombre: string): Promise<File> {
  const bytes = await crearInformePdf(resumen, nombre)
  // Se copian los bytes a un bloque nuevo, que es lo que File acepta.
  const datos = new Uint8Array(bytes.byteLength)
  datos.set(bytes)
  return new File([datos], nombreInforme(), { type: 'application/pdf' })
}
