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

  const ambito = self.registration.scope
  const vistos = new Set([ambito])
  // Archivos pendientes de guardar. Se empieza por los que enlaza la página
  // con src="..." o href="...".
  let pendientes = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(
    (coincidencia) => new URL(coincidencia[1], ambito).href,
  )

  // Se guarda cada archivo y se mira qué otros archivos carga él a su vez:
  // el código carga otros trozos de código (por ejemplo el del informe) y
  // los estilos cargan la tipografía. Así queda todo listo sin conexión.
  // El límite de vueltas es solo una protección contra bucles.
  for (let vuelta = 0; vuelta < 6 && pendientes.length > 0; vuelta += 1) {
    const tanda = [...new Set(pendientes)].filter(
      (url) => url.startsWith(ambito) && !vistos.has(url),
    )
    tanda.forEach((url) => vistos.add(url))
    // Si alguno falla no pasa nada: se guardará la primera vez que se use.
    await Promise.allSettled(tanda.map((url) => cache.add(url)))

    pendientes = []
    for (const url of tanda) {
      const ruta = new URL(url).pathname
      if (!ruta.endsWith('.js') && !ruta.endsWith('.css')) continue
      const guardado = await cache.match(url)
      if (!guardado) continue
      const texto = await guardado.text()
      const rutas = ruta.endsWith('.css')
        ? // En los estilos: url(...)
          [...texto.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((c) => c[1])
        : // En el código: textos entre comillas que parecen rutas de archivo.
          [...texto.matchAll(/["'`]((?:\.{1,2}\/|\/|assets\/)[\w@.\/-]+\.(?:js|css|woff2))["'`]/g)].map(
            (c) => c[1],
          )
      for (const encontrada of rutas) {
        if (encontrada.startsWith('data:')) continue
        // Según quién la escriba, la ruta es relativa al propio archivo o a
        // la carpeta de la app: se prueban las dos.
        pendientes.push(new URL(encontrada, url).href)
        if (!encontrada.startsWith('.') && !encontrada.startsWith('/')) {
          pendientes.push(new URL(encontrada, ambito).href)
        }
      }
    }
  }
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
