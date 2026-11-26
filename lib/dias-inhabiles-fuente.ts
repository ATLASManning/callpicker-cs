import { supabaseAdmin, esTablaInexistente } from '@/lib/supabase'
import type { Calendario, Dia } from '@/lib/dias-habiles'

/**
 * lib/dias-inhabiles-fuente.ts — EL LECTOR DEL CALENDARIO
 *
 * Está separado de `lib/dias-habiles.ts` a propósito: ese archivo es sólo
 * aritmética y no importa nada, así que se puede probar con `ts-node`. Éste
 * importa `lib/supabase.ts`, que construye un `RealtimeClient` al cargarse y en
 * Node 20 revienta fuera de Next. Juntarlos volvía improbable lo único de este
 * encargo que no necesita base de datos.
 *
 * ── SI EL CALENDARIO NO SE PUEDE LEER, NO SE INVENTA UNO ──────────────────
 *
 * Se devuelve `falla` y un conjunto VACÍO. Quien calculara un plazo nuevo con
 * eso obtendría una fecha demasiado temprana sin que nada fallara: un
 * compromiso que vence antes de lo que debe acusa a alguien de un
 * incumplimiento que no cometió.
 *
 * Por eso el generador NO crea compromisos cuando `falla` no es nulo. Espera a
 * la corrida siguiente —es diaria— y publica la falla en el JSON del cron, con
 * la misma regla que `memoria.falla` de los episodios: una corrida que no pudo
 * hacer su trabajo lo DICE, no devuelve cero y se calla. Este proyecto publicó
 * «nuevos: 4, falla: null» durante un día entero mientras cuatro episodios se
 * rechazaban en silencio.
 *
 * Los compromisos que YA existen no se tocan: su fecha está guardada.
 */

/**
 * Los días inhábiles de la base. Se pide UNA vez por corrida y se pasa a mano a
 * las funciones de cálculo.
 *
 * No se memoriza en un módulo: en Vercel una lambda atiende varias peticiones y
 * un caché de proceso serviría el calendario de ayer después de que
 * administración agregue un puente, sin forma de notarlo.
 */
export async function cargaDiasInhabiles(): Promise<Calendario> {
  try {
    const { data, error } = await supabaseAdmin
      .from('dias_inhabiles')
      .select('fecha')
    if (error) throw error
    const inhabiles = new Set<Dia>(
      (data ?? []).map(r => String((r as { fecha: unknown }).fecha).slice(0, 10)),
    )
    return { inhabiles, cuantos: inhabiles.size, falla: null }
  } catch (e) {
    if (esTablaInexistente(e)) {
      return {
        inhabiles: new Set(), cuantos: 0,
        falla: 'La tabla dias_inhabiles no existe todavía: correr '
             + 'scripts/migracion-alertas-sla.sql',
      }
    }
    return {
      inhabiles: new Set(), cuantos: 0,
      falla: (e as Error)?.message ?? 'no se pudo leer el calendario',
    }
  }
}
