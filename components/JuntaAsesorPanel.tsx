'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  Phone, MessageCircle, Mail, Users, AlertCircle,
  FileText, Monitor, TrendingUp, TicketIcon,
  ChevronRight, Clock, Calendar, AlertTriangle,
} from 'lucide-react'
import type { SeguimientoConCuenta, OportunidadConCuenta, TicketConCuenta } from '@/lib/supabase'
import type { Cuenta, SemaforoAsesor, Asesor, TipoSeguimiento } from '@/lib/types'
import { ASESOR_CONFIG, SEMAFORO_CONFIG, getSemaforo, formatMXN } from '@/lib/types'

// ── Config ───────────────────────────────────────────────────────────────────

const TIPO_SEG: Record<TipoSeguimiento, { label: string; color: string; Icon: React.ElementType }> = {
  llamada:  { label: 'Llamada',  color: '#0057FF', Icon: Phone },
  whatsapp: { label: 'WhatsApp', color: '#22C55E', Icon: MessageCircle },
  email:    { label: 'Email',    color: '#6366F1', Icon: Mail },
  reunion:  { label: 'Reunión',  color: '#F97316', Icon: Users },
  ticket:   { label: 'Ticket',   color: '#EF4444', Icon: AlertCircle },
  nota:     { label: 'Nota',     color: '#64748B', Icon: FileText },
  demo:     { label: 'Demo',     color: '#0EA5E9', Icon: Monitor },
  upsell:   { label: 'Upsell',   color: '#A855F7', Icon: TrendingUp },
}

const PRIORIDAD: Record<string, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: '#EF4444' },
  alta:    { label: 'Alta',    color: '#F97316' },
  normal:  { label: 'Normal',  color: '#EAB308' },
  baja:    { label: 'Baja',    color: '#64748B' },
}

