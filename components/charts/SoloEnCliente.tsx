'use client'
import { useEffect, useState, type ReactNode } from 'react'

/**
 * Monta su contenido SÓLO en el navegador. Para las gráficas de recharts.
 *
 * ── EL DEFECTO QUE RESUELVE ───────────────────────────────────────────────
 * 14 oct 2026, visto en `/activaciones` y confirmado en la consola:
 *
 *     Prop `id` did not match. Server: "recharts1-clip" Client: "recharts2-clip"
 *       at clipPath → defs → svg → Surface → … → ActivacionesCharts
 *
 * recharts numera sus `clipPath` con un **contador de módulo**. En el servidor
 * arranca en 1 y avanza una vez por gráfica; en el navegador vuelve a arrancar,
 * pero las gráficas montan en otro orden y con otra cuenta, así que los `id` no
 * casan. React entonces **tira el HTML del servidor entero** —«the entire root
 * will switch to client rendering»— y vuelve a renderizar la página completa en
 * cliente. Dos costes: la página se pinta dos veces, y queda un error
 * permanente en consola que tapa los que sí importan.
 *
 * ── POR QUÉ NO SE ARREGLA CALLÁNDOLO ──────────────────────────────────────
 * `suppressHydrationWarning` quita el aviso y **deja el re-render**: el síntoma
 * desaparece de la consola y el coste se queda. Es justo el tipo de arreglo que
 * hace que el siguiente error no se crea. [[feedback-verificar-antes-asegurar]]
 *
 * ── POR QUÉ NO SE PIERDE NADA ─────────────────────────────────────────────
 * recharts **mide el DOM** para dibujar: su `ResponsiveContainer` necesita un
 * ancho real, que en el servidor no existe. O sea que el render de servidor de
 * una gráfica no produce nada que se vea — sólo el SVG vacío que luego provoca
 * el choque. No renderizarlo ahí no quita contenido: quita trabajo.
 *
 * ── CÓMO FUNCIONA, Y POR QUÉ ESTO SÍ CASA ─────────────────────────────────
 * En el servidor `montado` es `false`, así que se pinta la `reserva` y los
 * `children` **no se renderizan**. El primer render del navegador también tiene
 * `montado` en `false`, así que pinta exactamente lo mismo: la hidratación casa.
 * El `useEffect` corre después y entonces entra la gráfica.
 *
 * La `reserva` tiene que ser idéntica en los dos lados —nada de fechas, azar ni
 * medidas del navegador— o se cambia un desajuste por otro.
 *
 * ── LA RESERVA NO ES EL ALTO REAL, A PROPÓSITO ────────────────────────────
 * Medidos, los bloques de `/activaciones` ocupan 5,797 y 1,486 píxeles.
 * Reservar eso dejaría pantallas de hueco en blanco mientras carga, que se lee
 * peor que el pequeño reflujo que produce no reservarlo. Se reserva lo justo
 * para que el salto no sea brusco, y donde ya existe un esqueleto de carga
 * —`GraficasCargando` en la portada— se usa ése.
 *
 * Lo vigila `scripts/revisa-recharts-ssr.py`, que acusa a cualquier página de
 * servidor que monte recharts sin pasar por aquí.
 */
export default function SoloEnCliente({
  children, reserva = null,
}: { children: ReactNode; reserva?: ReactNode }) {
  const [montado, setMontado] = useState(false)
  useEffect(() => { setMontado(true) }, [])
  return <>{montado ? children : reserva}</>
}

/** Una reserva neutra, por si el sitio no tiene un esqueleto propio. */
export function ReservaGrafica({ alto = 260 }: { alto?: number }) {
  return (
    <div
      aria-hidden
      style={{
        height: alto, borderRadius: 14,
        border: '1px solid #DFE8EF', background: '#F5F8FB',
      }}
    />
  )
}
