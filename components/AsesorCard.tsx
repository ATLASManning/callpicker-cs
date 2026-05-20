'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, ArrowUpRight, AlertTriangle,
  TrendingUp, Users, DollarSign, LifeBuoy,
} from 'lucide-react'
import type { Cuenta } from '@/lib/types'
import { getSemaforo, formatMXN, ASESOR_CONFIG } from '@/lib/types'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface ZohoStats { total: number; fallas: number; ultima: string | null }
export type CuentaRich = Cuenta & { zoho_tickets: ZohoStats }

interface SemaforoResumen {
  verde: number; azul: number; amarillo: number; naranja: number; rojo: number
  facturacion_total: number
}

interface Props {
  asesor:    string
  cuentas:   CuentaRich[]
  resumen:   SemaforoResumen
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

function DiasCell({ dias }: { dias: number }) {
  const cls = dias > 30 ? 'text-rojo font-bold'
    : dias > 14 ? 'text-naranja font-semibold'
    : 'text-textMid'
  return <span className={`text-xs ${cls}`}>{dias}d</span>
}

function TicketCell({ zt }: { zt: ZohoStats }) {
  if (zt.total === 0) return <span className="text-xs text-textLow">—</span>
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5">
        <span className={`text-sm font-bold tabular-nums ${zt.total > 10 ? 'text-naranja' : 'text-textHi'}`}>
          {zt.total}
        </span>
        {zt.fallas > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
            bg-rojo/10 text-rojo text-[10px] font-semibold border border-rojo/20">
            <AlertTriangle size={8} /> {zt.fallas}
          </span>
        )}
      </div>
      {zt.ultima && (
        <span className="text-[10px] text-textLow">Últ: {fmtFecha(zt.ultima)}</span>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function AsesorCard({ asesor, cuentas, resumen, defaultOpen = false }: Props) {
  const [expanded, setExpanded] = useState(defaultOpen)
  const ac = ASESOR_CONFIG[asesor as keyof typeof ASESOR_CONFIG] ?? { color: '#94A3B8', initial: '?' }

  const saludables  = cuentas.filter(c => c.health_score >= 60).length
  const observacion = cuentas.filter(c => c.health_score >= 40 && c.health_score < 60).length
  const enRiesgo    = cuentas.filter(c => c.health_score < 40).length
  const totalTix    = cuentas.reduce((s, c) => s + c.zoho_tickets.total,  0)
  const totalFallas = cuentas.reduce((s, c) => s + c.zoho_tickets.fallas, 0)
  const conOportunidad = cuentas.filter(c => c.upsell_producto || c.crossell_producto).length

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-card"
      style={{ borderLeftWidth: 3, borderLeftColor: ac.color }}>

      {/* ── Header del asesor ─────────────────────────────────────────────── */}
      <div className="px-6 py-5">
        <div className="flex items-start gap-5 flex-wrap">

          {/* Avatar + identidad */}
          <div className="flex items-center gap-4 min-w-[180px]">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ background: `${ac.color}18`, color: ac.color, border: `2px solid ${ac.color}30` }}>
              {ac.initial}
            </div>
            <div>
              <h2 className="text-base font-bold text-textHi leading-tight">{asesor}</h2>
              <p className="text-xs text-textLow mt-0.5">Ejecutivo Customer Success</p>
              <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${ac.color}15`, color: ac.color }}>
                {cuentas.length} cuentas asignadas
              </span>
            </div>
          </div>

          {/* KPIs principales */}
          <div className="flex flex-wrap gap-3 flex-1">
            <KpiPill icon={<DollarSign size={13} />} label="Facturación"
              value={formatMXN(resumen.facturacion_total)} color="#3B82F6" />
            <KpiPill icon={<Users size={13} />} label="Saludables"
              value={String(saludables)} color="#22C55E" />
            <KpiPill icon={<AlertTriangle size={13} />} label="Observación"
              value={String(observacion)} color="#EAB308" />
            <KpiPill icon={<AlertTriangle size={13} />} label="En Riesgo"
              value={String(enRiesgo)} color="#EF4444" />
            {totalTix > 0 && (
              <KpiPill
                icon={<AlertTriangle size={13} />}
                label={totalFallas > 0 ? `Tickets · ${totalFallas} fallas` : 'Tickets Zoho'}
                value={String(totalTix)}
                color={totalFallas > 0 ? '#EF4444' : '#F97316'}
              />
            )}
            {conOportunidad > 0 && (
              <KpiPill icon={<TrendingUp size={13} />} label="Oportunidades"
                value={String(conOportunidad)} color="#14B8A6" />
            )}
          </div>

          {/* Acciones: Slack + toggle */}
          <div className="flex flex-col gap-2 self-start flex-shrink-0">

            {/* Botón Centro de Ayuda */}
            <a
              href="https://ayuda.callpicker.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                bg-[#0F766E] hover:bg-[#0D9488] text-white shadow-sm
                transition-all duration-150 whitespace-nowrap"
              title="Centro de Ayuda Callpicker"
            >
              <LifeBuoy size={15} />
              Centro de Ayuda
            </a>

            {/* Botón Slack — fondo sólido púrpura Slack, letras blancas */}
            <a
              href="https://callpicker.slack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold
                bg-[#4A154B] hover:bg-[#611f69] text-white shadow-sm
                transition-all duration-150 whitespace-nowrap"
              title="Abrir Slack Callpicker"
            >
              <SlackIcon size={15} />
              Slack Callpicker
            </a>

            {/* Botón toggle — fondo sólido del color del asesor, letras blancas */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                text-xs font-bold text-white shadow-sm transition-all duration-150 whitespace-nowrap"
              style={{ background: ac.color }}
            >
              {expanded
                ? <><ChevronUp size={14} /> Compactar</>
                : <><ChevronDown size={14} /> Mostrar cuentas</>}
            </button>
          </div>
        </div>

        {/* ── Mini semáforo ── */}
        <div className="flex gap-2 mt-4">
          {SEMAFORO_META.map(s => {
            const cnt = resumen[s.key]
            if (cnt === 0) return null
            return (
              <div key={s.key}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: `${s.color}10`, border: `1px solid ${s.color}20`, color: s.color }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="font-bold tabular-nums">{cnt}</span>
                <span className="opacity-70 text-[10px]">{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Tabla colapsable ──────────────────────────────────────────────── */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden
        ${expanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>

        <div className="border-t border-border">
          {/* Sub-header de la tabla */}
          <div className="px-6 py-2.5 bg-surface/50 flex items-center justify-between">
            <span className="text-[11px] text-textLow font-medium">
              {cuentas.length} cuentas · ordenadas por Health Score ascendente
            </span>
            <Link href={`/cuentas`}
              className="text-[11px] text-cp hover:text-cpTeal font-medium transition-colors flex items-center gap-1">
              Ver en Cuentas <ArrowUpRight size={11} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="cp-table">
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
                <tr>
                  <th>#</th>
                  <th>Empresa</th>
                  <th>Facturación</th>
                  <th>Health Score</th>
                  <th>Semáforo</th>
                  <th>Días sin act.</th>
                  <th>Tickets Zoho Desk</th>
                  <th>Último contacto</th>
                  <th>Oportunidad</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cuentas.map(c => {
                  const semaforo = getSemaforo(c.health_score)
                  const hsColor = ['verde', 'azul'].includes(semaforo) ? '#22C55E'
                    : semaforo === 'amarillo' ? '#EAB308' : '#EF4444'
                  return (
                    <tr key={c.id}>
                      <td>
                        <span className="font-mono text-xs font-bold text-cp">{c.consecutivo}</span>
                      </td>
                      <td>
                        <Link href={`/cuentas/${c.id}`}
                          className="text-sm font-semibold text-textHi hover:text-cp transition-colors block leading-tight">
                          {c.empresa}
                        </Link>
                        {c.giro && (
                          <span className="text-[11px] text-textLow">{c.giro}</span>
                        )}
                      </td>
                      <td>
                        <span className="text-sm font-bold tabular-nums text-textHi">
                          {formatMXN(c.facturacion)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <HealthScoreRing score={c.health_score} size={32} strokeWidth={4} showLabel={false} />
                          <span className="text-sm font-bold tabular-nums" style={{ color: hsColor }}>
                            {c.health_score}
                          </span>
                        </div>
                      </td>
                      <td><SemaforoBadge semaforo={semaforo} size="sm" /></td>
                      <td><DiasCell dias={c.dias_sin_actividad} /></td>
                      <td><TicketCell zt={c.zoho_tickets} /></td>
                      <td>
                        <span className="text-xs text-textLow whitespace-nowrap">
                          {fmtFecha(c.ultimo_contacto)}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          {c.upsell_producto && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full
                              bg-cpTeal/10 text-cpTeal border border-cpTeal/20 whitespace-nowrap">
                              ↑ {c.upsell_producto}
                            </span>
                          )}
                          {c.crossell_producto && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full
                              bg-purple-500/10 text-purple-400 border border-purple-500/20 whitespace-nowrap">
                              ⇄ {c.crossell_producto}
                            </span>
                          )}
                          {!c.upsell_producto && !c.crossell_producto && (
                            <span className="text-xs text-textLow">—</span>
                          )}
                        </div>
                      </td>
                      <td>
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
          <div className="px-6 py-2.5 bg-surface/30 border-t border-border flex items-center justify-between text-[11px] text-textLow">
            <span>{cuentas.length} cuentas · {formatMXN(resumen.facturacion_total)} total cartera</span>
            {totalTix > 0 && (
              <span className="flex items-center gap-1.5">
                {totalTix} tickets
                {totalFallas > 0 && <span className="text-rojo font-semibold">· {totalFallas} fallas</span>}
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

// ── KpiPill ───────────────────────────────────────────────────────────────────
function KpiPill({
  icon, label, value, color,
}: {
  icon: React.ReactNode; label: string; value: string; color: string
}) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border"
      style={{ background: `${color}08`, borderColor: `${color}20` }}>
      <span style={{ color }} className="flex-shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-bold tabular-nums leading-tight" style={{ color }}>{value}</p>
        <p className="text-[10px] text-textLow leading-tight whitespace-nowrap">{label}</p>
      </div>
    </div>
  )
}
