'use client'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'
import {
  MessageCircle, Users, AlertTriangle, Upload, Search, ShieldCheck,
  TrendingUp, Link2, Check, Clock, Archive, Info, Loader2, X, Eye,
} from 'lucide-react'

/* ─── Paleta (alineada al Dashboard) ─────────────────────────────── */
const PANEL  = '#FFFFFF'
const BORDER = '#E2E8F0'
const TX     = '#0F172A'
const TX_MID = '#475569'
const TX_LOW = '#94A3B8'
const ACCENT = '#0057FF'
const VERDE  = '#25D366'   // verde WhatsApp, solo como acento de marca
const ROJO   = '#DC2626'

const SEV_COLOR: Record<string, string> = {
  critica: '#DC2626', alta: '#EA580C', media: '#F59E0B', info: '#0EA5E9',
}
const SEV_LABEL: Record<string, string> = {
  critica: 'Crítica', alta: 'Alta', media: 'Media', info: 'Informativa',
}

/* ─── Tipos ──────────────────────────────────────────────────────── */
interface Cuenta {
  id: string; consecutivo?: string; cid?: string; empresa: string; asesor?: string
  estado?: string; health_score?: number; facturacion?: number; score_adopcion?: number
}
interface Conversacion {
  id: string; nombre: string; tipo: string; cuenta_id: string | null
  total_mensajes: number; ultimo_mensaje: string | null; primer_mensaje: string | null
  riesgo: number; participantes: string[] | null; origen: string
  cuenta: Cuenta | null; esTop: boolean
  senalesPendientes: number; senalesCriticas: number
}
interface Senal {
  id: string; conversacion_id: string; tipo: string; severidad: string
  titulo: string; evidencia: string; autor: string; enviado_en: string
  accion: string; atendida: boolean
  wa_conversaciones?: { nombre: string; tipo: string }
}
interface Mensaje {
  id: string; autor: string; texto: string; enviado_en: string; es_nuestro: boolean
}

type Tab = 'bandeja' | 'senales' | 'conectar'

const fmtFecha = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}
const fmtHora = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

/* ═══════════════════════════════════════════════════════════════════ */
export default function WhatsAppPage() {
  const [tab, setTab]         = useState<Tab>('bandeja')
  const [convs, setConvs]     = useState<Conversacion[]>([])
  const [senales, setSenales] = useState<Senal[]>([])
  const [stats, setStats]     = useState({ total: 0, grupos: 0, top: 0, conRiesgo: 0 })
  const [loading, setLoading] = useState(true)
  const [migracion, setMigracion] = useState(false)
  const [sel, setSel]         = useState<string | null>(null)
  const [q, setQ]             = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const [b, s] = await Promise.all([
        fetch('/api/whatsapp').then(r => r.json()),
        fetch('/api/whatsapp?modo=senales').then(r => r.json()),
      ])
      if (b.migracionPendiente || s.migracionPendiente) setMigracion(true)
      setConvs(b.conversaciones ?? [])
      setStats({ total: b.total ?? 0, grupos: b.grupos ?? 0, top: b.top ?? 0, conRiesgo: b.conRiesgo ?? 0 })
      setSenales(s.senales ?? [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return convs
    return convs.filter(c =>
      c.nombre.toLowerCase().includes(t) ||
      (c.cuenta?.empresa ?? '').toLowerCase().includes(t) ||
      (c.cuenta?.consecutivo ?? '').toLowerCase().includes(t))
  }, [convs, q])

  const criticas = senales.filter(s => s.severidad === 'critica').length

  return (
    <div style={{ minHeight: '100vh', background: '#EFF6FF' }}>
      <PageHeader
        title="WhatsApp"
        subtitle="Conversaciones con clientes · análisis de señales y alertas de cuenta"
        actions={
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
            color: '#166534', background: '#DCFCE7', border: '1px solid #BBF7D0',
            padding: '6px 12px', borderRadius: 99,
          }}>
            <Eye size={13} /> Solo observación
          </span>
        }
      />

      <div style={{ padding: '0 24px 32px' }}>
        {migracion && <AvisoMigracion />}

        {/* ── KPIs ────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 18 }}>
          <Kpi icon={MessageCircle} label="Conversaciones"     value={stats.total}     color={ACCENT} />
          <Kpi icon={Users}         label="Grupos"             value={stats.grupos}    color="#7C3AED" />
          <Kpi icon={TrendingUp}    label="Cuentas TOP"        value={stats.top}       color={VERDE} />
          <Kpi icon={AlertTriangle} label="Señales críticas"   value={criticas}        color={ROJO} />
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <TabBtn activo={tab === 'bandeja'} onClick={() => setTab('bandeja')} icon={MessageCircle}
                  label={`Conversaciones (${stats.total})`} />
          <TabBtn activo={tab === 'senales'} onClick={() => setTab('senales')} icon={AlertTriangle}
                  label={`Señales (${senales.length})`} badge={criticas || undefined} />
          <TabBtn activo={tab === 'conectar'} onClick={() => setTab('conectar')} icon={Upload}
                  label="Vincular WhatsApp" />
        </div>

        {loading ? <Cargando /> : (
          <>
            {tab === 'bandeja'  && <Bandeja convs={filtradas} q={q} setQ={setQ} sel={sel} setSel={setSel} onCambio={cargar} />}
            {tab === 'senales'  && <PanelSenales senales={senales} onAtender={cargar} />}
            {tab === 'conectar' && <PanelConectar onImportado={() => { cargar(); setTab('bandeja') }} />}
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Piezas ─────────────────────────────────────────────────────── */

function Kpi({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <Icon size={16} color={color} />
      </div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color }}>{value}</p>
    </div>
  )
}

