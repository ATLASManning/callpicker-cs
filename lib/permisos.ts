/**
 * Permisos por rol — qué módulos puede abrir cada quien.
 *
 * Se aplica en el middleware, no solo escondiendo enlaces en el menú: ocultar
 * un link no impide teclear la URL. Aquí vive la lista y el middleware la hace
 * valer en cada request.
 *
 * El rol `perfilamiento` nace el 3 de septiembre de 2026 para el área del
 * mismo nombre: necesitan consultar cuentas, facturación y tickets para armar
 * el perfil de un cliente, pero no operan cartera — no ven churn, actividades
 * de asesores, upsell ni el dashboard de dirección.
 */

export type Rol =
  | 'admin' | 'asesor' | 'viewer' | 'perfilamiento'
  | 'activaciones' | 'sac'

export interface DefinicionRol {
  label:   string
  color:   string
  /**
   * Para qué es este rol, en una línea. Se MUESTRA en Gestión de Usuarios.
   *
   * Es obligatorio a propósito: hasta hoy esa pantalla llevaba la descripción
   * de cada rol tecleada dentro de dos `options={[...]}`, que son literales y
   * por tanto NO fallan al compilar cuando nace un rol. El rol habría existido
   * en el tipo, en el CHECK y en el middleware, y aun así nadie habría podido
   * asignarlo desde la única pantalla que sirve para eso — sin un error en
   * ninguna parte. Un espejo de constantes tecleado a mano deja de ser espejo.
   */
  descripcion: string
  /** Rutas de página permitidas. `null` = todas. */
  paginas: string[] | null
  /** Prefijos de API permitidos, con cualquier método. `null` = todas. */
  apis:    string[] | null
  /**
   * Prefijos permitidos SOLO para leer (GET/HEAD).
   *
   * Existen porque un módulo permitido puede necesitar datos de uno que no lo
   * está: la ficha de una cuenta muestra sus seguimientos, sus actividades SAC
   * y sus reuniones. Perfilamiento necesita ver ese historial para armar el
   * perfil, pero no debe crear un seguimiento ni cerrar la actividad de otro.
   */
  apisLectura?: string[]
  /** A dónde cae al entrar, y a dónde se le devuelve si toca algo que no le toca. */
  inicio:  string
}

/* Rutas que cualquier sesión válida necesita, sin importar el rol: si se
 * bloquean, la aplicación no puede ni pintarse ni cerrar sesión. */
/* `/auditorias/` va junto a `/docs/`: son archivos que la aplicación enlaza
 * desde el módulo de Auditoría y que cualquier sesión válida debe poder abrir,
 * sin importar el rol. Lo que NO deben es servirse sin sesión. */
const COMUNES_PAGINAS = ['/acceso', '/docs/', '/auditorias/']
const COMUNES_APIS    = ['/api/auth/', '/api/analytics', '/api/admin/me']

