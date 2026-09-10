'use client'

import { useMemo, useState } from 'react'
import {
  MessageCircle, Users, Inbox, TrendingUp, TrendingDown, Minus,
  ChevronRight, Search, AlertTriangle, ExternalLink, Ban, CircleSlash,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { CHAT_CLIENTES, CHAT_RESUMEN, type SemaforoChat, type ChatCliente } from './chat-data'

/* ── Semáforo de salud de uso ───────────────────────────────────────────────
   No replica `uso_rango` de la hoja de origen: ese campo divide mensajes entre
   agentes contratados y produce porcentajes que no son consumo de plan. Aquí
   el color responde "¿esta cuenta le está sacando valor al chat?".            */
const SEMAFORO: Record<SemaforoChat, { label: string; color: string; desc: string }> = {
  saludable:    { label: 'Saludable',    color: '#22C55E', desc: 'Actividad sostenida, sin señales de caída' },
  intenso:      { label: 'Uso intenso',  color: '#3B82F6', desc: 'Volumen alto o rebasa la bolsa contratada — revisar plan' },
  bajo:         { label: 'Uso bajo',     color: '#F97316', desc: 'Poca actividad, inboxes contratados muertos o tendencia a la baja' },
  sin_uso:      { label: 'Sin uso',      color: '#EF4444', desc: 'Cero mensajes en el periodo completo' },
  sin_medicion: { label: 'Sin medición', color: '#64748B', desc: 'La recolección del corte falló — la cifra no es confiable' },
  suspendida:   { label: 'Suspendida',   color: '#334155', desc: 'Cuenta suspendida en el periodo' },
}

const ORDEN: SemaforoChat[] = ['sin_uso', 'bajo', 'intenso', 'saludable', 'sin_medicion', 'suspendida']

const CANAL: Record<string, string> = {
  API: 'WhatsApp API', WA: 'WhatsApp', FB: 'Facebook / Instagram',
  MAIL: 'Correo', WEB: 'Web', SMS: 'SMS',
}

const RECONCILIACION: Record<string, { label: string; color: string }> = {
  OK:   { label: 'Conciliado',        color: '#22C55E' },
  ERR:  { label: 'Error de medición', color: '#F97316' },
  LIM:  { label: 'Límite de inboxes', color: '#64748B' },
  SUSP: { label: 'Suspendido',        color: '#334155' },
}

const n = (v: number | null | undefined) => (v ?? 0).toLocaleString('es-MX')
const fecha = (s: string) => {
  const [a, m, d] = s.split('-')
  const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${d} ${MES[Number(m) - 1]} ${a}`
}

type Orden = 'mensajes' | 'cid' | 'nombre' | 'semaforo'

export default function CallpickerChatPage() {
  const [filtro, setFiltro]   = useState<SemaforoChat | null>(null)
  const [busca, setBusca]     = useState('')
  const [orden, setOrden]     = useState<Orden>('mensajes')
  const [abierto, setAbierto] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let l = CHAT_CLIENTES.filter(c => {
      if (filtro && c.semaforo !== filtro) return false
      if (!q) return true
      return c.nombre.toLowerCase().includes(q)
        || c.cid.includes(q)
        || c.cuentas.some(x => x.cuenta.toLowerCase().includes(q))
        || c.inboxes.some(i => i.nombre.toLowerCase().includes(q))
    })
    l = [...l].sort((a, b) => {
      if (orden === 'cid')      return Number(a.cid) - Number(b.cid)
      if (orden === 'nombre')   return a.nombre.localeCompare(b.nombre, 'es')
      if (orden === 'semaforo') return ORDEN.indexOf(a.semaforo) - ORDEN.indexOf(b.semaforo) || b.mensajes - a.mensajes
      return b.mensajes - a.mensajes
    })
    return l
  }, [filtro, busca, orden])

  const visibles = useMemo(() => ({
    mensajes: filtrados.reduce((s, c) => s + c.mensajes, 0),
    conversaciones: filtrados.reduce((s, c) => s + c.conversaciones, 0),
  }), [filtrados])

  return (
    <div className="pb-16">
      <PageHeader
        title="Callpicker Chat"
        subtitle={`Consumo y salud de uso por cliente · Cortes del ${fecha(CHAT_RESUMEN.periodoMin)} al ${fecha(CHAT_RESUMEN.periodoMax)} · ${CHAT_RESUMEN.clientes} clientes · ${CHAT_RESUMEN.cuentas} cuentas Chatwoot · ${n(CHAT_RESUMEN.inboxes)} inboxes`}
        actions={
          <a
            href={CHAT_RESUMEN.fuente}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{ background: 'rgba(13,24,41,0.06)', color: '#1B3FCC' }}
          >
            <ExternalLink size={14} /> Hoja de origen
          </a>
        }
      />

      <div className="px-6 space-y-5 cp-sobre-fondo">

        {/* ── Tarjetas ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Clientes con chat" value={CHAT_RESUMEN.clientes}
            sub={`${CHAT_RESUMEN.cuentas} cuentas Chatwoot`} icon={Users} variant="primary" />
          <StatCard label="Mensajes del periodo" value={n(CHAT_RESUMEN.mensajes)}
            sub={`${n(CHAT_RESUMEN.conversaciones)} conversaciones`} icon={MessageCircle} variant="teal" />
          <StatCard label="Clientes sin uso" value={CHAT_RESUMEN.clientesSinUso}
            sub="cero mensajes en su corte" icon={CircleSlash} variant="danger" />
          <StatCard label="Inboxes contratados muertos" value={CHAT_RESUMEN.contratadosMuertos}
            sub="capacidad pagada sin un solo mensaje" icon={Ban} variant="warn" />
          <StatCard label="Inboxes sin contratar con tráfico" value={CHAT_RESUMEN.sinContratoConTrafico}
            sub="uso que no está en el contrato" icon={Inbox} variant="success" />
        </div>

        {/* ── Aviso de calidad del dato ─────────────────────────────────── */}
        <div className="cp-card border-l-2" style={{ borderLeftColor: '#F97316' }}>
          <div className="flex gap-3">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" style={{ color: '#F97316' }} />
            <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              <span className="font-semibold" style={{ color: '#fff' }}>Cómo leer este tablero.</span>{' '}
              El semáforo mide <span className="font-semibold" style={{ color: '#fff' }}>salud de uso</span>, no consumo de plan.
              La hoja de origen trae un campo <code style={{ color: '#93C5FD' }}>uso_rango</code> que divide mensajes entre agentes
              contratados y produce valores de hasta 433,369% — no se usa aquí. Solo{' '}
              <span className="font-semibold" style={{ color: '#fff' }}>{CHAT_RESUMEN.conBolsa} de {CHAT_RESUMEN.cuentas}</span>{' '}
              cuentas tienen bolsa de mensajes real; en ésas sí se muestra el % de consumo.
              {' '}<span className="font-semibold" style={{ color: '#fff' }}>{CHAT_RESUMEN.clientesConError}</span>{' '}
              clientes traen la lectura del corte rota (<code style={{ color: '#93C5FD' }}>operational_error</code>): salen en gris
              y se muestra su corte anterior como referencia, en vez de reportar una caída que no ocurrió.
            </div>
          </div>
        </div>

        {/* ── Semáforo: distribución y filtro ───────────────────────────── */}
        <div className="cp-card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wide font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Semáforo de salud de uso
            </p>
            {filtro && (
              <button onClick={() => setFiltro(null)}
                className="text-xs px-2 py-1 rounded-md font-medium"
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
                Quitar filtro
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {ORDEN.map(k => {
              const cfg = SEMAFORO[k]
              const cant = (CHAT_RESUMEN.distribucion as Record<string, number>)[k] ?? 0
              const on = filtro === k
              return (
                <button
                  key={k}
                  onClick={() => setFiltro(on ? null : k)}
                  title={cfg.desc}
                  className="rounded-xl px-3 py-3 text-center transition-all"
                  style={{
                    background: on ? cfg.color : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${on ? cfg.color : 'rgba(255,255,255,0.10)'}`,
                    boxShadow: on ? `0 0 0 3px ${cfg.color}33` : 'none',
                  }}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: on ? '#fff' : cfg.color }} />
                    <span className="text-[11px] font-semibold" style={{ color: '#fff' }}>{cfg.label}</span>
                  </div>
                  <p className="text-xl font-bold" style={{ color: '#fff' }}>{cant}</p>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {filtro ? SEMAFORO[filtro].desc : 'Pasa el cursor sobre cada estado para ver su regla, o haz clic para filtrar la tabla.'}
          </p>
        </div>

        {/* ── Buscador y orden ──────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#64748B' }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por CID, cliente, cuenta Chatwoot o inbox…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#fff', border: '1px solid #CBD5E1', color: '#0F172A' }}
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: '#fff', border: '1px solid #CBD5E1' }}>
            {([['mensajes', 'Mensajes'], ['cid', 'CID'], ['nombre', 'Cliente'], ['semaforo', 'Semáforo']] as [Orden, string][]).map(([k, l]) => (
              <button key={k} onClick={() => setOrden(k)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: orden === k ? '#1B3FCC' : 'transparent', color: orden === k ? '#fff' : '#475569' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabla ─────────────────────────────────────────────────────── */}
        <div className="cp-card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 980 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                  {['', 'CID', 'Cliente', 'Nivel', 'Semáforo', 'Mensajes', 'Conversaciones',
                    'Inboxes contratados', 'Inboxes con actividad', 'Tendencia', 'Corte'].map((h, i) => (
                    <th key={i}
                      className="px-3 py-3 text-[11px] uppercase tracking-wide font-semibold text-center whitespace-nowrap"
                      style={{ color: 'rgba(255,255,255,0.55)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => (
                  <FilaCliente key={c.cid} c={c}
                    abierto={abierto === c.cid}
                    onToggle={() => setAbierto(abierto === c.cid ? null : c.cid)} />
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-3 py-10 text-center text-sm"
                      style={{ color: 'rgba(255,255,255,0.45)' }}>
                      Ningún cliente coincide con el filtro.
                    </td>
                  </tr>
                )}
              </tbody>
              {filtrados.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
                    <td />
                    <td colSpan={4} className="px-3 py-3 text-xs font-semibold text-center"
                      style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {filtrados.length} de {CHAT_RESUMEN.clientes} clientes
                    </td>
                    <td className="px-3 py-3 text-center font-bold" style={{ color: '#fff' }}>{n(visibles.mensajes)}</td>
                    <td className="px-3 py-3 text-center font-bold" style={{ color: '#fff' }}>{n(visibles.conversaciones)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <p className="text-[11px] leading-relaxed px-1" style={{ color: '#64748B' }}>
          Fuente: hojas <span className="font-semibold">Chat Usage Monthly</span> (resumen) y{' '}
          <span className="font-semibold">Chat Inbox Usage Monthly</span> (granularidad) del archivo
          «CallPickerChat Usage — Customer Health». Cada cliente tiene su propio día de corte, por eso los
          periodos no coinciden entre cuentas. Actualización semanal, viernes por la tarde.
        </p>
      </div>
    </div>
  )
}

/* ── Fila de cliente, desplegable ───────────────────────────────────────── */
function FilaCliente({ c, abierto, onToggle }: { c: ChatCliente; abierto: boolean; onToggle: () => void }) {
  const cfg = SEMAFORO[c.semaforo]
  const cuenta = c.cuentas[0]
  const tend = c.cuentas.find(x => x.tendencia === 'sube' || x.tendencia === 'baja')?.tendencia
    ?? cuenta?.tendencia ?? null

  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer transition-colors"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <td className="px-2 py-3 text-center">
          <ChevronRight size={15}
            style={{
              color: 'rgba(255,255,255,0.5)',
              transform: abierto ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s',
            }} />
        </td>
        <td className="px-3 py-3 text-center font-mono text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{c.cid}</td>
        <td className="px-3 py-3 text-center font-semibold" style={{ color: '#fff' }}>
          {c.nombre}
          {c.cuentas.length > 1 && (
            <span className="ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}>
              {c.cuentas.length} cuentas
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-center">
          {c.tier
            ? <span className="text-[11px] font-bold px-2 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>{c.tier}</span>
            : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
        </td>
        <td className="px-3 py-3 text-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}55` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
            {cfg.label}
          </span>
        </td>
        <td className="px-3 py-3 text-center font-bold" style={{ color: '#fff' }}>{n(c.mensajes)}</td>
        <td className="px-3 py-3 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>{n(c.conversaciones)}</td>
        <td className="px-3 py-3 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {c.inboxesContratados || <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
          {c.contratadosMuertos > 0 && (
            <span className="block text-[10px] mt-0.5" style={{ color: '#F97316' }}>
              {c.contratadosMuertos} sin uso
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>
          {c.inboxes.filter(i => i.mensajes > 0).length}
          {c.sinContratoConTrafico > 0 && (
            <span className="block text-[10px] mt-0.5" style={{ color: '#22C55E' }}>
              {c.sinContratoConTrafico} sin contratar
            </span>
          )}
        </td>
        <td className="px-3 py-3 text-center">
          {tend === 'sube' ? <TrendingUp size={16} className="inline" style={{ color: '#22C55E' }} />
            : tend === 'baja' ? <TrendingDown size={16} className="inline" style={{ color: '#EF4444' }} />
            : tend === 'plana' ? <Minus size={16} className="inline" style={{ color: '#94A3B8' }} />
            : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
        </td>
        <td className="px-3 py-3 text-center text-xs whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {fecha(c.periodo)}
        </td>
      </tr>

      {abierto && (
        <tr style={{ background: 'rgba(0,0,0,0.22)' }}>
          <td colSpan={11} className="px-5 py-5">
            <Detalle c={c} />
          </td>
        </tr>
      )}
    </>
  )
}

/* ── Detalle desplegado: cuentas Chatwoot y sus inboxes ─────────────────── */
function Detalle({ c }: { c: ChatCliente }) {
  const conTrafico = c.inboxes.filter(i => i.mensajes > 0)
  const muertos    = c.inboxes.filter(i => i.contratado && i.mensajes === 0)

  return (
    <div className="space-y-5">

      {/* Cuentas Chatwoot */}
      <div>
        <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {c.cuentas.length === 1 ? 'Cuenta Chatwoot' : `Cuentas Chatwoot (${c.cuentas.length})`}
        </p>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {c.cuentas.map(cta => {
            const cfg = SEMAFORO[cta.semaforo]
            return (
              <div key={cta.cuenta} className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${cfg.color}44` }}>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <p className="font-semibold text-sm" style={{ color: '#fff' }}>{cta.cuenta}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
                    style={{ background: `${cfg.color}22`, color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center mb-2.5">
                  <Dato label="Mensajes"       valor={n(cta.mensajes)} />
                  <Dato label="Del cliente"    valor={n(cta.mensajesCliente)} />
                  <Dato label="De salida"      valor={n(cta.mensajesSalida)} />
                  <Dato label="Conversaciones" valor={n(cta.conversaciones)} />
                  <Dato label="Msj./conv."     valor={cta.promedioPorConv != null ? cta.promedioPorConv.toFixed(1) : '—'} />
                  <Dato label="Agentes"        valor={cta.agentes != null ? String(cta.agentes) : '—'} />
                </div>

                {cta.bolsaMensajes != null && (
                  <div className="rounded-lg px-2.5 py-2 mb-2.5" style={{ background: 'rgba(59,130,246,0.14)' }}>
                    <p className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: '#93C5FD' }}>
                      Bolsa contratada
                    </p>
                    <p className="text-xs" style={{ color: '#fff' }}>
                      {n(cta.mensajes)} de {n(cta.bolsaMensajes)} mensajes
                      {cta.pctBolsa != null && (
                        <span className="font-bold ml-1.5"
                          style={{ color: cta.pctBolsa > 100 ? '#F97316' : '#22C55E' }}>
                          {cta.pctBolsa.toFixed(1)}%
                        </span>
                      )}
                    </p>
                  </div>
                )}

                <ul className="space-y-1">
                  {cta.motivos.map((m, i) => (
                    <li key={i} className="text-[11px] leading-snug flex gap-1.5"
                      style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <span style={{ color: cfg.color }}>·</span>{m}
                    </li>
                  ))}
                </ul>

                {cta.semaforo === 'sin_medicion' && cta.respaldoMensajes != null && (
                  <p className="text-[11px] mt-2 pt-2" style={{ color: '#93C5FD', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    Corte anterior ({fecha(cta.respaldoPeriodo!)}): {n(cta.respaldoMensajes)} mensajes.
                  </p>
                )}

                <p className="text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Corte día {cta.corte ?? '—'} · periodo desde {fecha(cta.periodo)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Inboxes con tráfico */}
      {conTrafico.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Inboxes con actividad ({conTrafico.length})
          </p>
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <table className="w-full text-xs" style={{ minWidth: 720 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {['Inbox', 'Canal', 'Contratado', 'Conversaciones', 'Mensajes', '% de la cuenta', 'Medición'].map((h, i) => (
                    <th key={i} className="px-3 py-2 text-[10px] uppercase tracking-wide font-semibold text-center whitespace-nowrap"
                      style={{ color: 'rgba(255,255,255,0.5)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conTrafico.map((i, k) => (
                  <tr key={`${i.id}-${k}`} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td className="px-3 py-2 text-center" style={{ color: '#fff' }}>{i.nombre}</td>
                    <td className="px-3 py-2 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {i.canal ? (CANAL[i.canal] ?? i.canal) : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {i.contratado
                        ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                            style={{ background: 'rgba(34,197,94,0.18)', color: '#22C55E' }}>Sí</span>
                        : <span className="text-[10px] font-semibold px-2 py-0.5 rounded"
                            style={{ background: 'rgba(249,115,22,0.18)', color: '#F97316' }}>No</span>}
                    </td>
                    <td className="px-3 py-2 text-center" style={{ color: 'rgba(255,255,255,0.75)' }}>{n(i.conversaciones)}</td>
                    <td className="px-3 py-2 text-center font-semibold" style={{ color: '#fff' }}>{n(i.mensajes)}</td>
                    <td className="px-3 py-2 text-center" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {i.pctCuenta != null ? `${i.pctCuenta.toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {i.reconciliacion && RECONCILIACION[i.reconciliacion]
                        ? <span className="text-[10px] font-medium"
                            style={{ color: RECONCILIACION[i.reconciliacion].color }}>
                            {RECONCILIACION[i.reconciliacion].label}
                          </span>
                        : <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inboxes contratados sin uso */}
      {muertos.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide font-semibold mb-2" style={{ color: '#F97316' }}>
            Inboxes contratados sin un solo mensaje ({muertos.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {muertos.map((i, k) => (
              <span key={`${i.id}-${k}`} className="text-[11px] px-2.5 py-1 rounded-lg"
                style={{ background: 'rgba(249,115,22,0.13)', color: '#FDBA74', border: '1px solid rgba(249,115,22,0.3)' }}>
                {i.nombre}
                {i.canal && <span className="opacity-60"> · {CANAL[i.canal] ?? i.canal}</span>}
              </span>
            ))}
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Capacidad pagada que no se está usando — candidata a activación o a ajuste de plan.
          </p>
        </div>
      )}

      {c.inboxes.length === 0 && (
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Sin desglose de inboxes en el corte
          {c.inboxesRelleno > 0 && ` — la medición se hizo por respaldo de cuenta, no inbox por inbox`}.
        </p>
      )}
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-lg py-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <p className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
      <p className="text-sm font-bold" style={{ color: '#fff' }}>{valor}</p>
    </div>
  )
}