function TabBtn({ activo, onClick, icon: Icon, label, badge }: {
  activo: boolean; onClick: () => void; icon: React.ElementType; label: string; badge?: number
}) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10,
      border: `1px solid ${activo ? ACCENT : BORDER}`, background: activo ? ACCENT : PANEL,
      color: activo ? '#fff' : TX_MID, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    }}>
      <Icon size={14} /> {label}
      {badge ? (
        <span style={{ background: activo ? 'rgba(255,255,255,0.25)' : '#FEE2E2', color: activo ? '#fff' : ROJO,
          fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 99 }}>{badge}</span>
      ) : null}
    </button>
  )
}

function Cargando() {
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
      <Loader2 size={22} color={TX_LOW} />
      <p style={{ marginTop: 10, fontSize: 13, color: TX_LOW }}>Cargando conversaciones…</p>
    </div>
  )
}

function AvisoMigracion() {
  return (
    <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 7 }}>
        <AlertTriangle size={15} /> Falta correr la migración de base de datos
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#92400E', lineHeight: 1.6 }}>
        Las tablas del módulo aún no existen. Abre el archivo <code style={{ background: '#FDE68A', padding: '1px 6px', borderRadius: 4 }}>scripts/migracion-whatsapp.sql</code> del
        proyecto, <strong>copia todo su contenido</strong> y pégalo en Supabase → SQL Editor → Run.
        (Pegar solo el nombre del archivo da un error de sintaxis.) Incluye los triggers que hacen los mensajes inmutables.
      </p>
    </div>
  )
}

