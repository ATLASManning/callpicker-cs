'use client'
import { useState, useMemo, Fragment } from 'react'
import {
  Timer, Phone, Wifi, Wrench, GitBranch, Zap,
  Headphones, BarChart3, Bot, Code, Settings2,
  MessageSquare, ChevronRight, MapPin, Lightbulb,
  AlertTriangle, Info, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Search,
  ShieldCheck, Puzzle, Globe, FileText, LifeBuoy,
  // `Heart` se fue con la categoría de bienvenida: era su único uso.
  ExternalLink, Cpu, BookMarked, Download, Eye, EyeOff,
} from 'lucide-react'
import { KB, type Categoria, type Articulo } from './kb-data'
import GlosarioTecnico from '@/components/GlosarioTecnico'
import TelefonosIP from '@/components/TelefonosIP'
import { TELEFONOS_COMPATIBLES } from '@/lib/telefonos-ip'
import { GLOSARIO } from '@/lib/glosario'

// ── Paleta ────────────────────────────────────────────────────────────────────
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

/** La forma de las pastillas de acción de un artículo. Estaba copiada cuatro
 *  veces con los mismos ocho valores: cambiar el tamaño obligaba a acertar en
 *  las cuatro, y bastaba fallar en una para que la fila quedara desalineada. */
const ACCION_BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
  transition: 'opacity 150ms', lineHeight: 1.4,
}

// ── Enlaces dentro de texto ───────────────────────────────────────────────────
// Los artículos de Integraciones traen la URL de documentación oficial dentro
// del propio texto del alcance. Sin esto quedaban como texto muerto: el asesor
// tenía que copiarlas a mano.
const RX_URL = /(https?:\/\/\S+)/g

