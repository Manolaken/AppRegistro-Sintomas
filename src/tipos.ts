// Tipos compartidos por toda la app.

export type ZonaId =
  | 'hipocondrio-derecho'
  | 'epigastrio'
  | 'hipocondrio-izquierdo'
  | 'flanco-derecho'
  | 'umbilical'
  | 'flanco-izquierdo'
  | 'fosa-iliaca-derecha'
  | 'hipogastrio'
  | 'fosa-iliaca-izquierda'

export type TipoDolor = 'colico' | 'punzante' | 'ardor' | 'presion'
export type Duracion = 'menos-15' | '15-30' | '30-60' | '1-2h' | 'mas-2h' | 'sigue'
export type Sintoma =
  | 'nauseas'
  | 'vomitos'
  | 'fiebre'
  | 'mareo'
  | 'hinchazon'
  | 'gases'
  | 'diarrea'
  | 'estrenimiento'
  | 'acidez'
  | 'sin-apetito'
export type TiempoDesdeComida = 'menos-1h' | '1-2h' | '2-4h' | 'mas-4h'
export type Sueno = 'bien' | 'regular' | 'mal'
export type Animo = 'calma' | 'normal' | 'nervios'
export type Actividad = 'ninguna' | 'suave' | 'intensa'
export type Agua = 'poca' | 'normal' | 'mucha'
export type Regla = 'si' | 'no' | 'pronto'
export type Medicamento = 'paracetamol' | 'ibuprofeno' | 'otro'
export type Alivio = 'reposo' | 'calor' | 'bano' | 'comer' | 'medicacion' | 'nada'
export type Agravante = 'comer' | 'moverme' | 'tumbarme' | 'estres' | 'nada'
export type Impacto = 'normal' | 'pausa' | 'impidio'

// Una opción de una lista para elegir: "id" es lo que se guarda y
// "etiqueta" lo que se lee en pantalla.
export type Opcion<T extends string> = { id: T; etiqueta: string }

// Un episodio de dolor completo, tal como se guarda en el teléfono.
// Todo es opcional salvo dónde duele, cuánto y cuándo empezó.
export type Episodio = {
  id: string
  // Fecha y hora de inicio en hora local, con el formato "2026-11-15T14:20".
  inicio: string
  duracion: Duracion | null

  // Paso 1: el dolor
  celdas: number[]
  intensidad: number
  tipo: TipoDolor | null

  // Paso 2: qué más nota
  sintomas: Sintoma[]

  // Paso 3: qué pasó antes
  comida: string
  tiempoDesdeComida: TiempoDesdeComida | null
  sueno: Sueno | null
  animo: Animo | null
  actividad: Actividad | null
  agua: Agua | null
  regla: Regla | null

  // Paso 4: qué hizo y cómo le afectó
  medicacion: Medicamento[]
  dosis: string
  alivia: Alivio[]
  empeora: Agravante[]
  impacto: Impacto | null
  notas: string
}

// Lo que recibe cada paso del registro: el episodio que se está rellenando
// y una función para cambiar algunos de sus campos.
export type PropsPaso = {
  borrador: Episodio
  alCambiar: (cambios: Partial<Episodio>) => void
}

// --- Apuntes rápidos: lo que se anota sin que haya dolor ---

export type ClaseApunte = 'comida' | 'medicacion' | 'ciclo'
export type Toma = 'desayuno' | 'almuerzo' | 'comida' | 'merienda' | 'cena' | 'picoteo'
export type FaseCiclo = 'empieza' | 'sigue' | 'termina'
export type Flujo = 'poco' | 'normal' | 'mucho'

// Un apunte rápido. Los tres tipos comparten la misma forma para que sea
// sencillo guardarlos y listarlos juntos; cada clase usa solo sus campos.
export type Apunte = {
  id: string
  clase: ClaseApunte
  // Fecha y hora en hora local, con el formato "2026-11-15T14:20".
  momento: string
  // Texto libre: qué comió, detalle de la medicación o notas de la regla.
  texto: string
  // Solo comida
  toma: Toma | null
  // Solo medicación
  medicamentos: Medicamento[]
  // Solo regla
  fase: FaseCiclo | null
  flujo: Flujo | null
}

export type Pantalla = 'inicio' | 'registrar' | 'historial' | 'detalle' | 'editar' | 'apunte'

// Las pestañas de la barra inferior que ya funcionan.
export type Pestana = 'inicio' | 'historial'
