/**
 * REPORTE DE ACTIVIDAD DE UN USUARIO DEL TABLERO. Solo lectura.
 *
 * Mide, para un correo y una ventana de días:
 *   · su cartera (cuántas cuentas, en qué estado, cuánto MRR)
 *   · su NAVEGACIÓN: qué consultó, en qué apartado, qué día y a qué hora
 *   · lo que CAPTURÓ: seguimientos, actividades y anexos
 *   · sus cuentas de mayor riesgo HOY, y por qué
 *   · a cuáles no ha contactado en más de N días
 *
 * Escribe un JSON; el HTML lo arma `scripts/reporte-actividad-html.mjs`.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * LO QUE ESTE REPORTE **NO** PUEDE DECIR, Y SE DICE CON PALABRAS
 *
 * 1. `reuniones` NO guarda autor. El insert de `app/api/reuniones/route.ts` no
 *    escribe ningún campo de usuario, así que una reunión no se puede atribuir
 *    a nadie. No se cuenta como «lo que capturó Dan»: se declara como no
 *    atribuible. Contarlas por la cartera sería adjudicarle trabajo ajeno.
 *
 * 2. `uso_dashboard` mide NAVEGACIÓN, no trabajo. Que no haya filas de un día
 *    puede ser que no entró, o que entró por un cliente sin el registro, o que
 *    la tabla empezó a llenarse después. Por eso el reporte publica SIEMPRE la
 *    fecha de la fila más antigua de la tabla: si la ventana empieza antes de
 *    esa fecha, los días previos son NO MEDIBLES, no ceros.
 *    [[feedback-cero-sin-medicion]]
 *
 * 3. La duración de una visita la manda el navegador y puede faltar (si el
 *    `sendBeacon` de salida no llegó). Las visitas sin duración se cuentan
 *    aparte y NO entran en ningún promedio.
 *
 * USO
 *     node scripts/reporte-actividad-usuario.mjs <correo> [--dias 7] [--sin-contacto 60]
 */
import jitiPkg from 'jiti'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

const { default: Module } = await import('node:module')
const resolverOriginal = Module._resolveFilename
Module._resolveFilename = function (pedido, ...resto) {
  if (typeof pedido === 'string' && pedido.startsWith('@/')) {
    pedido = path.join(RAIZ, pedido.slice(2))
  }
  return resolverOriginal.call(this, pedido, ...resto)
}
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class { constructor() { throw new Error('sin realtime') } }
}

const crear = jitiPkg.createJiti ?? jitiPkg
const jiti = crear(fileURLToPath(import.meta.url), {
  alias: { '@': RAIZ }, interopDefault: true, esmResolve: true,
})
const { config } = await import('dotenv')
config({ path: path.join(RAIZ, '.env.local'), quiet: true })

const sb    = await jiti.import(path.join(RAIZ, 'lib/supabase.ts'))
const fact  = await jiti.import(path.join(RAIZ, 'lib/facturacion-cuenta.ts'))
const cont  = await jiti.import(path.join(RAIZ, 'lib/contacto-cuenta.ts'))
const topm  = await jiti.import(path.join(RAIZ, 'lib/cuenta-top.ts'))
const fechas = await jiti.import(path.join(RAIZ, 'lib/fecha-local.ts'))

const A = sb.supabaseAdmin
const { mapaFacturacion, importeDeCuenta } = fact
const { ultimoContactoEfectivoPorCuenta, diasSinContacto } = cont
const { isTopCustomer } = topm
const { ahoraEnMexico, hoyEnMexico, ZONA_MEXICO } = fechas

/**
 * LEE UNA TABLA ENTERA, PAGINANDO. Nunca con `.limit(50000)`.
 *
 * PostgREST tiene un tope de filas por respuesta (`max-rows`, 1000 por defecto)
 * y lo aplica EN SILENCIO: pedir `.limit(50000)` devuelve 1,000 filas y ningún
 * aviso. La primera versión de este guion hacía eso ordenando ASCENDENTE, así
 * que se quedó con las MIL MÁS VIEJAS —agosto y principios de septiembre— y
 * concluyó que el registro de navegación llevaba 58 días muerto. Era falso: las
 * filas de noviembre existían y estaban a la vista en la pantalla de Uso
 * Dashboard. Un tope silencioso convierte «no lo leí» en «no existe».
 * [[feedback-verificar-antes-asegurar]] [[feedback-cero-sin-medicion]]
 *
 * Aquí se pagina con `.range()` hasta que una página venga incompleta, y se
 * aborta si se pasa del techo en vez de devolver una lectura recortada.
 */
