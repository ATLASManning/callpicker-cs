/**
 * /api/grc — Gross Revenue Churn.
 *
 * SUSTITUYE AL MÓDULO LTV. Dirección: la fuente que alimentaba LTV traía datos
 * incorrectos, y lo que debe vivir en Facturación es lo que presenta el tablero
 * «DASHBOARD GROSS REVENUE CHURN (%) - 2025 Y 2026».
 *
 * Lee `data/grc-zoho.json`, que produce scripts/gen-grc-zoho.py con el export
 * semanal. No se consulta por API: el token del proyecto no puede listar las
 * vistas del workspace (INVALID_OAUTHSCOPE) ni exportar un dashboard de forma
 * síncrona (SYNC_EXPORT_NOT_ALLOWED).
 *
 * ── LO QUE ESTE ENDPOINT NO PUEDE HACER NUNCA ──────────────────────────────
 * Publicar una sola cifra de pérdida. El corte se toma con el mes en curso y
 * Zoho marca «Churn confirmado» a todo contrato que aún no se factura. De esas
 * cuentas, solo las que están en la cartera se pueden cotejar contra la base —y
 * 61 de 64 siguen vivas—. Las otras 1,021 traen la misma firma y no hay contra
 * qué verificarlas.
 *
 * Por eso siempre van tres canastas: `churnBaja` (verificada), `churnViva`
 * (desmentida) y `churnSinVerificar` (ausencia de medición, que no es cero).
 * Juntarlas da 35.6% contra un promedio histórico de 2.1%: media hora de alarma
 * y una decisión equivocada.
 *
 * `/api/facturacion` NO se sustituye: lo siguen usando Churn, Cuentas Dormidas,
 * la ficha de cuenta y la generación de actividades con ?mode=dormidos.
 */
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export interface FilaGRC {
  cliente: string
  clasif: string | null
  facturas: number
  meses: number
  acumulado: number
  mrrIni: number
  mrrFin: number
  ganado: number
  movimiento: string | null
  perdida: number
  fraude: number
  rango: string | null
  consecutivo: string | null
  asesor: string | null
  cid: string | null
  estadoBase: string | null
  enCartera: boolean
  firma: boolean
  /** 'baja' verificada · 'sigue_viva' desmentida · 'sin_verificar' · 'na' */
  verificacion: 'baja' | 'sigue_viva' | 'sin_verificar' | 'na'
}

interface MesGRC {
  mes: string; cerrado: boolean; origen: string
  mrrInicio: number; mrrFin: number | null
  churn: number; downgrade: number; perdida: number; perdidaGlobal: number | null
  fraude: number | null; ganado: number | null
  churnBaja: number; churnViva: number; churnSinVerificar: number
  cuentasBaja: number | null; cuentasViva: number; cuentasSinVerificar: number
  grcMensual: number; grcSinDesmentidas: number; grcVerificado: number
  grcAcumulado: number; grcAcumSinDesmentidas: number; grcAcumVerificado: number
}

interface GrupoGRC {
  clave: string; n: number; mrrInicio: number; ganado: number; acumulado: number
  churn: number; downgrade: number; perdida: number
  churnBaja: number; churnViva: number; churnSinVerificar: number
  grc: number; grcVerificado: number
  objetivo?: number | null; montoMaximo?: number | null
  objetivoVsReal?: number | null; cumple?: boolean | null
  cumpleSiTodoFueraReal?: boolean
}

interface Archivo {
  meta: Record<string, unknown>
  serie: MesGRC[]
  detallePerdida: { mes: string; filas: { movimiento: string; perdida: number; fraude: number }[] }[]
  reactivaciones: { mes: string; monto: number }[]
  porRango: GrupoGRC[]
  porClasif: GrupoGRC[]
  porMovimiento: GrupoGRC[]
  porAsesor: GrupoGRC[]
  filas: FilaGRC[]
}

let _cache: Archivo | null = null

async function datos(): Promise<Archivo> {
  if (_cache) return _cache
  const fs = (await import('fs')).default
  const p = path.join(process.cwd(), 'data', 'grc-zoho.json')
  if (!fs.existsSync(p)) {
    throw new Error('Falta data/grc-zoho.json — correr scripts/gen-grc-zoho.py con el export del mes.')
  }
  _cache = JSON.parse(fs.readFileSync(p, 'utf8')) as Archivo
  return _cache!
}

