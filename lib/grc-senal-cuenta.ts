import { AAA_GRC_2026 } from '@/app/churn/aaa-grc-data'
import { GRC_MES_EN_CURSO } from '@/app/churn/grc-reporte'
import { normalizarNombre, REACTIVADAS_FUERA_DEL_CHURN } from '@/lib/elegibilidad'

/**
 * LO QUE LA FACTURACIÓN YA SABE DE CADA CUENTA, y que no llegaba a las alertas.
 *
 * El GRC tiene medido, mes a mes y cuenta por cuenta, quién bajó su MRR
 * (`Downgrade`) y quién entró en churn (`Churn confirmado`). Eso existía en el
 * repo para DOS cosas —pintar el módulo de Churn y bloquear actividades vía
 * `NOMBRES_CHURN_GRC`— y para ninguna tercera: la cuenta no avisaba, sólo
 * dejaba de poder trabajarse.
 *
 * Aquí se deriva por cuenta, para que el motor de alertas pueda decirlo.
 *
 * ── EL MES VIVO NO CUENTA ───────────────────────────────────────────────────
 * Misma exclusión que en `NOMBRES_CHURN_GRC`, y por la misma razón: Zoho marca
 * «Churn confirmado» todo contrato que todavía no factura, así que el mes en
 * curso mide retraso de cobranza y no bajas. Septiembre 2026 metería cientos de
 * cuentas vivas. [[regla-churn-mes-vencido]]
 *
 * ── EL CRUCE ES POR NOMBRE, Y ESO NO ES GRATIS ──────────────────────────────
 * El GRC no trae CID. Se normaliza igual que `normalizarNombre` —de hecho se
 * usa esa misma función, no una copia: un espejo tecleado a mano deja de ser
 * espejo— y la cobertura está MEDIDA en `scripts/mide-senal-facturacion.py`:
 * de 363 nombres con downgrade, 60 casan con la cartera y 303 no, que son
 * cuentas fuera de la cartera CS. Se cuenta para no inventar cobertura.
 * [[dids-fuente]]
 */

export interface SenalGrcCuenta {
  /** Meses CERRADOS con movimiento `Downgrade`, en orden cronológico. */
  downgrade: string[]
  /** La racha más larga de meses consecutivos con downgrade. */
  rachaDowngrade: number
  /** Meses CERRADOS con `Churn confirmado`. */
  churn: string[]
  /** Lo perdido en los meses de downgrade, en pesos. */
  perdidoDowngrade: number
}

const VACIA: SenalGrcCuenta = {
  downgrade: [], rachaDowngrade: 0, churn: [], perdidoDowngrade: 0,
}

/**
 * La racha más larga de meses CONSECUTIVOS dentro de `meses`.
 *
 * Dos downgrades sueltos en once meses son ruido —un cambio de plan en marzo y
 * otro en agosto—; dos seguidos son una cuenta reduciéndose. Por eso el umbral
 * es la racha y no el conteo: medido, `>= 2 veces` da 21 cuentas y `racha >= 2`
 * da 12, y las 12 son las que de verdad van hacia abajo.
 *
 * Se exporta para poder probarla al derecho y al revés sin montar el motor.
 */
export function rachaConsecutiva(meses: readonly string[], orden: readonly string[]): number {
  const idx = Array.from(new Set(
    meses.map(m => orden.indexOf(m)).filter(i => i >= 0))).sort((a, b) => a - b)
  if (!idx.length) return 0
  let mejor = 1
  let run = 1
  for (let i = 1; i < idx.length; i++) {
    run = idx[i] === idx[i - 1] + 1 ? run + 1 : 1
    if (run > mejor) mejor = run
  }
  return mejor
}

/**
 * El orden de los meses sale del PROPIO archivo, no de una lista tecleada.
 *
 * `AAA_GRC_2026` se escribe en orden cronológico porque lo genera
 * `gen-grc-data.py` recorriendo las hojas pedidas. Teclear aquí
 * `['Enero', …, 'Diciembre']` sería un segundo espejo que envejece solo — y
 * además mentiría el día que el corte empiece en otro mes o cubra dos años.
 */
const ORDEN: readonly string[] = AAA_GRC_2026.map(m => String(m.mes))

/** Los meses que SÍ cuentan: todos menos el vivo. */
const MESES_CERRADOS: ReadonlySet<string> = (() => {
  const vivo = (GRC_MES_EN_CURSO ?? '').toLowerCase()
  return new Set(ORDEN.filter(m => !vivo || m.toLowerCase() !== vivo))
})()

const MAPA: ReadonlyMap<string, SenalGrcCuenta> = (() => {
  const m = new Map<string, SenalGrcCuenta>()
  for (const mes of AAA_GRC_2026) {
    if (!MESES_CERRADOS.has(String(mes.mes))) continue
    for (const r of mes.clientes) {
      const n = normalizarNombre(r.cliente)
      if (!n) continue
      const esDown = r.movimiento.startsWith('Downgrade')
      const esChurn = r.movimiento.startsWith('Churn confirmado')
      if (!esDown && !esChurn) continue
      /* Las reactivadas se saltan en el churn por la misma razón que en
         `NOMBRES_CHURN_GRC`: el GRC las marcó y volvieron. En el downgrade NO
         se saltan — volver no deshace que su plan bajara. */
      if (esChurn && REACTIVADAS_FUERA_DEL_CHURN.has(n)) continue
      const v = m.get(n) ?? { downgrade: [], rachaDowngrade: 0, churn: [], perdidoDowngrade: 0 }
      if (esDown) {
        if (!v.downgrade.includes(String(mes.mes))) v.downgrade.push(String(mes.mes))
        v.perdidoDowngrade += (r.perdido ?? 0) + (r.perdido2 ?? 0)
      } else if (!v.churn.includes(String(mes.mes))) {
        v.churn.push(String(mes.mes))
      }
      m.set(n, v)
    }
  }
  for (const v of m.values()) {
    v.downgrade.sort((a, b) => ORDEN.indexOf(a) - ORDEN.indexOf(b))
    v.churn.sort((a, b) => ORDEN.indexOf(a) - ORDEN.indexOf(b))
    v.rachaDowngrade = rachaConsecutiva(v.downgrade, ORDEN)
  }
  return m
})()

/** Lo que el GRC dice de esta cuenta. Nunca `null`: si no aparece, vacía. */
export function senalGrcDe(empresa: string | null | undefined): SenalGrcCuenta {
  return MAPA.get(normalizarNombre(empresa ?? '')) ?? VACIA
}

/**
 * Cuántos meses cerrados cubre el corte. Si son CERO no es que nadie se haya
 * reducido: es que el archivo no llegó, y eso se dice con palabras en vez de
 * publicar «ninguna cuenta en downgrade», que se leería como buenas noticias.
 * [[feedback-cero-sin-medicion]]
 */
export const MESES_MEDIDOS: number = MESES_CERRADOS.size

/** Umbral de `downgrade_repetido`. Vive aquí, junto a lo que mide. */
export const RACHA_MINIMA = 2
