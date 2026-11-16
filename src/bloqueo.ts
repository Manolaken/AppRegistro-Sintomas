// Bloqueo de la app con un código de 4 números y, si el teléfono lo
// permite, con Face ID o huella.
//
// Importante: esto es una cortina de privacidad, no una caja fuerte. Evita
// que alguien que coja el teléfono vea los registros, pero los datos no
// están cifrados. Por eso todo se guarda en localStorage sin más ceremonia.

const CLAVE = 'registro-sintomas:bloqueo'
export const LARGO_CODIGO = 4
const MAXIMO_FALLOS = 5
const SEGUNDOS_DE_ESPERA = 30
// Tiempo que la app puede pasar en segundo plano sin volver a pedir el código.
export const SEGUNDOS_EN_SEGUNDO_PLANO = 60

type Ajustes = {
  // Letras al azar que se mezclan con el código antes de calcular la huella.
  sal: string
  // Resultado de mezclar el código: se guarda esto y no el código.
  huella: string
  // Identificador de la llave de Face ID, si está activado.
  credencial: string | null
  fallos: number
  // Momento (en milisegundos) hasta el que no se admiten más intentos.
  esperaHasta: number
}

function leer(): Ajustes | null {
  try {
    const texto = localStorage.getItem(CLAVE)
    if (texto === null) return null
    const datos = JSON.parse(texto) as Partial<Ajustes>
    if (typeof datos.sal !== 'string' || typeof datos.huella !== 'string') return null
    return {
      sal: datos.sal,
      huella: datos.huella,
      credencial: typeof datos.credencial === 'string' ? datos.credencial : null,
      fallos: typeof datos.fallos === 'number' ? datos.fallos : 0,
      esperaHasta: typeof datos.esperaHasta === 'number' ? datos.esperaHasta : 0,
    }
  } catch {
    return null
  }
}

function escribir(ajustes: Ajustes): void {
  localStorage.setItem(CLAVE, JSON.stringify(ajustes))
}

// Convierte un texto en un número grande de forma que no se pueda deshacer
// a simple vista (función "cyrb53").
function mezclar(texto: string, semilla: number): number {
  let h1 = 0xdeadbeef ^ semilla
  let h2 = 0x41c6ce57 ^ semilla
  for (let indice = 0; indice < texto.length; indice += 1) {
    const letra = texto.charCodeAt(indice)
    h1 = Math.imul(h1 ^ letra, 2654435761)
    h2 = Math.imul(h2 ^ letra, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

// Huella de un código: se mezcla muchas veces con la sal. Así en el
// teléfono no queda escrito el código tal cual.
function calcularHuella(codigo: string, sal: string): string {
  let valor = ''
  for (let vuelta = 0; vuelta < 2000; vuelta += 1) {
    valor = mezclar(`${sal}:${codigo}:${valor}`, vuelta).toString(36)
  }
  return valor
}

function bytesAlAzar(cuantos: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(cuantos)
  crypto.getRandomValues(bytes)
  return bytes
}

function aTexto(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function aBytes(texto: string): Uint8Array<ArrayBuffer> {
  const binario = atob(texto)
  const bytes = new Uint8Array(binario.length)
  for (let indice = 0; indice < binario.length; indice += 1) bytes[indice] = binario.charCodeAt(indice)
  return bytes
}

// --- Código ---

export function hayCodigo(): boolean {
  return leer() !== null
}

// Pone o cambia el código. Si había Face ID activado, se conserva.
export function guardarCodigo(codigo: string): void {
  const sal = aTexto(bytesAlAzar(12))
  escribir({
    sal,
    huella: calcularHuella(codigo, sal),
    credencial: leer()?.credencial ?? null,
    fallos: 0,
    esperaHasta: 0,
  })
}

// Segundos que faltan para poder intentarlo otra vez (0 si se puede ya).
export function segundosDeEspera(): number {
  const ajustes = leer()
  if (ajustes === null) return 0
  return Math.max(0, Math.ceil((ajustes.esperaHasta - Date.now()) / 1000))
}

// Comprueba un código. Tras varios fallos seguidos obliga a esperar.
export function comprobarCodigo(codigo: string): 'bien' | 'mal' | 'espera' {
  const ajustes = leer()
  if (ajustes === null) return 'bien'
  if (segundosDeEspera() > 0) return 'espera'

  if (calcularHuella(codigo, ajustes.sal) === ajustes.huella) {
    escribir({ ...ajustes, fallos: 0, esperaHasta: 0 })
    return 'bien'
  }
  const fallos = ajustes.fallos + 1
  if (fallos >= MAXIMO_FALLOS) {
    escribir({ ...ajustes, fallos: 0, esperaHasta: Date.now() + SEGUNDOS_DE_ESPERA * 1000 })
    return 'espera'
  }
  escribir({ ...ajustes, fallos })
  return 'mal'
}

// Quita el bloqueo del todo (código y Face ID).
export function quitarBloqueo(): void {
  localStorage.removeItem(CLAVE)
}

// --- Face ID o huella ---
// Se hace con WebAuthn, el sistema de "llaves de acceso" del navegador. Se
// crea una llave que solo se puede usar pasando Face ID; si al pedirla el
// teléfono la entrega, es que la persona se ha identificado. Solo existe
// con HTTPS, así que en las pruebas por la wifi de casa no aparece.

export async function faceIdDisponible(): Promise<boolean> {
  try {
    if (!window.isSecureContext || typeof PublicKeyCredential === 'undefined') return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

export function hayFaceId(): boolean {
  return leer()?.credencial != null
}

// Crea la llave. El teléfono pedirá Face ID para confirmarlo. Si la persona
// cancela o el teléfono no lo permite, lanza un error.
export async function activarFaceId(): Promise<void> {
  const ajustes = leer()
  if (ajustes === null) throw new Error('Primero hay que poner un código.')
  const creada = await navigator.credentials.create({
    publicKey: {
      challenge: bytesAlAzar(32),
      rp: { name: 'Registro de Síntomas' },
      user: {
        id: bytesAlAzar(16),
        name: 'Registro de Síntomas',
        displayName: 'Registro de Síntomas',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged',
      },
      timeout: 60000,
      attestation: 'none',
    },
  })
  if (!(creada instanceof PublicKeyCredential)) throw new Error('No se ha creado la llave.')
  escribir({ ...ajustes, credencial: aTexto(new Uint8Array(creada.rawId)) })
}

export function desactivarFaceId(): void {
  const ajustes = leer()
  if (ajustes !== null) escribir({ ...ajustes, credencial: null })
}

// Pide Face ID. Devuelve true si la persona se ha identificado.
export async function desbloquearConFaceId(): Promise<boolean> {
  const ajustes = leer()
  if (ajustes === null || ajustes.credencial === null) return false
  try {
    const respuesta = await navigator.credentials.get({
      publicKey: {
        challenge: bytesAlAzar(32),
        allowCredentials: [{ type: 'public-key', id: aBytes(ajustes.credencial) }],
        userVerification: 'required',
        timeout: 60000,
      },
    })
    if (respuesta === null) return false
    escribir({ ...ajustes, fallos: 0, esperaHasta: 0 })
    return true
  } catch {
    // Cancelar o fallar el reconocimiento: se sigue bloqueado.
    return false
  }
}
