'use client'
import { useState, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react'

/**
 * Pendientes de contestar y reporte mensual del book de preguntas.
 *
 * Se separan de la bitácora del día a propósito. La bitácora es un registro:
 * qué se preguntó, cuándo. Esto es una lista de trabajo — cada pendiente es
 * un hueco de conocimiento con nombre de quien se quedó sin respuesta, y se
 * cierra escribiendo la respuesta, no marcando una casilla.
 *
 * El reporte mensual es lo mismo visto de lejos: sobre qué se pregunta, quién
 * pregunta, y sobre todo qué sigue sin poder contestarse. Eso último es lo que
 * dice dónde cargar datos o construir módulo.
 */

const BORDER = '#E2E8F0'
const TX     = '#0F172A'
const TX_MID = '#475569'
const TX_LOW = '#94A3B8'
const AMBAR  = '#D97706'

export interface Pendiente {
  id: string; pregunta: string; motivo: string | null
  usuario_email: string | null; usuario_nombre: string | null
  estado: string; respuesta_final: string | null
  resuelto_en: string | null; created_at: string
}

interface Reporte {
  mes: string; total: number; diasConActividad: number
  sinResponder: number; pctResueltas: number
  porUsuario: [string, number][]; porTipo: [string, number][]
  porModulo: [string, number][]; temas: [string, number][]
  pendientesAbiertos: Array<{ id: string; pregunta: string; motivo: string | null; quien: string | null; fecha: string; delMes: boolean }>
  pendientesDelMes: number; resueltosDelMes: number
  error?: string
}

const fechaCorta = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })

/* ── Pendientes ───────────────────────────────────────────────────────────── */

export function VistaPendientes({ onCambio }: { onCambio?: () => void }) {
  const [lista, setLista]     = useState<Pendiente[]>([])
  const [loading, setLoading] = useState(false)
  const [abierta, setAbierta] = useState<string | null>(null)
  const [texto, setTexto]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [verResueltas, setVerResueltas] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    fetch(`/api/chat/pendientes?estado=${verResueltas ? 'todos' : 'pendiente'}`)
      .then(r => r.json())
      .then(d => setLista(d.pendientes ?? []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false))
  }, [verResueltas])

  useEffect(() => { cargar() }, [cargar])

  const resolver = (id: string) => {
    setError(null)
    fetch('/api/chat/pendientes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, respuesta_final: texto }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setAbierta(null); setTexto(''); cargar(); onCambio?.()
      })
      .catch(e => setError(String(e)))
  }

  const abiertas = lista.filter(p => p.estado === 'pendiente')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.5, flex: 1, minWidth: 220 }}>
          Preguntas que Atlas no pudo contestar. Cada una es un dato que le falta a la plataforma
          y alguien esperando respuesta.
        </p>
        <button onClick={() => setVerResueltas(!verResueltas)} style={{
          padding: '5px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
          background: verResueltas ? TX : '#FFF', color: verResueltas ? '#FFF' : TX_MID,
          border: `1px solid ${verResueltas ? TX : BORDER}`,
        }}>
          {verResueltas ? 'Ver solo abiertas' : 'Ver también resueltas'}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TX_MID, fontSize: 13 }}>
          <Loader2 size={14} className="animate-spin" /> Cargando…
        </div>
      )}

      {!loading && lista.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <CheckCircle2 size={26} style={{ color: '#16A34A', marginBottom: 8 }} />
          <p style={{ fontSize: 13.5, color: TX_MID, fontWeight: 600 }}>Nada pendiente de contestar</p>
          <p style={{ fontSize: 12, color: TX_LOW, marginTop: 3 }}>
            Todas las preguntas que ha recibido Atlas tienen respuesta.
          </p>
        </div>
      )}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: '#B91C1C' }}>{error}</p>
        </div>
      )}

      {!loading && lista.map(p => {
        const resuelta = p.estado === 'resuelto'
        return (
          <div key={p.id} style={{
            border: `1px solid ${resuelta ? BORDER : '#FDE68A'}`,
            background: resuelta ? '#FFF' : '#FFFBEB',
            borderRadius: 10, marginBottom: 10, padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 20,
                background: resuelta ? '#DCFCE7' : '#FEF3C7',
                color: resuelta ? '#15803D' : AMBAR,
              }}>{resuelta ? 'Resuelta' : 'Pendiente'}</span>
              <span style={{ fontSize: 11, color: TX_LOW }}>{fechaCorta(p.created_at)}</span>
              {p.usuario_nombre && <span style={{ fontSize: 11, color: TX_MID }}>— {p.usuario_nombre}</span>}
            </div>

            <p style={{ fontSize: 13, color: TX, fontWeight: 600, lineHeight: 1.45, marginBottom: 5 }}>
              {p.pregunta.length > 260 ? p.pregunta.slice(0, 260) + '…' : p.pregunta}
            </p>

            {p.motivo && (
              <p style={{ fontSize: 11.5, color: TX_MID, lineHeight: 1.45, marginBottom: 8 }}>
                <span style={{ fontWeight: 700 }}>Qué faltó: </span>{p.motivo}
              </p>
            )}

            {resuelta && p.respuesta_final && (
              <p style={{ fontSize: 12, color: '#166534', lineHeight: 1.5, background: '#F0FDF4', borderRadius: 6, padding: '7px 10px' }}>
                {p.respuesta_final}
              </p>
            )}

            {!resuelta && abierta !== p.id && (
              <button onClick={() => { setAbierta(p.id); setTexto(''); setError(null) }} style={{
                padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700,
                background: AMBAR, color: '#FFF', border: 'none', cursor: 'pointer',
              }}>
                Contestar y cerrar
              </button>
            )}

            {!resuelta && abierta === p.id && (
              <div>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Escribe la respuesta que se le va a dar a quien preguntó…"
                  rows={3}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 12.5,
                    border: `1px solid ${BORDER}`, color: TX, outline: 'none', resize: 'vertical',
                    marginBottom: 7, fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: 7 }}>
                  <button onClick={() => resolver(p.id)} style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700,
                    background: '#16A34A', color: '#FFF', border: 'none', cursor: 'pointer',
                  }}>Guardar respuesta</button>
                  <button onClick={() => { setAbierta(null); setError(null) }} style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                    background: '#FFF', color: TX_MID, border: `1px solid ${BORDER}`, cursor: 'pointer',
                  }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {!loading && abiertas.length > 0 && (
        <p style={{ fontSize: 11, color: TX_LOW, marginTop: 12, lineHeight: 1.5 }}>
          Una pendiente se cierra escribiendo la respuesta, no marcando una casilla: quien preguntó
          sigue esperando ese dato.
        </p>
      )}
    </div>
  )
}