const suma = (f: FilaGRC[], k: 'perdida' | 'mrrIni' | 'mrrFin' | 'ganado' | 'acumulado' | 'fraude') =>
  f.reduce((s, x) => s + (x[k] || 0), 0)

const pct = (a: number, b: number) => (b ? Math.round((1000 * a) / b) / 10 : 0)

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Consulta de UNA cuenta, para la ficha: `?cid=134571`.
 *
 * Dirección: en la ficha, «Factura Mensual» toma «MRR Inicio Contrato (BCY)» y
 * «MRR» toma «Importe Acumulado Recurrente».
 *
 * ── POR QUÉ SE CRUZA POR CID Y NO POR NOMBRE ───────────────────────────────
 * Trece cuentas de la cartera tienen en el export una línea adicional de otro
 * servicio —«Gas Economico Metropolitano Chat», por ejemplo— que llega SIN CID
 * porque no existe como cuenta propia. Sumarlas por prefijo de nombre inflaría
 * la factura de esas trece en $56,464 y repetiría el error que ya se cometió
 * antes con GRUPO TORRES CORZO.
 *
 * Así que la cifra sale de las filas que casan por CID, y las líneas hermanas
 * se devuelven APARTE, con su nombre y su monto, para que la ficha las muestre
 * sin sumarlas. El servicio lo dicta la factura, no el parecido del nombre.
 */
function porCuenta(d: Archivo, cid: string, nombre: string) {
  const propias = d.filas.filter(f => f.cid && f.cid === cid)
  const base = propias.length ? norm(propias[0].cliente) : norm(nombre)
  const hermanas = base
    ? d.filas.filter(f => !f.cid && norm(f.cliente).startsWith(base) && norm(f.cliente) !== base)
    : []
  return {
    encontrado: propias.length > 0,
    mes: (d.meta as { mesVivo?: string }).mesVivo ?? null,
    origen: (d.meta as { origen?: string }).origen ?? null,
    /* Factura Mensual ← MRR Inicio Contrato (BCY) */
    facturaMensual: suma(propias, 'mrrIni'),
    /* MRR ← Importe Acumulado Recurrente */
    acumuladoRecurrente: suma(propias, 'acumulado'),
    mrrFin: suma(propias, 'mrrFin'),
    perdida: suma(propias, 'perdida'),
    ganado: suma(propias, 'ganado'),
    movimiento: propias.length === 1 ? propias[0].movimiento : null,
    verificacion: propias.length === 1 ? propias[0].verificacion : null,
    clasif: propias.length ? propias[0].clasif : null,
    meses: propias.length ? Math.max(...propias.map(f => f.meses)) : null,
    facturas: propias.length ? Math.max(...propias.map(f => f.facturas)) : null,
    rango: propias.length === 1 ? propias[0].rango : null,
    filas: propias.length,
    hermanas: hermanas.map(f => ({
      cliente: f.cliente, mrrIni: f.mrrIni, acumulado: f.acumulado, movimiento: f.movimiento,
    })),
  }
}

