/**
 * LA JUGADA DE REDIMENSIONAR, PROBADA CON LO QUE **NO** DEBE SALIR
 *
 * Esta recomendación se le pone delante al asesor con números, y el asesor la
 * lleva a una llamada con el cliente. Un decimal mal aquí no es un bug de
 * pantalla: es una propuesta comercial equivocada dicha en voz alta.
 *
 * Así que casi todo lo de aquí son negaciones:
 *
 *   · un plan sin minutos medibles NO produce un porcentaje —produce la
 *     palabra «desconocido»—, porque un 0% inventado es la acusación de desuso
 *     más cara que esta cartera sabe fabricar [[feedback-cero-sin-medicion]];
 *   · el pico es el MÁS ALTO de los tres, y un mes flojo al final NO baja la
 *     bolsa propuesta;
 *   · un pico de hace cinco meses NO entra: la ventana es de tres;
 *   · la base es la del corte MÁS RECIENTE, no la del mes del pico —si no, se
 *     propondría sobre el plan de hace un trimestre—;
 *   · una cuenta que SÍ se come su plan no recibe «le sobra»;
 *   · sin importe medido NO se escribe «$0».
 *
 * [[feedback-probar-al-reves]]
 */
import {
  jugadaDeRedimension, HOLGURA, MESES_DEL_PICO,
  type InsumosRedimension, type MesDeConsumo,
} from '../lib/redimensionar'

let fallos = 0
let corridas = 0
function check(ok: boolean, que: string) {
  corridas++
  if (ok) { console.log(`  ok     ${que}`) }
  else { fallos++; console.log(`  FALLA  ${que}`) }
}

const mes = (m: string, cons: number, base: number | null = 3000,
             origen: MesDeConsumo['origenBase'] = 'bolsa'): MesDeConsumo =>
  ({ mes: m, cons, base, origenBase: origen })

const base = (p: Partial<InsumosRedimension> = {}): InsumosRedimension => ({
  mrr: 18953, meses: [], plan: 'Visibilidad y Control 3,000 minutos',
  tieneCE: false, tieneVyC: true, tieneChat: false, tieneAV: false,
  tieneAPI: false, ...p,
})

console.log('')
console.log('  LOS PARÁMETROS QUE DIRECCIÓN FIJÓ')
console.log('  ' + '-'.repeat(68))
check(HOLGURA === 1.25, 'la holgura es 25% sobre el pico')
check(MESES_DEL_PICO === 3, 'la ventana del pico son 3 meses')

console.log('')
console.log('  LO QUE NO SE PUEDE MEDIR NO SE RECOMIENDA')
console.log('  ' + '-'.repeat(68))

const sinCortes = jugadaDeRedimension(base())
check(sinCortes.medible === false, 'sin cortes: no es medible')
check(!/\d+%/.test(sinCortes.texto),
      'sin cortes: el texto NO inventa un porcentaje')

const sinBase = jugadaDeRedimension(base({
  meses: [mes('2026-10', 120, null, 'sin_medicion'),
          mes('2026-09', 90, null, 'sin_medicion')],
}))
check(sinBase.medible === false, 'plan sin minutos medibles: no es medible')
check(/DESCONOCIDO/.test(sinBase.texto),
      'plan sin minutos medibles: dice DESCONOCIDO con todas sus letras')
check(!/\b0%|\b0 min/.test(sinBase.texto),
      'plan sin minutos medibles: NO escribe un 0 como si fuera medición')

/* Un solo corte medible entre dos que no lo son: se usa ése y se dice sobre
   cuántos meses se miró. Si el conteo mintiera, el asesor creería que la
   recomendación mira un trimestre cuando mira un mes. */
const unoSolo = jugadaDeRedimension(base({
  meses: [mes('2026-10', 240), mes('2026-09', 100, null, 'sin_medicion'),
          mes('2026-08', 100, null, 'sin_medicion')],
}))
check(unoSolo.medible === true, 'un corte medible basta para dimensionar')
check(unoSolo.medible === true && unoSolo.mesesMirados === 1,
      'y publica que miró UN mes, no tres')
