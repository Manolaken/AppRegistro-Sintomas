# Registro de Síntomas

Aplicación para registrar episodios de dolor abdominal y su contexto, de forma que el médico de cabecera tenga datos para identificar la causa. Quien la desarrolla quiere aprender mientras la construye: explica los cambios y comenta el código.

El repositorio es público: no escribas aquí ni en el código nombres ni datos personales.

## Decisiones tomadas

- **Tipo de app:** PWA instalable en iPhone desde Safari ("Añadir a pantalla de inicio"). Se descartaron Swift y React Native porque no hay Mac ni cuenta de Apple Developer de pago.
- **Coste:** cero. Sin servicios de pago ni backend.
- **Publicación:** GitHub Pages, en https://manolaken.github.io/AppRegistro-Sintomas/. Cada subida a `main` la compila y publica sola (`.github/workflows/publicar.yml`).
- **Datos:** solo en el dispositivo. Nada sale del teléfono. Solo la usuaria ve sus registros.
- **Idioma:** español, tanto la interfaz como los nombres de variables, componentes y comentarios.
- **Uso:** personal, sin publicar en tiendas de apps. Si en el futuro se comercializa, la vía prevista es empaquetar con Capacitor.
- **Estilo visual:** "Pop" (ver más abajo). Los colores pueden cambiar; están centralizados en variables CSS.
- **Mapa del dolor:** torso sin detalles anatómicos, solo el contorno y el ombligo, con 9 cuadros grandes (las regiones médicas) divididos cada uno en 3 x 3 celdas, 81 en total, que se pintan deslizando el dedo.
- **Izquierda y derecha:** convención médica. El torso se dibuja de frente, así que el lado derecho de la persona queda a la izquierda de la pantalla, con las etiquetas "Tu derecha" y "Tu izquierda".

## Entorno

- Desarrollo en Windows 11 con VS Code, Node 22.14 y npm 10.9. Terminal: PowerShell.
- Dispositivo de pruebas: iPhone XS con iOS 18. Dispositivos finales: iPhone 11 y iPhone 13 mini con iOS 26.
- Stack: React 19, TypeScript 7, Vite 8, linter Oxlint.

### Comandos

```powershell
npm run dev      # servidor de desarrollo, accesible en la red local (server.host: true)
npm run build    # comprobación de tipos y compilación; si falla, la publicación también falla
npm run lint     # Oxlint
```

En PowerShell, `npm run x -- --flag` pierde los parámetros. Usa `npx` directamente (por ejemplo `npx vite --host`) o fija la opción en la configuración.

## Estructura

```
index.html                       Página base (idioma, fuente, viewport, iconos y manifiesto)
vite.config.ts                   Configuración de Vite; `base` cambia al compilar para GitHub Pages
.github/workflows/publicar.yml   Compila y publica en GitHub Pages al subir a main
public/
  manifest.webmanifest           Nombre, colores e iconos de la app instalada
  sw.js                          Service worker escrito a mano: funcionamiento sin conexión
  icono-180/192/512.png          Iconos de la app
src/
  main.tsx                       Punto de entrada; registra el service worker en producción
  App.tsx                        Navegación por estado entre pantallas
  index.css                      Todos los estilos y las variables del tema
  tipos.ts                       Tipos compartidos; los principales son Episodio y Apunte
  datos.ts                       Regiones del abdomen, listas de opciones y episodioNuevo()
  fechas.ts                      Utilidades de fecha (formato local "2026-11-15T14:20")
  almacen.ts                     Guardado local en IndexedDB (guardar, listar y borrar episodios y apuntes)
  useEpisodios.ts                Hook que lee los episodios guardados al entrar en una pantalla
  useApuntes.ts                  Lo mismo para los apuntes rápidos
  copia.ts                       Copia de seguridad: crear, entregar, leer y recuperar el JSON
  componentes/
    Iconos.tsx                   Iconos SVG de trazo
    MapaAbdomen.tsx              Torso con 9 cuadros de 3 x 3 celdas; sin `alCambiar` es de solo lectura
    BarraPestanas.tsx            Barra inferior de secciones
    TarjetaEpisodio.tsx          Un registro en una lista; al tocarlo abre su ficha
    TarjetaApunte.tsx            Un apunte rápido en una lista; al tocarlo se edita
    SeleccionUnica.tsx           Botones para elegir una opción
    SeleccionMultiple.tsx        Botones para elegir varias opciones
  pantallas/
    Inicio.tsx                   Pantalla principal: semana, apuntes de hoy y últimos dolores
    Historial.tsx                Dolores y apuntes mezclados por fecha, agrupados por mes
    Ajustes.tsx                  Guardar y recuperar la copia de seguridad
    ApunteRapido.tsx             Crear, editar o borrar un apunte de comida, medicación o regla
    DetalleEpisodio.tsx          Ficha de un registro, con editar y borrar
    RegistrarDolor.tsx           Asistente de 4 pasos; crea un episodio o edita `episodioInicial`
    registro/
      PasoDolor.tsx              Paso 1: zona, intensidad y tipo
      PasoMomento.tsx            Paso 2: inicio, duración y otros síntomas
      PasoAntes.tsx              Paso 3: comida, sueño, ánimo, ejercicio, agua y regla
      PasoDespues.tsx            Paso 4: medicación, qué alivia o empeora, impacto y notas
```

`src/App.css` y `src/assets` son restos de la plantilla y no se usan.

## Convenciones de código

