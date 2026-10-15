/**
 * lib/dueno.ts — DE QUIÉN SON LOS DATOS.
 *
 * Una auditoría adversarial del 6 oct 2026 encontró diez rutas que entregaban
 * o escribían cartera ajena. El 12 oct dirección devolvió el acceso a los tres
 * asesores, así que desde esa fecha las fugas están vivas. Esto las cierra, y
 * las cierra EN UN SOLO SITIO a propósito: el hallazgo no fue «una ruta mala»
 * sino la misma comprobación ausente copiada diez veces. Diez copias del
 * arreglo se vuelven a desalinear en la siguiente ruta que alguien escriba.
 *
 * ── LAS DOS REGLAS ────────────────────────────────────────────────────────
 *
 * 1. FALLA CERRADO. El patrón que había era `rol === 'asesor' && asesor`, que
 *    parece defensivo y es lo contrario: con el rol puesto y el nombre vacío la
 *    condición se cae, el filtro desaparece y se sirve la empresa entera. A
 *    quien se le olvida el nombre no se le ve menos, se le ve TODO. Aquí un rol
 *    `asesor` sin cartera no recibe datos: 403 y a pedirle a administración que
 *    complete el usuario.
 *
 * 2. EL FILTRO VA EN LA CONSULTA, no en lo que se pinta. Recortar al final deja
 *    el dato en el servidor y lo manda igual cuando alguien añade un campo; y
 *    en el caso de Atlas IA lo mandaba al modelo, que lo redactaba en prosa.
 *
 * ── LA ESCOTILLA ──────────────────────────────────────────────────────────
 *
 * El candado SOLO muerde al rol `asesor`. `admin` —y `viewer`, que es de
 * consulta y no opera cartera— siguen viendo todo: administración tiene que
 * poder mirar la cartera entera sin pedirle permiso al candado.
 *
 * ── POR QUÉ SE COMPARA NORMALIZANDO ───────────────────────────────────────
 *
 * El nombre de la sesión sale de `usuarios.asesor_nombre` (lo elige un select
 * en Gestión de Usuarios) y el dueño del dato sale de `cuentas.asesor` (lo
 * escribe la carga semanal). Son dos columnas que nadie ha obligado nunca a
 * coincidir, y con un candado fail-closed una diferencia de un acento es una
 * expulsión silenciosa de su propia cartera. Se compara sin acentos, sin caja
 * y sin puntuación. Medido el 15 oct 2026 con `scripts/mide-dueno-cartera.py`:
 * 223 cuentas, tres asesores, 76/76/71 y cero huérfanas — nadie se queda fuera.
 * Ese script es el que hay que volver a correr si alguien toca esta función.
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Qué versión del candado está sirviendo. Se sube A MANO con cada cambio que
 * haya que poder confirmar desde fuera, y viaja en el campo `alcance` de
 * `/api/relacionamiento`.
 *
 * Existe por la misma razón que el `VERSION` de `/api/alertas`: «lo desplegué»
 * no es «lo están viendo». Verificando este candado perdí una ronda porque la
 * marca que usé —el campo `alcance`— ya existía del despliegue anterior, así
 * que no distinguía un build del siguiente, y una sonda en falla no decía si el
 * código no estaba en línea o si estaba mal. Vercel no publica el `buildId` en
 * esta app y no hay token para preguntarle.
 */
export const CANDADO_VERSION = '2026-10-15.2-alcance-sin-invencion'

export interface Sesion {
  rol: string
  /** `usuarios.asesor_nombre`, ya decodificado. Cadena vacía si no trae. */
  asesor: string
}

/** Lo único que se necesita de un `NextRequest.headers` o de un `headers()`.
 *
 *  Se escribe como PROPIEDAD con tipo función y no como firma de método
 *  (`get(n: string): string`), que sería lo natural: `scripts/revisa-no-
 *  definidos.py` lee esa firma como una llamada a una función que nadie
 *  declaró y acusa en falso. Es el primer sitio del repo con un método en una
 *  interface, así que el punto ciego no se había tocado nunca. Se deja así
 *  para no debilitar el detector; arreglarlo es tarea aparte. */
export type LectorCabeceras = {
  get: (nombre: string) => string | null | undefined
}

/**
 * La misma normalización que `norm()` en `scripts/mide-dueno-cartera.py`. Si
 * las dos se separan, el script deja de medir lo que el código hace.
 */