function conEnlaces(texto: string): React.ReactNode {
  const partes = texto.split(RX_URL)
  if (partes.length === 1) return texto
  // Nunca usar RX_URL.test() aquí: al ser global mantiene `lastIndex` entre
  // llamadas y alternaría true/false sobre la misma cadena.
  return partes.map((p, i) => {
    if (!p.startsWith('http')) return <span key={i}>{p}</span>
    // La puntuación de la frase no forma parte de la URL: se recorta todo lo
    // final que no sea un carácter válido de URL.
    const url   = p.replace(/[^\w/=&?#-]+$/, '')
    const cola  = p.slice(url.length)
    const label = url.slice(url.indexOf('://') + 3)
    return (
      <span key={i}>
        <a href={url} target="_blank" rel="noopener noreferrer"
           style={{ color: ACCENT, fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}>
          {label}
        </a>
        {cola}
      </span>
    )
  })
}

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
  'asistente-virtual':  Cpu,
}

/* ── El orden de las categorías ───────────────────────────────────────────
 *
 * Antes era ALFABÉTICO, con la bienvenida «Callpicker SAC» clavada al inicio.
 * El alfabeto no es un criterio: pone «Avanzadas» antes que «Extensiones» sin
 * que eso signifique nada, y obliga a recorrer la lista entera para encontrar
 * lo que se busca. Esta pantalla se abre CON UN CLIENTE AL TELÉFONO, así que
 * el orden tiene que seguir cómo se usa el producto, no cómo se deletrea.
 *
 * Se agrupan por materia y los grupos van de lo que se contrata a lo que lo
 * respalda. Una categoría que no esté aquí abajo NO desaparece: cae al final,
 * en su propio grupo, para que añadir una nueva no la esconda.
 */
const GRUPOS: { titulo: string; categorias: string[] }[] = [
  // 1 · Lo primero que se pregunta en una llamada, y lo único que el asesor no
  //     puede improvisar: son cifras y reglas de cobro.
  { titulo: 'Su plan y sus números',   categorias: ['minutos', 'extensiones', 'lineas', 'cobertura'] },
  // 2 · La segunda pregunta: «¿por qué no se asignó esa llamada?». Las tres son
  //     un solo recorrido —DID → horario → menú → grupo/fila → extensión— que
  //     el alfabeto tenía partido en tres sitios.
  { titulo: 'Enrutamiento de llamadas', categorias: ['flujo', 'callcenter', 'operativas'] },
  // 3 · El «¿se puede…?» de alto volumen y bajo riesgo. `informes` va aquí y no
  //     suelta porque su contenido ya está entrelazado con `avanzadas`:
  //     «Exportar Llamadas a Excel» es vecina de «Panel de Gráficas», y
  //     «Enviar Alerta de Llamada Perdida vía SMS» es casi el mismo artículo
  //     que «Alertas Personalizadas de Llamadas Perdidas».
  { titulo: 'Funciones y reportes',    categorias: ['funcbasicas', 'avanzadas', 'informes'] },
  // 4 · Lo que se suma al teléfono y se da de alta aparte. `ia` antes que
  //     `asistente-virtual` porque una es el producto y la otra su reportería:
  //     la reportería solo sirve cuando el agente ya existe.
  { titulo: 'Chat, IA e integraciones', categorias: ['integraciones', 'desarrollador', 'chat', 'ia', 'asistente-virtual'] },
  // 5 · «Esto ya no lo resuelvo yo en la llamada»: se manda a TI del cliente,
  //     se levanta ticket, o se contesta un cuestionario de compras.
  { titulo: 'Soporte y seguridad',     categorias: ['soporte', 'seguridad'] },
]

/** Las categorías en el orden de los grupos. Las que no estén clasificadas se
 *  añaden al final: así una categoría nueva aparece aunque nadie actualice
 *  GRUPOS, en vez de existir en los datos y no verse en pantalla. */
const KB_SORTED = (() => {
  const porId = new Map(KB.map(c => [c.id, c]))
  const orden: typeof KB = []
  for (const g of GRUPOS) {
    for (const id of g.categorias) {
      const c = porId.get(id)
      if (c) { orden.push(c); porId.delete(id) }
    }
  }
  // Lo que quede sin clasificar, alfabético, al final.
  const sueltas = Array.from(porId.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'))
  return orden.concat(sueltas)
})()

/** A qué grupo pertenece cada categoría, para poder pintar los encabezados del
 *  menú sin recorrer GRUPOS en cada render. Las no clasificadas caen en
 *  «Otros», que además es la señal de que hay que clasificarlas. */
const GRUPO_DE = new Map<string, string>()
for (const g of GRUPOS) for (const id of g.categorias) GRUPO_DE.set(id, g.titulo)
const grupoDe = (id: string) => GRUPO_DE.get(id) ?? 'Otros'

/* ── El índice de búsqueda ────────────────────────────────────────────────
 *
 * DOS COSAS ESTABAN MAL Y LAS DOS SE ARREGLAN AQUÍ.
 *
 * 1. Se indexaba el 41% del texto. El filtro miraba `titulo`, `descripcion` y
 *    `consideraciones`, y dejaba fuera `subtitulos` (en 30 artículos),
 *    `funcionamiento` (10), `bloques`, `apis`, `modalidades`, `acciones`,
 *    `tarificacion` y `utilidad`. Las 18 IP a abrir de «Recomendaciones SIP»
 *    viven en `subtitulos`: buscarlas devolvía «Sin resultados» con la
 *    respuesta escrita tres renglones más abajo.
 *
 * 2. No se ignoraban los acentos. «grabacion» no encontraba «Grabación de
 *    Llamadas», y así con más de treinta títulos — justo los más consultados.
 *    Nadie teclea tildes con un cliente esperando.
 *
 * Se arma UNA vez al cargar el módulo, no en cada tecla: son 88 artículos y
 * unos 80 KB de texto. */
function normaliza(s: string): string {
  // NFD separa la letra de su tilde y el rango elimina los diacríticos.
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function textoDeArticulo(a: Articulo): string {
  const p: string[] = [a.titulo, a.descripcion, a.ubicacion ?? '', a.utilidad ?? '']
  for (const c of a.consideraciones ?? []) p.push(c.texto)
  for (const f of a.funcionamiento ?? []) p.push(f)
  for (const x of a.acciones ?? [])       p.push(x)
  for (const g of a.graficas ?? [])       p.push(g)
  for (const m of a.modalidades ?? [])    p.push(m.nombre, m.descripcion)
  for (const i of a.apis ?? [])           p.push(i.nombre, i.descripcion)
  for (const t of a.tarificacion ?? [])   p.push(t.tipo, t.destino ?? '', t.regla)
  for (const s of a.subtitulos ?? [])     p.push(s.titulo, ...s.items)
  for (const b of a.bloques ?? [])        p.push(b.titulo ?? '', b.texto ?? '', ...(b.items ?? []))
  return normaliza(p.join(' · '))
}

const INDICE = new Map<string, string>()
for (const c of KB) for (const a of c.articulos) INDICE.set(a.id, textoDeArticulo(a))

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
function ArticuloCard({ art, catColor, defaultOpen }: { art: Articulo; catColor: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  /* El visor del PDF lleva su propio estado, independiente de `open`: así un
     artículo que sólo tiene documento adjunto —sin secciones extra— también
     puede mostrarlo sin salir de la Base de Conocimiento. */
  const [verDoc, setVerDoc] = useState(false)
  const hasExtra = !!(art.tarificacion || art.funcionamiento || art.consideraciones ||
    art.modalidades || art.acciones || art.graficas || art.apis || art.subtitulos || art.utilidad || art.bloques)
  /** ¿Hay fila de acciones que pintar debajo del título? 24 de los 88
   *  artículos traen PDF, y unos pocos enlace externo. */
  const hayAcciones = !!(art.pdfUrl || art.linkUrl)

  return (
    <div style={{
      borderRadius: 12, background: PANEL, border: `1px solid ${BORDER}`,
      overflow: 'hidden', marginBottom: 12,
    }}>
      {/* HEADER — solo el título, la descripción y el acordeón.
          Las acciones (ver aquí / PDF / descargar / enlace) VIVÍAN AQUÍ
          DENTRO, y eso es HTML inválido: un <button> no puede contener otro
          elemento interactivo. Funcionaba por los `e.stopPropagation()` de
          cada uno, pero quien navega con teclado recorría botones dentro de
          botones con un orden de foco impredecible, y un lector de pantalla
          anunciaba el artículo entero como etiqueta del botón de dentro.
          Ahora las acciones son una fila HERMANA, justo debajo: desaparecen
          los stopPropagation y el «Ver aquí» deja de ser un botón falso. */}
      <button
        onClick={() => hasExtra && setOpen(v => !v)}
        aria-expanded={hasExtra ? open : undefined}
        style={{
          width: '100%', padding: hayAcciones ? '18px 22px 0' : '18px 22px',
          textAlign: 'left',
          background: 'transparent', border: 'none',
          cursor: hasExtra ? 'pointer' : 'default',
          display: 'flex', alignItems: 'flex-start', gap: 14,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: TX }}>{art.titulo}</p>
            {/* El badge se queda: es texto, no es interactivo. */}
            {art.badge && <Badge type={art.badge} />}
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

      {/* ── Acciones ──────────────────────────────────────────────────────
          Fuera del <button> de arriba, que es de lo que se trataba. Cada una
          es ya el elemento que le corresponde —<button> lo que alterna algo,
          <a> lo que navega— así que el teclado y los lectores de pantalla las
          anuncian por lo que son, sin `stopPropagation` de por medio. */}
      {hayAcciones && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '12px 22px 18px',
        }}>
          {/* Lectura DENTRO de la Base de Conocimiento, sin abrir otra
              pestaña ni descargar. Ahora es un <button> de verdad: ya no
              necesita `role`, ni `tabIndex`, ni su propio manejo de Enter y
              Espacio — el navegador lo hace. */}
          {art.pdfUrl && (
            <button
              type="button"
              onClick={() => setVerDoc(v => !v)}
              aria-expanded={verDoc}
              style={{ ...ACCION_BASE, background: verDoc ? catColor : `${catColor}18`,
                color: verDoc ? '#fff' : catColor,
                border: `1px solid ${catColor}${verDoc ? '' : '35'}`, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {verDoc ? <EyeOff size={11} /> : <Eye size={11} />}
              {verDoc ? 'Ocultar documento' : 'Ver aquí'}
            </button>
          )}
          {art.pdfUrl && (
            <a
              href={art.pdfUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...ACCION_BASE, background: `${catColor}18`, color: catColor,
                border: `1px solid ${catColor}35`, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <FileText size={11} />
              Ver PDF
            </a>
          )}
          {/* Descarga directa. «Ver PDF» abre el visor del navegador; ésta
              guarda el archivo. El atributo `download` sólo surte efecto en
              mismo origen — los PDF viven en /public/docs, así que se cumple. */}
          {art.pdfUrl && (
            <a
              href={art.pdfUrl} download
              title={`Descargar ${art.pdfUrl.split('/').pop()}`}
              style={{ ...ACCION_BASE, background: `${catColor}18`, color: catColor,
                border: `1px solid ${catColor}35`, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Download size={11} />
              Descargar
            </a>
          )}
          {art.linkUrl && (
            <a
              href={art.linkUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...ACCION_BASE, background: `${catColor}18`, color: catColor,
                border: `1px solid ${catColor}35`, textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <ExternalLink size={11} />
              {art.linkLabel ?? 'Ver enlace'}
            </a>
          )}
        </div>
      )}

      {/* Visor del documento — se lee aquí mismo, sin salir del módulo */}
      {art.pdfUrl && verDoc && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{
            marginTop: 16, borderRadius: 10, overflow: 'hidden',
            border: `1px solid ${BORDER}`, background: '#fff',
          }}>
            <iframe
              src={art.pdfUrl}
              title={art.titulo}
              style={{ width: '100%', height: 620, border: 0, display: 'block' }}
            />
          </div>
          <p style={{ fontSize: 11, color: TX_LOW, marginTop: 8 }}>
            {art.pdfUrl.split('/').pop()} · Si el documento no se muestra, tu navegador
            puede tener desactivado el visor de PDF: usa “Ver PDF” para abrirlo en una
            pestaña o “Descargar” para guardarlo.
          </p>
        </div>
      )}

      {/* Contenido expandido */}
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${BORDER}` }}>

          {/* Tarificación */}
          {art.tarificacion && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
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
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Modalidades</p>
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
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Funcionamiento</p>
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
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Acciones disponibles</p>
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
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{s.titulo}</p>
              {s.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: catColor, flexShrink: 0, marginTop: 7 }} />
                  <span style={{ fontSize: 14, color: TX_MID, lineHeight: 1.7 }}>{conEnlaces(item)}</span>
                </div>
              ))}
            </div>
          ))}

          {/* Gráficas */}
          {art.graficas && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
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
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>APIs disponibles</p>
              {art.apis.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 8,
                  padding: '8px 12px', borderRadius: 8, background: `${catColor}0A`, border: `1px solid ${catColor}20` }}>
                  <code style={{ fontSize: 13, fontWeight: 800, color: catColor, flexShrink: 0 }}>{a.nombre}</code>
                  <span style={{ fontSize: 13, color: TX_MID }}>{conEnlaces(a.descripcion)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Consideraciones */}
          {art.consideraciones && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Consideraciones</p>
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
                if (b.tipo === 'codigo') return (
                  <div key={i} style={{ borderRadius: 8, overflow: 'hidden', margin: '12px 0', border: `1px solid ${BORDER}` }}>
                    <div style={{ padding: '10px 16px', background: '#0f172a' }}>
                      <code style={{ fontSize: 14, fontFamily: 'monospace', color: '#7dd3fc' }}>{b.texto}</code>
                    </div>
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
  // La primera del orden nuevo, no un id clavado: si mañana se reordenan los
  // grupos, la pantalla abre donde toca sin tener que acordarse de esta línea.
  const [activa, setActiva] = useState(KB_SORTED[0]?.id ?? '')
  const [query,  setQuery]  = useState('')

  const esGlosario  = activa === 'glosario'
  const esTelefonos = activa === 'telefonos'
  const cat = KB_SORTED.find(c => c.id === activa) ?? KB_SORTED[0]
  const Icon = CAT_ICONS[activa] ?? Info

  /* Resultados. Con texto se busca en LAS 17 categorías; sin texto se muestra
     la categoría abierta. Antes solo se miraba la activa, así que para dar con
     «SAML» había que adivinar primero en cuál de las 17 vive. */
  const resultados = useMemo(() => {
    const q = normaliza(query)
    if (!q) return null
    const out: { cat: Categoria; arts: Articulo[] }[] = []
    for (const c of KB_SORTED) {
      const arts = c.articulos.filter(a => (INDICE.get(a.id) ?? '').includes(q))
      if (arts.length) out.push({ cat: c, arts })
    }
    return out
  }, [query])

  const totalResultados = resultados ? resultados.reduce((s, r) => s + r.arts.length, 0) : 0
  /** Mientras hay texto mandan los resultados y la categoría se aparta: si no,
   *  los globales saldrían encima de la abierta y el mismo artículo se vería
   *  dos veces. */
  const enBusqueda = resultados !== null
  const artsFiltrados = cat.articulos

  const totalArticulos = KB_SORTED.reduce((s, c) => s + c.articulos.length, 0)

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>

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
        {/* EL NAV SE QUEDA. El `overflowY: 'auto'` de aquí nunca llegó a
            funcionar: el layout pretendía dos paneles independientes, pero la
            altura nunca se acota —`minHeight: '100%'` contra un padre sin
            altura se resuelve a `auto`— así que quien hacía scroll era la
            página entera y el menú se iba con ella. Bajando al artículo 9 de
            «Avanzadas» el asesor se quedaba sin menú y sin buscador, y para
            cambiar de tema tenía que subir hasta arriba. En una llamada donde
            el cliente salta de asunto, ese viaje se hace en cada pregunta.
            `sticky` lo resuelve sin tocar el shell de la aplicación. */}
        <nav style={{
          width: 210, flexShrink: 0, padding: '16px 10px',
          borderRight: `1px solid ${BORDER}`,
          display: 'flex', flexDirection: 'column', gap: 2,
          position: 'sticky', top: 0, alignSelf: 'flex-start',
          maxHeight: '100vh', overflowY: 'auto',
        }}>
          {/* El rótulo «Categorías» desaparece: ahora cada grupo lleva el suyo,
              y dos niveles de encabezado seguidos no aportan nada. */}
          {KB_SORTED.map((c, i) => {
            const CIcon = CAT_ICONS[c.id] ?? Info
            const isActive = activa === c.id
            const count = c.articulos.length
            /* El encabezado se pinta cuando CAMBIA el grupo respecto a la
               categoría anterior. Como KB_SORTED ya viene ordenado por grupos,
               basta comparar con la de al lado — no hace falta agrupar antes. */
            const grupo = grupoDe(c.id)
            const abreGrupo = i === 0 || grupoDe(KB_SORTED[i - 1].id) !== grupo
            return (
              <Fragment key={c.id}>
              {abreGrupo && (
                <p style={{
                  fontSize: 10, fontWeight: 700, color: TX_LOW,
                  textTransform: 'uppercase', letterSpacing: '0.09em',
                  padding: i === 0 ? '0 8px 8px' : '14px 8px 6px',
                }}>
                  {grupo}
                </p>
              )}
              {/* `aria-current` dice cuál está abierta a quien no ve el
                  color ni el borde izquierdo: sin esto, un lector de pantalla
                  anuncia diecisiete botones idénticos. */}
              <button onClick={() => { setActiva(c.id); setQuery('') }}
                aria-current={isActive ? 'page' : undefined}
                style={{
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
              </Fragment>
            )
          })}

          {/* El diccionario no es una categoría de artículos: es material de
              consulta rápida, así que va aparte pero dentro del mismo módulo. */}
          <div style={{ borderTop: `1px solid ${BORDER}`, margin: '10px 8px' }} />
          <button onClick={() => { setActiva('glosario'); setQuery('') }} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 9, width: '100%',
            textAlign: 'left', cursor: 'pointer', transition: 'all 150ms',
            background:   esGlosario ? '#0057FF18' : 'transparent',
            border:       esGlosario ? '1px solid #0057FF35' : '1px solid transparent',
            borderLeft:   esGlosario ? '3px solid #0057FF' : '3px solid transparent',
          }}>
            <BookMarked size={15} style={{ color: esGlosario ? '#0057FF' : TX_LOW, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: esGlosario ? 700 : 500, color: esGlosario ? TX : TX_MID, flex: 1, lineHeight: 1.3 }}>
              Glosario técnico
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#0057FF25', color: '#0057FF' }}>
              {GLOSARIO.length}
            </span>
          </button>

          <button onClick={() => { setActiva('telefonos'); setQuery('') }} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 9, width: '100%',
            textAlign: 'left', cursor: 'pointer', transition: 'all 150ms',
            background:   esTelefonos ? '#0D948818' : 'transparent',
            border:       esTelefonos ? '1px solid #0D948835' : '1px solid transparent',
            borderLeft:   esTelefonos ? '3px solid #0D9488' : '3px solid transparent',
          }}>
            <Phone size={15} style={{ color: esTelefonos ? '#0D9488' : TX_LOW, flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: esTelefonos ? 700 : 500, color: esTelefonos ? TX : TX_MID, flex: 1, lineHeight: 1.3 }}>
              Teléfonos IP
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: '#0D948825', color: '#0D9488' }}>
              {TELEFONOS_COMPATIBLES.length}
            </span>
          </button>
        </nav>

        {/* ── Contenido ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '24px 28px 56px', overflowY: 'auto' }}>

          {/* Breadcrumb + búsqueda */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, color: TX_LOW }}>Base de Conocimiento</span>
              <ChevronRight size={13} style={{ color: TX_LOW }} />
              <span style={{ fontSize: 13, color: esGlosario ? '#0057FF' : esTelefonos ? '#0D9488' : cat.color, fontWeight: 700 }}>
                {esGlosario ? 'Glosario técnico' : esTelefonos ? 'Teléfonos IP compatibles' : cat.label}
              </span>
            </div>
            {/* SIEMPRE VISIBLE y SIEMPRE GLOBAL. Antes solo aparecía en las
                categorías de más de 3 artículos —o sea, en 6 de 17 no había
                caja— y buscaba únicamente dentro de la abierta. */}
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: TX_MID }} />
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Buscar en los ${totalArticulos} artículos...`}
                style={{
                  paddingLeft: 32, paddingRight: query ? 30 : 14, paddingTop: 8, paddingBottom: 8,
                  borderRadius: 8, fontSize: 13, background: PANEL,
                  border: `1px solid ${query ? cat.color : BORDER}`, color: TX, outline: 'none', width: 260,
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  title="Limpiar la búsqueda"
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: TX_MID, lineHeight: 1, fontSize: 15, padding: 2,
                  }}
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Resultados de la búsqueda ──────────────────────────────────
              Mientras hay texto, la categoría abierta se hace a un lado: lo que
              se ve son las coincidencias de las 17, agrupadas por categoría con
              su color, para que se sepa de dónde sale cada una. */}
          {resultados !== null && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: TX, lineHeight: 1 }}>
                  {totalResultados} resultado{totalResultados === 1 ? '' : 's'}
                </h2>
                <span style={{ fontSize: 13, color: TX_MID }}>
                  para «{query}» en toda la base
                </span>
              </div>

              {totalResultados === 0 ? (
                /* El estado vacío ya no va a media opacidad ni deja al asesor
                   sin salida: el color es pleno y hay un botón que limpia. */
                <div style={{ padding: '48px 0', textAlign: 'center' }}>
                  <p style={{ fontSize: 16, color: TX, fontWeight: 700, marginBottom: 8 }}>
                    Nada coincide con «{query}»
                  </p>
                  <p style={{ fontSize: 13, color: TX_MID, marginBottom: 18, lineHeight: 1.6 }}>
                    Se buscó en los {totalArticulos} artículos de las {KB_SORTED.length} categorías,
                    dentro del texto completo y sin distinguir acentos.
                    <br />Prueba con una palabra más corta, o con el término en español.
                  </p>
                  <button
                    onClick={() => setQuery('')}
                    style={{
                      fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 8,
                      background: `${cat.color}18`, border: `1px solid ${cat.color}35`,
                      color: cat.color, cursor: 'pointer',
                    }}
                  >
                    Limpiar búsqueda
                  </button>
                </div>
              ) : resultados.map(r => (
                <div key={r.cat.id} style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 3, background: r.cat.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: TX_MID, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {r.cat.label}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: r.cat.color }}>
                      {r.arts.length}
                    </span>
                  </div>
                  {r.arts.map(art => (
                    <ArticuloCard key={art.id} art={art} catColor={r.cat.color} defaultOpen={totalResultados === 1} />
                  ))}
                </div>
              ))}
            </div>
          )}

          {esGlosario && !enBusqueda && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0057FF18', border: '1px solid #0057FF35', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookMarked size={18} style={{ color: '#0057FF' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 21, fontWeight: 800, color: TX, lineHeight: 1 }}>Glosario técnico-comercial</h2>
                  <p style={{ fontSize: 13, color: TX_LOW, marginTop: 4 }}>
                    {GLOSARIO.length} términos de comunicaciones, contact center, IA e integración
                  </p>
                </div>
              </div>
              <p style={{ fontSize: 13, color: TX_MID, lineHeight: 1.6, maxWidth: 900, marginBottom: 22 }}>
                El asesor no necesita programar una API, pero sí entender qué permite hacer. Atlas IA tiene
                cargado este diccionario completo: puede explicar cualquier término y devolverte las preguntas
                de descubrimiento que corresponden.
              </p>
              <GlosarioTecnico />
            </>
          )}

          {esTelefonos && !enBusqueda && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0D948818', border: '1px solid #0D948835', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={18} style={{ color: '#0D9488' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 21, fontWeight: 800, color: TX, lineHeight: 1 }}>Teléfonos IP compatibles</h2>
                  <p style={{ fontSize: 13, color: TX_LOW, marginTop: 4 }}>
                    Equipos verificados con Callpicker · Atlas IA responde con esta misma lista
                  </p>
                </div>
              </div>
              <div style={{ marginTop: 20 }}><TelefonosIP /></div>
            </>
          )}

          {/* Título categoría */}
          {!esGlosario && !esTelefonos && !enBusqueda && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cat.color}18`, border: `1px solid ${cat.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={18} style={{ color: cat.color }} />
            </div>
            <div>
              <h2 style={{ fontSize: 21, fontWeight: 800, color: TX, lineHeight: 1 }}>{cat.label}</h2>
              <p style={{ fontSize: 13, color: TX_LOW, marginTop: 4 }}>{artsFiltrados.length} artículo{artsFiltrados.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          )}

          {/* Artículos */}
          {!esGlosario && !esTelefonos && !enBusqueda && (artsFiltrados.length > 0
            /* `defaultOpen` solo cuando hay UN artículo: con uno solo, dejarlo
               cerrado obliga a un clic para ver lo único que hay. Con varios se
               abren cerrados, que es lo que permite barrer los títulos de un
               vistazo — que es como se consulta esto, con el cliente esperando.
               Antes se abría el primero de la bienvenida, categoría que ya no
               existe, así que no se abría nada en ninguna parte. */
            ? artsFiltrados.map(art => <ArticuloCard key={art.id} art={art} catColor={cat.color} defaultOpen={artsFiltrados.length === 1} />)
            : (
              /* Solo queda el caso de categoría vacía: el «Sin resultados» de
                 aquí era de cuando la búsqueda filtraba esta lista, y ahora
                 vive arriba con su propio botón de limpiar. Y sin el
                 `opacity: 0.5`, que dejaba el texto en 2.6:1 justo cuando la
                 pantalla tiene algo que explicar. */
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 16, color: TX, fontWeight: 700, marginBottom: 8 }}>Próximamente</p>
                <p style={{ fontSize: 14, color: TX_MID }}>Contenido en preparación para esta categoría.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
