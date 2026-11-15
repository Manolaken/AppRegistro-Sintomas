import type { Apunte, Episodio } from './tipos.ts'

// Guardado local con IndexedDB, la base de datos que trae el navegador.
// Los datos se quedan en el teléfono: no se envían a ningún sitio.
// IndexedDB funciona con "peticiones" y eventos; aquí las envolvemos en
// promesas para poder usar async/await desde el resto de la app.
//
// Hay dos almacenes (el equivalente a tablas), ambos con clave "id":
//   episodios: los registros de dolor.
//   apuntes:   los apuntes rápidos de comida, medicación y regla.

const NOMBRE_BASE = 'registro-sintomas'
// Versión 1: almacén "episodios". Versión 2: se añade "apuntes".
const VERSION = 2
const EPISODIOS = 'episodios'
const APUNTES = 'apuntes'

function abrirBase(): Promise<IDBDatabase> {
  return new Promise((resolver, rechazar) => {
    const peticion = indexedDB.open(NOMBRE_BASE, VERSION)

    // Se ejecuta la primera vez y cada vez que sube VERSION. Solo crea lo
    // que falte, así que los datos que ya había se conservan.
    peticion.onupgradeneeded = () => {
      const base = peticion.result
      for (const almacen of [EPISODIOS, APUNTES]) {
        if (!base.objectStoreNames.contains(almacen)) {
          base.createObjectStore(almacen, { keyPath: 'id' })
        }
      }
    }
    peticion.onsuccess = () => resolver(peticion.result)
    peticion.onerror = () => rechazar(peticion.error)
    // Otra pestaña con la app abierta impide actualizar la base.
    peticion.onblocked = () => rechazar(new Error('La base de datos está en uso en otra pestaña.'))
  })
}

// Hace una operación de escritura (guardar o borrar) y espera a que termine.
async function escribir(almacen: string, operacion: (tabla: IDBObjectStore) => void): Promise<void> {
  const base = await abrirBase()
  return new Promise((resolver, rechazar) => {
    const transaccion = base.transaction(almacen, 'readwrite')
    operacion(transaccion.objectStore(almacen))
    transaccion.oncomplete = () => {
      base.close()
      resolver()
    }
    transaccion.onerror = () => {
      base.close()
      rechazar(transaccion.error)
    }
    transaccion.onabort = () => {
      base.close()
      rechazar(transaccion.error)
    }
  })
}

// Lee todo el contenido de un almacén.
async function leerTodo<T>(almacen: string): Promise<T[]> {
  const base = await abrirBase()
  return new Promise((resolver, rechazar) => {
    const peticion = base.transaction(almacen, 'readonly').objectStore(almacen).getAll()
    peticion.onsuccess = () => {
      base.close()
      resolver(peticion.result as T[])
    }
    peticion.onerror = () => {
      base.close()
      rechazar(peticion.error)
    }
  })
}

// --- Episodios de dolor ---

// Guarda un episodio. Si ya existe uno con el mismo id, lo sustituye.
export function guardarEpisodio(episodio: Episodio): Promise<void> {
  return escribir(EPISODIOS, (tabla) => tabla.put(episodio))
}

// Devuelve todos los episodios, del más reciente al más antiguo.
export async function listarEpisodios(): Promise<Episodio[]> {
  const episodios = await leerTodo<Episodio>(EPISODIOS)
  return episodios.sort((a, b) => b.inicio.localeCompare(a.inicio))
}

// Borra un episodio por su id. No se puede deshacer.
export function borrarEpisodio(id: string): Promise<void> {
  return escribir(EPISODIOS, (tabla) => tabla.delete(id))
}

// --- Apuntes rápidos ---

export function guardarApunte(apunte: Apunte): Promise<void> {
  return escribir(APUNTES, (tabla) => tabla.put(apunte))
}

// Devuelve todos los apuntes, del más reciente al más antiguo.
export async function listarApuntes(): Promise<Apunte[]> {
  const apuntes = await leerTodo<Apunte>(APUNTES)
  return apuntes.sort((a, b) => b.momento.localeCompare(a.momento))
}

export function borrarApunte(id: string): Promise<void> {
  return escribir(APUNTES, (tabla) => tabla.delete(id))
}

// --- Copia de seguridad ---

// Añade de una vez los episodios y apuntes de una copia. Lo que ya existe
// con el mismo id se sustituye; lo demás no se toca. Va todo en una sola
// transacción: o entra todo, o no entra nada.
export async function importarDatos(episodios: Episodio[], apuntes: Apunte[]): Promise<void> {
  const base = await abrirBase()
  return new Promise((resolver, rechazar) => {
    const transaccion = base.transaction([EPISODIOS, APUNTES], 'readwrite')
    const tablaEpisodios = transaccion.objectStore(EPISODIOS)
    const tablaApuntes = transaccion.objectStore(APUNTES)
    for (const episodio of episodios) tablaEpisodios.put(episodio)
    for (const apunte of apuntes) tablaApuntes.put(apunte)
    transaccion.oncomplete = () => {
      base.close()
      resolver()
    }
    transaccion.onerror = () => {
      base.close()
      rechazar(transaccion.error)
    }
    transaccion.onabort = () => {
      base.close()
      rechazar(transaccion.error)
    }
  })
}
