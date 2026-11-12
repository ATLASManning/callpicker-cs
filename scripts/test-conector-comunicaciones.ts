/**
 * PRUEBA DEL CONECTOR DE COMUNICACIONES
 * =====================================
 *
 *   npm run test:conector
 *
 * Este archivo NO comprueba que el conector funcione. Comprueba lo contrario:
 * que **las compuertas fallen cuando tienen que fallar**.
 *
 * Un verificador que concluye éxito por omisión es peor que no tener ninguno
 * —ya nos pasó con `tsc` cuando `npx` no encontraba a node y el grep vacío se
 * leyó como «cero errores»—. Así que aquí cada control negativo EXIGE una
 * excepción concreta, y si no llega, la prueba truena.
 * Ver [[feedback-verificar-antes-asegurar]] y [[feedback-probar-al-reves]].
 *
 * El control negativo de oro es `scripts/fixtures/conector-login.html`: la
 * pantalla de login AUTÉNTICA que el webhook devolvió el 11 nov 2026, con
 * HTTP 200 y 745 bytes. No está tecleada a mano — se capturó. Un espejo
 * tecleado deja de ser espejo.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

import {
  ErrorConectorFormaInesperada,
  ErrorConectorNoAutenticado,
  ErrorConectorNoCuadra,
  ErrorConectorSinCredencial,
  declaradasEnLaPagina,
  duracionASegundos,
  esPantallaDeLogin,
  estadoDeTicket,
  exigeQueCuadre,
  fechaMexicoAIso,
  resultadoDeLlamada,
  tieneFormaDeFicha,
  validaRespuestaDelConector,
} from '../lib/comunicaciones-conector'
import type { ContextoComunicaciones } from '../lib/comunicaciones-tipos'

/* ── Andamio mínimo ───────────────────────────────────────────────────────── */

let ok = 0
const fallos: string[] = []

function comprueba(titulo: string, condicion: boolean, detalle = '') {
  if (condicion) {
    ok++
    console.log(`  ok   · ${titulo}`)
  } else {
    fallos.push(`${titulo}${detalle ? ' — ' + detalle : ''}`)
    console.log(`  FALLA· ${titulo}${detalle ? ' — ' + detalle : ''}`)
  }
}

async function exigeError(titulo: string, clase: Function, fn: () => Promise<unknown>) {
  try {
    await fn()
    comprueba(titulo, false, 'NO lanzó ningún error (esto es el falso cero)')
  } catch (e) {
    comprueba(titulo, e instanceof clase, `lanzó ${(e as Error).name}`)
  }
}

/* ── Las muestras ─────────────────────────────────────────────────────────── */

/** Capturada del webhook, sin sesión. 745 bytes, HTTP 200. */
const LOGIN = readFileSync(join(__dirname, 'fixtures', 'conector-login.html'), 'utf8')

/**
 * Control POSITIVO. Es ESTRUCTURAL, no un espejo de datos: conserva las clases
 * y los rótulos reales que se midieron en la ficha (`it`, `h`, `chs`, `ch`,
 * `COMUNICACIONES (n)`), con teléfono y nombres inventados a propósito para no
 * meter datos de cliente a un fixture del repo.
 */
const FICHA_ESTRUCTURAL = `<!doctype html><html lang="es"><head><title>CP 999999 - Ejemplo · Contexto</title></head><body>
<div class="top"><h1>CP 999999 - Ejemplo</h1></div>
<h2>COMUNICACIONES (2)</h2>
<div class="it"><div class="h"><b>Llamada</b> · entrante · 11 nov 2026, 03:07 p.m.</div>
<div class="chs"><span class="ch">37 s</span><span class="ch">Contestada</span></div></div>
<div class="it"><div class="h"><b>Ticket</b> · entrante · 31 oct 2026, 11:45 a.m.</div>
<div class="chs"><span class="ch">Pendiente</span><span class="ch">SAC</span></div></div>
</body></html>`

