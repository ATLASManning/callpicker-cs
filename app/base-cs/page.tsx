'use client'
import { useState } from 'react'
import {
  Phone, MessageSquare, Bot, Wifi, Timer,
  ChevronRight, ArrowUpRight, ArrowDownLeft,
  CheckCircle2, AlertCircle, Info,
} from 'lucide-react'

// ── Paleta ────────────────────────────────────────────────────────────────────
const BG     = '#050D1A'
const PANEL  = 'rgba(255,255,255,0.04)'
const PANEL2 = 'rgba(0,180,255,0.06)'
const BORDER = 'rgba(0,180,255,0.13)'
const ACCENT = '#00B4FF'
const TX     = '#E8F4FF'
const TX_MID = 'rgba(200,228,255,0.65)'
const TX_LOW = 'rgba(200,228,255,0.38)'
const GREEN  = '#22C55E'
const AMBER  = '#F59E0B'
const RED    = '#EF4444'

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Categoria {
  id:    string
  label: string
  icon:  React.ElementType
  color: string
  count: number   // artículos disponibles
}

// ── Categorías del menú ───────────────────────────────────────────────────────
const CATEGORIAS: Categoria[] = [
  { id: 'minutos',   label: 'Minutos',            icon: Timer,          color: '#A855F7', count: 1 },
  { id: 'extensiones',label:'Extensiones',         icon: Phone,          color: '#0EA5E9', count: 0 },
  { id: 'lineas',    label: 'Líneas',              icon: Wifi,           color: '#22C55E', count: 0 },
  { id: 'chat',      label: 'Chat',                icon: MessageSquare,  color: '#F59E0B', count: 0 },
  { id: 'asistente', label: 'Asistente Virtual',   icon: Bot,            color: '#F97316', count: 0 },
]

// ── Contenido: MINUTOS ────────────────────────────────────────────────────────
function SeccionMinutos() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Encabezado sección */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: TX, letterSpacing: '-0.01em', marginBottom: 6 }}>
          Minutos — Planes de Bolsa
        </h2>
        <p style={{ fontSize: 13, color: TX_MID, lineHeight: 1.7 }}>
          Referencia técnica para entender cómo se contabilizan los minutos según el tipo de llamada y el dispositivo utilizado. Útil para resolver dudas de clientes con plan de bolsa.
        </p>
      </div>

      {/* Card 1 — SIP / App */}
      <div style={{ borderRadius: 14, background: PANEL, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${BORDER}`,
          background: 'rgba(168,85,247,0.08)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Phone size={16} style={{ color: '#A855F7' }} />
          <p style={{ fontSize: 14, fontWeight: 800, color: TX }}>
            En SIP (softphone / teléfono IP) o App / my.callpicker
          </p>
        </div>
        <div style={{ padding: '0 20px 4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Tipo de llamada', 'Dirección', 'Destino', 'Se contabiliza'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px 10px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: TX_LOW,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    borderBottom: `1px solid ${BORDER}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { tipo: 'Llamada saliente', dir: 'saliente', destino: 'Celular',  regla: 'Por minuto',                   color: AMBER  },
                { tipo: 'Llamada saliente', dir: 'saliente', destino: 'Fijo',     regla: 'Por llamada (sin importar duración)', color: GREEN },
                { tipo: 'Llamada contestada', dir: 'entrante', destino: 'En SIP', regla: 'Por llamada (sin importar duración)', color: GREEN },
                { tipo: 'Llamada contestada', dir: 'entrante', destino: 'En celular', regla: 'Por minuto',               color: AMBER  },
                { tipo: 'Llamada contestada', dir: 'entrante', destino: 'En fijo',    regla: 'Por llamada (sin importar duración)', color: GREEN },
              ].map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '11px 14px', color: TX, fontSize: 13, fontWeight: 600 }}>{r.tipo}</td>
                  <td style={{ padding: '11px 14px' }}>
                    {r.dir === 'saliente'
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>
                          <ArrowUpRight size={12} /> Saliente
                        </span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#22C55E' }}>
                          <ArrowDownLeft size={12} /> Entrante
                        </span>
                    }
                  </td>
                  <td style={{ padding: '11px 14px', color: TX_MID, fontSize: 13 }}>{r.destino}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                      color: r.color, background: `${r.color}18`,
                    }}>
                      {r.regla}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2 — Entre extensiones */}
      <div style={{ borderRadius: 14, background: PANEL, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${BORDER}`,
          background: 'rgba(0,180,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Phone size={16} style={{ color: ACCENT }} />
          <p style={{ fontSize: 14, fontWeight: 800, color: TX }}>
            Llamadas entre extensiones
          </p>
        </div>
        <div style={{ padding: '0 20px 4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Origen', 'Destino', 'Descuento de minutos'].map(h => (
                  <th key={h} style={{
                    padding: '12px 14px 10px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: TX_LOW,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    borderBottom: `1px solid ${BORDER}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { origen: 'Ext. SIP',      destino: 'Ext. SIP',                  regla: '1 min (sin importar duración)', color: GREEN },
                { origen: 'Ext. App / my', destino: 'Ext. SIP',                  regla: '1 min (sin importar duración)', color: GREEN },
                { origen: 'Ext. SIP',      destino: 'Ext. con número celular',   regla: 'Totalidad de minutos usados',   color: RED   },
                { origen: 'Ext. SIP',      destino: 'Ext. con número fijo',      regla: '1 min (sin importar duración)', color: GREEN },
              ].map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '11px 14px', color: TX, fontSize: 13, fontWeight: 600 }}>{r.origen}</td>
                  <td style={{ padding: '11px 14px', color: TX_MID, fontSize: 13 }}>{r.destino}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                      color: r.color, background: `${r.color}18`,
                    }}>
                      {r.regla}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Callout alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{
          padding: '16px 18px', borderRadius: 12,
          background: `${RED}0F`, border: `1px solid ${RED}30`,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <AlertCircle size={18} style={{ color: RED, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: RED, marginBottom: 4 }}>Atención — Celular a celular</p>
            <p style={{ fontSize: 12, color: TX_MID, lineHeight: 1.6 }}>
              Cuando la extensión destino tiene número celular asignado, se descuenta la <strong style={{ color: TX }}>totalidad de los minutos reales</strong> de la llamada. Es el escenario de mayor consumo.
            </p>
          </div>
        </div>
        <div style={{
          padding: '16px 18px', borderRadius: 12,
          background: `${GREEN}0F`, border: `1px solid ${GREEN}30`,
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <CheckCircle2 size={18} style={{ color: GREEN, flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: GREEN, marginBottom: 4 }}>Eficiencia — Fijo siempre = 1 min</p>
            <p style={{ fontSize: 12, color: TX_MID, lineHeight: 1.6 }}>
              Todas las llamadas hacia o desde número fijo (y extensiones SIP-SIP) cuentan como <strong style={{ color: TX }}>1 minuto fijo</strong>, sin importar cuánto dure la llamada.
            </p>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div style={{
        padding: '14px 18px', borderRadius: 12,
        background: PANEL2, border: `1px solid ${BORDER}`,
        display: 'flex', gap: 10, alignItems: 'flex-start',
      }}>
        <Info size={15} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12, color: TX_MID, lineHeight: 1.7 }}>
          Esta lógica aplica únicamente a <strong style={{ color: TX }}>planes con bolsa de minutos</strong>.
          Los planes ilimitados no contabilizan minutos. Ante dudas de un cliente sobre su consumo,
          verificar siempre el tipo de extensión destino (SIP, App, celular o fijo) y el historial de
          llamadas en el panel de administrador.
        </p>
      </div>
    </div>
  )
}

