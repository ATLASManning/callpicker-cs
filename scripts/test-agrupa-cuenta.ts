/**
 * LA TARJETA POR CUENTA, PROBADA CON LO QUE **NO** DEBE PASAR
 *
 * Agrupar la cola por cliente toca lo único que esta pantalla no puede fallar:
 * qué alertas se ven y en qué orden. Las tres formas de romperla sin que nada
 * reviente son
 *
 *   · PERDER una alerta —la cuenta sale una vez y se lleva dentro sólo la
 *     primera—, que en pantalla se lee igual que «esa alerta ya no existe»;
 *   · REORDENAR la cola al agrupar, y entonces una cuenta con el plan grande
 *     adelanta a una que ya escribió que se va;
 *   · pintar la tarjeta con el nivel de la PRIMERA alerta en vez del PEOR, que
 *     convierte una incumplida en un renglón verde.
 *
 * Las tres pasarían un `tsc` y un `next build` sin una sola queja, así que casi
 * todo lo de aquí son negaciones. [[feedback-probar-al-reves]]
 *
 *   npm run test:agrupa
 */
import { agrupaPorCuenta, peorDe, porNivel } from '../lib/agrupa-alertas'

let fallos = 0
let corridas = 0
function check(ok: boolean, que: string) {
  corridas++
  if (ok) { console.log(`  ok     ${que}`) }
  else { fallos++; console.log(`  FALLA  ${que}`) }
}

/* Los mismos ocho valores de `ORDEN` en `lib/alertas-sla.ts`. Se copian aquí a
   propósito y en un solo sitio: si allá cambian, esta prueba sigue probando lo
   que dice probar —que menor es peor— y no queda atada a importar el módulo de
   Supabase, que no carga fuera de Next. */
const ORDEN = {
  rojo_intenso: 0, rojo: 1, naranja: 2, amarillo: 3, verde: 4,
  bloqueada: 5, atendida: 6, cerrada: 7,
} as const
type Nivel = keyof typeof ORDEN

const ETIQUETA: Record<Nivel, string> = {
  rojo_intenso: 'INCUMPLIDA', rojo: 'Vencida', naranja: 'Vence hoy',
  amarillo: 'Por vencer', verde: 'En tiempo', bloqueada: 'Bloqueada',
  atendida: 'Atendida', cerrada: 'Cerrada',
}

interface Fila {
  id: string
  cuenta_id: string
  etiquetaNivel: string
  semaforo: { nivel: Nivel; orden: number }
}

let n = 0
const fila = (cuenta: string, nivel: Nivel): Fila => ({
  id: `a${++n}`, cuenta_id: cuenta, etiquetaNivel: ETIQUETA[nivel],
  semaforo: { nivel, orden: ORDEN[nivel] },
})

console.log('')
console.log('  NINGUNA ALERTA SE PIERDE AL AGRUPAR')
console.log('  ' + '-'.repeat(68))

const cola: Fila[] = [
  fila('D1', 'rojo_intenso'), fila('D3', 'rojo'), fila('D1', 'naranja'),
  fila('D1', 'verde'), fila('C17', 'naranja'), fila('D3', 'verde'),
]
const grupos = agrupaPorCuenta(cola)

check(grupos.length === 3, 'tres cuentas distintas dan tres tarjetas')
check(grupos.reduce((s, g) => s + g.filas.length, 0) === cola.length,
      `entran ${cola.length} alertas y salen ${cola.length}: el total cierra`)
check(new Set(grupos.flatMap(g => g.filas.map(f => f.id))).size === cola.length,
      'ningún id se repite en dos tarjetas')
check(grupos.every(g => g.filas.every(f => f.cuenta_id === g.cuenta_id)),
      'ninguna alerta cae en la tarjeta de otra cuenta')

/* LA TRAMPA: una cuenta con TRES alertas tiene que traerlas las tres. Un
   `Map.set` sin acumular dejaría una sola y la pantalla no se quejaría. */
const d1 = grupos.find(g => g.cuenta_id === 'D1')
check(d1?.filas.length === 3, 'la cuenta con tres alertas se lleva las tres')

console.log('')
console.log('  AGRUPAR NO REORDENA LA COLA')
console.log('  ' + '-'.repeat(68))

