'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Radar, Lock, AlertTriangle, ChevronDown, ChevronUp, Check,
  Loader2, Copy, Database, TrendingDown, ClipboardList, X, Save,
} from 'lucide-react'
import { PREGUNTAS_RADAR, type RadarCuenta as RadarData, type NivelRadar } from '@/lib/radar'

const SQL_TABLA = `CREATE TABLE IF NOT EXISTS radar_respuestas (
  id          bigserial   PRIMARY KEY,
  cuenta_id   uuid        NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  asesor      text,
  fecha       date        NOT NULL DEFAULT CURRENT_DATE,
  respuestas  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  score_atlas int,
  nivel_atlas text,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_radar_cuenta ON radar_respuestas(cuenta_id, creado_en DESC);
ALTER TABLE radar_respuestas ENABLE ROW LEVEL SECURITY;
DO $do$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies
    WHERE tablename='radar_respuestas' AND policyname='service_role_all')
  THEN EXECUTE 'CREATE POLICY "service_role_all" ON radar_respuestas FOR ALL USING (true)'; END IF;
END $do$;`

const NIVEL_CFG: Record<NivelRadar, { color: string; bg: string; border: string }> = {
  save:      { color: '#FF3B4E', bg: 'rgba(255,59,78,.13)',   border: 'rgba(255,59,78,.42)' },
  recover:   { color: '#FB923C', bg: 'rgba(251,146,60,.13)',  border: 'rgba(251,146,60,.42)' },
  prevent:   { color: '#FBBF24', bg: 'rgba(251,191,36,.13)',  border: 'rgba(251,191,36,.42)' },
  optimize:  { color: '#5B8DEF', bg: 'rgba(91,141,239,.13)',  border: 'rgba(91,141,239,.42)' },
  grow:      { color: '#3DD68C', bg: 'rgba(61,214,140,.13)',  border: 'rgba(61,214,140,.42)' },
  sin_datos: { color: '#94A3B8', bg: 'rgba(148,163,184,.12)', border: 'rgba(148,163,184,.35)' },
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
const fmtMesCorto = (m: string) => {
  const [y, mm] = m.split('-')
  return `${MESES[Number(mm) - 1]} ${y.slice(2)}`
}
const fmtN = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 0 })

interface Props { cuentaId: string; asesor: string; canEdit?: boolean }

