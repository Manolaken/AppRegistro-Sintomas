import type { ReactNode } from 'react'

// Iconos de trazo dibujados en SVG. Todos heredan el color del texto.

function Icono({ children, grosor = 2.2 }: { children: ReactNode; grosor?: number }) {
  return (
    <svg
      aria-hidden="true"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export const IconoMas = () => (
  <Icono grosor={2.8}>
    <path d="M12 5v14M5 12h14" />
  </Icono>
)

export const IconoAtras = () => (
  <Icono grosor={2.6}>
    <path d="M15 5l-7 7 7 7" />
  </Icono>
)

export const IconoCerrar = () => (
  <Icono grosor={2.6}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icono>
)

export const IconoCheck = () => (
  <Icono grosor={3.2}>
    <path d="M5 12l5 5 9-10" />
  </Icono>
)

export const IconoComida = () => (
  <Icono>
    <path d="M6 3v7a2 2 0 0 0 4 0V3M8 12v9M17 3c-2 2-3 5-3 8h3v10" />
  </Icono>
)

export const IconoMedicacion = () => (
  <Icono>
    <rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-45 12 12)" />
    <path d="M9.2 9.2l5.6 5.6" />
  </Icono>
)

export const IconoCiclo = () => (
  <Icono>
    <path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z" />
  </Icono>
)

export const IconoInicio = () => (
  <Icono>
    <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Icono>
)

export const IconoHistorial = () => (
  <Icono>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </Icono>
)

export const IconoInforme = () => (
  <Icono>
    <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6" />
  </Icono>
)

export const IconoAjustes = () => (
  <Icono>
    <path d="M4 7h7M15 7h5M4 17h3M11 17h9" />
    <circle cx="13" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </Icono>
)

export const IconoBorrar = () => (
  <Icono>
    <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7zM12 9.500l5 5M17 9.500l-5 5" />
  </Icono>
)

export const IconoCandado = () => (
  <Icono>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Icono>
)