// ── Placeholder para categorías sin contenido ─────────────────────────────────
function Proximamente({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 320, gap: 16, opacity: 0.55,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Info size={22} style={{ color: TX_LOW }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: TX_MID, marginBottom: 6 }}>
          {label} — Próximamente
        </p>
        <p style={{ fontSize: 12, color: TX_LOW }}>
          Agrega contenido desde el equipo de Éxito del Cliente.
        </p>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function BaseCSPage() {
  const [activa, setActiva] = useState('minutos')

  const cat = CATEGORIAS.find(c => c.id === activa)!

  return (
    <div style={{ minHeight: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '26px 32px 22px',
        borderBottom: `1px solid ${BORDER}`,
        background: 'linear-gradient(180deg, rgba(0,180,255,0.07) 0%, transparent 100%)',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: TX, letterSpacing: '-0.02em', lineHeight: 1 }}>
          Base de Conocimiento CS
        </h1>
        <p style={{ fontSize: 13, color: TX_MID, marginTop: 7 }}>
          Referencia técnica y comercial · Extensiones · Minutos · Chat · Asistente Virtual · Líneas
        </p>
      </div>

      {/* Cuerpo: nav izquierda + contenido derecha */}
      <div style={{ display: 'flex', flex: 1, gap: 0 }}>

        {/* ── Nav categorías ──────────────────────────────────────────────── */}
        <nav style={{
          width: 220, flexShrink: 0, padding: '20px 12px',
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: TX_LOW,
            textTransform: 'uppercase', letterSpacing: '0.09em',
            padding: '0 8px 10px',
          }}>Categorías</p>

          {CATEGORIAS.map(c => {
            const Icon = c.icon
            const isActive = activa === c.id
            return (
              <button
                key={c.id}
                onClick={() => setActiva(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10, width: '100%',
                  textAlign: 'left', cursor: 'pointer', transition: 'all 150ms',
                  background:   isActive ? `${c.color}18` : 'transparent',
                  border:       isActive ? `1px solid ${c.color}35` : '1px solid transparent',
                  borderLeft:   isActive ? `3px solid ${c.color}` : '3px solid transparent',
                }}
              >
                <Icon size={15} style={{ color: isActive ? c.color : TX_LOW, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? TX : TX_MID, flex: 1 }}>
                  {c.label}
                </span>
                {c.count > 0
                  ? <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                      background: `${c.color}25`, color: c.color,
                    }}>{c.count}</span>
                  : <span style={{
                      fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.05)', color: TX_LOW,
                    }}>pronto</span>
                }
              </button>
            )
          })}
        </nav>

        {/* ── Contenido ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '28px 32px 56px', overflowY: 'auto' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, opacity: 0.65 }}>
            <span style={{ fontSize: 12, color: TX_LOW }}>Base de Conocimiento</span>
            <ChevronRight size={12} style={{ color: TX_LOW }} />
            <span style={{ fontSize: 12, color: cat.color, fontWeight: 600 }}>{cat.label}</span>
          </div>

          {activa === 'minutos'    && <SeccionMinutos />}
          {activa === 'extensiones'&& <Proximamente label="Extensiones" />}
          {activa === 'lineas'     && <Proximamente label="Líneas" />}
          {activa === 'chat'       && <Proximamente label="Chat" />}
          {activa === 'asistente'  && <Proximamente label="Asistente Virtual" />}
        </div>
      </div>
    </div>
  )
}
