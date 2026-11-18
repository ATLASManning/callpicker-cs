import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { supabaseAdmin } from '@/lib/supabase'
import {
  APARTADOS, leeDeHoja, resumenExpediente, fechaDeHoja,
  type FilaHoja, type ValorApartado, type EstadoApartado,
} from '@/lib/entrega-apartados'
import { cargaHoja } from '@/lib/hoja-activaciones'

export const dynamic = 'force-dynamic'

/**
 * EL EXPEDIENTE DE ENTREGA DE UNA ACTIVACIÓN
 * ===========================================
 *
 *     GET /api/entregas/expediente?id=162474
 *
 * Los 20 apartados que Activaciones tiene que entregar al cerrar, cada uno
 * resuelto desde la fuente que de verdad lo contiene. El catálogo —qué
 * apartados hay, de dónde sale cada uno y qué hacer con los que no salen de
 * ninguna parte— vive en `lib/entrega-apartados.ts` y es lo único que hay que
 * tocar para cambiarlo.
 *
 * LA HOJA NO SE TOCA. Instrucción de José Manuel (18 nov 2026): Activaciones
 * sigue trabajando `data/activaciones.xlsx` como hasta ahora. Esto lee, cruza y
 * declara lo que falta encima; no escribe en la hoja ni le pide columnas nuevas.
 *
 * ── POR QUÉ ESTA RUTA DEVUELVE UN MRR Y `/api/grc` SIGUE CERRADO ──────────
 *
 * El rol `activaciones` no puede abrir `/api/grc`, que devuelve la facturación
 * de la empresa entera. Aquí recibe el MRR de UNA cuenta, la que está
 * entregando, porque el apartado 13 lo exige. Es la diferencia entre el dato
 * que necesita para su trabajo y la tabla completa del ingreso, y es
 * exactamente el reparto que se decidió al crear el rol.
 *
 * ── ESCRIBIR AQUÍ NO ESTÁ PERMITIDO TODAVÍA, Y NO ES UN OLVIDO ────────────
 *
 * Esta ruta sólo lee. La aceptación del apartado 20 será un POST, y el candado
 * de `lib/permisos.ts` ya impide que `activaciones` lo alcance: lleva
 * `/api/entregas` en `apisLectura`, no en `apis`. Quien entrega no acepta.
 */

interface CtxFuentes {
  fila:     FilaHoja
  cid:      string
  cuenta:   Record<string, unknown> | null
  grc:      Record<string, unknown> | null
  contrato: Record<string, unknown> | null
  dids:     string[] | null
  /** Cuántas cuentas cubre el archivo de contratos. Sin esto, su ausencia
   *  parecería «no tiene contrato», y son cosas distintas. */
  contratosCubiertos: number
}

type Resuelto = { valor: string; estado: EstadoApartado; detalle?: string }

const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v))
const hay = (v: unknown) => txt(v) !== ''

/** Los contactos extra de `cuentas.contactos_json`, si vienen como lista. */
function contactosExtra(c: Record<string, unknown> | null): Record<string, unknown>[] {
  const j = c?.contactos_json
  return Array.isArray(j) ? j.filter(x => x && typeof x === 'object') : []
}

/* ── UN DATO REPETIDO NO ES UN SEGUNDO DATO ─────────────────────────────────
 *
 * El apartado 07 salía «completo» para Medexp con «5587920966 · 5587920966»:
 * el mismo teléfono dos veces, porque el segundo contacto de la ficha repite
 * el del primero. Un falso «completo» dice que está entregado lo que no está,
 * y éste lo decía con la prueba delante.
 *
 * Se compara sólo por dígitos en los teléfonos y en minúsculas en los correos:
 * «55 8792 0966» y «5587920966» son el mismo número. */
const soloClave = (v: string) =>
  /[@]/.test(v) ? v.trim().toLowerCase() : v.replace(/\D/g, '')

function distintoDe(lista: string[], primero: string): string[] {
  const p = soloClave(primero)
  return lista.filter(v => v && soloClave(v) !== p)
}