/* ── Reporte mensual ──────────────────────────────────────────────────────── */

export function VistaReporteMensual() {
  const hoy = new Date()
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const [mes, setMes]   = useState(mesActual)
  const [rep, setRep]   = useState<Reporte | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/chat/reporte-mensual?mes=${mes}`)
      .then(r => r.json())
      .then(d => setRep(d))
      .catch(() => setRep(null))
      .finally(() => setLoading(false))
  }, [mes])

  const barra = (titulo: string, filas: [string, number][], color: string, max = 8) => {
    if (!filas?.length) return null
    const tope = Math.max(...filas.map(f => f[1])) || 1
    return (
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 11, fontWeight: 800, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          {titulo}
        </p>
        {filas.slice(0, max).map(([k, n]) => (
          <div key={k} style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span style={{ color: TX_MID }}>{k}</span>
              <span style={{ color: TX, fontWeight: 700 }}>{n}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: '#F1F5F9', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(n / tope) * 100}%`, background: color, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <BarChart3 size={15} style={{ color: '#1D4ED8' }} />
        <p style={{ fontSize: 12.5, color: TX_MID, flex: 1, minWidth: 200, lineHeight: 1.5 }}>
          Qué se preguntó y, sobre todo, qué siguió sin respuesta.
        </p>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{
          padding: '5px 9px', borderRadius: 7, fontSize: 12,
          border: `1px solid ${BORDER}`, color: TX, outline: 'none',
        }} />
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: TX_MID, fontSize: 13 }}>
          <Loader2 size={14} className="animate-spin" /> Generando reporte…
        </div>
      )}

      {!loading && rep && rep.total === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: TX_LOW }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: TX_MID }}>Sin consultas registradas en {mes}</p>
          {rep.error && <p style={{ fontSize: 11.5, marginTop: 6 }}>{rep.error}</p>}
        </div>
      )}

      {!loading && rep && rep.total > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 18 }}>
            {[
              { l: 'Consultas',      v: String(rep.total),            c: '#1D4ED8' },
              { l: 'Días activos',   v: String(rep.diasConActividad), c: '#0EA5E9' },
              { l: 'Contestadas',    v: `${rep.pctResueltas}%`,       c: '#16A34A' },
              { l: 'Sin respuesta',  v: String(rep.sinResponder),     c: AMBAR     },
            ].map(x => (
              <div key={x.l} style={{ border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 11px', background: '#FFF' }}>
                <p style={{ fontSize: 10, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{x.l}</p>
                <p style={{ fontSize: 21, fontWeight: 900, color: x.c, lineHeight: 1.15 }}>{x.v}</p>
              </div>
            ))}
          </div>

          {barra('Quién pregunta', rep.porUsuario, '#1D4ED8')}
          {barra('Sobre qué se pregunta', rep.temas, '#0EA5E9', 12)}
          {barra('Módulos que sostienen la respuesta', rep.porModulo, '#8B5CF6', 10)}

          <div style={{
            border: `1px solid ${rep.pendientesAbiertos.length ? '#FDE68A' : BORDER}`,
            background: rep.pendientesAbiertos.length ? '#FFFBEB' : '#FFF',
            borderRadius: 10, padding: '12px 14px', marginTop: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <AlertCircle size={14} style={{ color: rep.pendientesAbiertos.length ? AMBAR : TX_LOW }} />
              <p style={{ fontSize: 12.5, fontWeight: 800, color: TX }}>
                Pendientes de contestar — {rep.pendientesAbiertos.length} abiertas
              </p>
            </div>
            <p style={{ fontSize: 11.5, color: TX_MID, marginBottom: rep.pendientesAbiertos.length ? 9 : 0, lineHeight: 1.5 }}>
              {rep.pendientesDelMes} surgieron en {rep.mes} · {rep.resueltosDelMes} se cerraron en el mes.
              Cada pendiente abierta es un dato que la plataforma todavía no tiene.
            </p>
            {rep.pendientesAbiertos.slice(0, 10).map(p => (
              <div key={p.id} style={{ borderTop: `1px dashed ${BORDER}`, paddingTop: 7, marginTop: 7 }}>
                <p style={{ fontSize: 12, color: TX, fontWeight: 600, lineHeight: 1.4 }}>
                  {p.pregunta.length > 150 ? p.pregunta.slice(0, 150) + '…' : p.pregunta}
                </p>
                <p style={{ fontSize: 11, color: TX_LOW, marginTop: 2 }}>
                  {p.quien} · {fechaCorta(p.fecha)}{p.motivo ? ` · ${p.motivo.slice(0, 90)}` : ''}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
