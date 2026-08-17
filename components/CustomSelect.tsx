'use client'
import { useState, useRef, useEffect } from 'react'

export type SelectOption = string | { value: string; label: string }

interface Props {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  placeholder?: string
}

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
export default function CustomSelect({ value, onChange, options, className = '', style, disabled = false, placeholder }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

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
    <div ref={ref} className="relative" style={{ width: '100%' }}>
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
            maxHeight: '220px',
          }}
        >
          {options.map(opt => {
            const v = getValue(opt)
            const label = getLabel(opt)
            const isSelected = v === value
            return (
              <button
                key={v}
                type="button"
                onClick={() => { onChange(v); setOpen(false) }}
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
