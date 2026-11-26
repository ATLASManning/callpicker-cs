/**
 * LA TARJETA POR CUENTA, MONTADA Y MIRABLE
 *
 *   npm run repro:tarjeta -- <salida.html>
 *
 * ── POR QUÉ NO ES OTRO ESPEJO TECLEADO A MANO ─────────────────────────────
 *
 * `repro-tonos-sla.mjs` escribe el HTML a mano, y eso lo deja expuesto al único
 * fallo que una reproducción no puede permitirse: que el espejo y la pantalla se
 * separen sin que nada avise. Esto no transcribe marcado — importa el COMPONENTE
 * REAL (`TarjetaCuenta`) y lo pinta con `renderToStaticMarkup`. El día que
 * alguien cambie el armado, esta reproducción cambia con él o deja de compilar.
 * [[feedback-verificar-antes-asegurar]]
 *
 * ── LO QUE ESTO SÍ PRUEBA Y LO QUE NO ─────────────────────────────────────
 *
 * Prueba el ARMADO: que el nombre y el importe salen UNA vez, que las N alertas
 * siguen enteras dentro, que el filo es el del peor nivel, que la pastilla de
 * conteo no aparece cuando sobra, y que todo eso se lee sobre el panel oscuro de
 * /alertas.
 *
 * NO prueba ningún dato. Las filas de abajo están ESCRITAS A MANO para cubrir
 * los cuatro casos de armado y no salen de Supabase. Ninguna cifra de la página
 * es una medición, y la página lo dice en su encabezado: una reproducción que se
 * pueda confundir con el tablero es peor que no tenerla.
 * [[feedback-cero-sin-medicion]]
 *
 * ── POR QUÉ `tsconfig.repro.json` ─────────────────────────────────────────
 *
 * `tsconfig.json` deja el JSX en `preserve` porque de eso se encarga Next; fuera
 * de Next no hay quien lo transforme. El porqué de `react-jsx` y de que sea un
 * archivo y no una bandera está escrito en ese propio `tsconfig.repro.json`.
 */
import * as fs from 'fs'
import * as path from 'path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TarjetaCuenta, type FilaSla } from '@/components/CompromisosSla'
import { agrupaPorCuenta } from '@/lib/agrupa-alertas'
import { PANEL_OSCURO } from '@/lib/sla-tonos'
import type { NivelSemaforo } from '@/lib/alertas-sla'

const RAIZ = path.join(__dirname, '..')
const SALIDA = process.argv[2]
if (!SALIDA) {
  console.error('uso: npm run repro:tarjeta -- <salida.html>')
  process.exit(2)
}

const ORDEN: Record<NivelSemaforo, number> = {
  rojo_intenso: 0, rojo: 1, naranja: 2, amarillo: 3, verde: 4,
  bloqueada: 5, atendida: 6, cerrada: 7,
}

let n = 0
function alerta(cuenta: string, empresa: string, nivel: NivelSemaforo,
                etiquetaNivel: string, titulo: string,
                extra: Partial<FilaSla> = {}): FilaSla {
  return {
    id: `r${++n}`, cuenta_id: cuenta, empresa, consecutivo: cuenta,
    dueno: 'asesor de ejemplo', condicion: 'ejemplo', titulo,
    severidad: 'critica', severidad_base: 'alta',
    ajustes: ['prioritaria_en_su_cartera'], estado: 'abierta',
    generada_en: '2026-11-20', fecha_limite: '2026-11-27', limite_original: null,
    fecha_atendida: null, reprogramaciones: 0, motivo_reprogramacion: null,
    intentos_sin_respuesta: 0, reintento_limite: null, nivel_escalamiento: 0,
    mrr: 316541,
    semaforo: {
      nivel, etiqueta: 'Vence en 1 día hábil', habiles: 1, vencida: false,
      enTiempo: null, orden: ORDEN[nivel], fijada: nivel === 'rojo_intenso',
    },
    etiquetaNivel,
    escalamiento: { nivel: 0, a: '', porque: '' },
    accion_sugerida: 'Llamar. Antes del 27 nov 2026, registrar un seguimiento '
      + 'por un canal real o una reunión con el cliente con el resultado y el '
      + 'próximo paso con fecha.',
    porque: ['Último contacto que llegó al cliente: 2026-09-14, hace 73 días.'],
    cierraAtencion: 'Tu atención se cierra con un seguimiento por un canal real '
      + 'o una reunión con el cliente, registrada en esta misma cuenta.',
    noApagaLaAlerta: 'Eso NO apaga la alerta: la apaga hablar con el cliente. '
      + 'Hasta entonces sigue en la lista, ya atendida.',
    laApaga: null, evidencia_tipo: null, evidencia_resumen: null,
    enlace: `/cuentas/${cuenta}`,
    subutilizacion: false, jugada: null,
    ...extra,
  }
}

