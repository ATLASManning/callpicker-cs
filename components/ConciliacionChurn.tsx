'use client'
import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle2, FileWarning } from 'lucide-react'
import { EXIGENCIA_EXPEDIENTE } from '@/lib/conciliacion'

/**
 * Conciliación de cierre de semana — vista operativa.
 *
 * Muestra, con nombre y monto, qué cuentas siguen contando como vivas en la
 * cartera cuando los módulos de Churn ya las dieron por muertas. Se separa en
 * dos bloques porque la política es distinta a cada lado del 31 de agosto de
 * 2026: antes es limpieza de histórico y se aplica; después hay que documentar
 * la baja y entregar el plan de recuperación antes de mover el estatus.
 */

type Hallazgo = {
  cuenta: { id: number | string; consecutivo: string; cid: string | null; empresa: string; asesor: string | null; estado: string | null; facturacion: number | null }
  senal:  { cliente: string; fuente: string; movimiento: string; mes: string; fecha: string; perdido: number }
  accion: string
  motivo: string
}

type Resumen = {
  reclasificar: Hallazgo[]
  exigeExpediente: Hallazgo[]
  sinCambio: Hallazgo[]
  mrrFantasma: number
  corte: string
  fuentes: string[]
  zohoDisponible: boolean
  aplicado?: boolean
  aplicadas?: Array<{ consecutivo: string; empresa: string }>
  fallidas?: Array<{ consecutivo: string; empresa: string; error: string }>
}

const fmt = (n: number) =>
  '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function ConciliacionChurn() {
  const [data, setData]       = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(false)
  const [aplicando, setAplicando] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const cargar = useCallback(() => {
    setLoading(true); setError(null)
    fetch('/api/conciliacion')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const aplicar = () => {
    if (!data?.reclasificar.length) return
    setAplicando(true); setError(null)
    fetch('/api/conciliacion', { method: 'POST' })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(e => setError(String(e)))
      .finally(() => setAplicando(false))
  }

  const tabla = (filas: Hallazgo[], color: string) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70">
            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cuenta</th>
            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asesor</th>
            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estatus hoy</th>
            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">MRR en cartera</th>
            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Señal</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(h => (
            <tr key={String(h.cuenta.id)} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors align-top">
              <td className="py-2.5 px-4">
                <span className="font-mono text-[11px] font-bold" style={{ color }}>{h.cuenta.consecutivo}</span>
                <span className="ml-2 font-medium text-gray-900">{h.cuenta.empresa}</span>
              </td>
              <td className="py-2.5 px-4 text-gray-600">{h.cuenta.asesor ?? '—'}</td>
              <td className="py-2.5 px-4">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {h.cuenta.estado}
                </span>
              </td>
              <td className="py-2.5 px-4 text-right font-semibold" style={{ color }}>
                {fmt(h.cuenta.facturacion ?? 0)}
              </td>
              <td className="py-2.5 px-4">
                <p className="text-xs font-semibold text-gray-800">{h.senal.movimiento} · {h.senal.mes}</p>
                <p className="text-[11px] text-gray-500">{h.senal.fuente}</p>
              </td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-xs text-gray-400">Ninguna cuenta en este bloque.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Conciliación de cierre de semana</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-3xl leading-relaxed">
              Cruza GRC AAA 2026, las cancelaciones de los cortes semanales y Zoho · Dormidos contra la
              cartera. Corre antes de generar el reporte de actividades para que ninguna cuenta muerta
              siga contando como viva. Corte de política: <strong>{data?.corte ?? '2026-08-31'}</strong>.
            </p>
          </div>
          <button onClick={cargar} disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Conciliando…' : 'Volver a conciliar'}
          </button>
        </div>

        {data && (
          <div className="flex flex-wrap gap-2 mt-3">
            {data.fuentes.map(f => (
              <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                ✓ {f}
              </span>
            ))}
            {!data.zohoDisponible && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                ⚠ Zoho · Dormidos no respondió — conciliado solo con las fuentes internas
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-sm text-red-700">{error}</div>
      )}

      {data && (
        <>
          {/* MRR fantasma */}
          {data.mrrFantasma > 0 && (
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: '#f9731640', background: '#f9731608' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#f97316' }}>
                MRR que la cartera sigue contando y ya no existe
              </p>
              <p className="text-3xl font-black text-gray-900 mt-1">{fmt(data.mrrFantasma)}</p>
              <p className="text-xs text-gray-500 mt-1">
                {data.reclasificar.length + data.exigeExpediente.length} cuentas marcadas como vivas
                que los módulos de Churn ya dieron por muertas.
              </p>
            </div>
          )}

          {/* Bloque 1 — reclasificar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3"
                 style={{ background: '#3b82f608' }}>
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} style={{ color: '#3b82f6' }} className="mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    Pasan a Dormida — {data.reclasificar.length} cuentas
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    El evento es anterior al {data.corte}: limpieza de histórico, no se pide expediente.
                  </p>
                </div>
              </div>
              {data.reclasificar.length > 0 && (
                <button onClick={aplicar} disabled={aplicando}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                        style={{ background: '#3b82f6' }}>
                  {aplicando ? 'Aplicando…' : `Aplicar a ${data.reclasificar.length} cuentas`}
                </button>
              )}
            </div>
            {tabla(data.reclasificar, '#3b82f6')}
          </div>

          {data.aplicado && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-3">
              <p className="text-sm font-semibold text-green-800">
                {data.aplicadas?.length ?? 0} cuentas reclasificadas a Dormida.
              </p>
              {!!data.fallidas?.length && (
                <p className="text-xs text-red-700 mt-1">
                  {data.fallidas.length} no pudieron actualizarse: {data.fallidas.map(f => f.consecutivo).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Bloque 2 — exigen expediente */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#ef444440' }}>
            <div className="px-5 py-4 border-b border-gray-100" style={{ background: '#ef444408' }}>
              <div className="flex items-start gap-3">
                <FileWarning size={18} style={{ color: '#ef4444' }} className="mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm text-gray-900">
                    Exigen expediente — {data.exigeExpediente.length} cuentas
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-3xl leading-relaxed">
                    El evento es posterior al {data.corte}. <strong>No cambian de estatus</strong> hasta que el
                    asesor documente la baja y entregue el plan de recuperación del ingreso.
                  </p>
                </div>
              </div>
            </div>
            {tabla(data.exigeExpediente, '#ef4444')}
            <div className="px-5 py-4 border-t border-gray-100" style={{ background: '#ef444405' }}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: '#ef4444' }}>
                Qué debe entregar el asesor por cada una
              </p>
              <ul className="space-y-1">
                {EXIGENCIA_EXPEDIENTE.map((e, i) => (
                  <li key={i} className="text-xs text-gray-600 leading-relaxed flex gap-2">
                    <span style={{ color: '#ef4444' }} className="flex-shrink-0">{i + 1}.</span><span>{e}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
                &quot;No contesta&quot;, &quot;se cambió de empresa&quot; o &quot;ya no es la persona&quot; no cierran el
                expediente: son el punto de partida del análisis, no su conclusión.
              </p>
            </div>
          </div>

          {/* Bloque 3 — ya correctas */}
          <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm flex items-center gap-3">
            <AlertTriangle size={15} className="text-gray-300 flex-shrink-0" />
            <p className="text-xs text-gray-500">
              {data.sinCambio.length} cuentas más traen señal de churn y ya estaban fuera de activas — sin acción.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
