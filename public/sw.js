// Service worker: un pequeño programa que el navegador deja instalado junto
// a la app y que intercepta sus peticiones de red. Aquí sirve para una sola
// cosa: que la app se abra sin conexión, guardando una copia de sus archivos
// (página, código, estilos e iconos). No toca los registros de dolor, que
// viven en IndexedDB.
//
// Está escrito a mano, sin librerías. Al publicar una versión nueva no hay
// que cambiar nada aquí: la página se pide siempre a la red cuando hay
// conexión y los archivos de código llevan un nombre distinto en cada versión.

const CACHE = 'registro-sintomas-v1'

// Al instalarse: descarga la página y los archivos que la página enlaza.
self.addEventListener('install', (evento) => {
  evento.waitUntil(precargar())
  self.skipWaiting()
})

async function precargar() {
  const cache = await caches.open(CACHE)
  const respuesta = await fetch('./', { cache: 'no-cache' })
  if (!respuesta.ok) throw new Error('No se pudo descargar la página')
  const html = await respuesta.clone().text()
  await cache.put('./', respuesta)

  // Busca en la página todo lo que se carga con src="..." o href="..." y se
  // queda con lo que pertenece a la propia app.
  const ambito = self.registration.scope
  const enlaces = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((coincidencia) => new URL(coincidencia[1], ambito).href)
    .filter((url) => url.startsWith(ambito) && url !== ambito)
  // Si alguno falla no pasa nada: se guardará la primera vez que se use.
  await Promise.allSettled([...new Set(enlaces)].map((url) => cache.add(url)))
}

// Al activarse: borra copias de versiones anteriores de este archivo y
// empieza a atender a las páginas ya abiertas.
self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const nombres = await caches.keys()
      await Promise.all(
        nombres.filter((nombre) => nombre !== CACHE).map((nombre) => caches.delete(nombre)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request
  if (peticion.method !== 'GET') return
  // Lo que no es de la app (por ejemplo la tipografía de Google) no se toca.
  if (new URL(peticion.url).origin !== self.location.origin) return

  if (peticion.mode === 'navigate') evento.respondWith(pagina(peticion))
  else evento.respondWith(archivo(peticion))
})

// La página: primero la red, para recibir las actualizaciones; si no hay
// conexión, la copia guardada.
async function pagina(peticion) {
  const cache = await caches.open(CACHE)
  try {
    const respuesta = await fetch(peticion)
    if (respuesta.ok) await cache.put('./', respuesta.clone())
    return respuesta
  } catch {
    return (await cache.match('./')) ?? Response.error()
  }
}

// El resto de archivos: primero la copia guardada; si no está, se pide a la
// red y se guarda para la próxima vez.
async function archivo(peticion) {
  const cache = await caches.open(CACHE)
  const guardado = await cache.match(peticion)
  if (guardado) return guardado
  const respuesta = await fetch(peticion)
  if (respuesta.ok) await cache.put(peticion, respuesta.clone())
  return respuesta
}
