import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  TICKETS, COBERTURA, CLIENTES, PRIORIDADES, ORDEN_PRIORIDAD,
  ABIERTOS_MEDIBLE, NOTA_SOLO_CERRADOS, CIDS_INTERNOS,
  resumenDuracion, topQueCierra, type Ticket,
} from '@/lib/tickets-norm'
import { esCuentaSinServicio } from '@/lib/types'

export const dynamic = 'force-dynamic'

/** Se mantiene exportada: `lib/cuenta-data.ts` y la pantalla la importan. */
export interface TicketRow extends Ticket {}

function normalize(s: string) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
}

/**
 * El filtro, en un solo lugar.
 *
 * Antes cada modo lo reimplementaba con variantes: `stats` filtraba el mes por
 * CIERRE mientras `desde`/`hasta` filtraban por APERTURA, así que «Agosto» y
 * «1–31 ago» devolvían conjuntos distintos sin avisar. Ahora los tres cortan
 * por el mismo eje —la apertura, anclada a hora de México— y el resultado de
 * una pestaña es el de la otra.
 */
interface Filtros {
  q: string; cidExact: string; producto: string; categoria: string
  subcategoria: string; esFalla: string; prioridad: string; mes: string
  desde: string; hasta: string; propietario: string; tipo: string
  canal: string; interno: string
}

function aplica(base: Ticket[], f: Filtros): Ticket[] {
  let r = base
  if (f.interno === 'excluir') r = r.filter(t => !t.interno)
  if (f.interno === 'solo')    r = r.filter(t => t.interno)
  if (f.cidExact)     r = r.filter(t => t.cid === f.cidExact)
  if (f.q) {
    const nq = normalize(f.q)
    r = r.filter(t => (normalize(t.empresaCanon) + ' ' + normalize(t.empresa) + ' ' + t.num + ' ' + t.ticket_id).includes(nq))
  }
  // Mes y rango: los dos por APERTURA en hora de México.
  if (f.mes)          r = r.filter(t => t.mesApertura === f.mes)
  if (f.desde)        r = r.filter(t => t.diaMx >= f.desde)
  if (f.hasta)        r = r.filter(t => t.diaMx <= f.hasta)
  if (f.propietario)  r = r.filter(t => t.propietarioNorm.toLowerCase() === f.propietario.toLowerCase())
  if (f.producto)     r = r.filter(t => t.producto.toLowerCase().includes(f.producto.toLowerCase()))
  if (f.prioridad)    r = r.filter(t => t.prioridadNorm === f.prioridad)
  if (f.tipo)         r = r.filter(t => t.tipo === f.tipo)
  if (f.canal)        r = r.filter(t => t.canal === f.canal)
  if (f.esFalla)      r = r.filter(t => (f.esFalla === 'Si' ? t.esFallaBandera : !t.esFallaBandera))
  if (f.categoria)    r = r.filter(t => t.categoriaNorm.toLowerCase().includes(f.categoria.toLowerCase()))
  if (f.subcategoria) r = r.filter(t => t.subcategoriaNorm.toLowerCase().includes(f.subcategoria.toLowerCase()))
  return r
}

