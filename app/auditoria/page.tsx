'use client'
import { useState } from 'react'
import PageHeader from '@/components/PageHeader'
import {
  AlertTriangle, CheckCircle2, Clock, TrendingUp,
  User, Users, Zap, Target, Shield, ChevronDown, ChevronUp,
  FileText, BarChart3, Lightbulb, Search, AlertCircle,
} from 'lucide-react'

/* ─── Tipos ─────────────────────────────────────────────────────────── */
type Tab = 'resumen' | 'comportamiento' | 'raiz' | 'soluciones' | 'perfiles' | 'foda'

/* ─── Colores base ────────────────────────────────────────────────────── */
const RED    = '#ef4444'
const AMBER  = '#f59e0b'
const GREEN  = '#22c55e'
const BLUE   = '#3b82f6'
const INDIGO = '#6366f1'

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
      {open && <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-gray-50/50">{children}</div>}
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

/* ─── Datos del documento ─────────────────────────────────────────────── */
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'resumen',        label: 'Resumen & Hallazgos', icon: FileText },
  { id: 'comportamiento', label: 'Comportamiento',       icon: Search },
  { id: 'raiz',           label: 'Problema Raíz',        icon: AlertCircle },
  { id: 'soluciones',     label: 'Soluciones',           icon: Lightbulb },
  { id: 'perfiles',       label: 'Perfiles de Actores',  icon: Users },
  { id: 'foda',           label: 'FODA Estratégico',     icon: BarChart3 },
]

