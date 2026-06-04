'use client'
import { useState, useMemo } from 'react'
import {
  Timer, Phone, Wifi, Wrench, GitBranch, Zap,
  Headphones, BarChart3, Bot, Code, Settings2,
  MessageSquare, ChevronRight, MapPin, Lightbulb,
  AlertTriangle, Info, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Search,
} from 'lucide-react'
import { KB, type Categoria, type Articulo } from './kb-data'

// ── Paleta ────────────────────────────────────────────────────────────────────
const BG     = '#050D1A'
const PANEL  = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(0,180,255,0.13)'
const TX     = '#E8F4FF'
const TX_MID = 'rgba(200,228,255,0.65)'
const TX_LOW = 'rgba(200,228,255,0.38)'
const GREEN  = '#22C55E'
const AMBER  = '#F59E0B'
const RED    = '#EF4444'
const ACCENT = '#00B4FF'

const NIVEL_COLOR = { green: GREEN, amber: AMBER, red: RED }

// ── Íconos por categoría ──────────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ElementType> = {
  minutos:      Timer,
  extensiones:  Phone,
  lineas:       Wifi,
  funcbasicas:  Wrench,
  flujo:        GitBranch,
  avanzadas:    Zap,
  callcenter:   Headphones,
  informes:     BarChart3,
  ia:           Bot,
  desarrollador:Code,
  operativas:   Settings2,
  chat:         MessageSquare,
}

// ── Componentes pequeños ──────────────────────────────────────────────────────
function Badge({ type }: { type: 'roto' | 'pronto' | 'avanzado' | 'nuevo' }) {
  const map = {
    roto:     { label: 'Roto',     bg: `${RED}20`,    color: RED    },
    pronto:   { label: 'Pronto',   bg: 'rgba(255,255,255,0.08)', color: TX_LOW },
    avanzado: { label: 'Avanzado', bg: `${AMBER}20`,  color: AMBER  },
    nuevo:    { label: 'Nuevo',    bg: `${GREEN}20`,  color: GREEN  },
  }
  const s = map[type]
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function Consideracion({ texto, tipo }: { texto: string; tipo?: string }) {
  const icon = tipo === 'warning' ? AlertTriangle
             : tipo === 'error'   ? XCircle
             : tipo === 'info'    ? Info
             : CheckCircle2
  const color = tipo === 'warning' ? AMBER
              : tipo === 'error'   ? RED
              : tipo === 'info'    ? ACCENT
              : TX_LOW
  const Icon = icon
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
      <Icon size={13} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 13, color: TX_MID, lineHeight: 1.6 }}>{texto}</span>
    </div>
  )
}

