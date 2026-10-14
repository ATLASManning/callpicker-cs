'use client'
import { useState, useMemo } from 'react'
import { formatMXN } from '@/lib/types'
import CustomSelect from '@/components/CustomSelect'
import { tonoSobreClaro, tonoSobreFondo } from '@/lib/contraste'
import type { RegistroItem } from '@/components/charts/ActivacionesCharts'

/* ── Clientes activados arriba de $3,500 ───────────────────────────────────
   Dirección, 10 oct 2026: «un módulo en la misma ventana para conocer los
   clientes que se están activando o fueron activados mayores a $3,500».

   Es una LISTA, no un tablero: la pregunta es quiénes son. El encabezado da
   el contexto en una línea y el pie cierra la cuenta; lo demás es la tabla.

   EL UMBRAL, EN UNA SOLA CONSTANTE
   Todo el texto de la pantalla —título, subtítulo, pie— se arma formateando
   `UMBRAL`. Moverlo es una línea y no deja ningún rótulo mintiendo.

   QUÉ MIDE LA CIFRA, QUE NO ES OBVIO
   El único dinero que vive en este archivo es el PRIMER PAGO de la
   activación. No es el MRR vigente de la cuenta, y la diferencia no es
   teórica: de las 143 que pasan el corte sólo 49 (34%) siguen en la cartera
   viva, y de esas 49, treinta facturan hoy MÁS que su primer pago y
   diecisiete menos. O sea que esto mide con qué entraron, no cuánto valen
   hoy. El pie lo dice con palabras para que nadie lo lea como facturación
   actual.

   ── v2 · 14 oct 2026 ──────────────────────────────────────────────────────
   Dirección pidió dos cosas: «los títulos constrúyelos como botón para poder
   seleccionar el orden» y «una gráfica para ver su periodo de frecuencia con
   el que se activan este tipo de cuentas».

   LA FRECUENCIA SE MIDIÓ ANTES DE DIBUJARLA, con
   `scripts/mide-frecuencia-grandes.py`, porque una gráfica sobre una serie
   plana es un indicador que entrena a no mirarlo. No lo es: la serie va de 0
   a 10 al mes sobre 45 meses, y además enseña una caída que no estaba dicha
   en ninguna parte —2024 promedia 4.8 al mes y 2026 baja a 2.9—.

   DOS RELOJES DISTINTOS, Y LA PANTALLA SÓLO PUBLICA UNO. El archivo trae
   `Mes 1er Pago` para las 143 y `Fecha 1er Pago` sólo para 94, así que hay
   dos cifras que suenan iguales y no lo son:
     · el ritmo del periodo —una cada 9.6 días— sale de las 143 repartidas en
       los 45 meses, y es la que se publica;
     · el intervalo real entre una y la siguiente —mediana 5 días, p90 42—
       sale de las 94 con fecha exacta, y se queda FUERA de la pantalla a
       propósito: `RegistroItem` no transporta la fecha, sólo el mes, y una
       cifra con un denominador distinto al lado de la otra se lee como la
       misma. Está medida en `mide-frecuencia-grandes.py` para quien la
       necesite. [[feedback-metricas-derivadas-origen]] */

const UMBRAL = 3500

/* Paleta del Customer Success Operating System (13 oct 2026). Este panel es
   una isla CLARA sobre página clara —`app/activaciones/page.tsx` no tiene ni
   una `.cp-card`—, así que todo va con letra OSCURA. */
const PANEL  = '#FFFFFF'
const BORDER = '#DFE8EF'   // --line
const ACCENT = '#1D6CAA'   // --blue · 5.56:1 sobre blanco
const TX     = '#202E3B'   // --ink  · 13.86:1
const TX_MID = '#3D4B5C'   //         8.90:1
const TX_LOW = '#6A7889'   // --muted· 4.56:1 — el más bajo que pasa AA aquí
const FILA2  = '#F5F8FB'   // --wash

/* El gris apagado mide 4.56:1 sobre BLANCO pero 4.34:1 sobre la fila cebrada:
   por debajo de AA justo en la mitad de los renglones. Se CALCULA contra el
   fondo real en vez de elegir un tono a ojo. [[atlas-dashboard-contrast-architecture]] */
const TX_LOW_CEBRA = tonoSobreFondo(TX_LOW, FILA2, 4.5)
const VERDE = tonoSobreClaro('#16A34A', 0)

