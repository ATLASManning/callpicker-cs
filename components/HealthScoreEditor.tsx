'use client'
import { useState } from 'react'
import { Edit2, Save, X } from 'lucide-react'
import type { Cuenta } from '@/lib/types'

interface Props { cuenta: Cuenta; canEdit?: boolean }

export default function HealthScoreEditor({ cuenta, canEdit = false }: Props) {
  if (!canEdit) return null
  const [editing, setEditing] = useState(false)
  const [scores, setScores] = useState({
    score_actividad: cuenta.score_actividad,
    score_adopcion: cuenta.score_adopcion,
    score_pago: cuenta.score_pago,
    score_relacional: cuenta.score_relacional,
  })
  const [saving, setSaving] = useState(false)

  const blocks = [
    { key: 'score_actividad', label: 'Actividad (35%)' },
    { key: 'score_adopcion',  label: 'Adopción (30%)' },
    { key: 'score_pago',      label: 'Pago (20%)' },
    { key: 'score_relacional',label: 'Relacional (15%)' },
  ] as const

  async function save() {
    setSaving(true)
    await fetch(`/api/cuentas/${cuenta.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores),
    })
    setSaving(false)
    setEditing(false)
    window.location.reload()
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="mt-4 cp-btn cp-btn-ghost text-xs w-full justify-center">
        <Edit2 size={12} /> Editar Health Score
      </button>
    )
  }

  return (
    <div className="mt-4 p-3 bg-surface rounded-lg border border-border space-y-3">
      <p className="text-xs font-semibold text-textMid">Editar Health Score</p>
      {blocks.map(b => (
        <div key={b.key}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-textLow">{b.label}</span>
            <span className="text-textHi font-semibold">{scores[b.key]}</span>
          </div>
          <input type="range" min={0} max={100}
            value={scores[b.key]}
            onChange={e => setScores(prev => ({ ...prev, [b.key]: Number(e.target.value) }))}
            className="w-full accent-cp"
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <button onClick={save} disabled={saving} className="cp-btn cp-btn-primary text-xs flex-1 justify-center">
          <Save size={12} /> {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={() => setEditing(false)} className="cp-btn cp-btn-ghost text-xs">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
