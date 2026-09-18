'use client'
import { useState, useRef, useEffect } from 'react'

const RESULTADOS = ['exitoso','sin_respuesta','escalado','interesado','no_interesado','pendiente'] as const
type Resultado = typeof RESULTADOS[number]

const COLOR: Record<Resultado, string> = {
  exitoso:        'bg-verde/10 border-verde/30',
  sin_respuesta:  'bg-rojo/10 border-rojo/30',
  escalado:       'bg-naranja/10 border-naranja/30',
  interesado:     'bg-cp/10 border-cp/30',
  no_interesado:  'bg-surface border-border',
  pendiente:      'bg-yellow-400/10 border-yellow-400/30',
}

export default function SeguimientoStatusSelect({
  seguimientoId,
  resultado: initial,
  canEdit = true,
}: {
  seguimientoId: string
  resultado: string | null
  canEdit?: boolean
}) {
  const [valor, setValor] = useState<string>(initial ?? 'pendiente')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  async function handleChange(next: string) {
    setSaving(true)
    setOpen(false)
    await fetch('/api/seguimientos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seguimientoId, resultado: next }),
    })
    setValor(next)
    setSaving(false)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const cls = COLOR[valor as Resultado] ?? 'bg-surface border-border'

  if (!canEdit) {
    return (
      {/* Los fondos de `COLOR` son tintes al 10%: sobre la `.cp-card` azul
          marino en la que vive esto, siguen siendo OSCUROS. El texto va claro.
          (Antes decía '#0F172A' y se veía bien solo por accidente: globals.css
          fuerza a blanco los <span> sin `background`. En cuanto alguien le
          añadiera un `background` al style, se habría roto en silencio.) */}
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`} style={{ color: '#FFFFFF' }}>
        {valor}
      </span>
    )
  }

  return (
    <div ref={menuRef} className="relative inline-block w-full">
      <button
        onClick={() => setOpen(!open)}
        disabled={saving}
        className={`w-full text-[10px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer
          transition-opacity flex justify-between items-center ${cls} ${saving ? 'opacity-50' : ''}`}
        style={{ color: '#FFFFFF' }}
      >
        {/* Este es el que de verdad estaba roto: los <button> NO los fuerza
            globals.css, así que el '#0F172A' de antes sobrevivía — oscuro
            sobre el tinte oscuro de la tarjeta. Solo se leía al sombrearlo. */}
        {valor}
        <span style={{ background: 'transparent', color: 'inherit' }}>▼</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50"
          style={{ minWidth: '100%' }}>
          {RESULTADOS.map(r => (
            <button
              key={r}
              onClick={() => handleChange(r)}
              className={`w-full text-left px-2 py-1.5 text-[10px] font-semibold hover:bg-blue-100
                ${r === valor ? 'bg-blue-500 text-white' : 'text-gray-900'}`}
              style={{ color: r === valor ? '#fff' : '#0F172A' }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
