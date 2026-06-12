'use client'
import { useState, useMemo } from 'react'
import {
  Timer, Phone, Wifi, Wrench, GitBranch, Zap,
  Headphones, BarChart3, Bot, Code, Settings2,
  MessageSquare, ChevronRight, MapPin, Lightbulb,
  AlertTriangle, Info, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Search,
  ShieldCheck, Puzzle, Globe, FileText, LifeBuoy,
  Heart,
} from 'lucide-react'
import { KB, type Categoria, type Articulo } from './kb-data'

// ── Paleta ────────────────────────────────────────────────────────────────────
const BG     = '#EFF6FF'
const PANEL  = '#FFFFFF'
const BORDER = '#BFDBFE'
const TX     = '#0F172A'
const TX_MID = '#475569'
const TX_LOW = '#94A3B8'
const GREEN  = '#16A34A'
const AMBER  = '#D97706'
const RED    = '#DC2626'
const ACCENT = '#0057FF'

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
  seguridad:      ShieldCheck,
  integraciones:  Puzzle,
  cobertura:      Globe,
  soporte:        LifeBuoy,
  'callpicker-sac': Heart,
}

// ── KB ordenado alfabéticamente ───────────────────────────────────────────────
const KB_SORTED = [...KB].sort((a, b) => a.label.localeCompare(b.label, 'es'))

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
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 8 }}>
      <Icon size={15} style={{ color, flexShrink: 0, marginTop: 2 }} />
      <span style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>{texto}</span>
    </div>
  )
}

