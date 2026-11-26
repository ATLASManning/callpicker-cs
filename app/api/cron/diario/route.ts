import { NextRequest, NextResponse } from 'next/server'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { alertasConMemoria } from '@/lib/alertas-episodios'
import { sincronizarCompromisos } from '@/lib/alertas-sla-sync'
import { avisoDiarioSla } from '@/lib/alertas-sla-aviso'
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
 *   · compromisos SLA → TODOS los días (el semáforo de vencimiento se calcula
 *                       al leer, pero quien ABRE el compromiso del día y quien
 *                       escala al tablero de incumplimientos es esta corrida)
 *   · aviso por correo→ TODOS los días, y SÓLO con `SLA_CORREO=1`
 *   · snapshot        → sólo los LUNES (o con `?snapshot=1`)
 *
 * Una entrada de cron, las tres cadencias intactas.
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

  /* ── 2 · LOS COMPROMISOS DE ATENCIÓN ───────────────────────────────────────
   *
   * VA DESPUÉS DEL SELLADO Y ANTES DEL SNAPSHOT, y ninguno de los dos órdenes
   * es casual.
   *
   * Después del sellado porque un compromiso CUELGA de un episodio: si corriera
   * antes, los episodios que nacen hoy todavía no existirían y sus alertas
   * amanecerían sin fecha compromiso — o sea, leídas como atendidas por
   * omisión. Y los que acaban de cerrarse seguirían abiertos, así que su
   * compromiso no se cerraría hasta mañana.
   *
   * Antes del snapshot porque el retrato de la semana lee el estado de las
   * alertas, y leerlo a medio escribir publicaría una foto que no corresponde a
   * ningún momento.
   *
   * Y si el sellado FALLÓ, esto no corre: sincronizar compromisos contra una
   * tabla de episodios a medio sellar abriría unos y cerraría otros por una
   * razón que no es la del cliente. Se dice por qué en vez de devolver ceros. */
  let compromisos: Record<string, unknown> | null = null
  if (sellado.ok === true) {
    try {
      const r = await sincronizarCompromisos({ alcance: 'completo' })
      compromisos = {
        ok: r.falla === null,
        abiertos: r.abiertos, nuevos: r.nuevos, cerrados: r.cerrados,
        escalados: r.escalados,
        /* Las condiciones que alertan y no tienen plazo configurado. Un hueco
           aquí deja alertas sin fecha en el panel, y eso no se ve: hay que
           poder leerlo de un vistazo. */
        sinConfigurar: r.sinConfigurar,
        sinCerrar: r.sinCerrar, falla: r.falla,
      }
    } catch (e) {
      compromisos = { ok: false,
                      falla: e instanceof Error ? e.message : 'error desconocido' }
      console.error('[cron diario] compromisos:', compromisos.falla)
    }
  } else {
    compromisos = {
      ok: false,
      falla: 'no se sincronizaron: el sellado de episodios falló en esta corrida, '
           + 'y los compromisos cuelgan de los episodios',
    }
  }

  /* ── 3 · EL AVISO POR CORREO ───────────────────────────────────────────────
   *
   * VA DESPUÉS DE SINCRONIZAR, porque lo que anuncia son los compromisos que
   * esa sincronización acaba de abrir y escalar. Antes anunciaría el estado de
   * ayer.
   *
   * NO CORRE SI LOS COMPROMISOS FALLARON: un resumen calculado sobre una tabla
   * a medio escribir le diría a alguien que tiene cuatro alertas vencidas
   * cuando tiene nueve, o al revés. Un aviso falso quema el canal: a la tercera
   * vez, el correo se archiva sin abrir y el día que traiga una crítica de
   * verdad tampoco se abrirá.
   *
   * Y VIENE APAGADO. Sin `SLA_CORREO=1` calcula el lote, publica a quién le
   * habría escrito y no manda nada. Encenderlo es de quien responde por el
   * equipo. Ver `lib/alertas-sla-aviso.ts`. */
  let aviso: Record<string, unknown> | null = null
  if (compromisos && compromisos.ok === true) {
    try {
      const r = await avisoDiarioSla()
      aviso = { ok: r.fallas.length === 0, enviado: r.enviado,
                porque: r.porque, lote: r.lote, fallas: r.fallas }
    } catch (e) {
      /* La falla del correo NO tumba la corrida: los compromisos ya están
         escritos y eso es el dato. Esto era sólo cómo se cuenta. */
      aviso = { ok: false, enviado: false,
                falla: e instanceof Error ? e.message : 'error desconocido' }
      console.error('[cron diario] aviso:', aviso.falla)
    }
  } else {
    aviso = {
      ok: false, enviado: false,
      porque: 'no se avisó: los compromisos no se sincronizaron en esta corrida, '
            + 'y anunciar una cola a medio escribir es peor que no anunciarla',
    }
  }

  /* ── 4 · SNAPSHOT, sólo los lunes ──────────────────────────────────────── */
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
    ok: sellado.ok === true
      && (compromisos === null || compromisos.ok === true)
      && (snapshot === null || snapshot.ok === true),
    disparo,
    dia: fechaLocal(hoyMx),
    /* Se dice POR QUÉ no hubo snapshot, en vez de omitirlo sin más: un `null`
       mudo se lee igual que un snapshot que falló. */
    snapshotHoy: tocaSnapshot
      ? (esLunes ? 'sí, es lunes' : 'sí, forzado con ?snapshot=1')
      : `no, hoy no es lunes (semana en curso: ${lunesDeEstaSemana()})`,
    sellado,
    compromisos,
    /* `aviso` NO entra en el `ok` de arriba: que el correo no salga no hace
       fallida la corrida —el dato quedó escrito— y meterlo ahí pondría el
       semáforo del cron en rojo todos los días mientras `SLA_CORREO` esté
       apagado, que es su estado por omisión. Se publica aparte, con su razón. */
    aviso,
    snapshot,
  })
}