/* ── Carrera ──────────────────────────────────────────────────────────────── */

async function main() {
  console.log('\n  CONTROLES NEGATIVOS — cada uno DEBE lanzar su error\n')

  await exigeError(
    'la pantalla de login auténtica NO se convierte en «0 comunicaciones»',
    ErrorConectorNoAutenticado,
    () => validaRespuestaDelConector({ vista: 'oportunidad', idZoho: '1', htmlDePrueba: LOGIN }),
  )

  await exigeError(
    'una respuesta vacía no pasa',
    ErrorConectorFormaInesperada,
    () => validaRespuestaDelConector({ vista: 'oportunidad', idZoho: '1', htmlDePrueba: '' }),
  )

  await exigeError(
    'HTML largo pero sin contenedores .it no pasa',
    ErrorConectorFormaInesperada,
    () =>
      validaRespuestaDelConector({
        vista: 'oportunidad',
        idZoho: '1',
        htmlDePrueba: '<html><body>' + 'x'.repeat(5000) + '</body></html>',
      }),
  )

  await exigeError(
    'con .it pero sin el rótulo COMUNICACIONES (n) no pasa',
    ErrorConectorFormaInesperada,
    () =>
      validaRespuestaDelConector({
        vista: 'oportunidad',
        idZoho: '1',
        htmlDePrueba: '<html><body><div class="it"></div>' + 'x'.repeat(5000) + '</body></html>',
      }),
  )

  await exigeError(
    'si declara 5 y no trae tarjetas, algo se truncó: no pasa',
    ErrorConectorFormaInesperada,
    () =>
      validaRespuestaDelConector({
        vista: 'oportunidad',
        idZoho: '1',
        htmlDePrueba: '<html><body><h2>COMUNICACIONES (5)</h2></body></html>',
      }),
  )

  await exigeError(
    'sin credencial NO sale a la red',
    ErrorConectorSinCredencial,
    () => {
      delete process.env.CONECTOR_COMUNICACIONES_TOKEN
      delete process.env.CONECTOR_COMUNICACIONES_URL
      return validaRespuestaDelConector({ vista: 'oportunidad', idZoho: '1' })
    },
  )

  await exigeError(
    'un conteo que no cierra no se publica',
    ErrorConectorNoCuadra,
    async () => {
      const ctx = {
        declaradas: 28,
        comunicaciones: [{}, {}],
      } as unknown as ContextoComunicaciones
      exigeQueCuadre(ctx)
    },
  )

  console.log('\n  CONTROL POSITIVO — una ficha con forma real SÍ pasa\n')

  try {
    const r = await validaRespuestaDelConector({
      vista: 'oportunidad',
      idZoho: '999999',
      htmlDePrueba: FICHA_ESTRUCTURAL,
    })
    comprueba('la ficha estructural pasa las dos compuertas', true)
    comprueba('lee lo que la página declara', r.declaradas === 2, `leyó ${r.declaradas}`)
  } catch (e) {
    comprueba('la ficha estructural pasa las dos compuertas', false, (e as Error).message)
  }

  console.log('\n  EL CERO LEGÍTIMO — una cuenta sin comunicaciones SÍ pasa\n')

  // Esta es la distinción que da sentido a todo el módulo: una cuenta callada
  // de verdad declara «COMUNICACIONES (0)» y no trae tarjetas. Ese cero está
  // MEDIDO y tiene que pasar. El que nunca debe pasar es el de la pantalla de
  // login, que no es un cero sino una ausencia de permiso.
  const FICHA_VACIA =
    '<!doctype html><html><head><title>CP 888888 - Sin actividad · Contexto</title></head>' +
    '<body><div class="top"><h1>CP 888888</h1></div><h2>COMUNICACIONES (0)</h2></body></html>'

  try {
    const r = await validaRespuestaDelConector({
      vista: 'oportunidad',
      idZoho: '888888',
      htmlDePrueba: FICHA_VACIA,
    })
    comprueba('una cuenta con cero comunicaciones NO se trata como error', true)
    comprueba('y su cero se lee como cero medido', r.declaradas === 0, `leyó ${r.declaradas}`)
  } catch (e) {
    comprueba(
      'una cuenta con cero comunicaciones NO se trata como error',
      false,
      (e as Error).message,
    )
  }

  console.log('\n  DETECTOR DE LOGIN — positivo y negativo\n')
  comprueba('reconoce el login auténtico', esPantallaDeLogin(LOGIN))
  comprueba('NO marca como login a una ficha', !esPantallaDeLogin(FICHA_ESTRUCTURAL))
  comprueba('la ficha tiene forma', tieneFormaDeFicha(FICHA_ESTRUCTURAL).ok)
  comprueba('el login NO tiene forma de ficha', !tieneFormaDeFicha(LOGIN).ok)

  console.log('\n  LECTURA DE CAMPOS\n')
  comprueba(
    'fecha con huso de México explícito',
    fechaMexicoAIso('11 nov 2026, 03:07 p.m.') === '2026-11-11T15:07:00-06:00',
    String(fechaMexicoAIso('11 nov 2026, 03:07 p.m.')),
  )
  comprueba(
    'las 12 del día no se vuelven medianoche',
    fechaMexicoAIso('4 nov 2026, 12:29 p.m.') === '2026-11-04T12:29:00-06:00',
    String(fechaMexicoAIso('4 nov 2026, 12:29 p.m.')),
  )
  comprueba(
    'las 12 de la noche tampoco',
    fechaMexicoAIso('4 nov 2026, 12:05 a.m.') === '2026-11-04T00:05:00-06:00',
    String(fechaMexicoAIso('4 nov 2026, 12:05 a.m.')),
  )
  comprueba('fecha ilegible devuelve null, no «hoy»', fechaMexicoAIso('ayer por la tarde') === null)

  comprueba('«7 min 51 s» son 471 s', duracionASegundos('7 min 51 s') === 471)
  comprueba('«42 s» son 42 s', duracionASegundos('42 s') === 42)
  comprueba('«17 min 34 s» son 1054 s', duracionASegundos('17 min 34 s') === 1054)
  comprueba('sin duración es null, no 0', duracionASegundos('Perdida') === null)

  comprueba('ticket pendiente se lee pendiente', estadoDeTicket(['Pendiente', 'SAC']) === 'pendiente')
  comprueba('ticket cerrado se lee cerrado', estadoDeTicket(['Cerrado', 'SAC']) === 'cerrado')
  comprueba(
    'un estado que no conocemos NO se asume cerrado',
    estadoDeTicket(['En espera de terceros']) === 'desconocido',
  )
  comprueba('sin chips el estado es null, no cerrado', estadoDeTicket([]) === null)

  comprueba('llamada perdida', resultadoDeLlamada(['Perdida']) === 'perdida')
  comprueba('se quedó en el menú', resultadoDeLlamada(['Se quedó en el menú']) === 'menu')

  comprueba('cuenta lo declarado', declaradasEnLaPagina('COMUNICACIONES (28)') === 28)
  comprueba(
    'si no lo declara devuelve null, no 0',
    declaradasEnLaPagina('<p>hola</p>') === null,
  )

  /* ── Cierre ─────────────────────────────────────────────────────────────── */

  console.log('\n  ' + '─'.repeat(70))
  if (fallos.length) {
    console.log(`  ${fallos.length} FALLA(S) de ${ok + fallos.length}:`)
    fallos.forEach(f => console.log(`     · ${f}`))
    process.exit(1)
  }
  console.log(`  ${ok}/${ok} pasaron. Las compuertas fallan cuando deben fallar.`)
  console.log(
    '  RECORDATORIO: esto NO prueba que el conector entregue datos. Prueba que\n' +
      '  una pantalla de login jamás entre al tablero disfrazada de cuenta muda.\n',
  )
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