export async function GET(req: NextRequest) {
  try {
    const d = await datos()
    const p = req.nextUrl.searchParams

    const cid = (p.get('cid') ?? '').trim()
    if (cid || p.get('mode') === 'cuenta') {
      return NextResponse.json(porCuenta(d, cid, (p.get('nombre') ?? '').trim()))
    }

    const clasif = p.get('clasif') ?? ''
    const mov = p.get('movimiento') ?? ''
    const rango = p.get('rango') ?? ''
    const asesor = p.get('asesor') ?? ''
    const verif = p.get('verificacion') ?? ''
    const soloCartera = p.get('cartera') === '1'
    const q = (p.get('q') ?? '').trim().toLowerCase()

    let sel = d.filas
    if (clasif) sel = sel.filter(f => f.clasif === clasif)
    if (mov) sel = sel.filter(f => f.movimiento === mov)
    if (rango) sel = sel.filter(f => f.rango === rango)
    if (asesor) sel = sel.filter(f => f.asesor === asesor)
    if (verif) sel = sel.filter(f => f.verificacion === verif)
    if (soloCartera) sel = sel.filter(f => f.enCartera)
    if (q) {
      sel = sel.filter(f => f.cliente.toLowerCase().includes(q)
        || (f.cid ?? '').includes(q)
        || (f.consecutivo ?? '').toLowerCase().includes(q))
    }

    const esChurn = (f: FilaGRC) => (f.movimiento ?? '').startsWith('Churn')
    const esDown = (f: FilaGRC) => (f.movimiento ?? '').startsWith('Downgrade')
    const dePila = (v: FilaGRC['verificacion']) => sel.filter(f => esChurn(f) && f.verificacion === v)

    const churnBaja = suma(dePila('baja'), 'perdida')
    const churnViva = suma(dePila('sigue_viva'), 'perdida')
    const churnSinVerificar = suma(dePila('sin_verificar'), 'perdida')
    const downgrade = suma(sel.filter(esDown), 'perdida')
    const mrrInicio = suma(sel, 'mrrIni')
    const perdida = churnBaja + churnViva + churnSinVerificar + downgrade

    /* El GRC es pérdida sobre el MRR del MES. Con un filtro puesto el
     * denominador se encoge y el cociente deja de ser un GRC: filtrando a un
     * solo movimiento llega a dar 100%. Cuando hay filtro se devuelve null y la
     * pantalla pinta «—», que es lo honesto: no se puede calcular, no es cero. */
    const hayFiltro = !!(clasif || mov || rango || asesor || verif || soloCartera || q)
    const grc = (n: number) => (hayFiltro ? null : pct(n, mrrInicio))

    /* El detalle va COMPLETO: las 3,574 filas del export, no un top-N. Este es
     * el dato que dirección compartió y el que el tablero de Zoho no deja ver
     * cruzado con asesor y CID; recortarlo aquí sería devolver otra vez un
     * resumen. La pantalla pagina y ofrece descarga, pero el servidor no
     * esconde filas. */
    const ordenado = [...sel].sort((a, b) => (b.perdida - a.perdida) || (b.acumulado - a.acumulado))

    return NextResponse.json({
      meta: d.meta,
      serie: d.serie,
      detallePerdida: d.detallePerdida,
      reactivaciones: d.reactivaciones,
      alcance: {
        filas: sel.length,
        clientes: new Set(sel.map(f => f.cliente.toLowerCase())).size,
        enCartera: sel.filter(f => f.enCartera).length,
        mrrInicio,
        mrrFin: suma(sel, 'mrrFin'),
        ganado: suma(sel, 'ganado'),
        acumulado: suma(sel, 'acumulado'),
        fraude: suma(sel, 'fraude'),
        downgrade,
        churnBaja, churnViva, churnSinVerificar,
        perdida,
        cuentasBaja: dePila('baja').length,
        cuentasViva: dePila('sigue_viva').length,
        cuentasSinVerificar: dePila('sin_verificar').length,
        grcMensual: grc(perdida),
        grcSinDesmentidas: grc(perdida - churnViva),
        grcVerificado: grc(churnBaja + downgrade),
        hayFiltro,
        filtros: { clasif, mov, rango, asesor, verif, soloCartera, q },
      },
      /* Los cortes NO se recalculan con el filtro: son la foto del mes completo.
       * Recalcularlos haría que «por rango» cambiara al filtrar por rango, que
       * es justo lo que vuelve ilegible una tabla de cortes. */
      porRango: d.porRango,
      porClasif: d.porClasif,
      porMovimiento: d.porMovimiento,
      porAsesor: d.porAsesor,
      /* Detalle: el que más pesa primero. Es la pregunta operativa —a quién hay
       * que llamar— y por eso ordena por pérdida, no por acumulado. Lo que
       * va completo: la pantalla pagina, el servidor no recorta. */
      detalle: ordenado,
      desmentidas: sel.filter(f => f.verificacion === 'sigue_viva')
        .sort((a, b) => b.perdida - a.perdida),
      opciones: {
        clasif: Array.from(new Set(d.filas.map(f => f.clasif).filter(Boolean))).sort() as string[],
        movimiento: Array.from(new Set(d.filas.map(f => f.movimiento).filter(Boolean))).sort() as string[],
        rango: d.porRango.map(r => r.clave),
        asesor: Array.from(new Set(d.filas.map(f => f.asesor).filter(Boolean))).sort() as string[],
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
