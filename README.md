# Registro de Síntomas

Aplicación web instalable para llevar un diario de episodios de dolor abdominal y de lo que los rodea (comidas, medicación, sueño, regla), y entregárselo al médico en un informe PDF.

- **Privada:** los datos se guardan solo en el teléfono. No hay servidor, cuentas ni analítica, y la app no hace ninguna petición a terceros.
- **Sin conexión:** una vez instalada funciona sin internet.
- **Gratuita:** no depende de ninguna tienda de apps ni de servicios de pago.
- **No es un producto sanitario:** registra lo que anota quien la usa. No diagnostica ni da consejos médicos.

La guía para quien la usa está en [GUIA.md](GUIA.md).

## Usarla tal cual

La app está publicada en:

**https://manolaken.github.io/AppRegistro-Sintomas/**

Cualquiera puede usar esa dirección: cada persona tiene sus propios datos en su propio teléfono y nadie más los ve.

### Instalarla en un iPhone

1. Abre la dirección en **Safari** (con otros navegadores no aparece la opción).
2. Pulsa **Compartir**, el cuadrado con la flecha hacia arriba.
3. Elige **Añadir a pantalla de inicio** y confirma con **Añadir**.

Aparece un icono amarillo llamado "Síntomas". Ábrela siempre desde ese icono: lo que se registra desde Safari y lo que se registra desde el icono se guardan por separado.

### Instalarla en Android o en un ordenador

Ábrela en Chrome o Edge y elige **Instalar aplicación** (o **Añadir a pantalla de inicio**) en el menú del navegador. Está pensada y probada para iPhone; en otros dispositivos funciona, pero se ha probado menos.

### Actualizaciones

La app se actualiza sola al abrirla con conexión. Si no ves un cambio reciente, ciérrala del todo y vuelve a abrirla. Los registros se conservan.

## Descargar el código y ejecutarlo

Necesitas [Node.js](https://nodejs.org) 22 o posterior y Git.

```
git clone https://github.com/Manolaken/AppRegistro-Sintomas.git
cd AppRegistro-Sintomas
npm install
npm run dev
```

La terminal muestra dos direcciones: `Local`, para abrirla en el mismo ordenador, y `Network`, para abrirla desde un móvil conectado a la misma wifi.

Con `npm run dev` se puede probar casi todo. El funcionamiento sin conexión, la instalación completa y Face ID necesitan HTTPS, así que solo se ven en una versión publicada.

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm run build` | Comprueba los tipos y genera la versión final en `dist` |
| `npm run lint` | Revisa el código con Oxlint |
| `npm run preview` | Sirve en local lo generado por `npm run build` |

## Cómo está hecha

React, TypeScript y Vite. Los datos se guardan en IndexedDB, la base de datos del navegador. Solo usa dos paquetes además de React: `pdf-lib`, para dibujar el informe, y `@fontsource-variable/bricolage-grotesque`, que trae la tipografía.

La estructura del código, las decisiones tomadas y lo que queda pendiente están en [CLAUDE.md](CLAUDE.md), que sirve además de contexto para trabajar en el proyecto con Claude Code.

## Privacidad

- Los registros viven en el dispositivo. Borrar la app, o los datos del sitio en el navegador, los elimina.
- La copia de seguridad y el informe son archivos que la propia persona decide dónde guardar y a quién enviar.
- El bloqueo con código impide abrir la app, pero no cifra los datos.
