'use client'
import { useState } from 'react'
import { Plus, Send } from 'lucide-react'
import type { TipoSeguimiento, Asesor } from '@/lib/types'

interface Props { cuentaId: string; asesor: Asesor }

const TIPOS: TipoSeguimiento[] = ['llamada','whatsapp','email','reunion','ticket','nota','demo','upsell']
const RESULTADOS = ['exitoso','sin_respuesta','escalado','interesado','no_interesado','pendiente']

export default function SeguimientoForm({ cuentaId, asesor }: Props) {
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoSeguimiento>('llamada')
  const [resultado, setResultado] = useState('exitoso')
  const [descripcion, setDescripcion] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!descripcion.trim()) return
    setSaving(true)
    await fetch('/api/seguimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuenta_id: cuentaId, tipo, resultado, descripcion, asesor }),
    })
    setSaving(false)
    setDescripcion('')
    setOpen(false)
    window.location.reload()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="cp-btn cp-btn-ghost text-xs w-full justify-center">
      <Plus size={12} /> Registrar actividad
    </button>
  )

  return (
    <form onSubmit={submit} className="bg-surface rounded-lg border border-border p-3 space-y-3">
      <div className="flex gap-2">
        <select value={tipo} onChange={e => setTipo(e.target.value as TipoSeguimiento)}
          className="cp-select text-xs flex-1 capitalize">
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={resultado} onChange={e => setResultado(e.target.value)}
          className="cp-select text-xs flex-1">
          {RESULTADOS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <textarea
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
        placeholder="Descripción de la actividad…"
        rows={3}
        className="cp-input w-full resize-none text-xs"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="cp-btn cp-btn-primary text-xs flex-1 justify-center">
          <Send size={12} /> {saving ? 'Guardando…' : 'Registrar'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="cp-btn cp-btn-ghost text-xs">
          Cancelar
        </button>
      </div>
    </form>
  )
}
