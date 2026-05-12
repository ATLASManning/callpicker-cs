'use client'
import { useState } from 'react'
import type { AuditoriaCase } from './types'
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp,
  User, Users, Zap, Target, Shield, ChevronDown, ChevronUp,
  FileText, BarChart3, Lightbulb, Search, AlertCircle,
} from 'lucide-react'

/* ─── Tipos locales ──────────────────────────────────────────────────── */
type Tab = 'resumen' | 'comportamiento' | 'raiz' | 'soluciones' | 'perfiles' | 'foda'

/* ─── Colores base ───────────────────────────────────────────────────── */
const RED    = '#ef4444'
const AMBER  = '#f59e0b'
const GREEN  = '#22c55e'
const BLUE   = '#3b82f6'
const INDIGO = '#6366f1'

/* ─── Mapa de colores por estado ─────────────────────────────────────── */
const ESTADO_COLOR: Record<string, string> = {
  rescatable: '#22c55e',
  en_riesgo:  '#ef4444',
  recuperado: '#3b82f6',
  perdido:    '#6b7280',
  activo:     '#6366f1',
}

const TIPO_COLOR: Record<string, string> = {
  problema: RED,
  pivote:   INDIGO,
  ok:       GREEN,
  neutral:  BLUE,
}

/* ─── Componentes auxiliares ─────────────────────────────────────────── */
function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
      {children}
    </span>
  )
}

