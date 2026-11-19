/**
 * QUÉ VE ATLAS DE UNA AUDITORÍA — Y QUÉ SE QUEDA FUERA
 * ====================================================
 *
 *     node scripts/revisa-dossier-auditoria.mjs [id-del-caso]
 *
 * El expediente de una auditoría tiene diez o quince hallazgos y se lee entero
 * en la pantalla. **El dossier que recibe el modelo NO los lleva todos**:
 * `lib/atlas-context.ts` toma los primeros N y recorta cada uno a M
 * caracteres. Lo que cae fuera del corte existe para una persona y no existe
 * para Atlas, y nada falla cuando eso pasa.
 *
 * Eso convierte el ORDEN de la lista en una decisión de producto: lo que va
 * arriba es lo que el modelo sabe. Un hallazgo que dice «no cites esta cifra»
 * colocado en el puesto 10 no protege de nada.
 * [[feedback-contexto-ia-sin-huecos]]
 *
 * Este guion imprime literalmente lo que entra en el dossier y comprueba que
 * las frases que CAMBIAN UNA DECISIÓN sigan dentro del corte.
 *
 * LOS LÍMITES SE LEEN DE `lib/atlas-context.ts`, NO SE TECLEAN AQUÍ.
 * Si alguien baja el corte de 4 a 2 hallazgos, este guion tiene que empezar a
 * medir con 2 — un espejo tecleado a mano deja de ser espejo, y éste daría
 * verde mientras la mitad de lo que mide ya no llega.
 * [[feedback-verificar-antes-asegurar]]
 */
import jitiPkg from 'jiti'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const crear = jitiPkg.createJiti ?? jitiPkg
const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const jiti = crear(fileURLToPath(import.meta.url), { alias: { '@': RAIZ } })

/* Las frases que tienen que sobrevivir al corte, por caso. Una frase aquí no
   es decoración: es algo que cambia lo que Atlas respondería si no lo supiera.
   Se busca en minúsculas y sin acentos para no fallar por una tilde. */