// ── Tarjeta de artículo ───────────────────────────────────────────────────────
function ArticuloCard({ art, catColor }: { art: Articulo; catColor: string }) {
  const [open, setOpen] = useState(false)
  const hasExtra = !!(art.tarificacion || art.funcionamiento || art.consideraciones ||
    art.modalidades || art.acciones || art.graficas || art.apis || art.subtitulos || art.utilidad)

  return (
    <div style={{
      borderRadius: 12, background: PANEL, border: `1px solid ${BORDER}`,
      overflow: 'hidden', marginBottom: 12,
    }}>
      {/* Header del artículo */}
      <button
        onClick={() => hasExtra && setOpen(v => !v)}
        style={{
          width: '100%', padding: '16px 20px', textAlign: 'left',
          background: 'transparent', border: 'none',
          cursor: hasExtra ? 'pointer' : 'default',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: TX }}>{art.titulo}</p>
            {art.badge && <Badge type={art.badge} />}
          </div>
          <p style={{ fontSize: 13, color: TX_MID, lineHeight: 1.6 }}>{art.descripcion}</p>
          {art.ubicacion && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <MapPin size={11} style={{ color: catColor }} />
              <span style={{ fontSize: 11, color: catColor, fontWeight: 600 }}>{art.ubicacion}</span>
            </div>
          )}
          {art.utilidad && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 8,
              padding: '8px 12px', borderRadius: 8,
              background: `${catColor}0F`, border: `1px solid ${catColor}25` }}>
              <Lightbulb size={12} style={{ color: catColor, flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: TX_MID }}><strong style={{ color: catColor }}>Utilidad: </strong>{art.utilidad}</span>
            </div>
          )}
        </div>
        {hasExtra && (
          <div style={{ color: TX_LOW, flexShrink: 0, marginTop: 2 }}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </button>

      {/* Contenido expandido */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${BORDER}` }}>

          {/* Tarificación */}
          {art.tarificacion && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Tarificación
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {art.tarificacion.map((t, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '9px 12px', color: TX_MID, fontSize: 13, borderBottom: `1px solid ${BORDER}` }}>{t.tipo}</td>
                      <td style={{ padding: '9px 12px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 6,
                          color: NIVEL_COLOR[t.nivel], background: `${NIVEL_COLOR[t.nivel]}18`,
                        }}>{t.regla}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Modalidades */}
          {art.modalidades && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Modalidades</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {art.modalidades.map((m, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: `${catColor}0A`, border: `1px solid ${catColor}20` }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: catColor, marginBottom: 3 }}>{m.nombre}</p>
                    <p style={{ fontSize: 12, color: TX_MID }}>{m.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funcionamiento */}
          {art.funcionamiento && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Funcionamiento</p>
              {art.funcionamiento.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: catColor, minWidth: 20, paddingTop: 2 }}>{i + 1}.</span>
                  <span style={{ fontSize: 13, color: TX_MID, lineHeight: 1.6 }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          {art.acciones && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Acciones disponibles</p>
              {art.acciones.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                  <CheckCircle2 size={13} style={{ color: GREEN, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: TX_MID }}>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* Subtítulos con listas */}
          {art.subtitulos && art.subtitulos.map((s, si) => (
            <div key={si} style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{s.titulo}</p>
              {s.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0, marginTop: 6 }} />
                  <span style={{ fontSize: 13, color: TX_MID, lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Gráficas */}
          {art.graficas && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Gráficas disponibles ({art.graficas.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {art.graficas.map((g, i) => (
                  <span key={i} style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    background: `${catColor}12`, color: TX_MID, border: `1px solid ${catColor}20`,
                  }}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* APIs */}
          {art.apis && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>APIs disponibles</p>
              {art.apis.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8,
                  padding: '8px 12px', borderRadius: 8, background: `${catColor}0A`, border: `1px solid ${catColor}20` }}>
                  <code style={{ fontSize: 12, fontWeight: 800, color: catColor, flexShrink: 0 }}>{a.nombre}</code>
                  <span style={{ fontSize: 12, color: TX_MID }}>{a.descripcion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Consideraciones */}
          {art.consideraciones && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Consideraciones</p>
              {art.consideraciones.map((c, i) => <Consideracion key={i} {...c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function BaseCSPage() {
  const [activa, setActiva] = useState('minutos')
  const [query,  setQuery]  = useState('')

  const cat = KB.find(c => c.id === activa)!
  const Icon = CAT_ICONS[activa] ?? Info

  const artsFiltrados = useMemo(() => {
    if (!query.trim()) return cat.articulos
    const q = query.toLowerCase()
    return cat.articulos.filter(a =>
      a.titulo.toLowerCase().includes(q) ||
      a.descripcion.toLowerCase().includes(q) ||
      a.consideraciones?.some(c => c.texto.toLowerCase().includes(q))
    )
  }, [cat, query])

  const totalArticulos = KB.reduce((s, c) => s + c.articulos.length, 0)

  return (
    <div style={{ minHeight: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '24px 32px 20px',
        borderBottom: `1px solid ${BORDER}`,
        background: 'linear-gradient(180deg, rgba(0,180,255,0.07) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: TX, letterSpacing: '-0.02em', lineHeight: 1 }}>
              Base de Conocimiento CS
            </h1>
            <p style={{ fontSize: 12, color: TX_MID, marginTop: 6 }}>
              {KB.length} categorías · {totalArticulos} artículos
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Nav izquierda ──────────────────────────────────────────────── */}
        <nav style={{
          width: 210, flexShrink: 0, padding: '16px 10px',
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', gap: 2,
          overflowY: 'auto',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.09em', padding: '0 8px 8px' }}>
            Categorías
          </p>
          {KB.map(c => {
            const CIcon = CAT_ICONS[c.id] ?? Info
            const isActive = activa === c.id
            const count = c.articulos.length
            return (
              <button key={c.id} onClick={() => { setActiva(c.id); setQuery('') }} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 10px', borderRadius: 9, width: '100%',
                textAlign: 'left', cursor: 'pointer', transition: 'all 150ms',
                background:   isActive ? `${c.color}18` : 'transparent',
                border:       isActive ? `1px solid ${c.color}35` : '1px solid transparent',
                borderLeft:   isActive ? `3px solid ${c.color}` : '3px solid transparent',
              }}>
                <CIcon size={14} style={{ color: isActive ? c.color : TX_LOW, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? TX : TX_MID, flex: 1, lineHeight: 1.2 }}>
                  {c.label}
                </span>
                {count > 0
                  ? <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 10, background: `${c.color}25`, color: c.color }}>{count}</span>
                  : <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: TX_LOW }}>pronto</span>
                }
              </button>
            )
          })}
        </nav>

        {/* ── Contenido ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '24px 28px 56px', overflowY: 'auto' }}>

          {/* Breadcrumb + búsqueda */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: TX_LOW }}>Base de Conocimiento</span>
              <ChevronRight size={11} style={{ color: TX_LOW }} />
              <span style={{ fontSize: 11, color: cat.color, fontWeight: 700 }}>{cat.label}</span>
            </div>
            {cat.articulos.length > 3 && (
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: TX_LOW }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar en esta categoría..."
                  style={{
                    paddingLeft: 30, paddingRight: 14, paddingTop: 7, paddingBottom: 7,
                    borderRadius: 8, fontSize: 12, background: PANEL,
                    border: `1px solid ${BORDER}`, color: TX, outline: 'none', width: 220,
                  }}
                />
              </div>
            )}
          </div>

          {/* Título categoría */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}18`, border: `1px solid ${cat.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} style={{ color: cat.color }} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: TX, lineHeight: 1 }}>{cat.label}</h2>
              <p style={{ fontSize: 11, color: TX_LOW, marginTop: 3 }}>{artsFiltrados.length} artículo{artsFiltrados.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Artículos */}
          {artsFiltrados.length > 0
            ? artsFiltrados.map(art => <ArticuloCard key={art.id} art={art} catColor={cat.color} />)
            : (
              <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                {cat.articulos.length === 0
                  ? <><p style={{ fontSize: 14, color: TX_MID, fontWeight: 700, marginBottom: 6 }}>Próximamente</p><p style={{ fontSize: 12, color: TX_LOW }}>Contenido en preparación para esta categoría.</p></>
                  : <><p style={{ fontSize: 14, color: TX_MID, fontWeight: 700, marginBottom: 6 }}>Sin resultados</p><p style={{ fontSize: 12, color: TX_LOW }}>Intenta con otros términos de búsqueda.</p></>
                }
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