function SectionCard({ title, icon: Icon, color, children }:
  { title: string; icon: React.ElementType; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex items-center gap-3 border-b border-gray-100"
        style={{ background: `${color}08` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl px-5 py-4 border"
      style={{ background: `${color}08`, borderColor: `${color}30` }}>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
      <span className="text-xs text-gray-500 mt-1 text-center">{label}</span>
    </div>
  )
}

function ExpandableProfile({ name, rol, color, children }:
  { name: string; rol: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}20` }}>
          <User size={16} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <p className="text-xs text-gray-500">{rol}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">
          {children}
        </div>
      )}
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 w-36 flex-shrink-0 font-medium pt-0.5">{label}</span>
      <span className="text-xs text-gray-800 flex-1">{value}</span>
    </div>
  )
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'resumen',        label: 'Resumen & Hallazgos', icon: FileText },
  { id: 'comportamiento', label: 'Comportamiento',       icon: Search },
  { id: 'raiz',           label: 'Problema Raíz',        icon: AlertCircle },
  { id: 'soluciones',     label: 'Soluciones',           icon: Lightbulb },
  { id: 'perfiles',       label: 'Perfiles de Actores',  icon: Users },
  { id: 'foda',           label: 'FODA Estratégico',     icon: BarChart3 },
]

/* ─── Componente principal ───────────────────────────────────────────── */
export default function AuditoriaDetail({ caso }: { caso: AuditoriaCase }) {
  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  const estadoColor = ESTADO_COLOR[caso.estado] ?? INDIGO

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header de cuenta */}
      <div className="px-6 pt-4 pb-2">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-wrap items-center gap-4 shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">{caso.nombre}</h2>
              <Badge color={AMBER}>{caso.clasificacion}</Badge>
              <Badge color={INDIGO}>{caso.tipo_cliente}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {caso.descripcion_contexto} · {caso.fecha_periodo}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={estadoColor}>{caso.estado.toUpperCase()}</Badge>
            <span className="text-xs text-gray-400">v{caso.version} · {caso.fecha_auditoria}</span>
          </div>
        </div>
      </div>

      {/* KPI Pills */}
      <div className="px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {caso.kpis.map(k => (
          <StatPill key={k.label} label={k.label} value={k.value} color={k.color} />
        ))}
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto shadow-sm">
          {TABS.map(t => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap"
                style={active
                  ? { background: '#1B3FCC', color: '#fff' }
                  : { color: '#6b7280' }
                }
              >
                <t.icon size={13} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido de tabs */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

        {/* ── RESUMEN & HALLAZGOS ─────────────────────────────────────── */}
        {activeTab === 'resumen' && (
          <>
            <SectionCard title="Resumen Ejecutivo" icon={FileText} color={INDIGO}>
              {caso.resumen_ejecutivo.split('\n\n').map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mt-3 first:mt-0"
                  dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
              ))}
            </SectionCard>

            <SectionCard title="Hallazgos Críticos" icon={AlertTriangle} color={RED}>
              <div className="space-y-3">
                {caso.hallazgos.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${RED}20`, color: RED }}>
                      <span className="text-[10px] font-bold">{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Resultado Positivo" icon={CheckCircle2} color={GREEN}>
              <p className="text-sm text-gray-700 leading-relaxed">{caso.resultado_positivo}</p>
            </SectionCard>

            <SectionCard title="Cronología del Caso" icon={Clock} color={BLUE}>
              <div className="space-y-0">
                {caso.cronologia.map((e, i) => {
                  const dotColor = TIPO_COLOR[e.tipo] ?? BLUE
                  return (
                    <div key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                      <div className="w-16 flex-shrink-0">
                        <span className="text-[10px] font-semibold text-gray-500">{e.fecha}</span>
                      </div>
                      <div className="w-2 flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: dotColor }} />
                        {i < caso.cronologia.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 min-w-0 pb-1">
                        <p className="text-[11px] font-semibold text-gray-500">{e.responsable}</p>
                        <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{e.evento}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          </>
        )}

        {/* ── COMPORTAMIENTO ─────────────────────────────────────────── */}
        {activeTab === 'comportamiento' && (
          <>
            <SectionCard title="Perfil del Cliente" icon={User} color={INDIGO}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {caso.perfil_campos.map(r => (
                  <div key={r.label} className="border border-gray-100 rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{r.label}</p>
                    <p className="text-sm text-gray-800 mt-1">{r.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Necesidad de Negocio" icon={Target} color={BLUE}>
              {caso.necesidad_negocio.split('\n\n').map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed mt-3 first:mt-0"
                  dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
              ))}
            </SectionCard>

            {caso.tacticas.length > 0 && (
              <SectionCard title="Tácticas de Negociación Observadas" icon={AlertTriangle} color={AMBER}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Táctica</th>
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción observable</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Impacto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caso.tacticas.map(r => (
                        <tr key={r.nombre} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-gray-900 align-top">
                            <Badge color={AMBER}>{r.nombre}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-gray-700 align-top">{r.descripcion}</td>
                          <td className="py-3 text-gray-600 align-top text-xs">{r.impacto}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {caso.senal_alarma && (
                  <div className="mt-4 p-3 rounded-lg border" style={{ background: `${AMBER}08`, borderColor: `${AMBER}30` }}>
                    <p className="text-xs font-semibold" style={{ color: AMBER }}>⚠ Señal de alarma</p>
                    <p className="text-xs text-gray-600 mt-1">{caso.senal_alarma}</p>
                  </div>
                )}
              </SectionCard>
            )}

            <SectionCard title="Potencial Estratégico del Cliente" icon={TrendingUp} color={GREEN}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-4 border" style={{ background: `${BLUE}05`, borderColor: `${BLUE}20` }}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Corto Plazo</p>
                  <ul className="space-y-1.5">
                    {caso.potencial_corto.map(i => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={13} style={{ color: GREEN, flexShrink: 0 }} className="mt-0.5" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg p-4 border" style={{ background: `${GREEN}05`, borderColor: `${GREEN}20` }}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Largo Plazo</p>
                  <ul className="space-y-1.5">
                    {caso.potencial_largo.map(i => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <TrendingUp size={13} style={{ color: GREEN, flexShrink: 0 }} className="mt-0.5" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionCard>
          </>
        )}

        {/* ── PROBLEMA RAÍZ ──────────────────────────────────────────── */}
        {activeTab === 'raiz' && (
          <>
            <SectionCard title="Problema Raíz Central" icon={AlertCircle} color={RED}>
              <div className="p-4 rounded-xl text-center border-2" style={{ borderColor: `${RED}40`, background: `${RED}06` }}>
                <p className="text-lg font-bold text-gray-900">{caso.problema_raiz}</p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mt-4">{caso.problema_raiz_detalle}</p>
            </SectionCard>

            {caso.flujo_real.length > 0 && (
              <SectionCard title="Flujo Real — Lo que ocurrió" icon={AlertTriangle} color={RED}>
                <div className="space-y-2">
                  {caso.flujo_real.map(r => (
                    <div key={r.fase} className="grid grid-cols-[110px_1fr_1fr] gap-3 py-3 border-b border-gray-100 last:border-0 text-sm">
                      <div>
                        <Badge color={RED}>{r.fase}</Badge>
                        <p className="text-[10px] text-gray-500 mt-1">{r.area}</p>
                      </div>
                      <p className="text-gray-700">{r.accion}</p>
                      <p className="text-gray-500 text-xs">{r.resultado}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {caso.comparativo.length > 0 && (
              <SectionCard title="Comparativo de Impacto: Real vs. Ideal" icon={BarChart3} color={INDIGO}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Métrica</th>
                        <th className="text-left py-2 pr-4 text-xs font-semibold uppercase tracking-wide" style={{ color: RED }}>Proceso Real</th>
                        <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: GREEN }}>Proceso Ideal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caso.comparativo.map(r => (
                        <tr key={r.metrica} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-gray-900 align-top text-xs">{r.metrica}</td>
                          <td className="py-3 pr-4 align-top text-xs" style={{ color: RED }}>{r.real}</td>
                          <td className="py-3 align-top text-xs" style={{ color: GREEN }}>{r.ideal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* ── SOLUCIONES ─────────────────────────────────────────────── */}
        {activeTab === 'soluciones' && (
          <>
            {caso.plan_inmediato.length > 0 && (
              <SectionCard title="Plan Inmediato" icon={Zap} color={RED}>
                <div className="space-y-3">
                  {caso.plan_inmediato.map((a, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${RED}15`, color: RED }}>
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{a.accion}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-[11px] text-gray-500"><strong>Responsable:</strong> {a.responsable}</span>
                          <span className="text-[11px] text-gray-500"><strong>Criterio:</strong> {a.criterio}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {caso.plan_mediano.length > 0 && (
              <SectionCard title="Mediano Plazo" icon={Clock} color={AMBER}>
                <div className="space-y-3">
                  {caso.plan_mediano.map((a, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/30">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${AMBER}20`, color: AMBER }}>
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{a.accion}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-[11px] text-gray-500"><strong>Responsable:</strong> {a.responsable}</span>
                          <span className="text-[11px] text-gray-500"><strong>Criterio:</strong> {a.criterio}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {caso.plan_estrategico.length > 0 && (
              <SectionCard title="Estratégico (Largo Plazo)" icon={TrendingUp} color={GREEN}>
                <div className="space-y-3">
                  {caso.plan_estrategico.map((a, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg border border-green-100 bg-green-50/30">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${GREEN}20`, color: GREEN }}>
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{a.accion}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-[11px] text-gray-500"><strong>Responsable:</strong> {a.responsable}</span>
                          <span className="text-[11px] text-gray-500"><strong>Criterio:</strong> {a.criterio}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {caso.areas_oportunidad.length > 0 && (
              <SectionCard title="Áreas de Oportunidad" icon={Lightbulb} color={INDIGO}>
                <div className="space-y-2">
                  {caso.areas_oportunidad.map((o, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg border border-gray-100">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${INDIGO}15`, color: INDIGO }}>
                        <span className="text-[10px] font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{o.area}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{o.impacto}</p>
                        <p className="text-[11px] text-gray-400 mt-1"><strong>Área:</strong> {o.responsable}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </>
        )}

        {/* ── PERFILES ───────────────────────────────────────────────── */}
        {activeTab === 'perfiles' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <p className="text-sm text-gray-600 leading-relaxed">
                Este análisis documenta el <strong>factor humano</strong> de los actores clave, para entender
                no solo qué falló, sino <em>por qué las personas actuaron como lo hicieron</em> y cómo
                alinear comportamientos futuros.
              </p>
            </div>

            <div className="space-y-3">
              {caso.perfiles.map(p => (
                <ExpandableProfile key={p.nombre} name={p.nombre} rol={p.rol} color={p.color}>
                  <div className="space-y-0.5 mt-2">
                    {p.campos.map(c => (
                      <ProfileRow key={c.label} label={c.label} value={c.value} />
                    ))}
                  </div>
                </ExpandableProfile>
              ))}
            </div>
          </>
        )}

        {/* ── FODA ───────────────────────────────────────────────────── */}
        {activeTab === 'foda' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
              <p className="text-xs text-gray-500">
                Análisis FODA integrado — perspectiva técnica, operativa y humana · {caso.fecha_periodo}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Fortalezas */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: `${GREEN}12` }}>
                  <Shield size={15} style={{ color: GREEN }} />
                  <h3 className="font-semibold text-sm" style={{ color: GREEN }}>Fortalezas (Internas)</h3>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {caso.foda.fortalezas.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-lg leading-none mt-[-2px]" style={{ color: GREEN }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Oportunidades */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: `${BLUE}12` }}>
                  <TrendingUp size={15} style={{ color: BLUE }} />
                  <h3 className="font-semibold text-sm" style={{ color: BLUE }}>Oportunidades (Externas)</h3>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {caso.foda.oportunidades.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-lg leading-none mt-[-2px]" style={{ color: BLUE }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Debilidades */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: `${AMBER}12` }}>
                  <AlertTriangle size={15} style={{ color: AMBER }} />
                  <h3 className="font-semibold text-sm" style={{ color: AMBER }}>Debilidades (Internas)</h3>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {caso.foda.debilidades.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-lg leading-none mt-[-2px]" style={{ color: AMBER }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Amenazas */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 flex items-center gap-2" style={{ background: `${RED}12` }}>
                  <AlertCircle size={15} style={{ color: RED }} />
                  <h3 className="font-semibold text-sm" style={{ color: RED }}>Amenazas (Externas)</h3>
                </div>
                <ul className="px-5 py-4 space-y-2">
                  {caso.foda.amenazas.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-lg leading-none mt-[-2px]" style={{ color: RED }}>•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Conclusión */}
            <SectionCard title="Conclusión y Recomendación Central" icon={CheckCircle2} color={INDIGO}>
              {caso.conclusion && (
                <p className="text-sm text-gray-700 leading-relaxed mb-4">{caso.conclusion}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {caso.pierde.length > 0 && (
                  <div className="p-4 rounded-lg border" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: RED }}>
                      Lo que se pierde si no actúa
                    </p>
                    <ul className="space-y-1">
                      {caso.pierde.map(i => (
                        <li key={i} className="text-xs text-gray-600 flex gap-2">
                          <span style={{ color: RED }}>✕</span>{i}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {caso.gana.length > 0 && (
                  <div className="p-4 rounded-lg border" style={{ background: `${GREEN}06`, borderColor: `${GREEN}25` }}>
                    <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: GREEN }}>
                      Lo que se gana si actúa
                    </p>
                    <ul className="space-y-1">
                      {caso.gana.map(i => (
                        <li key={i} className="text-xs text-gray-600 flex gap-2">
                          <span style={{ color: GREEN }}>✓</span>{i}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {caso.recomendacion_central && (
                <div className="p-4 rounded-xl text-center border-2" style={{ borderColor: `${INDIGO}40`, background: `${INDIGO}06` }}>
                  <p className="text-sm font-semibold text-gray-900">{caso.recomendacion_central}</p>
                </div>
              )}
            </SectionCard>
          </>
        )}

      </div>
    </div>
  )
}
