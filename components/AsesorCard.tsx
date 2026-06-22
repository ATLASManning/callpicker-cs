'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, ArrowUpRight, AlertTriangle,
  TrendingUp, DollarSign, LifeBuoy, Phone, Mail, Hash,
} from 'lucide-react'
import type { Cuenta } from '@/lib/types'
import { getSemaforo, formatMXN, ASESOR_CONFIG } from '@/lib/types'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'

// ── Paleta azul marino (header) ───────────────────────────────────────────────
const NAVY      = '#0A1628'
const NAVY_MID  = '#0F2040'
const NAVY_LINE = 'rgba(255,255,255,0.10)'
const TX_HI     = '#FFFFFF'
const TX_MID    = 'rgba(255,255,255,0.70)'
const TX_LOW    = 'rgba(255,255,255,0.45)'

// ── Paleta clara (tabla expandida) ────────────────────────────────────────────
const L_BG      = '#FFFFFF'
const L_BG2     = '#F8FAFC'
const L_BG3     = '#F1F5F9'
const L_LINE    = '#E2E8F0'
const L_TX      = '#0F172A'
const L_TX_MID  = '#475569'
const L_TX_LOW  = '#94A3B8'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface ZohoStats { total: number; fallas: number; ultima: string | null }
export type CuentaRich = Cuenta & { zoho_tickets: ZohoStats }

interface SemaforoResumen {
  verde: number; azul: number; amarillo: number; naranja: number; rojo: number
  facturacion_total: number
}

interface Props {
  asesor:      string
  cuentas:     CuentaRich[]
  resumen:     SemaforoResumen
  defaultOpen?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEMAFORO_META = [
  { key: 'verde',    label: 'Saludable',   color: '#22C55E' },
  { key: 'azul',     label: 'Estable',     color: '#3B82F6' },
  { key: 'amarillo', label: 'Observación', color: '#EAB308' },
  { key: 'naranja',  label: 'En Riesgo',   color: '#F97316' },
  { key: 'rojo',     label: 'Riesgo Alto', color: '#EF4444' },
] as const

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function TicketCellLight({ zt }: { zt: ZohoStats }) {
  if (zt.total === 0) return <span style={{ fontSize: 12, color: L_TX_LOW }}>—</span>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: zt.total > 10 ? '#F97316' : L_TX, fontVariantNumeric: 'tabular-nums' }}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px', borderRadius: 99, background: '#FEF2F2', color: '#EF4444', fontSize: 10, fontWeight: 600, border: '1px solid #FECACA' }}>
            <AlertTriangle size={8} /> {zt.fallas}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span style={{ fontSize: 10, color: L_TX_LOW }}>Últ: {fmtFecha(zt.ultima)}</span>
      )}
    </div>
  )
}

