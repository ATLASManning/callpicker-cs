/**
 * LOS DOS ROLES DE LA ENTREGA, PROBADOS AL REVÉS
 * ==============================================
 *
 *     npx ts-node --project tsconfig.import.json scripts/test-roles-entrega.ts
 *
 * POR QUÉ EXISTE
 * --------------
 * El §6 del Prompt Maestro exige «evitar la autoaceptación por quien entrega».
 * Eso no es una pantalla ni un aviso: es que `activaciones` NO pueda escribir
 * en el endpoint de aceptación. Y una regla así solo se prueba con lo que NO
 * debe entrar — comprobar que `sac` sí puede aceptar no dice absolutamente nada
 * sobre si `activaciones` también puede.
 *
 * Importa `puedeAbrir` DE VERDAD desde lib/permisos. No reescribe sus reglas:
 * un espejo de constantes tecleado a mano deja de ser espejo en el primer
 * cambio, y entonces la prueba pasa mientras el candado está roto.
 *
 * LO QUE ESTA PRUEBA NO CUBRE, Y HAY QUE SABERLO
 * ----------------------------------------------
 * `puedeAbrir` es UNA de las puertas. Las otras dos viven en el middleware y no
 * son por rol: la lista blanca de correos de `lib/auth.ts` y las dos listas de
 * administración (`esAdminDelTablero`, `puedeVerUsoDashboard`). Por eso aquí no
 * se afirma que un rol acotado no alcance `/api/analytics/uso`: por rol SÍ lo
 * alcanza —`/api/analytics` está en los comunes— y quien lo detiene es la lista
 * por correo. Afirmar lo contrario sería una prueba verde sobre un candado que
 * no es éste.
 */
import { puedeAbrir, definicionRol, ROLES, type Rol } from '../lib/permisos'

let fallos = 0
function check(ok: boolean, que: string, detalle = '') {
  console.log(`  ${ok ? 'ok   ' : 'FALLA'}  ${que}${ok ? '' : '   — ' + detalle}`)
  if (!ok) fallos++
}
/** Atajo legible: ¿puede este rol hacer esto? */
const puede = (rol: Rol, ruta: string, m = 'GET') => puedeAbrir(rol, ruta, m)

console.log('')
console.log('  1 · LA SEGREGACIÓN: QUIEN ENTREGA NO ACEPTA')
console.log('  ' + '-'.repeat(72))

// Lo más importante del archivo. Si esto se pone verde al revés, el control de
// entrega es decorativo.
check(!puede('activaciones', '/api/entregas', 'POST'),
      'activaciones NO puede POST /api/entregas (no se autoacepta)')
check(!puede('activaciones', '/api/entregas/aceptacion', 'POST'),
      'activaciones NO puede POST /api/entregas/aceptacion')
check(!puede('activaciones', '/api/entregas', 'PATCH'),
      'activaciones NO puede PATCH /api/entregas')
check(!puede('activaciones', '/api/entregas', 'DELETE'),
      'activaciones NO puede DELETE /api/entregas')
check(puede('activaciones', '/api/entregas', 'GET'),
      'activaciones SÍ puede leer /api/entregas (consulta su expediente)')
check(puede('sac', '/api/entregas', 'POST'),
      'sac SÍ puede POST /api/entregas (es el rol que acepta)')

console.log('')
console.log('  2 · AL REVÉS: LO QUE NINGUNO DE LOS DOS DEBE ALCANZAR')
console.log('  ' + '-'.repeat(72))

// La firma de una escritura de cartera la pone `firmaDeSesion` de lib/dueno.ts,
// y SOLO acota al rol `asesor`. Para cualquier otro rol devuelve la firma que
// venga en el CUERPO de la petición. Un rol nuevo que pudiera escribir aquí
// dejaría un seguimiento firmado con el nombre de otra persona.
for (const rol of ['activaciones', 'sac'] as Rol[]) {
  check(!puede(rol, '/api/seguimientos', 'POST'),
        `${rol} NO puede POST /api/seguimientos (firma falsificable)`)
  check(!puede(rol, '/api/cuentas', 'POST'),
        `${rol} NO puede POST /api/cuentas`)
  check(!puede(rol, '/api/cuentas/abc-123', 'PATCH'),
        `${rol} NO puede PATCH la ficha de una cuenta`)
  check(!puede(rol, '/admin', 'GET'),
        `${rol} NO abre /admin`)
  check(!puede(rol, '/api/admin/usuarios', 'GET'),
        `${rol} NO alcanza /api/admin/usuarios`)
  check(!puede(rol, '/churn', 'GET'),
        `${rol} NO abre /churn (es de dirección)`)
  check(!puede(rol, '/metricas', 'GET'),
        `${rol} NO abre /metricas`)
}

// El MRR institucional sale del GRC, y /api/grc devuelve la facturación de la
// empresa ENTERA, no la de una cuenta. El apartado 13 del expediente lo pide,
// pero no a este precio: tiene que llegar ya resuelto del lado del servidor.
check(!puede('activaciones', '/api/grc', 'GET'),
      'activaciones NO lee /api/grc (es el ingreso de toda la empresa)')
check(!puede('activaciones', '/facturacion', 'GET'),
      'activaciones NO abre /facturacion')
