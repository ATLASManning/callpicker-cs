import { pastillaSobrePagina } from '@/lib/contraste'

/**
 * CUENTAS QUE ACTIVAN vs CLIENTES QUE ACTIVAN
 * ============================================
 *
 * Una **cuenta** es lo que se aprovisiona: una fila con su ID (el CID). Un
 * **cliente** es quien paga: puede tener varias cuentas. El encabezado del
 * módulo cuenta activaciones y se lee como si contara clientes, y eso tiene
 * consecuencias: si un cliente con cuatro cuentas se va, Activaciones lo
 * registró como cuatro altas y la cartera lo cuenta como una baja.
 *
 * Esta sección enseña la diferencia con las cifras de la hoja, no con
 * adjetivos, y dice de dónde sale cada una.
 *
 * ── LAS TRES CIFRAS, Y LO QUE VALE CADA UNA ──────────────────────────────────
 *
 *  - **cuentas**: IDs únicos. Es EXACTA.
 *  - **clientes**: agrupando por el nombre tecleado en la hoja. Es una
 *    ESTIMACIÓN, y se publica diciéndolo: parte de menos cuando el mismo
 *    cliente está escrito de dos formas que no se parecen («Medexp» y
 *    «Medicall Expert»), y junta de más si dos empresas comparten nombre.
 *  - **de cartera**: cruce por CID contra el GRC. Es EXACTO, pero mide
 *    pertenencia a la cartera de CS, NO supervivencia: en el GRC sólo traen CID
 *    las filas de cartera, así que una activación fuera de esa lista puede
 *    estar facturando igual. Decir «sólo el 3% sigue siendo cliente» sería
 *    falso y alarmante; lo que se dice es lo que se midió.
 */

const TX     = '#202E3B'
const TX_MID = '#3D4B5C'
const TX_SUA = '#6A7889'
const BORDE  = '#DFE8EF'

export interface ClienteMulti {
  nombre:  string
  grafias: string[]
  cuentas: Array<{ id: string; ano: number | null }>
}

export interface ContrasteCuentasClientes {
  cuentas:        number
  clientes:       number
  sinNombre:      number
  clientesMulti:  ClienteMulti[]
  /** Cuentas que pertenecen a un cliente con más de una. */
  cuentasMulti:   number
  /** Cruce con el GRC. `null` cuando el archivo no se pudo leer. */
  cartera: null | {
    filasGrc:        number
    /** FILAS del GRC que traen CID. No es lo mismo que cuentas: varias filas
     *  pueden compartir CID, y mezclarlas deja la resta sin cerrar. */
    filasConCid:     number
    /** CIDs distintos entre esas filas. Es sobre esto que se reparte. */
    conCid:          number
    enAmbas:         number
    soloCartera:     number
  }
}

