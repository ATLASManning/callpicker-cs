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
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Cuenta
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

export async function upsertCuenta(cuenta: Partial<Cuenta>): Promise<Cuenta> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .upsert(cuenta, { onConflict: 'consecutivo' })
    .select()
    .single()
  if (error) throw error
  return data as Cuenta
}

export async function updateCuenta(id: string, changes: Partial<Cuenta>): Promise<Cuenta> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .update(changes)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Cuenta
}

// ── KPIs / Dashboard ────────────────────────────────────────────────────────

export async function getKPIs() {
  const { data } = await supabaseAdmin
    .from('cuentas')
    .select('facturacion, health_score, estado, asesor')
    .in('estado', ['activo', 'en_riesgo'])

  const cuentas = data ?? []
  const total = cuentas.length
  const facturacionTotal = cuentas.reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const enRiesgo = cuentas.filter(c => c.health_score < 40).length
  const facturacionRiesgo = cuentas
    .filter(c => c.health_score < 40)
    .reduce((s, c) => s + (c.facturacion ?? 0), 0)
  const saludables = cuentas.filter(c => c.health_score >= 60).length

  return { total, facturacionTotal, enRiesgo, facturacionRiesgo, saludables }
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
