'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Save, X, Loader2, Plus } from 'lucide-react'

interface Props {
  cuentaId: string
  initial:  string | null
}

export default function ObservacionesKamEditor({ cuentaId, initial }: Props) {
  const router  = useRouter()
  const [editing, setEditing] = useState(false)
  const [text,    setText]    = useState(initial ?? '')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/cuentas/${cuentaId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ observaciones_kam: text.trim() || null }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      setEditing(false)
      router.refresh()
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setText(initial ?? '')
    setEditing(false)
    setError(null)
  }

  const hasContent = Boolean(initial?.trim())

  return (
    <div className="cp-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-textHi uppercase tracking-wide">
          Observaciones KAM
        </h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-cp hover:text-cpTeal transition-colors px-2 py-1 rounded-md hover:bg-cp/10"
          >
            {hasContent ? <><Pencil size={11} /> Editar</> : <><Plus size={11} /> Agregar</>}
          </button>
        )}
      </div>

      {/* Vista (no editando) */}
      {!editing && (
        hasContent ? (
          <p className="text-sm text-textHi leading-relaxed whitespace-pre-wrap">
            {initial}
          </p>
        ) : (
          <p className="text-xs text-textLow italic">
            Sin observaciones — haz clic en <strong className="text-textMid">Agregar</strong> para registrar notas KAM de esta cuenta.
          </p>
        )
      )}

      {/* Modo edición */}
      {editing && (
        <div className="space-y-3">
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escribe las observaciones KAM de esta cuenta: estado de la relación, compromisos, riesgos, acuerdos importantes..."
            rows={5}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm text-textHi placeholder:text-textLow focus:outline-none focus:ring-2 focus:ring-cp/40 resize-y"
          />

          {error && (
            <p className="text-xs text-rojo">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cp text-white text-xs font-semibold disabled:opacity-60 hover:bg-cp/90 transition-colors"
            >
              {saving
                ? <Loader2 size={12} className="animate-spin" />
                : <Save size={12} />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-textMid hover:bg-surface transition-colors"
            >
              <X size={12} /> Cancelar
            </button>
            {hasContent && (
              <button
                onClick={() => { setText(''); }}
                disabled={saving}
                className="ml-auto text-xs text-rojo hover:underline"
              >
                Borrar observaciones
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