export default function CuentasVsClientes({ d }: { d: ContrasteCuentasClientes }) {
  const pctMulti = d.cuentas ? (d.cuentasMulti / d.cuentas) * 100 : 0

  return (
    <section style={{ marginTop: 40 }}>
      <div style={{
        padding: '20px 24px', borderRadius: 16,
        background: '#FFFFFF', border: `1px solid ${BORDE}`,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: TX, letterSpacing: '-0.01em' }}>
          Cuentas que activan, clientes que activan
        </h2>
        <p style={{ fontSize: 13, color: TX_MID, marginTop: 8, lineHeight: 1.7 }}>
          Una <strong>cuenta</strong> es lo que se aprovisiona: una fila con su
          ID. Un <strong>cliente</strong> es quien paga, y puede tener varias
          cuentas. El encabezado de arriba cuenta activaciones, no clientes, y
          la diferencia se nota en cuanto alguien se va: un cliente con cuatro
          cuentas entró aquí como cuatro altas y sale de la cartera como una
          baja.
        </p>

        {/* ── Las tres cifras ──────────────────────────────────────────────── */}
        <div style={{
          display: 'grid', gap: 12, marginTop: 18,
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
        }}>
          <Cifra
            valor={d.cuentas.toLocaleString('es-MX')}
            titulo="cuentas activadas"
            pie="IDs únicos de la hoja. Exacta."
            color="#1D6CAA" />
          <Cifra
            valor={d.clientes.toLocaleString('es-MX')}
            titulo="clientes distintos"
            pie="Agrupando por el nombre tecleado. Estimación, no censo."
            color="#15803D" />
          <Cifra
            valor={d.clientesMulti.length.toLocaleString('es-MX')}
            titulo="clientes con más de una cuenta"
            pie={`${d.cuentasMulti.toLocaleString('es-MX')} cuentas (${pctMulti.toFixed(1)}% del total)`}
            color="#B45309" />
        </div>

        {/* ── Lo que la cifra de clientes NO puede prometer ──────────────────
            Va plegado, no escondido: la salvedad corta («estimación por
            nombre») viaja PEGADA a la cifra, arriba. Lo que se pliega es el
            método largo, que es para quien va a citar el número, no para quien
            lo mira de paso. Esta pantalla es la puerta y se usa con prisa. */}
        <details style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 12,
          background: '#F5F8FB', border: `1px solid ${BORDE}`,
        }}>
          <summary style={{ fontSize: 12.5, fontWeight: 700, color: TX, cursor: 'pointer' }}>
            Cómo se agrupa, y qué puede fallar
          </summary>
          <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.7 }}>
            {/* El método va PEGADO a la cifra. Una estimación sin método al lado
                se cita después como si fuera un censo. */}
            La hoja no trae identificador de cliente: sólo el nombre escrito a
            mano. Se agrupa por ese nombre, ignorando mayúsculas, acentos,
            puntuación y el sufijo de razón social. Eso cose
            «ACACIA CAFÉ» con «Acacia Café», pero <strong>no</strong> puede
            coser «Medexp» con «Medicall Expert», que no se parecen como texto.
            Así que el número real de clientes es{' '}
            <strong style={{ color: TX }}>éste o menos</strong>, nunca más.
            {d.sinNombre > 0 && (
              <>
                {' '}Aparte quedan{' '}
                <strong style={{ color: TX }}>{d.sinNombre}</strong>{' '}
                cuenta{d.sinNombre !== 1 ? 's' : ''} cuyo nombre de cliente es el
                propio número de activación (<code>cp…</code>): no son clientes
                distintos, son nombres sin capturar, y contarlos habría inflado
                la cifra con un cliente ficticio por fila.
              </>
            )}
          </p>
          </div>
        </details>

        {/* ── El cruce con cartera ─────────────────────────────────────────── */}
        <div style={{
          marginTop: 12, padding: '12px 14px', borderRadius: 12,
          background: '#F5F8FB', border: `1px solid ${BORDE}`,
        }}>
          {d.cartera ? (
            <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.7 }}>
              <strong style={{ color: TX }}>Activar no es entrar a la cartera.</strong>{' '}
              De las{' '}
              <strong style={{ color: TX }}>{d.cartera.conCid}</strong>{' '}
              cuentas de cartera que el GRC identifica por CID, sólo{' '}
              <strong style={{ color: TX }}>{d.cartera.enAmbas}</strong>{' '}
              aparecen en esta hoja; las otras{' '}
              <strong style={{ color: TX }}>{d.cartera.soloCartera}</strong>{' '}
              no están. Las dos listas apenas se tocan y ninguna se deriva de la
              otra: esta hoja no es el censo de clientes.{' '}
              <span style={{ color: TX_SUA }}>
                {/* El límite del cruce, en la misma frase que el cruce. */}
                Ojo con leerlo como supervivencia: en el GRC sólo traen CID las
                filas de cartera ({d.cartera.filasConCid} de{' '}
                {d.cartera.filasGrc.toLocaleString('es-MX')} filas, que son{' '}
                {d.cartera.conCid} cuentas distintas), así que una activación
                que no esté en esa lista puede estar facturando igual. Esto mide
                cartera, no si el cliente sigue.
              </span>
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: TX_MID, lineHeight: 1.7 }}>
              <strong style={{ color: TX }}>El cruce con cartera NO SE PUDO MEDIR</strong>{' '}
              porque no se pudo leer el archivo del GRC. Eso es distinto de que
              no haya coincidencias: no hay cifra, no hay cero.
            </p>
          )}
        </div>

        {/* ── Los casos, uno por uno ───────────────────────────────────────── */}
        {d.clientesMulti.length > 0 && (
          <>
            <details style={{ marginTop: 22 }}>
            <summary style={{ fontSize: 14, fontWeight: 800, color: TX, cursor: 'pointer' }}>
              Los {d.clientesMulti.length} clientes con más de una cuenta
            </summary>
            <p style={{ fontSize: 12, color: TX_SUA, marginTop: 4, lineHeight: 1.6 }}>
              Cada uno cuenta como varias activaciones arriba y como un solo
              cliente aquí. El expediente de entrega, más abajo, avisa cuando la
              cuenta que abres es una de varias.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0' }}>
              {d.clientesMulti.map(c => (
                <li key={c.nombre} style={{
                  padding: '9px 0', borderBottom: `1px solid ${BORDE}`,
                  display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap',
                }}>
                  <Pastilla color="#B45309" texto={`${c.cuentas.length} cuentas`} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: TX, background: 'transparent' }}>
                    {c.nombre}
                  </span>
                  <span style={{ fontSize: 12, color: TX_SUA, background: 'transparent' }}>
                    {c.cuentas
                      .slice()
                      .sort((a, b) => (a.ano ?? 0) - (b.ano ?? 0))
                      .map(x => `${x.id}${x.ano ? ` (${x.ano})` : ''}`)
                      .join(' · ')}
                  </span>
                  {c.grafias.length > 1 && (
                    <span style={{ fontSize: 11.5, color: TX_SUA, background: 'transparent' }}>
                      {/* Decir que se cosieron dos grafías es lo que permite
                          discutir si la costura estuvo bien. */}
                      escrito de {c.grafias.length} formas: {c.grafias.join(' / ')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            </details>
          </>
        )}
      </div>
    </section>
  )
}

function Cifra({ valor, titulo, pie, color }: {
  valor: string; titulo: string; pie: string; color: string
}) {
  const p = pastillaSobrePagina(color, 0.16)
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 12,
      background: p.background, border: `1px solid ${p.borderColor}`,
    }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: p.color, background: 'transparent', lineHeight: 1.1 }}>
        {valor}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: TX, background: 'transparent', marginTop: 6 }}>
        {titulo}
      </div>
      <div style={{ fontSize: 11.5, color: TX_MID, background: 'transparent', marginTop: 4, lineHeight: 1.5 }}>
        {pie}
      </div>
    </div>
  )
}

function Pastilla({ color, texto }: { color: string; texto: string }) {
  const p = pastillaSobrePagina(color, 0.16)
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
      background: p.background, color: p.color,
      border: `1px solid ${p.borderColor}`, whiteSpace: 'nowrap',
    }}>
      {texto}
    </span>
  )
}
