'use client'
import { useState } from 'react'

const RESULTADOS = ['exitoso','sin_respuesta','escalado','interesado','no_interesado','pendiente'] as const
type Resultado = typeof RESULTADOS[number]

const COLOR: Record<Resultado, string> = {
  exitoso:        'bg-verde/10 text-verde border-verde/30',
  sin_respuesta:  'bg-rojo/10 text-rojo border-rojo/30',
  escalado:       'bg-naranja/10 text-naranja border-naranja/30',
  interesado:     'bg-cp/10 text-cp border-cp/30',
  no_interesado:  'bg-surface text-textLow border-border',
  pendiente:      'bg-yellow-400/10 text-yellow-600 border-yellow-400/30',
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

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    setSaving(true)
    await fetch('/api/seguimientos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: seguimientoId, resultado: next }),
    })
    setValor(next)
    setSaving(false)
  }

  const cls = COLOR[valor as Resultado] ?? 'bg-surface text-textLow border-border'
  const clsNoText = cls.replace(/text-\S+\s*/g, '')

  if (!canEdit) {
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${cls}`}>
        {valor}
      </span>
    )
  }

  return (
    <select
      value={valor}
      onChange={handleChange}
      disabled={saving}
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border cursor-pointer
        appearance-none outline-none transition-opacity ${clsNoText} ${saving ? 'opacity-50' : ''}`}
      style={{ paddingRight: '14px', backgroundImage: 'none', color: '#0F172A' }}
    >
      {RESULTADOS.map(r => (
        <option key={r} value={r} style={{ color: '#0F172A' }}>{r}</option>
      ))}
    </select>
  )
}