export const ROLES: Record<Rol, DefinicionRol> = {
  /* `inicio` es la pantalla con la que arranca cada rol al entrar, y la que
     recibe a quien pide un módulo que no le toca. Instrucción de dirección
     (17 sep 2026): al iniciar se muestra Asesores.

     Perfilamiento queda en /cuentas A PROPÓSITO y no es un olvido: su lista de
     `paginas` no incluye /asesores, así que darle esa pantalla de inicio lo
     metería en un bucle de redirección — pide Asesores, no puede abrirla, el
     middleware lo manda a su inicio, que sería Asesores otra vez. Un rol cuya
     pantalla de inicio no puede abrir no entra nunca. */
  admin: {
    label: 'Admin', color: '#60A5FA',
    descripcion: 've todo',
    paginas: null, apis: null, inicio: '/asesores',
  },
  asesor: {
    label: 'Asesor', color: '#34D399',
    descripcion: 'solo sus cuentas',
    paginas: null, apis: null, inicio: '/asesores',
  },
  viewer: {
    label: 'Viewer', color: '#FBBF24',
    descripcion: 'solo lectura',
    paginas: null, apis: null, inicio: '/asesores',
  },
  perfilamiento: {
    label: 'Perfilamiento', color: '#A855F7',
    descripcion: 'Activaciones, Base de Conocimiento, Atlas IA, Auditoría, '
               + 'Facturación, Cuentas y Tickets',
    paginas: [
      '/activaciones',   // Activaciones 2.0
      '/reuniones/anexos', // Anexos: los documentos del cliente son material
                           // de perfilamiento. La pantalla de Reuniones no, y
                           // no la abre: `calza` exige coincidencia exacta o
                           // prefijo con barra, así que '/reuniones' queda fuera.
      '/base-cs',        // Base de Conocimiento
      '/chat',           // Atlas IA
      '/auditoria',      // Auditoría Cuentas
      '/facturacion',    // incluye /facturacion/cortes
      '/cuentas',        // incluye /cuentas/dormidas y la ficha /cuentas/[id]
      '/tickets',
    ],
    // Cada módulo necesita sus endpoints; sin esto la pantalla abre vacía.
    apis: [
      '/api/activaciones', '/api/activaciones-excel',
      '/api/chat',
      '/api/cuentas', '/api/adopcion', '/api/radar', '/api/zoho-lookup',
      // /api/grc es la fuente del apartado Gross Revenue Facturación, que
      // sustituyo a LTV. Sin esto, el rol abre /facturacion y recibe 403: la
      // pagina carga y la tabla sale vacia, que es peor que un error porque
      // nadie sabe que lo que falta es un permiso.
      '/api/facturacion', '/api/facturacion-excel', '/api/cortes', '/api/grc',
      '/api/tickets', '/api/tickets-excel',
      '/api/enriquecimiento',
      '/api/customer-tenure',
    ],
    // Solo lectura: la ficha de cuenta los pinta, pero no deben escribirse.
    //
    // `/api/anexos` entra aquí y no en `apis` a propósito: la ficha de cuenta
    // lista los documentos y hay que poder descargarlos para armar el perfil,
    // pero Perfilamiento no opera cartera — no sube ni borra documentos de
    // cliente. Sin esta línea la ficha pintaría «sin anexos» con un 403
    // detrás, que es peor que un error porque se lee como un dato.
    apisLectura: [
      '/api/seguimientos',
      '/api/reuniones',
      '/api/anexos',
    ],
    inicio: '/cuentas',
  },

  /* ══════════════════════════════════════════════════════════════════════════
     LOS DOS ROLES DE LA ENTREGA — 18 nov 2026
     ══════════════════════════════════════════════════════════════════════════

     POR QUÉ NACEN
     -------------
     El control de entrega de activaciones exige separar «cuenta aprovisionada»
     de «cliente con servicio aceptado», y eso solo significa algo si quien
     ENTREGA no es quien ACEPTA. Hasta hoy no se podía: los roles eran
     admin/asesor/viewer/perfilamiento, y los tres primeros llevan
     `paginas: null, apis: null` — o sea TODO. Con un solo rol operativo, la
     aceptación de SAC sería un botón que aprieta cualquiera, incluido quien
     acaba de entregar. Eso no es un control: es un registro.

     Un usuario tiene UNA fila y UN rol, así que la segregación es estructural:
     nadie puede ser las dos partes a la vez.

     LOS DOS ARRANCAN SIN ESCRIBIR NADA DE LO QUE YA EXISTE, Y NO ES PRUDENCIA
     DE MÁS
     -------------------------------------------------------------------------
     `lib/dueno.ts` acota por cartera SOLO al rol `asesor` (`esRolAcotado`).
     Para cualquier otro rol, `firmaDeSesion` devuelve la firma que venga en el
     CUERPO de la petición, no la de la sesión. Un rol nuevo con permiso de
     escritura sobre `/api/seguimientos` podría dejar un seguimiento firmado con
     el nombre de otra persona — y el propio `dueno.ts` explica por qué eso es
     lo peor que puede pasar: «un rastro falso en la bitácora de una cuenta hace
     responder al asesor suplantado por una gestión que no hizo».

     Así que la escritura de estos dos roles se abre cuando exista el endpoint
     de entrega, que firmará desde la sesión por construcción. Tocar
     `esRolAcotado` para incluirlos NO es la solución barata que parece: dejaría
     a un `sac` sin `asesor_nombre` con 403 en sus propias escrituras, porque
     ese candado falla cerrado.

     `/api/entregas` YA ESTÁ EN LAS DOS LISTAS, Y TODAVÍA NO EXISTE
     --------------------------------------------------------------
     A propósito. `activaciones` lo lleva en `apisLectura` —puede CONSULTAR el
     expediente, nunca escribirlo— y `sac` lo lleva en `apis`. El día que el
     endpoint nazca, el candado ya está puesto. Al revés —construir primero y
     acordarse del permiso después— es como se llega a producción con una
     aceptación que firma quien entregó.

     LO QUE DELIBERADAMENTE NO SE CONCEDE, Y HAY QUE DECIDIR
     -------------------------------------------------------
     El apartado 13 del expediente pide el MRR de la cuenta, y el MRR
     institucional es el del GRC y nada más. Pero `/api/grc` no devuelve el MRR
     de UNA cuenta: devuelve la facturación de la empresa entera. Dárselo a
     Activaciones para rellenar un campo sería abrir el ingreso completo de
     Callpicker a un área que no lo necesita. Queda FUERA, y el expediente
     tendrá que recibir ese dato ya resuelto del lado del servidor.
     ══════════════════════════════════════════════════════════════════════════ */
  activaciones: {
    label: 'Activaciones', color: '#38BDF8',
    descripcion: 'entrega: Activaciones 2.0, ficha de cuenta y tickets. '
               + 'Consulta el expediente de entrega, no lo acepta',
    paginas: [
      '/activaciones',
      '/cuentas',        // la ficha: es la cuenta que está entregando
      '/tickets',
      '/base-cs',
    ],
    apis: [
      '/api/activaciones', '/api/activaciones-excel',
    ],
    // Todo lo demás, de solo lectura. La ficha de cuenta tiene que pintarse
    // —si no, abre vacía con un 403 detrás, que es peor que un error porque se
    // lee como un dato— pero Activaciones no opera cartera.
    apisLectura: [
      '/api/cuentas', '/api/adopcion', '/api/radar', '/api/zoho-lookup',
      '/api/tickets', '/api/tickets-excel',
      '/api/customer-tenure',
      '/api/entregas',   // consulta el expediente. NO lo acepta ni lo firma.
    ],
    inicio: '/activaciones',
  },
  sac: {
    label: 'SAC', color: '#F472B6',
    descripcion: 'recibe y acepta la entrega: Alertas, Cuentas, Reuniones, '
               + 'Tickets, Auditoría y Atlas IA',
    paginas: [
      '/alertas',
      '/cuentas',
      '/seguimiento',
      '/reuniones',
      '/tickets',
      '/auditoria',
      '/chat',
      '/activaciones',   // para ver qué le están entregando
      '/base-cs',
    ],
    apis: [
      '/api/entregas',   // ESTE es el rol que acepta. Es su razón de existir.
      // Atlas IA va completo y no en `apisLectura`: preguntarle es un POST.
      // Con solo lectura, /chat abriría y ninguna pregunta pasaría — el mismo
      // fallo que /api/grc le causó a Perfilamiento en Facturación.
      '/api/chat',
    ],
    // El resto, lectura. Las escrituras de cartera siguen siendo del asesor
    // dueño: ver el bloque de arriba sobre `firmaDeSesion`.
    apisLectura: [
      '/api/alertas',
      '/api/cuentas', '/api/adopcion', '/api/radar', '/api/zoho-lookup',
      '/api/seguimientos', '/api/reuniones', '/api/anexos',
      '/api/tickets', '/api/tickets-excel',
      '/api/activaciones', '/api/activaciones-excel',
      '/api/customer-tenure',
    ],
    inicio: '/alertas',
  },
}

