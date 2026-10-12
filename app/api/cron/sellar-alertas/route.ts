import { NextRequest, NextResponse } from 'next/server'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { alertasConMemoria } from '@/lib/alertas-episodios'

/**
 * app/api/cron/sellar-alertas — LA CORRIDA COMPLETA, UNA VEZ AL DÍA
 *
 * ── POR QUÉ HACE FALTA ────────────────────────────────────────────────────
 *
 * La memoria de alertas —`alertas_episodios`, el «desde cuándo lleva así»—
 * sólo se escribe cuando una corrida pasa por la cuenta. Y hasta hoy las
 * únicas corridas eran:
 *
 *   · `GET /api/alertas`, que la dispara quien abra esa API;
 *   · `POST /api/cuentas/[id]/actualizar`, el botón, una cuenta y PARCIAL.
 *
 * Medido el 12 oct 2026: abrir la pantalla `/alertas` NO sella nada —546
 * episodios antes y 546 después—, porque esa página llama a
 * `veredictosDeCartera`, que detecta pero no pasa por `alertasConMemoria`.
 * Así que la memoria dependía de que alguien tocara una API que ninguna
 * pantalla toca.
 *
 * Consecuencia real: las alertas de `mesa` e `importe` llevaban desde el 9 oct
 * sin abrir episodio —el CHECK las rechazaba— y nadie lo supo hasta que el
 * botón nuevo publicó el rechazo. Con el CHECK ya corregido, lo que faltaba
 * era que algo garantizara la corrida.
 *
 * ── Y POR QUÉ NO AL RENDERIZAR ────────────────────────────────────────────
 *
 * Porque ese error ya se cometió aquí: el sellado colgaba del render de la
 * portada y cada visita disparaba 607 UPDATE sueltos para confirmar lo que ya
 * estaba confirmado ese mismo día. El corte de `sincronizarEpisodios` —si ya
 * se confirmó hoy y nada cambió, no se escribe— lo hace barato, pero la
 * DETECCIÓN sigue costando: lee las 192 cuentas, el GRC, los cortes, los
 * contactos, la mesa y los 21 tipos. Eso corre una vez al día y nada más.
 *
 * ── ESTA ES LA ÚNICA QUE CIERRA ───────────────────────────────────────────
 *
 * `alcance: 'completo'` se deriva de NO pasar `asesor`, y sólo una corrida
 * completa cierra episodios: una parcial no ha visto las condiciones de las
 * demás cuentas y las cerraría como «remitidas». O sea que este cron es el
 * único sitio donde una alerta apagada deja de estar abierta.
 *
 * Por eso la respuesta publica `cerrados` y `sinCerrar` aunque valgan cero: si
 * el quórum se dispara —menos del 60% de lo abierto detectado, que suele ser
 * una fuente que no cargó— la corrida escribe lo que vio y NO cierra, y eso
 * hay que poder leerlo sin entrar a la base.
 *
 * ── CUÁNDO ────────────────────────────────────────────────────────────────
 *
 * 12:00 UTC = 06:00 de México, diario. Antes de que nadie abra el tablero, y
 * una hora antes del snapshot de predicción de los lunes (13:00 UTC), que lee
 * alertas: así las lee ya selladas y no a medio sellar.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  /* Falla cerrado: sin `CRON_SECRET` configurado nadie entra. Mismo patrón que
     `snapshot-prediccion` y `refresh-tenure`. */
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!process.env.CRON_SECRET || bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const disparo = req.nextUrl.searchParams.get('manual') === '1' ? 'manual' : 'cron'

  try {
    /* Sin `asesor` ⇒ `alcance: 'completo'`. Es deliberado y es el punto de
       esta ruta; ver arriba. */
    const { alertas, memoria } = await alertasConMemoria(() => detectarAlertas())

    /* 200 aunque haya `falla`: la corrida TERMINÓ y parte del trabajo quedó
       hecho. Un 500 haría que Vercel reintentara y reescribiera lo que ya
       está. Lo que no se hace es esconder la falla — este proyecto publicó
       «nuevos: 4, falla: null» durante un día entero mientras los mismos
       cuatro episodios se rechazaban en silencio. */
    return NextResponse.json({
      ok: memoria.falla === null,
      disparo,
      alertas: alertas.length,
      abiertos: memoria.abiertos,
      detectados: memoria.detectados,
      nuevos: memoria.nuevos,
      cerrados: memoria.cerrados,
      /* Por qué no se cerró, cuando no se cerró. En una corrida completa sana
         viene en `null`; si trae el mensaje de quórum, una fuente no cargó. */
      sinCerrar: memoria.sinCerrar,
      falla: memoria.falla,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error desconocido'
    console.error('[cron sellar-alertas]', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
