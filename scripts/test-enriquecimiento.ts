/**
 * Pruebas del módulo de enriquecimiento.
 *
 *   npm run test:enriquecimiento
 *
 * Sin framework: aserciones puras para no agregar dependencias al proyecto.
 * El bloque más importante es "NO SOBRESCRIBIR": son las pruebas que impiden
 * que una futura modificación pueda tocar el dato capturado por un KAM.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { esValorReal } from '../lib/valores'
import {
  normTexto, dominioCanonico, telefonoE164, emailNormalizado, extraerEmails,
  extraerTelefonos, similitud, taxonomiaTamano, taxonomiaEmpleados, taxonomiaGiro,
  dedupeKey, primerEntero,
} from '../lib/enriquecimiento/normalizar'
import { puntuar, nivelConfianza, estadoVerificacion, permitePromocionAutomatica } from '../lib/enriquecimiento/confianza'
import { comparar, accionPropuesta, construirCandidato, deduplicar } from '../lib/enriquecimiento/comparar'
import { assertTablaPermitida, TABLAS_PERMITIDAS, EscrituraProhibidaError } from '../lib/enriquecimiento/servicio'
import { extraerEmpleados, extraerSitios, htmlATexto, sinTelefonos } from '../lib/enriquecimiento/proveedores/sitioWeb'
import * as interno from '../lib/enriquecimiento/proveedores/interno'
import type { CuentaLectura } from '../lib/enriquecimiento/tipos'

let ok = 0, fallos = 0
function test(nombre: string, fn: () => void) {
  try { fn(); ok++; console.log(`  ✓ ${nombre}`) }
  catch (e) { fallos++; console.error(`  ✗ ${nombre}\n      ${e instanceof Error ? e.message : e}`) }
}
function grupo(n: string) { console.log(`\n${n}`) }

const cuentaBase: CuentaLectura = {
  id: 'c-1', consecutivo: 'F99', cid: '12345', empresa: 'Ejemplo SA de CV',
  asesor: 'Fátima', estado: 'activo',
  contacto_nombre: 'Ana Pérez', contacto_cargo: 'Directora', contacto_tel: '55 1234 5678',
  contacto_email: null, contactos_json: [], giro: 'Farmaceutica', tamano_empresa: 'Mediana',
  total_empleados: '51-200', num_oficinas: '10', pagina_web: 'https://ejemplo.mx',
  direccion_fiscal: null, observaciones_kam: null,
}

/* ════════════════════════════════════════════════════════════════════════
   1. NO SOBRESCRIBIR — el requisito no negociable
   ════════════════════════════════════════════════════════════════════════ */
grupo('NO SOBRESCRIBIR')

test('la tabla cuentas NO está en la lista blanca de escritura', () => {
  assert.ok(!(TABLAS_PERMITIDAS as readonly string[]).includes('cuentas'))
})

test('assertTablaPermitida rechaza cuentas', () => {
  assert.throws(() => assertTablaPermitida('cuentas'), EscrituraProhibidaError)
})

test('assertTablaPermitida rechaza cualquier tabla operativa', () => {
  for (const t of ['cuentas', 'actividades', 'seguimientos', 'usuarios', 'radar_respuestas']) {
    assert.throws(() => assertTablaPermitida(t), EscrituraProhibidaError, `debió rechazar ${t}`)
  }
})

test('assertTablaPermitida acepta solo las tablas de enriquecimiento', () => {
  for (const t of TABLAS_PERMITIDAS) assert.doesNotThrow(() => assertTablaPermitida(t))
})

