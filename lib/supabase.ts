import { createClient } from '@supabase/supabase-js'
import type { Cuenta, Seguimiento, Oportunidad, Ticket, SemaforoAsesor } from './types'
import { getSemaforo } from './types'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

// Bypass Next.js 14 data cache — every query must hit Supabase fresh
const noStoreConfig = {
  global: {
    fetch: (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input, { ...init, cache: 'no-store' }),
  },
}

// Public client (browser-safe)
export const supabase = createClient(URL, ANON, noStoreConfig)

// Admin client (server-only — bypasses RLS + Next.js data cache)
export const supabaseAdmin = SERVICE
  ? createClient(URL, SERVICE, noStoreConfig)
  : supabase

// ── Cuentas ─────────────────────────────────────────────────────────────────

export async function getCuentas(filters?: {
  asesor?: string
  semaforo?: string
  estado?: string
  search?: string
}): Promise<Cuenta[]> {
  let q = supabaseAdmin
    .from('cuentas')
    .select('*')
    .order('facturacion', { ascending: false })

  if (filters?.asesor)  q = q.eq('asesor', filters.asesor)
  if (filters?.estado)  q = q.eq('estado', filters.estado)
  if (filters?.search)  q = q.ilike('empresa', `%${filters.search}%`)

  const { data, error } = await q
  if (error) throw error

  let result = (data ?? []) as Cuenta[]

  if (filters?.semaforo) {
    result = result.filter(c => getSemaforo(c.health_score) === filters.semaforo)
  }

  return result
}

export async function getCuentaById(id: string): Promise<Cuenta | null> {
  // Intentar primero por UUID id
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('*')
    .eq('id', id)
    .single()

  if (!error && data) return data as Cuenta

  // Si no existe por UUID, intentar por consecutivo (para URLs tipo /cuentas/C52)
  const { data: data2, error: error2 } = await supabaseAdmin
    .from('cuentas')
    .select('*')
    .eq('consecutivo', id)
    .single()

  if (error2) return null
  return data2 as Cuenta
}

export async function getCuentaByConsecutivo(consecutivo: string): Promise<Cuenta | null> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('*')
    .eq('consecutivo', consecutivo)
    .single()
  if (error) return null
  return data as Cuenta
}

// Helper: normaliza cualquier id (UUID o consecutivo) al UUID real
export async function normalizeCuentaId(id: string): Promise<string | null> {
  const cuenta = await getCuentaById(id)
  if (!cuenta) return null
  return cuenta.id
}

// Campos que NO existen en la tabla DB (computed por la API o enriquecidos en runtime)
const NON_DB_FIELDS = [
  'health_score',          // GENERATED ALWAYS — Supabase lo rechaza si se envía
  'zoho_tickets',          // enriched por la API, no almacenado
  'mrr_zoho',              // enriched por la API
  'factura_mensual_zoho',  // enriched por la API
  'semaforo_zoho',         // enriched por la API
  'segmento_zoho',         // enriched por la API
] as const

// Columnas JSONB que pueden no existir si la migración 20260716 aún no se ejecutó en Supabase.
// updateCuenta las incluye por defecto y hace fallback automático si el schema las rechaza.
const JSON_MIGRATION_FIELDS = ['contactos_json', 'servicios_json'] as const

function stripNonDbFields(obj: Record<string, unknown>): Record<string, unknown> {
  const out = { ...obj }
  for (const f of NON_DB_FIELDS) delete out[f]
  return out
}

function stripJsonMigrationFields(obj: Record<string, unknown>): Record<string, unknown> {
  const out = { ...obj }
  for (const f of JSON_MIGRATION_FIELDS) delete out[f]
  return out
}

export async function upsertCuenta(cuenta: Partial<Cuenta>): Promise<Cuenta> {
  const payload = stripNonDbFields(cuenta as Record<string, unknown>)
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .upsert(payload, { onConflict: 'consecutivo' })
    .select()
    .single()
  if (error) throw new Error(error.message ?? JSON.stringify(error))
  return data as Cuenta
}

