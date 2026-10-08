import { supabaseAdmin } from '@/lib/supabase'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { mapaFacturacion, importeDeCuenta } from '@/lib/facturacion-cuenta'
import { ultimoContactoEfectivoPorCuenta, diasSinContacto } from '@/lib/contacto-cuenta'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import { resumenLlamadas } from '@/lib/llamadas-resumen'
import { veredictoDe, type EstadoCuenta, type Veredicto } from '@/lib/alertas-veredicto'
import type { Alerta } from '@/lib/alertas'

/**
 * lib/alertas-estado.ts — REÚNE LO QUE SE SABE DE LAS 192 Y PIDE SU VEREDICTO
 *
 * El cambio de alcance que pidió dirección el 7 oct 2026: ALERTAS deja de ser
 * «las cuentas que dispararon una alerta» y pasa a ser **todas las cuentas**,
 * cada una con su lectura. Una cuenta sin una sola alerta también tiene un
 * veredicto — «en orden», o «no la vemos» si lo que falta son los datos — y eso
 * es justamente lo que hoy no se puede contestar: hoy una cuenta tranquila y una
 * cuenta invisible se ven igual, porque las dos están ausentes de la lista.
 *
 * NO REPRODUCE NINGUNA REGLA. Todo se lee de donde ya vive:
 *   MRR       → `facturacion-cuenta`   (GRC por CID, la fuente única)
 *   contacto  → `contacto-cuenta`      (sólo canales reales)
 *   consumo   → `cortes-cuenta`        (el `pct` ya viene recalculado)
 *   alertas   → `alertas-detectar`     (los 18 tipos)
 *   auditoría → `app/auditoria/cases`  (los casos escritos a mano)
 */

/** Cuántos CIDs tiene que traer el panel de cortes para creerle.
 *  Hay 146 cuentas vivas con corte; un mapa de un puñado significa que el .xlsx
 *  no viajó con esta lambda, no que nadie consuma. Ver el mismo guardia en
 *  `lib/prediccion/snapshot.ts`. */
const CORTES_MINIMOS = 70

export interface CuentaConVeredicto {
  cuentaId: string
  cid: string | null
  empresa: string
  asesor: string | null
  mrr: number | null
  esTop: boolean
  veredicto: Veredicto
}

export interface MapaVeredictos {
  cuentas: CuentaConVeredicto[]
  /** Por qué no se pudo leer algo, cuando no se pudo. Una fuente caída que se
   *  calla se convierte en 192 cuentas «no la vemos», que leído de fuera parece
   *  un hallazgo y es un fallo. */
  falla: string | null
}

/** Normaliza un nombre para cruzar los casos de auditoría contra la cartera.
 *  Los casos son archivos escritos a mano y su `nombre` no siempre coincide
 *  letra por letra con `cuentas.empresa`. */
