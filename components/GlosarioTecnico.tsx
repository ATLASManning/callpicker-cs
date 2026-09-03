'use client'
import { useState, useMemo } from 'react'
import { Search, AlertTriangle, ArrowRight } from 'lucide-react'
import { GLOSARIO, CATEGORIAS_GLOSARIO, type TerminoGlosario } from '@/lib/glosario'
import { integracionDe, PROTOCOLO_SIN_INTEGRACION } from '@/lib/integraciones-catalogo'
import {
  DOCE_ESENCIALES, SEGUNDA_OLA, PRECISIONES, NIVELES_EVOLUCION,
  PREGUNTAS_PERFILAMIENTO, TABLA_EVOLUCION, REGLA_COMERCIAL,
} from '@/lib/perfilamiento'

/**
 * Diccionario técnico-comercial dentro de la Base de Conocimiento.
 *
 * Cuatro vistas porque son cuatro usos distintos: buscar un término durante una
 * llamada, repasar las confusiones antes de cotizar, preparar el descubrimiento
 * de una cuenta, y explicar una migración. Meterlas en una sola pantalla las
 * volvería ilegibles.
 */

const BORDER = '#BFDBFE'
const PANEL  = '#FFFFFF'
const TX     = '#0F172A'
const TX_MID = '#475569'
const TX_LOW = '#94A3B8'

type Vista = 'terminos' | 'precisiones' | 'perfilamiento' | 'evolucion'

const VISTAS: Array<{ id: Vista; label: string; nota: string }> = [
  { id: 'terminos',      label: 'Términos',      nota: 'Buscar durante una llamada' },
  { id: 'precisiones',   label: 'Precisiones',   nota: 'Las confusiones que cuestan dinero' },
  { id: 'perfilamiento', label: 'Perfilamiento', nota: 'Qué preguntarle al cliente' },
  { id: 'evolucion',     label: 'Evolución',     nota: 'Dónde está y hacia dónde va' },
]

const norm = (s: string) => s.toLowerCase().normalize('NFD')
  .split('').filter(c => { const x = c.codePointAt(0) ?? 0; return x < 0x0300 || x > 0x036f }).join('')

const ESENCIALES = new Set<string>(DOCE_ESENCIALES.map(norm))
const SEGUNDA    = new Set<string>(SEGUNDA_OLA.map(norm))

const colorDe = (catId: string) =>
  CATEGORIAS_GLOSARIO.find(c => c.id === catId)?.color ?? '#64748B'
const labelDe = (catId: string) =>
  CATEGORIAS_GLOSARIO.find(c => c.id === catId)?.label ?? catId