const PAGINA = 1000
const TECHO = 500000
async function leerTodo(tabla, columnas, afinar) {
  const filas = []
  for (let desde = 0; ; desde += PAGINA) {
    if (desde >= TECHO) {
      throw new Error(`leerTodo(${tabla}): pasé de ${TECHO} filas. No devuelvo una lectura recortada.`)
    }
    let q = A.from(tabla).select(columnas).range(desde, desde + PAGINA - 1)
    if (afinar) q = afinar(q)
    const { data, error } = await q
    if (error) return { filas: null, error }
    filas.push(...(data ?? []))
    if (!data || data.length < PAGINA) break
  }
  return { filas, error: null }
}

const args = process.argv.slice(2)
const CORREO = (args.find(a => !a.startsWith('--')) ?? '').trim().toLowerCase()
const num = (bandera, pordefecto) => {
  const i = args.indexOf(bandera)
  if (i < 0) return pordefecto
  const v = Number(args[i + 1])
  return Number.isFinite(v) && v > 0 ? v : pordefecto
}
const DIAS = num('--dias', 7)
const CORTE_CONTACTO = num('--sin-contacto', 60)

if (!CORREO) {
  console.log('\n  Falta el correo.')
  console.log('  node scripts/reporte-actividad-usuario.mjs <correo> [--dias 7] [--sin-contacto 60]\n')
  process.exit(2)
}

/* ── LA VENTANA, ANCLADA A MÉXICO ─────────────────────────────────────────
   Vercel corre en UTC y `toISOString()` daría un día corrido. [[feedback-fechas-zona-mexico]] */
const HOY = hoyEnMexico()
const ahora = ahoraEnMexico()
const desde = new Date(ahora)
desde.setDate(desde.getDate() - (DIAS - 1))
const DESDE = [desde.getFullYear(),
               String(desde.getMonth() + 1).padStart(2, '0'),
               String(desde.getDate()).padStart(2, '0')].join('-')

/** Fecha y hora LOCALES de México a partir de un timestamp de la base. */
function enMexico(ts) {
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return null
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_MEXICO, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const g = k => (f.find(p => p.type === k) ?? {}).value
  return { dia: `${g('year')}-${g('month')}-${g('day')}`,
           hora: Number(g('hour')), minuto: Number(g('minute')) }
}

console.log(`\n  REPORTE DE ACTIVIDAD · ${CORREO}`)
console.log('  ' + '='.repeat(74))
console.log(`  ventana: ${DESDE} .. ${HOY}  (${DIAS} días, hora de México)`)

/* ── 1 · EL USUARIO ──────────────────────────────────────────────────────── */
const { filas: usuarios, error: eU } = await leerTodo('usuarios',
  'email, nombre, rol, activo, asesor_nombre')
if (eU) { console.log('  *** no pude leer `usuarios`: ' + eU.message); process.exit(2) }
const usuario = (usuarios ?? []).find(u => String(u.email).trim().toLowerCase() === CORREO)
if (!usuario) {
  console.log(`\n  *** «${CORREO}» NO EXISTE en \`usuarios\`. No se inventa un reporte.`)
  console.log('  Correos registrados: ' + (usuarios ?? []).map(u => u.email).join(', '))
  process.exit(2)
}
console.log(`  usuario: ${usuario.nombre ?? '(sin nombre)'} · rol ${usuario.rol}`
  + ` · activo ${usuario.activo} · asesor_nombre «${usuario.asesor_nombre ?? ''}»`)

/* El nombre de asesor es la TERCERA puerta del acceso y la llave de su cartera.
   Si viene vacío, la cartera no se puede resolver y eso se dice. */
const ASESOR = String(usuario.asesor_nombre ?? '').trim()