const ESTADO_OPP: Record<string, { label: string; color: string }> = {
  identificada: { label: 'Identificada', color: '#0EA5E9' },
  en_proceso:   { label: 'En Proceso',   color: '#F97316' },
  ganada:       { label: 'Ganada',       color: '#22C55E' },
  perdida:      { label: 'Perdida',      color: '#EF4444' },
  descartada:   { label: 'Descartada',   color: '#64748B' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFecha(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {label}
    </span>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-10 text-center text-sm text-textLow">{msg}</div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  asesor: Asesor
  semaforo: SemaforoAsesor | undefined
  seguimientos: SeguimientoConCuenta[]
  tickets: TicketConCuenta[]
  oportunidades: OportunidadConCuenta[]
  cuentas: Cuenta[]
  weekLabel: string
}

type Tab = 'actividad' | 'tickets' | 'oportunidades' | 'semaforo'

// ── Component ─────────────────────────────────────────────────────────────────

export default function JuntaAsesorPanel({
  asesor, semaforo, seguimientos, tickets, oportunidades, cuentas, weekLabel,
}: Props) {
  const [tab, setTab] = useState<Tab>('actividad')
  const [open, setOpen] = useState(true)

  const ac = ASESOR_CONFIG[asesor]

  // Activity counts by tipo
  const counts = seguimientos.reduce<Record<string, number>>((acc, s) => {
    acc[s.tipo] = (acc[s.tipo] ?? 0) + 1
    return acc
  }, {})

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'actividad',    label: 'Actividad',    count: seguimientos.length },
    { id: 'tickets',      label: 'Tickets',      count: tickets.length },
    { id: 'oportunidades',label: 'Oportunidades',count: oportunidades.length },
    { id: 'semaforo',     label: 'Semáforo',     count: cuentas.length },
  ]

  return (
    <div className="cp-card mb-5 p-0 overflow-hidden">
      {/* ── Section header ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surfaceAlt transition-colors"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: `${ac.color}20`, color: ac.color, border: `1.5px solid ${ac.color}50` }}>
          {ac.initial}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-textHi">{asesor}</p>
          {semaforo && (
            <p className="text-xs text-textLow">
              {semaforo.total} cuentas · {formatMXN(semaforo.facturacion_total)}
              {semaforo.facturacion_en_riesgo > 0 &&
                <span className="text-rojo ml-2">· {formatMXN(semaforo.facturacion_en_riesgo)} en riesgo</span>
              }
            </p>
          )}
        </div>

        {/* Semáforo pills mini */}
        {semaforo && (
          <div className="flex gap-1 mr-3">
            {[
              { k:'verde',    c:'#22C55E', v: semaforo.verde    },
              { k:'azul',     c:'#3B82F6', v: semaforo.azul     },
              { k:'amarillo', c:'#EAB308', v: semaforo.amarillo },
              { k:'naranja',  c:'#F97316', v: semaforo.naranja  },
              { k:'rojo',     c:'#EF4444', v: semaforo.rojo     },
            ].filter(s => s.v > 0).map(s => (
              <span key={s.k} className="text-[11px] font-bold px-2 py-0.5 rounded"
                style={{ background: `${s.c}18`, color: s.c }}>
                {s.v}
              </span>
            ))}
          </div>
        )}
        <ChevronRight size={16} className={`text-textLow transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <>
          {/* ── Sub-tabs ── */}
          <div className="flex border-b border-border bg-surfaceAlt px-5 gap-1">
            {tabs.map(t => (
              <button key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px flex items-center gap-1.5
                  ${tab === t.id
                    ? 'border-cp text-cp'
                    : 'border-transparent text-textLow hover:text-textMid'}`}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                    ${tab === t.id ? 'bg-cp/15 text-cp' : 'bg-border text-textLow'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="px-5 py-4">
            {/* ── TAB: ACTIVIDAD ── */}
            {tab === 'actividad' && (
              <div>
                {/* Activity count pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {(Object.keys(TIPO_SEG) as TipoSeguimiento[]).map(tipo => {
                    const c = counts[tipo] ?? 0
                    const cfg = TIPO_SEG[tipo]
                    return (
                      <div key={tipo}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium"
                        style={{
                          background: c > 0 ? `${cfg.color}10` : '#F8FAFC',
                          borderColor: c > 0 ? `${cfg.color}30` : '#E2E8F0',
                          color: c > 0 ? cfg.color : '#94A3B8',
                        }}>
                        <cfg.Icon size={13} />
                        {cfg.label}
                        <span className="font-bold text-sm">{c}</span>
                      </div>
                    )
                  })}
                  {seguimientos.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium"
                      style={{ background: '#EFF6FF', borderColor: '#BFDBFE', color: '#0057FF' }}>
                      <Clock size={13} />
                      {seguimientos.reduce((s, x) => s + (x.duracion_min ?? 0), 0)} min totales
                    </div>
                  )}
                </div>

                {seguimientos.length === 0 ? (
                  <EmptyState msg={`Sin seguimientos registrados esta semana (${weekLabel})`} />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="cp-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Cuenta</th>
                          <th>Tipo</th>
                          <th>Descripción</th>
                          <th>Resultado</th>
                          <th className="text-right">Min</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seguimientos.map(s => {
                          const cfg = TIPO_SEG[s.tipo]
                          return (
                            <tr key={s.id}>
                              <td className="whitespace-nowrap text-textLow text-xs">{fmtFecha(s.fecha)}</td>
                              <td>
                                {s.cuentas ? (
                                  <Link href={`/cuentas/${s.cuentas.id}`}
                                    className="flex items-center gap-1.5 hover:text-cp transition-colors group">
                                    <span className="font-mono text-[10px] text-textLow">{s.cuentas.consecutivo}</span>
                                    <span className="text-xs font-medium text-textHi group-hover:text-cp">{s.cuentas.empresa}</span>
                                  </Link>
                                ) : <span className="text-textLow text-xs">—</span>}
                              </td>
                              <td>
                                <span className="inline-flex items-center gap-1 text-xs font-medium"
                                  style={{ color: cfg.color }}>
                                  <cfg.Icon size={12} />{cfg.label}
                                </span>
                              </td>
                              <td className="text-xs text-textMid max-w-[200px] truncate"
                                title={s.descripcion ?? ''}>
                                {s.descripcion ?? '—'}
                              </td>
                              <td className="text-xs text-textLow max-w-[150px] truncate"
                                title={s.resultado ?? ''}>
                                {s.resultado ?? '—'}
                              </td>
                              <td className="text-right text-xs text-textLow">{s.duracion_min ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB: TICKETS ── */}
            {tab === 'tickets' && (
              tickets.length === 0 ? (
                <EmptyState msg="Sin tickets abiertos actualmente 🎉" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="cp-table">
                    <thead>
                      <tr>
                        <th>Cuenta</th>
                        <th>Título</th>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th className="text-right">Días abierto</th>
                        <th>Reincidente</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(t => {
                        const pr = PRIORIDAD[t.prioridad] ?? PRIORIDAD.normal
                        return (
                          <tr key={t.id}>
                            <td>
                              {t.cuentas ? (
                                <Link href={`/cuentas/${t.cuentas.id}`}
                                  className="flex items-center gap-1.5 hover:text-cp transition-colors group">
                                  <span className="font-mono text-[10px] text-textLow">{t.cuentas.consecutivo}</span>
                                  <span className="text-xs font-medium text-textHi group-hover:text-cp">{t.cuentas.empresa}</span>
                                </Link>
                              ) : <span className="text-textLow text-xs">—</span>}
                            </td>
                            <td className="text-xs font-medium text-textHi max-w-[200px] truncate"
                              title={t.titulo}>{t.titulo}</td>
                            <td><Badge label={pr.label} color={pr.color} /></td>
                            <td>
                              <Badge
                                label={t.estado === 'abierto' ? 'Abierto' : 'En Proceso'}
                                color={t.estado === 'abierto' ? '#EF4444' : '#F97316'}
                              />
                            </td>
                            <td className="text-right">
                              <span className={`text-xs font-bold ${t.dias_abierto > 7 ? 'text-rojo' : 'text-textMid'}`}>
                                {t.dias_abierto}d
                              </span>
                            </td>
                            <td>
                              {t.reincidente && (
                                <span className="flex items-center gap-1 text-naranja text-xs font-medium">
                                  <AlertTriangle size={12} /> Sí
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* ── TAB: OPORTUNIDADES ── */}
            {tab === 'oportunidades' && (
              oportunidades.length === 0 ? (
                <EmptyState msg="Sin oportunidades activas. Revisa el módulo de Upsell para identificar nuevas." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="cp-table">
                    <thead>
                      <tr>
                        <th>Cuenta</th>
                        <th>Tipo</th>
                        <th>Producto</th>
                        <th>Valor Est.</th>
                        <th>Estado</th>
                        <th>Identificada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oportunidades.map(o => {
                        const est = ESTADO_OPP[o.estado] ?? ESTADO_OPP.identificada
                        return (
                          <tr key={o.id}>
                            <td>
                              {o.cuentas ? (
                                <Link href={`/cuentas/${o.cuentas.id}`}
                                  className="flex items-center gap-1.5 hover:text-cp transition-colors group">
                                  <span className="font-mono text-[10px] text-textLow">{o.cuentas.consecutivo}</span>
                                  <span className="text-xs font-medium text-textHi group-hover:text-cp">{o.cuentas.empresa}</span>
                                </Link>
                              ) : <span className="text-textLow text-xs">—</span>}
                            </td>
                            <td>
                              <span className="inline-flex items-center gap-1 text-xs font-semibold"
                                style={{ color: o.tipo === 'upsell' ? '#A855F7' : '#0EA5E9' }}>
                                <TrendingUp size={12} />
                                {o.tipo === 'upsell' ? 'Upsell' : 'Cross-sell'}
                              </span>
                            </td>
                            <td className="text-xs text-textMid max-w-[150px] truncate"
                              title={o.producto ?? ''}>
                              {o.producto ?? '—'}
                            </td>
                            <td className="text-xs font-semibold text-textHi">
                              {o.valor_estimado ? formatMXN(o.valor_estimado) : '—'}
                            </td>
                            <td><Badge label={est.label} color={est.color} /></td>
                            <td className="text-xs text-textLow whitespace-nowrap">
                              {fmtFecha(o.fecha_identificacion)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* ── TAB: SEMÁFORO ── */}
            {tab === 'semaforo' && (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...cuentas].sort((a, b) => a.health_score - b.health_score).map(c => {
                  const semaforo = getSemaforo(c.health_score)
                  const cfg = SEMAFORO_CONFIG[semaforo]
                  return (
                    <Link key={c.id} href={`/cuentas/${c.id}`}
                      className="block rounded-xl p-3 border transition-all hover:scale-[1.01] hover:shadow-md"
                      style={{ background: `${cfg.color}08`, borderColor: `${cfg.color}30` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[10px] font-bold text-textLow">{c.consecutivo}</span>
                        <div className="flex items-center gap-1.5">
                          {(c.dias_sin_actividad > 7 || c.tickets_abiertos > 0 || !c.pagos_al_corriente) &&
                            <AlertTriangle size={10} className="text-naranja" />}
                          <div className={`w-3 h-3 rounded-full ${semaforo === 'rojo' ? 'semaforo-rojo' : ''}`}
                            style={{ background: cfg.color }} />
                        </div>
                      </div>
                      <p className="text-xs font-semibold text-textHi mb-1 leading-tight line-clamp-2">{c.empresa}</p>
                      <p className="text-xs text-textMid mb-2">{formatMXN(c.facturacion)}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.health_score}%`, background: cfg.color }} />
                        </div>
                        <span className="text-[10px] font-bold flex-shrink-0" style={{ color: cfg.color }}>
                          {c.health_score}
                        </span>
                      </div>
                      {c.ultimo_contacto && (
                        <p className="text-[9px] text-textLow mt-1.5 flex items-center gap-1">
                          <Calendar size={8} />
                          {new Date(c.ultimo_contacto).toLocaleDateString('es-MX', { day:'2-digit', month:'short' })}
                        </p>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
