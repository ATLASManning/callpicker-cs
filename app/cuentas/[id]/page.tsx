import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Phone, Globe, MapPin, ExternalLink, Building2,
  TrendingUp, AlertTriangle, MessageSquare, Calendar, ClipboardCheck
} from 'lucide-react'
import { findAuditoriaForConsecutivo } from '@/app/auditoria/registry'
import { getAuditCaseById }           from '@/app/auditoria/cases'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import { getCuentaById, normalizeCuentaId, getSeguimientos, getOportunidades, getTickets, getHealthHistorial, getActividadesByCuenta, getConteoAdopcion } from '@/lib/supabase'
import { getSemaforo, formatMXN, SEMAFORO_CONFIG } from '@/lib/types'
import SemaforoBadge from '@/components/SemaforoBadge'
import HealthScoreRing from '@/components/HealthScoreRing'
import AsesorBadge from '@/components/AsesorBadge'
import HealthScoreDiagnostico from '@/components/HealthScoreDiagnostico'
import SeguimientoForm from '@/components/SeguimientoForm'
import SeguimientoStatusSelect from '@/components/SeguimientoStatusSelect'
import HealthHistorialChart from '@/components/charts/HealthHistorialChart'
import AdopcionProducto from '@/components/AdopcionProducto'
import RadarCuenta from '@/components/RadarCuenta'
import CuentaInfoEditor from '@/components/CuentaInfoEditor'
import CuentaTicketsPanel from '@/components/CuentaTicketsPanel'
import CuentaFacturacionPanel from '@/components/CuentaFacturacionPanel'
import CuentaActividadesSAC from '@/components/CuentaActividadesSAC'
import CuentaCortesPanel from '@/components/CuentaCortesPanel'
import CuentaFacHeaderLive from '@/components/CuentaFacHeaderLive'
import CuentaReunionButton from '@/components/CuentaReunionButton'
import { updateKam, deleteKam } from '@/app/actions/updateKam'
import { getTicketsByCuenta } from '@/lib/cuenta-data'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

interface Props { params: { id: string } }