const CASOS: Array<[string, FilaSla[]]> = [
  ['TRES ALERTAS DE UNA CUENTA — el apilado que dirección señaló el 26 nov', [
    alerta('D1', 'GRUPO TORRES CORZO', 'rojo_intenso', 'INCUMPLIDA',
           'Más de 60 días sin contacto'),
    alerta('D1', 'GRUPO TORRES CORZO', 'amarillo', 'Por vencer',
           'Arrastra tickets vencidos corte tras corte'),
    alerta('D1', 'GRUPO TORRES CORZO', 'verde', 'En tiempo',
           'Miles de llamadas entrantes sin respuesta'),
  ]],
  ['UNA SOLA ALERTA — sin pastilla de conteo y sin desglose', [
    alerta('C17', 'AGUA INMACULADA', 'naranja', 'Vence hoy',
           'Más de 60 días sin contacto'),
  ]],
  ['CON LA JUGADA DE REDIMENSIONAR, dentro de una tarjeta de dos', [
    alerta('F6', 'AZYCO', 'rojo', 'Vencida', 'Paga mucho más de lo que usa', {
      subutilizacion: true,
      jugada: {
        medible: true, mesesMirados: 3, mesPico: '2026-09', picoMin: 3893,
        baseMin: 24000, pctPico: 16, bolsaObjetivo: 4900, sobranMin: 19100,
        producto: 'Callpicker Chat', porQueEseProducto: '', ademas: null,
        texto: 'Usa el 16% de sus 24,000 min (pico de 3 meses: 3,893 min en '
          + '2026-09). Su tráfico cabe en 4 extensiones de las 16 que paga. '
          + 'OJO: una extensión es un PUESTO, no una bolsa.',
      },
    }),
    alerta('F6', 'AZYCO', 'amarillo', 'Por vencer', 'Sin reunión en el trimestre'),
  ]],
  ['IMPORTES DISCREPANTES — se DICE, en vez de elegir uno en silencio', [
    alerta('D3', 'SALUD Y HOGAR', 'rojo', 'Vencida', 'Caída de consumo',
           { mrr: 23480 }),
    alerta('D3', 'SALUD Y HOGAR', 'verde', 'En tiempo',
           'Solicitud de cancelación', { mrr: 32026 }),
  ]],
]

/* Las reglas REALES de globals.css que pisan el color. Se EXTRAEN del archivo,
   no se transcriben: transcribirlas es lo que hace que la reproducción pase y
   la pantalla siga rota. */
const css = fs.readFileSync(path.join(RAIZ, 'app/globals.css'), 'utf8')
const reglas = css.split('}').filter(b => /\.cp-card|\.cp-light/.test(b))
  .map(b => b + '}').join('\n')

const bloques = CASOS.map(([rotulo, filas]) => {
  const g = agrupaPorCuenta(filas)[0]
  const html = renderToStaticMarkup(createElement(TarjetaCuenta, {
    grupo: g, superficie: 'oscura', rol: 'admin', hecho: () => {},
  }))
  return `<h2>${rotulo}</h2>\n<div class="cp-card">${html}</div>`
}).join('\n')

fs.writeFileSync(SALIDA, `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<title>Reproducción · tarjeta por cuenta</title>
<style>
  body { background:#0A1322; color:#E8EEF6; margin:0; padding:24px;
         font-family:system-ui,-apple-system,sans-serif; }
  h1 { font-size:18px; margin:0 0 4px; }
  .aviso { color:#F6C66B; font-size:12.5px; margin:0 0 20px; line-height:1.6;
           max-width:70ch; }
  h2 { font-size:11px; letter-spacing:.4px; color:#93A4B8; font-weight:700;
       margin:26px 0 8px; }
  .cp-card { background:${PANEL_OSCURO}; border-radius:12px; }
  ${reglas}
</style></head><body>
<h1>Tarjeta por cuenta — reproducción de ARMADO</h1>
<p class="aviso">NINGUNA CIFRA DE ESTA PÁGINA ES UNA MEDICIÓN. Las filas están
escritas a mano para cubrir los cuatro casos de armado; los nombres, los
importes y las fechas son de ejemplo. Lo que se mira aquí es la composición y el
contraste, no el dato. El componente sí es el de producción.</p>
${bloques}
</body></html>
`)

console.log('')
console.log(`  escrito: ${SALIDA}`)
console.log(`  ${CASOS.length} casos de armado, con el componente REAL`)
console.log('')