const EXIGIDO = {
  /* SALUD Y HOGAR. Las dos primeras existen para que el modelo NO repita lo
     que dice el documento entregado: su titular de factura es de junio, y su
     hallazgo 2 CRÍTICO es un cobro que ya se dio de baja. Si cualquiera de las
     dos cae del corte, Atlas vuelve a decir «$32,026» y «el Voicebot se cobra
     sin uso», que es exactamente lo que se corrigió. */
  'salud-y-hogar': [
    ['$23,480',          'el MRR vigente; sin esto Atlas cita los $32,026 de junio'],
    ['no $32,026',       'la cifra que NO se debe citar, dicha como prohibición'],
    ['cobro del voicebot: ya no se factura',
                         'para que nadie le plantee al cliente un cargo inexistente'],
    ['desarrollo propio','el mecanismo real de churn, que el documento no recoge'],
    ['−39%',             'la contracción medida entre meses completos'],
    ['no de −68%',       'la lectura vieja, que comparaba 17 días contra 31'],
  ],
  /* CINTAS COVE. Aquí la frase que más importa no es una cifra: es el MARCO.
     Esta cuenta MEJORÓ sola entre julio y noviembre —la atención por agente se
     triplicó y el outbound se multiplicó por diez sin que nosotros tocáramos
     nada—, y `lib/seguimiento-auditoria.ts` mete los TRES primeros hallazgos
     enteros en la actividad que el asesor lee ANTES de llamar. Si «MEJORÓ sola»
     cae del corte, el asesor entra a señalar fallos a un cliente que acaba de
     corregir su operación, que es la peor llamada posible y además se le nota. */
  'cintascove': [
    ['$13,560',            'el MRR institucional del GRC; sin esto se cita la columna mala'],
    ['no $13,965',         'la cifra que NO se debe citar, dicha como prohibición'],
    ['mejoró sola',        'el marco de la llamada: reconocer antes de recomendar'],
    ['56.2%',              'la atención del último mes COMPLETO, no la del parcial'],
    ['no citar «11.0% en noviembre»',
                           'la cifra refutable: 17 días y 118 llamadas no son un mes'],
    ['20.3%',              'el cierre de la serie entre meses completos'],
  ],
  /* MEDICALL EXPERT. El caso donde la frase obligatoria no protege de lo que
     dice el cliente, sino de lo que decíamos NOSOTROS: el reporte de noviembre
     reprodujo literalmente el párrafo de alarma de julio, con el MRR, la
     antigüedad, los tickets y el «cero seguimiento KAM» de hace cuatro meses.
     Si esas prohibiciones caen del corte, Atlas vuelve a servir las seis
     cifras vencidas al asesor que está por llamar. Y la del 70% importa igual:
     es la cifra más citable del documento y es la que el cliente puede
     refutar con su propio calendario. */
  'medicall-expert': [
    ['$8,067',        'el MRR del GRC; sin esto Atlas cita los $6,831 de julio'],
    ['no $6,831',     'la cifra que NO se debe citar, dicha como prohibición'],
    ['869 dias',      'la antigüedad vigente; 753 caían el 24 de julio'],
    ['kam no es cero','la afirmación falsa más repetida del documento'],
    ['57.9%',         'el hallazgo central, que sí se sostiene'],
    ['no citar la ficha vieja',
                      'el encabezado que ordena las otras cinco prohibiciones'],
  ],
  /* CASA GALVÁN. Las cuatro frases son las que cambian la llamada. «NO es falta
     de gente» es la tesis entera: si cae, Atlas entrega un reporte de 3,230
     llamadas perdidas y el asesor entra a pedir que contraten. «1,411» es el
     motivo de reunión y lo único que rompe el silencio de un interlocutor
     único. «15 ago 2026» impide presentar como hallazgo de esta semana un
     riesgo que llevamos tres meses sabiendo —y que el cliente puede comprobar—.
     Y «Health Score 50, no 76» es la cifra que el BORRADOR de este mismo
     reporte traía mal: sin la prohibición, vuelve a circular. */
  'casa-galvan': [
    ['no es falta de gente', 'la tesis; sin ella el asesor va a pedir que contraten'],
    ['65.6%',                'la proporción que sostiene la tesis'],
    ['1,411',                'el motivo de reunión, y lo que rompe el silencio'],
    ['15 ago 2026',          'que el riesgo de interlocutor no es de esta semana'],
    ['health score 50, no 76',
                             'la cifra que el borrador traía mal, dicha como prohibición'],
  ],
  /* CARGO LIFT. Aquí el peligro no es una cifra mala: es el MARCO. Esta cuenta
     MEJORÓ su atención —la pérdida bajó de 10.4% a 6.5%— y a la vez perdió la
     mitad de su demanda, y `lib/seguimiento-auditoria.ts` mete los TRES
     primeros hallazgos enteros en la actividad que el asesor lee ANTES de
     llamar. Si «no felicitar la mejora» cae del corte, el asesor entra a
     celebrar un número que mejoró en parte porque hay menos tráfico, delante
     de un cliente que perdió la mitad de sus llamadas entrantes. «157» es lo
     que vuelve esto un pedido perdido y no una estadística. Y las dos últimas
     protegen de lo que decíamos NOSOTROS: el reporte de tráfico no menciona la
     alerta crítica de downgrade, y la versión 1.0 de este expediente llevaba
     el MRR de `cuentas.facturacion` —$7,609 por debajo del real—. */
  'cargo-lift': [
    ['no felicitar la mejora', 'el marco de la llamada: la tasa mejoró porque entra menos'],
    ['53% por día hábil',      'la caída de demanda, que es el riesgo real'],
    ['6.8%',                   'la devolución: el indicador con más distancia a su meta'],
    ['157',                    'los primeros contactos perdidos, que es el pedido que se fue'],
    ['downgrade en 6 meses',   'la alerta crítica que el reporte de tráfico no menciona'],
    ['no $10,655',             'la cifra que la versión 1.0 traía mal, dicha como prohibición'],
  ],
  /* LINEACEL — lo que NO puede caerse del corte de 180.
     La ficha del tablero dice $13,802 y el GRC vivo factura $37,222: si el
     modelo se queda con el de la ficha, aconseja sobre una cuenta que vale
     menos de la mitad. «72 días» es lo que convierte el silencio en una
     reunión con fecha. «98.7%» es el arreglo gratis —campañas marcando sin
     agentes conectados—, y «50.6%» es la caída de conexión con el volumen
     clavado: sin ese par, el hallazgo se lee como falta de capacidad. */
  'lineacel': [
    ['$37,222',   'el MRR institucional vivo, que la ficha tiene al 37%'],
    ['no los $13,802', 'la cifra de la ficha, dicha como prohibición'],
    ['72 días',   'el silencio que convierte el hallazgo en una reunión'],
    ['50.6%',     'la caída de conexión con el volumen clavado'],
    ['98.7%',     'las campañas marcando sin agentes: el arreglo gratis'],
  ],
  /* ODONTOPREV — el cargo de Meta y la bolsa propia.
     «$10,740.10» es la PRIMERA incidencia de pago en 28 meses y es lo que
     abrió la conversación: sin ella el modelo describe una cuenta sana.
     «346%» es la mitad que nos toca y que el reporte entregado no menciona;
     sin «lectura» / «no es desuso», un cero de chat se lee como abandono y
     el consejo sale al revés. Y el par 42.47% / 1.37% es lo que hace que el
     enrutamiento roto se lea como configuración y no como capacidad. */
  'odontoprev': [
    ['$10,740.10', 'el cargo nuevo de WhatsApp: la primera incidencia en 28 meses'],
    ['28 meses',   'que es la PRIMERA, que es lo que la vuelve grave'],
    ['346%',       'la bolsa propia rebasada, que el reporte no menciona'],
    ['no es desuso', 'que el cero del chat es una lectura fallida, no abandono'],
    ['42.47%',     'la concentración de las pérdidas en una extensión'],
    ['1.37%',      'el volumen de esa extensión: por eso es configuración'],
  ],
  'hospital-santa-rosa': [
    ['no presentar al cliente', 'que la cuenta no está lista para una presentación'],
    ['sin_interlocutor',        'la alerta crítica que contradice al reporte'],
    ['ningun indicador mejoro', 'que en cuatro meses no se movió nada'],
    ['no cites',                'la prohibición de citar el desglose de autoservicio'],
    ['1,483',                   'la cifra que destapa que el desglose no cierra'],
  ],
}

