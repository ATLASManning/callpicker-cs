// ── Enums ───────────────────────────────────────────────────────────────────
export type Asesor = 'Fátima' | 'Dan' | 'Claudia'
export type Semaforo = 'verde' | 'azul' | 'amarillo' | 'naranja' | 'rojo'
export type EstadoCuenta = 'activo' | 'en_riesgo' | 'hibernacion' | 'cancelado'
export type TipoSeguimiento = 'llamada' | 'whatsapp' | 'email' | 'reunion' | 'ticket' | 'nota' | 'demo' | 'upsell'
export type TipoOportunidad = 'upsell' | 'crossell'
export type EstadoOportunidad = 'identificada' | 'en_proceso' | 'ganada' | 'perdida' | 'descartada'
export type PrioridadTicket = 'critica' | 'alta' | 'normal' | 'baja'
export type EstadoTicket = 'abierto' | 'en_proceso' | 'resuelto' | 'cerrado'

// ── Ticket stats enriquecidos (viene de la API, no de Supabase) ──────────────
export interface ZohoTicketStats {
  total:  number
  fallas: number
  ultima: string | null
}

// ── Contacto / Servicio (para listas dinámicas) ──────────────────────────────
export interface ContactoCuenta {
  nombre: string
  cargo:  string
  email:  string
  tel:    string
}

export interface ServicioCuenta {
  nombre:      string
  descripcion: string
}

// ── Main Cuenta type ────────────────────────────────────────────────────────
export interface Cuenta {
  id: string
  consecutivo: string
  cid: string | null
  empresa: string
  asesor: Asesor
  facturacion: number
  mrr_zoho?: number | null
  factura_mensual_zoho?: number | null
  semaforo_zoho?: string | null
  servicio: string | null
  activo_desde: string | null

  contacto_nombre: string | null
  contacto_email: string | null
  contacto_tel: string | null
  contacto_cargo: string | null

  tamano_empresa: string | null
  giro: string | null
  total_empleados: string | null
  num_oficinas: string | null
  direccion_fiscal: string | null
  pagina_web: string | null
  zoho_link: string | null
  grupo_empresarial: string | null

  score_actividad: number
  score_adopcion: number
  score_pago: number
  score_relacional: number
  health_score: number

  dias_sin_actividad: number
  llamadas_cambio_pct: number
  llamadas_atendidas_pct: number

  tiene_chat_activo: boolean
  tiene_integracion_api: boolean
  tiene_pago_automatico: boolean
  tiene_ia_voz: boolean
  tiene_ia_chat: boolean
  dashboard_revisado: boolean

  pagos_al_corriente: boolean
  incidencias_pago: number

  tickets_abiertos: number
  tiene_ticket_reincidente: boolean

  dias_como_cliente: number

  upsell_producto: string | null
  crossell_producto: string | null
  valor_upsell_estimado: number | null

  ultimo_contacto: string | null
  proximo_contacto: string | null
  fecha_ultima_llamada: string | null
  nps_score: number | null

  estado: EstadoCuenta
  notas: string | null
  observaciones_kam: string | null

  // Listas dinámicas (JSONB en DB)
  contactos_json: ContactoCuenta[] | null
  servicios_json: ServicioCuenta[] | null

  // Enriquecido por la API (no almacenado en Supabase)
  zoho_tickets?: ZohoTicketStats

  created_at: string
  updated_at: string
}

// ── Seguimiento ──────────────────────────────────────────────────────────────
export interface Seguimiento {
  id: string
  cuenta_id: string
  fecha: string
  tipo: TipoSeguimiento
  descripcion: string | null
  resultado: string | null
  asesor: string | null
  duracion_min: number | null
  created_at: string
}

// ── Health Score Historial ───────────────────────────────────────────────────
export interface HealthScoreHistorial {
  id: string
  cuenta_id: string
  fecha: string
  health_score: number
  score_actividad: number | null
  score_adopcion: number | null
  score_pago: number | null
  score_relacional: number | null
  semaforo: Semaforo | null
  created_at: string
}

// ── Oportunidad ──────────────────────────────────────────────────────────────
export interface Oportunidad {
  id: string
  cuenta_id: string
  tipo: TipoOportunidad
  producto: string | null
  valor_estimado: number | null
  estado: EstadoOportunidad
  notas: string | null
  fecha_identificacion: string
  fecha_cierre: string | null
  created_at: string
  updated_at: string
}

// ── Ticket ───────────────────────────────────────────────────────────────────
export interface Ticket {
  id: string
  cuenta_id: string
  titulo: string
  descripcion: string | null
  tipo: string | null
  prioridad: PrioridadTicket
  estado: EstadoTicket
  reincidente: boolean
  dias_abierto: number
  created_at: string
  updated_at: string
}

// ── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatMensaje {
  id: string
  cuenta_id: string | null
  rol: 'user' | 'assistant' | 'system'
  contenido: string
  fecha: string
}

// ── Vista Semáforo por Asesor ────────────────────────────────────────────────
export interface SemaforoAsesor {
  asesor: Asesor
  verde: number
  azul: number
  amarillo: number
  naranja: number
  rojo: number
  total: number
  facturacion_total: number
  facturacion_en_riesgo: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export function getSemaforo(score: number): Semaforo {
  if (score >= 80) return 'verde'
  if (score >= 60) return 'azul'
  if (score >= 40) return 'amarillo'
  if (score >= 20) return 'naranja'
  return 'rojo'
}

export const SEMAFORO_CONFIG: Record<Semaforo, { label: string; color: string; bg: string; border: string }> = {
  verde:    { label: 'Saludable',    color: '#22C55E', bg: 'bg-verde/10',    border: 'border-verde' },
  azul:     { label: 'Estable',      color: '#3B82F6', bg: 'bg-azul/10',     border: 'border-azul' },
  amarillo: { label: 'Observación',  color: '#EAB308', bg: 'bg-amarillo/10', border: 'border-amarillo' },
  naranja:  { label: 'En Riesgo',    color: '#F97316', bg: 'bg-naranja/10',  border: 'border-naranja' },
  rojo:     { label: 'Riesgo Alto',  color: '#EF4444', bg: 'bg-rojo/10',     border: 'border-rojo' },
}

export const ASESOR_CONFIG: Record<Asesor, {
  color: string; initial: string
  fullName: string; ext: string; email: string; tel?: string
}> = {
  'Fátima':  { color: '#A855F7', initial: 'F', fullName: 'Fátima González',   ext: '457', email: 'fatima@callpicker.com' },
  'Dan':     { color: '#0EA5E9', initial: 'D', fullName: 'Dan Domínguez',     ext: '450', email: 'dominguez.dan@callpicker.com' },
  'Claudia': { color: '#F97316', initial: 'C', fullName: 'Claudia Hernández', ext: '452', email: 'claudia@callpicker.com', tel: '442 454 0355' },
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}