- Un componente por archivo, con `export default`. Las constantes y funciones auxiliares van en `datos.ts` o `tipos.ts`, no junto a los componentes.
- Importaciones con extensión explícita (`./datos.ts`, `./App.tsx`) e `import type` para los tipos: lo exige `verbatimModuleSyntax`.
- Sin `enum` ni otras construcciones no borrables (`erasableSyntaxOnly`): usa uniones de literales.
- Estilos en `src/index.css` con clases en español. Los colores salen siempre de las variables de `:root`; no escribas colores sueltos en los componentes.
- Las propiedades que reciben funciones se nombran `alHacerAlgo` (`alRegistrar`, `alSalir`, `alCambiar`).
- Los hooks propios son la excepción al español: React exige el prefijo `use` (`useEpisodios`).
- No uses `alert`, `confirm` ni `prompt`.

## Diseño (estilo Pop)

- Fondo amarillo `#FFD84D`, tarjetas blancas con borde negro de 2 px, botones principales con sombra dura desplazada 4 px.
- Acento azul `#2F5BFF` con texto blanco. Texto principal `#111111`, secundario `#444444`.
- Tipografía Bricolage Grotesque (ahora desde Google Fonts; hay que alojarla en local para que funcione sin conexión).
- Diseñada para móvil: ancho máximo 430 px, zonas táctiles de 44 px como mínimo, márgenes con `env(safe-area-inset-*)`.
- Accesibilidad: botones e inputs reales, `aria-label` en los botones sin texto, `aria-pressed` en los seleccionables, contraste mínimo 4,5:1.
- Tono de los textos: cercano y breve, de tú. Registrar un episodio debe llevar menos de un minuto.
- Sin emojis en la interfaz; los iconos son SVG de trazo.

## Estado actual

Hecho:

- Pantalla de inicio: fecha, botón "Registrar dolor", semana coloreada según el dolor más fuerte de cada día y los últimos 3 registros.
- Historial con todos los registros por mes. Al tocar uno se abre su ficha, desde la que se puede editar (con el mismo asistente) o borrar (con confirmación en pantalla).
- Registro completo en 4 pasos. Solo son obligatorios la zona y la fecha de inicio; desde el paso 2 se puede guardar sin rellenar el resto.
- Apuntes rápidos desde el inicio, sin que haya dolor: comida (todas las del día, voluntario), medicación y regla. Los de hoy se ven en el inicio y todos en el historial; al tocar uno se edita o se borra.
- Guardado local en IndexedDB, escrito a mano en `almacen.ts` sin librerías. Base `registro-sintomas`, versión 2, con dos almacenes de clave `id`: `episodios` y `apuntes`.

- App instalable y con funcionamiento sin conexión: manifiesto, iconos y service worker propio, sin librerías. El service worker solo se registra en la versión publicada, no con `npm run dev`.

- Copia de seguridad en la pestaña Ajustes. Guardar entrega un JSON por el menú Compartir (o lo descarga donde no lo hay). Recuperar añade los registros del archivo sin borrar nada; los que tienen el mismo `id` se sustituyen. El inicio avisa si hay registros y nunca se ha hecho copia o han pasado 14 días (la fecha de la última se guarda en `localStorage`).

La pestaña Informe está desactivada.

## Pendiente

1. **Foto opcional** de la comida, en el apunte de comida y en el paso 3 del registro.
2. **Aprovechar los apuntes en el registro de dolor:** proponer en el paso 3 las comidas ya apuntadas ese día para no escribirlas dos veces.
3. **Informe PDF** para el médico con resumen y gráficas (previsto: jsPDF).
4. **Bloqueo** con código y Face ID (WebAuthn).
5. **Tipografía en local:** ahora viene de Google Fonts y sin conexión se ve con la letra del sistema.

Si cambia la forma de `Episodio` o de `Apunte`, hay que subir `VERSION` en `almacen.ts` y migrar los datos ya guardados; no se pueden perder registros. El informe debe incluir los dos almacenes. Si cambia la forma de la copia (`Copia` en `tipos.ts`), sube `formato` y haz que `leerCopia` siga aceptando las copias antiguas.

### Datos de cada episodio

- Fecha y hora de inicio, y duración.
- Zona del dolor e intensidad de 0 a 10. La zona se guarda como celdas de una cuadrícula de 9 x 9 (índice = fila * 9 + columna); `zonasDeCeldas` en `datos.ts` las traduce a las 9 regiones médicas para el informe.
- Tipo de dolor: cólico, punzante, ardor o presión.
- Qué lo alivia o lo empeora.
- Síntomas acompañantes: náuseas, vómitos, fiebre, mareo, cambios digestivos.
- Comidas y bebidas de las horas previas, con foto opcional.
- Medicación tomada (por ejemplo paracetamol o ibuprofeno), dosis y hora.
- Contexto: sueño, estrés o estado de ánimo, hidratación, actividad física.
- Ciclo menstrual.
- Impacto: si le impidió ir a clase o hacer vida normal.

## Limitaciones de una PWA en iOS

- No puede programar notificaciones locales sin un servidor: los recordatorios se resuelven con la app Recordatorios o Atajos del iPhone.
- No tiene acceso a la app Salud de Apple.
- La app instalada en la pantalla de inicio tiene su propio almacén, separado del de Safari: lo registrado desde el navegador no aparece en la app instalada, y al revés.
- Si se elimina el icono de la app se borran sus datos: la copia en JSON es imprescindible y la app debe recordar hacerla.
- El funcionamiento sin conexión y Face ID necesitan HTTPS: se prueban en la versión publicada. En la red local (`http://192.168.x.x:5173`) se prueba todo lo demás.

## Cuidado con

- Son datos de salud: nada de analítica, servicios externos ni envío de datos a ningún servidor.
- La app registra información para el médico; no debe diagnosticar ni dar consejos médicos.
- No añadas dependencias sin justificarlo: cada librería aumenta lo que hay que mantener y descargar.
- No uses `crypto.randomUUID()` ni otras API que exijan HTTPS: en las pruebas por la red local no existen.
