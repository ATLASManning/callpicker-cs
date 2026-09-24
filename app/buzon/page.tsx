'use client'
/**
 * Buzón del Cliente — sugerencias a servicios y procesos.
 *
 * ── CÓMO ESTÁ ORGANIZADA LA PANTALLA, Y POR QUÉ ────────────────────────────
 * Tres pestañas, en el orden en que se usan y no en el orden en que se
 * construyeron:
 *
 *   1. REGISTRAR — el formulario. Es lo primero porque el momento de captura
 *      es el frágil: si registrar cuesta trabajo, no se registra, y un buzón
 *      vacío no es un buzón sin quejas, es un buzón que nadie usa.
 *   2. SOLICITUDES — la lista con filtros, para operar.
 *   3. QUÉ PIDEN — la agrupación por tema. Es la pestaña que justifica el
 *      módulo: una solicitud suelta es una anécdota; el mismo tema en ocho
 *      clientes es una instrucción de producto.
 *
 * El ancho está topado y centrado a propósito. Un formulario de captura que
 * se estira a 2,000 px obliga a barrer la cabeza de un lado a otro entre la
 * etiqueta y su campo, y ahí es donde se equivoca quien captura con prisa.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Inbox, Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Layers, Send, BellRing, Search, X,
} from 'lucide-react'
import CustomSelect from '@/components/CustomSelect'
import {
  PRIORIDADES, AREAS, CANALES, ESTADOS,
  etiqueta, colorDe, estaAbierta, alertas, diasEnCurso,
  agruparPorTema, resumirBuzon,
  type EntradaBuzon, type Prioridad, type Area, type Canal, type EstadoBuzon,
} from '@/lib/buzon'
import { hoyLocal } from '@/lib/fecha-local'

type CuentaOpcion = { id: string; consecutivo: string | null; cid: string | null; empresa: string; asesor: string | null }
type Pestana = 'registrar' | 'solicitudes' | 'temas'

const AZUL = '#1B3FCC'
/* Antes usaba toISOString(), que da la fecha en UTC: después de las 18:00
   locales sellaba con el día siguiente. Ver lib/fecha-local.ts. */
const hoyISO = () => hoyLocal()
const nf = (n: number) => n.toLocaleString('es-MX')

const VACIO = {
  cuenta_id: '', cid: '', cliente: '', solicitud: '', tema: '',
  prioridad: 'media' as Prioridad, area: '' as Area | '', canal: '' as Canal | '',
  estado: 'recibida' as EstadoBuzon, seguimiento: '',
  fecha_solicitud: hoyISO(), fecha_compromiso: '', fecha_entrega: '',
  motivo_respuesta: '', avisado_al_cliente: false, registrado_por: '', asesor: '',
}