export async function updateCuenta(id: string, changes: Partial<Cuenta>): Promise<Cuenta> {
  const payload = stripNonDbFields(changes as Record<string, unknown>)

  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  // Si el error es por columnas JSONB que aún no existen (migración pendiente),
  // reintenta sin ellas para no bloquear al usuario.
  if (error) {
    const msg = error.message ?? JSON.stringify(error)
    const isMissingJsonCol = JSON_MIGRATION_FIELDS.some(f => msg.includes(f))
    if (isMissingJsonCol) {
      const fallback = stripJsonMigrationFields(payload)
      const { data: d2, error: e2 } = await supabaseAdmin
        .from('cuentas')
        .update(fallback)
        .eq('id', id)
        .select()
        .single()
      if (e2) throw new Error(e2.message ?? JSON.stringify(e2))
      return d2 as Cuenta
    }
    throw new Error(msg)
  }
  return data as Cuenta
}

export async function deleteCuenta(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cuentas')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message ?? JSON.stringify(error))
}

// ── KPIs / Dashboard ────────────────────────────────────────────────────────

export async function getKPIs() {
  const { data } = await supabaseAdmin
    .from('cuentas')
    .select('facturacion, health_score, estado, asesor, notas')
    .in('estado', ['activo', 'en_riesgo'])

  const cuentas = data ?? []
  const total = cuentas.length
  const facturacionTotal = cuentas.reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const enRiesgo = cuentas.filter(c => c.health_score < 40).length
  const facturacionRiesgo = cuentas
    .filter(c => c.health_score < 40)
    .reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const saludables = cuentas.filter(c => c.health_score >= 60).length
  const faltaTC = cuentas.filter(c => c.notas?.includes('[FALTA_TC]')).length
  const faltaHS = cuentas.filter(c => c.notas?.includes('[FALTA_HS]')).length

  return { total, facturacionTotal, enRiesgo, facturacionRiesgo, saludables, faltaTC, faltaHS }
}

export async function getSemaforoByAsesor(): Promise<SemaforoAsesor[]> {
  const { data } = await supabaseAdmin
    .from('cuentas')
    .select('asesor, health_score, facturacion')
    .in('estado', ['activo', 'en_riesgo'])

  const map: Record<string, SemaforoAsesor> = {}
  for (const c of data ?? []) {
    if (!map[c.asesor]) {
      map[c.asesor] = {
        asesor: c.asesor,
        verde: 0, azul: 0, amarillo: 0, naranja: 0, rojo: 0,
        total: 0, facturacion_total: 0, facturacion_en_riesgo: 0,
      }
    }
    const m = map[c.asesor]
    const hs = c.health_score ?? 50
    const fac = c.facturacion ?? 0
    m.total++
    m.facturacion_total += fac
    if (hs >= 80)                   m.verde++
    else if (hs >= 60)              m.azul++
    else if (hs >= 40)              m.amarillo++
    else if (hs >= 20)              m.naranja++
    else                            m.rojo++
    if (hs < 40) m.facturacion_en_riesgo += fac
  }
  return Object.values(map).sort((a, b) => b.facturacion_total - a.facturacion_total)
}

// ── Seguimientos ─────────────────────────────────────────────────────────────

export async function getSeguimientos(cuentaId: string): Promise<Seguimiento[]> {
  const { data, error } = await supabaseAdmin
    .from('seguimientos')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('fecha', { ascending: false })
    .limit(50)
  if (error) throw error
  return (data ?? []) as Seguimiento[]
}

export async function updateSeguimientoResultado(id: string, resultado: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('seguimientos')
    .update({ resultado })
    .eq('id', id)
  if (error) throw error
}

export async function addSeguimiento(s: Omit<Seguimiento, 'id' | 'created_at'>): Promise<Seguimiento> {
  const { data, error } = await supabaseAdmin
    .from('seguimientos')
    .insert(s)
    .select()
    .single()
  if (error) throw error
  return data as Seguimiento
}

// ── Oportunidades ────────────────────────────────────────────────────────────

export async function getOportunidades(cuentaId: string): Promise<Oportunidad[]> {
  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Oportunidad[]
}

