import { supabaseAdmin, traerPorPaginas } from '@/lib/supabase'
import { todosLosCortes } from '@/lib/cortes-cuenta'
import { baseMinutos } from '@/lib/plan-minutos'
import { hoyLocal } from '@/lib/fecha-local'
import { construirAlerta, type Alerta, type TipoAlerta } from '@/lib/alertas'

/**
 * lib/alertas-detectar.ts — DETECCIÓN DETERMINISTA
 *
 * La detección NO la hace la IA, y es una decisión de diseño, no una
 * limitación: cuando el ejecutivo pregunte «¿por qué saltó esto?», la
 * respuesta tiene que ser una regla que se pueda leer, no la opinión de un
 * modelo. Es también lo que la vuelve defendible ante dirección.
 *
 * La IA viene después, encima de estas señales, para INTERPRETAR y
 * RECOMENDAR — nunca para detectar.
 *
 * Cada regla escribe su `evidencia` CON NÚMEROS. Una alerta sin su número no
 * se puede defender frente al cliente ni frente al equipo, y es exactamente
 * lo que convirtió las 383 acciones de auditoría en texto que nadie siguió.
 */

/** Las TOP: las 25 de mayor facturación. «El cliente 25 ya factura 20,000». */
const N_TOP = 25

/** Umbrales. Están juntos A PROPÓSITO: son la perilla del volumen. */
export const UMBRALES = {
  /** Meses consecutivos a la baja para declarar caída sostenida. */
  mesesCaida: 3,
  /** Pérdida mínima contra el punto de partida, en tanto por uno. */
  caidaMinima: 0.30,
  /** Por debajo de esto no se mira la caída: el ruido de una cuenta chica. */
  consumoMinimoParaMirar: 10,
  /** Desplome: venía de este nivel y cayó por debajo del otro. */
  desplomeDesde: 40,
  desplomeHasta: 10,
  /** Uso crónicamente bajo: nunca pasó de esto en todo el periodo. */
  usoBajo: 15,
  /** Debajo de esto el consumo es CERO, no bajo. No es 0 exacto para que un
   *  residuo de punto flotante —0.0000001%— no se lea como uso real. */
  consumoCero: 0.5,
  /** Silencio. */
  silencioLargo: 60,
  silencioCorto: 30,
  /** Rebase: por encima de esto se está cobrando excedente. */
  rebase: 100,
} as const

interface CuentaAlerta {
  id: string
  cid: string | null
  consecutivo: string | null
  empresa: string
  asesor: string | null
  estado: string | null
  facturacion: number | null
  ultimo_contacto: string | null
  observaciones_kam: string | null
  contactos_json: unknown
}

const CAMPOS =
  'id, cid, consecutivo, empresa, asesor, estado, facturacion, ultimo_contacto, ' +
  'observaciones_kam, contactos_json'

function diasDesde(fecha: string | null | undefined, hoy: string): number | null {
  if (!fecha) return null
  const f = String(fecha).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f)) return null
  const a = Date.UTC(+f.slice(0, 4), +f.slice(5, 7) - 1, +f.slice(8, 10))
  const b = Date.UTC(+hoy.slice(0, 4), +hoy.slice(5, 7) - 1, +hoy.slice(8, 10))
  return Math.max(0, Math.round((b - a) / 86400000))
}

function cuantosContactos(v: unknown): number {
  try {
    const arr = Array.isArray(v) ? v : (typeof v === 'string' && v ? JSON.parse(v) : [])
    return Array.isArray(arr) ? arr.length : 0
  } catch { return 0 }
}

const dinero = (n: number) => '$' + Math.round(n).toLocaleString('es-MX')

/**
 * Todas las alertas de la cartera viva, ya ordenadas por prioridad.
 *
 * Lee de fuentes vivas y NO guarda estado: el `id` de cada alerta es estable
 * (`tipo:cuentaId`), así que cuando se agregue la tabla de seguimiento, la
 * misma condición detectada mañana empata con la fila de hoy y la alerta
 * envejece en vez de renacer.
 */
