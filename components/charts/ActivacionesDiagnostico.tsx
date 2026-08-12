'use client'

import { useState, useMemo } from 'react'
import { RegistroItem } from './ActivacionesCharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt$ = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
const fmtN = (n: number) => n.toLocaleString('es-MX')

function avg(arr: number[]): number {
  if (!arr.length) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const C = {
  bg:       '#EFF6FF',
  card:     '#FFFFFF',
  border:   '#BFDBFE',
  tx:       '#0F172A',
  muted:    '#64748B',
  blue:     '#1D4ED8',
  blueL:    '#DBEAFE',
  green:    '#16A34A',
  greenL:   '#DCFCE7',
  amber:    '#D97706',
  amberL:   '#FEF3C7',
  red:      '#DC2626',
  redL:     '#FEE2E2',
  purple:   '#7C3AED',
  purpleL:  '#EDE9FE',
}

function KPI({ label, value, sub, color = C.blue, bg }: {
  label: string; value: string; sub?: string; color?: string; bg?: string
}) {
  return (
    <div style={{
      flex: '1 1 180px', background: bg ?? C.card, border: `1px solid ${C.border}`,
      borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ fontSize: 11, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

// ── Barra horizontal simple ───────────────────────────────────────────────────
function HBar({ label, count, total, color, extra }: {
  label: string; count: number; total: number; color: string; extra?: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: C.tx, fontWeight: 500 }}>{label}</span>
        <span style={{ color: C.muted }}>{fmtN(count)} · {pct.toFixed(1)}%{extra ? ` · ${extra}` : ''}</span>
      </div>
      <div style={{ height: 8, background: C.blueL, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width .3s' }} />
      </div>
    </div>
  )
}

// ── Tabla genérica ────────────────────────────────────────────────────────────
function Table({ heads, rows }: { heads: string[]; rows: (string | number)[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: C.blueL }}>
            {heads.map((h, i) => (
              <th key={i} style={{
                padding: '8px 12px', textAlign: i === 0 ? 'left' : 'right',
                fontWeight: 700, color: C.blue, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${C.border}`, background: ri % 2 ? '#F8FAFF' : C.card }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: '8px 12px', textAlign: ci === 0 ? 'left' : 'right', color: C.tx,
                }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Tab labels ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'hallazgos',    label: 'Hallazgos' },
  { key: 'ejecutivos',   label: 'Ejecutivos' },
  { key: 'distribucion', label: 'Distribución' },
  { key: 'contacto',     label: 'Contacto' },
  { key: 'top',          label: 'TOP Cuentas' },
]

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props { registros: RegistroItem[] }

// ══════════════════════════════════════════════════════════════════════════════
export default function ActivacionesDiagnostico({ registros }: Props) {
  const [tab,     setTab]     = useState<string>('hallazgos')
  const [anoFilt, setAnoFilt] = useState<number | 'all'>('all')

  // ── Set de años disponibles ────────────────────────────────────────────────
  const anos = useMemo(
    () => Array.from(new Set(registros.map(r => r.ano))).sort((a, b) => b - a),
    [registros]
  )

  // ── Filtro por año ─────────────────────────────────────────────────────────
  const base = useMemo(
    () => anoFilt === 'all' ? registros : registros.filter(r => r.ano === anoFilt),
    [registros, anoFilt]
  )

  // ── KPIs globales (base completa para todos los tabs) ──────────────────────
  const kpis = useMemo(() => {
    const conDias  = base.filter(r => r.diasActivacion !== null).map(r => r.diasActivacion as number)
    const promDias = conDias.length ? avg(conDias) : 0
    const sla7     = conDias.filter(d => d <= 7).length
    const pctSLA   = conDias.length ? (sla7 / conDias.length) * 100 : 0
    const conEnc   = base.filter(r => r.encuesta && r.encuesta !== 'N/A' && r.encuesta !== '').length
    const pctEnc   = base.length ? (conEnc / base.length) * 100 : 0
    const ticket   = base.length ? avg(base.map(r => r.primerPago)) : 0
    return { promDias, pctSLA, sla7, conEnc, pctEnc, ticket, total: base.length, conDias: conDias.length }
  }, [base])

  // ── Por ejecutivo ─────────────────────────────────────────────────────────
  const byEjec = useMemo(() => {
    const map: Record<string, { count: number; dias: number[]; pago: number[] }> = {}
    for (const r of base) {
      if (!r.ejecutivo || r.ejecutivo === 'N/A') continue
      if (!map[r.ejecutivo]) map[r.ejecutivo] = { count: 0, dias: [], pago: [] }
      map[r.ejecutivo].count++
      if (r.diasActivacion !== null) map[r.ejecutivo].dias.push(r.diasActivacion)
      map[r.ejecutivo].pago.push(r.primerPago)
    }
    return Object.entries(map)
      .map(([name, d]) => ({
        name,
        count:   d.count,
        avgDias: d.dias.length ? avg(d.dias) : null,
        avgPago: d.pago.length ? avg(d.pago) : 0,
        sla7:    d.dias.filter(x => x <= 7).length,
        over30:  d.dias.filter(x => x > 30).length,
      }))
      .sort((a, b) => b.count - a.count)
  }, [base])

  // ── benchmark = min avgDias entre ejectuivos con >= 20 activaciones ────────
  const benchmark = useMemo(() => {
    const candidates = byEjec.filter(e => e.count >= 20 && e.avgDias !== null).map(e => e.avgDias as number)
    return candidates.length ? Math.min(...candidates) : null
  }, [byEjec])

  // ── Distribución tipo / complejidad / tamaño ──────────────────────────────
  const distData = useMemo(() => {
    const tipos: Record<string, { count: number; pago: number }> = {}
    const comps: Record<string, { count: number; pago: number }> = {}
    const sizes: Record<string, { count: number; pago: number }> = {}

    for (const r of base) {
      const t = r.tipo       || 'N/A'
      const c = r.complejidad|| 'N/A'
      const s = r.tamano     || 'N/A'

      if (!tipos[t]) tipos[t] = { count: 0, pago: 0 }
      tipos[t].count++; tipos[t].pago += r.primerPago

      if (!comps[c]) comps[c] = { count: 0, pago: 0 }
      comps[c].count++; comps[c].pago += r.primerPago

      if (!sizes[s]) sizes[s] = { count: 0, pago: 0 }
      sizes[s].count++; sizes[s].pago += r.primerPago
    }
    const sort = (m: typeof tipos) => Object.entries(m).sort((a, b) => b[1].count - a[1].count)
    return { tipos: sort(tipos), comps: sort(comps), sizes: sort(sizes) }
  }, [base])

  // ── Contacto / encuesta ───────────────────────────────────────────────────
  const contactoData = useMemo(() => {
    const ctc: Record<string, number> = {}
    const enc: Record<string, number> = {}
    for (const r of base) {
      const c = r.contacto || 'N/A'
      ctc[c] = (ctc[c] || 0) + 1
      const e = r.encuesta && r.encuesta !== '' ? r.encuesta : 'Sin respuesta'
      enc[e] = (enc[e] || 0) + 1
    }
    return {
      contacto: Object.entries(ctc).sort((a, b) => b[1] - a[1]),
      encuesta:  Object.entries(enc).sort((a, b) => b[1] - a[1]).slice(0, 8),
    }
  }, [base])

  // ── TOP cuentas ───────────────────────────────────────────────────────────
  const topCuentas = useMemo(() =>
    [...base].sort((a, b) => b.primerPago - a.primerPago).slice(0, 15),
    [base]
  )

  const slaColor = (d: number | null) => {
    if (d === null) return C.muted
    if (d <= 7)  return C.green
    if (d <= 14) return C.amber
    return C.red
  }
  const slaLabel = (d: number | null) => {
    if (d === null) return '—'
    if (d <= 7)  return 'SLA OK'
    if (d <= 14) return 'Moderado'
    return 'Crítico'
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 32, background: C.bg }}>
      {/* Encabezado del módulo */}
      <div style={{
        padding: '20px 0 16px',
        borderTop: `2px solid ${C.blue}`,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: C.tx, margin: 0, letterSpacing: '-0.01em' }}>
            Diagnóstico CX — Activaciones
          </h2>
          <p style={{ fontSize: 12, color: C.muted, margin: '4px 0 0' }}>
            Análisis de experiencia al cliente · se actualiza automáticamente con el archivo
          </p>
        </div>

        {/* Filtro año */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['all', ...anos] as (number | 'all')[]).map(a => (
            <button
              key={a}
              onClick={() => setAnoFilt(a)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                border: `1px solid ${anoFilt === a ? C.blue : C.border}`,
                background: anoFilt === a ? C.blue : C.card,
                color: anoFilt === a ? '#FFF' : C.muted,
                cursor: 'pointer',
              }}
            >
              {a === 'all' ? 'Todos' : a}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <KPI
          label="Días prom. activación"
          value={kpis.promDias > 0 ? kpis.promDias.toFixed(1) : '—'}
          sub={`${kpis.conDias} registros con dato`}
          color={kpis.promDias <= 10 ? C.green : kpis.promDias <= 20 ? C.amber : C.red}
        />
        <KPI
          label="Activaciones ≤ 7 días"
          value={kpis.pctSLA > 0 ? `${kpis.pctSLA.toFixed(0)}%` : '—'}
          sub={`${fmtN(kpis.sla7)} cuentas — SLA ideal`}
          color={kpis.pctSLA >= 50 ? C.green : kpis.pctSLA >= 25 ? C.amber : C.red}
        />
        <KPI
          label="Encuesta con respuesta"
          value={kpis.pctEnc > 0 ? `${kpis.pctEnc.toFixed(1)}%` : '—'}
          sub={`${fmtN(kpis.conEnc)} de ${fmtN(kpis.total)} cuentas`}
          color={kpis.pctEnc >= 50 ? C.green : kpis.pctEnc >= 20 ? C.amber : C.red}
        />
        <KPI
          label="Ticket promedio"
          value={kpis.ticket > 0 ? fmt$(kpis.ticket) : '—'}
          sub="Primer pago promedio"
          color={C.purple}
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.border}`, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              borderBottom: `3px solid ${tab === t.key ? C.blue : 'transparent'}`,
              background: 'transparent',
              color: tab === t.key ? C.blue : C.muted,
              transition: 'color .15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: HALLAZGOS ──────────────────────────────────────────────────── */}
      {tab === 'hallazgos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            {
              n: 1,
              title: 'Tiempo de activación excesivo',
              desc: `El promedio es ${kpis.promDias.toFixed(1)} días — muy por encima del SLA ideal de 7 días. Solo el ${kpis.pctSLA.toFixed(0)}% de las cuentas se activa en tiempo.`,
              impact: 'Alto',
              color: C.red,
              bg: C.redL,
              accion: 'Implementar checklist de activación express para cuentas de plan básico. Definir escalamiento automático al día 8 para TOP.',
            },
            {
              n: 2,
              title: 'Encuesta de satisfacción con cobertura mínima',
              desc: `Solo el ${kpis.pctEnc.toFixed(1)}% de las cuentas tiene registro de encuesta. Sin este dato, es imposible medir la experiencia real del cliente al momento de activación.`,
              impact: 'Alto',
              color: C.red,
              bg: C.redL,
              accion: 'Hacer obligatoria la captura de encuesta antes de marcar la activación como completada en el sistema.',
            },
            {
              n: 3,
              title: 'Dispersión alta entre ejecutivos',
              desc: byEjec.length > 1
                ? `El ejecutivo más eficiente promedia ${Math.min(...byEjec.filter(e => e.avgDias !== null).map(e => e.avgDias as number)).toFixed(1)} días; el más lento supera los ${Math.max(...byEjec.filter(e => e.avgDias !== null).map(e => e.avgDias as number)).toFixed(1)} días. La diferencia indica falta de proceso estándar.`
                : 'No hay suficientes ejecutivos con datos para comparar.',
              impact: 'Medio',
              color: C.amber,
              bg: C.amberL,
              accion: 'Replicar el proceso del ejecutivo con menor tiempo promedio. Sesión de calibración mensual con video de activación ideal.',
            },
            {
              n: 4,
              title: 'Cuentas TOP sin seguimiento diferenciado',
              desc: 'Las cuentas de mayor facturación reciben el mismo flujo de activación que las de plan básico. Un cliente de alto valor que tarda en activarse es riesgo inmediato de churn.',
              impact: 'Crítico',
              color: C.red,
              bg: C.redL,
              accion: 'Asignar ejecutivo senior para cuentas con primer pago >$3,000 MXN. Meet de bienvenida obligatorio en las primeras 24h.',
            },
            {
              n: 5,
              title: 'Contacto no siempre asegurado en el proceso',
              desc: 'Existen activaciones registradas sin confirmación de contacto con el cliente. Esto genera activaciones "fantasma" que terminan en churn temprano.',
              impact: 'Medio',
              color: C.amber,
              bg: C.amberL,
              accion: 'Agregar campo de confirmación de contacto como requisito de cierre en el tablero de activaciones. Alerta automática si han pasado 48h sin contacto.',
            },
          ].map(h => (
            <div key={h.n} style={{
              background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${h.color}`,
              borderRadius: 10, padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: h.bg, color: h.color,
                }}>Hallazgo {h.n} · Impacto {h.impact}</span>
              </div>
              <div style={{ fontWeight: 700, color: C.tx, fontSize: 15, marginBottom: 6 }}>{h.title}</div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 10 }}>{h.desc}</div>
              <div style={{
                fontSize: 12, color: C.blue, background: C.blueL,
                borderRadius: 6, padding: '8px 12px', fontWeight: 500,
              }}>
                Acción: {h.accion}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: EJECUTIVOS ─────────────────────────────────────────────────── */}
      {tab === 'ejecutivos' && (
        <div>
          {benchmark !== null && (
            <div style={{
              background: C.greenL, border: `1px solid ${C.green}`, borderRadius: 8,
              padding: '10px 16px', marginBottom: 16, fontSize: 13, color: C.green, fontWeight: 600,
            }}>
              Benchmark interno: {benchmark.toFixed(1)} días promedio
              {' '}· Referencia del ejecutivo más eficiente (≥20 activaciones)
            </div>
          )}
          <Table
            heads={['Ejecutivo', 'Activaciones', 'Días prom.', 'vs benchmark', 'SLA ≤7d', '>30 días', 'Ticket prom.']}
            rows={byEjec.map(e => [
              e.name,
              fmtN(e.count),
              e.avgDias !== null ? e.avgDias.toFixed(1) : '—',
              e.avgDias !== null && benchmark !== null
                ? `${e.avgDias <= benchmark ? '' : '+'}${(e.avgDias - benchmark).toFixed(1)}`
                : '—',
              e.count > 0 ? `${((e.sla7 / e.count) * 100).toFixed(0)}%` : '—',
              fmtN(e.over30),
              fmt$(e.avgPago),
            ])}
          />
        </div>
      )}

      {/* ── TAB: DISTRIBUCIÓN ──────────────────────────────────────────────── */}
      {tab === 'distribucion' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Tipo */}
          <div>
            <div style={{ fontWeight: 700, color: C.tx, marginBottom: 14, fontSize: 14 }}>Por tipo de activación</div>
            {distData.tipos.map(([label, d]) => (
              <HBar key={label} label={label} count={d.count} total={base.length}
                color={C.blue} extra={fmt$(d.pago / d.count)} />
            ))}
          </div>

          {/* Complejidad */}
          <div>
            <div style={{ fontWeight: 700, color: C.tx, marginBottom: 14, fontSize: 14 }}>Por complejidad</div>
            {distData.comps.map(([label, d], i) => (
              <HBar key={label} label={label === 'N/A' ? 'Sin dato' : label}
                count={d.count} total={base.length}
                color={[C.green, C.amber, C.red, C.purple, C.blue][i % 5]}
                extra={fmt$(d.pago / d.count)} />
            ))}
          </div>

          {/* Tamaño */}
          <div>
            <div style={{ fontWeight: 700, color: C.tx, marginBottom: 14, fontSize: 14 }}>Por tamaño</div>
            {distData.sizes.map(([label, d], i) => (
              <HBar key={label} label={label === 'N/A' ? 'Sin dato' : label}
                count={d.count} total={base.length}
                color={[C.purple, C.blue, C.green, C.amber, C.red][i % 5]}
                extra={fmt$(d.pago / d.count)} />
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: CONTACTO ──────────────────────────────────────────────────── */}
      {tab === 'contacto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <div style={{ fontWeight: 700, color: C.tx, marginBottom: 14, fontSize: 14 }}>¿Se tuvo contacto con el cliente?</div>
            {contactoData.contacto.map(([label, count], i) => (
              <HBar key={label} label={label} count={count} total={base.length}
                color={[C.green, C.red, C.amber, C.blue][i % 4]} />
            ))}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: C.tx, marginBottom: 14, fontSize: 14 }}>Encuesta de satisfacción al cliente</div>
            {contactoData.encuesta.map(([label, count], i) => (
              <HBar key={label} label={label} count={count} total={base.length}
                color={[C.blue, C.green, C.amber, C.red, C.purple, C.blue, C.green, C.amber][i % 8]} />
            ))}
            {kpis.pctEnc < 20 && (
              <div style={{
                marginTop: 12, padding: '10px 14px', background: C.redL,
                border: `1px solid ${C.red}`, borderRadius: 8,
                fontSize: 13, color: C.red, fontWeight: 600,
              }}>
                Cobertura de encuesta por debajo del 20% — es urgente establecer un proceso de captura obligatorio.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TOP CUENTAS ───────────────────────────────────────────────── */}
      {tab === 'top' && (
        <div>
          <div style={{
            marginBottom: 16, padding: '10px 16px', background: C.purpleL,
            border: `1px solid ${C.purple}`, borderRadius: 8,
            fontSize: 13, color: C.purple, fontWeight: 600,
          }}>
            TOP 15 cuentas por primer pago — estas cuentas requieren activación express ≤7 días y meet de bienvenida obligatorio
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.blueL }}>
                  {['#', 'Cliente', 'Primer pago', 'Ejecutivo', 'Días activación', 'SLA', 'Tipo', 'Año'].map((h, i) => (
                    <th key={i} style={{
                      padding: '8px 12px', textAlign: i < 2 ? 'left' : 'right',
                      fontWeight: 700, color: C.blue, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCuentas.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 ? '#F8FAFF' : C.card }}>
                    <td style={{ padding: '8px 12px', color: C.muted, fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', color: C.tx, fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cliente}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: C.purple, fontWeight: 700 }}>{fmt$(r.primerPago)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: C.muted }}>{r.ejecutivo}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700,
                      color: slaColor(r.diasActivacion) }}>
                      {r.diasActivacion !== null ? `${r.diasActivacion}d` : '—'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                        background: slaColor(r.diasActivacion) + '22',
                        color: slaColor(r.diasActivacion),
                      }}>{slaLabel(r.diasActivacion)}</span>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: C.muted }}>{r.tipo}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: C.muted }}>{r.ano}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
