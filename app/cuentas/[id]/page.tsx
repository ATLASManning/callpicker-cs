import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Globe, MapPin, ExternalLink, Building2,
  TrendingUp, AlertTriangle, MessageSquare, Calendar, ClipboardCheck
} from 'lucide-react'
import { findAuditoriaForConsecutivo } from '@/app/auditoria/registry'
import { getCuentaById, getSeguimientos, getOportunidades, getTickets, getHealthHistorial } from '@/lib/supabase'
import { getZohoMap, lookupZoho } from '@/lib/zoho-enrich'
import { getSemaforo, formatMXN, SEMAFORO_CONFIG } from '@/lib/types'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import AsesorBadge from '@/components/AsesorBadge'
import HealthScoreEditor from '@/components/HealthScoreEditor'
import SeguimientoForm from '@/components/SeguimientoForm'
import HealthHistorialChart from '@/components/charts/HealthHistorialChart'
import AdopcionProducto from '@/components/AdopcionProducto'
import CuentaInfoEditor from '@/components/CuentaInfoEditor'
import CuentaTicketsPanel from '@/components/CuentaTicketsPanel'
import CuentaFacturacionPanel from '@/components/CuentaFacturacionPanel'
import CuentaFacHeaderLive from '@/components/CuentaFacHeaderLive'
import CuentaReunionButton from '@/components/CuentaReunionButton'
import { getTicketsByCuenta } from '@/lib/cuenta-data'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export default async function CuentaDetailPage({ params }: Props) {
  const [cuenta, seguimientos, oportunidades, tickets, historial, zohoMap] = await Promise.all([
    getCuentaById(params.id),
    getSeguimientos(params.id),
    getOportunidades(params.id),
    getTickets(params.id),
    getHealthHistorial(params.id),
    getZohoMap(),
  ])

  if (!cuenta) notFound()

  const zoho     = lookupZoho(cuenta.empresa, zohoMap)
  const auditoria = findAuditoriaForConsecutivo(cuenta.consecutivo)
  const zohoTickets = getTicketsByCuenta(cuenta.cid ?? null, cuenta.empresa)

  const semaforo = getSemaforo(cuenta.health_score)
  const cfg = SEMAFORO_CONFIG[semaforo]
  const diasCliente = cuenta.activo_desde
    ? Math.floor((Date.now() - new Date(cuenta.activo_desde).getTime()) / 86400000)
    : cuenta.dias_como_cliente

  const blocks = [
    { label: 'Actividad (35%)',   score: cuenta.score_actividad,  color: '#3B82F6' },
    { label: 'Adopción (30%)',    score: cuenta.score_adopcion,   color: '#A855F7' },
    { label: 'Pago (20%)',        score: cuenta.score_pago,       color: '#22C55E' },
    { label: 'Relacional (15%)',  score: cuenta.score_relacional, color: '#F97316' },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-border">
        <Link href="/cuentas" className="flex items-center gap-1.5 text-xs text-textLow hover:text-textMid mb-3 w-fit">
          <ArrowLeft size={13} /> Volver a cuentas
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
              {cuenta.empresa.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-textHi">{cuenta.empresa}</h1>
                <span className="font-mono text-xs text-cp bg-cp/10 px-2 py-0.5 rounded">{cuenta.consecutivo}</span>
                <SemaforoBadge semaforo={semaforo} score={cuenta.health_score} />
              </div>
              <div className="flex items-center gap-4 mt-1">
                <AsesorBadge asesor={cuenta.asesor} size="md" />
                {cuenta.giro && <span className="text-xs text-textLow">{cuenta.giro}</span>}
                {cuenta.grupo_empresarial && (
                  <span className="text-xs text-cpTeal">Grupo: {cuenta.grupo_empresarial}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {auditoria && (
              <Link href={`/auditoria?caso=${auditoria.id}`}
                className="cp-btn text-xs font-semibold text-white"
                style={{ background: '#1B3FCC' }}
                title={`Ver auditoría: ${auditoria.nombre}`}>
                <ClipboardCheck size={13} /> Auditoría
              </Link>
            )}
            <CuentaReunionButton empresa={cuenta.empresa} />
            {cuenta.zoho_link && (
              <a href={cuenta.zoho_link} target="_blank" rel="noopener noreferrer"
                className="cp-btn cp-btn-ghost text-xs">
                <ExternalLink size={13} /> Zoho CRM
              </a>
            )}
            <CuentaFacHeaderLive
              cid={cuenta.cid ?? null}
              empresa={cuenta.empresa}
              fallback={cuenta.facturacion}
              initialFactura={zoho?.factura_mensual ?? null}
              initialMrr={zoho?.mrr ?? null}
            />
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* LEFT COL — Health Score + info */}
        <div className="space-y-5">

          {/* Health Score Card */}
          <div className="cp-card">
            <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide mb-4">Health Score</h3>
            <div className="flex items-center gap-5">
              <HealthScoreRing score={cuenta.health_score} size={90} strokeWidth={9} />
              <div className="flex-1 space-y-3">
                {blocks.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-textMid">{b.label}</span>
                      <span className="font-semibold text-textHi">{b.score}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${b.score}%`, background: b.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas */}
            <div className="mt-4 space-y-2">
              {cuenta.dias_sin_actividad > 7 && (
                <div className="flex items-center gap-2 text-xs bg-rojo/10 text-rojo p-2 rounded-lg border border-rojo/20">
                  <AlertTriangle size={13} /> {cuenta.dias_sin_actividad} días sin actividad en plataforma
                </div>
              )}
              {!cuenta.pagos_al_corriente && (
                <div className="flex items-center gap-2 text-xs bg-naranja/10 text-naranja p-2 rounded-lg border border-naranja/20">
                  <AlertTriangle size={13} /> Pago pendiente — contactar hoy
                </div>
              )}
              {cuenta.tickets_abiertos > 0 && (
                <div className="flex items-center gap-2 text-xs bg-amarillo/10 text-amarillo p-2 rounded-lg border border-amarillo/20">
                  <AlertTriangle size={13} /> {cuenta.tickets_abiertos} ticket{cuenta.tickets_abiertos > 1 ? 's' : ''} abierto{cuenta.tickets_abiertos > 1 ? 's' : ''}
                </div>
              )}
              {cuenta.llamadas_cambio_pct < -30 && (
                <div className="flex items-center gap-2 text-xs bg-rojo/10 text-rojo p-2 rounded-lg border border-rojo/20">
                  <TrendingUp size={13} className="rotate-180" /> Caída de llamadas: {cuenta.llamadas_cambio_pct.toFixed(0)}% vs mes anterior
                </div>
              )}
            </div>

            {/* Editor de scores */}
            <HealthScoreEditor cuenta={cuenta} />
          </div>

          {/* Info básica */}
          <div className="cp-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Información</h3>
              <CuentaInfoEditor cuenta={cuenta} />
            </div>
            {/* Servicios — lista dinámica primero, fallback al campo legacy */}
            {(cuenta.servicios_json && cuenta.servicios_json.length > 0) ? (
              <div>
                <p className="text-[10px] text-textLow mb-1.5">Servicios contratados</p>
                <div className="flex flex-wrap gap-1.5">
                  {cuenta.servicios_json.map((sv, i) => (
                    <div key={i} className="bg-cp/10 border border-cp/20 rounded-lg px-2 py-1">
                      <p className="text-xs text-cp font-medium">{sv.nombre}</p>
                      {sv.descripcion && <p className="text-[10px] text-textLow">{sv.descripcion}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : cuenta.servicio ? (
              <div><p className="text-[10px] text-textLow mb-0.5">Servicio</p>
                <p className="text-xs text-textHi">{cuenta.servicio}</p></div>
            ) : null}

            {cuenta.activo_desde && (
              <div className="flex items-center gap-2 text-xs">
                <Calendar size={12} className="text-textLow" />
                <span className="text-textMid">Cliente desde:</span>
                <span className="text-textHi font-medium">
                  {new Date(cuenta.activo_desde).toLocaleDateString('es-MX', { year:'numeric', month:'long' })}
                </span>
                <span className="text-cpTeal">({diasCliente}d)</span>
              </div>
            )}

            {/* Contactos — lista dinámica primero, fallback al campo legacy */}
            {(cuenta.contactos_json && cuenta.contactos_json.length > 0) ? (
              <div className="space-y-2">
                <p className="text-[10px] text-textLow">Contactos ({cuenta.contactos_json.length})</p>
                {cuenta.contactos_json.map((ct, i) => (
                  <div key={i} className="bg-surface rounded-lg px-3 py-2 border border-border">
                    <p className="text-xs font-medium text-textHi">{ct.nombre}</p>
                    {ct.cargo && <p className="text-[11px] text-textLow">{ct.cargo}</p>}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {ct.tel && (
                        <div className="flex items-center gap-1">
                          <Phone size={10} className="text-textLow" />
                          <span className="text-[11px] text-textMid">{ct.tel}</span>
                        </div>
                      )}
                      {ct.email && (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-textLow">{ct.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : cuenta.contacto_nombre ? (
              <div><p className="text-[10px] text-textLow mb-0.5">Contacto</p>
                <p className="text-xs text-textHi">{cuenta.contacto_nombre}</p>
                {cuenta.contacto_cargo && <p className="text-[11px] text-textLow">{cuenta.contacto_cargo}</p>}
                {cuenta.contacto_tel && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Phone size={11} className="text-textLow" />
                    <span className="text-xs text-textMid">{cuenta.contacto_tel}</span>
                  </div>
                )}
              </div>
            ) : null}

            {cuenta.pagina_web && (
              <a href={cuenta.pagina_web} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-cp hover:text-cpTeal transition-colors">
                <Globe size={12} /> {cuenta.pagina_web.replace(/^https?:\/\//, '')}
              </a>
            )}
            {cuenta.direccion_fiscal && (
              <div className="flex items-start gap-1.5 text-xs">
                <MapPin size={12} className="text-textLow mt-0.5 flex-shrink-0" />
                <span className="text-textMid">{cuenta.direccion_fiscal}</span>
              </div>
            )}
            {cuenta.tamano_empresa && (
              <div className="flex items-center gap-1.5 text-xs">
                <Building2 size={12} className="text-textLow" />
                <span className="text-textMid">{cuenta.tamano_empresa}</span>
                {cuenta.total_empleados && <span className="text-textLow">· {cuenta.total_empleados} empleados</span>}
              </div>
            )}
          </div>

          {/* Adopción de Producto — interactiva con historial */}
          <AdopcionProducto cuentaId={String(cuenta.id)} asesor={cuenta.asesor ?? ''} />
        </div>

        {/* CENTER + RIGHT — Seguimientos + Oportunidades + Historial */}
        <div className="xl:col-span-2 space-y-5">

          {/* Historial Health Score */}
          {historial.length > 0 && (
            <div className="cp-card">
              <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide mb-3">Evolución Health Score</h3>
              <HealthHistorialChart data={historial} />
            </div>
          )}

          {/* Oportunidades */}
          {(cuenta.upsell_producto || cuenta.crossell_producto || oportunidades.length > 0) && (
            <div className="cp-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Oportunidades</h3>
                <span className="text-xs text-cpTeal">Upsell / Cross-sell</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {cuenta.upsell_producto && (
                  <div className="bg-cpTeal/5 border border-cpTeal/20 rounded-lg p-3">
                    <p className="text-[10px] text-textLow mb-1 uppercase tracking-wide">↑ Upsell</p>
                    <p className="text-sm font-semibold text-cpTeal">{cuenta.upsell_producto}</p>
                    {cuenta.valor_upsell_estimado && (
                      <p className="text-xs text-textMid mt-1">Est. {formatMXN(cuenta.valor_upsell_estimado)}</p>
                    )}
                  </div>
                )}
                {cuenta.crossell_producto && (
                  <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
                    <p className="text-[10px] text-textLow mb-1 uppercase tracking-wide">⇄ Cross-sell</p>
                    <p className="text-sm font-semibold text-purple-400">{cuenta.crossell_producto}</p>
                  </div>
                )}
              </div>
              {oportunidades.length > 0 && (
                <div className="mt-3 space-y-2">
                  {oportunidades.map(o => (
                    <div key={o.id} className="flex items-center justify-between text-xs border-t border-border pt-2">
                      <span className="text-textMid">{o.producto}</span>
                      <div className="flex items-center gap-2">
                        {o.valor_estimado && <span className="text-textHi font-medium">{formatMXN(o.valor_estimado)}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                          ${o.estado === 'ganada' ? 'bg-verde/10 text-verde' :
                            o.estado === 'en_proceso' ? 'bg-cp/10 text-cp' :
                            'bg-surface text-textLow'}`}>
                          {o.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tickets abiertos */}
          {tickets.length > 0 && (
            <div className="cp-card">
              <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide mb-3">Tickets</h3>
              <div className="space-y-2">
                {tickets.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-surface rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium text-textHi">{t.titulo}</p>
                      <p className="text-xs text-textLow">{t.tipo} · {t.dias_abierto}d abierto</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.reincidente && <span className="text-[10px] text-rojo border border-rojo/30 px-1.5 py-0.5 rounded">Reincidente</span>}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                        ${t.prioridad === 'critica' ? 'bg-rojo/10 text-rojo' :
                          t.prioridad === 'alta' ? 'bg-naranja/10 text-naranja' :
                          'bg-amarillo/10 text-amarillo'}`}>
                        {t.prioridad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seguimientos */}
          <div className="cp-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide flex items-center gap-2">
                <MessageSquare size={13} /> Seguimiento KAM
              </h3>
              <span className="text-xs text-textLow">{seguimientos.length} registros</span>
            </div>
            <SeguimientoForm cuentaId={cuenta.id} asesor={cuenta.asesor} />
            <div className="mt-4 space-y-3">
              {seguimientos.length === 0 ? (
                <p className="text-xs text-textLow text-center py-6">Sin actividad registrada</p>
              ) : seguimientos.map(s => (
                <div key={s.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cp/10 flex items-center justify-center text-cp">
                    <MessageSquare size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-textHi capitalize">{s.tipo}</span>
                      {s.resultado && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium
                          ${s.resultado === 'exitoso' ? 'bg-verde/10 text-verde' :
                            s.resultado === 'sin_respuesta' ? 'bg-rojo/10 text-rojo' :
                            'bg-surface text-textLow'}`}>
                          {s.resultado}
                        </span>
                      )}
                      <span className="text-[10px] text-textLow ml-auto flex-shrink-0">
                        {new Date(s.fecha).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                    </div>
                    {s.descripcion && <p className="text-xs text-textMid">{s.descripcion}</p>}
                    {s.asesor && <p className="text-[11px] text-textLow mt-0.5">{s.asesor}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas KAM */}
          {cuenta.observaciones_kam && (
            <div className="cp-card">
              <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide mb-2">Observaciones KAM</h3>
              <p className="text-sm text-textMid whitespace-pre-wrap">{cuenta.observaciones_kam}</p>
            </div>
          )}

          {/* Tickets Zoho Desk — por cuenta */}
          <CuentaTicketsPanel
            rows={zohoTickets.rows}
            total={zohoTickets.total}
            matchedBy={zohoTickets.matchedBy}
            cid={cuenta.cid ?? null}
            empresa={cuenta.empresa}
          />

          {/* Facturación LTV — datos desde Zoho Analytics */}
          <CuentaFacturacionPanel
            cid={cuenta.cid ?? null}
            empresa={cuenta.empresa}
          />
        </div>
      </div>
    </div>
  )
}
