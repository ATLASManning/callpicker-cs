import { supabaseAdmin, traerPorPaginas } from '@/lib/supabase'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import { cargarEscalera } from '@/lib/focos-riesgo'
import { jugadaDeRedimension, type Jugada } from '@/lib/redimensionar'
import type { TipoAlerta } from '@/lib/alertas'

/**
 * LA JUGADA DE REDIMENSIONAR, RESUELTA CONTRA LAS FUENTES VIVAS
 *
 * `lib/redimensionar.ts` tiene la regla y no importa nada; esto le pone los
 * datos delante. La separación es la que permite probar la regla con `ts-node`
 * —`lib/supabase.ts` no se puede importar fuera de Next en Node 20—.
 *
 * ── SE CALCULA AL LEER, NO AL NACER ───────────────────────────────────────
 *
 * La recomendación NO se guarda en `alertas_sla.accion_sugerida`. Si se
 * congelara el día que nace el compromiso, seguiría diciendo «bájale a 600
 * min» el mes que el cliente ya bajó, y «ofrécele Chat» a quien lo contrató la
 * semana pasada. Es la misma regla que el dueño: sale de la fuente AL LEER.
 * [[feedback-fuente-unica-cuentas]]
 *
 * ── LOS CINCO TIPOS SON UNA SOLA CLASE ────────────────────────────────────
 *
 * Dirección (26 nov 2026) los trata igual: todos son «paga más de lo que usa»,
 * en distinto grado. `consumo_cero` es el extremo y `plan_sobrado` el caso
 * ancho; lo que cambia es cuánto sobra, no qué hacer.
 */

/** Los tipos que forman la clase «paga más de lo que usa». */
export const SUBUTILIZACION: ReadonlySet<TipoAlerta> = new Set<TipoAlerta>([
  'plan_sobrado', 'uso_bajo', 'caida_consumo', 'consumo_cero', 'desplome_consumo',
])

export function esSubutilizacion(tipo: string): boolean {
  return SUBUTILIZACION.has(tipo as TipoAlerta)
}

/** Lo que esta capa publica por cuenta. `null` = no se intentó. */
export interface JugadaDeCuenta {
  jugada: Jugada
  /** Fecha del archivo de escalera, para poder decir sobre qué corte se habla. */
  escaleraDe: string | null
}

/**
 * Resuelve la jugada de cada `cuenta_id` pedido.
 *
 * Nunca lanza: si una fuente falta, la cuenta sale con una jugada `medible:
 * false` que DICE qué faltó. Una cola de trabajo que revienta entera porque no
 * se pudo abrir un Excel es peor que una cola con huecos rotulados.
 */
export async function jugadasPorCuenta(
  /* EL IMPORTE VIENE DEL COMPROMISO, NO DE LA ESCALERA. `monto_ultimo_corte`
     del JSON de escalera NO es el MRR: para Cargo Lift trae 10 cuando la
     cuenta factura $18,953, y para Azyco 3,184 contra $22,283. Una propuesta
     que dice «sostener los $10 al mes» delante del cliente se cae sola. El
     dato bueno es `alertas_sla.mrr_en_riesgo`, que el compromiso ya midió
     contra el GRC. [[grc-fuente-zoho]] [[feedback-fuente-unica-cuentas]] */
  cuentas: ReadonlyArray<{ id: string; mrr: number | null }>,
): Promise<Map<string, JugadaDeCuenta>> {
  const salida = new Map<string, JugadaDeCuenta>()
  if (!cuentas.length) return salida

  const pedidas = new Set(cuentas.map(c => String(c.id)))
  /* Si una cuenta trae dos compromisos de la clase con importes distintos, se
     queda el mayor: lo que está en riesgo es el MRR de la cuenta, no la suma. */
  const mrrDe = new Map<string, number | null>()
  for (const c of cuentas) {
    const k = String(c.id)
    const antes = mrrDe.get(k)
    if (antes === undefined || (c.mrr !== null && (antes === null || c.mrr > antes))) {
      mrrDe.set(k, c.mrr)
    }
  }

  /* ── El CID, que es la llave de los cortes ───────────────────────────────
     Nunca por nombre de empresa: ahí es donde se mezclan cuentas. */
  const cid = new Map<string, string>()
  try {
    const filas = await traerPorPaginas<{ id: string; cid: string | null }>(
      (d, h) => supabaseAdmin.from('cuentas').select('id, cid').range(d, h))
    for (const c of filas) {
      if (pedidas.has(String(c.id)) && c.cid) cid.set(String(c.id), String(c.cid))
    }
  } catch { /* se queda sin CID y la jugada lo dirá */ }

  let cortes: Awaited<ReturnType<typeof todosLosCortes>> | null = null
  try { cortes = await todosLosCortes() } catch { cortes = null }

  let escalera: Awaited<ReturnType<typeof cargarEscalera>> | null = null
  try { escalera = await cargarEscalera() } catch { escalera = null }

  for (const id of pedidas) {
    const esc = escalera?.get(id) ?? null
    const miCid = cid.get(id) ?? esc?.cid ?? null
    const mios = (cortes && miCid) ? (cortes.get(String(miCid)) ?? []) : []

    if (!cortes) {
      salida.set(id, {
        escaleraDe: null,
        jugada: {
          medible: false,
          porque: 'no se pudo leer el archivo de cortes',
          texto: 'No se pudo abrir el archivo de cortes de facturación, así que '
               + 'no hay con qué dimensionar. Esto NO significa que la cuenta no '
               + 'tenga consumo: significa que hoy no se pudo medir.',
        },
      })
      continue
    }

    salida.set(id, {
      escaleraDe: null,
      jugada: jugadaDeRedimension({
        mrr: mrrDe.get(id) ?? null,
        plan: esc?.plan_ultimo_corte ?? (mios[0]?.plan ?? null),
        meses: mios.map(m => ({
          mes: m.mes, cons: m.cons, base: m.base, origenBase: m.origenBase,
          extensiones: m.extensiones,
        })),
        /* `tiene_*` de la escalera. `undefined` entra como `null` y la regla lo
           trata como «no consta», que no es lo mismo que «no lo tiene». */
        tieneCE: esc?.tiene_CE ?? null,
        tieneVyC: esc?.tiene_VyC ?? null,
        tieneChat: esc?.tiene_Chat ?? null,
        tieneAV: esc?.tiene_AV ?? null,
        tieneAPI: esc?.tiene_API ?? null,
      }),
    })
  }

  return salida
}