export async function detectarAlertas(opciones?: { asesor?: string }): Promise<Alerta[]> {
  const hoy = hoyLocal()

  let q = supabaseAdmin.from('cuentas').select(CAMPOS).in('estado', ['activo', 'en_riesgo'])
  if (opciones?.asesor) q = q.eq('asesor', opciones.asesor)
  const { data: cuentasRaw, error } = await q
  if (error) throw error
  const cuentas = (cuentasRaw ?? []) as unknown as CuentaAlerta[]
  if (!cuentas.length) return []

  const ids = cuentas.map(c => c.id)

  const [radarRows, segRows, actRows, cortes] = await Promise.all([
    traerPorPaginas<{ cuenta_id: string }>((d, h) =>
      supabaseAdmin.from('radar_respuestas').select('cuenta_id').in('cuenta_id', ids).range(d, h)),
    traerPorPaginas<{ cuenta_id: string; fecha: string }>((d, h) =>
      supabaseAdmin.from('seguimientos').select('cuenta_id, fecha').in('cuenta_id', ids).range(d, h)),
    traerPorPaginas<{ cuenta_id: string; completada: boolean | null; estado: string | null }>((d, h) =>
      supabaseAdmin.from('actividades').select('cuenta_id, completada, estado')
        .in('cuenta_id', ids).range(d, h)),
    todosLosCortes(),
  ])

  const conRadar = new Set(radarRows.map(r => r.cuenta_id))
  const ultimoSeg = new Map<string, string>()
  for (const s of segRows) {
    const f = String(s.fecha ?? '').slice(0, 10)
    if (f && f > (ultimoSeg.get(s.cuenta_id) ?? '')) ultimoSeg.set(s.cuenta_id, f)
  }
  /* Se cuentan, no solo se marcan: la evidencia de `asignada_sin_cerrar` tiene
     que poder decir CUÁNTAS se asignaron. «Se le asignó trabajo y no se cerró»
     es una queja; «se le asignaron 7 y no se cerró ninguna» es un dato. */
  const nAsignadas = new Map<string, number>()
  const cerradas = new Set<string>()
  for (const a of actRows) {
    if (!a.cuenta_id) continue
    nAsignadas.set(a.cuenta_id, (nAsignadas.get(a.cuenta_id) ?? 0) + 1)
    if (a.completada || a.estado === 'completada') cerradas.add(a.cuenta_id)
  }
  const nSeguimientos = new Map<string, number>()
  for (const s of segRows) {
    if (!s.cuenta_id) continue
    nSeguimientos.set(s.cuenta_id, (nSeguimientos.get(s.cuenta_id) ?? 0) + 1)
  }

  /* Las TOP salen del dinero, no de una lista a mano: la lista envejece y
     nadie la actualiza. Ver [[feedback-fuente-unica-cuentas]]. */
  const top = new Set(
    [...cuentas].sort((a, b) => (b.facturacion ?? 0) - (a.facturacion ?? 0))
      .slice(0, N_TOP).map(c => c.id))

  const alertas: Alerta[] = []
  const add = (tipo: TipoAlerta, c: CuentaAlerta, ev: string, dias: number | null = null) =>
    alertas.push(construirAlerta(tipo, c, ev, top.has(c.id), dias))

  for (const c of cuentas) {
    // ── Consumo: la serie de la cuenta, de su propio corte ───────────────
    const serie = (c.cid ? cortes.get(String(c.cid)) : null) ?? []
    const pcts = serie
      .map(x => {
        const b = baseMinutos(x.plan, x.incl)
        return b.base && b.base > 0
          ? { mes: x.mes, pct: (100 * x.cons) / b.base }
          : null
      })
      .filter((x): x is { mes: string; pct: number } => x !== null)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-5)

    if (pcts.length < 3) {
      // CEGUERA, y es la más grave: 18 de las 25 TOP caen aquí.
      add('sin_consumo_medible', c,
          c.cid
            ? `El CID ${c.cid} tiene ${pcts.length} de 5 meses con dato de consumo: no `
              + `alcanza para una serie, y factura ${dinero(c.facturacion ?? 0)} al mes.`
            : `La cuenta no tiene CID capturado, así que no cruza con ningún corte: `
              + `${dinero(c.facturacion ?? 0)} al mes sin un solo minuto medible.`)
    } else {
      const ult = pcts[pcts.length - 1]
      const prev = pcts.slice(0, -1)
      const maxPrev = Math.max(...prev.map(p => p.pct))
      const n = UMBRALES.mesesCaida
      const tramo = pcts.slice(-n)
      const bajando = tramo.length === n && tramo.every((p, i) => i === 0 || p.pct < tramo[i - 1].pct)
      const caida = tramo.length === n && tramo[0].pct > 0
        ? (tramo[0].pct - ult.pct) / tramo[0].pct : 0

      if (bajando && tramo[0].pct >= UMBRALES.consumoMinimoParaMirar
          && caida >= UMBRALES.caidaMinima) {
        add('caida_consumo', c,
            `Consumo de ${tramo.map(p => `${p.pct.toFixed(0)}%`).join(' → ')} `
            + `entre ${tramo[0].mes} y ${ult.mes}: ${(caida * 100).toFixed(0)}% menos.`)
      } else if (maxPrev >= UMBRALES.desplomeDesde && ult.pct < UMBRALES.desplomeHasta) {
        add('desplome_consumo', c,
            `Llegó a usar el ${maxPrev.toFixed(0)}% de su plan y en ${ult.mes} usó `
            + `el ${ult.pct.toFixed(0)}%.`)
      } else if (Math.max(...pcts.map(p => p.pct)) < UMBRALES.consumoCero) {
        /* ANTES de `uso_bajo` a propósito: sin esta rama, una cuenta con cero
           minutos salía con la evidencia «nunca pasó del 0% de su plan», que
           es una frase sin sentido y una severidad equivocada. */
        add('consumo_cero', c,
            `Cero minutos consumidos en los ${pcts.length} meses medidos `
            + `(${pcts[0].mes} a ${ult.mes}), y paga ${dinero(c.facturacion ?? 0)} al mes.`)
      } else if (Math.max(...pcts.map(p => p.pct)) < UMBRALES.usoBajo) {
        add('uso_bajo', c,
            `Nunca pasó del ${Math.max(...pcts.map(p => p.pct)).toFixed(0)}% de su plan en `
            + `${pcts.length} meses, y paga ${dinero(c.facturacion ?? 0)} al mes.`)
      } else if (ult.pct > UMBRALES.rebase) {
        add('rebasa_bolsa', c,
            `En ${ult.mes} consumió el ${ult.pct.toFixed(0)}% de su bolsa: el excedente se cobra.`)
      }
    }

    // ── Contacto: silencio o abandono ────────────────────────────────────
    const ultimo = c.ultimo_contacto ?? ultimoSeg.get(c.id) ?? null
    const d = diasDesde(ultimo, hoy)
    if (d === null) {
      add('nunca_contactada', c,
          `Cero seguimientos registrados en una cuenta activa de `
          + `${dinero(c.facturacion ?? 0)} al mes.`)
    } else if (d > UMBRALES.silencioLargo) {
      add('silencio_60', c, `Último contacto el ${ultimo}: hace ${d} días.`, d)
    } else if (d > UMBRALES.silencioCorto) {
      add('silencio_30', c, `Último contacto el ${ultimo}: hace ${d} días.`, d)
    }

    // ── Ceguera de ficha ─────────────────────────────────────────────────
    if (!conRadar.has(c.id)) {
      add('sin_radar', c,
          `0 de 12 preguntas del Radar respondidas, en una cuenta de `
          + `${dinero(c.facturacion ?? 0)} al mes.`)
    }
    if (cuantosContactos(c.contactos_json) === 0) {
      add('sin_contactos', c,
          `Cero contactos capturados en una cuenta de ${dinero(c.facturacion ?? 0)} al mes.`)
    }
    if (!(c.observaciones_kam ?? '').trim()) {
      const ns = nSeguimientos.get(c.id) ?? 0
      add('sin_ficha', c,
          `Cero observaciones del KAM en una cuenta de ${dinero(c.facturacion ?? 0)} al mes, `
          + `con ${ns} ${ns === 1 ? 'seguimiento' : 'seguimientos'} en el historial.`)
    }

    // ── Abandono: es nuestro, no del cliente ─────────────────────────────
    const nAsig = nAsignadas.get(c.id) ?? 0
    if (nAsig > 0 && !cerradas.has(c.id)) {
      // El verbo concuerda con el número, no solo el sustantivo: «se le
      // asignaron 1 actividad» salía en 26 de las 69 alertas de abandono.
      add('asignada_sin_cerrar', c,
          (nAsig === 1 ? 'Se le asignó 1 actividad' : `Se le asignaron ${nAsig} actividades`)
          + ` y no se ha cerrado ninguna, en una cuenta de `
          + `${dinero(c.facturacion ?? 0)} al mes.`)
    } else if (nAsig === 0) {
      add('nunca_asignada', c,
          `Cero actividades en todo el historial, y paga ${dinero(c.facturacion ?? 0)} al mes.`)
    }
  }

  return alertas.sort((a, b) =>
    b.prioridad - a.prioridad || b.mrr - a.mrr || a.empresa.localeCompare(b.empresa, 'es'))
}
