'use client'
import { useState, useRef, useEffect, useMemo } from 'react'

export type SelectOption = string | { value: string; label: string }

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  placeholder?: string
  /** Muestra un buscador dentro del menú — para listas largas (p.ej. clientes). */
  searchable?: boolean
  /**
   * Clases y estilos del <div> contenedor (NO del botón — para eso usa `className`).
   *
   * El contenedor mide `width: 100%` por defecto para que llene al padre en
   * formularios y en los envoltorios de ancho fijo (`<div className="w-44">`).
   * Pero como HIJO DIRECTO de una fila flex ese 100% se resuelve contra el
   * ancho de la fila completa: el select se come el renglón y empuja a los
   * demás controles hacia abajo. En ese caso pasa un ancho explícito aquí,
   * p.ej. wrapperClassName="w-52 flex-shrink-0".
   */
  wrapperClassName?: string
  wrapperStyle?: React.CSSProperties
}

const normBusq = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function getValue(opt: SelectOption): string {
  return typeof opt === 'string' ? opt : opt.value
}
function getLabel(opt: SelectOption): string {
  return typeof opt === 'string' ? opt : opt.label
}

/**
 * Reemplazo de <select> nativo. Los navegadores renderizan el menú desplegado
 * de un <select> a nivel de OS/UA y ignoran el CSS de color en <option>, lo que
 * puede producir texto ilegible (p.ej. texto claro heredado sobre el fondo
 * blanco por defecto del menú). Este componente controla el popup con React
 * para garantizar contraste consistente en cualquier tema.
 */