export function definicionRol(rol: string | null | undefined): DefinicionRol {
  return ROLES[(rol ?? 'viewer') as Rol] ?? ROLES.viewer
}

const calza = (lista: string[], pathname: string) =>
  lista.some(p => pathname === p || pathname.startsWith(p + '/'))

/**
 * ¿Este rol puede abrir esta ruta con este método?
 *
 * `metodo` solo importa para las rutas de `apisLectura`: ahí un GET pasa y
 * cualquier escritura no. Sin el método, un rol de consulta podría hacer POST
 * a la misma URL que tiene permitido leer.
 */
export function puedeAbrir(
  rol: string | null | undefined,
  pathname: string,
  metodo = 'GET',
): boolean {
  const def = definicionRol(rol)
  const esApi = pathname.startsWith('/api/')

  if (COMUNES_PAGINAS.some(p => pathname.startsWith(p))) return true
  if (esApi && COMUNES_APIS.some(p => pathname.startsWith(p))) return true

  const permitidas = esApi ? def.apis : def.paginas
  if (permitidas === null) return true

  // La raíz se compara exacta: si no, '/' haría match con todo.
  if (calza(permitidas, pathname)) return true

  if (esApi && def.apisLectura && calza(def.apisLectura, pathname)) {
    return metodo === 'GET' || metodo === 'HEAD'
  }
  return false
}

/** Entradas del menú que este rol debe ver. */
export function puedeVerModulo(rol: string | null | undefined, href: string): boolean {
  const def = definicionRol(rol)
  if (def.paginas === null) return true
  if (href === '/') return def.paginas.includes('/')
  return def.paginas.some(p => href === p || href.startsWith(p + '/'))
}
