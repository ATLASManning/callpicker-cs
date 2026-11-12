/**
 * CONTRATO DE DATOS — Registro de comunicaciones por cuenta
 * =========================================================
 *
 * FUENTE: el conector `com-contexto` que corre en n8n
 *   https://n8n-gtc.connectors.callpicker.com/webhook/com-contexto?v=<vista>&id=<id>
 *
 * Este archivo es la FUENTE ÚNICA de la forma de ese dato. Nadie más declara
 * estos tipos, igual que `lib/seguimiento-tipos.ts` para Seguimiento KAM. Si
 * una pantalla necesita un campo que no está aquí, se agrega AQUÍ.
 *
 * ── POR QUÉ ESTE ARCHIVO EXISTE ANTES QUE LA INTEGRACIÓN ──────────────────
 *
 * Medido el 11 nov 2026, el conector NO se puede consumir desde un servidor:
 * responde **HTTP 200 con una pantalla de login de Google (@callpicker.com)**
 * a cualquier petición sin sesión. 745 bytes que dicen «Entrar», contra los
 * 68,609 de la ficha real. Un `fetch` ingenuo desde Vercel guardaría esa
 * pantalla como si fuera el dato de la cuenta, la parsearía a CERO
 * comunicaciones, y el tablero diría «esta cuenta no habla con nosotros».
 *
 * Es exactamente el mismo truco que nuestro propio middleware nos jugó —sirve
 * el login con 200— y la misma clase de falso cero que acabamos de arreglar en
 * Churn. Ver [[project-callpicker-auth-pending]] y
 * [[feedback-cero-sin-medicion]].
 *
 * Por eso el contrato se escribe PRIMERO y el cliente nace con su control
 * negativo puesto. Lo que falta para encender esto es una credencial de
 * servicio y, idealmente, una rama `salida=json` en el mismo webhook: el
 * workflow YA tiene el objeto estructurado —la página no trae ni un `<script>`,
 * es HTML armado en el servidor— y hoy sólo lo sabe pintar.
 *
 * ── LO QUE NO SE HACE CON ESTE DATO ───────────────────────────────────────
 *
 * `riesgoCancelacion` NO se agrega a un riesgo de cuenta, NO se promedia y NO
 * alimenta semáforos. Es la etiqueta que un modelo le puso A ESA LLAMADA, y no
 * conocemos su fórmula. Ya tenemos `health_score` y el motor de Alertas; dos
 * puntajes de riesgo calculados distinto, en la misma pantalla, es como un
 * tablero pierde autoridad. Se enseña junto a su llamada y nada más.
 * Ver [[feedback-metricas-derivadas-origen]].
 */

/* ── Identidad ────────────────────────────────────────────────────────────── */

/** Vistas que el conector sabe servir. El `id` es de Zoho, no nuestro. */
export type VistaConector = 'persona' | 'empresa' | 'oportunidad'

/**
 * EL CRUCE VA POR CID Y NADA MÁS.
 *
 * Medido el 11 nov 2026: las 224 cuentas de cartera tienen CID, el 100%. No
 * hay un solo caso que obligue a cruzar por nombre, así que no se cruza por
 * nombre — eso mezcla cuentas y ya nos costó caro en DIDs y en el GRC.
 * Ver [[dids-fuente]] y [[grc-fuente-zoho]].
 */
export type Cid = string

/* ── Canales ──────────────────────────────────────────────────────────────── */

export type Canal = 'ticket' | 'llamada' | 'correo' | 'whatsapp'
export type Sentido = 'entrante' | 'saliente'

/** Lo que el conector pinta como «chip» en una llamada. */
export type ResultadoLlamada =
  | 'contestada'
  | 'perdida'
  | 'menu'          // «Se quedó en el menú»
  | 'desconocido'   // vino algo que no sabemos clasificar: se dice, no se tira

/**
 * ESTADO DEL TICKET — la razón de más peso para integrar esto.
 *
 * Nuestra fuente semanal de tickets trae 7,916 filas y 7,914 con fecha de
 * cierre: el 100%, y ni un campo `estado`. O sea que «tickets abiertos» HOY ES
 * NO MEDIBLE en el tablero. El conector sí los trae («Pendiente»).
 * Ver [[tickets-fuente]].
 */
export type EstadoTicket = 'abierto' | 'pendiente' | 'cerrado' | 'desconocido'

/* ── El análisis que el modelo de la fuente dejó sobre una llamada ────────── */