export default function CustomSelect({ value, onChange, options, className = '', style, disabled = false, placeholder, searchable = false, wrapperClassName = '', wrapperStyle }: Props) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Con listas largas (clientes/CID) renderizar 2,600 botones por tecleo es
  // lento: se filtra por búsqueda y se recorta el render a 200 visibles.
  const visibles = useMemo(() => {
    if (!searchable || busqueda.trim() === '') return options
    const q = normBusq(busqueda.trim())
    return options.filter(o => normBusq(getLabel(o)).includes(q))
  }, [options, busqueda, searchable])
  const LIMITE = 200
  const recortadas = searchable ? visibles.slice(0, LIMITE) : visibles

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const selected = options.find(o => getValue(o) === value)
  const selectedLabel = selected ? getLabel(selected) : (placeholder ?? '')

  /* ── Cuánto mide el menú y hacia dónde abre ────────────────────────────────
   *
   * Con el `maxHeight` fijo en 260px, una lista de nueve opciones enseñaba
   * SIETE. Un renglón mide 35.5px medidos en el navegador, así que entraban
   * 7.3 y las dos últimas quedaban bajo el borde — y la barra de
   * desplazamiento de Chrome es un overlay que sólo se dibuja al mover la
   * rueda, de modo que no había NINGUNA señal de que hubiera más. Así se
   * escondió «Solicitud de cancelación» el 2 nov 2026, recién desplegada: la
   * opción estaba, y quien la pidió no la encontró.
   *
   * Hacen falta las tres cosas, porque ninguna basta sola:
   *   · el techo sube a 460px —trece renglones— para que un catálogo normal
   *     entre entero;
   *   · la barra se declara visible, para cuando de todos modos haya que
   *     recortar: el combo de clientes de Tickets trae cientos de opciones y
   *     ningún techo razonable las muestra todas;
   *   · y el menú se mide contra el hueco REAL. Subir el techo a ciegas manda
   *     el menú fuera de la pantalla cuando el combo está al pie de la página
   *     —comprobado: 180px de alto y el borde 161px por debajo del borde de la
   *     ventana—, y eso sería cambiar un recorte silencioso por otro.
   *
   * Cuando abajo no cabe y arriba hay más sitio, abre HACIA ARRIBA. Es lo que
   * hace un <select> nativo, y es lo único que deja ver las nueve en un combo
   * que está al final de un formulario largo.
   *
   * A los combos con buscador NO se les sube el techo: ahí la caja de búsqueda
   * ya avisa de que la lista es más larga que lo que se ve, y el render está
   * recortado a 200 de todas formas. Lo único que les cambia es que se ajustan
   * al hueco disponible, que sólo puede mejorar.
   */
  const TECHO = searchable ? 260 : 460
  const [menu, setMenu] = useState({ alto: TECHO, arriba: false })
  useEffect(() => {
    if (!open || !ref.current) return
    const caja = ref.current.getBoundingClientRect()
    const huecoAbajo = window.innerHeight - caja.bottom - 12
    const huecoArriba = caja.top - 12
    const arriba = huecoAbajo < Math.min(TECHO, 220) && huecoArriba > huecoAbajo
    setMenu({
      // El suelo de 160px es para el caso sin salida —ventana diminuta, el
      // combo a media altura—: por debajo el menú deja de ser usable, y un
      // absoluto que se sale alarga el scroll del documento, así que la opción
      // sigue siendo alcanzable.
      alto: Math.max(160, Math.min(TECHO, arriba ? huecoArriba : huecoAbajo)),
      arriba,
    })
  }, [open, TECHO])

  return (
    // El 100% inline sólo se aplica cuando el llamador no define un ancho propio:
    // un `style` en línea gana sobre cualquier clase de Tailwind, así que dejarlo
    // fijo anularía silenciosamente un wrapperClassName="w-52".
    <div
      ref={ref}
      className={`relative ${wrapperClassName}`.trim()}
      style={{ ...(wrapperClassName || wrapperStyle?.width ? {} : { width: '100%' }), ...wrapperStyle }}
    >
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className={`${className} cursor-pointer flex items-center justify-between gap-2`}
        style={{ ...style, opacity: disabled ? 0.5 : (style?.opacity ?? 1) }}
      >
        {/* ── Los dos `background` de aquí abajo NO son decoración ───────────
            Dentro de una `.cp-card` (las tarjetas azul marino), globals.css
            tiene esta regla:

              .cp-card span:not([style*="background"]) { color: #fff !important }

            Un `!important` de hoja de estilo le gana al `color` inline del
            botón padre, así que un <span> pelado sale BLANCO — y como estos
            combos van sobre fondo blanco, la etiqueta desaparece: hay que
            sombrearla con el mouse para leerla. Reportado el 18 sep 2026 en
            Informe de Cortes, pero afectaba a todos los CustomSelect claros
            del tablero.

            El selector mira la subcadena «background» en el atributo `style`,
            así que declararlo —aunque sea transparente— basta para que la
            regla no aplique. Con `color: inherit` el texto toma el del botón:
            el oscuro que le pasa el llamador, o el blanco de la tarjeta si el
            botón es oscuro. Las dos direcciones quedan bien.

            NO quitar estos `background`: sin ellos el combo vuelve a ser
            ilegible y no se nota hasta que alguien intenta leerlo. */}
        <span className="truncate" style={{ background: 'transparent', color: 'inherit' }}>{selectedLabel}</span>
        <span style={{ background: 'transparent', color: 'inherit', fontSize: '10px', flexShrink: 0, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div
          className={`absolute left-0 right-0 rounded-lg border overflow-y-auto ${menu.arriba ? 'mb-1' : 'mt-1'}`}
          style={{
            ...(menu.arriba ? { bottom: '100%' } : { top: '100%' }),
            zIndex: 100,
            background: '#ffffff',
            borderColor: '#DFE8EF',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            maxHeight: menu.alto + 'px',
            minWidth: searchable ? 240 : undefined,
            // Que la barra SE VEA cuando la lista no entra: sin esto Chrome la
            // dibuja como overlay y sólo al girar la rueda. Un recorte que no
            // se anuncia es lo que hizo falta arreglar aquí.
            scrollbarWidth: 'thin',
            scrollbarColor: '#C3D2DF #ffffff',
          }}
        >
          {searchable && (
            <div style={{ position: 'sticky', top: 0, background: '#ffffff', padding: 8, borderBottom: '1px solid #DFE8EF' }}>
              <input
                autoFocus
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '6px 10px',
                  borderRadius: 6, border: '1px solid #DFE8EF', fontSize: 12.5,
                  color: '#082742', background: '#F5F8FB', outline: 'none',
                }}
              />
              {visibles.length > LIMITE && (
                <p style={{ margin: '5px 0 0', fontSize: 10.5, color: '#A8BACB' }}>
                  {visibles.length.toLocaleString('es-MX')} coincidencias — escribe más para acotar
                </p>
              )}
              {visibles.length === 0 && (
                <p style={{ margin: '5px 0 0', fontSize: 10.5, color: '#A8BACB' }}>Sin coincidencias.</p>
              )}
            </div>
          )}
          {recortadas.map(opt => {
            const v = getValue(opt)
            const label = getLabel(opt)
            const isSelected = v === value
            /* `capitalize` SÓLO cuando la opción es una cadena pelada.
               Quien pasa `{value, label}` ya decidió el texto, y el
               text-transform se lo deshace: «Solicitud de cancelación» salía
               «Solicitud De Cancelación». Con cadenas sueltas sigue haciendo
               falta —los catálogos que las usan guardan 'llamada', 'activo'— y
               por eso no se quita, se condiciona. */
            const auto = typeof opt === 'string' ? 'capitalize' : ''
            return (
              <button
                key={v}
                type="button"
                onClick={() => { onChange(v); setOpen(false); setBusqueda('') }}
                className={`w-full text-left ${auto}`.trim()}
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#fff' : '#082742',
                  background: isSelected ? '#2979FF' : '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'block',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F0F7FF' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#ffffff' }}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