/* ── 2 · SU CARTERA ──────────────────────────────────────────────────────── */
const mapa = await mapaFacturacion()
const { filas: todas, error: eC } = await leerTodo('cuentas',
  'id, cid, consecutivo, empresa, asesor, estado, health_score, facturacion')
if (eC) { console.log('  *** no pude leer `cuentas`: ' + eC.message); process.exit(2) }

const porId = new Map((todas ?? []).map(c => [c.id, c]))
const cartera = ASESOR ? (todas ?? []).filter(c => String(c.asesor ?? '').trim() === ASESOR) : []
const conImporte = cartera.map(c => {
  const i = importeDeCuenta(c, mapa)
  return { ...c, mrr: i.mrr, origenMrr: i.origen, top: isTopCustomer(c.consecutivo) }
})
console.log(`\n  CARTERA de «${ASESOR || '(sin asesor_nombre)'}»: ${cartera.length} cuentas`)
if (mapa.falla) console.log(`  *** el mapa de MRR no cargó (${mapa.falla}): los importes NO son medibles`)

const porEstado = {}
for (const c of conImporte) porEstado[c.estado ?? '?'] = (porEstado[c.estado ?? '?'] ?? 0) + 1
for (const [k, v] of Object.entries(porEstado).sort((a, b) => b[1] - a[1])) {
  console.log(`      ${String(k).padEnd(12)} ${String(v).padStart(4)}`)
}

/* ── 3 · NAVEGACIÓN ──────────────────────────────────────────────────────── */
const { filas: usoTodo, error: eUso } = await leerTodo('uso_dashboard',
  'id, email, asesor, ruta, seccion, duracion_seg, created_at',
  q => q.order('created_at', { ascending: true }))
if (eUso) { console.log('  *** no pude leer `uso_dashboard`: ' + eUso.message); process.exit(2) }
console.log(`  \`uso_dashboard\`: ${usoTodo.length} filas leídas (paginado completo)`)

/* LA FECHA MÁS ANTIGUA DE LA TABLA ENTERA. Sin esto, un día sin filas se lee
   como «no entró» cuando puede ser «todavía no se registraba». */
const primeraFila = (usoTodo ?? [])[0]?.created_at ?? null
const primeraEnMx = primeraFila ? enMexico(primeraFila).dia : null

const mias = (usoTodo ?? []).filter(r => String(r.email ?? '').trim().toLowerCase() === CORREO)
const enVentana = []
for (const r of mias) {
  const m = enMexico(r.created_at)
  if (!m) continue
  if (m.dia < DESDE || m.dia > HOY) continue
  enVentana.push({ ...r, dia: m.dia, hora: m.hora })
}
console.log(`\n  NAVEGACIÓN: ${enVentana.length} visitas en la ventana`
  + `  (${mias.length} de este usuario en toda la tabla)`)
console.log(`  la tabla \`uso_dashboard\` empieza el ${primeraEnMx ?? '(vacía)'}`)

const medibleDesde = primeraEnMx && primeraEnMx > DESDE ? primeraEnMx : DESDE
if (medibleDesde !== DESDE) {
  console.log(`  *** los días ${DESDE} .. ${medibleDesde} son NO MEDIBLES: la tabla no existía o estaba vacía`)
}

/* ── CONTROL DEL CERO: ¿registró ALGUIEN esta semana? ──────────────────────
   «Dan no navegó» y «el registro está caído» producen el MISMO cero, y son
   cosas opuestas: una es un hallazgo sobre una persona y la otra un fallo del
   sistema. Publicar la primera sin descartar la segunda es acusar a alguien
   con una métrica rota. [[feedback-cero-sin-medicion]] */
