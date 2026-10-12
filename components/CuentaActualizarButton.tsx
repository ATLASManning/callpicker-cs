'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Check, AlertTriangle } from 'lucide-react'

/**
 * components/CuentaActualizarButton.tsx — «ACTUALIZAR», EN LA CABECERA
 *
 * Instrucción de dirección, 12 oct 2026: «un botón que diga actualizar en cada
 * cuenta, de tal suerte que al dar click puedas unir toda la información y
 * actualizar de manera eficiente», al lado de Auditoría.
 *
 * ── EL BOTÓN TIENE QUE DECIR QUÉ HIZO ────────────────────────────────────
 *
 * Un «Actualizar» que sólo recarga entrena a no usarlo: la pantalla se queda
 * igual, nadie sabe si pasó algo, y a la tercera vez ya no se toca. Por eso
 * después del clic se queda un rótulo con el resultado —cuántas condiciones
 * vio y cuántas alertas abrió— y sólo entonces se refresca la ficha.
 *
 * El refresco va DESPUÉS de tener la respuesta, no en paralelo: si se dispara
 * a la vez, la ficha se repinta con el estado anterior y el rótulo aparece
 * sobre datos viejos.
 */
export default function CuentaActualizarButton({ cuentaId }: { cuentaId: string }) {
  const router = useRouter()
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function actualizar() {
    setCargando(true)
    setResultado(null)
    setError(null)
    try {
      const r = await fetch(`/api/cuentas/${cuentaId}/actualizar`, { method: 'POST' })
      const d = await r.json()
      if (!r.ok) {
        setError(d?.mensaje ?? d?.error ?? `error ${r.status}`)
        return
      }
      /* Se nombra lo que se vio Y lo que se abrió. Publicar sólo «0 nuevas»
         hace que una corrida que no vio NADA —porque una fuente no cargó— se
         lea igual que una cuenta en orden. */
      const partes = [`${d.detectados} condición${d.detectados === 1 ? '' : 'es'} vista${d.detectados === 1 ? '' : 's'}`]
      if (d.nuevas > 0) partes.push(`${d.nuevas} alerta${d.nuevas === 1 ? '' : 's'} nueva${d.nuevas === 1 ? '' : 's'}`)
      if (d.falla) partes.push(`ojo: ${d.falla}`)
      setResultado(partes.join(' · '))
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'no se pudo actualizar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <button type="button" onClick={actualizar} disabled={cargando}
        className="cp-btn cp-btn-ghost text-xs font-semibold"
        title="Vuelve a leer todas las fuentes de esta cuenta y sella sus alertas"
        style={{ opacity: cargando ? 0.6 : 1, cursor: cargando ? 'wait' : 'pointer' }}>
        <RefreshCw size={13}
          style={{ animation: cargando ? 'cp-girar 0.9s linear infinite' : undefined }} />
        {cargando ? 'Actualizando…' : 'Actualizar'}
      </button>

      {/* `aria-live`: quien usa lector de pantalla no ve el rótulo aparecer. */}
      <span aria-live="polite" style={{ fontSize: 11, maxWidth: 320, lineHeight: 1.35 }}>
        {resultado && (
          <span style={{ color: '#047857', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Check size={12} style={{ flexShrink: 0 }} /> {resultado}
          </span>
        )}
        {error && (
          <span style={{ color: '#B91C1C', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={12} style={{ flexShrink: 0 }} /> {error}
          </span>
        )}
      </span>
    </div>
  )
}