function norma(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export async function veredictosDeCartera(
  filtro?: { asesor?: string },
): Promise<MapaVeredictos> {
  const fallos: string[] = []

  let q = supabaseAdmin.from('cuentas')
    .select('id, cid, empresa, asesor, estado, facturacion')
    .in('estado', ['activo', 'en_riesgo'])
  if (filtro?.asesor) q = q.eq('asesor', filtro.asesor)
  const { data: cuentas, error } = await q

  if (error || !cuentas) {
    return { cuentas: [], falla: `No se pudieron leer las cuentas: ${error?.message ?? 'sin filas'}` }
  }

  const [mapa, efectivo, cortes, alertas, casos] = await Promise.all([
    mapaFacturacion(),
    ultimoContactoEfectivoPorCuenta(),
    todosLosCortes(),
    detectarAlertas(filtro?.asesor ? { asesor: filtro.asesor } : undefined),
    /* `STATIC_CASES`, que es como se llama el índice de los 34 casos escritos a
       mano. El `catch` NO se traga el motivo: si el módulo no carga se declara
       abajo, porque «ninguna cuenta tiene auditoría» y «no pude leer el índice»
       se ven igual en pantalla y mandan a arreglar cosas distintas. */
    import('@/app/auditoria/cases')
      .then(m => m.STATIC_CASES ?? [])
      .catch((err: unknown) => {
        fallos.push(`auditoría: no se pudo leer el índice de casos — `
                  + `${err instanceof Error ? err.message : String(err)}`)
        return []
      }),
  ])
  if (mapa.falla) fallos.push(`facturación: ${mapa.falla}`)

  const cortesFiables = cortes.size >= CORTES_MINIMOS
  if (!cortesFiables) {
    fallos.push(`cortes: la fuente devolvió ${cortes.size} CID(s), menos de los `
              + `${CORTES_MINIMOS} mínimos. El consumo sale como no medido, que `
              + `es la verdad, pero el motivo es la fuente y no las cuentas.`)
  }

  /* Los casos de auditoría se cruzan por nombre normalizado. Es lo único que
     hay: son archivos .ts escritos a mano desde un documento y no llevan el id
     ni el CID de la cuenta. */
  const auditadas = new Set(
    (casos as Array<{ nombre?: string }>).map(c => norma(String(c?.nombre ?? ''))).filter(Boolean))

  const porCuenta = new Map<string, Alerta[]>()
  for (const a of alertas) {
    const k = String(a.cuentaId)
    if (!porCuenta.has(k)) porCuenta.set(k, [])
    porCuenta.get(k)!.push(a)
  }

  const salida: CuentaConVeredicto[] = []
  for (const c of cuentas) {
    const id = String(c.id)
    const cid = c.cid === null || c.cid === undefined ? null : String(c.cid).trim()
    const imp = importeDeCuenta(c, mapa)
    const mrr = imp.origen === 'sin_dato' ? null : imp.mrr

    const misCortes = cid && cortesFiables ? (cortes.get(cid) ?? []) : []
    const ultimo = misCortes.length ? misCortes[misCortes.length - 1] : null
    const consumoPct = ultimo && ultimo.origenBase !== 'sin_medicion'
      ? (ultimo.pct ?? null) : null

    const llam = await resumenLlamadas(cid)

    const e: EstadoCuenta = {
      cuentaId: id,
      empresa: String(c.empresa ?? ''),
      asesor: c.asesor ?? null,
      mrr,
      esTop: false,          // lo marca el detector; aquí no se recalcula
      alertas: porCuenta.get(id) ?? [],
      consumoPct,
      diasSinContacto: diasSinContacto(efectivo.get(id) ?? null),
      tieneLlamadas: !!llam,
      perdidas: llam ? llam.sinContestar : null,
      pctPerdidas: llam ? llam.pctSinContestar : null,
      tieneAuditoria: auditadas.has(norma(String(c.empresa ?? ''))),
      candidatura: null,     // se enchufa cuando se exponga el veredicto de crecimiento
      productosSinUso: null,
      tickets: null,
    }

    salida.push({
      cuentaId: id, cid, empresa: e.empresa, asesor: e.asesor,
      mrr, esTop: e.esTop, veredicto: veredictoDe(e),
    })
  }

  /* Orden: por urgencia de la situación y, dentro de ella, por dinero. Las de
     importe desconocido NO van al final como si valieran cero: van justo
     después de las medidas de su misma situación. */
  const { SITUACION } = await import('@/lib/alertas-veredicto')
  salida.sort((a, b) => {
    const d = SITUACION[a.veredicto.situacion].orden - SITUACION[b.veredicto.situacion].orden
    if (d !== 0) return d
    if (a.mrr === null && b.mrr === null) return 0
    if (a.mrr === null) return 1
    if (b.mrr === null) return -1
    return b.mrr - a.mrr
  })

  return { cuentas: salida, falla: fallos.length ? fallos.join(' · ') : null }
}