export function normalizaAsesor(v: string | null | undefined): string {
  return String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function sesionDe(h: LectorCabeceras): Sesion {
  const rol = h.get('x-user-rol') ?? 'viewer'
  const bruto = h.get('x-user-asesor') ?? ''
  let asesor = ''
  try {
    asesor = decodeURIComponent(bruto).trim()
  } catch {
    /* Una cabecera mal codificada NO se interpreta a medias: se deja vacía y
       el rol `asesor` cae en el 403 de abajo. Falla cerrado. */
    asesor = ''
  }
  return { rol, asesor }
}

/** ¿A esta sesión hay que acotarle lo que ve a una sola cartera? */
export function esRolAcotado(s: Sesion): boolean {
  return s.rol === 'asesor'
}

export const MENSAJE_SIN_CARTERA =
  'La sesión tiene rol de asesor pero no trae asignada una cartera. '
  + 'Pedir a administración que complete el usuario.'

/** ¿Es de esta sesión un dato cuyo dueño es `dueno`? */
export function esSuya(s: Sesion, dueno: string | null | undefined): boolean {
  if (!esRolAcotado(s)) return true
  const suyo = normalizaAsesor(s.asesor)
  if (!suyo) return false          // rol sin cartera: no se concede nada
  return normalizaAsesor(dueno) === suyo
}

export type Cartera =
  | { ok: true;  asesor: string | undefined }
  | { ok: false; res: NextResponse }

/**
 * La cartera que esta petición puede mirar.
 *
 * Para un `asesor` devuelve SU nombre, ignorando cualquier `?asesor=` que
 * venga del cliente: el filtro no es decorativo. Para los demás roles devuelve
 * lo que pidan (o `undefined`, que es «toda»).
 */
export function carteraDeSesion(
  h: LectorCabeceras,
  pedido?: string | null,
): Cartera {
  const s = sesionDe(h)
  if (esRolAcotado(s)) {
    if (!s.asesor) {
      return {
        ok: false,
        res: NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 }),
      }
    }
    return { ok: true, asesor: s.asesor }
  }
  return { ok: true, asesor: pedido?.trim() || undefined }
}

/**
 * Quién firma una escritura.
 *
 * Un `asesor` firma con el nombre de SU sesión, nunca con el que venga en el
 * cuerpo: sin esto se puede escribir en cartera ajena firmado con el nombre de
 * otra persona, que es peor que escribir sin permiso porque deja rastro falso.
 */
export function firmaDeSesion(
  h: LectorCabeceras,
  propuesta?: string | null,
): { ok: true; asesor: string | null } | { ok: false; res: NextResponse } {
  const s = sesionDe(h)
  if (esRolAcotado(s)) {
    if (!s.asesor) {
      return {
        ok: false,
        res: NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 }),
      }
    }
    return { ok: true, asesor: s.asesor }
  }
  return { ok: true, asesor: propuesta?.trim() || null }
}

/** El dueño de una cuenta. `undefined` = la cuenta no existe. */
export async function duenoDeCuenta(
  cuentaId: string,
): Promise<string | null | undefined> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('asesor')
    .eq('id', cuentaId)
    .maybeSingle()
  if (error) throw error
  if (!data) return undefined
  return (data as { asesor: string | null }).asesor
}

/**
 * Exige que la cuenta sea de esta sesión.
 *
 * Devuelve `null` cuando puede pasar, o la respuesta con la que hay que cortar.
 *
 * EL 404 NO ES UN DESCUIDO. Una cuenta que existe pero es de otra cartera
 * responde igual que una que no existe: un 403 distinguible confirmaría que el
 * identificador es real, y eso ya es información sobre la cartera ajena.
 */
export async function exigeDuenoDeCuenta(
  h: LectorCabeceras,
  cuentaId: string,
): Promise<NextResponse | null> {
  const s = sesionDe(h)
  if (!esRolAcotado(s)) return null
  if (!s.asesor) {
    return NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 })
  }
  let dueno: string | null | undefined
  try {
    dueno = await duenoDeCuenta(cuentaId)
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
  if (dueno === undefined || !esSuya(s, dueno)) {
    return NextResponse.json(
      { error: 'No existe esa cuenta en tu cartera.' },
      { status: 404 },
    )
  }
  return null
}

/**
 * Los `cuentas.id` de una cartera, para filtrar EN LA CONSULTA las tablas que
 * cuelgan de una cuenta (anexos, por ejemplo) y no traen el nombre del asesor.
 */
export async function cuentaIdsDeAsesor(asesor: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('cuentas')
    .select('id, asesor')
  if (error) throw error
  const suyo = normalizaAsesor(asesor)
  return (data ?? [])
    .filter(r => normalizaAsesor((r as { asesor: string | null }).asesor) === suyo)
    .map(r => String((r as { id: unknown }).id))
}