export default async function CuentaDetailPage({ params }: Props) {
  // Obtener la cuenta primero (función getCuentaById ahora soporta UUID o consecutivo)
  const cuentaBase = await getCuentaById(params.id)
  // Regla 30 Ago 2026: tickets abiertos siempre del dataset vivo.
  const cuenta = cuentaBase ? { ...cuentaBase, tickets_abiertos: ticketStatsCuenta(cuentaBase.cid ?? null, cuentaBase.empresa).abiertos } : cuentaBase
  if (!cuenta) notFound()

  // Usar el UUID real para las demás queries
  const cuentaUUID = cuenta.id

  const [seguimientos, oportunidades, tickets, historial, actividades, revisionesAdopcion] = await Promise.all([
    getSeguimientos(cuentaUUID),
    getOportunidades(cuentaUUID),
    getTickets(cuentaUUID),
    getHealthHistorial(cuentaUUID),
    getActividadesByCuenta(cuentaUUID),
    getConteoAdopcion(cuentaUUID),
  ])

  const h       = headers()
  const rol     = h.get('x-user-rol') ?? 'viewer'
  const canEdit = rol === 'admin' || rol === 'asesor'

  const auditoria     = findAuditoriaForConsecutivo(cuenta.consecutivo)
  const auditoriaCase = auditoria ? getAuditCaseById(auditoria.id) : null
  const zohoTickets   = getTicketsByCuenta(cuenta.cid ?? null, cuenta.empresa)

  const semaforo = getSemaforo(cuenta.health_score)
  const cfg = SEMAFORO_CONFIG[semaforo]
  const diasCliente = cuenta.activo_desde
    ? Math.floor((Date.now() - new Date(cuenta.activo_desde).getTime()) / 86400000)
    : cuenta.dias_como_cliente


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
            />
          </div>
        </div>
      </div>

      {/* Banner: perfil incompleto (cuenta sin activo_desde, contacto ni giro) */}
      {!cuenta.activo_desde && !cuenta.contacto_nombre && !cuenta.giro && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg bg-amarillo/10 border border-amarillo/30 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amarillo mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-textHi">Perfil incompleto — se requiere captura de datos</p>
            <p className="text-xs text-textMid mt-0.5">
              Solicita al cliente: <strong>fecha de inicio</strong> · <strong>contacto principal</strong> · <strong>giro de negocio</strong> · <strong>servicios contratados</strong> · <strong>MRR</strong>
            </p>
          </div>
        </div>
      )}

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* LEFT COL — Health Score + info */}
        <div className="space-y-5">

          {/* Health Score — Diagnóstico automático 6 dimensiones */}
          <HealthScoreDiagnostico
            cuenta={cuenta}
            seguimientos={seguimientos}
            ticketRows={zohoTickets.rows}
            diasCliente={diasCliente}
            auditoriaEstado={auditoriaCase?.estado ?? null}
            auditoriaNombre={auditoriaCase?.nombre ?? null}
            revisionesAdopcion={revisionesAdopcion}
          />

          {/* Info básica */}
          <div className="cp-card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-textMid uppercase tracking-wide">Información</h3>
              <CuentaInfoEditor cuenta={cuenta} canEdit={canEdit} />
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

            {/* Cliente activo desde — se muestra SIEMPRE. Cuando falta el dato
                queda visible como pendiente en vez de desaparecer del panel. */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <Calendar size={12} className="text-textLow flex-shrink-0" />
              <span className="text-textMid">Cliente activo desde:</span>
              {cuenta.activo_desde ? (
                <>
                  <span className="text-textHi font-medium">
                    {new Date(cuenta.activo_desde).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' })}
                  </span>
                  <span className="text-cpTeal">
                    ({diasCliente >= 365
                      ? `${Math.floor(diasCliente / 365)} año${Math.floor(diasCliente / 365) !== 1 ? 's' : ''}`
                      : `${diasCliente}d`})
                  </span>
                </>
              ) : (
                <span className="font-medium px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(234,179,8,0.15)', color: '#EAB308' }}>
                  Sin registrar — capturar con el cliente
                </span>
              )}
            </div>

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

          {/* Radar de Cuenta — evaluación automática de ATLAS + 12 preguntas del asesor */}
          <RadarCuenta cuentaId={String(cuenta.id)} asesor={cuenta.asesor ?? ''} canEdit={canEdit} />
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
            <SeguimientoForm cuentaId={cuenta.id} asesor={cuenta.asesor} canEdit={canEdit} />
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
                      <SeguimientoStatusSelect seguimientoId={s.id} resultado={s.resultado} canEdit={canEdit} />
                      <span className="text-[10px] text-textLow ml-auto flex-shrink-0">
                        {(() => { const d = new Date(s.fecha); return isNaN(d.getTime()) ? s.fecha : d.toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' }) })()}
                      </span>
                    </div>
                    {s.descripcion && <p className="text-xs text-textMid">{s.descripcion}</p>}
                    {s.asesor && <p className="text-[11px] text-textLow mt-0.5">{s.asesor}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notas KAM — Server Actions, build válido */}
          {(() => {
            const obs = cuenta.observaciones_kam?.trim() || null
            return (
              <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'14px 16px' }}>
                {/* Encabezado */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:'#0F172A', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                    Observaciones KAM
                  </span>
                  {obs && canEdit && (
                    <form action={deleteKam} style={{ margin:0 }}>
                      <input type="hidden" name="cuenta_id" value={cuenta.id} />
                      <button type="submit"
                        style={{ fontSize:13, color:'#DC2626', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}
                      >
                        🗑 Borrar
                      </button>
                    </form>
                  )}
                </div>

                {/* Texto actual */}
                {obs ? (
                  <p style={{ fontSize:13, color:'#0F172A', lineHeight:1.65, whiteSpace:'pre-wrap', margin:'0 0 12px' }}>{obs}</p>
                ) : (
                  <p style={{ fontSize:12, color:'#94A3B8', fontStyle:'italic', margin:'0 0 12px' }}>Sin observaciones registradas.</p>
                )}

                {/* Formulario edición — solo para quienes pueden editar */}
                {canEdit && (
                  <details style={{ marginTop:4 }}>
                    <summary style={{
                      fontSize:13, fontWeight:700, color:'#1B3FCC',
                      background:'#EFF6FF', border:'1px solid #BFDBFE',
                      borderRadius:6, padding:'7px 14px', cursor:'pointer',
                      listStyle:'none',
                    }}>
                      ✏ {obs ? 'Editar observaciones' : 'Agregar observaciones'}
                    </summary>
                    <form action={updateKam} style={{ marginTop:10 }}>
                      <input type="hidden" name="cuenta_id" value={cuenta.id} />
                      <textarea
                        name="observaciones_kam"
                        defaultValue={obs ?? ''}
                        rows={6}
                        placeholder="Estado de la relación, compromisos, riesgos, acuerdos..."
                        style={{
                          width:'100%', padding:'10px 12px', borderRadius:8,
                          border:'1px solid #CBD5E1', fontSize:13, color:'#0F172A',
                          fontFamily:'inherit', resize:'vertical', boxSizing:'border-box',
                          lineHeight:1.6,
                        }}
                      />
                      <button type="submit" style={{
                        marginTop:8, padding:'7px 18px', borderRadius:7, border:'none',
                        background:'#1B3FCC', color:'#fff',
                        fontSize:12, fontWeight:700, cursor:'pointer',
                      }}>
                        💾 Guardar
                      </button>
                    </form>
                  </details>
                )}
              </div>
            )
          })()}

          {/* Observaciones Auditoría */}
          {auditoriaCase && (() => {
            const ACOLOR: Record<string, string> = {
              en_riesgo:'#ef4444', rescatable:'#22c55e',
              activo:'#6366f1', recuperado:'#3b82f6', perdido:'#6b7280',
            }
            const ALABEL: Record<string, string> = {
              en_riesgo:'En Riesgo', rescatable:'Rescatable',
              activo:'Activo', recuperado:'Recuperado', perdido:'Perdido',
            }
            const stColor  = ACOLOR[auditoriaCase.estado] ?? '#6366f1'
            const stLabel  = ALABEL[auditoriaCase.estado] ?? auditoriaCase.estado
            const top3h    = auditoriaCase.hallazgos.slice(0, 3)
            const top2p    = auditoriaCase.plan_inmediato.slice(0, 2)
            const rec      = auditoriaCase.recomendacion_central
            const truncRec = rec.length > 220 ? rec.slice(0, 220) + '…' : rec
            return (
              <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:12, padding:'14px 16px' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:700, color:'#0F172A', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      Observaciones Auditoría
                    </span>
                    <span style={{ fontSize:9, fontWeight:700, color:stColor, background:`${stColor}18`, padding:'2px 8px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                      {stLabel}
                    </span>
                  </div>
                  <Link href={`/auditoria?caso=${auditoriaCase.id}`}
                    style={{ fontSize:11, fontWeight:700, color:'#1B3FCC', background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:6, padding:'4px 12px', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                    <ClipboardCheck size={11} /> Ver auditoría completa →
                  </Link>
                </div>

                {/* Meta */}
                <p style={{ fontSize:11, color:'#94A3B8', margin:'0 0 10px' }}>
                  {auditoriaCase.fecha_periodo} · v{auditoriaCase.version} · Auditado: {auditoriaCase.fecha_auditoria}
                </p>

                {/* KPIs */}
                {auditoriaCase.kpis.length > 0 && (
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                    {auditoriaCase.kpis.map((k, i) => (
                      <div key={i} style={{ background:`${k.color}10`, border:`1px solid ${k.color}30`, borderRadius:8, padding:'4px 10px' }}>
                        <p style={{ fontSize:9, color:k.color, fontWeight:700, textTransform:'uppercase', margin:0 }}>{k.label}</p>
                        <p style={{ fontSize:11, color:'#0F172A', fontWeight:600, margin:0 }}>{k.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Problema raíz */}
                <div style={{ marginBottom:10 }}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 3px' }}>⚡ Problema Raíz</p>
                  <p style={{ fontSize:12, color:'#0F172A', lineHeight:1.55, margin:0 }}>{auditoriaCase.problema_raiz}</p>
                </div>

                {/* Señal de alarma */}
                {auditoriaCase.senal_alarma && (
                  <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'8px 12px', marginBottom:10 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#C2410C', margin:'0 0 2px', textTransform:'uppercase' }}>⚠ Señal de Alarma</p>
                    <p style={{ fontSize:11, color:'#7C2D12', lineHeight:1.5, margin:0 }}>
                      {auditoriaCase.senal_alarma.length > 200 ? auditoriaCase.senal_alarma.slice(0, 200) + '…' : auditoriaCase.senal_alarma}
                    </p>
                  </div>
                )}

                {/* Hallazgos clave */}
                {top3h.length > 0 && (
                  <div style={{ marginBottom:10 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 5px' }}>
                      🔍 Hallazgos clave · {auditoriaCase.hallazgos.length} en total
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {top3h.map((h, i) => (
                        <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                          <span style={{ color:'#94A3B8', fontSize:13, flexShrink:0, lineHeight:1.4 }}>·</span>
                          <p style={{ fontSize:11, color:'#334155', lineHeight:1.5, margin:0 }}>
                            {h.length > 140 ? h.slice(0, 140) + '…' : h}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plan inmediato */}
                {top2p.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <p style={{ fontSize:10, fontWeight:700, color:'#64748B', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 5px' }}>
                      📋 Próximos pasos
                    </p>
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {top2p.map((pl, i) => (
                        <div key={i} style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                          <span style={{ color:'#1B3FCC', fontSize:11, flexShrink:0, fontWeight:700, lineHeight:1.5 }}>{i + 1}.</span>
                          <p style={{ fontSize:11, color:'#334155', lineHeight:1.5, margin:0 }}>
                            {pl.accion.length > 130 ? pl.accion.slice(0, 130) + '…' : pl.accion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recomendación central */}
                <div style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 12px', borderLeft:'3px solid #1B3FCC' }}>
                  <p style={{ fontSize:10, fontWeight:700, color:'#1B3FCC', margin:'0 0 3px', textTransform:'uppercase' }}>💡 Recomendación central</p>
                  <p style={{ fontSize:11, color:'#0F172A', lineHeight:1.6, margin:0 }}>{truncRec}</p>
                </div>
              </div>
            )
          })()}

          {/* Tickets Zoho Desk — por cuenta */}
          <CuentaTicketsPanel
            rows={zohoTickets.rows}
            total={zohoTickets.total}
            matchedBy={zohoTickets.matchedBy}
            cid={cuenta.cid ?? null}
            empresa={cuenta.empresa}
          />

          {/* Actividades SAC */}
          <CuentaActividadesSAC actividades={actividades} canEdit={canEdit} />

          {/* Facturación LTV — datos desde Zoho Analytics */}
          <CuentaFacturacionPanel
            cid={cuenta.cid ?? null}
            empresa={cuenta.empresa}
          />

          {/* Cortes de facturación — consumo por periodo */}
          <CuentaCortesPanel
            cid={cuenta.cid ?? null}
            empresa={cuenta.empresa}
          />
        </div>
      </div>
    </div>
  )
}