check(unoSolo.medible === true && /pico de 1 mes:/.test(unoSolo.texto),
      'el texto dice «1 mes», en singular y sin mentir el número')

console.log('')
console.log('  EL PICO ES EL MÁS ALTO, NO EL ÚLTIMO')
console.log('  ' + '-'.repeat(68))

/* El orden de entrada es deliberadamente el contrario al cronológico: si la
   función se fiara del orden recibido, este caso la delataría. */
const picoEnMedio = jugadaDeRedimension(base({
  meses: [mes('2026-08', 400), mes('2026-10', 150), mes('2026-09', 900)],
}))
check(picoEnMedio.medible === true && picoEnMedio.picoMin === 900,
      'el pico es 900 aunque el último mes sea 150')
check(picoEnMedio.medible === true && picoEnMedio.mesPico === '2026-09',
      'y publica en QUÉ mes fue el pico')
check(picoEnMedio.medible === true && picoEnMedio.bolsaObjetivo === 1200,
      '900 × 1.25 = 1,125 → sube al escalón de 1,200')
check(picoEnMedio.medible === true && picoEnMedio.sobranMin === 1800,
      'sobran 3,000 − 1,200 = 1,800 min')

/* La trampa cara: si la ventana no se respetara, este pico viejo bajaría la
   propuesta a la mitad y el cliente se quedaría corto el mes que repita. */
const picoViejo = jugadaDeRedimension(base({
  meses: [mes('2026-10', 200), mes('2026-09', 220), mes('2026-08', 210),
          mes('2026-06', 2800)],
}))
check(picoViejo.medible === true && picoViejo.picoMin === 220,
      'un pico de hace 5 meses NO entra: la ventana son 3')

/* La base del corte RECIENTE, no la del mes del pico: el cliente ya cambió de
   plan y proponer sobre el viejo sería proponer sobre algo que no tiene. */
const cambioDePlan = jugadaDeRedimension(base({
  meses: [mes('2026-10', 300, 2000), mes('2026-09', 500, 8000)],
}))
check(cambioDePlan.medible === true && cambioDePlan.baseMin === 2000,
      'la base es la del corte más reciente (2,000), no la del mes del pico')
check(cambioDePlan.medible === true && cambioDePlan.picoMin === 500,
      'pero el pico sí sale del mes alto (500)')

console.log('')
console.log('  QUIEN SÍ SE COME SU PLAN NO RECIBE «LE SOBRA»')
console.log('  ' + '-'.repeat(68))

const alDia = jugadaDeRedimension(base({
  meses: [mes('2026-10', 900), mes('2026-09', 2600), mes('2026-08', 1200)],
}))
check(alDia.medible === false,
      '2,600 × 1.25 = 3,250 > 3,000: NO se le propone bajar')
check(alDia.medible === false && /estacionalidad/.test(alDia.texto),
      'y se le explica que el mes flojo es estacionalidad, no subutilización')

/* El borde exacto: el pico con holgura cae JUSTO en la base. No sobra nada, y
   «sobran 0 min» sería una propuesta vacía presentada como propuesta. */
const justo = jugadaDeRedimension(base({
  meses: [mes('2026-10', 2400, 3000)],
}))
check(justo.medible === false,
      'borde: 2,400 × 1.25 = 3,000 = la base → no sobra, no se propone')

console.log('')
console.log('  UN PLAN POR EXTENSIONES SE BAJA EN EXTENSIONES')
console.log('  ' + '-'.repeat(68))

/* 57 de las 224 cuentas de la escalera tienen plan por extensiones. Decirle
   «bájale a 4,900 min» a quien compró 16 extensiones no es una jugada que
   exista en la lista de precios. */
const porExt = jugadaDeRedimension(base({
  meses: [{ mes: '2026-10', cons: 3893, base: 24000,
            origenBase: 'extensiones', extensiones: 16 }],
  plan: '16 Extensiones Comunicación Empresarial IL',
}))
check(porExt.medible === true && porExt.extensionesHoy === 16,
      'plan por extensiones: publica las 16 que tiene hoy')
check(porExt.medible === true && porExt.extensionesObjetivo === 4,
      '3,893 × 1.25 = 4,867 → escalón 4,900 → 4 extensiones (4 × 1,500 = 6,000)')
