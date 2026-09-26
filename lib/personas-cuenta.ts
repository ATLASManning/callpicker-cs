/**
 * lib/personas-cuenta.ts — quién es quién en una cuenta, sin arrastrar nada.
 *
 * POR QUÉ ESTÁ SOLO
 * -----------------
 * Lo necesitan los dos extremos del Mapa de Decisores: el generador, que arma la
 * tarea con lo que ya sabemos, y la ruta que la cierra, que verifica que el
 * trabajo quedó guardado. Si viviera en `lib/focos-riesgo.ts` —que es donde
 * nació— la ruta de cierre tendría que importar de ahí, y ese módulo arrastra
 * los 3.5 MB de `lib/tickets-data.json` más el Excel de cortes en una ruta que
 * es interactiva. Aquí solo depende de `lib/valores.ts`, que no depende de nada.
 *
 * EL PROBLEMA QUE RESUELVE
 * ------------------------
 * `contactos_json` es un arreglo libre y mezcla tres cosas distintas que el
 * tablero contaba como una sola: personas con nombre, buzones genéricos
 * (`hola@`, `ventas@`) y entradas a medias. Clikauto figuraba con «tres
 * contactos» cuando tenía dos personas y un buzón — y una de las dos era la
 * única con la que se hablaba desde junio.
 *
 * Para un mapa de decisores un buzón no cuenta: no decide, no influye, y no se
 * le puede preguntar nada.
 */
import { esValorReal, esTelefonoReal } from './valores'

/** Lo mínimo que hace falta leer de `cuentas` para saber quién es quién. */
export interface CuentaConContactos {
  contacto_nombre?: string | null
  contacto_cargo?: string | null
  contacto_email?: string | null
  contacto_tel?: string | null
  contactos_json?: unknown
}

export interface PersonaCuenta {
  nombre: string
  cargo: string
  email: string
  tel: string
  /** El teléfono se puede marcar (no son quince ceros). Ver `esTelefonoReal`. */
  telUtil: boolean
  /** El correo es de una persona, no un buzón de área. */
  correoPersonal: boolean
}

const BUZONES = /^(hola|info|contacto|ventas|soporte|ayuda|atencion|atenci[oó]n|administracion|administraci[oó]n|admin|facturacion|facturaci[oó]n|cobranza|sistemas|compras|rh|recursos|help|support|sales|billing|noreply|no-reply|webmaster|marketing)@/i

/** Las personas registradas hoy en la cuenta, sin duplicados. */
export function personasDeCuenta(c: CuentaConContactos): PersonaCuenta[] {
  const out: PersonaCuenta[] = []
  const vistos = new Set<string>()

  const agrega = (nombre: unknown, cargo: unknown, email: unknown, tel: unknown) => {
    const n = esValorReal(nombre) ? String(nombre).trim() : ''
    const e = esValorReal(email) ? String(email).trim() : ''
    /* La clave de deduplicación es el nombre, y el correo solo cuando no hay
       nombre. Así una persona registrada dos veces con correos distintos no se
       cuenta doble, y dos buzones distintos sí se distinguen entre sí. */
    const clave = (n || e).toLowerCase()
    if (!clave || vistos.has(clave)) return
    vistos.add(clave)
    out.push({
      nombre: n,
      cargo: esValorReal(cargo) ? String(cargo).trim() : '',
      email: e,
      tel: esTelefonoReal(tel) ? String(tel).trim() : '',
      telUtil: esTelefonoReal(tel),
      correoPersonal: e !== '' && !BUZONES.test(e),
    })
  }

  agrega(c.contacto_nombre, c.contacto_cargo, c.contacto_email, c.contacto_tel)

  let lista: unknown = c.contactos_json
  if (typeof lista === 'string') {
    try { lista = JSON.parse(lista) } catch { lista = null }
  }
  if (Array.isArray(lista)) {
    for (const x of lista) {
      if (!x || typeof x !== 'object') continue
      const r = x as Record<string, unknown>
      agrega(r.nombre, r.cargo, r.email, r.tel)
    }
  }
  return out
}

/** Solo las que son PERSONAS: con nombre. Un buzón de área no es un decisor. */
export function personasConNombre(c: CuentaConContactos): PersonaCuenta[] {
  return personasDeCuenta(c).filter(p => p.nombre)
}

/** Sin acentos, sin dobles espacios, en minúsculas. Para comparar nombres. */
function clave(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Busca entre las personas de la cuenta a la que el asesor declaró que DECIDE.
 *
 * POR QUÉ HACE FALTA
 * ------------------
 * Exigir «dos personas con nombre y cargo» NO basta, y se comprobó con el caso
 * que lo originó: Clikauto ya tenía dos —Alejandra Villacis («Contacto
 * Operativo») y Alan García («Aclaraciones»)— así que habría pasado el candado
 * sin que nadie identificara a un decisor. Dos contactos operativos no son un
 * mapa de decisores: son la misma dependencia repartida.
 *
 * Así que además hay que declarar QUIÉN DECIDE, por nombre, y ese nombre tiene
 * que existir en la ficha. No se puede cumplir con prosa: o la persona está
 * registrada o no está. Y como la declaración queda escrita con su cargo,
 * «decide el Contacto Operativo» se lee solo.
 *
 * La comparación es tolerante con el acento y el orden de los apellidos, porque
 * el objetivo es verificar el trabajo, no ganarle al asesor por una tilde.
 */
export function buscaDecisor(
  c: CuentaConContactos, nombreDeclarado: unknown,
): PersonaCuenta | null {
  const q = clave(String(nombreDeclarado ?? ''))
  if (!q) return null
  const gente = personasConNombre(c)

  const exacto = gente.find(p => clave(p.nombre) === q)
  if (exacto) return exacto

  /* Coincidencia por partes: «Alejandra Villacis» contra «Villacis Alejandra»,
     o contra «Alejandra Villacís Ruiz». Se exige que TODAS las palabras del
     nombre declarado (de 3 letras o más) estén en el registrado, o al revés —
     así «Ana» no empareja con «Ana Ruiz» sin más, pero «Ana Ruiz» sí con
     «Ana María Ruiz». */
  const partes = q.split(' ').filter(w => w.length >= 3)
  if (partes.length < 2) return null
  return gente.find(p => {
    const pr = clave(p.nombre).split(' ').filter(w => w.length >= 3)
    if (pr.length < 2) return false
    return partes.every(w => pr.includes(w)) || pr.every(w => partes.includes(w))
  }) ?? null
}
