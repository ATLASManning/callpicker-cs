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
export const CANDADO_VERSION = '2026-10-15.3-lectura-libre-escritura-propia'

/* ── LA POLÍTICA, EN UNA SOLA CONSTANTE ─────────────────────────────────────
 *
 * Instrucción de dirección (José Manuel, 15 oct 2026), textual: «Ellos solo
 * pueden escribir en sus propias cuentas asignadas no en las de los otros
 * asesores. pueden consultar y yo José Manuel como administrador puedo y tengo
 * la facultad para asignar cuentas y cambiar de asesor».
 *
 * O sea: la línea NO va entre carteras, va entre LEER y ESCRIBIR.
 *
 *   · CONSULTAR  → libre. Un asesor puede abrir la ficha, el radar, la
 *                  adopción, los seguimientos, los anexos y la facturación de
 *                  cualquier cuenta, y preguntarle a Atlas por ella.
 *   · ESCRIBIR   → sólo en sus cuentas asignadas, y firmado con SU nombre.
 *   · ASIGNAR    → sólo administración. Un asesor no se adjudica una cuenta ni
 *                  se la pasa a otro.
 *
 * `LECTURA_LIBRE = false` vuelve a acotar la consulta por cartera, y toda la
 * maquinaria para eso sigue aquí y probada: es la escotilla, por si dirección
 * cambia de criterio. No hay que volver a escribirla, sólo mover la constante.
 *
 * LO QUE NO DEPENDE DE ESTA CONSTANTE, y por eso no está aquí: que una cuenta
 * la escriba sólo su asesor, que la firma la ponga la sesión y no el cuerpo, y
 * que mover cartera sea de administración. Eso no es una preferencia de
 * visibilidad: un rastro falso en la bitácora de una cuenta hace responder al
 * asesor suplantado por una gestión que no hizo.
 */
export const LECTURA_LIBRE = true

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

/** ¿Es un rol al que la cartera le marca lo que puede ESCRIBIR? */
export function esRolAcotado(s: Sesion): boolean {
  return s.rol === 'asesor'
}

/**
 * ¿Hay que acotarle la CONSULTA a su cartera?
 *
 * Hoy no, por instrucción de dirección — ver `LECTURA_LIBRE`. Se pregunta con
 * esta función y no con `esRolAcotado` para que la diferencia entre «leer» y
 * «escribir» esté escrita en el código y no haya que deducirla.
 */
export function acotaLectura(s: Sesion): boolean {
  return esRolAcotado(s) && !LECTURA_LIBRE
}

export const MENSAJE_SIN_CARTERA =
  'La sesión tiene rol de asesor pero no trae asignada una cartera. '
  + 'Pedir a administración que complete el usuario.'

/**
 * ¿Es de esta sesión un dato cuyo dueño es `dueno`? Es la pregunta de la
 * ESCRITURA, y no depende de `LECTURA_LIBRE`: escribir en cartera ajena no se
 * abre nunca.
 */
export function esSuya(s: Sesion, dueno: string | null | undefined): boolean {
  if (!esRolAcotado(s)) return true
  const suyo = normalizaAsesor(s.asesor)
  if (!suyo) return false          // rol sin cartera: no se concede nada
  return normalizaAsesor(dueno) === suyo
}

/**
 * ¿Puede CONSULTAR este dato? Con `LECTURA_LIBRE` siempre sí; si algún día se
 * cierra, cae en la misma regla de pertenencia que la escritura.
 */
export function puedeConsultar(s: Sesion, dueno: string | null | undefined): boolean {
  if (LECTURA_LIBRE) return true
  return esSuya(s, dueno)
}

export type Cartera =
  | { ok: true;  asesor: string | undefined }
  | { ok: false; res: NextResponse }

/**
 * LA CARTERA DE TRABAJO — para las listas que son la superficie de trabajo de
 * un asesor: `/api/cuentas`, `/api/leads`, su portada, su seguimiento.
 *
 * Por omisión devuelve SU cartera, y eso NO es un candado: es su cola de
 * trabajo. Que la pantalla de Claudia abra con sus 71 cuentas y no con las 223
 * de la empresa es lo que la hace servir para algo, y así ha funcionado desde
 * siempre en este tablero.
 *
 * Con `LECTURA_LIBRE` un `?asesor=` EXPLÍCITO se respeta: eso es consultar, y
 * consultar está permitido. Sin el parámetro no se le cambia la vista debajo.
 *
 * Un rol `asesor` sin cartera ya no recibe 403 aquí —consultar es libre— y cae
 * en «toda», que es lo que pidió: nada que recortar. La escritura sí lo sigue
 * rechazando, en `firmaDeSesion`.
 */
export function carteraDeTrabajo(
  h: LectorCabeceras,
  pedido?: string | null,
): Cartera {
  const s = sesionDe(h)
  if (esRolAcotado(s)) {
    const quiere = pedido?.trim() || ''
    if (LECTURA_LIBRE && quiere) return { ok: true, asesor: quiere }
    if (!s.asesor) {
      if (LECTURA_LIBRE) return { ok: true, asesor: undefined }
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
 * LA CARTERA CONSULTADA — para las tablas que no son cola de trabajo sino
 * consulta, como `/api/relacionamiento`: ahí lo natural es ver todo y filtrar
 * si se quiere, no abrir recortado.
 */
export function carteraConsultada(
  h: LectorCabeceras,
  pedido?: string | null,
): Cartera {
  const s = sesionDe(h)
  const quiere = pedido?.trim() || ''
  if (acotaLectura(s)) {
    if (quiere && normalizaAsesor(quiere) !== normalizaAsesor(s.asesor)) {
      return {
        ok: false,
        res: NextResponse.json(
          { error: 'No existe esa cartera para tu sesión.' }, { status: 404 }),
      }
    }
    if (!s.asesor) {
      return {
        ok: false,
        res: NextResponse.json({ error: MENSAJE_SIN_CARTERA }, { status: 403 }),
      }
    }
    return { ok: true, asesor: s.asesor }
  }
  return { ok: true, asesor: quiere || undefined }
}

/** @deprecated Usar `carteraDeTrabajo` o `carteraConsultada`, que dicen cuál es
 *  cuál. Se conserva el nombre para no romper una llamada que se quede atrás. */
export const carteraDeSesion = carteraDeTrabajo

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
 * `para` DICE PARA QUÉ SE PREGUNTA, y es lo que separa las dos políticas:
 * `'lectura'` pasa siempre con `LECTURA_LIBRE`; `'escritura'` exige pertenencia
 * siempre. Es obligatorio y no tiene valor por omisión a propósito — quien
 * escriba la siguiente ruta tiene que decidirlo, no heredarlo por descuido.
 *
 * EL 404 NO ES UN DESCUIDO cuando corta. Una cuenta que existe pero es de otra
 * cartera responde igual que una que no existe: un 403 distinguible confirmaría
 * que el identificador es real.
 */
export async function exigeDuenoDeCuenta(
  h: LectorCabeceras,
  cuentaId: string,
  para: 'lectura' | 'escritura',
): Promise<NextResponse | null> {
  const s = sesionDe(h)
  if (!esRolAcotado(s)) return null
  if (para === 'lectura' && LECTURA_LIBRE) return null
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