export async function upsertOportunidad(o: Partial<Oportunidad>): Promise<Oportunidad> {
  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .upsert(o)
    .select()
    .single()
  if (error) throw error
  return data as Oportunidad
}

// ── Tickets ──────────────────────────────────────────────────────────────────

export async function getTickets(cuentaId: string): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .eq('cuenta_id', cuentaId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Ticket[]
}

export async function addTicket(t: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .insert(t)
    .select()
    .single()
  if (error) throw error
  return data as Ticket
}

// ── Health Score Snapshot ─────────────────────────────────────────────────────

export async function saveHealthSnapshot(cuentaId: string, cuenta: Cuenta) {
  await supabaseAdmin.from('health_score_historial').insert({
    cuenta_id: cuentaId,
    health_score: cuenta.health_score,
    score_actividad: cuenta.score_actividad,
    score_adopcion: cuenta.score_adopcion,
    score_pago: cuenta.score_pago,
    score_relacional: cuenta.score_relacional,
    semaforo: getSemaforo(cuenta.health_score),
  })
}

export async function getHealthHistorial(cuentaId: string) {
  const { data } = await supabaseAdmin
    .from('health_score_historial')
    .select('fecha, health_score, semaforo')
    .eq('cuenta_id', cuentaId)
    .order('fecha', { ascending: true })
    .limit(12)
  return data ?? []
}

// ── Junta Semanal — tipos extendidos ─────────────────────────────────────────

export type CuentaMin = {
  id: string
  empresa: string
  consecutivo: string
  asesor: string
  facturacion: number
}

export type SeguimientoConCuenta = Seguimiento & { cuentas: CuentaMin | null }
export type OportunidadConCuenta = Oportunidad & { cuentas: CuentaMin | null }
export type TicketConCuenta      = Ticket       & { cuentas: CuentaMin | null }

// Queries sin FK-join — join manual con el mapa de cuentas que pasa el caller
export async function getSeguimientosRango(desde: string, hasta: string): Promise<Seguimiento[]> {
  const { data, error } = await supabaseAdmin
    .from('seguimientos')
    .select('*')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
  if (error) throw error
  return (data ?? []) as Seguimiento[]
}

// Actividades SAC — conteo semanal por asesor (tabla `actividades`)
export async function getActividadesSAC(desdeSemanainicio: string): Promise<{ asesor: string; semana_inicio: string; completada: boolean }[]> {
  const { data, error } = await supabaseAdmin
    .from('actividades')
    .select('asesor, semana_inicio, completada')
    .gte('semana_inicio', desdeSemanainicio)
  if (error) throw error
  return (data ?? []) as { asesor: string; semana_inicio: string; completada: boolean }[]
}

// Actividades SAC por cuenta — para el panel de historial en /cuentas/[id]
export interface ActividadSAC {
  id:               string
  tipo:             string
  descripcion:      string
  prioridad:        string
  fecha_programada: string
  fecha_vencimiento:string
  semana_inicio:    string
  estado:           string
  completada:       boolean
  resultado:        string | null
  asesor:           string
  hs_cuenta:        number
  semaforo_cuenta:  string
}

export async function getActividadesByCuenta(cuentaId: string): Promise<ActividadSAC[]> {
  const { data, error } = await supabaseAdmin
    .from('actividades')
    .select('id, tipo, descripcion, prioridad, fecha_programada, fecha_vencimiento, semana_inicio, estado, completada, resultado, asesor, hs_cuenta, semaforo_cuenta')
    .eq('cuenta_id', cuentaId)
    .order('fecha_programada', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as ActividadSAC[]
}

export async function getOportunidadesActivasRaw(): Promise<Oportunidad[]> {
  const { data, error } = await supabaseAdmin
    .from('oportunidades')
    .select('*')
    .in('estado', ['identificada', 'en_proceso'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Oportunidad[]
}

export async function getTicketsAbiertosRaw(): Promise<Ticket[]> {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('*')
    .in('estado', ['abierto', 'en_proceso'])
    .order('dias_abierto', { ascending: false })
  if (error) throw error
  return (data ?? []) as Ticket[]
}
