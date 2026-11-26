/**
 * LAS FRASES QUE EL ASESOR VA A DECIR, CON DATOS REALES
 *
 *   node scripts/repro-jugada-redimension.mjs [cuántas]
 *
 * POR QUÉ ESTO Y NO UNA PRUEBA MÁS
 * --------------------------------
 * `npm run test:redimensionar` comprueba la REGLA con casos inventados, y pasa
 * en verde. Lo que ninguna prueba contesta es si la frase que sale, con los
 * números de una cuenta de verdad, se puede decir en voz alta delante de un
 * cliente. Eso sólo se sabe LEYÉNDOLA. Es el mismo método que destapó el
 * «Vence hoy» impreso dos veces en el correo: el detector no lo vio porque no
 * era un color ni un tipo, era una frase.
 * [[feedback-verificar-antes-asegurar]]
 *
 * LA REGLA SE IMPORTA, NO SE COPIA
 * --------------------------------
 * `jugadaDeRedimension` entra por jiti desde `lib/redimensionar.ts`, y los
 * cortes desde `lib/cortes-cuenta.ts`. Si se reimplantara aquí la aritmética,
 * esto dejaría de reproducir nada el día que la regla cambie.
 *
 * NO IMPRIME CREDENCIALES, y lee `.env.local` sólo para preguntar por la lista
 * de cuentas de la clase.
 */
import jitiPkg from 'jiti'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const CUANTAS = Number(process.argv[2] || 14)

const crear = jitiPkg.createJiti ?? jitiPkg
/* `interopDefault` NO es decoración: `lib/cortes-cuenta.ts` hace
   `(await import('fs')).default`, que en Node nativo da el módulo y bajo jiti
   sin esta bandera da `undefined`. Sin ella la reproducción revienta con
   «Cannot read properties of undefined (reading 'existsSync')» — y la
   tentación entonces es tocar el código de producción para que el guion
   funcione, que es exactamente al revés. */
const jiti = crear(fileURLToPath(import.meta.url),
                   { alias: { '@': RAIZ }, interopDefault: true })

function env(clave) {
  const p = path.join(RAIZ, '.env.local')
  if (!fs.existsSync(p)) return null
  for (const ln of fs.readFileSync(p, 'utf8').split('\n')) {
    const l = ln.trim()
    if (l.startsWith(clave + '=')) return l.slice(clave.length + 1).trim().replace(/^["']|["']$/g, '')
  }
  return null
}

const URL_SB = (env('NEXT_PUBLIC_SUPABASE_URL') || '').replace(/\/$/, '')
const KEY = env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SERVICE_KEY')
if (!URL_SB || !KEY) {
  console.error('  *** faltan credenciales en .env.local: no hay nada que reproducir.')
  process.exit(2)
}

async function trae(tabla, select) {
  const filas = []
  for (let desde = 0; ; desde += 1000) {
    const r = await fetch(`${URL_SB}/rest/v1/${tabla}?select=${select}&limit=1000&offset=${desde}`,
      { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } })
    if (!r.ok) { console.error(`  *** HTTP ${r.status} al leer ${tabla}`); process.exit(1) }
    const lote = await r.json()
    filas.push(...lote)
    if (lote.length < 1000) return filas
  }
}

const { jugadaDeRedimension } = await jiti.import(path.join(RAIZ, 'lib/redimensionar.ts'))
const { todosLosCortes } = await jiti.import(path.join(RAIZ, 'lib/cortes-cuenta.ts'))
const { SUBUTILIZACION } = await jiti.import(path.join(RAIZ, 'lib/redimensionar-cuenta.ts'))
  .catch(() => ({ SUBUTILIZACION: null }))

/* Si el módulo de arriba no se puede importar fuera de Next —arrastra
   supabase—, la lista se escribe aquí y se DICE que es una copia. */
const TIPOS = SUBUTILIZACION
  ? [...SUBUTILIZACION]
  : ['plan_sobrado', 'uso_bajo', 'caida_consumo', 'consumo_cero', 'desplome_consumo']

const esc = JSON.parse(fs.readFileSync(
  path.join(RAIZ, 'data/crecimiento-escalera.json'), 'utf8')).cuentas || []
const porCuenta = new Map(esc.filter(f => f.cuenta_id).map(f => [String(f.cuenta_id), f]))

const sla = await trae('alertas_sla',
  'cuenta_id,tipo,estado,mrr_en_riesgo,empresa,consecutivo')
const cuentas = await trae('cuentas', 'id,cid')
const cidDe = new Map(cuentas.map(c => [String(c.id), c.cid ? String(c.cid) : null]))

const clase = sla.filter(s => TIPOS.includes(s.tipo) && s.estado !== 'cerrada')
const cortes = await todosLosCortes()

console.log('')
console.log('  LAS FRASES, CON DATOS REALES — ' + clase.length + ' de la clase')
console.log('  ' + '='.repeat(72))

const ordenadas = [...clase].sort(
  (a, b) => Number(b.mrr_en_riesgo ?? 0) - Number(a.mrr_en_riesgo ?? 0))

let medibles = 0
const motivos = new Map()

/* EL IMPORTE SALE DEL COMPROMISO, igual que en producción. Leerlo de
   `monto_ultimo_corte` —como hacía la primera versión de esto— hacía que la
   reproducción publicara «sostener los $10 al mes» para Cargo Lift, que
   factura $18,953. Si el guion y la ruta no toman el dato del mismo sitio, la
   reproducción deja de reproducir. */
function jugada(s, f, mios) {
  return jugadaDeRedimension({
    mrr: s.mrr_en_riesgo === null || s.mrr_en_riesgo === undefined
      ? null : Number(s.mrr_en_riesgo),
    plan: f.plan_ultimo_corte ?? (mios[0]?.plan ?? null),
    meses: mios.map(m => ({ mes: m.mes, cons: m.cons, base: m.base, origenBase: m.origenBase, extensiones: m.extensiones })),
    tieneCE: f.tiene_CE ?? null, tieneVyC: f.tiene_VyC ?? null,
    tieneChat: f.tiene_Chat ?? null, tieneAV: f.tiene_AV ?? null,
    tieneAPI: f.tiene_API ?? null,
  })
}

for (const s of ordenadas) {
  const id = String(s.cuenta_id)
  const f = porCuenta.get(id) || {}
  const cid = cidDe.get(id) || f.cid || null
  const mios = cid ? (cortes.get(String(cid)) || []) : []
  const j = jugada(s, f, mios)
  if (j.medible) medibles++
  else motivos.set(j.porque, (motivos.get(j.porque) || 0) + 1)
}

console.log(`  con propuesta calculada: ${medibles} · sin ella: ${clase.length - medibles}`)
for (const [m, n] of [...motivos].sort((a, b) => b[1] - a[1])) {
  console.log(`      ${n} por: ${m}`)
}
console.log('')

for (const s of ordenadas.slice(0, CUANTAS)) {
  const id = String(s.cuenta_id)
  const f = porCuenta.get(id) || {}
  const cid = cidDe.get(id) || f.cid || null
  const mios = cid ? (cortes.get(String(cid)) || []) : []
  const j = jugada(s, f, mios)
  console.log(`  ${s.consecutivo || '?'} · ${s.empresa || '?'} · ${s.tipo}`)
  console.log(`  plan: ${f.plan_ultimo_corte || '(sin plan en la escalera)'}`)
  console.log(`  ${j.medible ? '' : '[SIN PROPUESTA] '}${j.texto}`)
  console.log('  ' + '-'.repeat(72))
}
console.log('')
