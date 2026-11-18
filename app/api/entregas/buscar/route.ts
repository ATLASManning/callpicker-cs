import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cargaHoja, normBusqueda } from '@/lib/hoja-activaciones'
import {
  clasifica, CAMPOS_CLASIFICACION,
  type Clasificacion, type FichaParaClasificar,
} from '@/lib/clasificacion-entrega'

export const dynamic = 'force-dynamic'

/**
 * BUSCAR ENTRE **TODAS** LAS ACTIVACIONES, Y DECIR SI SON CUENTA O CLIENTE
 * ========================================================================
 *
 *     GET /api/entregas/buscar?q=medicall
 *     GET /api/entregas/buscar?q=162474
 *     GET /api/entregas/buscar?distintivo=cuenta        (las primeras N)
 *
 * POR QUÉ EXISTE
 * --------------
 * La pantalla mandaba al navegador sólo las activaciones del año vivo —373 de
 * 2,820— para no cargar el HTML con la lista entera. El efecto era que **buscar
 * por nombre sólo encontraba las de 2026**: una activación de 2023 existía y no
 * aparecía, que es la forma más silenciosa de perder un dato.
 *
 * La búsqueda se hace aquí, contra las 2,820, y sólo viajan los resultados.
 *
 * ── EL DISTINTIVO ────────────────────────────────────────────────────────────
 *
 * Cada resultado trae **Cuenta** o **Cliente**, con la regla de dirección del
 * 18 nov 2026: si falta información es Cuenta; si la ficha del apartado Cuentas
 * está completa, es Cliente. La regla —y por qué «completa» no la decido yo—
 * vive en `lib/clasificacion-entrega.ts`.
 *
 * ── LO QUE NO SE CALLA ───────────────────────────────────────────────────────
 *
 * - Si hay más coincidencias que el tope, se dice cuántas. Una lista recortada
 *   que no se declara se lee como «no hay más».
 * - Si el apartado Cuentas no se pudo leer, el distintivo sale `no_medido`,
 *   **no «Cuenta»**: una falla de la base no es un juicio sobre el trabajo de
 *   nadie.
 */

const TOPE = 40

interface Resultado {
  id:      string
  cliente: string
  ano:     string
  tipo:    string
  clasificacion: Clasificacion
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q  = normBusqueda(sp.get('q') ?? '')
    const soloDistintivo = (sp.get('distintivo') ?? '').trim()

    const hoja = await cargaHoja()
    if (!hoja) {
      return NextResponse.json(
        { error: 'No se pudo leer data/activaciones.xlsx' }, { status: 404 })
    }

    /* ── 1 · Buscar en la hoja entera ─────────────────────────────────────── */
    const todas = Array.from(hoja.filas.values())
    const coinciden = !q
      ? todas
      : todas.filter(f =>
          f['id'].includes(q) || normBusqueda(f['cliente']).includes(q))

    /* Un ID exacto va primero: quien teclea 162474 busca ésa, no las 30 que
       lo contienen. Después, por año descendente —lo que se está cerrando es
       lo que se consulta— y por nombre. */
    coinciden.sort((a, b) => {
      const ea = a['id'] === q ? 0 : 1
      const eb = b['id'] === q ? 0 : 1
      if (ea !== eb) return ea - eb
      const aa = a['ano'] || '', ab = b['ano'] || ''
      if (aa !== ab) return ab.localeCompare(aa)
      return a['cliente'].localeCompare(b['cliente'], 'es')
    })

    const recorte = coinciden.slice(0, TOPE)

    /* ── 2 · El distintivo de cada uno ────────────────────────────────────── */
    const cids = recorte.map(f => f['id']).filter(Boolean)
    let fichas: Map<string, FichaParaClasificar> | null = new Map()
    let cuentasError: string | null = null

    if (cids.length) {
      const { data, error } = await supabaseAdmin
        .from('cuentas')
        .select(CAMPOS_CLASIFICACION)
        .in('cid', cids)
      if (error) {
        /* `null` sería «ninguna está en cartera», que es una afirmación.
           Aquí no se sabe, y eso viaja como `undefined` a `clasifica`. */
        fichas = null
        cuentasError = error.message
      } else {
        for (const c of (data ?? []) as FichaParaClasificar[]) {
          const k = String(c.cid ?? '').trim()
          if (k) fichas!.set(k, c)
        }
      }
    }

    let resultados: Resultado[] = recorte.map(f => ({
      id:      f['id'],
      cliente: f['cliente'],
      ano:     f['ano'] || '',
      tipo:    f['tipo'] || '',
      clasificacion: clasifica(
        fichas === null ? undefined : (fichas.get(f['id']) ?? null)),
    }))

    if (soloDistintivo === 'cliente' || soloDistintivo === 'cuenta') {
      resultados = resultados.filter(r => r.clasificacion.distintivo === soloDistintivo)
    }

    return NextResponse.json({
      resultados,
      /* Las tres cifras se dicen por separado: cuántas hay en la hoja, cuántas
         coinciden y cuántas viajan. Con una sola, un recorte parece un total. */
      totalEnLaHoja:   todas.length,
      coincidencias:   coinciden.length,
      devueltos:       resultados.length,
      recortado:       coinciden.length > TOPE,
      cuentasError,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