test('el motor no contiene update/delete sobre cuentas', () => {
  const src = readFileSync(join(__dirname, '..', 'lib', 'enriquecimiento', 'servicio.ts'), 'utf8')
  assert.ok(!/from\('cuentas'\)[\s\S]{0,120}\.(update|delete|upsert|insert)\(/.test(src),
    'servicio.ts no debe escribir sobre cuentas')
  assert.ok(/from\('cuentas'\)\s*\.select\(/.test(src), 'servicio.ts debe leer cuentas con select')
})

test('ningún puntaje habilita promoción automática', () => {
  for (const s of [0, 40, 70, 89, 90, 99, 100]) {
    assert.equal(permitePromocionAutomatica(s), false)
  }
})

test('construirCandidato conserva el valor original y no lo altera', () => {
  const antes = { ...cuentaBase }
  const cand = construirCandidato(cuentaBase, {
    campo: 'giro', valor: 'Farmacias especializadas',
    fuente_tipo: 'sitio_oficial', fuente_nombre: 'Sitio', evidencia: 'x',
  })
  assert.equal(cand.valor_original_snapshot, 'Farmaceutica')
  assert.deepEqual(cuentaBase, antes, 'la cuenta de entrada no debe mutar')
})

/* ════════════════════════════════════════════════════════════════════════
   2. Comparación
   ════════════════════════════════════════════════════════════════════════ */
grupo('COMPARACIÓN')

test('campo vacío → nuevo', () => {
  assert.equal(comparar('contacto_email', null, 'a@b.mx'), 'nuevo')
  assert.equal(comparar('contacto_email', '', 'a@b.mx'), 'nuevo')
})

test('el literal "0" cuenta como vacío, no como dato', () => {
  assert.equal(esValorReal('0'), false)
  assert.equal(comparar('giro', '0', 'Farmacéutica'), 'nuevo')
  assert.equal(comparar('pagina_web', '0', 'https://x.mx'), 'nuevo')
})

test('mismo valor con distinta forma → coincide', () => {
  assert.equal(comparar('pagina_web', 'http://www.probemedic.mx', 'https://probemedic.mx'), 'coincide')
  assert.equal(comparar('contacto_tel', '55 1234 5678', '+525512345678'), 'coincide')
  assert.equal(comparar('tamano_empresa', 'mediana', 'Mediana'), 'coincide')
})

test('valor que agrega detalle → complementa', () => {
  assert.equal(comparar('giro', 'Farmaceutica', 'Farmaceutica especializada en oncología'), 'complementa')
})

test('cifras distintas → conflicto (nunca sustitución)', () => {
  assert.equal(comparar('num_oficinas', '43', '50 oficinas'), 'conflicto')
  const accion = accionPropuesta('conflicto', 100)
  assert.equal(accion, 'review_required', 'un conflicto siempre va a revisión humana')
})

test('diferencia menor al 10% en cifras → complementa', () => {
  assert.equal(comparar('num_oficinas', '10', '11 sucursales'), 'complementa')
})

test('candidato sin valor → sin_evidencia', () => {
  assert.equal(comparar('giro', 'Farmaceutica', ''), 'sin_evidencia')
  assert.equal(accionPropuesta('sin_evidencia', 90), 'descartar')
})

/* ════════════════════════════════════════════════════════════════════════
   3. Confianza
   ════════════════════════════════════════════════════════════════════════ */
grupo('CONFIANZA')

test('fuente oficial supera a buscador', () => {
  const oficial = puntuar({ fuente_tipo: 'sitio_oficial', campo: 'giro' })
  const busca   = puntuar({ fuente_tipo: 'buscador', campo: 'giro' })
  assert.ok(oficial > busca, `${oficial} debe superar a ${busca}`)
})

test('dos fuentes coincidentes suben el puntaje', () => {
  const una = puntuar({ fuente_tipo: 'directorio', campo: 'giro', corroboraciones: 1 })
  const dos = puntuar({ fuente_tipo: 'directorio', campo: 'giro', corroboraciones: 2 })
  assert.ok(dos > una)
})

test('un patrón de correo inferido jamás llega a verificado', () => {
  const score = puntuar({ fuente_tipo: 'sitio_oficial', campo: 'email_pattern_inferred' })
  assert.ok(score < 40, `patrón inferido debe quedar débil, quedó ${score}`)
  assert.equal(estadoVerificacion(score, 'no_verificado'), 'no_verificado')
  assert.equal(nivelConfianza(score), 'debil')
})

test('el techo de verificación del proveedor se respeta', () => {
  assert.equal(estadoVerificacion(95, 'probable'), 'probable')
  assert.equal(estadoVerificacion(95), 'confirmado')
})

/* ════════════════════════════════════════════════════════════════════════
   4. Deduplicación e idempotencia
   ════════════════════════════════════════════════════════════════════════ */
grupo('DEDUPLICACIÓN')

test('la misma clave se genera dos veces igual', () => {
  const a = dedupeKey('c-1', 'giro', 'salud_farmaceutica', 'https://ejemplo.mx/nosotros')
  const b = dedupeKey('c-1', 'giro', 'salud_farmaceutica', 'https://www.ejemplo.mx/otra')
  assert.equal(a, b, 'mismo host → misma clave, no duplica al reejecutar')
})

test('fuentes distintas producen claves distintas', () => {
  const a = dedupeKey('c-1', 'giro', 'x', 'https://ejemplo.mx')
  const b = dedupeKey('c-1', 'giro', 'x', 'https://directorio.com')
  assert.notEqual(a, b)
})

test('deduplicar conserva el de mayor confianza', () => {
  const base = { campo: 'giro' as const, fuente_nombre: 'f', evidencia: 'e' }
  const c1 = construirCandidato(cuentaBase, { ...base, valor: 'Farmacias', fuente_tipo: 'buscador',     fuente_url: 'https://x.mx' })
  const c2 = construirCandidato(cuentaBase, { ...base, valor: 'Farmacias', fuente_tipo: 'sitio_oficial', fuente_url: 'https://x.mx' })
  const out = deduplicar([c1, c2])
  assert.equal(out.length, 1)
  assert.equal(out[0].fuente_tipo, 'sitio_oficial')
})

/* ════════════════════════════════════════════════════════════════════════
   5. Extractores — trampas reales encontradas en el piloto
   ════════════════════════════════════════════════════════════════════════ */
grupo('EXTRACTORES')

test('NO toma el headcount de clientes como plantilla propia (caso Velfare)', () => {
  const r = extraerEmpleados('Más de 5000 colaboradores están mejorando su calidad de vida gracias a nuestros clientes')
  assert.ok(r, 'debe detectar la frase')
  assert.equal(r!.valor, '', 'no debe proponer valor')
  assert.match(r!.rechazado ?? '', /clientes|usuarios/i)
})

test('sí toma la plantilla propia cuando la frase es de la empresa', () => {
  const r = extraerEmpleados('Somos 150 empleados distribuidos en la República')
  assert.equal(r?.valor, '150 empleados')
})

test('marca las franquicias como no equivalentes a sitios propios', () => {
  const r = extraerSitios('Contamos con 50 oficinas entre propias y franquicias')
  assert.ok(r?.nota, 'debe anotar la mezcla con franquicias')
})

test('NO confunde el tamaño de un grupo de viaje con la plantilla (caso Mundo Joven)', () => {
  const r = extraerEmpleados('¿Viajas más de 10 personas? Nosotros te ayudamos a organizar tu viaje en grupo')
  assert.ok(!r?.valor, `no debía proponer empleados, propuso "${r?.valor}"`)
})

test('NO toma dígitos de un teléfono como número de sucursales (caso Mundo Joven)', () => {
  const r = extraerSitios('(55) 54 82 82 82 Sucursales Mundo Joven')
  assert.ok(!r, `no debía extraer sitios de un teléfono, extrajo "${r?.valor}"`)
})

test('sinTelefonos limpia patrones telefónicos y deja el resto', () => {
  const t = sinTelefonos('Llama al (55) 54 82 82 82 y visita 50 oficinas')
  assert.ok(!t.includes('82 82'), 'debe quitar el teléfono')
  assert.ok(t.includes('50 oficinas'), 'debe conservar la cifra real')
})

test('sigue leyendo la cifra legítima de sucursales', () => {
  const r = extraerSitios('Más de 50 oficinas en todo México')
  assert.equal(r?.valor, '50 oficinas')
})

test('NO propone una cifra sin dígitos reales (caso ", tiendas")', () => {
  assert.equal(extraerSitios('Nuestras marcas, tiendas y servicios'), null)
  assert.equal(extraerSitios('Contamos con , plantas de produccion'), null)
})

test('NO propone una cifra que parsea a cero ("000 trabajadores")', () => {
  const r = extraerEmpleados('Somos 000 trabajadores comprometidos')
  assert.ok(!r?.valor, `no debía proponer, propuso "${r?.valor}"`)
})

test('sí lee plantillas grandes con separador de miles', () => {
  assert.equal(extraerEmpleados('Somos 10,000 empleados en el país')?.valor, '10,000 empleados')
})

test('htmlATexto limpia scripts y etiquetas', () => {
  const t = htmlATexto('<div>Hola<script>var a=1</script><b>mundo</b></div>')
  assert.ok(t.includes('Hola') && t.includes('mundo') && !t.includes('var a'))
})

test('extrae correos y teléfonos de texto libre', () => {
  assert.deepEqual(extraerEmails('Contacto: A.Perez@Ejemplo.MX hoy'), ['a.perez@ejemplo.mx'])
  assert.ok(extraerTelefonos('llámanos al 81 2474 0080').includes('+528124740080'))
})

/* ════════════════════════════════════════════════════════════════════════
   6. Proveedor interno — rescate de datos ya capturados
   ════════════════════════════════════════════════════════════════════════ */
grupo('PROVEEDOR INTERNO')

test('rescata el correo escondido dentro del nombre del contacto', () => {
  const c: CuentaLectura = { ...cuentaBase, contacto_email: null,
    contacto_nombre: 'Enrique Castillo     ecastillo@probemedic.mx' }
  const h = interno.buscar(c)
  const email = h.find(x => x.campo === 'contacto_email')
  assert.equal(email?.valor, 'ecastillo@probemedic.mx')
  assert.equal(email?.fuente_tipo, 'interno')
  assert.ok(email?.evidencia.includes('contacto_nombre'))
})

test('no propone correo si el campo ya está capturado', () => {
  const c: CuentaLectura = { ...cuentaBase, contacto_email: 'ya@existe.mx',
    contacto_nombre: 'Enrique Castillo ecastillo@probemedic.mx' }
  assert.equal(interno.buscar(c).filter(x => x.campo === 'contacto_email').length, 0)
})

test('no deduce sitio web desde un correo genérico', () => {
  const c: CuentaLectura = { ...cuentaBase, pagina_web: '0',
    contacto_email: 'alguien@gmail.com' }
  assert.equal(interno.buscar(c).filter(x => x.campo === 'pagina_web').length, 0)
})

/* ════════════════════════════════════════════════════════════════════════
   7. Normalización
   ════════════════════════════════════════════════════════════════════════ */
grupo('NORMALIZACIÓN')

test('dominio canónico', () => {
  assert.equal(dominioCanonico('http://WWW.Ejemplo.MX/ruta'), 'ejemplo.mx')
  assert.equal(dominioCanonico('ejemplo.mx'), 'ejemplo.mx')
  assert.equal(dominioCanonico('0'), '')
})

test('teléfono a E.164', () => {
  assert.equal(telefonoE164('(55) 5482 8282'), '+525554828282')
  assert.equal(telefonoE164('+1 555 123 4567'), '+15551234567')
})

test('taxonomías', () => {
  assert.equal(taxonomiaTamano('Corporativo'), 'enterprise')
  assert.equal(taxonomiaTamano('Chica'), 'pequeña')
  assert.equal(taxonomiaEmpleados('51–200 empleados'), '51-200')
  assert.equal(taxonomiaEmpleados('150 empleados aproximadamente'), '51-200')
  assert.equal(taxonomiaGiro('Farmaceutica'), 'salud_farmaceutica')
  assert.equal(taxonomiaGiro('Travel Arrangements / Agencia de viajes'), 'turismo_viajes')
})

test('utilidades varias', () => {
  assert.equal(primerEntero('Total: 43 oficinas'), 43)
  assert.equal(emailNormalizado('  A@B.MX '), 'a@b.mx')
  assert.ok(similitud('Grupo Rizo', 'GRUPO RIZO S.A. de C.V.') > 0.5)
  assert.equal(normTexto('Ñandú  Ágil'), 'nandu agil')
})

/* ════════════════════════════════════════════════════════════════════════ */
console.log(`\n${ok} pruebas OK · ${fallos} fallidas`)
if (fallos > 0) process.exit(1)
