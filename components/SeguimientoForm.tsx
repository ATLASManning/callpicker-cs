'use client'
import { useState } from 'react'
import { Plus, Send, ExternalLink, AlertTriangle } from 'lucide-react'
import type { TipoSeguimiento, Asesor } from '@/lib/types'
import {
  TIPOS_SEGUIMIENTO, SOLICITUD_CANCELACION, FORMATO_SOLICITUD_CANCELACION,
  ACCIONES_RETENCION, resultadosDe, componerSolicitud, identificadorDeCuenta,
  etiquetaResultado,
} from '@/lib/seguimiento-tipos'
import CustomSelect from './CustomSelect'

interface Props {
  cuentaId: string
  asesor: Asesor
  canEdit?: boolean
  /** Para ligar el formato de cancelación con ESTA cuenta. */
  consecutivo?: string | null
  cid?: string | null
  empresa?: string | null
}

export default function SeguimientoForm({
  cuentaId, asesor, canEdit = false, consecutivo, cid, empresa,
}: Props) {
  if (!canEdit) return null
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<TipoSeguimiento>('llamada')
  const [resultado, setResultado] = useState('exitoso')
  const [descripcion, setDescripcion] = useState('')
  const [accion, setAccion] = useState(ACCIONES_RETENCION[0].value)
  const [enviado, setEnviado] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esCancelacion = tipo === SOLICITUD_CANCELACION
  const identificador = identificadorDeCuenta({ consecutivo, cid, empresa })

  /* Al cambiar de tipo hay que mover el resultado: los de la solicitud son
     otros y dejar 'exitoso' colgado escribía «cancelación exitosa». */
  function cambiaTipo(v: string) {
    const t = v as TipoSeguimiento
    setTipo(t)
    const permitidos = resultadosDe(t)
    if (!permitidos.includes(resultado)) setResultado(permitidos[0])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!descripcion.trim() && !esCancelacion) return
    /* LA SOLICITUD NO SE REGISTRA SIN SU AMARRE. Sin el formato declarado o sin
       identificador, el registro documenta la pérdida y no la gestión, y nadie
       puede casarlo con la respuesta del formulario. */
    if (esCancelacion && (!enviado || !identificador)) return
    setSaving(true)
    setError(null)
    const cuerpo = esCancelacion
      ? componerSolicitud({ accion, identificador, detalle: descripcion, enviado })
      : descripcion
    /* LA RESPUESTA SE MIRA. Antes se hacía `await fetch(...)` y se recargaba la
       página sin leerla: si la API respondía 403 —cartera ajena— o 500 —el
       CHECK de la columna rechazando el tipo—, el formulario se cerraba, la
       página volvía sin el registro y el asesor no se enteraba de que su
       gestión no se guardó. Es el fallo que el CHECK de `tipo` iba a provocar
       el primer día que alguien eligiera «Solicitud de cancelación». */
    let res: Response
    try {
      res = await fetch('/api/seguimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuenta_id: cuentaId, tipo, resultado, descripcion: cuerpo, asesor }),
      })
    } catch {
      setSaving(false)
      setError('No se pudo contactar al servidor. Lo escrito sigue aquí: vuelve a intentar.')
      return
    }
    if (!res.ok) {
      setSaving(false)
      const detalle = await res.text().catch(() => '')
      setError(
        res.status === 403
          ? 'Esta cuenta no es de tu cartera: no se guardó.'
          : /seguimientos_tipo_check/.test(detalle)
            ? 'La base todavía no admite este tipo de seguimiento. Falta correr '
              + 'scripts/migracion-tipo-solicitud-cancelacion.sql en Supabase. NO se guardó.'
            : `No se guardó (${res.status}). Lo escrito sigue aquí.`,
      )
      return
    }
    setSaving(false)
    setDescripcion('')
    setEnviado(false)
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
        <CustomSelect value={tipo} onChange={cambiaTipo}
          options={TIPOS_SEGUIMIENTO} wrapperClassName="flex-1 min-w-0"
          className="cp-select text-xs w-full" />
        {/* Con etiqueta: `downgrade_negociado` con guion bajo se lee a
            tropezones, y es lo que el asesor tiene que elegir bien. */}
        <CustomSelect value={resultado} onChange={setResultado}
          options={resultadosDe(tipo).map(r => ({ value: r, label: etiquetaResultado(r) }))}
          wrapperClassName="flex-1 min-w-0"
          className="cp-select text-xs w-full" />
      </div>

      {esCancelacion && (
        /* Tinte ámbar sobre el `bg-surface` claro del formulario, con el texto
           calculado contra ese fondo — no es una `.cp-card` oscura. */
        <div className="rounded-lg border p-3 space-y-3"
          style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <p className="text-[11px] leading-relaxed" style={{ color: '#78350F' }}>
            <strong>El formato oficial es parte del trámite.</strong> Llénalo con
            tu cuenta de Callpicker y pega ahí el identificador de abajo: es lo
            que liga la respuesta del formulario con esta cuenta.
          </p>

          <a href={FORMATO_SOLICITUD_CANCELACION} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-md"
            style={{ background: '#B45309', color: '#FFFFFF' }}>
            <ExternalLink size={11} /> Abrir formato de solicitud de cancelación
          </a>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#92400E' }}>
              Identificador de la cuenta
            </p>
            {identificador ? (
              <code className="block text-[11px] px-2 py-1.5 rounded break-words"
                style={{ background: '#FFFFFF', border: '1px solid #FDE68A', color: '#082742' }}>
                {identificador}
              </code>
            ) : (
              /* Sin consecutivo, CID ni empresa no hay con qué ligar nada, y
                 eso se dice — no se registra una solicitud suelta. */
              <p className="text-[11px] flex items-start gap-1.5" style={{ color: '#B91C1C' }}>
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                Esta cuenta no trae consecutivo, CID ni razón social: sin eso no
                se puede ligar el formato. Complétalos en la ficha primero.
              </p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: '#92400E' }}>
              ¿Qué se hizo para evitar la baja o el downgrade?
            </p>
            <CustomSelect value={accion} onChange={setAccion}
              options={ACCIONES_RETENCION}
              className="cp-select text-xs w-full" />
          </div>

          <label className="flex items-start gap-2 text-[11px] cursor-pointer" style={{ color: '#78350F' }}>
            <input type="checkbox" checked={enviado} onChange={e => setEnviado(e.target.checked)}
              className="mt-0.5 flex-shrink-0" />
            <span style={{ background: 'transparent', color: 'inherit' }}>
              Ya envié el formato con el identificador de esta cuenta
            </span>
          </label>
        </div>
      )}

      <textarea
        value={descripcion}
        onChange={e => setDescripcion(e.target.value)}
        placeholder={esCancelacion
          ? 'Motivo que dio el cliente, quién lo pidió, fechas comprometidas…'
          : 'Descripción de la actividad…'}
        rows={3}
        className="cp-input w-full resize-none text-xs"
      />
      {error && (
        <p className="text-[11px] flex items-start gap-1.5 rounded-md px-2 py-1.5"
          style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B91C1C' }}>
          <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
          <span style={{ background: 'transparent', color: 'inherit' }}>{error}</span>
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit"
          disabled={saving || (esCancelacion && (!enviado || !identificador))}
          className="cp-btn cp-btn-primary text-xs flex-1 justify-center disabled:opacity-50">
          <Send size={12} /> {saving ? 'Guardando…' : 'Registrar'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="cp-btn cp-btn-ghost text-xs">
          Cancelar
        </button>
      </div>
      {esCancelacion && (
        <p className="text-[10px] leading-relaxed" style={{ color: '#6B7A8C' }}>
          Registrar la solicitud <strong>no da de baja la cuenta</strong>: documenta
          el riesgo. La baja la autoriza dirección y se ejecuta pasando la cuenta
          a Dormida.
        </p>
      )}
    </form>
  )
}