check(grupos.map(g => g.cuenta_id).join(',') === 'D1,D3,C17',
      'cada cuenta toma el sitio de su PRIMERA alerta, no el de la última')
check(d1?.filas.map(f => f.semaforo.nivel).join(',')
        === 'rojo_intenso,naranja,verde',
      'dentro de la tarjeta se conserva el orden en que llegaron')

/* Al revés: una cuenta cuya primera alerta es la MEJOR no debe adelantarse. La
   ruta manda la cola ya ordenada, así que esto sólo comprueba que aquí no se
   vuelva a ordenar por nada. */
const alReves = agrupaPorCuenta([
  fila('X', 'verde'), fila('Y', 'rojo_intenso'), fila('X', 'rojo_intenso'),
])
check(alReves.map(g => g.cuenta_id).join(',') === 'X,Y',
      'NO se reordena por el peor nivel: el orden lo decide la ruta')

console.log('')
console.log('  EL NIVEL DE LA TARJETA ES EL PEOR, NO EL PRIMERO')
console.log('  ' + '-'.repeat(68))

check(peorDe(d1!.filas).semaforo.nivel === 'rojo_intenso',
      'con incumplida, vence hoy y en tiempo, la tarjeta va INCUMPLIDA')
check(peorDe([fila('Z', 'verde'), fila('Z', 'rojo')]).semaforo.nivel === 'rojo',
      'la peor NO tiene que ser la primera')
check(peorDe([fila('Z', 'verde'), fila('Z', 'amarillo'), fila('Z', 'verde')])
        .semaforo.nivel === 'amarillo',
      'sin ninguna vencida, la tarjeta se queda en el peor que SÍ hay')

/* Empate: se queda la primera, que por el orden de la cola es la de más dinero.
   Si `reduce` usara `<=` se quedaría la última y la tarjeta enlazaría a otra
   alerta sin que el color cambiara — invisible. */
const empate = [fila('W', 'rojo'), fila('W', 'rojo')]
check(peorDe(empate).id === empate[0].id,
      'con dos del mismo nivel se queda la PRIMERA')

let reventó = false
try { peorDe([]) } catch { reventó = true }
check(reventó, 'un grupo vacío no devuelve `undefined` en silencio: revienta')

console.log('')
console.log('  EL DESGLOSE POR NIVEL CIERRA')
console.log('  ' + '-'.repeat(68))

const desglose = porNivel(d1!.filas)
check(desglose.reduce((s, v) => s + v.n, 0) === d1!.filas.length,
      'la suma del desglose es el total de la tarjeta, sin cubo «otros»')
check(desglose.map(v => v.nivel).join(',') === 'rojo_intenso,naranja,verde',
      'el desglose sale del peor al mejor')
check(desglose.every(v => v.etiqueta.trim().length > 0),
      'cada conteo lleva su PALABRA: el color nunca va solo')

const repetido = porNivel([fila('Q', 'rojo'), fila('Q', 'rojo'), fila('Q', 'verde')])
check(repetido.length === 2, 'dos del mismo nivel se cuentan en UN renglón')
check(repetido[0].n === 2 && repetido[1].n === 1,
      'y el conteo de ese renglón es 2, no 1')

/* La etiqueta es la de la FILA, no un diccionario de este módulo. Si alguien
   cambiara el rótulo en la ruta, el desglose tiene que cambiar con él. */
const otraPalabra = porNivel([
  { id: 'x', cuenta_id: 'Q', etiquetaNivel: 'Rotulo nuevo',
    semaforo: { nivel: 'rojo' as Nivel, orden: 1 } },
])
check(otraPalabra[0].etiqueta === 'Rotulo nuevo',
      'la palabra sale de la fila, no se vuelve a traducir aquí')

console.log('')
console.log('  LOS BORDES')
console.log('  ' + '-'.repeat(68))

check(agrupaPorCuenta([]).length === 0, 'una cola vacía da cero tarjetas')
const una = agrupaPorCuenta([fila('U', 'verde')])
check(una.length === 1 && una[0].filas.length === 1,
      'una sola alerta sigue siendo una tarjeta de una')

console.log('')
console.log(`  ${corridas - fallos} ok · ${fallos} fallas`)
console.log('')
if (fallos > 0) process.exit(1)