// ── KpiCard — tarjeta KPI para la zona oscura ─────────────────────────────────
function KpiCard({
  icon, label, value, accent, sub,
}: {
  icon: React.ReactNode; label: string; value: string; accent: string; sub?: string
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-xl flex-1 min-w-[110px]"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
      <div className="flex items-center gap-1.5">
        <span style={{ color: accent }} className="opacity-80">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: TX_LOW }}>{label}</span>
      </div>
      <p className="text-xl font-black tabular-nums leading-none" style={{ color: TX_HI }}>{value}</p>
      {sub && <p className="text-[10px] leading-tight" style={{ color: TX_LOW }}>{sub}</p>}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AsesorCard({ asesor, cuentas, resumen, defaultOpen = false }: Props) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const ac = ASESOR_CONFIG[asesor as keyof typeof ASESOR_CONFIG] ?? {
    color: '#94A3B8', initial: '?', fullName: asesor, ext: '—', email: '—',
  }

  const saludables  = cuentas.filter(c => c.health_score >= 60).length
  const observacion = cuentas.filter(c => c.health_score >= 40 && c.health_score < 60).length
  const enRiesgo    = cuentas.filter(c => c.health_score < 40).length
  const totalTix    = cuentas.reduce((s, c) => s + c.zoho_tickets.total,  0)
  const totalFallas = cuentas.reduce((s, c) => s + c.zoho_tickets.fallas, 0)
  const conOportunidad = cuentas.filter(c => c.upsell_producto || c.crossell_producto).length

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg"
      style={{ border: `1px solid ${NAVY_LINE}`, borderLeft: `4px solid ${ac.color}` }}>

      {/* ════════════════════════════════════════════════════════════════════════
          HEADER — fondo azul marino
          ════════════════════════════════════════════════════════════════════════ */}
      <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_MID} 100%)` }}>

        {/* ── Fila superior: identidad + acciones ────────────────────────── */}
        <div className="px-6 pt-5 pb-4 flex items-start gap-6 flex-wrap">

          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center
            text-3xl font-black flex-shrink-0 select-none"
            style={{
              background: `${ac.color}25`,
              border: `2px solid ${ac.color}50`,
              color: ac.color,
              boxShadow: `0 4px 16px ${ac.color}30`,
            }}>
            {ac.initial}
          </div>

          {/* Identidad + datos de contacto */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-black leading-tight" style={{ color: TX_HI }}>
                {ac.fullName}
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest"
                style={{ background: `${ac.color}25`, color: ac.color, border: `1px solid ${ac.color}40` }}>
                Ejecutivo CS
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.08)', color: TX_MID }}>
                {cuentas.length} cuentas
              </span>
            </div>

            {/* Datos de contacto */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: TX_MID }}>
                <Hash size={12} style={{ color: ac.color, opacity: 0.8 }} />
                Ext. {ac.ext}
              </span>
              <a href={`mailto:${ac.email}`}
                className="flex items-center gap-1.5 text-xs hover:opacity-90 transition-opacity"
                style={{ color: TX_MID }}>
                <Mail size={12} style={{ color: ac.color, opacity: 0.8 }} />
                {ac.email}
              </a>
              {ac.tel && (
                <a href={`tel:${ac.tel.replace(/\s/g,'')}`}
                  className="flex items-center gap-1.5 text-xs hover:opacity-90 transition-opacity"
                  style={{ color: TX_MID }}>
                  <Phone size={12} style={{ color: ac.color, opacity: 0.8 }} />
                  {ac.tel}
                </a>
              )}
            </div>
          </div>

          {/* Acciones — grid 2×2 */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0 self-start" style={{ minWidth: 280 }}>
            {/* 1 — Centro de Ayuda */}
            <a href="https://ayuda.callpicker.com/" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold
                text-white shadow-sm transition-all duration-150 whitespace-nowrap hover:brightness-110"
              style={{ background: '#0F766E' }}>
              <LifeBuoy size={13} /> Centro de Ayuda
            </a>
            {/* 2 — Slack */}
            <a href="https://callpicker.slack.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold
                text-white shadow-sm transition-all duration-150 whitespace-nowrap hover:brightness-110"
              style={{ background: '#4A154B' }}>
              <SlackIcon size={13} /> Slack Callpicker
            </a>
            {/* 3 — My Callpicker */}
            <a href="https://my.callpicker.com/" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold
                text-white shadow-sm transition-all duration-150 whitespace-nowrap hover:brightness-110"
              style={{ background: '#0E30CC' }}>
              <Phone size={13} /> Callpicker
            </a>
            {/* 4 — Compactar / Expandir */}
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl
                text-xs font-bold text-white shadow-sm transition-all duration-150 whitespace-nowrap hover:brightness-110"
              style={{ background: ac.color }}>
              {expanded
                ? <><ChevronUp size={13} /> Compactar</>
                : <><ChevronDown size={13} /> Ver cuentas</>}
            </button>
          </div>
        </div>

        {/* ── Fila KPIs ─────────────────────────────────────────────────── */}
        <div className="px-6 pb-5 flex gap-3 flex-wrap">
          <KpiCard icon={<DollarSign size={14} />} label="Facturación"
            value={formatMXN(resumen.facturacion_total)} accent="#3B82F6" />
          <KpiCard icon={<span className="text-sm">✓</span>} label="Saludables"
            value={String(saludables)} accent="#22C55E"
            sub={`${Math.round((saludables / (cuentas.length || 1)) * 100)}% de cartera`} />
          <KpiCard icon={<AlertTriangle size={14} />} label="Observación"
            value={String(observacion)} accent="#EAB308" />
          <KpiCard icon={<AlertTriangle size={14} />} label="En Riesgo"
            value={String(enRiesgo)} accent="#EF4444" />
          {totalTix > 0 && (
            <KpiCard
              icon={<AlertTriangle size={14} />}
              label={totalFallas > 0 ? `Tickets · ${totalFallas} fallas` : 'Tickets Zoho'}
              value={String(totalTix)}
              accent={totalFallas > 0 ? '#EF4444' : '#F97316'}
            />
          )}
          {conOportunidad > 0 && (
            <KpiCard icon={<TrendingUp size={14} />} label="Oportunidades"
              value={String(conOportunidad)} accent="#14B8A6" />
          )}
        </div>

        {/* ── Mini semáforo ─────────────────────────────────────────────── */}
        <div className="px-6 pb-5 flex gap-2 flex-wrap">
          {SEMAFORO_META.map(s => {
            const cnt = resumen[s.key]
            if (cnt === 0) return null
            return (
              <div key={s.key}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
                style={{
                  background: `${s.color}18`,
                  border: `1px solid ${s.color}35`,
                  color: s.color,
                }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="font-bold tabular-nums">{cnt}</span>
                <span className="text-[10px]" style={{ opacity: 0.8 }}>{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>
      {/* ── FIN HEADER ───────────────────────────────────────────────────────── */}

      {/* ════════════════════════════════════════════════════════════════════════
          TABLA colapsable — paleta clara
          ════════════════════════════════════════════════════════════════════════ */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden
        ${expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>

        <div style={{ borderTop: `1px solid ${L_LINE}`, background: L_BG }}>
          {/* Sub-header */}
          <div style={{ padding: '8px 24px', background: L_BG3, borderBottom: `1px solid ${L_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: L_TX_LOW, fontWeight: 500 }}>
              {cuentas.length} cuentas · ordenadas por Health Score ascendente
            </span>
            <Link href="/cuentas"
              className="text-[11px] text-cp hover:text-cpTeal font-medium transition-colors flex items-center gap-1">
              Ver en Cuentas <ArrowUpRight size={11} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <colgroup>
                <col style={{ width: '72px' }} />
                <col style={{ minWidth: '180px' }} />
                <col style={{ width: '115px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '95px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '110px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '52px' }} />
              </colgroup>
              <thead>
                <tr style={{ background: L_BG2 }}>
                  {['#','Empresa','Facturación','Health Score','Semáforo','Días sin act.','Tickets Zoho Desk','Último contacto','Oportunidad',''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: L_TX_LOW, borderBottom: `1px solid ${L_LINE}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cuentas.map((c, ri) => {
                  const semaforo = getSemaforo(c.health_score)
                  const hsColor = ['verde', 'azul'].includes(semaforo) ? '#22C55E'
                    : semaforo === 'amarillo' ? '#EAB308' : '#EF4444'
                  const rowBg = ri % 2 === 0 ? L_BG : L_BG2
                  const cell: React.CSSProperties = { padding: '11px 14px', borderBottom: `1px solid ${L_LINE}`, verticalAlign: 'middle' }
                  return (
                    <tr key={c.id} style={{ background: rowBg }} onMouseEnter={e => (e.currentTarget.style.background = '#EFF6FF')} onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                      <td style={cell}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#1B3FCC' }}>{c.consecutivo}</span>
                      </td>
                      <td style={cell}>
                        <Link href={`/cuentas/${c.id}`}
                          style={{ fontSize: 13, fontWeight: 600, color: L_TX, textDecoration: 'none', display: 'block', lineHeight: 1.3 }}
                          className="hover:text-cp transition-colors">
                          {c.empresa}
                        </Link>
                        {c.giro && <span style={{ fontSize: 11, color: L_TX_LOW }}>{c.giro}</span>}
                      </td>
                      <td style={cell}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: L_TX, fontVariantNumeric: 'tabular-nums' }}>
                          {formatMXN(c.factura_mensual_zoho ?? c.facturacion)}
                        </span>
                      </td>
                      <td style={cell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <HealthScoreRing score={c.health_score} size={32} strokeWidth={4} showLabel={false} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: hsColor, fontVariantNumeric: 'tabular-nums' }}>
                            {c.health_score}
                          </span>
                        </div>
                      </td>
                      <td style={cell}><SemaforoBadge semaforo={semaforo} size="sm" /></td>
                      <td style={cell}>
                        <span style={{ fontSize: 12, fontWeight: c.dias_sin_actividad > 30 ? 700 : 500, color: c.dias_sin_actividad > 30 ? '#EF4444' : c.dias_sin_actividad > 14 ? '#F97316' : L_TX_MID }}>
                          {c.dias_sin_actividad}d
                        </span>
                      </td>
                      <td style={cell}><TicketCellLight zt={c.zoho_tickets} /></td>
                      <td style={cell}>
                        <span style={{ fontSize: 12, color: L_TX_LOW, whiteSpace: 'nowrap' }}>
                          {fmtFecha(c.ultimo_contacto)}
                        </span>
                      </td>
                      <td style={cell}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {c.upsell_producto && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#F0FDF4', color: '#059669', border: '1px solid #BBF7D0', whiteSpace: 'nowrap', fontWeight: 600 }}>
                              ↑ {c.upsell_producto}
                            </span>
                          )}
                          {c.crossell_producto && (
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: '#FAF5FF', color: '#7C3AED', border: '1px solid #DDD6FE', whiteSpace: 'nowrap', fontWeight: 600 }}>
                              ⇄ {c.crossell_producto}
                            </span>
                          )}
                          {!c.upsell_producto && !c.crossell_producto && (
                            <span style={{ color: L_TX_LOW, fontSize: 12 }}>—</span>
                          )}
                        </div>
                      </td>
                      <td style={cell}>
                        <Link href={`/cuentas/${c.id}`}
                          className="inline-flex items-center gap-0.5 text-xs text-cp hover:text-cpTeal font-medium transition-colors">
                          Ver <ArrowUpRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer tabla */}
          <div style={{ padding: '8px 24px', background: L_BG3, borderTop: `1px solid ${L_LINE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: L_TX_LOW }}>{cuentas.length} cuentas · {formatMXN(resumen.facturacion_total)} total cartera</span>
            {totalTix > 0 && (
              <span style={{ fontSize: 11, color: L_TX_LOW, display: 'flex', alignItems: 'center', gap: 6 }}>
                {totalTix} tickets
                {totalFallas > 0 && <span style={{ color: '#EF4444', fontWeight: 600 }}>· {totalFallas} fallas</span>}
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

// ── SlackIcon SVG oficial ─────────────────────────────────────────────────────
function SlackIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 122.8 122.8" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
      <path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"/>
      <path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"/>
      <path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"/>
      <path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"/>
    </svg>
  )
}
