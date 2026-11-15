import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Solo en la versión publicada (no con npm run dev): instala el service
// worker que permite abrir la app sin conexión. Ver public/sw.js.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Sin service worker la app funciona igual, solo que necesita conexión.
    })
  })
}

// Pide al navegador que no borre los datos guardados si anda justo de
// espacio. Solo existe con HTTPS, de ahí las comprobaciones.
if (navigator.storage !== undefined && typeof navigator.storage.persist === 'function') {
  navigator.storage.persist().catch(() => {})
}