function FichaTermino({ t }: { t: TerminoGlosario }) {
  const color = colorDe(t.cat)
  const esencial = ESENCIALES.has(norm(t.t))
  const segunda  = !esencial && SEGUNDA.has(norm(t.t))
  return (
    <div className="break-inside-avoid mb-3" style={{
      background: PANEL, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${color}`,
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: TX, lineHeight: 1.2 }}>{t.t}</span>
        {t.sig && <span style={{ fontSize: 11, color: TX_LOW, fontStyle: 'italic' }}>{t.sig}</span>}
        {esencial && (
          <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, background: '#0057FF18', color: '#0057FF', letterSpacing: '0.04em' }}>
            ESENCIAL
          </span>
        )}
        {segunda && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: '#A855F715', color: '#A855F7', letterSpacing: '0.04em' }}>
            2ª CAPA
          </span>
        )}
        <span style={{ fontSize: 10, color: color, marginLeft: 'auto', fontWeight: 600 }}>{labelDe(t.cat)}</span>
      </div>

      <p style={{ fontSize: 13, color: TX_MID, lineHeight: 1.55, marginBottom: t.sirve || t.com || t.ej || t.ojo ? 8 : 0 }}>
        {t.def}
      </p>

      {t.sirve && (
        <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.5, marginBottom: t.com || t.ej || t.ojo ? 6 : 0 }}>
          <span style={{ color: TX_LOW, fontWeight: 700 }}>Sirve para · </span>{t.sirve}
        </p>
      )}

      {t.com && (
        <p style={{ fontSize: 12.5, color: TX, lineHeight: 1.5, marginBottom: t.ej || t.ojo ? 6 : 0 }}>
          <span style={{ color, fontWeight: 700 }}>Comercial · </span>{t.com}
        </p>
      )}

      {t.ej && (
        <p style={{
          fontSize: 12, color: TX_MID, lineHeight: 1.5, marginBottom: t.ojo ? 6 : 0,
          background: '#F0F7FF', borderRadius: 6, padding: '6px 9px',
        }}>
          <span style={{ color: TX_LOW, fontWeight: 700 }}>Ej. </span>{t.ej}
        </p>
      )}

      {t.ojo && (
        <p style={{
          fontSize: 12, color: '#9A3412', lineHeight: 1.5,
          background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 6, padding: '6px 9px',
          marginBottom: t.cat === 'plataformas' ? 6 : 0,
        }}>
          <span style={{ fontWeight: 800 }}>Ojo · </span>{t.ojo}
        </p>
      )}

      {/* Estado real de integración, leído del Catálogo 2026. Va aquí y no en
          una nota suelta porque es el dato que decide si se puede comprometer
          un alcance con el cliente. */}
      {t.cat === 'plataformas' && (() => {
        const i = integracionDe(t.t)
        return i ? (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: '7px 9px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#15803D', marginBottom: 3 }}>
              ✓ Integración disponible · {i.fuente}
            </p>
            {i.alcances.map((a, k) => (
              <p key={k} style={{ fontSize: 11.5, color: '#166534', lineHeight: 1.45 }}>{a}</p>
            ))}
          </div>
        ) : (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '7px 9px' }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#B45309', marginBottom: 4 }}>
              ◇ {PROTOCOLO_SIN_INTEGRACION.titulo}
            </p>
            <p style={{ fontSize: 11.5, color: '#92400E', lineHeight: 1.45, marginBottom: 3 }}>
              Se puede evaluar una prueba si se cumplen las dos:
            </p>
            <ul style={{ marginBottom: 4 }}>
              {PROTOCOLO_SIN_INTEGRACION.condiciones.map((c, k) => (
                <li key={k} style={{ fontSize: 11.5, color: '#92400E', lineHeight: 1.45, display: 'flex', gap: 6 }}>
                  <span style={{ fontWeight: 800 }}>{k + 1}.</span><span>{c}</span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: 11.5, color: '#92400E', lineHeight: 1.45, fontWeight: 700 }}>
              {PROTOCOLO_SIN_INTEGRACION.canalizacion}
            </p>
            <p style={{ fontSize: 11, color: '#A16207', lineHeight: 1.45, marginTop: 3 }}>
              {PROTOCOLO_SIN_INTEGRACION.limite}
            </p>
          </div>
        )
      })()}
    </div>
  )
}

export default function GlosarioTecnico() {
  const [vista, setVista] = useState<Vista>('terminos')
  const [query, setQuery] = useState('')
  const [catFiltro, setCatFiltro] = useState<string>('todas')
  const [soloEsenciales, setSoloEsenciales] = useState(false)

  const filtrados = useMemo(() => {
    const q = norm(query.trim())
    return GLOSARIO.filter(t => {
      if (catFiltro !== 'todas' && t.cat !== catFiltro) return false
      if (soloEsenciales && !ESENCIALES.has(norm(t.t))) return false
      if (!q) return true
      const campos = [t.t, t.sig ?? '', ...(t.alias ?? []), t.def, t.com ?? '', t.ej ?? '', t.ojo ?? '']
      return campos.some(c => norm(c).includes(q))
    })
  }, [query, catFiltro, soloEsenciales])

  const titulo = (txt: string, sub?: string) => (
    <div style={{ marginBottom: 14 }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: TX, lineHeight: 1.2 }}>{txt}</h3>
      {sub && <p style={{ fontSize: 12.5, color: TX_LOW, marginTop: 4, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  )

  return (
    <div>
      {/* Sub-navegación */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
        {VISTAS.map(v => {
          const activa = vista === v.id
          return (
            <button key={v.id} onClick={() => setVista(v.id)} style={{
              padding: '8px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              background: activa ? '#0057FF12' : PANEL,
              border: `1px solid ${activa ? '#0057FF45' : BORDER}`,
              transition: 'all 150ms',
            }}>
              <p style={{ fontSize: 13, fontWeight: activa ? 800 : 600, color: activa ? '#0057FF' : TX_MID, lineHeight: 1.2 }}>
                {v.label}
              </p>
              <p style={{ fontSize: 10.5, color: TX_LOW, marginTop: 2 }}>{v.nota}</p>
            </button>
          )
        })}
      </div>

      {/* ── TÉRMINOS ─────────────────────────────────────────────────────── */}
      {vista === 'terminos' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ position: 'relative', flex: '0 0 280px' }}>
              <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: TX_LOW }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar término, sigla o concepto…"
                style={{
                  width: '100%', paddingLeft: 34, paddingRight: 14, paddingTop: 9, paddingBottom: 9,
                  borderRadius: 9, fontSize: 13, background: PANEL,
                  border: `1px solid ${BORDER}`, color: TX, outline: 'none',
                }}
              />
            </div>
            <button onClick={() => setSoloEsenciales(!soloEsenciales)} style={{
              padding: '9px 14px', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: soloEsenciales ? '#0057FF' : PANEL,
              color: soloEsenciales ? '#fff' : TX_MID,
              border: `1px solid ${soloEsenciales ? '#0057FF' : BORDER}`,
            }}>
              Solo los 12 esenciales
            </button>
            <span style={{ fontSize: 12, color: TX_LOW, marginLeft: 'auto' }}>
              {filtrados.length} de {GLOSARIO.length} términos
            </span>
          </div>

          {/* Filtro por categoría */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            <button onClick={() => setCatFiltro('todas')} style={{
              padding: '5px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              background: catFiltro === 'todas' ? TX : PANEL,
              color: catFiltro === 'todas' ? '#fff' : TX_MID,
              border: `1px solid ${catFiltro === 'todas' ? TX : BORDER}`,
            }}>
              Todas
            </button>
            {CATEGORIAS_GLOSARIO.map(c => {
              const activa = catFiltro === c.id
              const n = GLOSARIO.filter(t => t.cat === c.id).length
              return (
                <button key={c.id} onClick={() => setCatFiltro(activa ? 'todas' : c.id)} title={c.nota} style={{
                  padding: '5px 11px', borderRadius: 20, fontSize: 11.5, fontWeight: activa ? 800 : 600, cursor: 'pointer',
                  background: activa ? `${c.color}20` : PANEL,
                  color: activa ? c.color : TX_MID,
                  border: `1px solid ${activa ? `${c.color}60` : BORDER}`,
                }}>
                  {c.label} <span style={{ opacity: 0.6 }}>{n}</span>
                </button>
              )
            })}
          </div>

          {catFiltro !== 'todas' && (
            <p style={{ fontSize: 12.5, color: TX_MID, marginBottom: 14, fontStyle: 'italic' }}>
              {CATEGORIAS_GLOSARIO.find(c => c.id === catFiltro)?.nota}
            </p>
          )}

          {filtrados.length > 0 ? (
            <div className="columns-1 lg:columns-2 2xl:columns-3" style={{ columnGap: 14 }}>
              {filtrados.map(t => <FichaTermino key={`${t.cat}-${t.t}`} t={t} />)}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 0', opacity: 0.55 }}>
              <p style={{ fontSize: 15, color: TX_MID, fontWeight: 700, marginBottom: 6 }}>Sin resultados</p>
              <p style={{ fontSize: 13, color: TX_LOW }}>Prueba con la sigla, el nombre en inglés o una palabra de la definición.</p>
            </div>
          )}
        </>
      )}

      {/* ── PRECISIONES ──────────────────────────────────────────────────── */}
      {vista === 'precisiones' && (
        <>
          {titulo(
            'Las confusiones que cuestan dinero',
            'Cada una de estas se ha convertido alguna vez en una solución mal dimensionada o en una promesa que no se pudo cumplir. Dilas antes de que el cliente las descubra.',
          )}
          <div className="columns-1 lg:columns-2" style={{ columnGap: 14 }}>
            {PRECISIONES.map((p, i) => (
              <div key={i} className="break-inside-avoid mb-3" style={{
                background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
                  <AlertTriangle size={15} style={{ color: '#F97316', flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 14, fontWeight: 800, color: TX, lineHeight: 1.3 }}>{p.titulo}</p>
                </div>
                <p style={{ fontSize: 12.5, color: '#9A3412', lineHeight: 1.5, marginBottom: 7 }}>
                  <span style={{ fontWeight: 700 }}>Se confunde así · </span>{p.confusion}
                </p>
                <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.55, marginBottom: p.ejemplo ? 7 : 0 }}>
                  <span style={{ fontWeight: 700, color: '#15803D' }}>Correcto · </span>{p.correccion}
                </p>
                {p.ejemplo && (
                  <p style={{ fontSize: 12, color: TX_MID, lineHeight: 1.5, background: '#F0F7FF', borderRadius: 6, padding: '6px 9px' }}>
                    {p.ejemplo}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── PERFILAMIENTO ────────────────────────────────────────────────── */}
      {vista === 'perfilamiento' && (
        <>
          {titulo('Qué preguntarle al cliente', REGLA_COMERCIAL)}
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3 items-start">
            {PREGUNTAS_PERFILAMIENTO.map(b => (
              <div key={b.bloque} style={{
                background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px', height: '100%',
              }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: '#0057FF', marginBottom: 5 }}>{b.bloque}</p>
                <p style={{ fontSize: 12, color: TX_LOW, lineHeight: 1.5, marginBottom: 11, fontStyle: 'italic' }}>
                  Revela: {b.revela}
                </p>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {b.preguntas.map((q, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, color: TX_MID, lineHeight: 1.5 }}>
                      <span style={{ color: '#0057FF', flexShrink: 0, fontWeight: 700 }}>?</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, background: '#0057FF08', border: '1px solid #0057FF25',
            borderRadius: 12, padding: '14px 18px',
          }}>
            <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.6 }}>
              <span style={{ fontWeight: 800, color: '#0057FF' }}>Los 12 que hay que dominar primero: </span>
              {DOCE_ESENCIALES.join(' · ')}
            </p>
            <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.6, marginTop: 6 }}>
              <span style={{ fontWeight: 800, color: '#A855F7' }}>Y después: </span>
              {SEGUNDA_OLA.join(' · ')}
            </p>
          </div>
        </>
      )}

      {/* ── EVOLUCIÓN ────────────────────────────────────────────────────── */}
      {vista === 'evolucion' && (
        <>
          {titulo(
            'Dónde está el cliente y hacia dónde va',
            'Ubícalo por la señal, no por lo que dice que tiene. Y ofrece el siguiente nivel realista: saltar del 1 al 7 no se vende, se pierde.',
          )}
          <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-4 items-start" style={{ marginBottom: 24 }}>
            {NIVELES_EVOLUCION.map(n => {
              const tono = ['#94A3B8', '#64748B', '#0EA5E9', '#0057FF', '#8B5CF6', '#A855F7', '#22C55E'][n.n - 1]
              return (
                <div key={n.n} style={{
                  background: PANEL, border: `1px solid ${BORDER}`, borderTop: `3px solid ${tono}`,
                  borderRadius: 12, padding: '14px 16px', height: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 900, color: '#fff', background: tono,
                      borderRadius: 6, padding: '2px 7px',
                    }}>{n.n}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: TX }}>{n.titulo}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.5, marginBottom: 8 }}>{n.que}</p>
                  <p style={{ fontSize: 11.5, color: TX_LOW, lineHeight: 1.5, borderTop: `1px dashed ${BORDER}`, paddingTop: 7 }}>
                    <span style={{ fontWeight: 700 }}>Señal: </span>{n.senal}
                  </p>
                </div>
              )
            })}
          </div>

          {titulo('De dónde viene cada cosa', 'La tabla para explicar una migración sin tecnicismos.')}
          <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
            {TABLA_EVOLUCION.map((r, i) => (
              <div key={i} style={{
                background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 10,
                padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ fontSize: 12.5, color: TX_LOW, flex: 1, textDecoration: 'line-through' }}>{r.antes}</span>
                <ArrowRight size={13} style={{ color: '#0057FF', flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: TX, fontWeight: 700, flex: 1 }}>{r.despues}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