/** El encabezado honesto que acompaña a CUALQUIER respuesta del módulo. */
const META = {
  cobertura: COBERTURA,
  abiertosMedible: ABIERTOS_MEDIBLE,
  notaSoloCerrados: NOTA_SOLO_CERRADOS,
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const f: Filtros = {
    q:            sp.get('q')?.toLowerCase() ?? '',
    cidExact:     sp.get('cid') ?? '',
    producto:     sp.get('producto') ?? '',
    categoria:    sp.get('categoria') ?? '',
    subcategoria: sp.get('subcategoria') ?? '',
    esFalla:      sp.get('es_falla') ?? '',
    prioridad:    sp.get('prioridad') ?? '',
    mes:          sp.get('mes') ?? '',
    desde:        sp.get('desde') ?? '',   // AAAA-MM-DD, día de apertura en México
    hasta:        sp.get('hasta') ?? '',
    propietario:  sp.get('propietario') ?? '',
    tipo:         sp.get('tipo') ?? '',
    canal:        sp.get('canal') ?? '',
    interno:      sp.get('interno') ?? '',  // '' | 'excluir' | 'solo'
  }
  const sortBy  = sp.get('sortBy') ?? ''
  const sortDir = sp.get('sortDir') ?? 'asc'
  const page    = parseInt(sp.get('page') ?? '1')
  const limit   = parseInt(sp.get('limit') ?? '50')
  const mode    = sp.get('mode') ?? 'list'

  /* ── Meses ────────────────────────────────────────────────────────
     Por APERTURA: es el mes en que ENTRÓ el problema. El campo `fecha`
     del export es el mes de CIERRE, y 851 tickets caen en uno distinto
     del que entraron. Se devuelven los dos ejes, rotulados. */
  if (mode === 'meses') {
    return NextResponse.json({
      meses:        COBERTURA.mesesApertura,
      mesesCierre:  COBERTURA.mesesCierre,
      eje:          'apertura',
      ...META,
    })
  }

  /* ── Propietarios ─────────────────────────────────────────────────
     Fundidos: eran 37 cadenas para 19 personas y una cola, así que
     filtrar por «Mario H.» perdía los 6 de «Mario Hernández». */
  if (mode === 'propietarios') {
    const m = new Map<string, { n: number; cola: boolean }>()
    for (const t of TICKETS) {
      if (!t.propietarioNorm) continue
      const e = m.get(t.propietarioNorm) ?? { n: 0, cola: t.propietarioEsCola }
      e.n++
      m.set(t.propietarioNorm, e)
    }
    const propietarios = Array.from(m.entries())
      .map(([nombre, e]) => ({ nombre, total: e.n, esCola: e.cola }))
      .sort((a, b) => b.total - a.total)
    return NextResponse.json({
      propietarios,
      nombres: propietarios.map(p => p.nombre),   // compat
      sinPropietario: TICKETS.filter(t => !t.propietarioNorm).length,
      ...META,
    })
  }

  /* ── Clientes ─────────────────────────────────────────────────────
     UNA fila por CID, porque el filtro compara SOLO el CID. Antes la
     clave era `cid|empresa` y el renglón prometía un número que el
     filtro no entregaba: «Digitum · CID 1 (63)» devolvía 175 filas. */
  if (mode === 'clientes') {
    return NextResponse.json({ clientes: CLIENTES, ...META })
  }

  /* ── Subcategorías ────────────────────────────────────────────────
     Canónicas: 'Sin subcategoria' ya no aparece como si fuera una
     subcategoría real que se puede filtrar. */
  if (mode === 'subcategorias') {
    const base = f.categoria
      ? TICKETS.filter(t => t.categoriaNorm.toLowerCase().includes(f.categoria.toLowerCase()))
      : TICKETS
    const set = new Set<string>()
    for (const t of base) {
      if (t.subcategoriaNorm && t.subcategoriaNorm !== 'Sin subcategoría') set.add(t.subcategoriaNorm)
    }
    return NextResponse.json({ subcategorias: Array.from(set).sort(), ...META })
  }

  /* ── Stats (Overview) ─────────────────────────────────────────────── */
  if (mode === 'stats') {
    const base = aplica(TICKETS, { ...f, q: '', cidExact: '' })

    const byMes:   Record<string, number> = {}
    const byMesCierre: Record<string, number> = {}
    const byCat:   Record<string, number> = {}
    const byTipo:  Record<string, number> = {}
    const byCanal: Record<string, number> = {}
    const byProd:  Record<string, number> = {}
    const byPrior: Record<string, number> = {}
    const byProp:  Record<string, number> = {}
    let fallasBandera = 0
    let fallasCategoria = 0

    // Por CID, no por cadena de empresa: el mismo cliente ya no sale partido.
    const cidMap = new Map<string, { total: number; fallas: number; ultima: string }>()

    for (const t of base) {
      if (t.mesApertura) byMes[t.mesApertura] = (byMes[t.mesApertura] || 0) + 1
      if (t.mesCierre)   byMesCierre[t.mesCierre] = (byMesCierre[t.mesCierre] || 0) + 1
      byCat[t.categoriaNorm]  = (byCat[t.categoriaNorm]  || 0) + 1
      byTipo[t.tipo]          = (byTipo[t.tipo]          || 0) + 1
      byCanal[t.canal]        = (byCanal[t.canal]        || 0) + 1
      byProd[t.producto]      = (byProd[t.producto]      || 0) + 1
      byPrior[t.prioridadNorm] = (byPrior[t.prioridadNorm] || 0) + 1
      const p = t.propietarioNorm || 'Sin propietario'
      byProp[p] = (byProp[p] || 0) + 1
      if (t.esFallaBandera)   fallasBandera++
      if (t.esFallaCategoria) fallasCategoria++

      const cid = t.cid || '(sin cid)'
      const e = cidMap.get(cid) ?? { total: 0, fallas: 0, ultima: '' }
      e.total++
      if (t.esFallaBandera) e.fallas++
      if (t.aperturaMx > e.ultima) e.ultima = t.aperturaMx
      cidMap.set(cid, e)
    }

    const empresas = Array.from(cidMap.entries()).map(([cid, d]) => ({
      cid,
      nombre:  CIDS_INTERNOS[cid] ?? (CLIENTES.find(c => c.cid === cid)?.empresa ?? `CID ${cid}`),
      interno: Boolean(CIDS_INTERNOS[cid]),
      total:   d.total,
      fallas:  d.fallas,
      ultima:  d.ultima,   // fecha real del último ticket, no el mes de cierre
    }))

    // El top CIERRA: top + otros = universo. Un top-20 mudo tiraba el 82.8%.
    const cierre = topQueCierra(empresas, 20)

    return NextResponse.json({
      total: base.length,
      fallas: fallasBandera,            // compat: el KPI histórico
      fallasBandera, fallasCategoria,
      byMes, byMesCierre, byCat, byTipo, byCanal, byProd, byPrior, byProp,
      topEmpresas: cierre.top,
      otrasEmpresas: cierre.otros,
      empresasTotales: cierre.gruposTotales,
      internos: base.filter(t => t.interno).length,
      ...META,
    })
  }

  /* ── Charts ───────────────────────────────────────────────────────── */
  if (mode === 'charts') {
    const base = aplica(TICKETS, f)

    const total = base.length
    const dur = resumenDuracion(base)

    const propMap:  Record<string, { tickets: number; fallas: number; durSum: number; durN: number; durs: number[] }> = {}
    const mesMap:   Record<string, { tickets: number; fallas: number }> = {}
    const mesCMap:  Record<string, number> = {}
    const prodMap:  Record<string, number> = {}
    const priorMap: Record<string, number> = {}
    const catMap:   Record<string, number> = {}
    const tipoMap:  Record<string, number> = {}
    const durBuckets: Record<string, number> = { '< 1h': 0, '1–4h': 0, '4–8h': 0, '8–24h': 0, '1–3d': 0, '3–7d': 0, '+7d': 0 }
    let sinDuracion = 0

    for (const t of base) {
      // 'Sin propietario' en AMBAS pestañas: antes Overview los descartaba en
      // silencio (5,845) y Gráficos los recogía (5,871).
      const pr = t.propietarioNorm || 'Sin propietario'
      if (!propMap[pr]) propMap[pr] = { tickets: 0, fallas: 0, durSum: 0, durN: 0, durs: [] }
      propMap[pr].tickets++
      if (t.esFallaBandera) propMap[pr].fallas++
      if (typeof t.duracion_hrs === 'number') {
        propMap[pr].durSum += t.duracion_hrs
        propMap[pr].durN++
        propMap[pr].durs.push(t.duracion_hrs)
      }

      const m = t.mesApertura
      if (m) {
        if (!mesMap[m]) mesMap[m] = { tickets: 0, fallas: 0 }
        mesMap[m].tickets++
        if (t.esFallaBandera) mesMap[m].fallas++
      }
      if (t.mesCierre) mesCMap[t.mesCierre] = (mesCMap[t.mesCierre] || 0) + 1

      prodMap[t.producto || 'Sin producto'] = (prodMap[t.producto || 'Sin producto'] || 0) + 1
      priorMap[t.prioridadNorm] = (priorMap[t.prioridadNorm] || 0) + 1
      catMap[t.categoriaNorm]   = (catMap[t.categoriaNorm]   || 0) + 1
      tipoMap[t.tipo]           = (tipoMap[t.tipo]           || 0) + 1

      // Los tickets SIN duración ya no caen en «< 1h» por un `?? 0`.
      if (typeof t.duracion_hrs !== 'number') { sinDuracion++; continue }
      const h = t.duracion_hrs
      if (h < 1)        durBuckets['< 1h']++
      else if (h < 4)   durBuckets['1–4h']++
      else if (h < 8)   durBuckets['4–8h']++
      else if (h < 24)  durBuckets['8–24h']++
      else if (h < 72)  durBuckets['1–3d']++
      else if (h < 168) durBuckets['3–7d']++
      else              durBuckets['+7d']++
    }

    const mediana = (xs: number[]) => {
      if (xs.length === 0) return 0
      const s = xs.slice().sort((a, b) => a - b)
      return Math.round(s[Math.floor(s.length / 2)] * 10) / 10
    }

    const byPropietario = Object.entries(propMap)
      .map(([name, d]) => ({
        name, tickets: d.tickets, fallas: d.fallas,
        // La MEDIANA manda: con la media, un solo folio olvidado convierte al
        // agente más rápido en el más lento de la mesa.
        medianaDuracion: mediana(d.durs),
        avgDuracion: d.durN > 0 ? Math.round(d.durSum / d.durN * 10) / 10 : 0,
        sinDuracion: d.tickets - d.durN,
      }))
      .sort((a, b) => b.tickets - a.tickets)

    const ordPrio = (n: string) => ORDEN_PRIORIDAD[n] ?? 99

    return NextResponse.json({
      total,
      fallas: base.filter(t => t.esFallaBandera).length,
      fallasCategoria: base.filter(t => t.esFallaCategoria).length,
      // Se conserva `avgDuracion` por compatibilidad, pero la pantalla debe
      // enseñar la mediana: media 144.9 h contra mediana 29.2 h.
      avgDuracion: dur.media,
      duracion: dur,
      sinDuracion,
      topPropietario: byPropietario[0]?.name ?? '—',
      byPropietario,
      byMes: Object.entries(mesMap).sort().map(([m, d]) => ({ mes: m, ...d })),
      byMesCierre: Object.entries(mesCMap).sort().map(([m, v]) => ({ mes: m, tickets: v })),
      byProducto: Object.entries(prodMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byPrioridad: Object.entries(priorMap).map(([name, value]) => ({ name, value }))
        .sort((a, b) => ordPrio(a.name) - ordPrio(b.name)),
      byCat:  Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byTipo: Object.entries(tipoMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      byDuracion: Object.entries(durBuckets).map(([bucket, count]) => ({ bucket, count })),
      prioridades: PRIORIDADES,
      ...META,
    })
  }

  /* ── Conciliación ─────────────────────────────────────────────────
     Dos arreglos: se cuentan CIDs (no pares `cid|empresa`, que premiaban
     el dato sucio: «GRUPO FRISA» y «Grupo Frisa» sumaban dos empresas),
     y una cuenta en hibernación deja de pintarse como activa — no tiene
     servicio, y lib/types.ts manda pintarla inactiva. */
  if (mode === 'conciliacion') {
    const { data: cuentas } = await supabaseAdmin
      .from('cuentas')
      .select('id, cid, empresa, asesor, estado, health_score')

    type CuentaMin = {
      id: string; cid: string | null; empresa: string; asesor: string
      estado: string; health_score: number; sinServicio: boolean
    } | null

    const mapCid = new Map<string, CuentaMin>()
    const mapNombre = new Map<string, CuentaMin>()
    let cancelados = 0
    let sinServicio = 0
    for (const c of (cuentas ?? [])) {
      if (c.estado === 'cancelado') { cancelados++; continue }
      const ss = esCuentaSinServicio(c.estado)
      if (ss) sinServicio++
      const m: CuentaMin = { ...c, sinServicio: ss } as CuentaMin
      if (c.cid) mapCid.set(String(c.cid).trim(), m)
      mapNombre.set(normalize(c.empresa), m)
    }

    const porCid = new Map<string, {
      cid: string; empresa: string; alias: string[]; total: number; fallas: number
      ultima: string; interno: boolean; cuenta: CuentaMin
    }>()

    for (const t of TICKETS) {
      const cid = (t.cid ?? '').trim()
      const key = cid || `nombre:${normalize(t.empresa)}`
      if (!porCid.has(key)) {
        const cuenta = (mapCid.get(cid) ?? mapNombre.get(normalize(t.empresaCanon)) ?? null)
        const cli = CLIENTES.find(c => c.cid === cid)
        porCid.set(key, {
          cid, empresa: t.empresaCanon || t.empresa, alias: cli?.alias ?? [],
          total: 0, fallas: 0, ultima: '', interno: t.interno, cuenta,
        })
      }
      const e = porCid.get(key)!
      e.total++
      if (t.esFallaBandera) e.fallas++
      if (t.aperturaMx > e.ultima) e.ultima = t.aperturaMx
    }

    const rows = Array.from(porCid.values()).sort((a, b) => b.total - a.total)
    const matched = rows.filter(r => r.cuenta)
    const unmatched = rows.filter(r => !r.cuenta)

    return NextResponse.json({
      matched, unmatched,
      // Se cuenta lo que de verdad hay: CIDs distintos, no pares.
      totalEmpresas:  rows.length,
      cidsDistintos:  COBERTURA.cidsDistintos,
      ticketsCruzados:   matched.reduce((s, r) => s + r.total, 0),
      ticketsSinCruzar:  unmatched.reduce((s, r) => s + r.total, 0),
      cuentasCartera:    (cuentas ?? []).length,
      cuentasCanceladas: cancelados,
      cuentasSinServicio: sinServicio,
      internos: rows.filter(r => r.interno).reduce((s, r) => s + r.total, 0),
      ...META,
    })
  }

  /* ── List (default) ───────────────────────────────────────────────── */
  const filtered = aplica(TICKETS, f)

  if (sortBy) {
    filtered.sort((a, b) => {
      let av: string | number = ''
      let bv: string | number = ''
      if (sortBy === 'empresa')           { av = a.empresaCanon;     bv = b.empresaCanon }
      else if (sortBy === 'categoria')    { av = a.categoriaNorm;    bv = b.categoriaNorm }
      else if (sortBy === 'subcategoria') { av = a.subcategoriaNorm; bv = b.subcategoriaNorm }
      else if (sortBy === 'producto')     { av = a.producto;         bv = b.producto }
      else if (sortBy === 'prioridad')    {
        av = ORDEN_PRIORIDAD[a.prioridadNorm] ?? 99
        bv = ORDEN_PRIORIDAD[b.prioridadNorm] ?? 99
      }
      else if (sortBy === 'falla')        { av = a.es_falla;         bv = b.es_falla }
      else if (sortBy === 'propietario')  { av = a.propietarioNorm;  bv = b.propietarioNorm }
      // La columna MUESTRA la apertura: ahora también ORDENA por ella. Antes
      // ordenaba por `fecha` (mes de cierre) y las filas no quedaban en el
      // orden de la fecha que el asesor estaba leyendo.
      else if (sortBy === 'fecha')        { av = a.aperturaMx;       bv = b.aperturaMx }
      else if (sortBy === 'duracion')     { av = a.duracion_hrs ?? -1; bv = b.duracion_hrs ?? -1 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }

  const total = filtered.length
  const rows  = filtered.slice((page - 1) * limit, page * limit)
  return NextResponse.json({ rows, total, page, pages: Math.ceil(total / limit), ...META })
}