// ── Tarjeta de artículo ───────────────────────────────────────────────────────
function ArticuloCard({ art, catColor }: { art: Articulo; catColor: string }) {
  const [open, setOpen] = useState(false)
  const hasExtra = !!(art.tarificacion || art.funcionamiento || art.consideraciones ||
    art.modalidades || art.acciones || art.graficas || art.apis || art.subtitulos || art.utilidad || art.bloques)

  return (
    <div style={{
      borderRadius: 12, background: PANEL, border: `1px solid ${BORDER}`,
      overflow: 'hidden', marginBottom: 12,
    }}>
      {/* Header del artículo */}
      <button
        onClick={() => hasExtra && setOpen(v => !v)}
        style={{
          width: '100%', padding: '18px 22px', textAlign: 'left',
          background: 'transparent', border: 'none',
          cursor: hasExtra ? 'pointer' : 'default',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          {/* Título + badge + PDF */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: TX }}>{art.titulo}</p>
            {art.badge && <Badge type={art.badge} />}
            {art.pdfUrl && (
              <a
                href={art.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                  background: `${catColor}18`, color: catColor,
                  border: `1px solid ${catColor}35`, textDecoration: 'none',
                  transition: 'opacity 150ms',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <FileText size={11} />
                Ver PDF
              </a>
            )}
          </div>
          <p style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>{art.descripcion}</p>
          {art.ubicacion && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
              <MapPin size={12} style={{ color: catColor }} />
              <span style={{ fontSize: 12, color: catColor, fontWeight: 600 }}>{art.ubicacion}</span>
            </div>
          )}
          {art.utilidad && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10,
              padding: '10px 14px', borderRadius: 8,
              background: `${catColor}0F`, border: `1px solid ${catColor}25` }}>
              <Lightbulb size={14} style={{ color: catColor, flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 13, color: TX_MID }}><strong style={{ color: catColor }}>Utilidad: </strong>{art.utilidad}</span>
            </div>
          )}
        </div>
        {hasExtra && (
          <div style={{ color: TX_LOW, flexShrink: 0, marginTop: 3 }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        )}
      </button>

      {/* Contenido expandido */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${BORDER}` }}>

          {/* Tarificación */}
          {art.tarificacion && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Tarificación
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {art.tarificacion.map((t, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : '#F0F7FF' }}>
                      <td style={{ padding: '11px 14px', color: TX_MID, fontSize: 14, borderBottom: `1px solid ${BORDER}` }}>{t.tipo}</td>
                      <td style={{ padding: '11px 14px', borderBottom: `1px solid ${BORDER}`, textAlign: 'right' }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700, padding: '3px 12px', borderRadius: 6,
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
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Modalidades</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {art.modalidades.map((m, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: `${catColor}0A`, border: `1px solid ${catColor}20` }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: catColor, marginBottom: 4 }}>{m.nombre}</p>
                    <p style={{ fontSize: 14, color: TX_MID, lineHeight: 1.6 }}>{m.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Funcionamiento */}
          {art.funcionamiento && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Funcionamiento</p>
              {art.funcionamiento.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: catColor, minWidth: 22, paddingTop: 2 }}>{i + 1}.</span>
                  <span style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Acciones */}
          {art.acciones && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Acciones disponibles</p>
              {art.acciones.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                  <CheckCircle2 size={15} style={{ color: GREEN, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, color: TX_MID }}>{a}</span>
                </div>
              ))}
            </div>
          )}

          {/* Subtítulos con listas */}
          {art.subtitulos && art.subtitulos.map((s, si) => (
            <div key={si} style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{s.titulo}</p>
              {s.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0, marginTop: 7 }} />
                  <span style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>{item}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Gráficas */}
          {art.graficas && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Gráficas disponibles ({art.graficas.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {art.graficas.map((g, i) => (
                  <span key={i} style={{
                    fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                    background: `${catColor}12`, color: TX_MID, border: `1px solid ${catColor}20`,
                  }}>{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* APIs */}
          {art.apis && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>APIs disponibles</p>
              {art.apis.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8,
                  padding: '8px 12px', borderRadius: 8, background: `${catColor}0A`, border: `1px solid ${catColor}20` }}>
                  <code style={{ fontSize: 13, fontWeight: 800, color: catColor, flexShrink: 0 }}>{a.nombre}</code>
                  <span style={{ fontSize: 13, color: TX_MID }}>{a.descripcion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Consideraciones */}
          {art.consideraciones && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Consideraciones</p>
              {art.consideraciones.map((c, i) => <Consideracion key={i} {...c} />)}
            </div>
          )}

          {/* Bloques editoriales */}
          {art.bloques && (
            <div style={{ marginTop: 20, maxWidth: 780 }}>
              {art.bloques.map((b, i) => {
                if (b.tipo === 'seccion') return (
                  <div key={i} style={{ marginTop: 32, marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${catColor}30` }}>
                    <span style={{ display: 'inline-block', width: 4, height: 20, background: catColor, borderRadius: 2, marginRight: 10, verticalAlign: 'middle' }} />
                    <span style={{ fontSize: 17, fontWeight: 800, color: TX, letterSpacing: '-0.01em' }}>{b.titulo}</span>
                  </div>
                )
                if (b.tipo === 'parrafo') return (
                  <p key={i} style={{ fontSize: 15, color: '#374151', lineHeight: 1.85, textAlign: 'justify', marginBottom: 16 }}>
                    {b.texto}
                  </p>
                )
                if (b.tipo === 'cita') return (
                  <blockquote key={i} style={{
                    margin: '24px 0', padding: '18px 22px',
                    borderLeft: `4px solid ${catColor}`,
                    background: `${catColor}08`,
                    borderRadius: '0 10px 10px 0',
                  }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: TX, lineHeight: 1.75, fontStyle: 'italic', margin: 0, textAlign: 'justify' }}>
                      {b.texto}
                    </p>
                  </blockquote>
                )
                if (b.tipo === 'lista') return (
                  <ul key={i} style={{ margin: '8px 0 20px', paddingLeft: 0, listStyle: 'none' }}>
                    {b.items?.map((item, ii) => (
                      <li key={ii} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0, marginTop: 8 }} />
                        <span style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, textAlign: 'justify', flex: 1 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                )
                if (b.tipo === 'firma') return (
                  <div key={i} style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${BORDER}`, textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: catColor, fontStyle: 'italic' }}>{b.texto}</span>
                  </div>
                )
                return null
              })}
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

  const cat = KB_SORTED.find(c => c.id === activa)!
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

  const totalArticulos = KB_SORTED.reduce((s, c) => s + c.articulos.length, 0)

  return (
    <div style={{ minHeight: '100%', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        padding: '24px 32px 20px',
        borderBottom: `1px solid ${BORDER}`,
        background: 'linear-gradient(180deg, rgba(0,87,255,0.05) 0%, transparent 100%)',
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
          <p style={{ fontSize: 11, fontWeight: 700, color: TX_LOW, textTransform: 'uppercase', letterSpacing: '0.09em', padding: '0 8px 10px' }}>
            Categorías
          </p>
          {KB_SORTED.map(c => {
            const CIcon = CAT_ICONS[c.id] ?? Info
            const isActive = activa === c.id
            const count = c.articulos.length
            return (
              <button key={c.id} onClick={() => { setActiva(c.id); setQuery('') }} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 9, width: '100%',
                textAlign: 'left', cursor: 'pointer', transition: 'all 150ms',
                background:   isActive ? `${c.color}18` : 'transparent',
                border:       isActive ? `1px solid ${c.color}35` : '1px solid transparent',
                borderLeft:   isActive ? `3px solid ${c.color}` : '3px solid transparent',
              }}>
                <CIcon size={15} style={{ color: isActive ? c.color : TX_LOW, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? TX : TX_MID, flex: 1, lineHeight: 1.3 }}>
                  {c.label}
                </span>
                {count > 0
                  ? <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: `${c.color}25`, color: c.color }}>{count}</span>
                  : <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: 'rgba(0,87,255,0.06)', color: TX_LOW }}>pronto</span>
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
              <span style={{ fontSize: 13, color: TX_LOW }}>Base de Conocimiento</span>
              <ChevronRight size={13} style={{ color: TX_LOW }} />
              <span style={{ fontSize: 13, color: cat.color, fontWeight: 700 }}>{cat.label}</span>
            </div>
            {cat.articulos.length > 3 && (
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: TX_LOW }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar en esta categoría..."
                  style={{
                    paddingLeft: 32, paddingRight: 14, paddingTop: 8, paddingBottom: 8,
                    borderRadius: 8, fontSize: 13, background: PANEL,
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
              <h2 style={{ fontSize: 21, fontWeight: 800, color: TX, lineHeight: 1 }}>{cat.label}</h2>
              <p style={{ fontSize: 13, color: TX_LOW, marginTop: 4 }}>{artsFiltrados.length} artículo{artsFiltrados.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Artículos */}
          {artsFiltrados.length > 0
            ? artsFiltrados.map(art => <ArticuloCard key={art.id} art={art} catColor={cat.color} />)
            : (
              <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                {cat.articulos.length === 0
                  ? <><p style={{ fontSize: 16, color: TX_MID, fontWeight: 700, marginBottom: 8 }}>Próximamente</p><p style={{ fontSize: 14, color: TX_LOW }}>Contenido en preparación para esta categoría.</p></>
                  : <><p style={{ fontSize: 16, color: TX_MID, fontWeight: 700, marginBottom: 8 }}>Sin resultados</p><p style={{ fontSize: 14, color: TX_LOW }}>Intenta con otros términos de búsqueda.</p></>
                }
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
