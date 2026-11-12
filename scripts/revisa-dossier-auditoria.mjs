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

console.log('')
if (fallan) {
  console.log(`  *** ${fallan} frase(s) se quedaron fuera de lo que ve Atlas. ***`)
  console.log('  No se arregla subiendo el límite del dossier: se arregla poniendo')
  console.log('  arriba lo que cambia una decisión. El detalle operativo se lee en')
  console.log('  la ficha; el modelo necesita lo que le impide equivocarse.')
} else if (exigidas) {
  console.log(`  Las ${exigidas.length} frases obligatorias entran en el dossier.`)
}
console.log('')
process.exit(fallan ? 1 : 0)