check(!puede('activaciones', '/alertas', 'GET'),
      'activaciones NO abre /alertas (no opera riesgo)')
check(!puede('activaciones', '/seguimiento', 'GET'),
      'activaciones NO abre /seguimiento')
check(!puede('sac', '/facturacion', 'GET'),
      'sac NO abre /facturacion')

console.log('')
console.log('  3 · LO QUE SÍ TIENEN QUE PODER, O EL ROL NO SIRVE')
console.log('  ' + '-'.repeat(72))

check(puede('activaciones', '/activaciones', 'GET'),
      'activaciones abre Activaciones 2.0')
check(puede('activaciones', '/cuentas/9f1c-abc', 'GET'),
      'activaciones abre la ficha de una cuenta')
check(puede('activaciones', '/api/cuentas', 'GET'),
      'activaciones LEE /api/cuentas (si no, la ficha abre vacía con un 403)')
check(puede('activaciones', '/api/activaciones/detalle', 'GET'),
      'activaciones alcanza el detalle de su propio módulo')
check(puede('activaciones', '/tickets', 'GET'),
      'activaciones abre Tickets')

check(puede('sac', '/alertas', 'GET'), 'sac abre Alertas de Cliente')
check(puede('sac', '/cuentas', 'GET'), 'sac abre Cuentas')
check(puede('sac', '/chat', 'GET'),    'sac abre Atlas IA')
// Preguntarle a Atlas es un POST. Con solo lectura la pantalla abriría y
// ninguna pregunta pasaría — el fallo que /api/grc le causó a Perfilamiento.
check(puede('sac', '/api/chat', 'POST'),
      'sac SÍ puede POST /api/chat (preguntar a Atlas es un POST)')
check(puede('sac', '/activaciones', 'GET'),
      'sac ve Activaciones (qué le están entregando)')
check(puede('sac', '/api/seguimientos', 'GET'),
      'sac LEE los seguimientos de la cuenta')

// Los documentos de auditoría son comunes a toda sesión válida.
for (const rol of ['activaciones', 'sac'] as Rol[]) {
  check(puede(rol, '/auditorias/Medicall_Expert.html', 'GET'),
        `${rol} abre un documento de /auditorias/`)
  check(puede(rol, '/docs/algo.pdf', 'GET'),
        `${rol} abre un documento de /docs/`)
}

console.log('')
console.log('  4 · INVARIANTES QUE VALEN PARA CUALQUIER ROL FUTURO')
console.log('  ' + '-'.repeat(72))

const TODOS = Object.keys(ROLES) as Rol[]

// La trampa que lib/permisos.ts ya documenta para Perfilamiento: un rol cuya
// pantalla de inicio no puede abrir entra en bucle de redirección y NO ENTRA
// NUNCA. El middleware lo manda a `inicio`, `inicio` no le toca, y vuelta.
for (const rol of TODOS) {
  const def = definicionRol(rol)
  check(puede(rol, def.inicio, 'GET'),
        `${rol}: su pantalla de inicio (${def.inicio}) la puede abrir`,
        'bucle de redirección: el rol no entraría nunca')
}

// Gestión de Usuarios deriva sus dos listas de aquí. Una descripción vacía
// pinta «Rol — » en el único sitio donde se asignan los roles.
for (const rol of TODOS) {
  const def = definicionRol(rol)
  check(Boolean(def.descripcion && def.descripcion.trim()),
        `${rol}: tiene descripción para Gestión de Usuarios`)
  check(Boolean(def.label && def.label.trim()), `${rol}: tiene label`)
}

// EL CANDADO CONTRA EL DESCUIDO FUTURO. `paginas: null` significa TODO. Hoy lo
// llevan tres roles por decisión; si mañana alguien añade un rol y se deja los
// campos en `null` «de momento», habrá creado un administrador sin querer y
// nada se lo dirá. Ampliar esta lista tiene que ser un acto deliberado.
const CON_ACCESO_TOTAL: Rol[] = ['admin', 'asesor', 'viewer']
for (const rol of TODOS) {
  const def = definicionRol(rol)
  const total = def.paginas === null || def.apis === null
  if (CON_ACCESO_TOTAL.includes(rol)) {
    check(total, `${rol}: acceso total, como está decidido`)
  } else {
    check(!total,
          `${rol}: está ACOTADO (paginas y apis enumeradas)`,
          'un rol con paginas/apis en null ve TODO el tablero')
  }
}

// Que un rol acotado no alcance por accidente la raíz de las APIs.
for (const rol of TODOS.filter(r => !CON_ACCESO_TOTAL.includes(r))) {
  check(!puede(rol, '/api/', 'GET'), `${rol}: no alcanza la raíz /api/`)
  check(!puede(rol, '/', 'GET'),     `${rol}: no abre la portada`)
}

console.log('')
console.log('  ' + '='.repeat(72))
if (fallos) {
  console.log(`  *** ${fallos} comprobación(es) FALLARON ***`)
  console.log('')
  process.exit(1)
}
console.log(`  Las ${TODOS.length} definiciones de rol pasan, y la segregación de la`)
console.log('  entrega está puesta: quien entrega no puede aceptar.')
console.log('')