const ventanaTodos = []
for (const r of (usoTodo ?? [])) {
  const m = enMexico(r.created_at)
  if (!m || m.dia < DESDE || m.dia > HOY) continue
  ventanaTodos.push({ ...r, dia: m.dia })
}
const correosEnVentana = new Map()
for (const r of ventanaTodos) {
  const k = String(r.email ?? '(vacío)').trim().toLowerCase()
  correosEnVentana.set(k, (correosEnVentana.get(k) ?? 0) + 1)
}
const control = {
  visitasDeTodos: ventanaTodos.length,
  correosActivos: [...correosEnVentana].map(([email, n]) => ({ email, n }))
                    .sort((a, b) => b.n - a.n),
  /* La última fila de CUALQUIERA: si es vieja, el registro dejó de escribir. */
  ultimaDeCualquiera: (usoTodo ?? []).length
    ? enMexico((usoTodo ?? [])[(usoTodo ?? []).length - 1].created_at)
    : null,
  ultimaDelUsuario: mias.length ? enMexico(mias[mias.length - 1].created_at) : null,
}
console.log(`\n  CONTROL DEL CERO — ¿el registro sigue escribiendo?`)
console.log(`      visitas de TODOS en la ventana: ${control.visitasDeTodos}`)
console.log(`      última fila de cualquiera: ${control.ultimaDeCualquiera
  ? control.ultimaDeCualquiera.dia + ' ' + String(control.ultimaDeCualquiera.hora).padStart(2, '0') + 'h'
  : '(tabla vacía)'}`)
console.log(`      última fila de ESTE usuario: ${control.ultimaDelUsuario
  ? control.ultimaDelUsuario.dia + ' ' + String(control.ultimaDelUsuario.hora).padStart(2, '0') + 'h'
  : '(ninguna nunca)'}`)
for (const { email, n } of control.correosActivos) {
  console.log(`      ${String(n).padStart(5)}  ${email}`)
}
if (control.visitasDeTodos === 0) {
  console.log('\n  *** NADIE tiene visitas en la ventana. El cero de este usuario NO')
  console.log('      es un hallazgo sobre él: el registro de navegación no está')
  console.log('      escribiendo. No se concluye nada sobre su actividad.')
}

/* Por día, por hora, por sección. Y por cuenta, resolviendo /cuentas/<uuid>. */
const porDia = {}, porHora = {}, porSeccion = {}, porCuenta = {}
let sinDuracion = 0, segTotal = 0, conDuracion = 0
const RX_CUENTA = /\/cuentas\/([0-9a-f-]{36})/i
for (const r of enVentana) {
  porDia[r.dia] = (porDia[r.dia] ?? 0) + 1
  porHora[r.hora] = (porHora[r.hora] ?? 0) + 1
  const s = String(r.seccion ?? '(sin sección)')
  porSeccion[s] = (porSeccion[s] ?? 0) + 1
  const m = RX_CUENTA.exec(String(r.ruta ?? ''))
  if (m) {
    const c = porId.get(m[1])
    const k = c ? `${c.consecutivo ?? '—'}|${c.empresa}` : `?|${m[1]}`
    porCuenta[k] = porCuenta[k] ?? { visitas: 0, seg: 0, cuenta_id: m[1] }
    porCuenta[k].visitas++
    if (Number.isFinite(r.duracion_seg)) porCuenta[k].seg += r.duracion_seg
  }
  if (Number.isFinite(r.duracion_seg) && r.duracion_seg !== null) {
    conDuracion++; segTotal += r.duracion_seg
  } else sinDuracion++
}
console.log(`  visitas con duración: ${conDuracion} · SIN duración: ${sinDuracion}`
  + (conDuracion ? ` · media ${Math.round(segTotal / conDuracion)}s (sólo sobre las medibles)` : ''))
console.log('  por sección:')
for (const [k, v] of Object.entries(porSeccion).sort((a, b) => b[1] - a[1])) {
  console.log(`      ${String(v).padStart(5)}  ${k}`)
}
console.log(`  cuentas distintas consultadas: ${Object.keys(porCuenta).length}`)

/* ── 4 · LO QUE CAPTURÓ ──────────────────────────────────────────────────── */
const capturas = { seguimientos: [], actividades: [], anexos: [] }

const { filas: segs, error: eS } = await leerTodo('seguimientos',
  'id, cuenta_id, fecha, tipo, descripcion, asesor, created_at')
