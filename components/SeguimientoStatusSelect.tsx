'use client'
import { useState, useRef, useEffect } from 'react'

import { resultadosDe, etiquetaResultado } from '@/lib/seguimiento-tipos'

/**
 * @contraste-padre: este selector no dibuja fondo propio — los valores de
 * `COLOR` son tintes al 10% y viven dentro de la `.cp-card` azul marino
 * (`#0D1829`) de la tabla de seguimientos. Compuestos sobre ella, los seis
 * fondos quedan entre `#0D1829` y `#252A27` y la letra blanca mide de 14.60:1
 * a 17.80:1. Medido el 8 oct 2026.
 *
 * Los cuatro resultados de la solicitud de cancelación (2 nov 2026) REUSAN
 * esos mismos cuatro tintes —verde, naranja, rojo y cp al 10%— en vez de
 * estrenar colores: así la medición de arriba sigue cubriéndolos y no hay que
 * inventar tonos que el detector de paleta rechazaría.
 */

/** Qué resultados se ofrecen lo dice el TIPO del seguimiento, no esta lista. */
const COLOR: Record<string, string> = {
  exitoso:                'bg-verde/10 border-verde/30',
  sin_respuesta:          'bg-rojo/10 border-rojo/30',
  escalado:               'bg-naranja/10 border-naranja/30',
  interesado:             'bg-cp/10 border-cp/30',
  no_interesado:          'bg-surface border-border',
  pendiente:              'bg-yellow-400/10 border-yellow-400/30',
  en_negociacion:         'bg-cp/10 border-cp/30',
  retenida:               'bg-verde/10 border-verde/30',
  downgrade_negociado:    'bg-naranja/10 border-naranja/30',
  cancelacion_confirmada: 'bg-rojo/10 border-rojo/30',
}

export default function SeguimientoStatusSelect({
  seguimientoId,
  resultado: initial,
  tipo,
  canEdit = true,
}: {
  seguimientoId: string
  resultado: string | null
  /** Sin esto el combo ofrecía «exitoso» para una cancelación. */
  tipo?: string | null
  canEdit?: boolean
}) {
  const RESULTADOS = resultadosDe(tipo)
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

  const cls = COLOR[valor] ?? 'bg-surface border-border'

  if (!canEdit) {
    /* Los fondos de `COLOR` son tintes al 10%: sobre la `.cp-card` azul marino
       en la que vive esto, siguen siendo OSCUROS. El texto va claro. (Antes
       decía '#082742' y se veía bien solo por accidente: globals.css fuerza a
       blanco los span sin `background`. En cuanto alguien le añadiera un
       `background` al style, se habría roto en silencio.) */
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`} style={{ color: '#FFFFFF' }}>
        {etiquetaResultado(valor)}
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
            globals.css, así que el '#082742' de antes sobrevivía — oscuro
            sobre el tinte oscuro de la tarjeta. Solo se leía al sombrearlo. */}
        {etiquetaResultado(valor)}
        <span style={{ background: 'transparent', color: 'inherit' }}>▼</span>
      </button>

      {open && (
        /* El `bg-blue-500` del renglón seleccionado daba 3.68:1 contra el
           blanco de su propia letra — el `-500` de Tailwind no admite texto
           blanco a 10px, y para eso existe el `-600`, que da 5.17:1. */
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50"
          style={{ minWidth: '100%' }}>
          {RESULTADOS.map(r => (
            <button
              key={r}
              onClick={() => handleChange(r)}
              className={`w-full text-left px-2 py-1.5 text-[10px] font-semibold hover:bg-blue-100
                ${r === valor ? 'bg-blue-600 text-white' : 'text-gray-900'}`}
              style={{ color: r === valor ? '#fff' : '#082742' }}
            >
              {etiquetaResultado(r)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
