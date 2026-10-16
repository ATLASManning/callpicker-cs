'use client'
import { useState, useMemo } from 'react'
import CustomSelect from '@/components/CustomSelect'
import { useAsesorCompartido } from '@/lib/dash-filtros'
import { TIPO_CFG, type ResultadoCandidato, type TipoCandidatura } from '@/lib/candidato-a'
import { formatMXN } from '@/lib/types'
import * as TEMA from '@/lib/chart-theme'

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

/* ── COLOR POR GRUPO, NO POR TIPO (12 oct 2026) ──────────────────────────
   Eran seis colores —verde, cian, morado, azul, ámbar, rojo— para seis tipos.
   La paleta cerrada del Dashboard no da seis tonos distinguibles (es el
   trilema medido en `mide-paleta-dashboard.py`), y el módulo ya dice cómo se
   agrupan: «primero blindar, después crecer». Blindar va en naranja, crecer
   en plata, y el NOMBRE del tipo va siempre escrito en el chip. `TIPO_CFG`
   conserva sus colores en `lib/candidato-a.ts`; aquí no se leen. */
const BLINDAR: ReadonlySet<TipoCandidatura> = new Set<TipoCandidatura>(['estabilizar', 'reactivacion', 'blindaje'])
const colorTipo = (t: TipoCandidatura) => BLINDAR.has(t) ? TEMA.CIAN[400] : TEMA.SILVER[300]

const CERTEZA_CFG: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Evidencia alta',  color: TEMA.TX.hi },
  media: { label: 'Evidencia media', color: TEMA.BANDA.medio },
  baja:  { label: 'Evidencia baja',  color: TEMA.TX.low },
}

/** Todo texto de color lleva `background`: dentro de `.cp-card`, globals.css
 *  pinta de blanco cualquier `<span>` que no lo declare. */
const C = (color: string): React.CSSProperties => ({ color, background: 'transparent' })