const plano = (s) => String(s)
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+/g, ' ').toLowerCase()

/** Lee del propio `atlas-context.ts` cuántos hallazgos entran y a cuánto se
 *  recortan. Si el patrón deja de encontrarse, eso es el hallazgo. */
function limitesDeAtlas() {
  const txt = fs.readFileSync(path.join(RAIZ, 'lib', 'atlas-context.ts'), 'utf8')
  const m = txt.match(
    /auditoria\.hallazgos\s*\.slice\(\s*0\s*,\s*(\d+)\s*\)[\s\S]{0,200}?\.slice\(\s*0\s*,\s*(\d+)\s*\)/)
  if (!m) {
    console.log('')
    console.log('  *** No pude leer de lib/atlas-context.ts cuántos hallazgos entran')
    console.log('      en el dossier ni a cuánto se recortan.')
    console.log('')
    console.log('      Puede que el bloque se reescribiera. NO se asume un valor por')
    console.log('      omisión: medir con un límite inventado daría un verde que no')
    console.log('      corresponde a lo que el modelo recibe de verdad.')
    process.exit(2)
  }
  return { cuantos: parseInt(m[1], 10), corte: parseInt(m[2], 10) }
}

const idPedido = process.argv[2] || 'hospital-santa-rosa'

const { STATIC_CASES } = await jiti.import(path.join(RAIZ, 'app/auditoria/cases.ts'))
const caso = STATIC_CASES.find((c) => c.id === idPedido)
if (!caso) {
  console.log(`\n  *** No existe el caso «${idPedido}». ***`)
  console.log('      Casos: ' + STATIC_CASES.map((c) => c.id).join(', '))
  process.exit(2)
}

/** Un `[[enlace-de-memoria]]` dentro de un hallazgo NO se queda en el código:
 *  `AuditoriaDetail.tsx` lo pinta literal en una pantalla que lee Dirección
 *  General, y `atlas-context.ts` lo mete en el dossier, donde el modelo puede
 *  repetirlo delante del asesor. La convención es nuestra y vive en los
 *  comentarios; en los textos que se renderizan, no. Se mide sobre TODOS los
 *  casos, no sólo sobre el que se está revisando: si un día aparece en otro
 *  expediente, este guion lo dice sin que nadie lo busque. */