/** Los meses llegan en inglés desde el .xlsx. El mapa vive aquí y no se
 *  importa de `ActivacionesCharts` para no acoplar este módulo a ese archivo
 *  por doce cadenas de presentación. */
const MES_ES: Record<string, string> = {
  January:'Ene', February:'Feb', March:'Mar', April:'Abr', May:'May', June:'Jun',
  July:'Jul', August:'Ago', September:'Sep', October:'Oct', November:'Nov', December:'Dic',
}
const MES_NUM: Record<string, number> = {
  January:1, February:2, March:3, April:4, May:5, June:6,
  July:7, August:8, September:9, October:10, November:11, December:12,
}

const EJEC_COLOR: Record<string, string> = {
  'Pepe Toño':    '#F59E0B',
  'Cecilia':      '#EC4899',
  'Ricardo':      '#14B8A6',
  'Enrique':      '#8B5CF6',
  'Toño del Río': '#F97316',
  'Otro':         '#64748B',
  'N/A':          '#475569',
}

const pesos = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(n)

const pesosCorto = (n: number) =>
  n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${Math.round(n)}`

/** Una ausencia se marca CON PALABRAS. El archivo entrega «N/A» en giro,
 *  ejecutivo y tamaño cuando la celda viene vacía, y un «N/A» en una tabla no
 *  dice si el dato no existe, no aplica o nadie lo capturó. Aquí siempre es lo
 *  último, así que se escribe. «Sin vendedor» ya viene redactado del
 *  normalizador y se deja tal cual. */
const AUSENTE = 'no capturado'
const sinDato = (v: string) =>
  (!v || v.trim() === '' || v.trim().toUpperCase() === 'N/A') ? AUSENTE : v

function Pastilla({ texto }: { texto: string }) {
  const color = EJEC_COLOR[texto] ?? '#64748B'
  return (
    // El `background` del <span> no es decoración: globals.css tiene
    // `.cp-card span:not([style*="background"]){color:#fff!important}` y un
    // `!important` de hoja le gana al color en línea. El tono se CALCULA
    // contra el tinte real, nunca se elige a ojo.
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
      whiteSpace: 'nowrap',
      color: tonoSobreClaro(color, 0.10), background: `${color}1A`,
    }}>{texto}</span>
  )
}

/* ══ ORDEN ══════════════════════════════════════════════════════════════════
   Cada columna declara CÓMO se compara, no sólo por qué campo. Un orden
   alfabético sobre «no capturado» tiene que mandar las ausencias al final en
   los dos sentidos: si no, invertir el orden llena la primera pantalla de
   filas vacías y parece que se perdió el dato. */
type Col = {
  id: string
  titulo: string
  derecha?: boolean
  /** Null = ausente: va al final SIEMPRE, suba o baje el resto. */
  valor: (r: RegistroItem) => string | number | null
  /** El orden natural de la columna la primera vez que se pulsa. */
  inicial: 'asc' | 'desc'
  ayuda: string
}

const COLS: Col[] = [
  { id: 'cliente',  titulo: 'Cliente',    inicial: 'asc',
    valor: r => r.cliente?.trim().toLowerCase() || null,
    ayuda: 'Ordenar por nombre del cliente' },
  { id: 'cid',      titulo: 'CID',        inicial: 'asc',
    valor: r => r.id || null,
    ayuda: 'Ordenar por CID' },
  { id: 'fecha',    titulo: 'Activación', inicial: 'desc',
    /* Se ordena por el MES real, no por el texto «Abr 2026», que alfabéticamente
       pondría agosto antes que enero. Sin mes no se puede situar: va al final. */
    valor: r => (r.ano && MES_NUM[r.mes]) ? r.ano * 12 + MES_NUM[r.mes] : null,
    ayuda: 'Ordenar por fecha de activación' },
  { id: 'ejecutivo', titulo: 'Ejecutivo', inicial: 'asc',
    valor: r => sinDato(r.ejecutivo) === AUSENTE ? null : r.ejecutivo.trim().toLowerCase(),
    ayuda: 'Ordenar por ejecutivo' },
  { id: 'vendedor', titulo: 'Vendedor',   inicial: 'asc',
    valor: r => sinDato(r.vendedor) === AUSENTE ? null : r.vendedor.trim().toLowerCase(),
    ayuda: 'Ordenar por vendedor' },
  { id: 'tamano',   titulo: 'Tamaño',     inicial: 'asc',
    valor: r => sinDato(r.tamano) === AUSENTE ? null : r.tamano.trim().toLowerCase(),
    ayuda: 'Ordenar por tamaño' },
  { id: 'giro',     titulo: 'Giro',       inicial: 'asc',
    valor: r => sinDato(r.giro) === AUSENTE ? null : r.giro.trim().toLowerCase(),
    ayuda: 'Ordenar por giro' },
  { id: 'pago',     titulo: '1er pago',   inicial: 'desc', derecha: true,
    valor: r => r.primerPago,
    ayuda: 'Ordenar por importe del primer pago' },
]

