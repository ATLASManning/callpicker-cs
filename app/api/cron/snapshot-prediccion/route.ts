import { NextRequest, NextResponse } from 'next/server'
import { tomarSnapshot, lunesDeEstaSemana } from '@/lib/prediccion/snapshot'

/**
 * app/api/cron/snapshot-prediccion — el snapshot del lunes.
 *
 * ── POR QUE ES UN TRABAJO PROGRAMADO Y NO ALGO QUE PASA AL RENDERIZAR ──────
 *
 * Porque ya cometí ese error esta semana. El registro de episodios de alerta
 * escribía al montar la portada, y cada render disparaba **607 UPDATE sueltos**
 * para confirmar episodios que ya estaban confirmados ese mismo día — por cada
 * visita a la portada, a `/alertas` y a la API. Un snapshot es más pesado que
 * eso: lee las 192 cuentas, el GRC, los cortes, los contactos y los 18 tipos de
 * alerta. Corre una vez por semana, cuando toca, y nada más.
 *
 * ── CUANDO ──────────────────────────────────────────────────────────────────
 *
 * Lunes 13:00 UTC = 07:00 de México, que es lo que pide el §11 del Prompt
 * Maestro. El otro cron del proyecto —el lote semanal de actividades— corre a
 * las 14:00 UTC, una hora después, así que el snapshot queda tomado ANTES de que
 * se generen las actividades de la semana. Ese orden importa: el snapshot
 * retrata la semana que termina, no la que empieza.
 *
 * ── IDEMPOTENTE ─────────────────────────────────────────────────────────────
 *
 * El upsert va sobre `(semana, cuenta_id)`, así que repetirlo el mismo lunes
 * reescribe en vez de duplicar. Y las tareas usan `ignoreDuplicates` contra un
 * índice parcial de abiertas: una tarea que lleva tres semanas sin hacerse
 * conserva su antigüedad en vez de nacer de nuevo cada lunes, que es justo lo
 * que dice cuánto lleva pendiente.
 *
 * Eso hace seguro reintentar y hace inofensivo que alguien lo dispare a mano.
 *
 * ── QUE HACER SI DEVUELVE `falla` ───────────────────────────────────────────
 *
 * Leerla. `supabase-js` NO LANZA: devuelve `{data, error}`, así que una escritura
 * rechazada no interrumpe nada. Este proyecto publicó durante un día entero
 * «nuevos: 4, falla: null» mientras los mismos cuatro episodios fallaban en
 * silencio. Aquí cada escritura se mira y lo que falle sale en la respuesta y en
 * `prediccion.corridas`.
 *
 * El error más probable la primera vez es que el esquema no esté expuesto:
 * `PGRST106 · Invalid schema: prediccion`. Se arregla en el tablero de Supabase
 * —Project Settings → API → Exposed schemas—, no en el código. Está explicado
 * al principio de `scripts/migracion-prediccion-snapshot.sql`.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  /* Falla cerrado: sin `CRON_SECRET` configurado, nadie entra. Es el mismo
     patrón que `/api/cron/generar-semana`. */
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!process.env.CRON_SECRET || bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const disparo = req.nextUrl.searchParams.get('manual') === '1' ? 'manual' : 'cron'

  try {
    const r = await tomarSnapshot(disparo)
    /* 200 incluso con `falla`: la corrida TERMINÓ, y parte del trabajo quedó
       hecho. Un 500 haría que Vercel lo reintentara y volviera a escribir lo
       que ya está. Lo que no se hace es esconder la falla. */
    return NextResponse.json({
      ok: r.falla === null,
      semana: r.semana,
      cuentasVistas: r.cuentasVistas,
      filasEscritas: r.filasEscritas,
      tareasAbiertas: r.tareasAbiertas,
      tareasCerradas: r.tareasCerradas,
      porAsesor: r.porAsesor,
      falla: r.falla,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      { ok: false, semana: lunesDeEstaSemana(), falla: `La corrida se interrumpió: ${msg}` },
      { status: 500 })
  }
}
