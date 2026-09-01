/**
 * Proveedor INTERNO — el más valioso y el que no toca la red.
 *
 * Muchas fichas traen datos correctos mal ubicados: el correo pegado dentro del
 * nombre del contacto, un segundo teléfono dentro del campo de teléfono, el
 * dominio dentro de las observaciones. Ese dato ya es del KAM: rescatarlo al
 * campo que le corresponde es enriquecimiento de máxima confianza y coste cero.
 *
 * Aun así se propone como CANDIDATO, nunca se escribe: el KAM confirma.
 */
import type { CuentaLectura, Hallazgo } from '../tipos'
import { extraerEmails, extraerTelefonos, esValorReal, dominioCanonico } from '../normalizar'

export const NOMBRE = 'interno'
export const VERSION = '1.0.0'

/** Recorta el fragmento alrededor del hallazgo para dejar evidencia legible. */
function evidenciaDe(campoOrigen: string, texto: string): string {
  const t = String(texto ?? '').replace(/\s+/g, ' ').trim()
  return `Campo "${campoOrigen}" de la ficha: "${t.slice(0, 180)}"`
}

export function buscar(cuenta: CuentaLectura): Hallazgo[] {
  const out: Hallazgo[] = []

  const campos: Array<[string, string | null]> = [
    ['contacto_nombre',   cuenta.contacto_nombre],
    ['contacto_cargo',    cuenta.contacto_cargo],
    ['contacto_tel',      cuenta.contacto_tel],
    ['observaciones_kam', cuenta.observaciones_kam],
    ['direccion_fiscal',  cuenta.direccion_fiscal],
  ]

  // 1. Correos escondidos en campos que no son el de correo
  if (!esValorReal(cuenta.contacto_email)) {
    for (const [nombre, valor] of campos) {
      if (nombre === 'contacto_email' || !valor) continue
      for (const email of extraerEmails(valor)) {
        out.push({
          campo: 'contacto_email',
          valor: email,
          fuente_tipo: 'interno',
          fuente_nombre: `Ficha de la cuenta · campo ${nombre}`,
          evidencia: evidenciaDe(nombre, valor),
          corroboraciones: 1,
        })
      }
    }
  }

  // 2. Teléfonos adicionales dentro del propio campo de teléfono o del nombre
  const telPrincipal = extraerTelefonos(cuenta.contacto_tel)[0] ?? ''
  for (const [nombre, valor] of campos) {
    if (!valor) continue
    for (const tel of extraerTelefonos(valor)) {
      if (tel && tel !== telPrincipal && nombre !== 'direccion_fiscal') {
        out.push({
          campo: 'telefono_corporativo',
          valor: tel,
          fuente_tipo: 'interno',
          fuente_nombre: `Ficha de la cuenta · campo ${nombre}`,
          evidencia: evidenciaDe(nombre, valor),
          corroboraciones: 1,
        })
      }
    }
  }

  // 3. Dominio del correo del contacto → pista del sitio oficial cuando falta
  if (!esValorReal(cuenta.pagina_web)) {
    const emails = [
      ...extraerEmails(cuenta.contacto_email),
      ...extraerEmails(cuenta.contacto_nombre),
    ]
    const GENERICOS = new Set([
      'gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.com.mx',
      'live.com','icloud.com','prodigy.net.mx','me.com',
    ])
    for (const e of emails) {
      const dom = e.split('@')[1]
      if (dom && !GENERICOS.has(dom)) {
        out.push({
          campo: 'pagina_web',
          valor: `https://${dom}`,
          fuente_tipo: 'interno',
          fuente_nombre: 'Dominio del correo registrado en la ficha',
          evidencia: `El correo "${e}" de la ficha usa el dominio corporativo "${dom}".`,
          corroboraciones: 1,
          // Es una deducción razonable, no un dominio verificado: techo explícito.
          estado_verificacion: 'probable',
        })
      }
    }
  }

  // 4. Sitio ya capturado pero mal formado (sin protocolo, con espacios)
  if (esValorReal(cuenta.pagina_web)) {
    const host = dominioCanonico(cuenta.pagina_web)
    const crudo = String(cuenta.pagina_web).trim()
    if (host && !/^https?:\/\//i.test(crudo)) {
      out.push({
        campo: 'pagina_web',
        valor: `https://${host}`,
        fuente_tipo: 'interno',
        fuente_nombre: 'Normalización del sitio ya capturado',
        evidencia: `La ficha tiene "${crudo}"; la forma canónica es "https://${host}".`,
        corroboraciones: 1,
      })
    }
  }

  return out
}