check(porExt.medible === true && /cabe en 4 extensiones/.test(porExt.texto),
      'y el texto habla de EXTENSIONES, no de minutos sueltos')
check(porExt.medible === true && !/Bolsa a la medida/.test(porExt.texto),
      'un plan por extensiones NO recibe la frase de la bolsa')
check(porExt.medible === true && /de las 16 que paga/.test(porExt.texto),
      'y dice contra cuántas: el número solo no significa nada')

/* UNA EXTENSIÓN ES UN PUESTO. Aquí se publicaba «de 41 a 1 extensión» para una
   empresa de 41 personas con teléfono. Que hablen poco no significa que sobren
   40 empleados, y un asesor que lleve eso a una llamada queda en ridículo. */
const extremo = jugadaDeRedimension(base({
  meses: [{ mes: '2026-10', cons: 983, base: 61500,
            origenBase: 'extensiones', extensiones: 41 }],
}))
check(extremo.medible === true && !/de 41 a 1/.test(extremo.texto),
      'NO se publica «de 41 a 1»: eso no es dimensionar, es apagar la empresa')
check(extremo.medible === true && /PUESTO/.test(extremo.texto),
      'se dice que una extensión es un puesto, no una bolsa')
check(extremo.medible === true && /en uso/.test(extremo.texto),
      'y que el dato que falta es cuántas están realmente en uso')
check(extremo.medible === true && extremo.extensionesObjetivo === 1,
      'el número se calcula igual —es el tráfico— pero no se presenta como la jugada')

const porBolsa = jugadaDeRedimension(base({
  meses: [{ mes: '2026-10', cons: 900, base: 3000, origenBase: 'bolsa' }],
}))
check(porBolsa.medible === true && porBolsa.extensionesHoy === null,
      'plan de bolsa: no se inventan extensiones')
check(porBolsa.medible === true && /Bolsa a la medida/.test(porBolsa.texto),
      'y sí recibe la frase de la bolsa')

/* `origenBase: 'extensiones'` sin saber CUÁNTAS no se puede convertir, y
   redondear a ojo daría una propuesta comercial falsa. Cae a la bolsa. */
const extSinNumero = jugadaDeRedimension(base({
  meses: [{ mes: '2026-10', cons: 900, base: 3000,
            origenBase: 'extensiones', extensiones: null }],
}))
check(extSinNumero.medible === true && extSinNumero.extensionesObjetivo === null,
      'extensiones sin número: NO se inventa cuántas')

console.log('')
console.log('  QUÉ PRODUCTO, Y POR QUÉ ESE')
console.log('  ' + '-'.repeat(68))

const tres = [mes('2026-10', 240)]

const sinChat = jugadaDeRedimension(base({ meses: tres, tieneChat: false }))
check(sinChat.medible === true && sinChat.producto === 'Callpicker Chat',
      'sin Chat: Chat primero — es el canal que NO consume minutos')

const conChatCE = jugadaDeRedimension(base({
  meses: tres, tieneChat: true, tieneCE: true, tieneVyC: false,
}))
check(conChatCE.medible === true && conChatCE.producto === 'Visibilidad y Control',
      'con Chat y en CE: la subida de plataforma')

const conChatVyC = jugadaDeRedimension(base({
  meses: tres, tieneChat: true, tieneVyC: true, tieneAV: false,
}))
check(conChatVyC.medible === true && conChatVyC.producto === 'Asistente Virtual',
      'con Chat y ya en VyC: Asistente Virtual')

const soloFaltaApi = jugadaDeRedimension(base({
  meses: tres, tieneChat: true, tieneVyC: true, tieneAV: true, tieneAPI: false,
}))
check(soloFaltaApi.medible === true
      && soloFaltaApi.producto === 'Integración CRM con API',
      'sólo falta la API: la integración va al final, no al principio')

const todoElCatalogo = jugadaDeRedimension(base({
  meses: tres, tieneChat: true, tieneVyC: true, tieneAV: true, tieneAPI: true,
}))
check(todoElCatalogo.medible === true
      && /ningún producto nuevo/.test(todoElCatalogo.producto),
      'con todo el catálogo: NO se inventa un producto que no existe')