export interface AnalisisLlamada {
  /** 0–100, TAL CUAL lo dio la fuente. Ver la advertencia del encabezado. */
  riesgoCancelacion: number | null
  /** 0–100, TAL CUAL lo dio la fuente. */
  desempeno: number | null
  tipo: string | null
  /** La fuente rotula este par distinto según el tipo de llamada:
   *  soporte → «Problema» / «Solución»; trámites → «Necesidad» / «Resolución».
   *  Guardamos el rótulo que vino, no el que nos gustaría. */
  rotuloNecesidad: string | null
  necesidad: string | null
  rotuloResolucion: string | null
  resolucion: string | null
  resultado: string | null
  siguientePaso: string | null
  loQueHizoBien: string[]
  sugerencias: string[]
}

/* ── Una comunicación ─────────────────────────────────────────────────────── */

export interface Comunicacion {
  canal: Canal
  /** ISO en hora de México. NUNCA `toISOString()` sobre un Date del servidor:
   *  Vercel corre en UTC. Ver `lib/fecha-local.ts` y [[feedback-fechas-zona-mexico]]. */
  fechaIso: string
  /** El texto tal cual lo pintó la fuente, para poder auditar el parseo. */
  fechaTexto: string
  sentido: Sentido | null
  /** Quién lo atendió de nuestro lado. */
  agente: string | null
  /** Teléfono, correo o «contacto» — lo que la fuente haya puesto. */
  contraparte: string | null
  /** «SAC», «Ventas»… el departamento que la fuente etiqueta. */
  area: string | null
  resumen: string | null

  /* llamada */
  duracionSeg: number | null
  resultadoLlamada: ResultadoLlamada | null
  analisis: AnalisisLlamada | null

  /* ticket */
  ticketNum: string | null
  ticketAsunto: string | null
  estadoTicket: EstadoTicket | null

  /* correo */
  asunto: string | null
  direccionesCallpicker: string[]
  direccionesCliente: string[]

  /* whatsapp */
  bandeja: string | null

  /**
   * Cuántos mensajes o intervenciones tiene la conversación.
   * OJO: el CONTENIDO de la conversación NO viene en esta página —medido: los
   * `<details>` sólo contienen su propio `<summary>`—. Esto es un conteo, no
   * una transcripción.
   */
  conversacionPiezas: number | null

  /**
   * ENLACES, NUNCA COPIAS. Grabaciones y expedientes se abren en su sistema.
   * Nada de contenido de cliente servido desde `public/`: el PWA ya precacheó
   * 21 documentos de clientes una vez. Ver [[pwa-documentos-cliente]].
   */
  ligaGrabacion: string | null
  ligaDesk: string | null
}

/* ── La ficha completa de una cuenta ──────────────────────────────────────── */

export interface DatosCuentaConector {
  empresa: string | null
  dueno: string | null
  monto: number | null
  fuente: string | null
  etapa: string | null
  creadaTexto: string | null
  cierreTexto: string | null
}

export interface ContextoComunicaciones {
  cid: Cid
  vista: VistaConector
  idZoho: string
  titulo: string | null
  datos: DatosCuentaConector
  involucrados: { nombre: string; papel: string | null }[]
  comunicaciones: Comunicacion[]
  /** Lo que la fuente DECLARA que hay —«COMUNICACIONES (28)»—, para poder
   *  cuadrar contra lo que efectivamente parseamos. Si no cuadra, no se
   *  publica. Ver [[feedback-tablas-deben-cerrar]]. */
  declaradas: number | null
  obtenidoEn: string
}

/* ── MEDIBLE / NO MEDIBLE ─────────────────────────────────────────────────── */

/**
 * Un canal del que la fuente no dijo nada NO es un canal sin actividad.
 *
 * Toda pantalla que consuma esto distingue tres estados, no dos:
 *   medible + con filas  → el dato
 *   medible + sin filas  → «sin actividad en el periodo»
 *   NO medible           → «no medible», con palabras, en gris
 *
 * Ver [[feedback-cero-sin-medicion]] y [[feedback-contexto-ia-sin-huecos]].
 */
export interface Medicion<T> {
  medible: boolean
  /** Por qué no se pudo medir. Obligatorio cuando `medible` es false. */
  motivo: string | null
  valor: T | null
}

export const noMedible = <T>(motivo: string): Medicion<T> => ({
  medible: false,
  motivo,
  valor: null,
})

export const medido = <T>(valor: T): Medicion<T> => ({
  medible: true,
  motivo: null,
  valor,
})
