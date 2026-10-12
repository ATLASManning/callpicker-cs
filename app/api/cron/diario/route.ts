import { NextRequest, NextResponse } from 'next/server'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { alertasConMemoria } from '@/lib/alertas-episodios'
import { tomarSnapshot, lunesDeEstaSemana } from '@/lib/prediccion/snapshot'
import { ahoraEnMexico, fechaLocal } from '@/lib/fecha-local'

/**
 * app/api/cron/diario — EL TRABAJO PROGRAMADO, EN UNA SOLA ENTRADA
 *
 * ── POR QUÉ UNA Y NO DOS ──────────────────────────────────────────────────
 *
 * Instrucción de dirección, 12 oct 2026: fusionar el sellado de alertas con el
 * snapshot del lunes, para no pedir una tercera entrada de cron.
 *
 * ── PERO NO SE FUSIONA EN SEMANAL, Y ESO IMPORTA ──────────────────────────
 *
 * Lo evidente sería colgar el sellado del snapshot y dejarlo corriendo los
 * lunes. Eso rompe el cierre de alertas: `DIAS_GRACIA` vale 2, o sea que una
 * condición que deja de verse se marca ausente y cierra dos días después. Con
 * corridas SEMANALES, una alerta que el equipo resuelve el martes se marca
 * ausente el lunes siguiente y no cierra hasta el otro: hasta **dos semanas**
 * abierta después de resuelta. El panel acusaría trabajo ya hecho, que es
 * justo lo que hace que la gente deje de mirarlo.
 *
 * Así que la entrada es DIARIA y lo que se gatea es el snapshot:
 *
 *   · sellar alertas  → TODOS los días
 *   · snapshot        → sólo los LUNES (o con `?snapshot=1`)
 *
 * Una entrada de cron, las dos cadencias intactas.
 *
 * ── EL ORDEN NO ES CASUAL ─────────────────────────────────────────────────
 *
 * Primero sellar, después el snapshot. El snapshot retrata la semana que
 * termina y lee alertas; si corriera antes del sellado las leería a medio
 * sellar, con episodios sin abrir y antigüedades que todavía no existen.
 *
 * Y si el sellado falla, el snapshot CORRE IGUAL: son dos trabajos distintos y
 * que uno se caiga no es razón para perder el retrato de la semana. Lo que no
 * se hace es esconderlo — cada uno publica su propia falla.
 *
 * ── CUÁNDO ────────────────────────────────────────────────────────────────
 *
 * 12:00 UTC = 06:00 de México. Antes de que nadie abra el tablero, y antes del
 * lote semanal de actividades de las 14:00 UTC, que es la condición que el
 * snapshot ya tenía: retrata la semana que termina, no la que empieza.
 *
 * ── Y SIGUE SIENDO LA ÚNICA QUE CIERRA ────────────────────────────────────
 *
 * `alcance: 'completo'` se deriva de no pasar `asesor`. Una corrida parcial
 * —el botón «Actualizar» de una cuenta— no ha visto las condiciones de las
 * demás y las cerraría como «remitidas». Por eso `cerrados` y `sinCerrar` se
 * publican aunque valgan cero.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  /* Falla cerrado: sin `CRON_SECRET` configurado no entra nadie. */
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!process.env.CRON_SECRET || bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const disparo = sp.get('manual') === '1' ? 'manual' : 'cron'

  /* El día SE MIRA EN MÉXICO, no en UTC. A las 12:00 UTC son las 06:00 de
     México del MISMO día, así que aquí no hay desfase — pero escribirlo con
     `new Date().getDay()` dejaría el bug armado para el día que alguien mueva
     el horario a las 02:00 UTC, que en México es la tarde del día anterior.
     Ver [[feedback-fechas-zona-mexico]]. */
  const hoyMx = ahoraEnMexico()
  const esLunes = hoyMx.getDay() === 1
  const tocaSnapshot = sp.get('snapshot') === '1' || esLunes

  /* ── 1 · SELLAR, siempre ───────────────────────────────────────────────── */
  let sellado: Record<string, unknown>
  try {
    const { alertas, memoria } = await alertasConMemoria(() => detectarAlertas())
    sellado = {
      ok: memoria.falla === null,
      alertas: alertas.length,
      abiertos: memoria.abiertos,
      detectados: memoria.detectados,
      nuevos: memoria.nuevos,
      cerrados: memoria.cerrados,
      sinCerrar: memoria.sinCerrar,
      falla: memoria.falla,
    }
  } catch (e) {
    /* Que el sellado se caiga NO cancela el snapshot: ver la cabecera. */
    sellado = { ok: false, falla: e instanceof Error ? e.message : 'error desconocido' }
    console.error('[cron diario] sellado:', sellado.falla)
  }

  /* ── 2 · SNAPSHOT, sólo los lunes ──────────────────────────────────────── */
  let snapshot: Record<string, unknown> | null = null
  if (tocaSnapshot) {
    try {
      const r = await tomarSnapshot(disparo)
      snapshot = {
        ok: r.falla === null,
        semana: r.semana,
        cuentasVistas: r.cuentasVistas,
        filasEscritas: r.filasEscritas,
        tareasAbiertas: r.tareasAbiertas,
        tareasCerradas: r.tareasCerradas,
        falla: r.falla,
      }
    } catch (e) {
      snapshot = { ok: false, falla: e instanceof Error ? e.message : 'error desconocido' }
      console.error('[cron diario] snapshot:', snapshot.falla)
    }
  }

  /* 200 aunque alguna parte traiga `falla`: la corrida TERMINÓ y parte del
     trabajo quedó hecho. Un 500 haría que Vercel reintentara y reescribiera lo
     que ya está. Lo que no se hace es esconder la falla — este proyecto
     publicó «nuevos: 4, falla: null» durante un día entero mientras los mismos
     cuatro episodios se rechazaban en silencio. */
  return NextResponse.json({
    ok: sellado.ok === true && (snapshot === null || snapshot.ok === true),
    disparo,
    dia: fechaLocal(hoyMx),
    /* Se dice POR QUÉ no hubo snapshot, en vez de omitirlo sin más: un `null`
       mudo se lee igual que un snapshot que falló. */
    snapshotHoy: tocaSnapshot
      ? (esLunes ? 'sí, es lunes' : 'sí, forzado con ?snapshot=1')
      : `no, hoy no es lunes (semana en curso: ${lunesDeEstaSemana()})`,
    sellado,
    snapshot,
  })
}
