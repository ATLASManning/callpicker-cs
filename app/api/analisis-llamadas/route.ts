import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

/**
 * Análisis de Llamadas — agregaciones del lado del servidor.
 *
 * El JSON son 1.9 MB con la matriz día×hora y la serie diaria de 148 cuentas:
 * no tiene por qué viajar al navegador. El cliente pide cortes ya resueltos,
 * igual que /api/cortes y /api/tickets.
 *
 * Reglas del dominio que este endpoint NO puede romper:
 *  · Entrante «Lost» (nadie contestó) y saliente «Lost» (no conectó) son cosas
 *    distintas y nunca se suman. Por eso `dir` es obligatorio en todo cálculo y
 *    las salientes se publican como «% que conectó».
 *  · `Self_service` es una llamada que resolvió el menú: cuenta como atendida.
 *  · Las filas cuyo archivo no traía columna de destino van a un bucket propio
 *    y jamás al de «(sin destino registrado)».
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 30

interface Dir {
  total: number
  tipos: Record<string, number>
  meses: Record<string, Record<string, number>>
  dh: number[]; dhL: number[]
  dia: Record<string, number>; diaL: Record<string, number>
  dest?: { d: string; l: number; c: number; min: number; n: number }[]
  desde: string | null; hasta: string | null
  sinCol?: number
}
interface Cuenta { cid: string; empresa: string; corte: string; ent: Dir | null; sal: Dir | null }
interface Meta {
  corte: string; desde: string; meses: string[]; cuentas: number
  entTotal: number; salTotal: number; entLost: number; salNoCon: number
  sinCol: number; tiposEnt: string[]; generado: string
}

let _cache: { meta: Meta; cuentas: Record<string, Cuenta> } | null = null
let _asesores: Record<string, { asesor: string; consecutivo: string; estado: string }> | null = null

async function datos() {
  if (_cache) return _cache
  const fs = (await import('fs')).default
  const p = path.join(process.cwd(), 'data', 'analisis-llamadas.json')
  if (!fs.existsSync(p)) throw new Error('data/analisis-llamadas.json no existe — correr scripts/gen-analisis-llamadas.py')
  _cache = JSON.parse(fs.readFileSync(p, 'utf8'))
  return _cache!
}

/** Asesor y consecutivo por CID. El archivo de llamadas no los trae. */
async function asesores() {
  if (_asesores) return _asesores
  const { supabaseAdmin } = await import('@/lib/supabase')
  const { data } = await supabaseAdmin.from('cuentas').select('cid, asesor, consecutivo, estado')
  const m: Record<string, { asesor: string; consecutivo: string; estado: string }> = {}
  for (const c of (data ?? []) as Array<{ cid: string | null; asesor: string | null; consecutivo: string; estado: string }>) {
    const k = String(c.cid ?? '').trim()
    if (k) m[k] = { asesor: c.asesor ?? '[sin asesor]', consecutivo: c.consecutivo, estado: c.estado }
  }
  _asesores = m
  return m
}

const vacio = (n: number) => Array(n).fill(0)

/** Suma las matrices y series de un conjunto de cuentas en una sola dirección. */
function agregar(cuentas: Cuenta[], dir: 'ent' | 'sal', mes: string) {
  const dh = vacio(168), dhL = vacio(168)
  const meses: Record<string, Record<string, number>> = {}
  const dia: Record<string, number> = {}, diaL: Record<string, number> = {}
  const dest: Record<string, { l: number; c: number; min: number; n: number }> = {}
  let total = 0, perdidas = 0, sinCol = 0
  let desde: string | null = null, hasta: string | null = null

  for (const c of cuentas) {
    const d = c[dir]
    if (!d) continue
    // El filtro por mes se aplica a las series con fecha. La matriz día×hora no
    // trae mes, así que cuando hay filtro se reconstruye desde la serie diaria:
    // preferible perder la hora a publicar una matriz de todo el periodo
    // rotulada como si fuera de un mes.
    for (const [m, v] of Object.entries(d.meses)) {
      if (mes && m !== mes) continue
      meses[m] = meses[m] ?? {}
      for (const [k, n] of Object.entries(v)) meses[m][k] = (meses[m][k] ?? 0) + n
    }
    for (const [f, n] of Object.entries(d.dia)) {
      if (mes && !f.startsWith(mes)) continue
      dia[f] = (dia[f] ?? 0) + n
      if (!desde || f < desde) desde = f
      if (!hasta || f > hasta) hasta = f
    }
    for (const [f, n] of Object.entries(d.diaL)) {
      if (mes && !f.startsWith(mes)) continue
      diaL[f] = (diaL[f] ?? 0) + n
    }
    if (!mes) {
      for (let i = 0; i < 168; i++) { dh[i] += d.dh[i] ?? 0; dhL[i] += d.dhL[i] ?? 0 }
      total += d.total
      perdidas += dir === 'ent'
        ? (d.tipos['Lost'] ?? 0)
        : (d.tipos['Lost'] ?? 0) + (d.tipos['Lost_by_agent'] ?? 0)
      sinCol += d.sinCol ?? 0
    }
    if (dir === 'ent' && d.dest) {
      for (const x of d.dest) {
        const e = dest[x.d] ?? { l: 0, c: 0, min: 0, n: 0 }
        e.l += x.l; e.c += x.c; e.min += x.min; e.n += x.n
        dest[x.d] = e
      }
    }
  }
  // Con filtro de mes los totales salen de la serie de meses, no de los tipos.
  if (mes) {
    total = meses[mes]?.['total'] ?? 0
    perdidas = dir === 'ent'
      ? (meses[mes]?.['Lost'] ?? 0)
      : (meses[mes]?.['Lost'] ?? 0) + (meses[mes]?.['Lost_by_agent'] ?? 0)
  }
  return { dh, dhL, meses, dia, diaL, dest, total, perdidas, sinCol, desde, hasta }
}