export default function BuzonPage() {
  const [tab, setTab] = useState<Pestana>('registrar')
  const [entradas, setEntradas] = useState<EntradaBuzon[]>([])
  const [cuentas, setCuentas] = useState<CuentaOpcion[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [form, setForm] = useState({ ...VACIO })
  // La tabla se crea a mano en Supabase. Mientras no exista, el modulo no
  // esta roto: esta a medio instalar, y la pantalla debe decir cual es el paso.
  const [sinTabla, setSinTabla] = useState(false)

  const [fArea, setFArea] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fPrioridad, setFPrioridad] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const hoy = hoyISO()

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const [b, c] = await Promise.all([
        fetch('/api/buzon').then(r => r.json()),
        fetch('/api/cuentas').then(r => r.json()).catch(() => []),
      ])
      setSinTabla(!!b?.sinTabla)
      setEntradas(Array.isArray(b) ? b : [])
      const lista = Array.isArray(c) ? c : (c?.data ?? [])
      setCuentas(lista.map((x: Record<string, unknown>) => ({
        id: String(x.id), consecutivo: (x.consecutivo as string) ?? null,
        cid: (x.cid as string) ?? null, empresa: String(x.empresa ?? ''),
        asesor: (x.asesor as string) ?? null,
      })))
    } finally { setCargando(false) }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const resumen = useMemo(() => resumirBuzon(entradas, hoy), [entradas, hoy])
  const temas = useMemo(() => agruparPorTema(entradas), [entradas])

  const visibles = useMemo(() => entradas.filter(e => {
    if (fArea && e.area !== fArea) return false
    if (fEstado && e.estado !== fEstado) return false
    if (fPrioridad && e.prioridad !== fPrioridad) return false
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      const campos = [e.cliente, e.cid, e.solicitud, e.tema, e.seguimiento].join(' ').toLowerCase()
      if (!campos.includes(q)) return false
    }
    return true
  }), [entradas, fArea, fEstado, fPrioridad, busqueda])

  /** Al elegir cuenta se rellenan CID, nombre y asesor: tres campos que el
   *  capturista no tiene por qué volver a teclear ni equivocar. */
  function elegirCuenta(id: string) {
    const c = cuentas.find(x => x.id === id)
    setForm(f => ({
      ...f, cuenta_id: id,
      cid: c?.cid ?? '', cliente: c?.empresa ?? '', asesor: c?.asesor ?? '',
    }))
  }

  async function guardar() {
    setAviso(null)
    if (!form.cliente.trim())   return setAviso({ tipo: 'error', texto: 'Elige el cliente.' })
    if (!form.solicitud.trim()) return setAviso({ tipo: 'error', texto: 'Escribe la solicitud: sin ella el registro no sirve.' })
    if (!form.area)             return setAviso({ tipo: 'error', texto: 'Elige el área responsable.' })
    if (!form.canal)            return setAviso({ tipo: 'error', texto: 'Elige por dónde entró.' })

    setGuardando(true)
    try {
      const r = await fetch('/api/buzon', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cuenta_id: form.cuenta_id || null }),
      })
      const d = await r.json()
      if (!r.ok) { setAviso({ tipo: 'error', texto: d.error ?? 'No se pudo guardar.' }); return }
      setForm({ ...VACIO })
      setAviso({ tipo: 'ok', texto: 'Solicitud registrada.' })
      await cargar()
    } finally { setGuardando(false) }
  }

  async function parchar(id: string, cambios: Record<string, unknown>) {
    const r = await fetch('/api/buzon', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...cambios }),
    })
    const d = await r.json()
    if (!r.ok) { setAviso({ tipo: 'error', texto: d.error ?? 'No se pudo actualizar.' }); return }
    setAviso(null)
    await cargar()
  }

  const opcionesCuenta = useMemo(() => cuentas
    .slice().sort((a, b) => a.empresa.localeCompare(b.empresa, 'es'))
    .map(c => ({ value: c.id, label: `${c.consecutivo ? c.consecutivo + ' · ' : ''}${c.empresa}${c.cid ? ` · CID ${c.cid}` : ''}` })),
    [cuentas])

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 80px' }}>

      {/* ── Encabezado ───────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Inbox size={26} style={{ color: AZUL }} />
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: 0 }}>Buzón del Cliente</h1>
        </div>
        <p style={{ fontSize: 13, color: '#64748B', maxWidth: 700, margin: '0 auto', lineHeight: 1.6 }}>
          Lo que los clientes piden sobre servicios y procesos. Se registra aunque no se pueda resolver:
          la solicitud que no se anota es la que nadie vuelve a ver, y el patrón solo aparece cuando están todas.
        </p>
      </div>

      {/* ── Indicadores ──────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
        <Kpi icon={Layers}        label="Solicitudes"          valor={nf(resumen.total)}     color={AZUL} />
        <Kpi icon={Clock}         label="Abiertas"             valor={nf(resumen.abiertas)}  color="#D97706" />
        <Kpi icon={AlertTriangle} label="Alta sin resolver"    valor={nf(resumen.alta)}      color="#DC2626" />
        <Kpi icon={CheckCircle2}  label="Entregadas"           valor={nf(resumen.entregadas)} color="#059669" />
        <Kpi icon={BellRing}      label="Cerradas sin avisar"  valor={nf(resumen.cerradasSinAvisar)} color="#B45309"
             nota="El cliente no sabe que se resolvió" />
      </div>

      {/* ── Pestañas ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        {([['registrar', 'Registrar', Plus], ['solicitudes', `Solicitudes (${entradas.length})`, Inbox],
           ['temas', `Qué piden (${temas.length})`, Layers]] as const).map(([k, lbl, Icon]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 10,
            border: `1.5px solid ${tab === k ? AZUL : '#E2E8F0'}`,
            background: tab === k ? AZUL : '#fff', color: tab === k ? '#fff' : '#475569',
            cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}><Icon size={15} /> {lbl}</button>
        ))}
        <button onClick={cargar} title="Recargar" style={{
          padding: '9px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0',
          background: '#fff', color: '#475569', cursor: 'pointer',
        }}><RefreshCw size={15} className={cargando ? 'animate-spin' : ''} /></button>
      </div>

      {sinTabla && (
        <div style={{
          maxWidth: 760, margin: '0 auto 20px', padding: '14px 18px', borderRadius: 11,
          background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', fontSize: 12.5, lineHeight: 1.65,
        }}>
          <strong>Falta el último paso para encender el módulo.</strong> La tabla todavía no existe en Supabase.
          Abre el SQL Editor y ejecuta <code style={{ background: '#FDE68A', padding: '1px 5px', borderRadius: 4 }}>
          supabase/migrations/20260917_buzon_cliente.sql</code>. No se puede crear desde aquí: el proyecto no expone
          la función <code>exec_sql</code> y la llave de servicio no sirve como token del Management API.
          En cuanto la corras, esta pantalla queda lista sin tocar nada más.
        </div>
      )}

      {aviso && (
        <div style={{
          maxWidth: 760, margin: '0 auto 18px', padding: '11px 16px', borderRadius: 10, fontSize: 13,
          background: aviso.tipo === 'ok' ? '#DCFCE7' : '#FEE2E2',
          color: aviso.tipo === 'ok' ? '#15803D' : '#B91C1C',
          border: `1px solid ${aviso.tipo === 'ok' ? '#86EFAC' : '#FCA5A5'}`,
          display: 'flex', alignItems: 'center', gap: 9,
        }}>
          {aviso.tipo === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span style={{ flex: 1 }}>{aviso.texto}</span>
          <button onClick={() => setAviso(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {tab === 'registrar' && (
        <Tarjeta titulo="Registrar una solicitud"
          sub="Lo único obligatorio es cliente, solicitud, área y por dónde entró. Lo demás se completa conforme avanza.">
          <Campo etiqueta="Cliente" ancho="full"
            ayuda="Al elegirlo se rellenan solos el CID y el asesor.">
            <CustomSelect value={form.cuenta_id} onChange={elegirCuenta} options={opcionesCuenta}
              searchable placeholder="Busca por nombre, consecutivo o CID…" />
          </Campo>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Campo etiqueta="CID">
              <Entrada value={form.cid} onChange={v => setForm(f => ({ ...f, cid: v }))}
                placeholder="Se llena al elegir el cliente" />
            </Campo>
            <Campo etiqueta="Asesor">
              <Entrada value={form.asesor} onChange={v => setForm(f => ({ ...f, asesor: v }))} placeholder="—" />
            </Campo>
          </div>

          <Campo etiqueta="Solicitud" ancho="full"
            ayuda="En palabras del cliente, no en las nuestras. «Quiere ver las llamadas perdidas por sucursal» dice más que «reporte».">
            <AreaTexto value={form.solicitud} onChange={v => setForm(f => ({ ...f, solicitud: v }))} filas={3} />
          </Campo>

          <Campo etiqueta="Tema" ancho="full"
            ayuda="El agrupador. Es lo que permite ver que ocho clientes piden lo mismo: sin él, el buzón es un archivero.">
            <Entrada value={form.tema} onChange={v => setForm(f => ({ ...f, tema: v }))}
              placeholder="Ej. Reportes por sucursal · Integración CRM · Facturación" lista={temas.map(t => t.tema)} />
          </Campo>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            <Campo etiqueta="Prioridad">
              <CustomSelect value={form.prioridad} onChange={v => setForm(f => ({ ...f, prioridad: v as Prioridad }))}
                options={PRIORIDADES.map(p => ({ value: p.v, label: p.label }))} />
            </Campo>
            <Campo etiqueta="Área responsable">
              <CustomSelect value={form.area} onChange={v => setForm(f => ({ ...f, area: v as Area }))}
                options={AREAS.map(a => ({ value: a.v, label: a.label }))} placeholder="Elige el área" />
            </Campo>
            <Campo etiqueta="Entró por">
              <CustomSelect value={form.canal} onChange={v => setForm(f => ({ ...f, canal: v as Canal }))}
                options={CANALES.map(c => ({ value: c.v, label: c.label }))} placeholder="Elige el canal" />
            </Campo>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            <Campo etiqueta="Fecha de solicitud">
              <Entrada tipo="date" value={form.fecha_solicitud} onChange={v => setForm(f => ({ ...f, fecha_solicitud: v }))} />
            </Campo>
            <Campo etiqueta="Fecha comprometida" ayuda="Lo que se le prometió al cliente.">
              <Entrada tipo="date" value={form.fecha_compromiso} onChange={v => setForm(f => ({ ...f, fecha_compromiso: v }))} />
            </Campo>
            <Campo etiqueta="Fecha de entrega" ayuda="Lo que realmente ocurrió. Se llena al cerrar.">
              <Entrada tipo="date" value={form.fecha_entrega} onChange={v => setForm(f => ({ ...f, fecha_entrega: v }))} />
            </Campo>
          </div>

          <Campo etiqueta="Detalle del seguimiento" ancho="full"
            ayuda="Qué se hizo, con quién se habló y qué quedó pendiente.">
            <AreaTexto value={form.seguimiento} onChange={v => setForm(f => ({ ...f, seguimiento: v }))} filas={3} />
          </Campo>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 6 }}>
            <button onClick={guardar} disabled={guardando} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 28px', borderRadius: 10,
              border: 'none', background: guardando ? '#94A3B8' : AZUL, color: '#fff',
              cursor: guardando ? 'default' : 'pointer', fontSize: 14, fontWeight: 700,
            }}><Send size={15} /> {guardando ? 'Guardando…' : 'Registrar solicitud'}</button>
            <button onClick={() => { setForm({ ...VACIO }); setAviso(null) }} style={{
              padding: '11px 20px', borderRadius: 10, border: '1.5px solid #E2E8F0',
              background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            }}>Limpiar</button>
          </div>
        </Tarjeta>
      )}

      {tab === 'solicitudes' && (
        <>
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
            justifyContent: 'center', marginBottom: 16,
          }}>
            <div style={{ position: 'relative', minWidth: 240 }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: 12, color: '#94A3B8' }} />
              <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar cliente, CID, solicitud o tema…"
                style={{
                  width: '100%', padding: '9px 12px 9px 32px', borderRadius: 9,
                  border: '1.5px solid #E2E8F0', fontSize: 13, color: '#0F172A', background: '#fff',
                }} />
            </div>
            <CustomSelect value={fArea} onChange={setFArea} placeholder="Todas las áreas"
              options={[{ value: '', label: 'Todas las áreas' }, ...AREAS.map(a => ({ value: a.v, label: a.label }))]} />
            <CustomSelect value={fEstado} onChange={setFEstado} placeholder="Todos los estados"
              options={[{ value: '', label: 'Todos los estados' }, ...ESTADOS.map(e => ({ value: e.v, label: e.label }))]} />
            <CustomSelect value={fPrioridad} onChange={setFPrioridad} placeholder="Toda prioridad"
              options={[{ value: '', label: 'Toda prioridad' }, ...PRIORIDADES.map(p => ({ value: p.v, label: p.label }))]} />
          </div>

          {visibles.length === 0 ? (
            <Vacio texto={entradas.length === 0
              ? 'Todavía no hay solicitudes registradas. Un buzón vacío no significa que los clientes no pidan nada: significa que aún no se está capturando.'
              : 'Ninguna solicitud coincide con estos filtros.'} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibles.map(e => (
                <Renglon key={e.id} e={e} hoy={hoy} onParchar={parchar} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'temas' && (
        <Tarjeta titulo="Qué están pidiendo, agrupado por tema"
          sub={`Ordenado por CLIENTES DISTINTOS, no por número de solicitudes: diez tickets del mismo cliente siguen siendo un cliente, y ordenarlo al revés deja que el más insistente marque la hoja de ruta en lugar del más representativo.${resumen.sinTema > 0 ? ` ${resumen.sinTema} solicitud(es) no tienen tema y quedan fuera de este corte.` : ''}`}>
          {temas.length === 0 ? (
            <Vacio texto="Ninguna solicitud tiene tema asignado todavía. Sin tema no hay agrupación, y sin agrupación el buzón es una lista de anécdotas." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {temas.map(t => (
                <div key={t.tema} style={{
                  border: '1px solid #E2E8F0', borderRadius: 11, padding: '13px 16px', background: '#fff',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', flex: 1 }}>{t.tema}</span>
                    <Pastilla texto={`${t.clientes} cliente${t.clientes === 1 ? '' : 's'}`}
                      color={t.clientes >= 3 ? '#B45309' : '#475569'} fuerte={t.clientes >= 3} />
                    <Pastilla texto={`${t.solicitudes} solicitud${t.solicitudes === 1 ? '' : 'es'}`} color="#64748B" />
                    {t.alta > 0 && <Pastilla texto={`${t.alta} de alta prioridad`} color="#DC2626" />}
                    {t.abiertas > 0 && <Pastilla texto={`${t.abiertas} abierta${t.abiertas === 1 ? '' : 's'}`} color="#D97706" />}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                    {t.areas.map(a => (
                      <span key={a} style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 5, fontWeight: 600,
                        background: `${colorDe(AREAS, a)}18`, color: colorDe(AREAS, a),
                      }}>{etiqueta(AREAS, a)}</span>
                    ))}
                  </div>
                  <ul style={{ margin: '9px 0 0', paddingLeft: 17 }}>
                    {t.ejemplos.map((x, i) => (
                      <li key={i} style={{ fontSize: 11.5, color: '#64748B', lineHeight: 1.6 }}>{x}</li>
                    ))}
                  </ul>
                  {t.clientes >= 3 && (
                    <p style={{ fontSize: 11.5, color: '#B45309', marginTop: 9, marginBottom: 0, fontWeight: 600 }}>
                      Tres o más clientes distintos piden lo mismo. Eso ya no es una petición: es una señal de producto,
                      y merece subir a la junta con nombre y apellido de quién lo pidió.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Tarjeta>
      )}
    </div>
  )
}

/* ── Piezas ───────────────────────────────────────────────────────────────── */

function Kpi({ icon: Icon, label, valor, color, nota }: {
  icon: React.ElementType; label: string; valor: string; color: string; nota?: string
}) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
      padding: '13px 16px', textAlign: 'center',
    }}>
      <Icon size={16} style={{ color, marginBottom: 4 }} />
      <p style={{ fontSize: 24, fontWeight: 800, color, margin: '0 0 2px' }}>{valor}</p>
      <p style={{ fontSize: 11, color: '#64748B', margin: 0, fontWeight: 600 }}>{label}</p>
      {nota && <p style={{ fontSize: 9.5, color: '#94A3B8', margin: '3px 0 0', lineHeight: 1.4 }}>{nota}</p>}
    </div>
  )
}

