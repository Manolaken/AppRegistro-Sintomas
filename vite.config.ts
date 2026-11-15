import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // La app publicada vive en https://manolaken.github.io/AppRegistro-Sintomas/,
  // así que al compilar hay que decirle a Vite que cuelga de esa carpeta.
  // En desarrollo (npm run dev) sigue en la raíz. Debe coincidir, mayúsculas
  // incluidas, con el nombre del repositorio en GitHub.
  base: command === 'build' ? '/AppRegistro-Sintomas/' : '/',
  server: {
    host: true,
  },
}))