/* ─── Bandeja ────────────────────────────────────────────────────── */
function Bandeja({ convs, q, setQ, sel, setSel, onCambio }: {
  convs: Conversacion[]; q: string; setQ: (v: string) => void
  sel: string | null; setSel: (v: string | null) => void; onCambio: () => void
}) {
  if (!convs.length && !q) return <VacioBandeja />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,380px) 1fr', gap: 16, alignItems: 'start' }}>
      {/* Lista */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: 12, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color={TX_LOW} style={{ position: 'absolute', left: 11, top: 10 }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar conversación, empresa o consecutivo…"
              style={{ width: '100%', padding: '8px 10px 8px 32px', borderRadius: 8, border: `1px solid ${BORDER}`,
                fontSize: 12.5, boxSizing: 'border-box', color: TX, background: '#F8FAFC' }} />
          </div>
        </div>
        <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
          {convs.map(c => <FilaConv key={c.id} c={c} activo={sel === c.id} onClick={() => setSel(c.id)} />)}
          {!convs.length && (
            <p style={{ padding: 24, textAlign: 'center', fontSize: 12.5, color: TX_LOW }}>Sin coincidencias.</p>
          )}
        </div>
      </div>

      {/* Detalle */}
      {sel
        ? <DetalleConv id={sel} onCerrar={() => setSel(null)} onCambio={onCambio} />
        : <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 48, textAlign: 'center' }}>
            <MessageCircle size={26} color={TX_LOW} />
            <p style={{ marginTop: 10, fontSize: 13.5, color: TX_MID, fontWeight: 600 }}>Selecciona una conversación</p>
            <p style={{ fontSize: 12, color: TX_LOW }}>Verás el hilo completo, sus señales detectadas y la cuenta vinculada.</p>
          </div>}
    </div>
  )
}

function FilaConv({ c, activo, onClick }: { c: Conversacion; activo: boolean; onClick: () => void }) {
  const riesgoCol = c.senalesCriticas > 0 ? ROJO : c.riesgo >= 20 ? '#EA580C' : VERDE
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', cursor: 'pointer',
      borderBottom: `1px solid ${BORDER}`, borderLeft: `3px solid ${activo ? ACCENT : 'transparent'}`,
      background: activo ? '#EFF6FF' : PANEL,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
        {c.tipo === 'grupo' && <Users size={12} color="#7C3AED" />}
        <span style={{ fontSize: 13, fontWeight: 700, color: TX }}>{c.nombre}</span>
        {c.esTop && <Badge texto="TOP" color={VERDE} />}
        {c.senalesCriticas > 0 && <Badge texto={`${c.senalesCriticas} crítica${c.senalesCriticas > 1 ? 's' : ''}`} color={ROJO} />}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11, color: TX_LOW, flexWrap: 'wrap' }}>
        {c.cuenta
          ? <span style={{ fontWeight: 700, color: ACCENT }}>{c.cuenta.consecutivo} · {c.cuenta.empresa}</span>
          : <span style={{ color: '#EA580C', fontWeight: 600 }}>Sin cuenta vinculada</span>}
        <span>· {c.total_mensajes} msj</span>
        <span>· {fmtFecha(c.ultimo_mensaje)}</span>
      </div>
      <div style={{ marginTop: 6, height: 3, borderRadius: 99, background: '#F1F5F9' }}>
        <div style={{ width: `${Math.min(100, c.riesgo)}%`, height: '100%', borderRadius: 99, background: riesgoCol }} />
      </div>
    </button>
  )
}

function Badge({ texto, color }: { texto: string; color: string }) {
  return (
    <span style={{ fontSize: 9.5, fontWeight: 800, color, background: `${color}18`,
      border: `1px solid ${color}35`, padding: '1px 7px', borderRadius: 99, textTransform: 'uppercase' }}>{texto}</span>
  )
}