export default function RadarCuenta({ cuentaId, asesor, canEdit = false }: Props) {
  const [data, setData]       = useState<{ radar: RadarData; respuestas: Record<string, unknown> | null; necesitaTabla: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [abierto, setAbierto] = useState(false)
  const [form, setForm]       = useState<Record<string, { valor: string; texto: string }>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/radar?cuentaId=${cuentaId}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Error al cargar')
      setData(d)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }, [cuentaId])

  useEffect(() => { cargar() }, [cargar])

  const radar = data?.radar
  const guardado = data?.respuestas?.respuestas as Record<string, { valor: string; texto: string }> | undefined

  const respondidas = useMemo(() => {
    const base = guardado ?? {}
    const actual = { ...base, ...form }
    return PREGUNTAS_RADAR.filter(q => actual[q.id]?.valor).length
  }, [form, guardado])

  const setCampo = (id: string, campo: 'valor' | 'texto', v: string) =>
    setForm(f => ({ ...f, [id]: { valor: '', texto: '', ...(guardado?.[id] ?? {}), ...f[id], [campo]: v } }))

  const valorDe = (id: string, campo: 'valor' | 'texto') =>
    form[id]?.[campo] ?? guardado?.[id]?.[campo] ?? ''

  async function guardar() {
    if (!radar) return
    setGuardando(true); setError(null)
    try {
      const merged = { ...(guardado ?? {}) }
      for (const [k, v] of Object.entries(form)) merged[k] = v
      const r = await fetch('/api/radar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuenta_id: cuentaId, asesor, respuestas: merged,
          score_atlas: radar.score, nivel_atlas: radar.nivel,
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error ?? 'Error al guardar')
      setForm({}); setAbierto(false); await cargar()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setGuardando(false) }
  }

  /* ── Estados de carga ── */
  if (loading) return (
    <div className="cp-card">
      <div className="flex items-center gap-2 mb-3">
        <Radar size={13} className="text-textMid" />
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Radar de Cuenta</h3>
      </div>
      <div className="flex items-center justify-center py-8 gap-2 text-xs" style={{ color: 'rgba(255,255,255,.45)' }}>
        <Loader2 size={14} className="animate-spin" /> Evaluando indicadores…
      </div>
    </div>
  )

  if (!radar) return (
    <div className="cp-card">
      <div className="flex items-center gap-2 mb-2">
        <Radar size={13} className="text-textMid" />
        <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Radar de Cuenta</h3>
      </div>
      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,.45)' }}>{error ?? 'Sin datos disponibles'}</p>
    </div>
  )

  const cfg = NIVEL_CFG[radar.nivel]
  const maxCons = Math.max(...radar.serie.map(s => s.minutosCons), 1)
  const conRiesgo = radar.indicadores.filter(i => i.riesgo)
  const sinRiesgo = radar.indicadores.filter(i => !i.riesgo)
  const exigeRadar = radar.nivel === 'save' || radar.nivel === 'recover' || radar.nivel === 'prevent'

  return (
    <div className="cp-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Encabezado ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Radar size={13} style={{ color: cfg.color }} />
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,.62)' }}>
          Radar de Cuenta
        </h3>
        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-semibold px-2 py-[3px] rounded-full"
          style={{ background: 'rgba(91,141,239,.14)', color: '#5B8DEF', border: '1px solid rgba(91,141,239,.45)' }}>
          ATLAS · automático
        </span>
        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-[3px] rounded-full"
          style={{ background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.40)', border: '1px solid rgba(255,255,255,.10)' }}>
          <Lock size={8} /> no editable
        </span>
      </div>

      {/* ── Veredicto ── */}
      <div className="flex items-center gap-4 flex-wrap rounded-xl px-4 py-4"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.color}` }}>
        <span className="font-extrabold tabular-nums leading-none"
          style={{ color: cfg.color, fontSize: 44 }}>{radar.score}</span>
        <div className="flex-1 min-w-[220px] flex flex-col gap-[3px]">
          <strong className="text-[14.5px]" style={{ color: '#fff' }}>{radar.titulo}</strong>
          <span className="text-[12px]" style={{ color: 'rgba(255,255,255,.62)' }}>{radar.resumen}</span>
        </div>
        {radar.alertasCriticas > 0 && (
          <span className="text-[9.5px] font-mono font-semibold px-2 py-[3px] rounded-full whitespace-nowrap"
            style={{ background: 'rgba(255,59,78,.14)', color: '#FF3B4E', border: '1px solid rgba(255,59,78,.42)' }}>
            {radar.alertasCriticas} alerta{radar.alertasCriticas !== 1 ? 's' : ''} activa{radar.alertasCriticas !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* ── Tendencia de consumo ── */}
      {radar.serie.length > 0 && (
        <div>
          <div className="flex justify-between items-baseline mb-1 flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,.40)' }}>
              Consumo mensual · minutos
            </span>
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,.55)' }}>
              {fmtN(radar.serie[0].minutosCons)} → {fmtN(radar.serie[radar.serie.length - 1].minutosCons)} min
            </span>
          </div>
          <div className="flex items-end gap-[5px]" style={{ height: 78, paddingBottom: 20 }}>
            {radar.serie.map(s => {
              const h = Math.max((s.minutosCons / maxCons) * 100, 3)
              const bajo = s.pctConsumo !== null && s.pctConsumo < 40
              return (
                <div key={s.mes} className="flex-1 relative rounded-t-[3px]" style={{
                  height: `${h}%`, minHeight: 3,
                  background: bajo
                    ? 'linear-gradient(180deg,#FF3B4E,rgba(255,59,78,.3))'
                    : 'linear-gradient(180deg,#5B8DEF,rgba(91,141,239,.35))',
                }}>
                  <span className="absolute left-1/2 -translate-x-1/2 font-mono whitespace-nowrap"
                    style={{ bottom: -18, fontSize: 8.5, color: 'rgba(255,255,255,.40)' }}>
                    {fmtMesCorto(s.mes)}
                  </span>
                </div>
              )
            })}
          </div>
          {(() => {
            const u = radar.serie[radar.serie.length - 1]
            if (u.pctConsumo === null) return null
            return (
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,.45)' }}>
                Último corte: <strong style={{ color: u.pctConsumo < 40 ? '#FF3B4E' : '#fff' }}>
                {u.pctConsumo.toFixed(1)}%</strong> del plan · {fmtN(u.minutosCons)} de {fmtN(u.ilimitado && u.extensiones ? u.extensiones * 1500 : u.minutosIncl)} min
                {u.ilimitado && ' (estimados por extensión)'}
              </p>
            )
          })()}
        </div>
      )}

      {/* ── Indicadores ── */}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
        {[...conRiesgo, ...sinRiesgo].map(i => (
          <div key={i.id} className="rounded-lg px-3 py-2.5 flex flex-col gap-[3px]" style={{
            background: i.riesgo ? 'rgba(255,59,78,.11)' : 'rgba(255,255,255,.05)',
            border: `1px solid ${i.riesgo ? 'rgba(255,59,78,.35)' : 'rgba(255,255,255,.10)'}`,
          }}>
            <span className="text-[9.5px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,.40)' }}>{i.label}</span>
            <span className="font-bold leading-tight" style={{ fontSize: 15, color: i.riesgo ? '#FF3B4E' : '#fff' }}>{i.valor}</span>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,.40)' }}>{i.nota}</span>
          </div>
        ))}
      </div>

      {/* ── Lectura de ATLAS ── */}
      <p className="text-[11.5px] rounded-lg px-3.5 py-3" style={{
        color: 'rgba(255,255,255,.68)', textAlign: 'justify',
        background: radar.alertasCriticas > 0 ? 'rgba(255,59,78,.09)' : 'rgba(255,255,255,.04)',
        border: `1px solid ${radar.alertasCriticas > 0 ? 'rgba(255,59,78,.28)' : 'rgba(255,255,255,.09)'}`,
      }}>
        <strong style={{ color: cfg.color }}>Lectura de ATLAS: </strong>{radar.lecturaAtlas}
      </p>

      {/* ── Pendiente del asesor ── */}
      {data?.necesitaTabla ? (
        <div className="rounded-xl px-4 py-3.5 flex flex-col gap-2"
          style={{ background: 'rgba(251,191,36,.10)', border: '1px solid rgba(251,191,36,.35)' }}>
          <div className="flex items-center gap-2">
            <Database size={13} style={{ color: '#FBBF24' }} />
            <strong className="text-[13px]" style={{ color: '#fff' }}>Falta crear la tabla del Radar</strong>
          </div>
          <p className="text-[11.5px]" style={{ color: 'rgba(255,255,255,.62)', textAlign: 'justify' }}>
            La evaluación de ATLAS ya funciona. Para guardar las respuestas del asesor hace falta ejecutar este SQL una sola vez en Supabase → SQL Editor.
          </p>
          <div className="relative">
            <pre className="text-[9px] p-3 rounded-lg overflow-x-auto max-h-36 font-mono leading-relaxed"
              style={{ background: 'rgba(0,0,0,.35)', color: '#7EE787' }}>{SQL_TABLA}</pre>
            <button onClick={() => { navigator.clipboard.writeText(SQL_TABLA); setCopiado(true); setTimeout(() => setCopiado(false), 2000) }}
              className="absolute top-2 right-2 flex items-center gap-1 text-[10px] px-2 py-1 rounded"
              style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }}>
              {copiado ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl px-4 py-3.5 flex flex-col gap-3" style={{
          background: respondidas === 12 ? 'rgba(61,214,140,.09)' : 'rgba(251,191,36,.10)',
          border: `1px solid ${respondidas === 12 ? 'rgba(61,214,140,.35)' : 'rgba(251,191,36,.35)'}`,
          borderLeft: `3px solid ${respondidas === 12 ? '#3DD68C' : '#FBBF24'}`,
        }}>
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <ClipboardList size={13} style={{ color: respondidas === 12 ? '#3DD68C' : '#FBBF24' }} />
              <strong className="text-[13.5px]" style={{ color: '#fff' }}>
                {respondidas === 12 ? 'Radar completo' : `Pendiente de ${asesor || 'el asesor'}`}
                <span className="font-normal" style={{ color: 'rgba(255,255,255,.55)' }}> · {respondidas} de 12</span>
              </strong>
            </div>
            {exigeRadar && respondidas < 12 && (
              <span className="text-[9.5px] font-mono font-semibold px-2 py-[3px] rounded-full"
                style={{ background: 'rgba(255,59,78,.14)', color: '#FF3B4E', border: '1px solid rgba(255,59,78,.42)' }}>
                obligatorio · cuenta en riesgo
              </span>
            )}
          </div>
          <p className="text-[11.5px]" style={{ color: 'rgba(255,255,255,.62)', textAlign: 'justify' }}>
            ATLAS ya midió todo lo medible. Estas doce preguntas solo se contestan hablando con el cliente
            {exigeRadar ? ', y esta cuenta está en riesgo, así que son obligatorias.' : '.'}
          </p>
          {canEdit && (
            <button onClick={() => setAbierto(true)} className="cp-btn cp-btn-primary text-xs self-start">
              {respondidas > 0 ? 'Continuar Radar' : 'Responder Radar'} →
            </button>
          )}
        </div>
      )}

      {/* ── Modal del cuestionario ── */}
      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.6)' }}>
          <div className="cp-light bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
            style={{ color: '#0F172A' }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Radar de Cuenta · 12 preguntas obligatorias</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Evaluación de ATLAS: <strong style={{ color: cfg.color }}>{radar.score} · {radar.titulo.split('·')[0].trim()}</strong> · respondidas {respondidas} de 12
                </p>
              </div>
              <button onClick={() => setAbierto(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-5">
              {PREGUNTAS_RADAR.map(q => {
                const val = valorDe(q.id, 'valor')
                const opt = q.opciones?.find(o => o.valor === val)
                return (
                  <div key={q.id} className="flex flex-col gap-2 pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="font-mono text-[11px] text-gray-400 flex-shrink-0">{q.n}</span>
                      <span className="text-[14px] font-semibold text-gray-900 flex-1 min-w-[240px]" style={{ lineHeight: 1.45 }}>
                        {q.texto}
                      </span>
                      {q.critica && (
                        <span className="text-[9px] font-mono font-semibold px-2 py-[2px] rounded-full flex-shrink-0"
                          style={{ background: '#FEE2E2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>crítica</span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-gray-500 pl-[30px]" style={{ textAlign: 'justify' }}>{q.ayuda}</p>
                    <div className="flex flex-wrap gap-1.5 pl-[30px]">
                      {q.opciones?.map(o => {
                        const sel = val === o.valor
                        return (
                          <button key={o.valor} type="button" onClick={() => setCampo(q.id, 'valor', o.valor)}
                            className="text-[11.5px] px-2.5 py-1 rounded-md border transition-colors"
                            style={sel
                              ? (o.riesgo
                                  ? { background: '#FEE2E2', borderColor: '#DC2626', color: '#B91C1C', fontWeight: 600 }
                                  : { background: '#EFF6FF', borderColor: '#1B3FCC', color: '#1B3FCC', fontWeight: 600 })
                              : { background: '#F8FAFC', borderColor: '#E2E8F0', color: '#475569' }}>
                            {o.label}
                          </button>
                        )
                      })}
                    </div>
                    {(q.tipo === 'texto' || q.tipo === 'opciones_texto') && (
                      <div className="pl-[30px]">
                        <textarea
                          value={valorDe(q.id, 'texto')}
                          onChange={e => setCampo(q.id, 'texto', e.target.value)}
                          rows={2}
                          placeholder={opt?.riesgo ? 'Evidencia obligatoria — describe el hallazgo' : 'Evidencia o detalle…'}
                          className="cp-input w-full text-xs resize-none"
                          style={{ borderColor: opt?.riesgo ? '#FCA5A5' : undefined }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="mx-6 mb-2 text-xs px-3 py-2 rounded-lg"
                style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5' }}>{error}</div>
            )}

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-wrap">
              <span className="text-xs text-gray-500">
                {respondidas} de 12 respondidas
                {respondidas < 12 && ' · puedes guardar y continuar después'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setAbierto(false)} className="cp-btn cp-btn-ghost text-xs">Cancelar</button>
                <button onClick={guardar} disabled={guardando} className="cp-btn cp-btn-primary text-xs">
                  {guardando
                    ? <><Loader2 size={12} className="animate-spin" /> Guardando…</>
                    : <><Save size={12} /> Guardar Radar</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