/** ¿El segundo contacto repite el valor del primero? Para poder DECIRLO. */
function repetido(c: CtxFuentes, campo: 'tel' | 'email', primero: string): boolean {
  const p = soloClave(primero)
  return contactosExtra(c.cuenta).some(x => {
    const v = campo === 'tel'
      ? (txt(x.tel) || txt(x.telefono))
      : (txt(x.email) || txt(x.correo))
    return Boolean(v) && soloClave(v) === p
  })
}

/**
 * Cómo se resuelve cada apartado que la hoja NO cierra.
 *
 * Un apartado sin entrada aquí se queda con lo que diga la hoja. Los de estado
 * `sin_fuente` y `no_medible` NO llevan resolvedor a propósito: no hay nada que
 * resolver, y ponerles uno que devuelva cadena vacía los convertiría en un
 * hueco silencioso en vez de una ausencia declarada.
 */
const RESUELVE: Record<string, (c: CtxFuentes) => Resuelto> = {
  // El ticket cerrado es media entrega. La otra media es el apartado 20.
  '01': c => {
    const estatus = txt(c.fila['estatus'])
    const cierre  = fechaDeHoja(txt(c.fila['cierreticket']))
    const partes: string[] = []
    // El código se muestra COMO CÓDIGO, no traducido: la hoja no trae leyenda
    // y decir «cerrado» porque pone 5 sería inventar qué significa el 5.
    if (estatus) partes.push(`código de estatus: ${estatus} (sin leyenda)`)
    if (cierre)  partes.push(`cierre de ticket: ${cierre}`)
    return {
      valor: partes.join(' · ') || 'la hoja no dice nada del ticket',
      estado: 'falta',
      detalle: 'Falta la ACEPTACIÓN de SAC (apartado 20), que todavía no existe '
             + 'como registro — un ticket cerrado no es una entrega aceptada. Y '
             + 'la columna `Estatus` de la hoja es un código numérico sin '
             + 'leyenda, así que tampoco se puede afirmar que el ticket esté '
             + 'cerrado sin saber qué significa cada número.',
    }
  },

  '03': c => {
    const enHoja  = txt(c.fila['cliente'])
    const enFicha = txt(c.cuenta?.empresa)
    // Si la hoja y la ficha le llaman distinto, se dicen LOS DOS: quedarse con
    // uno esconde que el mismo cliente está registrado con dos nombres, y eso
    // es justo lo que hace que un cruce por nombre mezcle cuentas.
    const difieren = enHoja && enFicha
      && enHoja.toLowerCase() !== enFicha.toLowerCase()
    return {
      valor: difieren ? `${enFicha}  (en la hoja: ${enHoja})`
                      : (enFicha || enHoja || '—'),
      estado: 'falta',
      detalle: 'Nombre comercial sí. La RAZÓN SOCIAL no existe en ninguna '
             + 'fuente: `cuentas` trae `direccion_fiscal`, que es otra cosa.'
             + (difieren ? ' Ojo: la hoja y la ficha de la cuenta le llaman '
                         + 'distinto.' : ''),
    }
  },

  '04': c => {
    const porta = txt(c.fila['portabilidad'])
    if (c.dids && c.dids.length) {
      const muestra = c.dids.slice(0, 6).join(', ')
      const resto = c.dids.length > 6 ? ` … y ${c.dids.length - 6} más` : ''
      return {
        valor: `${c.dids.length} número(s): ${muestra}${resto}`
             + (hay(porta) ? ` · portabilidad: ${porta}` : ''),
        estado: 'completo',
      }
    }
    return {
      valor: hay(porta) ? `portabilidad: ${porta}` : '—',
      estado: 'falta',
      detalle: c.cid
        ? `No hay DIDs para el CID ${c.cid} en data/dids.json. Cruzar por `
          + 'nombre en vez de por CID mezcla cuentas, así que no se intenta.'
        : 'Sin CID no se puede buscar los DIDs.',
    }
  },

  '05': c => {
    const n = txt(c.cuenta?.contacto_nombre)
    const g = txt(c.cuenta?.contacto_cargo)
    if (!c.cuenta) return { valor: '—', estado: 'falta', detalle: sinCuenta(c) }
    if (n && g) return { valor: `${n} — ${g}`, estado: 'completo' }
    if (n) return { valor: n, estado: 'falta', detalle: 'Falta el CARGO.' }
    return { valor: '—', estado: 'falta', detalle: 'La ficha no tiene contacto 1.' }
  },

  '06': c => {
    if (!c.cuenta) return { valor: '—', estado: 'falta', detalle: sinCuenta(c) }
    const ex = contactosExtra(c.cuenta)
    if (ex.length >= 2) {
      const s = ex[1] as Record<string, unknown>
      const n = txt(s.nombre), g = txt(s.cargo)
      return {
        valor: [n, g].filter(Boolean).join(' — ') || `${ex.length} contactos registrados`,
        estado: n && g ? 'completo' : 'falta',
        detalle: n && g ? undefined : 'Hay un segundo contacto sin cargo.',
      }
    }
    return {
      valor: '—', estado: 'falta',
      detalle: 'La ficha tiene un solo contacto. El prompt admite excepción '
             + 'justificada; lo que no admite es inventar un segundo nombre.',
    }
  },

  '07': c => {
    if (!c.cuenta) return { valor: '—', estado: 'falta', detalle: sinCuenta(c) }
    const t1 = txt(c.cuenta.contacto_tel)
    const t2 = distintoDe(
      contactosExtra(c.cuenta).map(x => txt(x.tel) || txt(x.telefono)), t1)
    if (t1 && t2.length) return { valor: `${t1} · ${t2[0]}`, estado: 'completo' }
    if (t1) {
      return {
        valor: t1, estado: 'falta',
        detalle: 'Sólo un teléfono' + (repetido(c, 'tel', t1)
          ? '. El segundo contacto tiene EL MISMO número, así que no son dos '
            + 'teléfonos: es el mismo apuntado dos veces.'
          : '.'),
      }
    }
    return { valor: '—', estado: 'falta', detalle: 'La ficha no tiene teléfono.' }
  },

  '08': c => {
    if (!c.cuenta) return { valor: '—', estado: 'falta', detalle: sinCuenta(c) }
    const e1 = txt(c.cuenta.contacto_email)
    const e2 = distintoDe(
      contactosExtra(c.cuenta).map(x => txt(x.email) || txt(x.correo)), e1)
    if (e1 && e2.length) return { valor: `${e1} · ${e2[0]}`, estado: 'completo' }
    if (e1) {
      return {
        valor: e1, estado: 'falta',
        detalle: 'Sólo un correo' + (repetido(c, 'email', e1)
          ? '. El segundo contacto tiene EL MISMO correo: es el mismo apuntado '
            + 'dos veces, no dos correos.'
          : '.'),
      }
    }
    return { valor: '—', estado: 'falta', detalle: 'La ficha no tiene correo.' }
  },

  '11': c => {
    if (!c.cuenta) return { valor: '—', estado: 'falta', detalle: sinCuenta(c) }
    const serv = txt(c.cuenta.servicio)
    const sj = c.cuenta.servicios_json
    const lista = Array.isArray(sj) ? sj.length : 0
    const tipo = txt(c.fila['tipo'])
    const partes = [
      serv && `plan: ${serv}`,
      lista && `${lista} servicio(s) registrados`,
      tipo && `tipo en la hoja: ${tipo}`,
    ].filter(Boolean) as string[]
    return {
      valor: partes.join(' · ') || '—',
      estado: serv || lista ? 'falta' : 'falta',
      detalle: 'Lo que NO existe en ninguna fuente es la comparación entre lo '
             + 'CONTRATADO y lo ENTREGADO, que es justo lo que una entrega '
             + 'tendría que demostrar. Sin eso, el apartado no cierra.',
    }
  },

  '13': c => {
    if (!c.grc) {
      return {
        valor: '—', estado: 'falta',
        detalle: c.cid
          ? `El CID ${c.cid} no aparece en el corte del GRC. El MRR es el del `
            + 'GRC y nada más: la columna «1er Pago» de la hoja es el primer '
            + 'cobro, no el MRR, y `cuentas.facturacion` tampoco sirve.'
          : 'Sin CID no se puede buscar el MRR en el GRC.',
      }
    }
    const mrr = Number(c.grc.mrrFin ?? 0)
    if (!(mrr > 0)) {
      return {
        valor: 'el GRC lo registra en 0', estado: 'falta',
        detalle: 'Un MRR en cero en el GRC no es un error de captura: puede ser '
               + 'una cuenta dada de baja. Hay que confirmarlo antes de '
               + 'entregar, no rellenarlo con otro número.',
      }
    }
    return {
      valor: new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN', maximumFractionDigits: 2,
      }).format(mrr) + ' MXN · fuente: GRC',
      estado: 'completo',
    }
  },

  '14': c => {
    if (!c.contrato) {
      return {
        valor: 'no aparece en el archivo de contratos', estado: 'falta',
        detalle: `El archivo cubre ${c.contratosCubiertos} cuentas. Que ésta no `
               + 'esté NO prueba que no tenga contrato: son cosas distintas y '
               + 'hay que confirmarlo.',
      }
    }
    const plazo = txt(c.contrato.plazo) || txt(c.contrato.plazoLibre)
    const ini   = txt(c.contrato.inicio)
    const fin   = c.contrato.sinVencimiento ? 'sin vencimiento' : txt(c.contrato.fin)
    const partes = ['sí', plazo && `plazo: ${plazo}`, ini && `inicio: ${ini}`,
                    fin && `fin: ${fin}`].filter(Boolean) as string[]
    return {
      valor: partes.join(' · '),
      estado: plazo && ini && fin ? 'completo' : 'falta',
      detalle: plazo && ini && fin ? undefined
             : 'El contrato existe pero le falta plazo, inicio o fin.',
    }
  },

  '16': c => {
    const real = fechaDeHoja(txt(c.fila['cierreticket']))
    const arr  = fechaDeHoja(txt(c.fila['arranquedeproceso']))
    const dias = txt(c.fila['diasactivacion'])
    const partes = [arr && `arranque: ${arr}`, real && `entrega real: ${real}`,
                    dias && `${dias} días`].filter(Boolean) as string[]
    return {
      valor: partes.join(' · ') || '—',
      estado: 'falta',
      detalle: 'La fecha PREVISTA no existe en ninguna fuente: la hoja mide '
             + 'días transcurridos, que es un resultado y no un compromiso. Sin '
             + 'fecha prevista no hay cumplimiento que medir.',
    }
  },

  '17': c => {
    const ll = txt(c.fila['realizorecibiollamadas'])
    const la = txt(c.fila['loginadmin'])
    const lp = txt(c.fila['loginapp'])
    const partes = [ll && `llamadas E/S: ${ll}`, la && `login admin: ${la}`,
                    lp && `login app: ${lp}`].filter(Boolean) as string[]
    return {
      valor: partes.join(' · ') || '—',
      estado: 'falta',
      detalle: 'Las llamadas y los dos accesos son indicio de las pruebas. La '
             + 'CAPACITACIÓN y su fecha no existen en ninguna fuente.',
    }
  },

  '19': c => {
    const clas = txt(c.fila['clasificacion'])
    const tipo = txt(c.fila['tipo'])
    const aaa  = txt(c.grc?.clasif)
    const partes = [clas && `hoja: ${clas}`, tipo && `tipo: ${tipo}`,
                    aaa && `banda del GRC: ${aaa}`].filter(Boolean) as string[]
    const completo = Boolean(clas && tipo && aaa)
    return {
      valor: partes.join(' · ') || '—',
      estado: completo ? 'completo' : 'falta',
      detalle: completo ? undefined
        : aaa ? 'Falta la clasificación o el tipo en la hoja.'
              : 'Falta la banda AAA, que es del GRC. La clasificación de la '
                + 'hoja y la banda del GRC son dos cosas distintas y no se '
                + 'sustituyen; la reclasificación de dirección vive aparte.',
    }
  },
}