/* ─── Detalle de conversación ────────────────────────────────────── */
function DetalleConv({ id, onCerrar, onCambio }: { id: string; onCerrar: () => void; onCambio: () => void }) {
  const [data, setData] = useState<{ conversacion: Conversacion; cuenta: Cuenta | null; mensajes: Mensaje[]; senales: Senal[] } | null>(null)
  const [cargando, setCargando] = useState(true)
  const [cuentas, setCuentas] = useState<Cuenta[]>([])
  const [vinculando, setVinculando] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const d = await fetch(`/api/whatsapp/${id}`).then(r => r.json())
      setData(d)
    } finally { setCargando(false) }
  }, [id])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { finRef.current?.scrollIntoView() }, [data])

  async function abrirVinculacion() {
    setVinculando(true)
    if (!cuentas.length) {
      const r = await fetch('/api/cuentas').then(r => r.json()).catch(() => null)
      const lista = Array.isArray(r) ? r : (r?.cuentas ?? [])
      setCuentas(lista)
    }
  }

  async function vincular(cuentaId: string | null) {
    await fetch(`/api/whatsapp/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'vincular', cuentaId }),
    })
    setVinculando(false); cargar(); onCambio()
  }

  if (cargando || !data) return <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 40, textAlign: 'center' }}><Loader2 size={20} color={TX_LOW} /></div>

  const { conversacion: c, cuenta, mensajes, senales } = data
  const pendientes = senales.filter(s => !s.atendida)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Cabecera */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {c.tipo === 'grupo' && <Users size={15} color="#7C3AED" />}
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: TX }}>{c.nombre}</h3>
              {c.tipo === 'grupo' && <Badge texto="Grupo" color="#7C3AED" />}
            </div>
            <p style={{ margin: '5px 0 0', fontSize: 12, color: TX_LOW }}>
              {c.total_mensajes} mensajes · {fmtFecha(c.primer_mensaje)} → {fmtFecha(c.ultimo_mensaje)}
              {c.participantes?.length ? ` · ${c.participantes.length} participantes` : ''}
            </p>
          </div>
          <button onClick={onCerrar} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: TX_LOW }}>
            <X size={17} />
          </button>
        </div>

        {/* Cuenta vinculada */}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
          {cuenta ? (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href={`/cuentas/${cuenta.id}`} style={{ fontSize: 13, fontWeight: 800, color: ACCENT, textDecoration: 'none' }}>
                {cuenta.consecutivo} · {cuenta.empresa} ↗
              </a>
              <Dato label="Asesor"   valor={cuenta.asesor ?? '—'} />
              <Dato label="Estado"   valor={cuenta.estado ?? '—'} />
              <Dato label="HS"       valor={String(cuenta.health_score ?? '—')} />
              <Dato label="MRR"      valor={cuenta.facturacion != null ? `$${Number(cuenta.facturacion).toLocaleString('es-MX')}` : '—'} />
              <button onClick={abrirVinculacion} style={btnGhost}>Cambiar</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: '#9A3412', fontWeight: 600 }}>
                Sin cuenta vinculada — las señales no llegarán a la ficha del cliente.
              </span>
              <button onClick={abrirVinculacion} style={btnPrimario}><Link2 size={12} /> Vincular cuenta</button>
            </div>
          )}
          {vinculando && <SelectorCuenta cuentas={cuentas} onElegir={vincular} onCancelar={() => setVinculando(false)} />}
        </div>
      </div>

      {/* Señales */}
      {pendientes.length > 0 && (
        <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Señales detectadas ({pendientes.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendientes.map(s => <TarjetaSenal key={s.id} s={s} convId={id} onAtender={() => { cargar(); onCambio() }} />)}
          </div>
        </div>
      )}

      {/* Hilo — solo lectura */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${BORDER}`, background: '#F8FAFC',
          display: 'flex', alignItems: 'center', gap: 7 }}>
          <Eye size={13} color={TX_LOW} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: TX_MID }}>
            Hilo de conversación · solo lectura, los mensajes no se pueden editar ni eliminar
          </span>
        </div>
        <div style={{ maxHeight: '52vh', overflowY: 'auto', padding: 16, background: '#F8FAFC' }}>
          {mensajes.map(m => <Burbuja key={m.id} m={m} />)}
          <div ref={finRef} />
        </div>
      </div>
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <span style={{ fontSize: 11.5, color: TX_MID }}>
      <span style={{ color: TX_LOW }}>{label}:</span> <strong>{valor}</strong>
    </span>
  )
}

