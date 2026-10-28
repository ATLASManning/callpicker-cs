/**
 * Texto de expediente con las dos marcas que SÍ se escriben en las auditorías.
 *
 * POR QUÉ EXISTE. Los 42 expedientes están escritos en prosa con dos
 * convenciones que nadie acordó pero todo el mundo usa: `**énfasis**` y
 * `` `identificador` ``. Ninguna de las dos se pintaba: la pantalla publicaba
 * los asteriscos y las comillas invertidas tal cual. Al 28 oct 2026 eran
 * **setenta** marcas de énfasis en seis expedientes —PROBEMEDIC solo tenía 34—
 * y backticks en casi todos. No lo cazó ninguna prueba de datos porque los
 * datos estaban bien: lo que fallaba era lo que se leía.
 *
 * Se eligió PINTARLAS y no borrarlas porque las dos dicen algo que el lector
 * necesita: el énfasis marca la frase que cambia una decisión, y el backtick
 * distingue `cuentas.facturacion` —una columna— de una palabra cualquiera. En
 * un documento que lee Dirección General esa diferencia importa.
 *
 * NO ES UN MOTOR DE MARKDOWN y no debe convertirse en uno. Son dos marcas, sin
 * anidamiento, y el texto que no las lleva sale intacto. Cualquier otra cosa
 * (listas, enlaces, encabezados) se escribe con palabras.
 */
import { Fragment, type ReactNode } from 'react'

/** `**énfasis**` y `` `código` ``, en una sola pasada para no re-procesar. */
const MARCAS = /\*\*([^*]+)\*\*|`([^`]+)`/g

export function rico(texto: string): ReactNode {
  if (!texto || (!texto.includes('**') && !texto.includes('`'))) return texto

  const partes: ReactNode[] = []
  let desde = 0
  let m: RegExpExecArray | null
  MARCAS.lastIndex = 0

  while ((m = MARCAS.exec(texto)) !== null) {
    if (m.index > desde) partes.push(texto.slice(desde, m.index))
    if (m[1] !== undefined) {
      partes.push(<strong key={m.index} className="font-bold">{m[1]}</strong>)
    } else {
      /* El chip hereda el color del texto que lo rodea: estas fichas viven
         tanto sobre tarjeta clara como sobre `.cp-card` oscura, y fijar un
         color aquí es justo el bug que documenta la arquitectura de
         contraste. `currentColor` al 8% funciona sobre los dos fondos. */
      partes.push(
        <code
          key={m.index}
          className="rounded px-[0.3em] py-[0.1em] text-[0.92em] font-mono"
          style={{ background: 'color-mix(in srgb, currentColor 8%, transparent)' }}
        >
          {m[2]}
        </code>,
      )
    }
    desde = m.index + m[0].length
  }
  if (desde < texto.length) partes.push(texto.slice(desde))

  return <>{partes.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>
}

/** La misma conversión, como componente, para usar en JSX sin ruido. */
export default function Rico({ children }: { children: string | null | undefined }) {
  return <>{rico(children ?? '')}</>
}
