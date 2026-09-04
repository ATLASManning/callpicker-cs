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

export type Rol = 'admin' | 'asesor' | 'viewer' | 'perfilamiento'

export interface DefinicionRol {
  label:   string
  color:   string
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
const COMUNES_PAGINAS = ['/acceso', '/docs/']
const COMUNES_APIS    = ['/api/auth/', '/api/analytics', '/api/admin/me']

export const ROLES: Record<Rol, DefinicionRol> = {
  admin: {
    label: 'Admin', color: '#60A5FA',
    paginas: null, apis: null, inicio: '/',
  },
  asesor: {
    label: 'Asesor', color: '#34D399',
    paginas: null, apis: null, inicio: '/',
  },
  viewer: {
    label: 'Viewer', color: '#FBBF24',
    paginas: null, apis: null, inicio: '/',
  },
  perfilamiento: {
    label: 'Perfilamiento', color: '#A855F7',
    paginas: [
      '/activaciones',   // Activaciones 2.0
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
      '/api/facturacion', '/api/facturacion-excel', '/api/cortes',
      '/api/tickets', '/api/tickets-excel',
      '/api/enriquecimiento',
      '/api/customer-tenure',
    ],
    // Solo lectura: la ficha de cuenta los pinta, pero no deben escribirse.
    apisLectura: [
      '/api/seguimientos',
      '/api/actividades',
      '/api/reuniones',
    ],
    inicio: '/cuentas',
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