export default function CandidatoA({ data }: { data: ResultadoCandidato[] }) {
  /* El asesor es el del Dashboard entero (`useAsesorCompartido`): elegirlo
     aquí filtra también alertas, salud y ranking, y al revés. Este combo usa
     «Todos» como valor vacío; el compartido usa ''. */
  const [asesorComp, setAsesorComp] = useAsesorCompartido()
  const asesor = asesorComp || 'Todos'
  const setAsesor = (v: string) => setAsesorComp(v === 'Todos' ? '' : v)
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
    <div className="px-6 pb-5" style={{ maxWidth: TEMA.ANCHO_MAX, margin: '0 auto' }}>
    <div className="cp-card space-y-4" style={{ background: TEMA.NAVY[700],
         border: `1px solid ${TEMA.BORDE}`, borderRadius: TEMA.RADIO, padding: 20 }}>
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div>
          <h3 style={{ fontSize: TEMA.FUENTE.titulo, fontWeight: 800, margin: 0 }}>Candidato a:</h3>
          <p className="text-[13px] text-textLow">
            A qué es candidata cada cuenta, con la evidencia que lo sostiene. Primero blindar, después crecer.
          </p>
        </div>
        <span className="text-xs" style={C(TEMA.TX.low)}>
          {conRec.length} cuentas con candidatura · {sinDatos.length} requieren más datos
        </span>
      </div>

      {/* Resumen por tipo */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TIPO_CFG) as TipoCandidatura[]).map(t => {
          const r = resumen[t]
          if (!r) return null
          const cfg = TIPO_CFG[t]
          const col = colorTipo(t)
          const activo = tipo === t
          return (
            <button key={t} onClick={() => setTipo(activo ? 'Todos' : t)}
              aria-pressed={activo}
              className="rounded-lg px-3 py-2 text-left transition-colors dash-foco"
              style={{
                background: activo ? `${col}30` : `${col}10`,
                border: `1px solid ${col}${activo ? 'CC' : '40'}`,
                cursor: 'pointer',
              }}>
              <span className="block text-xs font-bold uppercase tracking-wide" style={C(col)}>
                {cfg.label}
              </span>
              <span className="block text-base font-bold" style={C(TEMA.TX.hi)}>{r.n} cuentas</span>
              <span className="block text-xs" style={C(TEMA.TX.low)}>{formatMXN(r.mrr)}/mes</span>
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
                        options={['Todos', 'Fátima', 'Dan', 'Erick']} />
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
          const col = colorTipo(principal.tipo)
          const cert = CERTEZA_CFG[d.certeza]
          const abierto = abierta === d.id
          return (
            <div key={d.id} className="rounded-lg overflow-hidden"
                 style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${TEMA.BORDE}`,
                          borderLeft: `3px solid ${col}` }}>
              <button onClick={() => setAbierta(abierto ? null : d.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-surface/40 transition-colors">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold" style={C(TEMA.CIAN[400])}>{d.consecutivo}</span>
                  <span className="text-sm font-semibold" style={C(TEMA.TX.hi)}>{d.empresa}</span>
                  <span className="text-xs" style={C(TEMA.TX.low)}>{d.asesor}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ background: `${col}22`, color: col }}>
                    {principal.producto}
                  </span>
                  <span className="text-xs ml-auto font-semibold" style={C(cert.color)}>
                    {cert.label} · {d.senales}/{d.senalesTotales} señales
                  </span>
                  <span className="text-sm font-bold w-24 text-right" style={C(TEMA.TX.hi)}>
                    {formatMXN(d.facturacion)}
                  </span>
                </div>
                {!abierto && (
                  <p className="text-[13px] text-textMid mt-1 leading-snug line-clamp-1">{principal.razon}</p>
                )}
              </button>

              {abierto && (
                <div className="px-3 pb-3 space-y-2.5">
                  {d.antiguedadMeses !== null && (
                    <p className="text-xs text-textLow">
                      Cliente desde hace {d.antiguedadMeses >= 12
                        ? `${Math.floor(d.antiguedadMeses / 12)} año(s)`
                        : `${d.antiguedadMeses} mes(es)`}
                    </p>
                  )}
                  {d.candidaturas.map((c, i) => {
                    const cc = TIPO_CFG[c.tipo]
                    const ccol = colorTipo(c.tipo)
                    return (
                      <div key={i} className="rounded-md p-2.5"
                           style={{ background: `${ccol}0D`, borderLeft: `2px solid ${ccol}` }}>
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                          <span className="text-sm font-bold" style={C(ccol)}>{c.producto}</span>
                          <span className="text-[11px] uppercase tracking-wide" style={C(TEMA.TX.low)}>{cc.label}</span>
                          {c.requiereVoBo && (
                            <span className="text-[11px] px-1.5 rounded font-bold"
                                  style={{ background: 'rgba(57,171,216,0.15)', color: TEMA.CIAN[400] }}>
                              requiere VoBo de Dirección
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] text-textMid leading-relaxed mb-1.5">{c.razon}</p>
                        <ul className="space-y-0.5 mb-1.5">
                          {c.ventajas.map((v, j) => (
                            <li key={j} className="text-[13px] text-textMid leading-snug flex gap-1.5">
                              <span style={C(ccol)}>+</span><span>{v}</span>
                            </li>
                          ))}
                        </ul>
                        <p className="text-[13px] leading-relaxed">
                          <span style={C(TEMA.TX.low)}>Siguiente paso: </span>
                          <span style={C(ccol)}>{c.siguientePaso}</span>
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
          <p className="text-sm text-textMid text-center py-6">Ninguna cuenta con estos filtros.</p>
        )}
        {filtradas.length > 40 && (
          <p className="text-xs text-textLow text-center pt-1">
            Mostrando 40 de {filtradas.length}. Usa los filtros para acotar.
          </p>
        )}
      </div>

      <p className="text-xs text-textLow leading-relaxed pt-2"
         style={{ borderTop: `1px solid ${TEMA.BORDE}` }}>
        Ninguna condición comercial —precio, descuento, plazo o servicio incluido— se presenta al cliente
        como aprobada. Se evalúa internamente y requiere VoBo previo de Dirección General.
      </p>
    </div>
    </div>
  )
}
