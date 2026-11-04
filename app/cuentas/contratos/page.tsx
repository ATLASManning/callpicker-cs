'use client'

/**
 * Cuentas → Contratos.
 *
 * Pedido por dirección (24 oct 2026): conciliar la hoja de contratos con las
 * cuentas TOP, una ventana con los próximos a vencer, la lista de todos y una
 * gráfica con selección de dimensión.
 *
 * ── LO QUE ESTA PANTALLA SE NIEGA A HACER ─────────────────────────────────
 *
 * 1. NO cuenta como «sin vencimiento» lo que simplemente no tiene fecha. Son
 *    27 de 60 contratos: decir que no vencen sería afirmar algo que la hoja no
 *    dice. Van en su propio renglón, con esas palabras.
 * 2. NO esconde los 36 contratos que no cruzan con la cartera. Cuando se parte
 *    por giro, tamaño o facturación —dimensiones que sólo existen para los que
 *    cruzan— caen en un cubo «fuera de la cartera CS» y el reparto cierra.
 * 3. NO pinta el color de la hoja como si fuera un estado: el mismo estatus
 *    aparece en negro, azul y rojo.
 *
 * La página es clara y sin `.cp-card`: letra oscura sobre fondo claro.
 * [[atlas-dashboard-contrast-architecture]]
 */
import { useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/PageHeader'
import SoloEnCliente from '@/components/charts/SoloEnCliente'
import {
  DIMENSIONES, ETIQUETA_ESTADO, valorDimension,
  type Dimension, type RespuestaContratos, type ContratoCruzado,
  type EstadoContrato,
} from '@/lib/contratos-norm'

const MARINO = '#10355D'
const CIAN   = '#39ABD8'
const LINEA  = '#DFE8EF'
const LAVADO = '#F5F8FB'
const TX_ALTO = '#202E3B'
const TX_MED  = '#3D4B5C'
const TX_BAJO = '#667384'
const ROJO_TX = '#A4262C'
const AMBAR_TX = '#8A5200'

/**
 * Los colores de las BARRAS de estatus. Son la paleta de estado —
 * bueno / aviso / crítico— validada como conjunto, no tonos elegidos a ojo:
 * mi primera propuesta (#A4262C contra #8A5200) la tumbó el validador con
 * ΔE 2.9 en deuteranopia y 11.1 incluso con visión normal, o sea dos barras
 * que nadie distingue.
 *
 * `#fab219` queda por debajo de 3:1 contra el fondo blanco A PROPÓSITO, y por
 * eso **el color nunca va solo**: cada segmento lleva su cifra escrita y la
 * leyenda su etiqueta. Si algún día se quita el número, hay que cambiar el
 * tono, no confiar en el amarillo.
 *
 * `sin_estatus` NO lleva color de estado: es una AUSENCIA de captura, no un
 * estado. Va en gris, que es lo que el resto de la página usa para los huecos.
 * Los textos siguen vistiendo TX_* y ROJO_TX / AMBAR_TX: el color de serie no
 * se usa nunca para letra.
 */
const COLOR_ESTADO: Record<EstadoContrato, string> = {
  firmado:     '#0ca30c',
  en_proceso:  '#fab219',
  no_firmado:  '#d03b3b',
  sin_estatus: '#B9C4D0',
}
/** Orden FIJO. Nunca se recalcula por tamaño: si un filtro cambia el reparto,
 *  los colores no pueden bailar de categoría. */
const ORDEN_ESTADO: EstadoContrato[] =
  ['firmado', 'en_proceso', 'no_firmado', 'sin_estatus']

/**
 * LA TINTA QUE VA ENCIMA DE CADA COLOR, MEDIDA — no elegida.
 *
 * Los cuatro tonos de estado no admiten la misma letra: blanco sobre
 * `#0ca30c` da 3.3:1 y sobre `#fab219` da 1.8:1, que a 10px no se lee. Los
 * contrastes contra cada fondo real, calculados uno por uno:
 *
 *   firmado     #0ca30c  → TX_ALTO 4.2:1 ✓   (blanco 3.3:1 ✗)
 *   en_proceso  #fab219  → TX_ALTO 7.5:1 ✓   (blanco 1.8:1 ✗)
 *   no_firmado  #d03b3b  → blanco  4.8:1 ✓   (TX_ALTO 2.9:1 ✗)
 *   sin_estatus #B9C4D0  → TX_ALTO 7.8:1 ✓
 *
 * O sea que el rojo es el único que lleva letra clara. Un `color: '#FFF'`
 * uniforme para los cuatro —que es lo que sale a ojo— deja dos segmentos
 * ilegibles. [[atlas-dashboard-contrast-architecture]]
 */
const TINTA_ESTADO: Record<EstadoContrato, string> = {
  firmado:     TX_ALTO,
  en_proceso:  TX_ALTO,
  no_firmado:  '#FFFFFF',
  sin_estatus: TX_ALTO,
}

type Ventana = '' | 'vencidos' | 'en30' | 'en90' | 'mas90' | 'sinFecha' | 'libre'
const VENTANAS: { id: Ventana; label: string }[] = [
  { id: '',         label: 'Cualquier vencimiento' },
  { id: 'vencidos', label: 'Ya vencidos' },
  { id: 'en30',     label: 'Vencen en 30 días' },
  { id: 'en90',     label: 'Entre 31 y 90 días' },
  { id: 'mas90',    label: 'A más de 90 días' },
  { id: 'libre',    label: 'Sin vencimiento (plazo libre)' },
  { id: 'sinFecha', label: 'No se sabe (sin fecha ni plazo libre)' },
]

/* ── EL ORDEN DE LA TABLA ──────────────────────────────────────────────────
 *
 * TRES COLUMNAS NO SE ORDENAN COMO TEXTO, Y SON LAS TRES QUE MÁS SE MIRAN.
 *
 * 1. **Consecutivo.** «C18», «C3», «C9» en alfabético salen C18, C3, C9: el
 *    18 antes que el 3. Y el consecutivo no es una etiqueta cualquiera —su
 *    prefijo marca al asesor—, así que se ordena primero por la letra y
 *    después por el número de verdad. [[altas-cuentas]]
 * 2. **Plazo.** Los valores son «12 meses», «18 meses», «24 meses», «36
 *    meses», «6 meses», «3 parcialidades» y «libre». Alfabético da 12, 18,
 *    24, 3, 36, 6 — que no es ningún orden. Se ordena por MESES, y lo que no
 *    se mide en meses («libre», «parcialidades») va detrás, junto, en vez de
 *    colarse entre el 24 y el 36 fingiendo una duración que no tiene.
 * 3. **Estatus.** Alfabéticamente «En proceso» va antes que «Firmado» y «Sin
 *    estatus» antes que los dos. El orden que significa algo es el de
 *    `ORDEN_ESTADO`, que es el mismo de la gráfica: lo cerrado primero y la
 *    ausencia de captura al final.
 *
 * Las fechas sí se ordenan como texto porque vienen en ISO, donde el orden
 * alfabético ES el cronológico. Si algún día llegaran en dd/mm/aaaa, esto
 * dejaría de ser cierto en silencio.
 */
type CampoOrden = 'cuenta' | 'consecutivo' | 'estado' | 'plazo'
                | 'inicio' | 'fin' | 'vence' | 'asesor' | 'doc'

const MESES_DE_PLAZO = /^(\d+)\s*mes/i

const COLUMNAS: {
  id: CampoOrden
  label: string
  /** `null` = el dato FALTA, y por eso va siempre al final. No es un extremo. */
  valor: (c: ContratoCruzado) => string | number | null
  ayuda: string
}[] = [
  { id: 'cuenta', label: 'Cuenta', ayuda: 'alfabético',
    valor: c => c.cuenta },
  { id: 'consecutivo', label: 'Consec.', ayuda: 'por asesor y número',
    valor: c => {
      const v = (c.consecutivo ?? '').trim()
      if (!v) return null
      const m = v.match(/^([A-Za-z]*)(\d+)/)
      return m ? `${m[1].toUpperCase()}${m[2].padStart(6, '0')}` : v.toUpperCase()
    } },
  { id: 'estado', label: 'Estatus', ayuda: 'firmado primero, sin captura al final',
    valor: c => ORDEN_ESTADO.indexOf(c.estado) },
  { id: 'plazo', label: 'Plazo', ayuda: 'por meses; «libre» y parcialidades al final',
    valor: c => {
      const v = (c.plazo ?? '').trim()
      if (!v) return null
      const m = v.match(MESES_DE_PLAZO)
      /* El `1e6 +` manda lo que no se mide en meses detrás de cualquier plazo
         real, sin inventarle una duración. */
      return m ? Number(m[1]) : 1e6 + v.charCodeAt(0)
    } },
  { id: 'inicio', label: 'Inicio', ayuda: 'cronológico', valor: c => c.inicio },
  { id: 'fin',    label: 'Fin',    ayuda: 'cronológico', valor: c => c.fin },
  { id: 'vence',  label: 'Vence',  ayuda: 'lo que vence antes, arriba',
    valor: c => c.diasParaVencer },
  { id: 'asesor', label: 'Asesor', ayuda: 'alfabético',
    valor: c => c.asesor?.trim() || null },
  { id: 'doc',    label: 'Doc.',   ayuda: 'primero los que no tienen documento',
    /* Ordena por el HUECO, que es lo que se busca aquí: quién no tiene el
       contrato subido. Por eso 0 = sin documento. */
    valor: c => (c.gdoc && /^https?:\/\//.test(c.gdoc) ? 1 : 0) },
]

/** El orden de salida: lo que vence antes, arriba. Es el que ya tenía. */
const ORDEN_INICIAL: { campo: CampoOrden; dir: 'asc' | 'desc' } =
  { campo: 'vence', dir: 'asc' }

const pesos = (n: number | null) =>
  n === null || n === undefined ? '—'
    : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

/**
 * EN QUÉ CAJÓN DE VENCIMIENTO CAE UN CONTRATO — una sola función.
 *
 * Antes la ventana de arriba y el filtro contaban por su cuenta con los mismos
 * `if` escritos dos veces, y además **no cerraban**: estaban «vencidos»,
 * «30 días» y «31–90», y los que vencen a MÁS de 90 días no aparecían en
 * ninguna caja. Con 18 contratos con fecha y 13 ya vencidos el hueco no salta
 * a la vista, pero las cajas sumaban menos que el total y nada lo decía.
 *
 * Ahora cada contrato cae en exactamente UNO de los seis cajones, así que la
 * suma es el total por construcción y el assert de abajo lo comprueba.
 * [[feedback-tablas-deben-cerrar]]
 */
type Cajon = Exclude<Ventana, ''>
function cajonVence(c: ContratoCruzado): Cajon {
  const dv = c.diasParaVencer
  if (dv === null) return c.sinVencimiento ? 'libre' : 'sinFecha'
  if (dv < 0)  return 'vencidos'
  if (dv <= 30) return 'en30'
  if (dv <= 90) return 'en90'
  return 'mas90'
}

/** «2026-10-24» → «24 oct 2026». Sin `toISOString`: ya viene anclada. */
function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  const M = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${+iso.slice(8, 10)} ${M[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`
}

export default function ContratosPage() {
  const [d, setD] = useState<RespuestaContratos | null>(null)
  const [falla, setFalla] = useState<string | null>(null)
  /* Arranca en VENDEDOR, no en estatus: partido por estatus el cruce es
     degenerado —cada barra de un solo color— y lo que la gráfica aporta es
     justo el cruce. La dimensión sigue siendo elegible. */
  const [dim, setDim] = useState<Dimension>('vendedor')
  const [soloCartera, setSoloCartera] = useState(false)
  const [busca, setBusca] = useState('')
  const [fEstado, setFEstado] = useState<EstadoContrato | ''>('')
  const [fVendedor, setFVendedor] = useState('')
  const [fPlazo, setFPlazo] = useState('')
  const [fVentana, setFVentana] = useState<Ventana>('')
  const [orden, setOrden] = useState(ORDEN_INICIAL)

  /** Un clic ordena por esa columna; otro clic en la MISMA la invierte. */
  const ordenaPor = (campo: CampoOrden) =>
    setOrden(o => o.campo === campo
      ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' }
      : { campo, dir: 'asc' })

  useEffect(() => {
    fetch('/api/contratos')
      .then(async r => {
        /* UN 403 NO ES UN FALLO DE LECTURA, ES UN PERMISO — y se dice con
           esas palabras. `/api/contratos` no está en la lista del rol
           `perfilamiento`, mientras que la PÁGINA sí le toca porque
           `/cuentas` se concede por prefijo. Sin este mensaje, ese rol vería
           «no se pudo cargar» y nadie sabría que lo que falta es un permiso
           y no el dato. [[project-callpicker-auth-pending]] */
        if (r.status === 403) {
          throw new Error('Tu rol no tiene acceso a los contratos. '
                        + 'No es que no haya datos: es un permiso.')
        }
        const j = await r.json()
        if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`)
        return j
      })
      .then(setD)
      .catch(e => setFalla(String(e.message ?? e)))
  }, [])

  const todos = d?.contratos ?? []

  /* LOS DESPLEGABLES SE DERIVAN DEL DATO, NUNCA SE ESCRIBEN A MANO. Una lista
     tecleada se queda coja en cuanto la hoja trae un vendedor nuevo, y el
     filtro que falta no avisa: simplemente no se puede elegir.
     [[feedback-fuente-unica-cuentas]] */
  const opciones = useMemo(() => ({
    vendedores: [...new Set(todos.map(c => c.vendedor?.trim()).filter(Boolean))]
      .sort((a, b) => (a as string).localeCompare(b as string, 'es')) as string[],
    plazos: [...new Set(todos.map(c => c.plazo?.trim()).filter(Boolean))]
      .sort((a, b) => (a as string).localeCompare(b as string, 'es')) as string[],
  }), [todos])

  /**
   * EL FILTRO ES DE LA PÁGINA, NO DE LA TABLA.
   *
   * Antes el buscador vivía dentro de la tarjeta de la lista y sólo la movía:
   * escribías «Finsus» y arriba seguían las cajas de vencimiento y la gráfica
   * de los 60. Dos cifras distintas en la misma pantalla sin decir que miraban
   * poblaciones distintas. Ahora todo lo de abajo cuelga de aquí, y el
   * renglón de «mostrando N de M» dice siempre sobre cuántos se está contando.
   */
  /**
   * El predicado, con un `omite` para poder contar sin un filtro concreto.
   *
   * Lo necesita el desplegable de estatus: si sus cifras se contaran sobre el
   * resultado YA filtrado, al elegir «Firmado» las otras tres opciones dirían
   * «(0)» y parecería que no existen. Y si se contaran sobre los 60 de la hoja,
   * dirían 42 mientras la pantalla enseña 9. Las dos lecturas son falsas: la
   * cifra correcta es «cuántos habría si cambio ESTE filtro y dejo los demás».
   * [[feedback-metricas-derivadas-origen]]
   */
  const pasa = (c: ContratoCruzado, omite?: 'estado') => {
    if (soloCartera && !c.enCartera) return false
    if (omite !== 'estado' && fEstado && c.estado !== fEstado) return false
    if (fVendedor && (c.vendedor?.trim() ?? '') !== fVendedor) return false
    if (fPlazo && (c.plazo?.trim() ?? '') !== fPlazo) return false
    /* Las ventanas son los mismos seis cajones de arriba: `libre` y `sinFecha`
       NO son la misma cosa, que es la regla del módulo.
       [[feedback-cero-sin-medicion]] */
    if (fVentana && fVentana !== cajonVence(c)) return false
    const q = busca.trim().toLowerCase()
    if (!q) return true
    /* Se busca en TODO lo que una persona teclearía para encontrar un
       contrato, no sólo en el nombre: el estatus tal cual lo escribió la
       hoja, quién lo vendió, quién lo firmó y la nota —ahí vive «lo tiene
       Toño en digital», que es como el equipo se refiere a varios—. */
    return [
      c.cuenta, c.empresaCartera, c.consecutivo, c.cid, c.vendedor,
      c.estatusHoja, c.firmante, c.solicitante, c.emailFirmante,
      c.plazo, c.nota, c.contenido, c.asesor,
    ].some(v => (v ?? '').toString().toLowerCase().includes(q))
  }

  const base = useMemo(
    () => todos.filter(c => pasa(c)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todos, soloCartera, busca, fEstado, fVendedor, fPlazo, fVentana],
  )

  /** Lo que diría cada opción de estatus si se eligiera, con los demás filtros puestos. */
  const porEstadoHoja = useMemo(() => {
    const r: Record<EstadoContrato, number> =
      { firmado: 0, en_proceso: 0, no_firmado: 0, sin_estatus: 0 }
    for (const c of todos) if (pasa(c, 'estado')) r[c.estado] += 1
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, soloCartera, busca, fVendedor, fPlazo, fVentana])

  const hayFiltro = !!(busca.trim() || fEstado || fVendedor || fPlazo || fVentana || soloCartera)
  const limpiar = () => {
    setBusca(''); setFEstado(''); setFVendedor(''); setFPlazo('')
    setFVentana(''); setSoloCartera(false)
  }

  const lista = useMemo(() => {
    const col = COLUMNAS.find(c => c.id === orden.campo) ?? COLUMNAS[6]
    const signo = orden.dir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      const va = col.valor(a)
      const vb = col.valor(b)
      /* LOS HUECOS SIEMPRE AL FINAL, EN LOS DOS SENTIDOS. Si el `null` se
         ordenara con el resto, al pedir «fin» descendente los 42 contratos sin
         fecha encabezarían la tabla como si fueran los que vencen más tarde.
         Un dato que falta no es un valor extremo. [[feedback-cero-sin-medicion]] */
      if (va === null && vb === null) return a.cuenta.localeCompare(b.cuenta, 'es')
      if (va === null) return 1
      if (vb === null) return -1
      const d = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), 'es', { numeric: true })
      /* Empate resuelto por nombre, SIEMPRE ascendente: si el desempate
         también se invirtiera, dos clics en «Estatus» reordenarían a los 42
         firmados entre sí sin que nada lo explique. */
      return d !== 0 ? d * signo : a.cuenta.localeCompare(b.cuenta, 'es')
    })
  }, [base, orden])

  /* Las seis cajas, desde `cajonVence` para que sean las mismas que el filtro
     y para que SUMEN el total. Se cuentan sobre `base`, o sea sobre lo
     filtrado: si no, al escribir «Finsus» abajo quedarían arriba las cifras de
     los 60 y serían dos poblaciones distintas en la misma pantalla. */
  const vencen = useMemo(() => {
    const c0: Record<Cajon, ContratoCruzado[]> =
      { vencidos: [], en30: [], en90: [], mas90: [], libre: [], sinFecha: [] }
    for (const c of base) c0[cajonVence(c)].push(c)
    return c0
  }, [base])
  const sumaCajas = (Object.keys(vencen) as Cajon[]).reduce((s, k) => s + vencen[k].length, 0)

  /**
   * EL CRUCE: la dimensión elegida × el estatus de firma.
   *
   * La gráfica anterior sólo decía CUÁNTOS contratos tiene cada vendedor, que
   * es el dato que ya se ve en la tabla. Lo que no se veía en ninguna parte es
   * **cuántos de ésos están firmados** — que es la pregunta del módulo: no
   * importa que José Galván tenga 24 contratos si cuatro siguen en proceso.
   * Por eso cada barra se parte por estatus en lugar de ser maciza.
   *
   * El reparto cierra en los DOS sentidos: cada contrato aporta exactamente un
   * segmento, así que la suma de todos los segmentos es el total filtrado. El
   * assert de abajo lo publica en vez de confiar en ello.
   */
  const cruce = useMemo(() => {
    const m = new Map<string, Record<EstadoContrato, number>>()
    for (const c of base) {
      const k = valorDimension(c, dim)
      let r = m.get(k)
      if (!r) { r = { firmado: 0, en_proceso: 0, no_firmado: 0, sin_estatus: 0 }; m.set(k, r) }
      r[c.estado] += 1
    }
    return [...m.entries()]
      .map(([clave, por]) => ({ clave, por, n: ORDEN_ESTADO.reduce((s, e) => s + por[e], 0) }))
      .sort((a, b) => b.n - a.n || a.clave.localeCompare(b.clave, 'es'))
  }, [base, dim])

  const maxN = Math.max(1, ...cruce.map(r => r.n))
  const sumaCruce = cruce.reduce((s, r) => s + r.n, 0)
  /* La leyenda lleva CIFRA, no sólo color: la regla es que el color nunca
     identifica solo, y menos el `#fab219`, que contra blanco queda por debajo
     de 3:1 a propósito. */
  const porEstadoBase = useMemo(() => {
    const r: Record<EstadoContrato, number> =
      { firmado: 0, en_proceso: 0, no_firmado: 0, sin_estatus: 0 }
    for (const c of base) r[c.estado] += 1
    return r
  }, [base])

  if (falla) {
    return (
      <div style={{ padding: 32 }}>
        <PageHeader title="Contratos" subtitle="Cuentas · contratos con clientes" />
        <div style={{ margin: '24px 0', padding: 16, borderRadius: 12,
                      background: '#FEF2F2', border: '1px solid #FECACA', color: ROJO_TX }}>
          <strong>No se pudo cargar.</strong> {falla}
          <p style={{ fontSize: 12, marginTop: 6, color: TX_MED }}>
            Esto es un fallo de lectura, no un resultado: no significa que no haya contratos.
          </p>
        </div>
      </div>
    )
  }
  if (!d) {
    return (
      <div style={{ padding: 32 }}>
        <PageHeader title="Contratos" subtitle="Cuentas · contratos con clientes" />
        <p style={{ color: TX_BAJO, marginTop: 24 }}>Cargando contratos…</p>
      </div>
    )
  }

  const m = d.meta

  return (
    <div style={{ minHeight: '100%' }}>
      <PageHeader
        title="Contratos"
        subtitle={`${m.total} contratos · ${m.porEstado.firmado ?? 0} firmados · `
                + `${m.enCartera} cruzan con la cartera y ${m.fueraDeCartera} no · `
                + `hoja del ${fechaCorta(m.generado.slice(0, 10))}`}
      />

      {/* ═══ LA BARRA DE FILTROS ══════════════════════════════════════════ */}
      <div style={{ padding: '20px 32px 0' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${LINEA}`, background: '#FFFFFF',
                      padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {/* El buscador va ARRIBA porque manda sobre toda la pantalla, no
                sólo sobre la tabla donde vivía antes. */}
            <input value={busca} onChange={e => setBusca(e.target.value)}
                   placeholder="Buscar: cuenta, consecutivo, CID, vendedor, firmante, nota…"
                   aria-label="Buscar contratos"
                   style={{ fontSize: 12.5, padding: '8px 11px', borderRadius: 8, flex: '1 1 320px',
                            minWidth: 240, border: `1px solid ${LINEA}`, color: TX_ALTO,
                            background: '#FFF' }} />

            <Selector label="Estatus" valor={fEstado}
                      onChange={v => setFEstado(v as EstadoContrato | '')}
                      opciones={[{ v: '', t: 'Cualquier estatus' },
                                 ...ORDEN_ESTADO.map(e => ({
                                   v: e, t: `${ETIQUETA_ESTADO[e]} (${porEstadoHoja[e]})`,
                                 }))]} />

            <Selector label="Vendedor" valor={fVendedor} onChange={setFVendedor}
                      opciones={[{ v: '', t: 'Cualquier vendedor' },
                                 ...opciones.vendedores.map(x => ({ v: x, t: x }))]} />

            <Selector label="Plazo" valor={fPlazo} onChange={setFPlazo}
                      opciones={[{ v: '', t: 'Cualquier plazo' },
                                 ...opciones.plazos.map(x => ({ v: x, t: x }))]} />

            <Selector label="Vencimiento" valor={fVentana}
                      onChange={v => setFVentana(v as Ventana)}
                      opciones={VENTANAS.map(x => ({ v: x.id, t: x.label }))} />

            <label style={{ fontSize: 12, color: TX_MED, display: 'flex', gap: 6,
                            alignItems: 'center', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={soloCartera}
                     onChange={e => setSoloCartera(e.target.checked)} />
              sólo los que cruzan con la cartera
            </label>
          </div>

          {/* QUÉ POBLACIÓN SE ESTÁ MIRANDO, SIEMPRE ESCRITO. Sin este renglón,
              una pantalla filtrada y una sin filtrar se ven igual y las cifras
              de arriba parecen el total. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline',
                        marginTop: 11, paddingTop: 11, borderTop: `1px solid ${LINEA}` }}>
            <p style={{ fontSize: 12, color: hayFiltro ? TX_ALTO : TX_BAJO }}>
              {hayFiltro
                ? <>Todo lo de abajo cuenta sobre <strong>{base.length} de {m.total}</strong> contratos.</>
                : <>Todo lo de abajo cuenta sobre los <strong>{m.total}</strong> contratos de la hoja.</>}
            </p>
            {hayFiltro && (
              <button onClick={limpiar}
                      style={{ fontSize: 11.5, fontWeight: 700, padding: '4px 11px', borderRadius: 999,
                               border: `1px solid ${LINEA}`, background: LAVADO, color: TX_MED,
                               cursor: 'pointer' }}>
                Quitar los filtros
              </button>
            )}
            {hayFiltro && base.length === 0 && (
              <p style={{ fontSize: 12, color: AMBAR_TX, fontWeight: 700 }}>
                Ningún contrato cumple esos filtros — no es que no haya contratos.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══ LA VENTANA DE VENCIMIENTOS ═══════════════════════════════════ */}
      <div style={{ padding: '18px 32px 0' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${vencen.vencidos.length ? '#FECACA' : LINEA}`,
                      background: vencen.vencidos.length ? '#FFF7F7' : LAVADO, padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'flex-start' }}>
            <Caja n={vencen.vencidos.length} label="YA VENCIDOS"      color={ROJO_TX} />
            <Caja n={vencen.en30.length}     label="VENCEN EN 30 DÍAS" color={AMBAR_TX} />
            <Caja n={vencen.en90.length}     label="ENTRE 31 Y 90 DÍAS" color={MARINO} />
            <Caja n={vencen.mas90.length}    label="A MÁS DE 90 DÍAS"  color={MARINO} />
            <Caja n={vencen.libre.length}    label="SIN VENCIMIENTO"   color={TX_BAJO}
                  pie="plazo «libre»" />
            <Caja n={vencen.sinFecha.length} label="NO SE SABE"        color={TX_BAJO}
                  pie="ni fecha ni plazo libre" />
          </div>

          {/* La frase que impide la lectura cómoda. */}
          <p style={{ fontSize: 12, color: TX_MED, lineHeight: 1.65, marginTop: 14,
                      borderTop: `1px solid ${LINEA}`, paddingTop: 12 }}>
            Los vencimientos se cuentan <strong>sólo sobre los{' '}
            {vencen.vencidos.length + vencen.en30.length + vencen.en90.length + vencen.mas90.length}{' '}
            contratos que traen fecha de término</strong>. Otros {vencen.libre.length} tienen plazo
            «libre», que no vence por definición. Y <strong>{vencen.sinFecha.length} no traen ni
            fecha ni plazo libre</strong>: de ésos no se sabe cuándo vencen, que no es lo mismo que
            decir que no vencen. Se arregla capturando la fecha en la hoja de origen.
          </p>

          {/* EL CIERRE, ESCRITO. Las seis cajas son excluyentes y cubren todo:
              si algún día dejaran de sumar, aquí se vería en vez de pasar
              inadvertido. [[feedback-tablas-deben-cerrar]] */}
          <p style={{ fontSize: 11.5, color: sumaCajas === base.length ? TX_BAJO : ROJO_TX,
                      marginTop: 8, fontWeight: sumaCajas === base.length ? 400 : 700 }}>
            {sumaCajas === base.length
              ? <>Las seis cajas suman {sumaCajas} de {base.length}: ningún contrato se queda sin cajón.</>
              : <>Las seis cajas suman {sumaCajas} y deberían sumar {base.length}. Hay un fallo de reparto.</>}
          </p>

          {vencen.vencidos.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: ROJO_TX, marginBottom: 8 }}>
                Los {vencen.vencidos.length} que ya vencieron, del más antiguo:
              </p>
              <div style={{ display: 'grid', gap: 6 }}>
                {[...vencen.vencidos]
                  .sort((a, b) => (a.diasParaVencer as number) - (b.diasParaVencer as number))
                  .map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12.5,
                                          alignItems: 'baseline', color: TX_ALTO }}>
                      <span style={{ fontWeight: 700, minWidth: 230 }}>{c.cuenta}</span>
                      {c.consecutivo && <Pastilla texto={c.consecutivo} />}
                      {c.esTop && <Pastilla texto="TOP" fuerte />}
                      <span style={{ color: TX_MED }}>venció el {fechaCorta(c.fin)}</span>
                      <span style={{ color: ROJO_TX, fontWeight: 700 }}>
                        hace {Math.abs(c.diasParaVencer as number)} días
                      </span>
                      <span style={{ color: TX_BAJO }}>{ETIQUETA_ESTADO[c.estado]}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ LAS TOP SIN CONTRATO ═════════════════════════════════════════ */}
      <div style={{ padding: '18px 32px 0' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${LINEA}`, background: '#FFFFFF', padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: TX_ALTO, marginBottom: 4 }}>
            Cuentas TOP y su contrato
          </h3>
          <p style={{ fontSize: 12.5, color: TX_MED, lineHeight: 1.65, marginBottom: 12 }}>
            De las <strong>{m.topTotal} cuentas TOP</strong> de la cartera,{' '}
            <strong style={{ color: MARINO }}>{m.topConContrato} tienen contrato firmado</strong> y{' '}
            <strong style={{ color: ROJO_TX }}>{d.topSinContrato.length} no</strong>. Esto se calcula
            desde la cartera y no desde la hoja: mirando sólo los contratos nunca se vería a quien
            no tiene ninguno.
          </p>

          {/* ESTE CUADRO NO SE FILTRA, Y SE DICE. Sale de la CARTERA, no de la
              hoja: filtrarlo por «vendedor» o por «plazo» es imposible —una
              cuenta sin contrato no tiene ni vendedor ni plazo que filtrar— y
              dejarlo mudo mientras el resto de la pantalla sí responde haría
              que pareciera que no reacciona por un fallo. */}
          {hayFiltro && (
            <p style={{ fontSize: 12, color: AMBAR_TX, lineHeight: 1.6, marginBottom: 12,
                        padding: '8px 11px', borderRadius: 8, background: '#FFFBEB',
                        border: '1px solid #FDE68A' }}>
              <strong>Este cuadro NO responde a los filtros de arriba</strong>, y no es un fallo:
              estas cuentas no tienen contrato, así que no tienen vendedor, plazo ni vencimiento
              que filtrar. Se cuenta siempre sobre las {m.topTotal} cuentas TOP de la cartera.
            </p>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: LAVADO }}>
                  {['Cuenta', 'Consec.', 'Asesor', 'Estado', 'Facturación'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Facturación' ? 'right' : 'left',
                                         padding: '8px 10px', color: TX_BAJO, fontWeight: 700,
                                         fontSize: 11, textTransform: 'uppercase',
                                         borderBottom: `1px solid ${LINEA}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.topSinContrato.map((t, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${LINEA}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: TX_ALTO }}>{t.empresa}</td>
                    <td style={{ padding: '8px 10px', color: TX_MED }}>{t.consecutivo ?? '—'}</td>
                    <td style={{ padding: '8px 10px', color: TX_MED }}>{t.asesor ?? 'sin asesor'}</td>
                    <td style={{ padding: '8px 10px', color: TX_MED }}>{t.estado ?? '—'}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: TX_ALTO,
                                 fontVariantNumeric: 'tabular-nums' }}>{pesos(t.mrr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ LA GRÁFICA, CON SELECTOR DE DIMENSIÓN ════════════════════════ */}
      <div style={{ padding: '18px 32px 0' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${LINEA}`, background: '#FFFFFF', padding: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
                        justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: TX_ALTO }}>
                {dim === 'estado'
                  ? 'Reparto por estatus de firma'
                  : `Estatus de firma por ${(DIMENSIONES.find(x => x.id === dim)?.label ?? '').toLowerCase()}`}
              </h3>
              <p style={{ fontSize: 11.5, color: TX_BAJO, marginTop: 2 }}>
                Cada barra es el total de ese grupo, partida por estatus.
              </p>
            </div>
            <select value={dim} onChange={e => setDim(e.target.value as Dimension)}
                    aria-label="Partir la gráfica por"
                    style={{ fontSize: 12.5, padding: '6px 10px', borderRadius: 8,
                             border: `1px solid ${LINEA}`, color: TX_ALTO, background: '#FFF' }}>
              {DIMENSIONES.map(x => (
                <option key={x.id} value={x.id}>
                  {x.label}{x.soloCartera ? ' (sólo cartera)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* LA LEYENDA, CON CIFRA. Va ARRIBA de las barras porque hay que saber
              qué significa cada color antes de leerlas, no después. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14,
                        paddingBottom: 12, borderBottom: `1px solid ${LINEA}` }}>
            {ORDEN_ESTADO.map(e => (
              <span key={e} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, flexShrink: 0,
                               background: COLOR_ESTADO[e],
                               /* Aro del color del fondo: el `#fab219` y el gris
                                  se pierden contra el blanco sin un borde. */
                               boxShadow: `0 0 0 1px ${LINEA}` }} />
                <span style={{ color: TX_MED }}>{ETIQUETA_ESTADO[e]}</span>
                <strong style={{ color: TX_ALTO, fontVariantNumeric: 'tabular-nums' }}>
                  {porEstadoBase[e]}
                </strong>
              </span>
            ))}
          </div>

          <SoloEnCliente>
            <div style={{ display: 'grid', gap: 11 }}>
              {cruce.map(r => (
                <div key={r.clave}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                fontSize: 12.5, marginBottom: 4, gap: 12 }}>
                    {/* `cuentas.giro` es TEXTO LIBRE y hay valores de más de
                        ochenta caracteres («Correduría / Despacho de Seguros
                        Independiente - Ramos: Auto, Vida, GMM…»). Se recorta
                        la ETIQUETA, nunca el dato: el valor completo queda en
                        el `title` y el reparto sigue contando sobre el
                        original. Inventar categorías para que quepan sería
                        meter una clasificación que nadie acordó. */}
                    <span style={{ color: TX_ALTO, fontWeight: 600, overflow: 'hidden',
                                   textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={r.clave}>{r.clave}</span>
                    <span style={{ color: TX_MED, fontVariantNumeric: 'tabular-nums',
                                   whiteSpace: 'nowrap' }}>
                      {r.n} · {Math.round((r.n / Math.max(1, base.length)) * 100)}%
                    </span>
                  </div>
                  {/* Las barras se dibujan con divs, no con recharts: una
                      apilada horizontal es exactamente esto y recharts en esta
                      página obligaría a envolver y a vigilar el SSR sin ganar
                      nada. [[recharts-nunca-en-servidor]] */}
                  <div style={{ display: 'flex', gap: 2, height: 18, width: `${(r.n / maxN) * 100}%` }}>
                    {ORDEN_ESTADO.filter(e => r.por[e] > 0).map(e => (
                      <div key={e}
                           title={`${ETIQUETA_ESTADO[e]} · ${r.por[e]} de ${r.n}`}
                           style={{ flex: `${r.por[e]} 1 0`, borderRadius: 4,
                                    background: COLOR_ESTADO[e], minWidth: 3,
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', overflow: 'hidden' }}>
                        {/* La cifra sólo se escribe cuando el segmento es lo
                            bastante ancho para que entre: un número cortado a
                            la mitad miente más que no ponerlo. El umbral es la
                            parte del raíl que ocupa el segmento. */}
                        {(r.por[e] / maxN) >= 0.035 && (
                          <span style={{ fontSize: 10.5, fontWeight: 800,
                                         color: TINTA_ESTADO[e],
                                         fontVariantNumeric: 'tabular-nums' }}>
                            {r.por[e]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SoloEnCliente>

          {/* EL REPARTO CIERRA, Y SE DICE — en los dos sentidos: los grupos
              suman el total Y los segmentos suman cada grupo. */}
          <p style={{ fontSize: 11.5, color: TX_BAJO, marginTop: 12, lineHeight: 1.6,
                      borderTop: `1px solid ${LINEA}`, paddingTop: 10 }}>
            {cruce.length} grupos y {ORDEN_ESTADO.length} estatus suman{' '}
            <strong style={{ color: sumaCruce === base.length ? TX_MED : ROJO_TX }}>
              {sumaCruce} de {base.length}
            </strong>{' '}
            contratos: ninguno se queda fuera del reparto ni se cuenta dos veces.
            {dim === 'estado' && (
              <> Partido por estatus cada barra es de un solo color, que es lo correcto: el eje y el
              color dicen lo mismo. Elige otra dimensión para ver el cruce.</>
            )}
            {DIMENSIONES.find(x => x.id === dim)?.soloCartera && !soloCartera && (
              <> Esta dimensión sale de la cartera, así que los contratos que no cruzan van en su
              propio cubo en vez de desaparecer.</>
            )}
            {dim === 'giro' && (
              <> El giro se captura como <strong>texto libre</strong> en la ficha de cada cuenta, no
              con un catálogo, así que casi cada cuenta trae el suyo y las barras salen de una en
              una. Pasa el cursor para leer el valor completo. Agrupar esto pide decidir un catálogo
              de sectores, que es de dirección.</>
            )}
          </p>
        </div>
      </div>

      {/* ═══ LA LISTA DE TODOS ════════════════════════════════════════════ */}
      <div style={{ padding: '18px 32px 32px' }}>
        <div style={{ borderRadius: 14, border: `1px solid ${LINEA}`, background: '#FFFFFF',
                      overflow: 'hidden' }}>
          <div style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12,
                        alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: `1px solid ${LINEA}` }}>
            {/* El buscador ya NO vive aquí: vive en la barra de arriba, que
                manda sobre toda la pantalla. Dos buscadores en la misma página
                es la forma más rápida de que dos cifras no cuadren. */}
            <h3 style={{ fontSize: 14, fontWeight: 800, color: TX_ALTO }}>
              {hayFiltro
                ? `Contratos filtrados (${lista.length} de ${m.total})`
                : `Todos los contratos (${lista.length})`}
            </h3>
            {/* EL SUBTÍTULO DICE EL ORDEN VIGENTE, NO EL DE FÁBRICA. Decía
                «ordenados por lo que vence antes» siempre; en cuanto se puede
                reordenar, esa frase se vuelve falsa en el primer clic. */}
            <p style={{ fontSize: 11.5, color: TX_BAJO }}>
              ordenados por <strong style={{ color: TX_MED }}>
                {(COLUMNAS.find(c => c.id === orden.campo) ?? COLUMNAS[6]).label.toLowerCase()}
              </strong>
              {orden.dir === 'asc' ? ' ascendente' : ' descendente'}
              {' · '}{(COLUMNAS.find(c => c.id === orden.campo) ?? COLUMNAS[6]).ayuda}
              {orden.campo !== ORDEN_INICIAL.campo || orden.dir !== ORDEN_INICIAL.dir ? (
                <> · <button onClick={() => setOrden(ORDEN_INICIAL)}
                             style={{ background: 'none', border: 'none', padding: 0,
                                      font: 'inherit', color: '#1D6CAA', fontWeight: 700,
                                      cursor: 'pointer', textDecoration: 'underline' }}>
                  volver al orden de salida
                </button></>
              ) : null}
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 12.5, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: LAVADO }}>
                  {COLUMNAS.map(col => {
                    const activa = orden.campo === col.id
                    return (
                      /* `aria-sort` en el <th> y un <button> dentro: es lo que
                         hace que un lector de pantalla anuncie «ordenable» y
                         diga en qué sentido está. Un <th> con `onClick` se
                         oye como un encabezado mudo y no se alcanza con el
                         teclado. */
                      <th key={col.id} scope="col"
                          aria-sort={activa ? (orden.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                          style={{ textAlign: 'left', padding: 0,
                                   borderBottom: `1px solid ${LINEA}`, whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => ordenaPor(col.id)}
                          title={`Ordenar por ${col.label.toLowerCase()} — ${col.ayuda}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4, width: '100%',
                            padding: '8px 10px', background: 'none', border: 'none',
                            cursor: 'pointer', font: 'inherit', textAlign: 'left',
                            /* La columna activa en MARINO y la inactiva en el
                               gris de siempre: el triángulo solo no basta —son
                               8 píxeles— y el color solo tampoco, porque es
                               una diferencia de tono. Van los dos. */
                            color: activa ? MARINO : TX_BAJO,
                            fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                            letterSpacing: '0.02em',
                          }}>
                          {col.label}
                          <span aria-hidden="true" style={{ fontSize: 9, opacity: activa ? 1 : 0.35 }}>
                            {activa ? (orden.dir === 'asc' ? '▲' : '▼') : '▲'}
                          </span>
                        </button>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {lista.map((c, i) => <Fila key={i} c={c} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Un desplegable de filtro con su etiqueta visible.
 *
 * La etiqueta NO es decorativa: con cinco selectores en una fila, uno que sólo
 * dice «Cualquier plazo» obliga a adivinar qué filtra, y en cuanto hay algo
 * elegido —«12 meses»— deja de decir de qué es. Se marca además con el borde
 * cuando está activo, para que a simple vista se vea CUÁNTOS filtros hay
 * puestos sin leerlos uno por uno.
 */
function Selector({ label, valor, onChange, opciones }: {
  label: string
  valor: string
  onChange: (v: string) => void
  opciones: { v: string; t: string }[]
}) {
  const activo = valor !== ''
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em',
                     color: activo ? MARINO : TX_BAJO, textTransform: 'uppercase' }}>
        {label}
      </span>
      <select value={valor} onChange={e => onChange(e.target.value)}
              style={{ fontSize: 12.5, padding: '6px 9px', borderRadius: 8, maxWidth: 220,
                       border: `1px solid ${activo ? MARINO : LINEA}`,
                       background: activo ? '#F2F7FC' : '#FFF',
                       color: TX_ALTO, fontWeight: activo ? 700 : 400 }}>
        {opciones.map(o => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </label>
  )
}

function Caja({ n, label, color, pie }: {
  n: number; label: string; color: string; pie?: string
}) {
  return (
    <div style={{ minWidth: 128 }}>
      <p style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.04em',
                  color: TX_BAJO, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color }}>{n}</p>
      {pie && <p style={{ fontSize: 11, color: TX_BAJO, marginTop: 3 }}>{pie}</p>}
    </div>
  )
}

function Pastilla({ texto, fuerte }: { texto: string; fuerte?: boolean }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                   background: fuerte ? MARINO : LAVADO,
                   color: fuerte ? '#FFFFFF' : TX_MED,
                   border: `1px solid ${fuerte ? MARINO : LINEA}` }}>{texto}</span>
  )
}

function Fila({ c }: { c: ContratoCruzado }) {
  const vence = c.diasParaVencer === null
    ? (c.sinVencimiento
        ? <span style={{ color: TX_BAJO }}>sin vencimiento</span>
        : <span style={{ color: TX_BAJO }}>no se sabe</span>)
    : c.diasParaVencer < 0
      ? <strong style={{ color: ROJO_TX }}>venció hace {Math.abs(c.diasParaVencer)} d</strong>
      : c.diasParaVencer <= 30
        ? <strong style={{ color: AMBAR_TX }}>en {c.diasParaVencer} d</strong>
        : <span style={{ color: TX_MED }}>en {c.diasParaVencer} d</span>

  return (
    <tr style={{ borderBottom: `1px solid ${LINEA}` }}>
      <td style={{ padding: '8px 10px', color: TX_ALTO }}>
        <span style={{ fontWeight: 600 }}>{c.cuenta}</span>
        {c.esTop && <> <Pastilla texto="TOP" fuerte /></>}
        {!c.enCartera && (
          <div style={{ fontSize: 11, color: TX_BAJO, marginTop: 2 }}>fuera de la cartera CS</div>
        )}
      </td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{c.consecutivo ?? '—'}</td>
      <td style={{ padding: '8px 10px', color: c.estado === 'firmado' ? TX_ALTO : AMBAR_TX }}>
        {ETIQUETA_ESTADO[c.estado]}
      </td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{c.plazo ?? '—'}</td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{fechaCorta(c.inicio)}</td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{fechaCorta(c.fin)}</td>
      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>{vence}</td>
      <td style={{ padding: '8px 10px', color: TX_MED, whiteSpace: 'nowrap' }}>{c.asesor ?? '—'}</td>
      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
        {c.gdoc && /^https?:\/\//.test(c.gdoc)
          ? <a href={c.gdoc} target="_blank" rel="noopener noreferrer"
               style={{ color: '#1D6CAA', fontWeight: 600 }}>ver</a>
          : <span style={{ color: TX_BAJO }}>—</span>}
      </td>
    </tr>
  )
}
