'use client'
import { useState, useMemo } from 'react'
import CustomSelect from '@/components/CustomSelect'
import { TIPO_CFG, type ResultadoCandidato, type TipoCandidatura } from '@/lib/candidato-a'
import { formatMXN } from '@/lib/types'

/**
 * Módulo "Candidato a:" del Dashboard.
 *
 * Muestra a qué es candidata cada cuenta y —lo que pidió dirección— con cuánta
 * evidencia se dice. Las cuentas con más datos producen recomendaciones más
 * firmes; las que no tienen datos no producen una recomendación floja, producen
 * la instrucción de completarlas.
 *
 * El orden no es comercial: primero lo que hay que estabilizar o reactivar,
 * después lo que se puede crecer. Blindar la cuenta va antes que venderle.
 */

const CERTEZA_CFG: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Evidencia alta',  color: '#22C55E' },
  media: { label: 'Evidencia media', color: '#F59E0B' },
  baja:  { label: 'Evidencia baja',  color: '#94A3B8' },
}

export default function CandidatoA({ data }: { data: ResultadoCandidato[] }) {
  const [asesor, setAsesor] = useState('Todos')
  const [tipo,   setTipo]   = useState('Todos')
  const [busca,  setBusca]  = useState('')
  const [abierta, setAbierta] = useState<string | null>(null)

  const conRec = useMemo(() => data.filter(d => d.candidaturas.length > 0), [data])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return conRec.filter(d =>
      (asesor === 'Todos' || d.asesor === asesor) &&
      (tipo === 'Todos' || d.candidaturas.some(c => c.tipo === tipo)) &&
      (!q || d.empresa.toLowerCase().includes(q) || d.consecutivo.toLowerCase().includes(q)),
    ).sort((a, b) => {
      const pa = Math.min(...a.candidaturas.map(c => c.prioridad))
      const pb = Math.min(...b.candidaturas.map(c => c.prioridad))
      if (pa !== pb) return pa - pb
      return b.facturacion - a.facturacion
    })
  }, [conRec, asesor, tipo, busca])

  /** Cuánto dinero hay detrás de cada tipo de candidatura. */
  const resumen = useMemo(() => {
    const acc: Record<string, { n: number; mrr: number }> = {}
    for (const d of conRec) {
      const vistos = new Set<string>()
      for (const c of d.candidaturas) {
        if (vistos.has(c.tipo)) continue
        vistos.add(c.tipo)
        if (!acc[c.tipo]) acc[c.tipo] = { n: 0, mrr: 0 }
        acc[c.tipo].n++
        acc[c.tipo].mrr += d.facturacion
      }
    }
    return acc
  }, [conRec])

  const sinDatos = data.filter(d => d.candidaturas.length === 0 && d.motivoSinRecomendacion?.startsWith('No hay evidencia'))

  return (
    <div className="cp-card space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-textHi">Candidato a:</h3>
          <p className="text-[11px] text-textLow">
            A qué es candidata cada cuenta, con la evidencia que lo sostiene. Primero blindar, después crecer.
          </p>
        </div>
        <span className="text-[10px] text-textLow">
          {conRec.length} cuentas con candidatura · {sinDatos.length} requieren más datos
        </span>
      </div>

      {/* Resumen por tipo */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TIPO_CFG) as TipoCandidatura[]).map(t => {
          const r = resumen[t]
          if (!r) return null
          const cfg = TIPO_CFG[t]
          const activo = tipo === t
          return (
            <button key={t} onClick={() => setTipo(activo ? 'Todos' : t)}
              className="rounded-lg px-3 py-2 text-left transition-colors"
              style={{
                background: activo ? `${cfg.color}25` : `${cfg.color}10`,
                border: `1px solid ${cfg.color}${activo ? '80' : '35'}`,
              }}>
              <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
                {cfg.label}
              </p>
              <p className="text-sm font-bold text-textHi">{r.n} cuentas</p>
              <p className="text-[10px] text-textLow">{formatMXN(r.mrr)}/mes</p>
            </button>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-52 flex-shrink-0">
          <input className="cp-input w-full" placeholder="Buscar cuenta…"
                 value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <div className="w-44 flex-shrink-0">
          <CustomSelect value={asesor} onChange={setAsesor}
                        options={['Todos', 'Fátima', 'Dan', 'Claudia']} />
        </div>
        <div className="w-52 flex-shrink-0">
          <CustomSelect value={tipo} onChange={setTipo} options={[
            { value: 'Todos', label: 'Toda candidatura' },
            ...(Object.keys(TIPO_CFG) as TipoCandidatura[]).map(t => ({ value: t, label: TIPO_CFG[t].label })),
          ]} />
        </div>
        {(asesor !== 'Todos' || tipo !== 'Todos' || busca) && (
          <button className="cp-btn cp-btn-ghost text-xs flex-shrink-0"
                  onClick={() => { setAsesor('Todos'); setTipo('Todos'); setBusca('') }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Listado */}
      <div className="space-y-1.5">
        {filtradas.slice(0, 40).map(d => {
          const principal = d.candidaturas[0]
          const cfg = TIPO_CFG[principal.tipo]
          const cert = CERTEZA_CFG[d.certeza]
          const abierto = abierta === d.id
          return (
            <div key={d.id} className="rounded-lg overflow-hidden"
                 style={{ background: 'rgba(148,163,184,0.06)', border: `1px solid ${cfg.color}30` }}>
              <button onClick={() => setAbierta(abierto ? null : d.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-surface/40 transition-colors">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-cp">{d.consecutivo}</span>
                  <span className="text-xs font-semibold text-textHi">{d.empresa}</span>
                  <span className="text-[10px] text-textLow">{d.asesor}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                        style={{ background: `${cfg.color}20`, color: cfg.color }}>
                    {principal.producto}
                  </span>
                  <span className="text-[10px] ml-auto font-semibold" style={{ color: cert.color }}>
                    {cert.label} · {d.senales}/{d.senalesTotales} señales
                  </span>
                  <span className="text-[10px] text-textMid font-bold w-20 text-right">
                    {formatMXN(d.facturacion)}
                  </span>
                </div>
                {!abierto && (
                  <p className="text-[11px] text-textMid mt-1 leading-snug line-clamp-1">{principal.razon}</p>
                )}
              </button>

              {abierto && (
                <div className="px-3 pb-3 space-y-2.5">
                  {d.antiguedadMeses !== null && (
                    <p className="text-[10px] text-textLow">
                      Cliente desde hace {d.antiguedadMeses >= 12
                        ? `${Math.floor(d.antiguedadMeses / 12)} año(s)`
                        : `${d.antiguedadMeses} mes(es)`}
                    </p>
                  )}
                  {d.candidaturas.map((c, i) => {
                    const cc = TIPO_CFG[c.tipo]
                    return (
                      <div key={i} className="rounded-md p-2.5"
                           style={{ background: `${cc.color}0D`, borderLeft: `2px solid ${cc.color}` }}>
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                          <span className="text-xs font-bold" style={{ color: cc.color }}>{c.producto}</span>
                          <span className="text-[9px] uppercase tracking-wide text-textLow">{cc.label}</span>
                          {c.requiereVoBo && (
                            <span className="text-[9px] px-1.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#F87171' }}>
                              requiere VoBo de Dirección
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-textMid leading-relaxed mb-1.5">{c.razon}</p>
                        <ul className="space-y-0.5 mb-1.5">
                          {c.ventajas.map((v, j) => (
                            <li key={j} className="text-[11px] text-textMid leading-snug flex gap-1.5">
                              <span style={{ color: cc.color }}>+</span><span>{v}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[11px] leading-relaxed" style={{ color: cc.color }}>
                          <span className="opacity-70">Siguiente paso: </span>{c.siguientePaso}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        {filtradas.length === 0 && (
          <p className="text-xs text-textMid text-center py-6">Ninguna cuenta con estos filtros.</p>
        )}
        {filtradas.length > 40 && (
          <p className="text-[10px] text-textLow text-center pt-1">
            Mostrando 40 de {filtradas.length}. Usa los filtros para acotar.
          </p>
        )}
      </div>

      <p className="text-[10px] text-textLow leading-relaxed pt-1"
         style={{ borderTop: '1px solid rgba(148,163,184,0.2)' }}>
        Ninguna condición comercial —precio, descuento, plazo o servicio incluido— se presenta al cliente
        como aprobada. Se evalúa internamente y requiere VoBo previo de Dirección General.
      </p>
    </div>
  )
}
