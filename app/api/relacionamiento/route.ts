import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { relacionamientoDeCuentas } from '@/lib/relacionamiento'

export const dynamic = 'force-dynamic'
export const maxDuration = 55

/**
 * Relacionamiento asesor ↔ cuenta.
 *
 *   GET  /api/relacionamiento           → calcula y devuelve, sin escribir
 *   POST /api/relacionamiento           → además ESCRIBE `score_relacional`
 *
 * Por qué el POST importa: `score_relacional` pesa 15% del Health Score
 *   HS = actividad·0.35 + adopción·0.30 + pago·0.20 + relacional·0.15
 * y estaba en 50 para 172 de 173 cuentas — un componente constante que no
 * discriminaba nada. Al escribirlo con evidencia real (seguimientos,
 * actividades, reuniones vinculadas, stakeholders, auditoría), el Health Score
 * empieza a reflejar de verdad la relación con el cliente.
 *
 * `health_score` es GENERATED ALWAYS en Postgres: se recalcula solo al
 * actualizar los componentes. No se escribe nunca de forma directa.
 */

const CAMPOS = 'id, consecutivo, cid, empresa, asesor, estado, score_relacional, '
             + 'ultimo_contacto, contactos_json, observaciones_kam, notas'

async function calcular(soloVivas: boolean) {
  let q = supabaseAdmin.from('cuentas').select(CAMPOS)
  if (soloVivas) q = q.in('estado', ['activo', 'en_riesgo'])
  const { data, error } = await q
  if (error) throw new Error(error.message)

  const cuentas = (data ?? []) as unknown as {
    id: string; consecutivo: string | null; cid: string | null; empresa: string
    asesor: string | null; estado: string; score_relacional: number | null
    ultimo_contacto: string | null; contactos_json: unknown
    observaciones_kam: string | null; notas: string | null
  }[]

  const mapa = await relacionamientoDeCuentas(cuentas.map(c => ({
    cuentaId: c.id, consecutivo: c.consecutivo, ultimoContacto: c.ultimo_contacto,
    contactosJson: c.contactos_json, observacionesKam: c.observaciones_kam, notas: c.notas,
  })))

  return cuentas.map(c => {
    const r = mapa.get(c.id)
    return {
      cuenta_id: c.id, consecutivo: c.consecutivo, cid: c.cid, empresa: c.empresa,
      asesor: c.asesor, estado: c.estado,
      score_actual: c.score_relacional,
      score_calculado: r?.pct ?? 0,
      nivel: r?.nivel ?? 'Sin relación registrada',
      evidencia: r?.evidencia ?? [],
      desglose: r?.desglose ?? null,
      conteos: r?.conteos ?? null,
      dias_ultimo_contacto: r?.diasUltimoContacto ?? null,
    }
  })
}

export async function GET(req: NextRequest) {
  try {
    const soloVivas = req.nextUrl.searchParams.get('todas') !== '1'
    const filas = await calcular(soloVivas)
    const prom = filas.length
      ? Math.round(filas.reduce((s, f) => s + f.score_calculado, 0) / filas.length)
      : 0
    return NextResponse.json({
      total: filas.length,
      promedio: prom,
      niveles: filas.reduce<Record<string, number>>((a, f) => {
        a[f.nivel] = (a[f.nivel] ?? 0) + 1; return a
      }, {}),
      filas: filas.sort((a, b) => b.score_calculado - a.score_calculado),
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const rol = req.headers.get('x-user-rol') ?? 'viewer'
  if (rol !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }
  try {
    const soloVivas = req.nextUrl.searchParams.get('todas') !== '1'
    const filas = await calcular(soloVivas)

    // Sólo se escribe lo que cambia: evita 200 updates inútiles y deja un
    // registro limpio de qué se movió en esta corrida.
    const cambios = filas.filter(f => f.score_actual !== f.score_calculado)
    let escritos = 0
    const errores: string[] = []
    for (const f of cambios) {
      const { error } = await supabaseAdmin
        .from('cuentas')
        .update({ score_relacional: f.score_calculado })
        .eq('id', f.cuenta_id)
      if (error) errores.push(`${f.consecutivo ?? f.cuenta_id}: ${error.message}`)
      else escritos++
    }

    return NextResponse.json({
      evaluadas: filas.length,
      con_cambio: cambios.length,
      escritos,
      errores: errores.slice(0, 10),
      detalle: cambios.slice(0, 40).map(f => ({
        consecutivo: f.consecutivo, empresa: f.empresa,
        de: f.score_actual, a: f.score_calculado, nivel: f.nivel,
      })),
    })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