const TH_BASE: React.CSSProperties = {
  padding: '0 12px 8px', background: PANEL,
  position: 'sticky', top: 0, zIndex: 1,
  borderBottom: `1px solid ${BORDER}`, textAlign: 'left',
}

/** El encabezado es un <button>: se pulsa con el ratón y con el teclado, y
 *  `aria-sort` le dice a un lector de pantalla por dónde va el orden. Un <th>
 *  con un `onClick` encima no es ninguna de las dos cosas. */
function ThOrden({
  col, activo, dir, onClick,
}: { col: Col; activo: boolean; dir: 'asc' | 'desc'; onClick: () => void }) {
  return (
    <th
      scope="col"
      aria-sort={activo ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      style={{ ...TH_BASE, textAlign: col.derecha ? 'right' : 'left' }}
    >
      <button
        type="button"
        onClick={onClick}
        title={col.ayuda}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          flexDirection: col.derecha ? 'row-reverse' : 'row',
          background: activo ? `${ACCENT}14` : 'transparent',
          border: 'none', borderRadius: 6, padding: '3px 6px',
          margin: col.derecha ? '0 -6px 0 0' : '0 0 0 -6px',
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 9.5, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.07em',
          color: activo ? ACCENT : TX_LOW,
          whiteSpace: 'nowrap',
        }}
      >
        {col.titulo}
        {/* La columna inactiva NO lleva ▲: un triángulo hacia arriba en una
            columna que no ordena se lee como «ordenada ascendente», y con ocho
            columnas eso son siete afirmaciones falsas. Lleva «⇅», que dice que
            se puede ordenar sin decir por dónde va.

            El `background: transparent` del <span> es la cláusula de escape de
            `globals.css`; sin ella el signo se fuerza a blanco si este módulo
            acaba alguna vez dentro de una `.cp-card`. */}
        <span style={{
          background: 'transparent',
          fontSize: activo ? 8 : 9,
          color: activo ? ACCENT : 'rgba(106,120,137,0.40)',
          lineHeight: 1,
        }}>
          {activo ? (dir === 'asc' ? '▲' : '▼') : '⇅'}
        </span>
      </button>
    </th>
  )
}

const TD: React.CSSProperties = {
  fontSize: 12.5, color: TX, padding: '8px 12px', verticalAlign: 'middle',
}

/* ══ LA GRÁFICA DE FRECUENCIA ═══════════════════════════════════════════════
   Una barra por MES del periodo medido, incluidos los meses en CERO.

   Los ceros se pintan con una marca de base en vez de dejarse en blanco: un
   hueco se lee como «no hay dato» y aquí es un cero MEDIDO —ese mes existió y
   no hubo ninguna activación grande—. [[feedback-cero-sin-medicion]] */