if (eS) { console.log('  *** no pude leer `seguimientos`: ' + eS.message); process.exit(2) }
for (const s of segs ?? []) {
  if (String(s.asesor ?? '').trim() !== ASESOR) continue
  const m = enMexico(s.created_at ?? s.fecha)
  if (!m || m.dia < DESDE || m.dia > HOY) continue
  const c = porId.get(s.cuenta_id)
  capturas.seguimientos.push({
    dia: m.dia, hora: m.hora, tipo: s.tipo,
    cuenta: c ? `${c.consecutivo ?? '—'} ${c.empresa}` : '(cuenta no encontrada)',
    descripcion: String(s.descripcion ?? '').slice(0, 160),
  })
}

const { filas: acts, error: eA } = await leerTodo('actividades',
  'id, cuenta_id, tipo, estado, completada, asesor, fecha_programada')
if (eA) { console.log('  *** no pude leer `actividades`: ' + eA.message); process.exit(2) }
for (const a of acts ?? []) {
  if (String(a.asesor ?? '').trim() !== ASESOR) continue
  const d = String(a.fecha_programada ?? '').slice(0, 10)
  if (!d || d < DESDE || d > HOY) continue
  const c = porId.get(a.cuenta_id)
  capturas.actividades.push({
    dia: d, tipo: a.tipo, estado: a.estado, completada: !!a.completada,
    cuenta: c ? `${c.consecutivo ?? '—'} ${c.empresa}` : '(cuenta no encontrada)',
  })
}

const { filas: anx, error: eAx } = await leerTodo('anexos',
  'id, cuenta_id, nombre_documento, tema, subido_por, creado_en, archivo_bytes')
if (eAx) { console.log('  *** no pude leer `anexos`: ' + eAx.message); process.exit(2) }
let anexosOtros = 0
for (const x of anx ?? []) {
  const quien = String(x.subido_por ?? '').trim().toLowerCase()
  const m = enMexico(x.creado_en)
  if (!m || m.dia < DESDE || m.dia > HOY) continue
  if (quien !== CORREO && quien !== ASESOR.toLowerCase()) { anexosOtros++; continue }
  const c = porId.get(x.cuenta_id)
  capturas.anexos.push({
    dia: m.dia, hora: m.hora, documento: x.nombre_documento, tema: x.tema,
    bytes: x.archivo_bytes,
    cuenta: c ? `${c.consecutivo ?? '—'} ${c.empresa}` : '(cuenta no encontrada)',
  })
}

console.log(`\n  CAPTURÓ en la ventana: ${capturas.seguimientos.length} seguimiento(s),`
  + ` ${capturas.actividades.length} actividad(es), ${capturas.anexos.length} anexo(s)`)
console.log(`  (anexos de OTROS en la misma ventana: ${anexosOtros})`)
console.log('  REUNIONES: la tabla NO guarda autor — no atribuibles a nadie.')

/* ── 5 · RIESGO HOY ──────────────────────────────────────────────────────── */
const { filas: eps, error: eE } = await leerTodo('alertas_episodios', '*')
const riesgo = []
if (eE) {
  console.log(`\n  *** no pude leer \`alertas_episodios\`: ${eE.message} — el riesgo queda SIN MEDIR`)
} else {
  const abiertas = (eps ?? []).filter(e => {
    const est = String(e.estado ?? '').toLowerCase()
    return est !== 'cerrada' && est !== 'cerrado' && est !== 'resuelta'
  })
  const porCuentaAlerta = new Map()
  for (const e of abiertas) {
    const k = e.cuenta_id
    if (!porCuentaAlerta.has(k)) porCuentaAlerta.set(k, [])
    porCuentaAlerta.get(k).push(e)
  }
  for (const c of conImporte) {
    const as = porCuentaAlerta.get(c.id) ?? []
    if (!as.length) continue
    riesgo.push({
      consecutivo: c.consecutivo, empresa: c.empresa, estado: c.estado,
      mrr: c.mrr, origenMrr: c.origenMrr, top: c.top, hs: c.health_score,
      alertas: as.map(a => ({
        tipo: a.tipo ?? a.clave ?? a.condicion ?? '(sin tipo)',
        severidad: a.severidad ?? null,
        abierta_desde: a.abierta_desde ?? a.created_at ?? null,
        detalle: String(a.detalle ?? a.descripcion ?? '').slice(0, 240),
      })),
    })
  }
  riesgo.sort((a, b) => (b.alertas.length - a.alertas.length) || (b.mrr - a.mrr))
  console.log(`\n  RIESGO: ${riesgo.length} de sus ${cartera.length} cuentas con alerta abierta`)
}