check(todoElCatalogo.medible === true && /a la mesa/.test(todoElCatalogo.porQueEseProducto),
      'y se dice que el ajuste de MRR no lo decide el asesor')

/* NO CONSTA ≠ NO TIENE. Una cuenta que no está en la escalera llega con los
   cinco flags nulos, y el defecto natural sería ofrecerle Chat «porque no
   consta que lo tenga». El asesor se enteraría delante del cliente. */
const noConsta = jugadaDeRedimension(base({
  meses: tres, tieneCE: null, tieneVyC: null, tieneChat: null,
  tieneAV: null, tieneAPI: null,
}))
check(noConsta.medible === true && noConsta.producto === 'producto por confirmar',
      'sin datos de producto: NO se le ofrece Chat a ciegas')
check(noConsta.medible === true && /no consta/.test(noConsta.porQueEseProducto),
      'y se dice que no consta, en vez de callarlo')
check(noConsta.medible === true && !/Callpicker Chat/.test(noConsta.texto),
      'el texto NO nombra un producto concreto que no se pudo verificar')

/* El MIX que pidió dirección: cuando además de Chat toca subir de plataforma,
   la frase lleva los dos movimientos, no sólo el primero. */
const mix = jugadaDeRedimension(base({
  meses: tres, tieneChat: false, tieneCE: true, tieneVyC: false,
}))
check(mix.medible === true && mix.ademas !== null,
      'sin Chat y en CE: la jugada lleva DOS movimientos (el mix)')
check(mix.medible === true && /y además/.test(mix.texto),
      'y los dos salen en el texto, no sólo el primero')

console.log('')
console.log('  EL DINERO NO SE INVENTA')
console.log('  ' + '-'.repeat(68))

const sinImporte = jugadaDeRedimension(base({ meses: tres, mrr: null }))
check(sinImporte.medible === true && !/\$0\b/.test(sinImporte.texto),
      'sin importe medido: NO escribe «$0»')
check(sinImporte.medible === true && /No hay importe medido/.test(sinImporte.texto),
      'sin importe medido: lo dice con palabras y pide confirmarlo')

const conImporte = jugadaDeRedimension(base({ meses: tres, mrr: 18953 }))
check(conImporte.medible === true && /\$18,953/.test(conImporte.texto),
      'con importe: lo escribe con separador de miles')

/* EL PORCENTAJE DEL OBJETIVO ES EL DE ESTA CUENTA. Aquí estuvo escrito un «8%»
   fijo —el de la cuenta con la que se redactó la frase— y salía igual en las
   104 propuestas. Dos cuentas con consumos muy distintos tienen que dar dos
   frases distintas, y eso es lo que se comprueba. */
const ochoPorCiento = jugadaDeRedimension(base({ meses: [mes('2026-10', 240, 3000)] }))
const cuarenta = jugadaDeRedimension(base({ meses: [mes('2026-10', 1200, 3000)] }))
check(ochoPorCiento.medible === true && /no en el 8% de lo que paga hoy/.test(ochoPorCiento.texto),
      'el objetivo cita el 8% cuando la cuenta usa el 8%')
check(cuarenta.medible === true && /no en el 40% de lo que paga hoy/.test(cuarenta.texto),
      'y el 40% cuando usa el 40% — el número NO está pegado')
check(cuarenta.medible === true && !/el 8% de/.test(cuarenta.texto),
      'una cuenta al 40% no arrastra el 8% de la otra')

console.log('')
console.log('  ' + '='.repeat(68))
if (fallos === 0) {
  console.log(`  TODO EN VERDE — ${corridas} comprobaciones.`)
  console.log('')
  console.log('  LO QUE ESTO **NO** PRUEBA: que los cortes que alimentan esta')
  console.log('  función sean los correctos. Eso lo mide')
  console.log('  `scripts/mide-oferta-plan-sobrado.py` contra datos reales.')
} else {
  console.log(`  ${fallos} FALLA(S) de ${corridas}.`)
}
console.log('')
process.exit(fallos === 0 ? 0 : 1)