function Frecuencia({
  serie, maxN, maxDinero, modo,
}: {
  serie: { k: number; etiqueta: string; ano: number; n: number; dinero: number }[]
  maxN: number
  maxDinero: number
  modo: 'cuentas' | 'dinero'
}) {
  const [sobre, setSobre] = useState<number | null>(null)
  const tope = modo === 'cuentas' ? maxN : maxDinero
  const ALTO = 96

  /* Dónde cambia el año, para poner la separación y el rótulo una sola vez. */
  const primeroDelAno = new Set<number>()
  let anoPrev: number | null = null
  for (const s of serie) {
    if (s.ano !== anoPrev) { primeroDelAno.add(s.k); anoPrev = s.ano }
  }

  const activo = serie.find(s => s.k === sobre)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: ALTO }}>
        {serie.map(s => {
          const v = modo === 'cuentas' ? s.n : s.dinero
          const h = tope > 0 ? Math.max(v > 0 ? 3 : 0, (v / tope) * ALTO) : 0
          const sel = sobre === s.k
          return (
            <div
              key={s.k}
              onMouseEnter={() => setSobre(s.k)}
              onMouseLeave={() => setSobre(null)}
              title={`${s.etiqueta} · ${s.n} activación${s.n === 1 ? '' : 'es'} · ${pesos(s.dinero)}`}
              style={{
                flex: 1, minWidth: 0, height: '100%',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                borderLeft: primeroDelAno.has(s.k) && s.k !== serie[0].k
                  ? `1px solid ${BORDER}` : '1px solid transparent',
                cursor: 'default',
              }}
            >
              {v > 0 ? (
                <div style={{
                  height: h, borderRadius: '3px 3px 0 0',
                  background: sel ? TX : ACCENT,
                  transition: 'background 120ms ease-out',
                }} />
              ) : (
                /* El cero MEDIDO: una marca de base, no un hueco. */
                <div style={{
                  height: 2, borderRadius: 1,
                  background: sel ? TX : 'rgba(106,120,137,0.45)',
                }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Rótulos de año bajo la serie. */}
      <div style={{ display: 'flex', gap: 2, marginTop: 5 }}>
        {serie.map(s => (
          <div key={s.k} style={{
            flex: 1, minWidth: 0, textAlign: 'center',
            fontSize: 9.5, fontWeight: 700, color: TX_LOW,
            letterSpacing: '0.04em',
          }}>
            {primeroDelAno.has(s.k) ? s.ano : ''}
          </div>
        ))}
      </div>

      {/* La lectura del mes señalado. Altura fija para que la gráfica no salte
          al entrar y salir el ratón. */}
      <p style={{ fontSize: 11.5, color: TX_MID, marginTop: 8, minHeight: 18 }}>
        {activo ? (
          <>
            <strong style={{ color: TX }}>{activo.etiqueta}</strong>
            {' · '}
            {activo.n === 0
              ? 'ninguna activación arriba del umbral'
              : <>{activo.n} activación{activo.n === 1 ? '' : 'es'}
                  {' · '}
                  <strong style={{ color: VERDE }}>{pesos(activo.dinero)}</strong>
                  {' de primer pago'}</>}
          </>
        ) : (
          <span style={{ background: 'transparent', color: TX_LOW }}>
            Pasa el cursor por un mes para ver su detalle.
          </span>
        )}
      </p>
    </div>
  )
}

/** Un dato suelto del bloque de frecuencia, con su cifra y lo que significa. */
function Dato({ cifra, titulo, pie }: { cifra: string; titulo: string; pie: string }) {
  return (
    <div style={{
      flex: '1 1 150px', minWidth: 140, padding: '10px 12px',
      borderRadius: 10, background: FILA2, border: `1px solid ${BORDER}`,
    }}>
      <p style={{
        fontSize: 9.5, fontWeight: 800, color: TX_LOW,
        textTransform: 'uppercase', letterSpacing: '0.07em',
      }}>{titulo}</p>
      <p style={{
        fontSize: 19, fontWeight: 900, color: ACCENT, marginTop: 2,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.15,
      }}>{cifra}</p>
      <p style={{ fontSize: 10.5, color: TX_LOW_CEBRA, marginTop: 3, lineHeight: 1.45 }}>
        {pie}
      </p>
    </div>
  )
}

export default function ActivacionesGrandes({ registros }: { registros: RegistroItem[] }) {
  const [ano, setAno] = useState('todos')
  const [orden, setOrden] = useState<{ col: string; dir: 'asc' | 'desc' }>(
    { col: 'pago', dir: 'desc' },
  )
  const [modoGrafica, setModoGrafica] = useState<'cuentas' | 'dinero'>('cuentas')

  const datos = useMemo(() => {
    /* Un demo no es una activación: no paga, no trae mes y no entra a
       cartera. Se excluye del universo y del denominador. */
    const base    = registros.filter(r => r.tipo !== 'demo')
    const grandes = base.filter(r => r.primerPago > UMBRAL)

    const col = COLS.find(c => c.id === orden.col) ?? COLS[COLS.length - 1]
    const signo = orden.dir === 'asc' ? 1 : -1

    const lista = [...grandes]
      .filter(r => ano === 'todos' || String(r.ano) === ano)
      .sort((a, b) => {
        const va = col.valor(a)
        const vb = col.valor(b)
        /* Las ausencias al final en los DOS sentidos. */
        if (va === null && vb === null) return 0
        if (va === null) return 1
        if (vb === null) return -1
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * signo
        return String(va).localeCompare(String(vb), 'es-MX') * signo
      })

    const suma = (xs: RegistroItem[]) => xs.reduce((s, r) => s + r.primerPago, 0)

    const anos = Array.from(new Set(grandes.map(r => r.ano)))
      .sort((a, b) => b - a)

    /* ── La serie mensual, sobre TODAS las grandes (no sobre la vista) ──────
       La gráfica responde «cada cuánto se activan estas cuentas», y esa
       pregunta no cambia porque el usuario filtre un año en la tabla. */
    const conFecha = grandes.filter(r => r.ano && MES_NUM[r.mes])
    const sinFecha = grandes.length - conFecha.length

    const porMes = new Map<number, { n: number; dinero: number }>()
    for (const r of conFecha) {
      const k = r.ano * 12 + MES_NUM[r.mes]
      const v = porMes.get(k) ?? { n: 0, dinero: 0 }
      v.n++; v.dinero += r.primerPago
      porMes.set(k, v)
    }

    const claves = Array.from(porMes.keys())
    const serie: { k: number; etiqueta: string; ano: number; n: number; dinero: number }[] = []
    if (claves.length) {
      const k0 = Math.min(...claves)
      const k1 = Math.max(...claves)
      const NOM = ['Dic','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      for (let k = k0; k <= k1; k++) {
        const v = porMes.get(k) ?? { n: 0, dinero: 0 }
        const m = ((k - 1) % 12) + 1
        const a = Math.floor((k - 1) / 12)
        serie.push({ k, ano: a, etiqueta: `${NOM[m]} ${a}`, n: v.n, dinero: v.dinero })
      }
    }

    const meses   = serie.length
    const conAlgo = serie.filter(s => s.n > 0).length
    const maxN    = serie.reduce((m, s) => Math.max(m, s.n), 0)
    const maxDin  = serie.reduce((m, s) => Math.max(m, s.dinero), 0)
    /* Días entre una y la siguiente, a partir del ritmo del periodo: los
       meses medidos por el número de activaciones. 30.44 es el mes medio. */
    const cadaDias = conFecha.length > 0 ? (meses * 30.44) / conFecha.length : 0

    return {
      lista, col, nGrandes: grandes.length, dineroTodo: suma(grandes),
      dineroVista: suma(lista), nBase: base.length, dineroBase: suma(base), anos,
      serie, meses, conAlgo, maxN, maxDin, cadaDias, sinFecha,
      nConFecha: conFecha.length,
    }
  }, [registros, ano, orden])

  const pctCuentas = datos.nBase      > 0 ? (datos.nGrandes   / datos.nBase)      * 100 : 0
  const pctDinero  = datos.dineroBase > 0 ? (datos.dineroTodo / datos.dineroBase) * 100 : 0
  const filtrado   = ano !== 'todos'

  const pulsar = (c: Col) => setOrden(o =>
    o.col === c.id
      ? { col: c.id, dir: o.dir === 'asc' ? 'desc' : 'asc' }
      : { col: c.id, dir: c.inicial },
  )

  return (
    <div style={{
      marginTop: 28, padding: '20px 24px', borderRadius: 14,
      background: PANEL, border: `1px solid ${BORDER}`,
    }}>
      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 14,
      }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: TX }}>
            Clientes activados arriba de {pesos(UMBRAL)}
          </p>
          <p style={{ fontSize: 12, color: TX_MID, marginTop: 4 }}>
            {datos.nGrandes.toLocaleString('es-MX')} de{' '}
            {datos.nBase.toLocaleString('es-MX')} activaciones —el{' '}
            {pctCuentas.toFixed(1)}%— y{' '}
            <strong style={{ color: VERDE }}>
              {pesos(datos.dineroTodo)}
            </strong>{' '}
            de primer pago, el {pctDinero.toFixed(1)}% del total.
          </p>
        </div>
        {datos.anos.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 150 }}>
            <label style={{
              fontSize: 10, fontWeight: 700, color: TX_LOW,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Año</label>
            <CustomSelect
              value={ano}
              onChange={setAno}
              options={[
                { value: 'todos', label: 'Todos los años' },
                ...datos.anos.map(a => ({ value: String(a), label: String(a) })),
              ]}
              style={{
                padding: '7px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: filtrado ? `${ACCENT}18` : FILA2,
                color: filtrado ? ACCENT : TX_MID,
                border: `1px solid ${filtrado ? ACCENT : BORDER}`,
                outline: 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* ── CADA CUÁNTO SE ACTIVAN ─────────────────────────────────────── */}
      {datos.serie.length > 1 && (
        <div style={{
          marginBottom: 18, padding: '14px 16px 12px', borderRadius: 12,
          border: `1px solid ${BORDER}`, background: PANEL,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', gap: 14, flexWrap: 'wrap', marginBottom: 12,
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 800, color: TX }}>
                Cada cuánto cae una de estas
              </p>
              <p style={{ fontSize: 11.5, color: TX_MID, marginTop: 3 }}>
                {datos.serie[0].etiqueta} – {datos.serie[datos.serie.length - 1].etiqueta}
                {' · '}{datos.meses} meses medidos, sin huecos
              </p>
            </div>
            {/* Dos lecturas de la misma serie. No se apilan: se eligen. */}
            <div style={{ display: 'flex', gap: 4 }}>
              {([['cuentas', 'Cuentas'], ['dinero', '1er pago']] as const).map(([k, et]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setModoGrafica(k)}
                  style={{
                    padding: '5px 11px', borderRadius: 7, cursor: 'pointer',
                    /* `font: 'inherit'` NO va aquí: el atajo reinicia
                       `fontSize` y `fontWeight` puestos antes. Sólo la familia. */
                    fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
                    background: modoGrafica === k ? ACCENT : FILA2,
                    color: modoGrafica === k ? '#FFFFFF' : TX_MID,
                    border: `1px solid ${modoGrafica === k ? ACCENT : BORDER}`,
                  }}
                >{et}</button>
              ))}
            </div>
          </div>

          <Frecuencia
            serie={datos.serie}
            maxN={datos.maxN}
            maxDinero={datos.maxDin}
            modo={modoGrafica}
          />

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
            <Dato
              cifra={`cada ${datos.cadaDias.toFixed(1)} días`}
              titulo="Ritmo del periodo"
              pie={`${datos.nConFecha} activaciones repartidas en ${datos.meses} meses`}
            />
            <Dato
              cifra={(datos.nConFecha / Math.max(1, datos.meses)).toFixed(1)}
              titulo="Media al mes"
              pie={`el mes más alto tuvo ${datos.maxN}`}
            />
            <Dato
              cifra={`${datos.conAlgo} de ${datos.meses}`}
              titulo="Meses con alguna"
              pie={datos.meses - datos.conAlgo === 0
                ? 'ni un solo mes en blanco'
                : `${datos.meses - datos.conAlgo} meses cerraron sin ninguna`}
            />
            <Dato
              cifra={pesosCorto(datos.dineroTodo / Math.max(1, datos.nGrandes))}
              titulo="Primer pago medio"
              pie={`sobre las ${datos.nGrandes} que pasan de ${pesos(UMBRAL)}`}
            />
          </div>

          {/* Lo que la serie NO cubre se dice aquí, no se calla. */}
          {datos.sinFecha > 0 && (
            <p style={{ fontSize: 10.5, color: TX_LOW, marginTop: 10, lineHeight: 1.5 }}>
              {datos.sinFecha} de las {datos.nGrandes} no traen mes en el archivo y
              quedan fuera de la serie: aparecen en la tabla, pero no se pueden
              situar en el tiempo.
            </p>
          )}
        </div>
      )}

      {/* ── La lista ───────────────────────────────────────────────────── */}
      {datos.lista.length === 0 ? (
        /* Un cero sin medición no es un cero: se dice cuántas se miraron. */
        <p style={{ fontSize: 12.5, color: TX_MID, padding: '18px 0' }}>
          Ninguna activación arriba de {pesos(UMBRAL)} en {filtrado ? ano : 'el archivo'}
          {' '}— se revisaron {datos.nBase.toLocaleString('es-MX')} activaciones.
        </p>
      ) : (
        <div style={{ maxHeight: 520, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead>
              <tr>
                {/* El número de fila NO se ordena: es la posición en el orden
                    vigente, así que ordenarlo por sí mismo no significaría
                    nada. Se queda como rótulo. */}
                <th scope="col" style={{ ...TH_BASE, width: 34, textAlign: 'right',
                  fontSize: 9.5, fontWeight: 800, color: TX_LOW,
                  textTransform: 'uppercase', letterSpacing: '0.07em' }}>#</th>
                {COLS.map(c => (
                  <ThOrden
                    key={c.id}
                    col={c}
                    activo={orden.col === c.id}
                    dir={orden.dir}
                    onClick={() => pulsar(c)}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.lista.map((r, i) => (
                <tr key={`${r.id}-${i}`} style={{ background: i % 2 ? FILA2 : PANEL }}>
                  <td style={{
                    ...TD, fontSize: 11, textAlign: 'right',
                    color: i % 2 ? TX_LOW_CEBRA : TX_LOW,
                  }}>
                    {i + 1}
                  </td>
                  <td style={{ ...TD, fontWeight: 700 }}>{r.cliente}</td>
                  <td style={{ ...TD, fontFamily: 'monospace', fontSize: 11.5, color: TX_MID }}>
                    {r.id}
                  </td>
                  <td style={{ ...TD, color: TX_MID, whiteSpace: 'nowrap' }}>
                    {/* Un mes que el archivo no trae se DICE, no se deja en blanco. */}
                    {r.mes && MES_ES[r.mes]
                      ? `${MES_ES[r.mes]} ${r.ano}`
                      : `${r.ano || 'sin año'} · sin mes`}
                  </td>
                  <td style={TD}><Pastilla texto={sinDato(r.ejecutivo)} /></td>
                  {/* `whiteSpace: nowrap` porque «Sin vendedor» partía en dos
                      líneas y dejaba la fila del doble de alto que sus vecinas:
                      una lista de 143 renglones con alturas desparejas se lee
                      peor de lo que parece en una captura de doce. */}
                  <td style={{ ...TD, color: TX_MID, whiteSpace: 'nowrap' }}>
                    {sinDato(r.vendedor)}
                  </td>
                  {/* El `capitalize` sólo va cuando hay valor: aplicado a la
                      marca de ausencia la dejaba como «No Capturado», que
                      parece un título mal escrito en vez de una nota. */}
                  <td style={{
                    ...TD, color: TX_MID,
                    textTransform: sinDato(r.tamano) === AUSENTE ? 'none' : 'capitalize',
                  }}>
                    {sinDato(r.tamano)}
                  </td>
                  <td style={{ ...TD, color: TX_MID }}>{sinDato(r.giro)}</td>
                  <td style={{
                    ...TD, textAlign: 'right', fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: VERDE,
                  }}>{formatMXN(r.primerPago)}</td>
                </tr>
              ))}
            </tbody>
            {/* LA TABLA CIERRA. Con un año elegido, el pie dice las dos cifras
                —la de la vista y la del total— para que una lista filtrada no
                se lea como si fueran todas. */}
            <tfoot>
              <tr>
                <td colSpan={8} style={{
                  ...TD, fontWeight: 800, borderTop: `2px solid ${BORDER}`,
                  background: PANEL, position: 'sticky', bottom: 0,
                }}>
                  {filtrado
                    ? `${datos.lista.length} de ${datos.nGrandes} clientes (${ano})`
                    : `${datos.nGrandes} clientes`}
                  <span style={{
                    background: 'transparent', color: TX_LOW, fontWeight: 600,
                    marginLeft: 8, fontSize: 11,
                  }}>
                    · ordenado por {datos.col.titulo.toLowerCase()}
                    {' '}{orden.dir === 'asc' ? '↑' : '↓'}
                  </span>
                </td>
                <td style={{
                  ...TD, textAlign: 'right', fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                  color: VERDE,
                  borderTop: `2px solid ${BORDER}`,
                  background: PANEL, position: 'sticky', bottom: 0,
                }}>
                  {filtrado
                    ? `${pesos(datos.dineroVista)} de ${pesos(datos.dineroTodo)}`
                    : pesos(datos.dineroTodo)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <p style={{ fontSize: 11, color: TX_LOW, marginTop: 12, lineHeight: 1.6 }}>
        La cifra es el <strong style={{ color: TX_MID }}>primer pago de la activación</strong>,
        que es el único importe que trae esta fuente — no el cobro mensual vigente de la
        cuenta. Los demos quedan fuera: no pagan ni entran a cartera. La lista está
        completa, sin recorte: se ven las {datos.nGrandes} y su suma cierra con el pie.
        La gráfica mide <strong style={{ color: TX_MID }}>todas</strong> las {datos.nGrandes},
        no la vista: el filtro de año cambia la tabla, no el ritmo del periodo.
      </p>
    </div>
  )
}
