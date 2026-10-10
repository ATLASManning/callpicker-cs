'use client'
import { useState, useMemo } from 'react'
import { formatMXN } from '@/lib/types'
import CustomSelect from '@/components/CustomSelect'
import { tonoSobreClaro } from '@/lib/contraste'
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
   actual. */

const UMBRAL = 3500

const PANEL  = '#FFFFFF'
const BORDER = '#BFDBFE'
const ACCENT = '#0057FF'
const TX     = '#0F172A'
const TX_MID = '#475569'
const TX_LOW = '#64748B'
const FILA2  = '#F7FAFF'

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

const TH: React.CSSProperties = {
  fontSize: 9.5, fontWeight: 800, color: TX_LOW, textTransform: 'uppercase',
  letterSpacing: '0.07em', textAlign: 'left', padding: '0 12px 8px',
  background: PANEL, position: 'sticky', top: 0, zIndex: 1,
  borderBottom: `1px solid ${BORDER}`,
}
const TD: React.CSSProperties = {
  fontSize: 12.5, color: TX, padding: '8px 12px', verticalAlign: 'middle',
}

export default function ActivacionesGrandes({ registros }: { registros: RegistroItem[] }) {
  const [ano, setAno] = useState('todos')

  const datos = useMemo(() => {
    /* Un demo no es una activación: no paga, no trae mes y no entra a
       cartera. Se excluye del universo y del denominador. */
    const base    = registros.filter(r => r.tipo !== 'demo')
    const grandes = base.filter(r => r.primerPago > UMBRAL)

    const lista = [...grandes]
      .filter(r => ano === 'todos' || String(r.ano) === ano)
      .sort((a, b) => b.primerPago - a.primerPago)

    const suma = (xs: RegistroItem[]) => xs.reduce((s, r) => s + r.primerPago, 0)

    const anos = Array.from(new Set(grandes.map(r => r.ano)))
      .sort((a, b) => b - a)

    return {
      lista,
      nGrandes:   grandes.length,
      dineroTodo: suma(grandes),
      dineroVista: suma(lista),
      nBase:      base.length,
      dineroBase: suma(base),
      anos,
    }
  }, [registros, ano])

  const pctCuentas = datos.nBase    > 0 ? (datos.nGrandes   / datos.nBase)    * 100 : 0
  const pctDinero  = datos.dineroBase > 0 ? (datos.dineroTodo / datos.dineroBase) * 100 : 0
  const filtrado   = ano !== 'todos'

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
            <strong style={{ color: tonoSobreClaro('#16A34A', 0) }}>
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
                background: filtrado ? `${ACCENT}18` : '#F0F7FF',
                color: filtrado ? ACCENT : TX_MID,
                border: `1px solid ${filtrado ? ACCENT : BORDER}`,
                outline: 'none',
              }}
            />
          </div>
        )}
      </div>

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
                <th style={{ ...TH, width: 34, textAlign: 'right' }}>#</th>
                <th style={TH}>Cliente</th>
                <th style={TH}>CID</th>
                <th style={TH}>Activación</th>
                <th style={TH}>Ejecutivo</th>
                <th style={TH}>Vendedor</th>
                <th style={TH}>Tamaño</th>
                <th style={TH}>Giro</th>
                <th style={{ ...TH, textAlign: 'right' }}>1er pago</th>
              </tr>
            </thead>
            <tbody>
              {datos.lista.map((r, i) => (
                <tr key={`${r.id}-${i}`} style={{ background: i % 2 ? FILA2 : PANEL }}>
                  <td style={{ ...TD, color: TX_LOW, fontSize: 11, textAlign: 'right' }}>
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
                  <td style={TD}><Pastilla texto={r.ejecutivo} /></td>
                  <td style={{ ...TD, color: TX_MID }}>{r.vendedor}</td>
                  <td style={{ ...TD, color: TX_MID, textTransform: 'capitalize' }}>
                    {r.tamano}
                  </td>
                  <td style={{ ...TD, color: TX_MID }}>{r.giro}</td>
                  <td style={{
                    ...TD, textAlign: 'right', fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                    color: tonoSobreClaro('#16A34A', 0),
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
                </td>
                <td style={{
                  ...TD, textAlign: 'right', fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                  color: tonoSobreClaro('#16A34A', 0),
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
      </p>
    </div>
  )
}
