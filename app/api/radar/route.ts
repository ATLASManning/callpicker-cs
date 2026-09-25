import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import { evaluarRadar, type CorteSerie, type EntradaRadar } from '@/lib/radar'
import { baseMinutos } from '@/lib/plan-minutos'
import { NOMBRES_CANCELACION, normalizarNombre } from '@/lib/elegibilidad'
import { soporteDeCuenta } from '@/lib/soporte-cuenta'
import { hoyEnMexico } from '@/lib/fecha-local'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

/* ── Caché del Excel de cortes ────────────────────────────────────────── */
type CorteRaw = {
  cid: string; mes: string; plan: string
  incl: number; cons: number; ent: number | null; sal: number | null; uso: string
}
let _cache: Map<string, CorteRaw[]> | null = null
let _cacheTs = 0
const TTL = 10 * 60 * 1000

function serialToMonth(v: unknown): string | null {
  if (typeof v === 'number' && v > 40000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000)
    return d.toISOString().slice(0, 7)
  }
  if (v instanceof Date) return v.toISOString().slice(0, 7)
  if (typeof v === 'string' && /^\d{4}-\d{2}/.test(v)) return v.slice(0, 7)
  return null
}
const num = (v: unknown): number => {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

async function getCortes(): Promise<Map<string, CorteRaw[]>> {
  if (_cache && Date.now() - _cacheTs < TTL) return _cache
  const xlsx = (await import('xlsx')).default
  const fs   = (await import('fs')).default
  const file = path.join(process.cwd(), 'data', 'cortes-facturacion.xlsx')
  const map  = new Map<string, CorteRaw[]>()
  if (!fs.existsSync(file)) { _cache = map; _cacheTs = Date.now(); return map }

  const wb  = xlsx.readFile(file)
  const ws  = wb.Sheets[wb.SheetNames[0]]
  const raw = xlsx.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

  for (const r of raw) {
    const cid = String(r['CID'] ?? '').trim()
    const mes = serialToMonth(r['Fecha de corte'])
    if (!cid || !mes) continue
    const arr = map.get(cid) ?? []
    arr.push({
      cid, mes,
      plan: String(r['Nombre del Plan'] ?? '').trim(),
      incl: num(r['Minutos Incluidos']),
      cons: num(r['Minutos Consumidos']),
      ent:  r['% Llamadas entrantes'] !== '' ? num(r['% Llamadas entrantes']) : null,
      sal:  r['% Llamadas salientes'] !== '' ? num(r['% Llamadas salientes']) : null,
      uso:  String(r['Uso Principal de llamadas'] ?? '').trim(),
    })
    map.set(cid, arr)
  }
  _cache = map; _cacheTs = Date.now()
  return map
}

/* ── GET /api/radar?cuentaId=… ───────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const cuentaId = req.nextUrl.searchParams.get('cuentaId')
  if (!cuentaId) return NextResponse.json({ error: 'cuentaId requerido' }, { status: 400 })

  const { data: cuenta, error } = await supabaseAdmin
    .from('cuentas')
    .select('id, cid, empresa, asesor, estado, facturacion, activo_desde, contactos_json, observaciones_kam, tickets_abiertos, tiene_ticket_reincidente')
    .eq('id', cuentaId)
    .single()
  if (error || !cuenta) return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })

  // Facturación viva desde Zoho (regla fuente única — la columna guardada envejece)
  try {
    const { enrichCuentasWithZoho } = await import('@/lib/zoho-enrich')
    const [cz] = await enrichCuentasWithZoho([cuenta])
    if (cz.factura_mensual_zoho != null) cuenta.facturacion = cz.factura_mensual_zoho
  } catch { /* sin Zoho: dato guardado */ }

  const cid = String(cuenta.cid ?? '').trim()

  /* Serie de cortes — el % SIEMPRE se recalcula, nunca se toma del archivo */
  const cortes = await getCortes()
  const serie: CorteSerie[] = (cortes.get(cid) ?? [])
    .sort((a, b) => a.mes.localeCompare(b.mes))
    .map(c => {
      /* Este módulo ya traía su propia versión de la regla (`incl === 1` como
       * señal de ilimitado, extensiones leídas del nombre). Funcionaba para el
       * caso común y fallaba en dos: los planes IL cuyo archivo trae 6, 20 o
       * 100 en vez de 1, y los planes por extensiones CON bolsa real —«50
       * Extensiones … IP» de LI Financiera, 12,500 minutos— a los que habría
       * que respetarles su bolsa. Ahora usa la fuente única. */
      const b = baseMinutos(c.plan, c.incl)
      return {
        mes: c.mes, plan: c.plan,
        minutosIncl: c.incl, minutosCons: c.cons,
        pctConsumo: b.base && b.base > 0 ? (c.cons / b.base) * 100 : null,
        pctEntrantes: c.ent, pctSalientes: c.sal, usoPrincipal: c.uso,
        ilimitado: b.origen === 'extensiones', extensiones: b.extensiones,
      }
    })

  /* Adopción */
  const { data: adop } = await supabaseAdmin
    .from('adopcion_producto')
    .select('producto, nivel, fecha')
    .eq('cuenta_id', cuentaId)
    .order('fecha', { ascending: false })

  const ultimaFecha = adop?.[0]?.fecha ?? null
  const delUltimoCorte = (adop ?? []).filter(a => a.fecha === ultimaFecha)
  const adopcionBaja = delUltimoCorte.filter(a => a.nivel === 'bajo' || a.nivel === 'no_aplica').length

  /* Última conversación de valor */
  const { data: seg } = await supabaseAdmin
    .from('seguimientos').select('fecha').eq('cuenta_id', cuentaId)
    .order('fecha', { ascending: false }).limit(1)
  const { data: act } = await supabaseAdmin
    .from('actividades').select('id, fecha_programada, estado').eq('cuenta_id', cuentaId)

  const ultimaConversacion = seg?.[0]?.fecha ?? null

  /* Churn y alertas */
  // El módulo "Alertas · Cancelación" se retiró el 24 Ago 2026; la señal
  // ahora viene de las cancelaciones de Churn > Análisis DATA, que se cruzan
  // por nombre porque esos reportes no traen CID.
  const enAlerta = NOMBRES_CANCELACION.has(normalizarNombre(cuenta.empresa))

  const contactos = Array.isArray(cuenta.contactos_json) ? cuenta.contactos_json.length : 0
  const kamRaw = String(cuenta.observaciones_kam ?? '').trim()

  // Se declara ANTES de `entrada`, que la lee: una `const` no se iza.
  const soporte = soporteDeCuenta(cid || null, cuenta.empresa)

  const entrada: EntradaRadar = {
    serie, contactos,
    tieneObsKam: kamRaw !== '' && kamRaw !== '0',
    registrosAdopcion: adop?.length ?? 0,
    fechaUltimaAdopcion: ultimaFecha,
    adopcionBaja, adopcionTotal: delUltimoCorte.length,
    ultimaConversacion,
    totalActividades: act?.length ?? 0,
    // Soporte: el export de Zoho da la HISTORIA y la mesa de ayuda el PRESENTE.
    // `tiene_ticket_reincidente` ya no se lee: era una columna muerta, false en
    // las 222 cuentas porque nadie la actualizaba nunca. La reincidencia ahora
    // se MIDE sobre los cortes de la mesa.
    ticketsAbiertos:        soporte.historia.abiertos ?? 0,
    ticketsAbiertosMedible: soporte.abiertosMedible,
    vencidosMesa:           soporte.vencidos.length,
    peorDiasSLA:            soporte.peorDiasSLA,
    cortesConVencidos:      soporte.cortesConVencidos,
    cortesTotalesMesa:      soporte.cortesTotales,
    ticketReincidente:      soporte.reincideEnMesa,
    facturacion: cuenta.facturacion != null ? Number(cuenta.facturacion) : null,
    activoDesde: cuenta.activo_desde,
    enChurn: false,
    enAlertaCancelacion: enAlerta,
  }

  const radar = evaluarRadar(entrada)

  /* Respuestas guardadas del asesor */
  let respuestas: Record<string, unknown> | null = null
  let necesitaTabla = false
  try {
    const { data, error: rErr } = await supabaseAdmin
      .from('radar_respuestas').select('*').eq('cuenta_id', cuentaId)
      .order('creado_en', { ascending: false }).limit(1)
    if (rErr && (rErr.message.includes('radar_respuestas') || rErr.code === 'PGRST205')) necesitaTabla = true
    else respuestas = data?.[0] ?? null
  } catch { necesitaTabla = true }

  return NextResponse.json({
    cuenta: { id: cuenta.id, empresa: cuenta.empresa, asesor: cuenta.asesor, cid, facturacion: cuenta.facturacion },
    radar, respuestas, necesitaTabla,
  })
}

/* ── POST — guarda las respuestas del asesor ─────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cuenta_id, asesor, respuestas, score_atlas, nivel_atlas } = body as {
      cuenta_id: string; asesor: string; respuestas: Record<string, unknown>
      score_atlas: number; nivel_atlas: string
    }
    if (!cuenta_id) return NextResponse.json({ error: 'cuenta_id requerido' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('radar_respuestas')
      .insert({
        cuenta_id, asesor, respuestas,
        score_atlas, nivel_atlas,
        fecha: hoyEnMexico(),
      })
      .select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