function Tarjeta({ titulo, sub, children }: { titulo: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
      padding: '22px 26px', maxWidth: 880, margin: '0 auto',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 2 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>{titulo}</p>
        {sub && <p style={{ fontSize: 11.5, color: '#64748B', margin: 0, lineHeight: 1.6 }}>{sub}</p>}
      </div>
      {children}
    </div>
  )
}

function Campo({ etiqueta: et, ayuda, ancho, children }: {
  etiqueta: string; ayuda?: string; ancho?: 'full'; children: React.ReactNode
}) {
  return (
    <div style={{ gridColumn: ancho === 'full' ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>{et}</label>
      {children}
      {ayuda && <p style={{ fontSize: 10.5, color: '#94A3B8', margin: '4px 0 0', lineHeight: 1.5 }}>{ayuda}</p>}
    </div>
  )
}

const ESTILO_ENTRADA: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0',
  fontSize: 13, color: '#0F172A', background: '#fff', fontFamily: 'inherit',
}

function Entrada({ value, onChange, placeholder, tipo = 'text', lista }: {
  value: string; onChange: (v: string) => void; placeholder?: string; tipo?: string; lista?: string[]
}) {
  const idLista = lista && lista.length ? `lst-${lista.length}-${lista[0]?.slice(0, 6)}` : undefined
  return (
    <>
      <input type={tipo} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} style={ESTILO_ENTRADA} list={idLista} />
      {idLista && (
        <datalist id={idLista}>{lista!.map(x => <option key={x} value={x} />)}</datalist>
      )}
    </>
  )
}