/* ── 6 · SIN CONTACTO ────────────────────────────────────────────────────── */
const ultimo = await ultimoContactoEfectivoPorCuenta()
const sinContacto = []
for (const c of conImporte) {
  const u = ultimo.get(c.id) ?? null
  const d = diasSinContacto(u)
  /* `null` es NO MEDIBLE —nunca hubo contacto registrado—, y no es «0 días»
     ni «hace mucho»: se publica aparte, con su nombre. */
  sinContacto.push({
    consecutivo: c.consecutivo, empresa: c.empresa, estado: c.estado,
    mrr: c.mrr, origenMrr: c.origenMrr, top: c.top,
    ultimo, dias: d, ultimoContacto: u,
  })
}
const pasados = sinContacto.filter(x => x.dias !== null && x.dias > CORTE_CONTACTO)
const nunca   = sinContacto.filter(x => x.dias === null)
pasados.sort((a, b) => b.dias - a.dias)
console.log(`\n  SIN CONTACTO > ${CORTE_CONTACTO} días: ${pasados.length}`)
console.log(`  SIN NINGÚN CONTACTO REGISTRADO (no medible): ${nunca.length}`)

/* ── SALIDA ──────────────────────────────────────────────────────────────── */
const salida = {
  generado: new Date().toISOString(),
  correo: CORREO,
  usuario: { nombre: usuario.nombre, rol: usuario.rol, activo: usuario.activo, asesor: ASESOR },
  ventana: { desde: DESDE, hasta: HOY, dias: DIAS, medibleDesde,
             usoEmpiezaEl: primeraEnMx, corteContacto: CORTE_CONTACTO },
  cartera: {
    total: cartera.length, porEstado,
    mrrMedible: conImporte.filter(c => c.origenMrr !== 'sin_dato')
                          .reduce((s, c) => s + c.mrr, 0),
    sinMrrMedible: conImporte.filter(c => c.origenMrr === 'sin_dato').length,
    mapaFalla: mapa.falla ?? null,
    cuentas: conImporte.map(c => ({
      consecutivo: c.consecutivo, empresa: c.empresa, estado: c.estado,
      mrr: c.mrr, origenMrr: c.origenMrr, top: c.top, hs: c.health_score,
    })),
  },
  navegacion: {
    visitas: enVentana.length, conDuracion, sinDuracion,
    mediaSeg: conDuracion ? Math.round(segTotal / conDuracion) : null,
    porDia, porHora, porSeccion,
    porCuenta: Object.entries(porCuenta)
      .map(([k, v]) => ({ clave: k, consecutivo: k.split('|')[0],
                          empresa: k.split('|').slice(1).join('|'), ...v }))
      .sort((a, b) => b.visitas - a.visitas),
    detalle: enVentana.map(r => ({ dia: r.dia, hora: r.hora, seccion: r.seccion,
                                   ruta: r.ruta, seg: r.duracion_seg })),
    control,
    /* Su historia COMPLETA, fuera de la ventana: sirve para decir «no navegó
       esta semana» sin que se lea como «nunca ha entrado». */
    historico: {
      visitas: mias.length,
      primera: mias.length ? enMexico(mias[0].created_at) : null,
      ultima: control.ultimaDelUsuario,
    },
  },
  capturas,
  anexosDeOtros: anexosOtros,
  reunionesNoAtribuibles: true,
  riesgo,
  sinContacto: { corte: CORTE_CONTACTO, pasados, nunca },
}

const dir = path.join(RAIZ, 'data', 'reportes-actividad')
fs.mkdirSync(dir, { recursive: true })
const destino = path.join(dir, `actividad-${CORREO.split('@')[0]}-${HOY}.json`)
fs.writeFileSync(destino, JSON.stringify(salida, null, 2), 'utf8')
console.log(`\n  escrito ${destino}\n`)