function Burbuja({ m }: { m: Mensaje }) {
  const mio = m.es_nuestro
  return (
    <div style={{ display: 'flex', justifyContent: mio ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
      <div style={{
        maxWidth: '76%', padding: '8px 12px', borderRadius: 12,
        background: mio ? '#DCF8C6' : PANEL,
        border: `1px solid ${mio ? '#BBF7D0' : BORDER}`,
      }}>
        {!mio && <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 800, color: '#7C3AED' }}>{m.autor}</p>}
        <p style={{ margin: 0, fontSize: 13, color: TX, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.texto}</p>
        <p style={{ margin: '4px 0 0', fontSize: 10, color: TX_LOW, textAlign: 'right' }}>{fmtHora(m.enviado_en)}</p>
      </div>
    </div>
  )
}

function TarjetaSenal({ s, convId, onAtender }: { s: Senal; convId: string; onAtender: () => void }) {
  const [guardando, setGuardando] = useState(false)
  const col = SEV_COLOR[s.severidad] ?? TX_LOW

  async function atender() {
    setGuardando(true)
    await fetch(`/api/whatsapp/${convId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'atender_senal', senalId: s.id }),
    })
    onAtender()
  }

  return (
    <div style={{ border: `1px solid ${col}35`, background: `${col}08`, borderRadius: 10, padding: '11px 13px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <Badge texto={SEV_LABEL[s.severidad] ?? s.severidad} color={col} />
        <span style={{ fontSize: 12.5, fontWeight: 800, color: TX }}>{s.titulo}</span>
        <span style={{ fontSize: 11, color: TX_LOW }}>· {s.autor} · {fmtHora(s.enviado_en)}</span>
      </div>
      <p style={{ margin: '0 0 7px', fontSize: 12.5, color: TX_MID, fontStyle: 'italic',
        borderLeft: `3px solid ${col}55`, paddingLeft: 9, lineHeight: 1.55 }}>«{s.evidencia}»</p>
      <p style={{ margin: '0 0 9px', fontSize: 12, color: TX_MID, lineHeight: 1.55 }}>
        <strong>Acción:</strong> {s.accion}
      </p>
      <button onClick={atender} disabled={guardando} style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7,
        border: `1px solid ${BORDER}`, background: PANEL, color: TX_MID, fontSize: 11.5,
        fontWeight: 700, cursor: guardando ? 'wait' : 'pointer',
      }}><Check size={12} /> Marcar atendida</button>
    </div>
  )
}

function SelectorCuenta({ cuentas, onElegir, onCancelar }: {
  cuentas: Cuenta[]; onElegir: (id: string | null) => void; onCancelar: () => void
}) {
  const [q, setQ] = useState('')
  const lista = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = t ? cuentas.filter(c => c.empresa?.toLowerCase().includes(t) || c.consecutivo?.toLowerCase().includes(t)) : cuentas
    return base.slice(0, 40)
  }, [cuentas, q])

  return (
    <div style={{ marginTop: 10, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: 9, borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 8 }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar cuenta por empresa o consecutivo…"
          style={{ flex: 1, padding: '7px 10px', borderRadius: 7, border: `1px solid ${BORDER}`, fontSize: 12.5, color: TX }} />
        <button onClick={onCancelar} style={btnGhost}>Cancelar</button>
      </div>
      <div style={{ maxHeight: 220, overflowY: 'auto' }}>
        {lista.map(c => (
          <button key={c.id} onClick={() => onElegir(c.id)} style={{
            display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none',
            borderBottom: `1px solid ${BORDER}`, background: PANEL, cursor: 'pointer', fontSize: 12.5, color: TX,
          }}>
            <strong style={{ color: ACCENT }}>{c.consecutivo}</strong> · {c.empresa}
            <span style={{ color: TX_LOW }}> · {c.asesor}</span>
          </button>
        ))}
        {!lista.length && <p style={{ padding: 16, fontSize: 12, color: TX_LOW, textAlign: 'center' }}>Sin coincidencias.</p>}
      </div>
    </div>
  )
}

/* ─── Panel de señales global ────────────────────────────────────── */
function PanelSenales({ senales, onAtender }: { senales: Senal[]; onAtender: () => void }) {
  if (!senales.length) return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 44, textAlign: 'center' }}>
      <ShieldCheck size={26} color={VERDE} />
      <p style={{ marginTop: 10, fontSize: 13.5, fontWeight: 700, color: TX }}>Sin señales pendientes</p>
      <p style={{ fontSize: 12, color: TX_LOW }}>Ninguna conversación muestra riesgo detectable en este momento.</p>
    </div>
  )

  const grupos: Array<[string, Senal[]]> = (['critica', 'alta', 'media', 'info'] as const)
    .map(sev => [sev, senales.filter(s => s.severidad === sev)] as [string, Senal[]])
    .filter(([, arr]) => arr.length > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {grupos.map(([sev, arr]) => (
        <div key={sev} style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16 }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: SEV_COLOR[sev] }}>
            {SEV_LABEL[sev]} · {arr.length}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {arr.map(s => (
              <div key={s.id}>
                <p style={{ margin: '0 0 4px', fontSize: 11.5, color: TX_LOW }}>
                  {s.wa_conversaciones?.nombre ?? 'Conversación'}
                  {s.wa_conversaciones?.tipo === 'grupo' ? ' · grupo' : ''}
                </p>
                <TarjetaSenal s={s} convId={s.conversacion_id} onAtender={onAtender} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Vinculación / importación ──────────────────────────────────── */
function PanelConectar({ onImportado }: { onImportado: () => void }) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [resultado, setResultado] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function importar() {
    if (!archivo) return
    setSubiendo(true); setError(null); setResultado(null)
    try {
      const contenido = await archivo.text()
      const r = await fetch('/api/whatsapp/importar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido, nombreArchivo: archivo.name }),
      })
      const d = await r.json()
      if (!r.ok) setError(d.error ?? 'No se pudo importar el chat.')
      else { setResultado(d); onImportado() }
    } catch (e) {
      setError(String(e))
    } finally { setSubiendo(false) }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 16, alignItems: 'start' }}>
      {/* Importar */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: TX }}>Cargar una conversación</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: TX_MID, lineHeight: 1.6 }}>
          Funciona con chats individuales <strong>y con grupos</strong>. Desde WhatsApp:
          abre la conversación → menú <strong>⋮</strong> → <strong>Más</strong> → <strong>Exportar chat</strong> → <strong>Sin archivos multimedia</strong>.
          Se genera un <code>.txt</code> que se sube aquí.
        </p>

        <label style={{
          display: 'block', border: `2px dashed ${archivo ? VERDE : BORDER}`, borderRadius: 12,
          padding: 24, textAlign: 'center', cursor: 'pointer', background: archivo ? '#F0FDF4' : '#F8FAFC',
        }}>
          <input type="file" accept=".txt" style={{ display: 'none' }}
            onChange={e => { setArchivo(e.target.files?.[0] ?? null); setResultado(null); setError(null) }} />
          <Upload size={22} color={archivo ? VERDE : TX_LOW} />
          <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 700, color: archivo ? '#166534' : TX_MID }}>
            {archivo ? archivo.name : 'Selecciona el archivo .txt exportado'}
          </p>
          {archivo && <p style={{ margin: '2px 0 0', fontSize: 11, color: TX_LOW }}>{(archivo.size / 1024).toFixed(0)} KB</p>}
        </label>

        <button onClick={importar} disabled={!archivo || subiendo} style={{
          marginTop: 14, width: '100%', padding: '10px 16px', borderRadius: 10, border: 'none',
          background: !archivo || subiendo ? '#CBD5E1' : ACCENT, color: '#fff',
          fontSize: 13, fontWeight: 800, cursor: !archivo || subiendo ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
          {subiendo ? <Loader2 size={14} /> : <Upload size={14} />}
          {subiendo ? 'Analizando conversación…' : 'Importar y analizar'}
        </button>

        {error && (
          <div style={{ marginTop: 12, padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 9, fontSize: 12.5, color: '#991B1B' }}>{error}</div>
        )}
        {resultado && <ResumenImportacion r={resultado} />}
      </div>

      {/* Nota técnica honesta */}
      <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: TX, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Info size={16} color={ACCENT} /> Por qué se carga así y no con un login
        </h3>
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: TX_MID, lineHeight: 1.65 }}>
          WhatsApp no permite iniciar sesión desde una aplicación externa para leer conversaciones
          existentes. Las dos vías oficiales tienen límites duros:
        </p>
        <ul style={{ margin: '0 0 12px', paddingLeft: 18, fontSize: 12.5, color: TX_MID, lineHeight: 1.7 }}>
          <li><strong>Cloud API de Meta:</strong> solo ve mensajes que pasan por un número de empresa
            registrado, y <strong>no soporta grupos en absoluto</strong> — justo lo que se necesita aquí.</li>
          <li><strong>Librerías no oficiales</strong> (tipo whatsapp-web.js): sí leen grupos, pero violan
            los Términos de Servicio y exponen el número a bloqueo permanente. No se usaron.</li>
        </ul>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: TX_MID, lineHeight: 1.65 }}>
          La exportación de chat es la vía compatible: la autoriza el propio dueño de la conversación,
          incluye grupos completos y no arriesga la cuenta.
        </p>
        <div style={{ padding: '11px 13px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={13} /> Módulo de sola observación
          </p>
          <p style={{ margin: '5px 0 0', fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
            Nadie puede cambiar, sustituir ni eliminar un mensaje: la base de datos rechaza cualquier
            modificación o borrado con un candado a nivel de motor, no solo en la interfaz.
            Una carga equivocada se archiva —se oculta— pero permanece auditable.
          </p>
        </div>
      </div>
    </div>
  )
}

function ResumenImportacion({ r }: { r: Record<string, unknown> }) {
  const senales = (r.senales ?? []) as Array<{ severidad: string; titulo: string }>
  const criticas = senales.filter(s => s.severidad === 'critica').length
  return (
    <div style={{ marginTop: 14, padding: '13px 15px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 800, color: '#166534' }}>
        ✓ {String(r.nombre)} — importada
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#166534' }}>
        <span><strong>{String(r.mensajesEnArchivo)}</strong> mensajes en el archivo</span>
        <span><strong>{String(r.mensajesNuevos)}</strong> nuevos</span>
        <span><strong>{String(r.tipo)}</strong></span>
        <span><strong>{senales.length}</strong> señales{criticas > 0 ? ` (${criticas} crítica${criticas > 1 ? 's' : ''})` : ''}</span>
      </div>
      <p style={{ margin: '9px 0 0', fontSize: 11.5, color: '#166534' }}>
        Vincula la conversación a su cuenta desde la bandeja para que las señales lleguen a la ficha del cliente.
      </p>
    </div>
  )
}

function VacioBandeja() {
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 52, textAlign: 'center' }}>
      <MessageCircle size={30} color={TX_LOW} />
      <p style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: TX }}>Aún no hay conversaciones cargadas</p>
      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: TX_LOW, maxWidth: 460, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
        Ve a <strong>Vincular WhatsApp</strong> y carga la exportación de un chat o de un grupo de clientes TOP.
        El sistema detecta señales de riesgo y las conecta con la cuenta.
      </p>
    </div>
  )
}

/* ─── Estilos reutilizados ───────────────────────────────────────── */
const btnGhost: React.CSSProperties = {
  padding: '5px 11px', borderRadius: 7, border: `1px solid ${BORDER}`, background: PANEL,
  color: TX_MID, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
}
const btnPrimario: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8,
  border: 'none', background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}
