import { createClient } from '@supabase/supabase-js'
import type { Cuenta, Seguimiento, Oportunidad, Ticket, SemaforoAsesor } from './types'
import { getSemaforo } from './types'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY

// Public client (browser-safe)
export const supabase = createClient(URL, ANON)

// Admin client (server-only — bypasses RLS)
export const supabaseAdmin = SERVICE ? createClient(URL, SERVICE) : supabase

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
    .eq('estado', 'activo')

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
    .from('vista_semaforo_asesor')
    .select('*')
  return (data ?? []) as SemaforoAsesor[]
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