function sinCuenta(c: CtxFuentes): string {
  return c.cid
    ? `El CID ${c.cid} no está en la cartera de CS (224 cuentas), así que su `
      + 'ficha de contactos no existe. Callpicker factura a muchas más cuentas '
      + 'que las de cartera: esto no es un error, es que el dato está fuera.'
    : 'Sin CID no se puede localizar la ficha de la cuenta.'
}

/* ── La hoja, en caché ──────────────────────────────────────────────────────── */
/* El lector de la hoja vive en `lib/hoja-activaciones.ts`: lo comparten esta
   ruta y el buscador, que tiene que alcanzar las 2,820. Tenerlo dos veces
   era garantizar que un día leyeran distinto. */

async function leeJson(nombre: string): Promise<unknown | null> {
  const fs = (await import('fs')).default
  const ruta = path.join(process.cwd(), 'data', nombre)
  if (!fs.existsSync(ruta)) return null
  try { return JSON.parse(fs.readFileSync(ruta, 'utf8')) } catch { return null }
}

export async function GET(req: NextRequest) {
  try {
    const id = (req.nextUrl.searchParams.get('id') ?? '').trim()
    if (!id) return NextResponse.json({ error: 'Indica id' }, { status: 400 })

    const hoja = await cargaHoja()
    if (!hoja) {
      return NextResponse.json(
        { error: 'data/activaciones.xlsx no disponible' }, { status: 404 })
    }
    const fila = hoja.filas.get(id)
    if (!fila) {
      return NextResponse.json(
        { error: `No hay ninguna activación con ID ${id}` }, { status: 404 })
    }

    const cid = fila['id'] ?? ''

    /* ── Las otras fuentes ─────────────────────────────────────────────────── */
    let cuenta: Record<string, unknown> | null = null
    let errCuenta: string | null = null
    try {
      const { data, error } = await supabaseAdmin
        .from('cuentas')
        .select('id, cid, empresa, contacto_nombre, contacto_cargo, contacto_tel, '
              + 'contacto_email, contactos_json, servicio, servicios_json, '
              + 'observaciones_kam, notas, asesor')
        .eq('cid', cid)
        .maybeSingle()
      if (error) throw error
      cuenta = (data as Record<string, unknown> | null) ?? null
    } catch (e) {
      // NO se devuelve `cuenta: null` a secas: «no se pudo leer» y «no existe»
      // son cosas distintas, y confundirlas convierte una falla en un dato.
      errCuenta = String(e)
    }

    const grcDoc = await leeJson('grc-zoho.json') as { filas?: Record<string, unknown>[] } | null
    const grc = (grcDoc?.filas ?? []).find(f => String(f.cid ?? '').trim() === cid) ?? null

    const ctDoc = await leeJson('contratos.json') as { contratos?: Record<string, unknown>[] } | null
    const contratosLista = ctDoc?.contratos ?? []
    const contrato = contratosLista.find(f => String(f.cid ?? '').trim() === cid) ?? null

    const didDoc = await leeJson('dids.json') as { porCid?: Record<string, unknown> } | null
    const didEntrada = didDoc?.porCid?.[cid]
    const dids: string[] | null = Array.isArray(didEntrada)
      ? didEntrada.map(d => typeof d === 'string' ? d : String((d as Record<string, unknown>)?.numero ?? '')).filter(Boolean)
      : didEntrada && typeof didEntrada === 'object'
        && Array.isArray((didEntrada as Record<string, unknown>).numeros)
        ? ((didEntrada as Record<string, unknown>).numeros as unknown[])
            .map(d => typeof d === 'string' ? d : String((d as Record<string, unknown>)?.numero ?? ''))
            .filter(Boolean)
        : null

    const ctx: CtxFuentes = {
      fila, cid, cuenta, grc, contrato, dids,
      contratosCubiertos: contratosLista.length,
    }

    /* ── Los 20 apartados ──────────────────────────────────────────────────── */
    const apartados: (ValorApartado & { detalle?: string })[] = APARTADOS.map(ap => {
      const base = leeDeHoja(ap, fila)
      // Lo que no existe no se resuelve: se declara. Un resolvedor que
      // devolviera cadena vacía lo convertiría en un hueco silencioso.
      if (base.estado === 'sin_fuente' || base.estado === 'no_medible') return base

      const r = RESUELVE[ap.clave]
      if (!r) return base   // la hoja lo cierra: `leeDeHoja` ya decidió

      const res = r(ctx)
      return { ...base, estado: res.estado, valor: res.valor, detalle: res.detalle }
    })

    return NextResponse.json({
      id, cid,
      cliente: fila['cliente'] ?? '',
      apartados,
      resumen: resumenExpediente(apartados),
      fuentes: {
        cuentaEnCartera: Boolean(cuenta),
        // Se dice cuando una fuente FALLÓ, en vez de dejarla como ausente.
        cuentaError: errCuenta,
        enGrc: Boolean(grc),
        conContrato: Boolean(contrato),
        didsEncontrados: dids ? dids.length : 0,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
