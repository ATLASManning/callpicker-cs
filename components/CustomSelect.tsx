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
        <span className="truncate">{selectedLabel}</span>
        <span style={{ fontSize: '10px', flexShrink: 0, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1 rounded-lg border overflow-y-auto"
          style={{
            top: '100%',
            zIndex: 100,
            background: '#ffffff',
            borderColor: '#E2E8F0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            maxHeight: '260px',
            minWidth: searchable ? 240 : undefined,
          }}
        >
          {searchable && (
            <div style={{ position: 'sticky', top: 0, background: '#ffffff', padding: 8, borderBottom: '1px solid #E2E8F0' }}>
              <input
                autoFocus
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '6px 10px',
                  borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12.5,
                  color: '#0F172A', background: '#F8FAFC', outline: 'none',
                }}
              />
              {visibles.length > LIMITE && (
                <p style={{ margin: '5px 0 0', fontSize: 10.5, color: '#94A3B8' }}>
                  {visibles.length.toLocaleString('es-MX')} coincidencias — escribe más para acotar
                </p>
              )}
              {visibles.length === 0 && (
                <p style={{ margin: '5px 0 0', fontSize: 10.5, color: '#94A3B8' }}>Sin coincidencias.</p>
              )}
            </div>
          )}
          {recortadas.map(opt => {
            const v = getValue(opt)
            const label = getLabel(opt)
            const isSelected = v === value
            return (
              <button
                key={v}
                type="button"
                onClick={() => { onChange(v); setOpen(false); setBusqueda('') }}
                className="w-full text-left capitalize"
                style={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? '#fff' : '#0F172A',
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
