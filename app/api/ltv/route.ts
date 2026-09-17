/**
 * /api/ltv — la nueva fuente del apartado LTV.
 *
 * SUSTITUYE a /api/facturacion, que consultaba una vista de Zoho cuyos datos
 * dirección considera incorrectos. El origen ahora es el detalle del tablero
 * GRC: la cifra de «MRR inicio» del mes en el cruce con su renglón, que abre
 * el desglose cliente por cliente.
 *
 * Se lee de `data/ltv-zoho.json`, que produce scripts/gen-ltv-zoho.py con el
 * export semanal. No se consulta por API porque el token del proyecto no
 * alcanza —no puede listar las vistas del workspace— y Zoho no permite
 * exportar un dashboard de forma síncrona.
 *
 * ── LA REGLA QUE ESTE ENDPOINT NO PUEDE ROMPER ─────────────────────────────
 * El corte se toma con el mes EN CURSO. Las filas marcadas `provisional`
 * llegan como «Churn confirmado» pero su cuenta sigue activa o en riesgo en la
 * base: MRR Fin en cero y pérdida exactamente igual al MRR inicio es la firma
 * de un contrato que aún no se factura, no la de una baja. En septiembre 2026
 * son 61 cuentas y $546,811 — entre ellas una de 95 meses de antigüedad.
 *
 * Por eso la pérdida se publica SIEMPRE partida en dos: confirmada y
 * provisional. Sumarlas en una sola cifra convertiría el módulo en una alarma
 * falsa de medio millón de pesos.
 */
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export interface FilaLTV {
  cliente: string
  clasif: string | null
  facturas: number
  meses: number
  acumulado: number
  mrrIni: number
  mrrFin: number
  ganado: number
  movimiento: string | null
  perdidaReal: number
  perdidaFraude: number
  rango: string | null
  consecutivo: string | null
  asesor: string | null
  cid: string | null
  estadoBase: string | null
  enCartera: boolean
  provisional: boolean
}

interface MetaLTV {
  origen: string; mes: string | null; filas: number; clientes: number; enCartera: number
  mrrInicio: number; mrrFin: number; perdidaReal: number; perdidaFraude: number
  ganado: number; descuadre: number
  movimientos: Record<string, number>
  provisionales: number; provisionalMonto: number; advertencia: string
}

let _cache: { meta: MetaLTV; filas: FilaLTV[] } | null = null

async function datos() {
  if (_cache) return _cache
  const fs = (await import('fs')).default
  const p = path.join(process.cwd(), 'data', 'ltv-zoho.json')
  if (!fs.existsSync(p)) {
    throw new Error('Falta data/ltv-zoho.json — correr scripts/gen-ltv-zoho.py con el export del mes.')
  }
  _cache = JSON.parse(fs.readFileSync(p, 'utf8'))
  return _cache!
}

const suma = (f: FilaLTV[], k: keyof FilaLTV) =>
  f.reduce((s, x) => s + (typeof x[k] === 'number' ? (x[k] as number) : 0), 0)

export async function GET(req: NextRequest) {
  try {
    const { meta, filas } = await datos()
    const p = req.nextUrl.searchParams

    const clasif = p.get('clasif') ?? ''
    const mov = p.get('movimiento') ?? ''
    const rango = p.get('rango') ?? ''
    const asesor = p.get('asesor') ?? ''
    const soloCartera = p.get('cartera') === '1'
    const q = (p.get('q') ?? '').trim().toLowerCase()

    let sel = filas
    if (clasif) sel = sel.filter(f => f.clasif === clasif)
    if (mov) sel = sel.filter(f => f.movimiento === mov)
    if (rango) sel = sel.filter(f => f.rango === rango)
    if (asesor) sel = sel.filter(f => f.asesor === asesor)
    if (soloCartera) sel = sel.filter(f => f.enCartera)
    if (q) sel = sel.filter(f => f.cliente.toLowerCase().includes(q)
      || (f.cid ?? '').includes(q) || (f.consecutivo ?? '').toLowerCase().includes(q))

    /* La pérdida va partida SIEMPRE. `confirmada` es la de cuentas que de
     * verdad se fueron; `provisional` la de las que el corte marcó como baja
     * teniendo el mes a medias y siguen vivas en la base. Una sola cifra
     * juntando las dos es exactamente el error que este módulo viene a evitar. */
    const provis = sel.filter(f => f.provisional)
    const perdidaProvisional = suma(provis, 'perdidaReal')
    const perdidaConfirmada = suma(sel, 'perdidaReal') - perdidaProvisional

    const agrupar = (k: 'clasif' | 'movimiento' | 'rango' | 'asesor') => {
      const m = new Map<string, { n: number; acumulado: number; mrrIni: number; perdida: number }>()
      for (const f of sel) {
        const key = (f[k] as string | null) ?? '(sin dato)'
        const e = m.get(key) ?? { n: 0, acumulado: 0, mrrIni: 0, perdida: 0 }
        e.n++; e.acumulado += f.acumulado; e.mrrIni += f.mrrIni; e.perdida += f.perdidaReal
        m.set(key, e)
      }
      return Array.from(m.entries()).map(([k2, v]) => ({ clave: k2, ...v }))
        .sort((a, b) => b.acumulado - a.acumulado)
    }

    return NextResponse.json({
      meta,
      alcance: {
        filas: sel.length,
        clientes: new Set(sel.map(f => f.cliente.toLowerCase())).size,
        enCartera: sel.filter(f => f.enCartera).length,
        acumulado: suma(sel, 'acumulado'),
        mrrInicio: suma(sel, 'mrrIni'),
        mrrFin: suma(sel, 'mrrFin'),
        ganado: suma(sel, 'ganado'),
        perdidaConfirmada,
        perdidaProvisional,
        provisionales: provis.length,
        perdidaFraude: suma(sel, 'perdidaFraude'),
        filtros: { clasif, mov, rango, asesor, soloCartera, q },
      },
      porClasif: agrupar('clasif'),
      porMovimiento: agrupar('movimiento'),
      porRango: agrupar('rango'),
      porAsesor: agrupar('asesor').filter(x => x.clave !== '(sin dato)'),
      /* Top por ACUMULADO, que es la pregunta de LTV: quién ha dejado más
       * dinero en toda su vida, no quién paga más este mes. */
      top: [...sel].sort((a, b) => b.acumulado - a.acumulado).slice(0, 100),
      provisionales: [...provis].sort((a, b) => b.perdidaReal - a.perdidaReal),
      opciones: {
        clasif: Array.from(new Set(filas.map(f => f.clasif).filter(Boolean))).sort() as string[],
        movimiento: Array.from(new Set(filas.map(f => f.movimiento).filter(Boolean))).sort() as string[],
        rango: Array.from(new Set(filas.map(f => f.rango).filter(Boolean))).sort() as string[],
        asesor: Array.from(new Set(filas.map(f => f.asesor).filter(Boolean))).sort() as string[],
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