/* ─── Página principal ────────────────────────────────────────────────── */
export default function AuditoriaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('resumen')

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <PageHeader
        title="Auditoría Cuentas"
        subtitle="Análisis estratégico de cuentas complejas • Uso exclusivo Dirección General"
      />

      {/* Header de cuenta */}
      <div className="px-6 pt-4 pb-2">
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex flex-wrap items-center gap-4 shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">Arkansas State University Campus Querétaro</h2>
              <Badge color={AMBER}>CONFIDENCIAL</Badge>
              <Badge color={INDIGO}>Enterprise AAA</Badge>
              <Badge color={RED}>En Riesgo</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Integración Genjo + Callpicker Chat via WhatsApp API · Marzo – Abril 2026
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={GREEN}>RESCATABLE</Badge>
            <span className="text-xs text-gray-400">v1.0 · Abr 2026</span>
          </div>
        </div>
      </div>

      {/* KPI Pills */}
      <div className="px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatPill label="Duración de la crisis" value="35 días" color={RED} />
        <StatPill label="Pivotes técnicos" value="4" color={AMBER} />
        <StatPill label="Valor en riesgo" value="$147k" color={INDIGO} />
        <StatPill label="Estado actual" value="RESCATABLE" color={GREEN} />
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
              <p className="text-sm text-gray-700 leading-relaxed">
                El presente informe documenta el caso <strong>Arkansas State University Campus Querétaro</strong>,
                cliente de Callpicker Chat desde marzo de 2026. El caso expone fallas sistémicas en los procesos
                de preventa, activación e implementación que derivaron en una crisis operativa, desgaste del equipo
                interno y riesgo real de cancelación del contrato.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-3">
                A lo largo de 35 días, lo que fue presentado comercialmente como una conexión de &quot;10 minutos&quot;
                se transformó en una integración de arquitectura personalizada con al menos cuatro pivotes técnicos,
                una cotización de $147,000 pesos rechazada por el cliente, y una relación que —gracias a la
                intervención estratégica de la Dirección de Satisfacción al Cliente— logró estabilizarse el
                14 de abril de 2026.
              </p>
            </SectionCard>

            <SectionCard title="Hallazgos Críticos" icon={AlertTriangle} color={RED}>
              <div className="space-y-3">
                {[
                  {
                    n: '01',
                    text: 'La promesa de implementación en "10 minutos" por parte del área comercial, sin validación técnica previa, generó una deuda moral que el cliente instrumentalizó durante la parte final de la negociación.',
                  },
                  {
                    n: '02',
                    text: 'La plataforma carecía de webhooks de estado de entrega/lectura (DLR), funcionalidad estándar de la industria para WhatsApp API, descubierta únicamente hasta avanzado el proyecto.',
                  },
                  {
                    n: '03',
                    text: 'El equipo de Soporte y Activaciones trató un proyecto de integración personalizada con estándares de soporte reactivo, ampliando la fricción operativa.',
                  },
                  {
                    n: '04',
                    text: 'La ausencia de un proceso de Discovery formal es la causa raíz de todos los problemas subsecuentes documentados en este informe.',
                  },
                ].map(h => (
                  <div key={h.n} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${RED}20`, color: RED }}>
                      <span className="text-[10px] font-bold">{h.n}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{h.text}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Resultado Positivo" icon={CheckCircle2} color={GREEN}>
              <p className="text-sm text-gray-700 leading-relaxed">
                A partir de la intervención de la Dirección de Satisfacción al Cliente, el proyecto logró
                estabilizarse. El 14 de abril de 2026, Ingeniería entregó documentación técnica completa,
                se activó la funcionalidad de autoservicio de plantillas y la arquitectura fue simplificada.
                El cliente mantiene la disposición de formalizar un contrato a largo plazo e integrar el canal
                de voz (migración de Genesys) en octubre de 2026.
              </p>
            </SectionCard>

            <SectionCard title="Cronología del Caso" icon={Clock} color={BLUE}>
              <div className="space-y-0">
                {[
                  { fecha: 'Mar 11',    resp: 'José Galván (Ventas)',         evento: 'Apertura del caso. Se promete al cliente que la conexión Genjo + CP Chat tomará "10 minutos" sin validación técnica previa.', badge: RED },
                  { fecha: 'Mar 11-14', resp: 'Edith Balderas (Soporte)',     evento: 'Se trata el proyecto como una activación estándar. Falla silenciosa — el número Twilio no se activa.', badge: AMBER },
                  { fecha: 'Mar 15-25', resp: 'Soporte / Cliente',            evento: 'El número Twilio no aparece en el portafolio de Meta. Se descubre que Genjo actúa como intermediario. Sin escalamiento a Ingeniería.', badge: AMBER },
                  { fecha: 'Mar 25',    resp: 'Daniel García (Cliente)',      evento: 'Cliente comparte 6 puntos de dolor vía WhatsApp. Comienza a presionar por soluciones sin costo.', badge: RED },
                  { fecha: 'Mar 27',    resp: 'UX + Ingeniería',              evento: 'Primera sesión interna. Se descubre la verdadera complejidad: requiere integración personalizada.', badge: INDIGO },
                  { fecha: 'Mar 31',    resp: 'Ricardo / David Avilés',       evento: 'Se descarta webhook dual de Twilio. Se propone el "Orquestador" como solución. Estimado: 98 horas / $147,000 MXN.', badge: RED },
                  { fecha: 'Abr 8',     resp: 'Callpicker + Arkansas',        evento: 'Cliente rechaza el costo del Orquestador en sesión de revisión de los 6 puntos de dolor.', badge: RED },
                  { fecha: 'Abr 9-13',  resp: 'Ricardo / David',              evento: 'Pivote técnico: se abandona el Orquestador. Se adopta modelo "In-the-Wire" (Callpicker controla número Twilio/Meta).', badge: INDIGO },
                  { fecha: 'Abr 14',    resp: 'David Avilés',                 evento: 'Entrega de documentación API completa. Se activa autoservicio de plantillas en Admin Chat. Proyecto estabilizado.', badge: GREEN },
                  { fecha: 'Abr 14',    resp: 'Genjo (David Dettmer)',        evento: 'Genjo evalúa documentación entregada. Estimado de presupuesto de desarrollo pendiente de entrega al cliente.', badge: BLUE },
                ].map((e, i) => (
                  <div key={i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
                    <div className="w-16 flex-shrink-0">
                      <span className="text-[10px] font-semibold text-gray-500">{e.fecha}</span>
                    </div>
                    <div className="w-2 flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ background: e.badge }} />
                      {i < 9 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-[11px] font-semibold text-gray-500">{e.resp}</p>
                      <p className="text-sm text-gray-700 leading-relaxed mt-0.5">{e.evento}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ── COMPORTAMIENTO ─────────────────────────────────────────── */}
        {activeTab === 'comportamiento' && (
          <>
            <SectionCard title="Perfil del Cliente" icon={User} color={INDIGO}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Razón social',       value: 'Arkansas State University Campus Querétaro' },
                  { label: 'Sector',              value: 'Educación Superior – Universidad Privada' },
                  { label: 'Contacto principal',  value: 'Daniel García Rojas Reyes – Director de Sistemas / Proyecto' },
                  { label: 'Contacto técnico',    value: 'Ana Pilar Cuellar Cabello – TI' },
                  { label: 'Integrador externo',  value: 'Genjo (Court Avenue) – David Dettmer / Graham Vaughn' },
                  { label: 'Plataforma anterior', value: 'Genesys (Voz) + Twilio + Apify Cloud (WhatsApp)' },
                  { label: 'Tipo de cliente',     value: 'Enterprise AAA – Alto potencial de upsell' },
                ].map(r => (
                  <div key={r.label} className="border border-gray-100 rounded-lg px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{r.label}</p>
                    <p className="text-sm text-gray-800 mt-1">{r.value}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Necesidad de Negocio" icon={Target} color={BLUE}>
              <p className="text-sm text-gray-700 leading-relaxed">
                Arkansas State University conduce actualmente una <strong>transformación digital de su proceso
                de captación de estudiantes</strong>. Su modelo operativo combina campañas masivas de WhatsApp
                (gestionadas por el bot de IA de Genjo), seguimiento personalizado de ejecutivos humanos,
                y campañas de voz gestionadas por Genesys.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-3">
                El objetivo central al contratar Callpicker Chat fue: <strong>centralizar toda la operación
                de contactación digital en una sola plataforma</strong>, permitiendo a los agentes humanos
                retomar conversaciones iniciadas por el bot de IA, con visibilidad total y control de plantillas.
              </p>
            </SectionCard>

            <SectionCard title="Tácticas de Negociación Observadas — Daniel García" icon={AlertTriangle} color={AMBER}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-40">Táctica</th>
                      <th className="text-left py-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción observable</th>
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Impacto en Callpicker</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        tactica: 'Activación de deuda moral',
                        desc: 'Cita repetidamente "ustedes dijeron 10 minutos" para invalidar cotizaciones',
                        impacto: 'Pérdida de leverage comercial; equipo cedió en márgenes',
                      },
                      {
                        tactica: 'Triangulación de autoridad',
                        desc: 'Menciona a su jefa y Presidencia como figura intransigente ("ella no aprobará más inversión")',
                        impacto: 'Urgencia artificial; equipo técnico bajo presión innecesaria',
                      },
                      {
                        tactica: 'Promesa de zanahoria',
                        desc: 'Ofrece migración de Genesys en octubre si se resuelve WhatsApp sin costo',
                        impacto: 'Incentivó concesiones técnicas de Ingeniería y Soporte',
                      },
                    ].map(r => (
                      <tr key={r.tactica} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pr-4 font-medium text-gray-900 align-top">
                          <Badge color={AMBER}>{r.tactica}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-gray-700 align-top">{r.desc}</td>
                        <td className="py-3 text-gray-600 align-top text-xs">{r.impacto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-3 rounded-lg border" style={{ background: `${AMBER}08`, borderColor: `${AMBER}30` }}>
                <p className="text-xs font-semibold" style={{ color: AMBER }}>⚠ Señal de alarma</p>
                <p className="text-xs text-gray-600 mt-1">
                  Cuando Daniel menciona &quot;mi jefa&quot; o &quot;Presidencia&quot;, está usando presión artificial para acelerar
                  concesiones. Tratar como señal de escalación, no como urgencia real.
                </p>
              </div>
            </SectionCard>

            <SectionCard title="Potencial Estratégico del Cliente" icon={TrendingUp} color={GREEN}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg p-4 border" style={{ background: `${BLUE}05`, borderColor: `${BLUE}20` }}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Corto Plazo</p>
                  <ul className="space-y-1.5">
                    {[
                      'Contrato de 5 años de servicio WhatsApp',
                      'Autoservicio de plantillas activo',
                      'Integración Genjo + CP Chat operativa para julio',
                    ].map(i => (
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
                    {[
                      'Migración canal de Voz desde Genesys (octubre 2026)',
                      'Integración CRM y análisis de llamadas',
                      'Caso de éxito replicable en sector universitario',
                    ].map(i => (
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
                <p className="text-lg font-bold text-gray-900">Ausencia de proceso formal de Discovery</p>
                <p className="text-sm text-gray-600 mt-2">
                  para proyectos de integración con terceros y cuentas Enterprise
                </p>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mt-4">
                No se trató de un error aislado de una persona, sino de una <strong>cadena de decisiones tomadas
                bajo la lógica del &quot;soporte reactivo&quot;</strong> cuando la situación demandaba
                &quot;arquitectura proactiva&quot;. La ausencia de un Discovery técnico previo a la venta fue
                el punto de origen de todos los problemas documentados.
              </p>
            </SectionCard>

            <SectionCard title="Flujo Real — Lo que ocurrió" icon={AlertTriangle} color={RED}>
              <div className="space-y-2">
                {[
                  { fase: '1. Venta',              area: 'Ventas – José Galván',   accion: 'Promesa de "10 min" sin Discovery', resultado: 'Expectativa irreal. Deuda moral. Sin leverage comercial futuro.' },
                  { fase: '2. Activación',          area: 'Soporte – Edith Balderas', accion: 'Trata proyecto especial como bandeja QR estándar', resultado: 'Falla silenciosa 2 semanas. Cliente invisible. Sin escalación.' },
                  { fase: '3. Escalación tardía',   area: 'Soporte → Ingeniería',   accion: 'Solo escala cuando el cliente amenaza con cancelar', resultado: 'Ingeniería entra en modo "apagar incendio"' },
                  { fase: '4. Ingeniería reactiva', area: 'David Avilés / Ricardo',  accion: 'Propone Orquestador (98 hrs). Descubre falta de webhooks DLR', resultado: '$147k rechazados. 4 pivotes técnicos. Sin certeza para cliente.' },
                  { fase: '5. Cliente presiona',    area: 'Daniel García',           accion: 'Usa WhatsApp directo, emails y reuniones para presionar', resultado: '6 canales de comunicación activos. Equipo fragmentado.' },
                  { fase: '6. Estabilización UX',   area: 'José Manuel / Daniel Mtz', accion: 'Intervención como árbitro de alcances y comunicación', resultado: 'Proyecto rescatado. Arquitectura simplificada. Cliente en calma.' },
                ].map(r => (
                  <div key={r.fase} className="grid grid-cols-[100px_1fr_1fr] gap-3 py-3 border-b border-gray-100 last:border-0 text-sm">
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
                    {[
                      { metrica: 'Duración del proyecto',             real: '35 días en crisis',                    ideal: '30-45 días en orden' },
                      { metrica: 'Horas Ingeniería no facturadas',    real: '40+ horas (aprox. $6,000 USD)',         ideal: '10 horas (solo Discovery) — Ahorro: ~$5,000 USD' },
                      { metrica: 'Satisfacción estimada (1-10)',      real: '5/10 (riesgo de cancelación)',          ideal: '8/10 (cliente fidelizado)' },
                      { metrica: 'Canales de comunicación activos',   real: '6 simultáneos (Slack, WA, email...)',   ideal: '2 (canal principal + escalación UX)' },
                      { metrica: 'Estrés del equipo interno (1-10)',  real: '9/10 (burnout Edith / Toño)',           ideal: '4/10 (proceso sostenible)' },
                      { metrica: 'Replicabilidad del proceso',        real: 'No. Depende de Satisfacción al Cliente.', ideal: 'Sí. Checklist estandarizado' },
                    ].map(r => (
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
          </>
        )}

        {/* ── SOLUCIONES ─────────────────────────────────────────────── */}
        {activeTab === 'soluciones' && (
          <>
            <SectionCard title="Plan de Acción — Acciones Inmediatas (Abril 15-30)" icon={Zap} color={RED}>
              <div className="space-y-3">
                {[
                  { accion: 'Confirmar presupuesto de Genjo y validar que documentación API fue suficiente', resp: 'José Galván', criterio: 'Presupuesto recibido; ninguna duda técnica adicional de Genjo' },
                  { accion: 'Presentar propuesta formal a Daniel García: costo claro, responsabilidades de cada parte', resp: 'José Galván + José Manuel', criterio: 'Acuerdo firmado o carta de intención formalizada' },
                  { accion: 'Resolver dudas técnicas de Ana Pilar (prefijo wa_, multimedia, API de nombres)', resp: 'David Avilés + Ricardo + Soporte', criterio: 'Respuesta escrita enviada en 24 horas' },
                  { accion: 'Distribuir Checklist de Discovery a Ventas, Activaciones y Soporte', resp: 'Daniel Martínez + José Manuel', criterio: 'Sesión de lectura confirmada con cada área' },
                ].map((a, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${RED}15`, color: RED }}>
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{a.accion}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-[11px] text-gray-500"><strong>Responsable:</strong> {a.resp}</span>
                        <span className="text-[11px] text-gray-500"><strong>Criterio:</strong> {a.criterio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Mediano Plazo (Mayo – Junio 2026)" icon={Clock} color={AMBER}>
              <div className="space-y-3">
                {[
                  { accion: 'Implementación y QA de integración Genjo + CP Chat', resp: 'Ricardo + Ingeniería + UX', criterio: 'Conversación tripartita funcionando sin errores en sandbox' },
                  { accion: 'Activar autoservicio de plantillas y validar con Ana Pilar', resp: 'David Avilés + Edith', criterio: 'Cliente puede crear y usar plantillas sin soporte de Callpicker' },
                  { accion: 'Sesiones de retroalimentación con todos los actores internos', resp: 'David Avilés', criterio: 'Cada área confirma comprensión del proceso de Discovery' },
                  { accion: 'Desarrollar y publicar documentación "Proyecto Especial – Checklist Oficial"', resp: 'Daniel Martínez + José Manuel', criterio: 'Documento aprobado y en repositorio interno' },
                ].map((a, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50/30">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${AMBER}20`, color: AMBER }}>
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{a.accion}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-[11px] text-gray-500"><strong>Responsable:</strong> {a.resp}</span>
                        <span className="text-[11px] text-gray-500"><strong>Criterio:</strong> {a.criterio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Estratégico (Julio – Octubre 2026)" icon={TrendingUp} color={GREEN}>
              <div className="space-y-3">
                {[
                  { accion: 'Campañas de julio en producción y operativas para Arkansas', resp: 'UX + Soporte', criterio: 'Cero incidentes durante la campaña de inscripciones' },
                  { accion: 'Iniciar planificación formal de migración de Voz (Genesys → CP)', resp: 'Ventas + Ingeniería', criterio: 'Propuesta técnica y comercial entregada antes de septiembre' },
                  { accion: 'Desarrollar Webhooks DLR (entregado/leído) como producto core', resp: 'Ingeniería – Producto', criterio: 'Feature disponible para todos los clientes de WhatsApp API' },
                  { accion: 'Documentar Arkansas como caso de éxito Enterprise para sector universitario', resp: 'SAC + Marketing', criterio: 'Caso publicado internamente; disponible para próximas ventas' },
                ].map((a, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border border-green-100 bg-green-50/30">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${GREEN}20`, color: GREEN }}>
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{a.accion}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span className="text-[11px] text-gray-500"><strong>Responsable:</strong> {a.resp}</span>
                        <span className="text-[11px] text-gray-500"><strong>Criterio:</strong> {a.criterio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="10 Áreas de Oportunidad" icon={Lightbulb} color={INDIGO}>
              <div className="space-y-2">
                {[
                  { n: 1,  area: 'Proceso formal de Discovery para proyectos especiales', impacto: 'Elimina el "pecado original". Propuestas con soporte técnico real.', resp: 'Ventas + Ingeniería + UX' },
                  { n: 2,  area: 'Clasificación de clientes Enterprise con SLA diferenciado', impacto: 'Escala sin burnout para Edith y Toño en clientes $50k+.', resp: 'Operaciones + SAC' },
                  { n: 3,  area: 'Webhooks DLR (entrega/lectura) en la plataforma', impacto: 'Funcionalidad estándar de industria. Integración masiva sin limitaciones.', resp: 'Ingeniería (Producto Core)' },
                  { n: 4,  area: 'API de plantillas con retorno de "nombre" (no solo ID)', impacto: 'Menos fricción para integradores externos como Genjo.', resp: 'Ingeniería' },
                  { n: 5,  area: 'Soporte de plantillas multimedia (imágenes, botones, videos)', impacto: 'Ya solicitado. Sin esto, genera fricción en fase 2.', resp: 'Producto – Roadmap Q3 2026' },
                  { n: 6,  area: 'Notificaciones intrusivas para agentes (conversaciones nuevas)', impacto: 'Reduce conversaciones abandonadas. Mejora CSAT.', resp: 'Producto / UX' },
                  { n: 7,  area: 'Perfil de "Auditor" que no dispara "marcar como leído"', impacto: 'Supervisión sin afectar la operación del agente. Estándar Enterprise.', resp: 'Producto / UX' },
                  { n: 8,  area: 'Carga de campañas con validación en background', impacto: 'Elimina recargas manuales. Ahorra tiempo del equipo cliente.', resp: 'Ingeniería' },
                  { n: 9,  area: 'Mensajes de error con código original de Meta', impacto: 'Transparencia = confianza. El cliente técnico no pierde fe.', resp: 'Ingeniería' },
                  { n: 10, area: 'LOI (Carta de Intención) para compromiso de Voz en octubre', impacto: 'Formaliza la zanahoria. Convierte promesa en compromiso comercial.', resp: 'Ventas + Dirección Comercial' },
                ].map(o => (
                  <div key={o.n} className="flex gap-3 p-3 rounded-lg border border-gray-100">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${INDIGO}15`, color: INDIGO }}>
                      <span className="text-[10px] font-bold">{o.n}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{o.area}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.impacto}</p>
                      <p className="text-[11px] text-gray-400 mt-1"><strong>Área:</strong> {o.resp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
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
              {/* Daniel García */}
              <ExpandableProfile
                name="Daniel García Rojas Reyes"
                rol="Cliente (Arkansas) — Director de Sistemas / Decisor operativo y presupuestal"
                color={RED}
              >
                <div className="space-y-0.5 mt-2">
                  <ProfileRow label="Motivación primaria" value="Salvar su reputación ante su directora y la Presidencia de la Universidad" />
                  <ProfileRow label="Motivación secundaria" value="Obtener el máximo valor de Callpicker con la menor inversión adicional posible" />
                  <ProfileRow label="Estilo negociador" value="Sofisticado. Usa el 'error inicial' como palanca. Empático en la forma; inflexible en el fondo." />
                  <ProfileRow label="Táctica observada" value="Activación de deuda moral + Triangulación de autoridad + Promesa de zanahoria (Voz en octubre)" />
                  <ProfileRow label="Señal de alarma" value="Cuando menciona 'mi jefa' o 'Presidencia', está usando presión artificial para acelerar concesiones" />
                  <ProfileRow label="Fortaleza" value="Es altamente leal y tiene visión de transformación digital a largo plazo" />
                  <ProfileRow label="Recomendación" value="Tratar a Daniel como socio estratégico, no cliente transaccional. Documentar y formalizar todos los acuerdos por escrito." />
                </div>
              </ExpandableProfile>

              {/* José Galván */}
              <ExpandableProfile
                name="José Galván"
                rol="Ventas — Gestor de cuenta; primer punto de contacto comercial"
                color={AMBER}
              >
                <div className="space-y-0.5 mt-2">
                  <ProfileRow label="Motivación primaria" value="Cierre rápido de contrato; expansión de cuenta (Voz en octubre)" />
                  <ProfileRow label="Motivación secundaria" value="Evitar conflicto interno; mantener relación cordial con todas las áreas" />
                  <ProfileRow label="Estilo de trabajo" value="Optimista y carismático. Promete antes de validar. Mediaba tensiones con humor." />
                  <ProfileRow label="Error crítico" value='"Será cuestión de 10 minutos" — dicho sin consultar a Ingeniería' />
                  <ProfileRow label="Comportamiento bajo presión" value="Entra en modo mediador. Busca que todas las áreas digan 'sí' en lugar de arbitrar." />
                  <ProfileRow label="Área de mejora" value="Discovery técnico PRE-venta obligatorio para proyectos de integración. Nunca prometer tiempos sin validación." />
                  <ProfileRow label="Potencial" value="Su habilidad para relacionarse con el cliente es un activo. Necesita respaldo de proceso, no de intuición." />
                </div>
              </ExpandableProfile>

              {/* David Avilés */}
              <ExpandableProfile
                name="Alberto David Avilés Reyna"
                rol="Ingeniería — Consultor técnico y Project Manager. Responsable de la arquitectura final."
                color={INDIGO}
              >
                <div className="space-y-0.5 mt-2">
                  <ProfileRow label="Motivación primaria" value="Proteger la estabilidad de la plataforma y evitar scope creep de clientes" />
                  <ProfileRow label="Motivación secundaria" value="Mantener autonomía técnica; no ser 'esclavo de requests' de clientes" />
                  <ProfileRow label="Estilo inicial" value="Reactivo y bloqueador. Táctica: 'no es nativo de Chatwoot' para invalidar solicitudes." />
                  <ProfileRow label="Giro (14 Abr)" value="Entregó documentación técnica completa y activó autoservicio de plantillas. Pasó de bloqueador a solucionador." />
                  <ProfileRow label="Riesgo latente" value="El giro puede ser temporal (por presión de directivos), no un cambio cultural genuino" />
                  <ProfileRow label="Área de mejora" value="Ante cualquier solicitud, proponer opciones (Opción A, B, C) en lugar de cerrar con 'no es posible'" />
                  <ProfileRow label="Potencial" value="Alta capacidad técnica. Si canaliza su rigor en propuestas estructuradas, puede ser el mejor aliado de UX." />
                </div>
              </ExpandableProfile>

              {/* Edith */}
              <ExpandableProfile
                name="Edith Betzabet Balderas Padilla"
                rol="Soporte / Activaciones — Responsable de activaciones y soporte técnico directo"
                color={BLUE}
              >
                <div className="space-y-0.5 mt-2">
                  <ProfileRow label="Motivación primaria" value="Mantener control de su carga de trabajo; no ser responsable de fallos técnicos ajenos" />
                  <ProfileRow label="Motivación secundaria" value="Proteger su reputación; no ser 'maltratada' por clientes demandantes" />
                  <ProfileRow label="Estilo de trabajo" value="Operativo y burocrático. Escala solicitudes a tickets. Defensiva ante presión del cliente." />
                  <ProfileRow label="Error crítico" value="Trató una integración personalizada (Genjo + Twilio) como una activación estándar de bandeja QR" />
                  <ProfileRow label="Impacto observado" value="Cliente percibió abandono y falta de profesionalismo. Edith recibió la fricción generada por otros." />
                  <ProfileRow label="Área de mejora" value="Identificar cuándo una solicitud es 'Proyecto Especial' y escalar a UX antes de intentar resolverlo como soporte estándar." />
                  <ProfileRow label="Para Dirección" value="Edith necesita un protocolo claro de escalación para cuentas Enterprise. Su agotamiento es indicador de falla de sistema, no personal." />
                </div>
              </ExpandableProfile>

              {/* Daniel Martínez */}
              <ExpandableProfile
                name="Daniel Martínez Loyola"
                rol="Director de UX — Árbitro de alcances e intervención estratégica"
                color={GREEN}
              >
                <div className="space-y-0.5 mt-2">
                  <ProfileRow label="Motivación primaria" value="Evolucionar la plataforma a estándares Enterprise y mantener calidad de implementación" />
                  <ProfileRow label="Estilo de trabajo" value="Analítico, conciliador. Busca equilibrio entre Ingeniería y el cliente." />
                  <ProfileRow label="Aportación clave" value="Invitó a José Manuel al canal de Slack, detonando la intervención de UX que salvó la cuenta" />
                  <ProfileRow label="Área de mejora" value="La dupla UX–Ingeniería funciona cuando ambas áreas tienen el mismo peso en la decisión. Debe formalizarse." />
                  <ProfileRow label="Potencial" value="Liderar la implementación del Discovery Formal como política de empresa junto con José Manuel." />
                </div>
              </ExpandableProfile>

              {/* Toño */}
              <ExpandableProfile
                name="Antonio (Toño) del Río"
                rol="Operaciones / Customer Success — Supervisor y punto de escalación para soporte"
                color="#8b5cf6"
              >
                <div className="space-y-0.5 mt-2">
                  <ProfileRow label="Motivación primaria" value="Proteger los recursos del equipo. Evitar que clientes consuman tiempo desproporcionado." />
                  <ProfileRow label="Frase clave" value="'Tengan cuidado de no volverse esclavos de los clientes'" />
                  <ProfileRow label="Fortaleza" value="Detectó tempranamente que Arkansas consumía recursos Premium pagando plan básico." />
                  <ProfileRow label="Área de mejora" value="Su protección de recursos puede bloquear la atención diferenciada que requieren cuentas Enterprise." />
                  <ProfileRow label="Recomendación" value="Crear una política de SLA diferenciada para clientes Enterprise que Toño pueda aplicar sin arbitraje manual caso por caso." />
                </div>
              </ExpandableProfile>
            </div>
          </>
        )}

        {/* ── FODA ───────────────────────────────────────────────────── */}
        {activeTab === 'foda' && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 px-5 py-3 shadow-sm">
              <p className="text-xs text-gray-500">
                Análisis FODA integrado — perspectiva técnica, operativa y humana · Período: Marzo – Abril 2026
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
                  {[
                    'Lealtad emocional del cliente: "Nos encanta Callpicker"',
                    'Adopción operativa alta: 30+ ejecutivos, 16+ bandejas activas',
                    'Alineación UX–Ingeniería (UX como árbitro estratégico)',
                    'Documentación técnica de Agent Bots generada (Alejandro Rendón)',
                    'Capacidad para simplificar arquitectura compleja',
                    'Giro de David Avilés (14 Abr): de bloqueador a solucionador',
                  ].map(item => (
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
                  {[
                    'Migración de voz Genesys → Callpicker (octubre 2026)',
                    'Contrato a 5 años con ingresos recurrentes garantizados',
                    'Caso de éxito replicable en sector universitario',
                    'Estandarización Enterprise: los 6 puntos = roadmap de producto',
                    'Sustitución de Twilio por Gupshup (Fase 2 – mejor soporte)',
                    'Webhooks DLR como diferenciador competitivo si se desarrollan',
                  ].map(item => (
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
                  {[
                    'Deuda moral: promesa de "10 minutos" sin validación técnica',
                    'Carencia de webhooks DLR (estándar de industria no implementado)',
                    'Silos entre Ventas, Ingeniería y Soporte (descoordinación)',
                    'Dependencia de Chatwoot nativo como excusa para bloquear mejoras',
                    'Ausencia de proceso formal de Discovery para proyectos especiales',
                    'Burnout operativo en Soporte y Operaciones (Edith, Toño)',
                  ].map(item => (
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
                  {[
                    'Presupuesto de Genjo: si es alto, el cliente puede cancelar',
                    'Deadline julio: campaña universitaria; sin margen para errores',
                    'Presión de Dirección de Arkansas: "Presidencia encima de Daniel García"',
                    'Genjo podría construir solución propia y desplazar a Callpicker',
                    'Competencia: plataformas con integración WhatsApp más madura',
                    'Precedente: ceder en costos puede repetirse si no se sistematizan procesos',
                  ].map(item => (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg border" style={{ background: `${RED}06`, borderColor: `${RED}25` }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: RED }}>
                    Lo que Callpicker pierde si no actúa
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Un cliente Enterprise con potencial multianual',
                      'La migración de Genesys (canal de voz) en octubre',
                      'La credibilidad en el sector universitario',
                      'La confianza del equipo interno (burnout si se repite)',
                    ].map(i => <li key={i} className="text-xs text-gray-600 flex gap-2">
                      <span style={{ color: RED }}>✕</span>{i}
                    </li>)}
                  </ul>
                </div>
                <div className="p-4 rounded-lg border" style={{ background: `${GREEN}06`, borderColor: `${GREEN}25` }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: GREEN }}>
                    Lo que Callpicker gana si actúa
                  </p>
                  <ul className="space-y-1">
                    {[
                      'Contrato de 5 años con ingresos recurrentes',
                      'Expansión a voz, CRM e integración completa',
                      'Caso de éxito documentado para replicar',
                      'Un proceso de Discovery que evita la próxima crisis',
                    ].map(i => <li key={i} className="text-xs text-gray-600 flex gap-2">
                      <span style={{ color: GREEN }}>✓</span>{i}
                    </li>)}
                  </ul>
                </div>
              </div>
              <div className="p-4 rounded-xl text-center border-2" style={{ borderColor: `${INDIGO}40`, background: `${INDIGO}06` }}>
                <p className="text-sm font-semibold text-gray-900">
                  El proceso de Discovery debe convertirse en <strong>política de empresa</strong>, no en una
                  excepción que se aplica después del primer incendio.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Cada proyecto de integración personalizada debe iniciar con una sesión técnica validada,
                  un documento de alcance firmado y un árbitro de UX designado antes de cualquier promesa al cliente.
                </p>
              </div>
              <p className="text-xs text-gray-400 text-right mt-4">
                Dirección de Satisfacción al Cliente — Callpicker · Querétaro, Qro. — Abril 2026
              </p>
            </SectionCard>
          </>
        )}

      </div>
    </div>
  )
}