function AreaTexto({ value, onChange, filas = 3 }: { value: string; onChange: (v: string) => void; filas?: number }) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={filas}
      style={{ ...ESTILO_ENTRADA, resize: 'vertical', lineHeight: 1.6 }} />
  )
}

function Pastilla({ texto, color, fuerte }: { texto: string; color: string; fuerte?: boolean }) {
  return (
    <span style={{
      fontSize: 10.5, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap',
      background: fuerte ? color : `${color}15`, color: fuerte ? '#fff' : color,
      fontWeight: fuerte ? 700 : 600,
    }}>{texto}</span>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <p style={{
      textAlign: 'center', fontSize: 12.5, color: '#94A3B8', lineHeight: 1.7,
      maxWidth: 560, margin: '26px auto', padding: '0 12px',
    }}>{texto}</p>
  )
}

function Renglon({ e, hoy, onParchar }: {
  e: EntradaBuzon; hoy: string; onParchar: (id: string, c: Record<string, unknown>) => void
}) {
  const [abierto, setAbierto] = useState(false)
  const av = alertas(e, hoy)
  const dias = diasEnCurso(e, hoy)

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setAbierto(o => !o)} style={{ padding: '13px 16px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>{e.cliente}</span>
              {e.cid && <span style={{ fontSize: 10.5, color: '#64748B' }}>CID {e.cid}</span>}
            </div>
            <p style={{ fontSize: 12.5, color: '#334155', margin: 0, lineHeight: 1.55 }}>{e.solicitud}</p>
            {e.tema && (
              <p style={{ fontSize: 10.5, color: '#64748B', margin: '4px 0 0' }}>
                <Layers size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                {e.tema}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Pastilla texto={etiqueta(PRIORIDADES, e.prioridad)} color={colorDe(PRIORIDADES, e.prioridad)}
              fuerte={e.prioridad === 'alta'} />
            <Pastilla texto={etiqueta(AREAS, e.area)} color={colorDe(AREAS, e.area)} />
            <Pastilla texto={etiqueta(ESTADOS, e.estado)} color={colorDe(ESTADOS, e.estado)} />
            <span style={{ fontSize: 10.5, color: '#94A3B8', whiteSpace: 'nowrap' }}>
              {etiqueta(CANALES, e.canal)} · {dias}d
            </span>
          </div>
        </div>
        {av.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {av.map((a, i) => (
              <span key={i} style={{
                fontSize: 10.5, padding: '3px 9px', borderRadius: 6, fontWeight: 700,
                background: `${a.color}15`, color: a.color,
              }}>⚠ {a.texto}</span>
            ))}
          </div>
        )}
      </div>

      {abierto && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '14px 16px', background: '#F8FAFC' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 12 }}>
            <Dato label="Solicitada"    valor={e.fecha_solicitud} />
            <Dato label="Comprometida"  valor={e.fecha_compromiso ?? 'sin fecha comprometida'} />
            <Dato label="Entregada"     valor={e.fecha_entrega ?? '—'} />
            <Dato label="Solución"      valor={e.solucion === 'si' ? 'Sí' : e.solucion === 'no' ? 'No' : 'en curso'} />
            <Dato label="Asesor"        valor={e.asesor ?? '—'} />
          </div>

          {e.seguimiento && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', margin: '0 0 3px' }}>SEGUIMIENTO</p>
              <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{e.seguimiento}</p>
            </div>
          )}
          {e.motivo_respuesta && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: '#B91C1C', margin: '0 0 3px' }}>POR QUÉ NO PROCEDE</p>
              <p style={{ fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.6 }}>{e.motivo_respuesta}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Mover a:</span>
            {ESTADOS.filter(s => s.v !== e.estado).map(s => (
              <button key={s.v}
                onClick={() => {
                  const c: Record<string, unknown> = { estado: s.v }
                  if (s.v === 'entregada' && !e.fecha_entrega) c.fecha_entrega = hoy
                  if (s.v === 'no_procede' && !e.motivo_respuesta) {
                    const m = window.prompt('¿Por qué no procede? Sin motivo no se le puede explicar al cliente.')
                    if (!m || !m.trim()) return
                    c.motivo_respuesta = m.trim()
                  }
                  onParchar(e.id, c)
                }}
                style={{
                  fontSize: 10.5, padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${s.color}44`, background: `${s.color}10`, color: s.color, fontWeight: 600,
                }}>{s.label}</button>
            ))}
            {!estaAbierta(e) && !e.avisado_al_cliente && (
              <button onClick={() => onParchar(e.id, { avisado_al_cliente: true })}
                style={{
                  fontSize: 10.5, padding: '5px 11px', borderRadius: 7, cursor: 'pointer', marginLeft: 'auto',
                  border: 'none', background: '#B45309', color: '#fff', fontWeight: 700,
                }}>
                <BellRing size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                Marcar que ya se le avisó
              </button>
            )}
            {e.avisado_al_cliente && (
              <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 600, marginLeft: 'auto' }}>
                <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                Cliente avisado{e.fecha_aviso ? ` el ${e.fecha_aviso}` : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', margin: '0 0 2px' }}>{label.toUpperCase()}</p>
      <p style={{ fontSize: 12, color: '#334155', margin: 0 }}>{valor}</p>
    </div>
  )
}
