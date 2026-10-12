import { NextRequest, NextResponse } from 'next/server'
import { detectarAlertas } from '@/lib/alertas-detectar'
import { alertasConMemoria } from '@/lib/alertas-episodios'
import { normalizeCuentaId } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/cuentas/[id]/actualizar — JUNTA TODO LO DE ESTA CUENTA Y LO SELLA
 *
 * Instrucción de dirección, 12 oct 2026: «un botón que diga actualizar en cada
 * cuenta, de tal suerte que al dar click puedas unir toda la información y
 * actualizar de manera eficiente».
 *
 * ── QUÉ HACE, Y POR QUÉ NO ES UN `router.refresh()` ──────────────────────
 *
 * La ficha ya es `force-dynamic`: recargarla recalcula las cifras. Lo que NO
 * ocurre al recargar es el sellado de la MEMORIA — abrir el episodio de una
 * alerta que acaba de nacer, confirmar las que siguen vivas, anotar que una
 * escaló. Eso sólo pasa cuando una corrida del motor pasa por la cuenta, y
 * esas corridas las dispara el tablero, no la ficha.
 *
 * Resultado hoy: alguien captura una reunión, recarga, ve las cifras nuevas —
 * pero el bloque «qué cambió» sigue contando los días desde el sello viejo.
 * Este botón cierra ese hueco: recalcula Y sella, y devuelve qué se movió.
 *
 * ── POR QUÉ NO CIERRA ALERTAS ────────────────────────────────────────────
 *
 * `alcance: 'parcial'`, siempre. Una corrida acotada a UNA cuenta no ha visto
 * las condiciones de las otras 192, y `sincronizarEpisodios` cerraría como
 * «remitidas» todas las que no estaban en la consulta. El módulo ya lo
 * protege, y aquí se declara explícito para que nadie lo suba a 'completo'
 * pensando que una cuenta es un universo pequeño.
 *
 * Hay además una razón de negocio: una alerta que se apaga sola se cierra como
 * `remitio` y una de captura como `resuelta`, y esa distinción se decide
 * mirando toda la cartera. Dejar que un botón por cuenta cierre episodios
 * convertiría «le di a actualizar» en «lo resolví».
 *
 * Así que el botón ABRE y CONFIRMA. Cerrar sigue siendo del corte completo, y
 * la respuesta lo dice para que nadie espere lo contrario.
 */
export async function POST(
  _req: NextRequest, { params }: { params: { id: string } },
) {
  /* `await`: resuelve un consecutivo («F16») o un UUID contra la base, así que
     es asíncrona. La ficha la usa igual. */
  const cuentaId = await normalizeCuentaId(params.id)
  if (!cuentaId) {
    return NextResponse.json({ error: 'cuenta no válida' }, { status: 400 })
  }

  try {
    /* ── `alertasConMemoria` ES LA PUERTA, Y SE USA TAL CUAL ───────────────
     *
     * La primera versión de esta ruta llamaba a `veredictosDeCartera` y le
     * sacaba las alertas con un cast: `(fila as unknown as {alertas?}).alertas`.
     * Eso compilaba y NO funcionaba — `CuentaConVeredicto` no publica
     * `alertas`, viven en `EstadoCuenta`, que es interno del motor. El cast
     * habría devuelto `undefined`, de ahí `[]`, y el botón habría confirmado
     * cero episodios diciendo que todo fue bien. Un botón que miente es peor
     * que no tenerlo.
     *
     * `alertasConMemoria` es la puerta documentada para esto: detecta Y sella
     * en una sola llamada, y deriva el alcance de las opciones. Se le pasa
     * `cuentaId`, que `detectarAlertas` acepta.
     */
    const { alertas, memoria } = await alertasConMemoria(
      () => detectarAlertas({ cuentaId }),
      /* `asesor` presente —con el valor que sea— es lo que marca la corrida
         como PARCIAL, y una parcial no cierra nada. Que sea por cuenta y no
         por asesor da igual: lo que importa es que no vio la cartera entera.
         Ver `alertasConMemoria`. */
      { asesor: `cuenta:${cuentaId}` },
    )

    return NextResponse.json({
      ok: true,
      alertas: alertas.length,
      nuevas: memoria.nuevos,
      /* `detectados` es cuántas condiciones vio esta corrida. Se publica
         porque «0 nuevas» y «no vio nada» se leen igual si no está. */
      detectados: memoria.detectados,
      /* Se dice SIEMPRE, no sólo cuando falla: que una corrida por cuenta no
         cierre no es una avería, es la regla. */
      nota: 'Se abrieron y confirmaron las alertas de esta cuenta. '
          + 'Cerrar una alerta apagada es del corte completo de la cartera, '
          + 'no de una cuenta suelta.',
      falla: memoria.falla,
      /* `sinCerrar` dice por qué no se cerró nada. En una corrida por cuenta
         SIEMPRE trae el motivo «parcial», y eso es lo esperado: se publica
         para que el día que traiga otra cosa —un quórum roto— se vea. */
      sinCerrar: memoria.sinCerrar,
    })
  } catch (e) {
    /* El motor NO puede tumbar la ficha ni el botón: se devuelve el motivo
       para que la pantalla lo diga, en vez de un spinner que no termina. */
    const msg = e instanceof Error ? e.message : 'error desconocido'
    console.warn('[actualizar]', cuentaId, msg)
    return NextResponse.json({ error: 'motor', mensaje: msg }, { status: 500 })
  }
}