function fugasDeConvencion(casos) {
  const fugas = []
  for (const c of casos) {
    (c.hallazgos ?? []).forEach((h, i) => {
      const m = String(h).match(/\[\[[^\]]+\]\]/g)
      if (m) fugas.push(`${c.id} · hallazgo ${i + 1}: ${m.join(' ')}`)
    })
  }
  return fugas
}

const { cuantos, corte } = limitesDeAtlas()
const total = caso.hallazgos?.length ?? 0
const entran = (caso.hallazgos ?? []).slice(0, cuantos)
    .map((h) => h.replace(/\s+/g, ' ').slice(0, corte))
const fuera = (caso.hallazgos ?? []).slice(cuantos)

console.log('')
console.log(`  DOSSIER DE ATLAS — «${caso.nombre}» (${caso.id})`)
console.log(`  Límites leídos de lib/atlas-context.ts: ${cuantos} hallazgos, ${corte} caracteres cada uno.`)
console.log('')
console.log(`  LO QUE ATLAS RECIBE (${entran.length} de ${total}):`)
entran.forEach((h, i) => {
  const original = caso.hallazgos[i].replace(/\s+/g, ' ')
  const cortado = original.length > corte
  console.log('')
  console.log(`    ${i + 1}. ${h}${cortado ? ' …[CORTADO]' : ''}`)
  if (cortado) {
    console.log(`       (se pierden ${original.length - corte} caracteres: «…${original.slice(corte, corte + 60)}…»)`)
  }
})

console.log('')
console.log(`  LO QUE NO LE LLEGA (${fuera.length}):`)
if (!fuera.length) console.log('    nada — todos entran.')
fuera.forEach((h, i) => {
  console.log(`    ${cuantos + i + 1}. ${h.replace(/\s+/g, ' ').slice(0, 110)}…`)
})

console.log('')
console.log('  ' + '─'.repeat(70))
const exigidas = EXIGIDO[caso.id]
let fallan = 0
if (!exigidas) {
  console.log(`  Este caso no declara frases obligatorias. El listado de arriba es`)
  console.log(`  informativo: decide tú si lo que queda fuera puede quedar fuera.`)
} else {
  const visto = plano(entran.join(' | '))
  console.log('  FRASES QUE TIENEN QUE SOBREVIVIR AL CORTE:')
  for (const [frase, porque] of exigidas) {
    const ok = visto.includes(plano(frase))
    if (!ok) fallan++
    console.log(`    ${ok ? 'ok  ' : '*** FUERA *** '}«${frase}» — ${porque}`)
  }
}

const fugas = fugasDeConvencion(STATIC_CASES)
console.log('')
console.log(`  ENLACES [[...]] EN TEXTOS QUE SE RENDERIZAN (los ${STATIC_CASES.length} casos):`)
if (!fugas.length) {
  console.log('    ninguno — la convención se queda en los comentarios, como debe.')
} else {
  for (const f of fugas) console.log(`    *** FUGA *** ${f}`)
  console.log('    Esto se pinta literal en /auditoria y entra en el dossier de Atlas.')
  console.log('    El enlace va al comentario de cabecera del archivo, no al hallazgo.')
}

console.log('')
if (fallan) {
  console.log(`  *** ${fallan} frase(s) se quedaron fuera de lo que ve Atlas. ***`)
  console.log('  No se arregla subiendo el límite del dossier: se arregla poniendo')
  console.log('  arriba lo que cambia una decisión. El detalle operativo se lee en')
  console.log('  la ficha; el modelo necesita lo que le impide equivocarse.')
} else if (exigidas) {
  console.log(`  Las ${exigidas.length} frases obligatorias entran en el dossier.`)
}
if (fugas.length) {
  console.log(`  *** Y ${fugas.length} enlace(s) [[...]] se están renderizando en pantalla. ***`)
}
console.log('')
process.exit(fallan || fugas.length ? 1 : 0)