export async function GET(req: NextRequest) {
  try {
    const { meta, cuentas } = await datos()
    const mapa = await asesores()
    const p = req.nextUrl.searchParams
    const mode = p.get('mode') ?? 'datos'

    if (mode === 'filtros') {
      const lista = Object.values(cuentas).map(c => ({
        cid: c.cid, empresa: c.empresa, corte: c.corte,
        asesor: mapa[c.cid]?.asesor ?? '[fuera de cartera]',
        consecutivo: mapa[c.cid]?.consecutivo ?? '',
        ent: c.ent?.total ?? 0, sal: c.sal?.total ?? 0,
      })).sort((a, b) => a.empresa.localeCompare(b.empresa, 'es'))
      return NextResponse.json({
        meta, cuentas: lista,
        asesores: Array.from(new Set(lista.map(c => c.asesor))).sort(),
        meses: meta.meses,
      })
    }

    const dir = (p.get('dir') === 'sal' ? 'sal' : 'ent') as 'ent' | 'sal'
    const mes = p.get('mes') ?? ''
    const cid = p.get('cid') ?? ''
    const asesor = p.get('asesor') ?? ''

    let sel = Object.values(cuentas)
    if (cid)    sel = sel.filter(c => c.cid === cid)
    if (asesor) sel = sel.filter(c => (mapa[c.cid]?.asesor ?? '') === asesor)

    const a = agregar(sel, dir, mes)

    // Serie mensual con los desenlaces que suman el total del mes.
    const serie = meta.meses.map(m => {
      const v = a.meses[m] ?? {}
      const t = v['total'] ?? 0
      const perd = dir === 'ent' ? (v['Lost'] ?? 0) : (v['Lost'] ?? 0) + (v['Lost_by_agent'] ?? 0)
      return {
        mes: m, total: t,
        atendidas: dir === 'ent' ? (v['Redirected'] ?? 0) : (v['Redirected'] ?? 0),
        ivr: v['Self_service'] ?? 0,
        buzon: v['Voicemail'] ?? 0,
        perdidas: perd,
        pct: t > 0 ? (100 * perd) / t : null,
      }
    }).filter(x => x.total > 0 || !mes)

    /* Ranking de cuentas: solo tiene sentido sin filtro de una sola cuenta.
     *
     * Y exige BASE MÍNIMA. Sin ella, una cuenta con 1 llamada y 1 sin contestar
     * encabeza la lista con 100% y desplaza a la que perdió 3,000 de 10,000:
     * el ranking deja de medir atención y pasa a medir cuán poco volumen tiene
     * una cuenta. Las que no llegan al mínimo no se esconden — se cuentan
     * aparte y la pantalla dice cuántas quedaron fuera. */
    const BASE_MINIMA_RANKING = 100
    let bajoBase = 0
    const ranking = cid ? [] : sel.map(c => {
      const d = c[dir]
      if (!d) return null
      const v = mes ? (d.meses[mes] ?? null) : null
      const t = mes ? (v?.['total'] ?? 0) : d.total
      const perd = dir === 'ent'
        ? (mes ? (v?.['Lost'] ?? 0) : (d.tipos['Lost'] ?? 0))
        : (mes ? (v?.['Lost'] ?? 0) + (v?.['Lost_by_agent'] ?? 0)
               : (d.tipos['Lost'] ?? 0) + (d.tipos['Lost_by_agent'] ?? 0))
      if (t === 0) return null
      if (t < BASE_MINIMA_RANKING) { bajoBase++; return null }
      return {
        cid: c.cid, empresa: c.empresa, corte: c.corte,
        asesor: mapa[c.cid]?.asesor ?? '[fuera de cartera]',
        consecutivo: mapa[c.cid]?.consecutivo ?? '',
        total: t, perdidas: perd, pct: (100 * perd) / t,
      }
    }).filter(Boolean).sort((x, y) => (y!.pct - x!.pct))

    const dow = vacio(7), dowL = vacio(7), hora = vacio(24), horaL = vacio(24)
    for (let i = 0; i < 168; i++) {
      dow[Math.floor(i / 24)] += a.dh[i]; dowL[Math.floor(i / 24)] += a.dhL[i]
      hora[i % 24] += a.dh[i]; horaL[i % 24] += a.dhL[i]
    }

    const destinos = Object.entries(a.dest)
      .map(([d, x]) => ({ d, ...x }))
      .sort((x, y) => y.l - x.l).slice(0, 15)

    return NextResponse.json({
      meta,
      alcance: {
        cuentas: sel.length, dir, mes, cid, asesor,
        desde: a.desde, hasta: a.hasta,
        total: a.total, perdidas: a.perdidas, sinCol: a.sinCol,
        pct: a.total > 0 ? (100 * a.perdidas) / a.total : null,
        // La matriz no se puede filtrar por mes: se declara en vez de mentir.
        matrizDelPeriodoCompleto: !!mes,
      },
      serie, dh: a.dh, dhL: a.dhL, dow, dowL, hora, horaL,
      dia: Object.keys(a.dia).sort().map(f => ({ f, t: a.dia[f], l: a.diaL[f] ?? 0 })),
      destinos, ranking: ranking.slice(0, 60),
      rankingBajoBase: bajoBase, rankingBaseMinima: BASE_MINIMA_RANKING,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
