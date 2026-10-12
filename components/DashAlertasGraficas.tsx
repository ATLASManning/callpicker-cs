'use client'
import { useMemo, useState } from 'react'
import { BellRing, EyeOff } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import CustomSelect from '@/components/CustomSelect'
import type { PayloadTablero, FilaTablero } from '@/lib/alertas-tablero'
import * as TEMA from '@/lib/chart-theme'
import ChartCard from '@/components/charts/ChartCard'

/**
 * EL DASHBOARD DEJA DE REPETIR LA LISTA Y PASA A ANALIZARLA.
 *
 * Instrucción de dirección, 8 oct 2026, con captura en la mano: *«lo que debe
 * existir en el Dashboard son gráficas del tema en cuestión, con los combos
 * que permita elegir datos para obtener data»*. Antes había aquí un
 * `PanelAlertas` que pintaba las mismas cifras y las mismas diez filas que
 * `/alertas`. Quien abría las dos pantallas veía dos veces lo mismo.
 *
 * `/alertas` contesta QUÉ CUENTA atender. Esto contesta de qué está hecha la
 * cartera, dónde está el dinero y qué nos falta para poder opinar.
 *
 * ── LAS TRES GRÁFICAS, Y POR QUÉ ESAS ────────────────────────────────────
 *
 * Las dimensiones se midieron contra producción ANTES de escribir una línea
 * de JSX (`scripts/mide-dimensiones-dashboard.py`), porque un indicador que
 * nunca cambia entrena a no mirarlo. Lo descartado por plano: `dueno` (vale
 * 'asesor' en las 192), `fallas` (mediana 0, p75 1) y `reuniones` (0 y 4).
 *
 *   1 · EL CORTE ELEGIBLE — seis maneras de partir la cartera, apiladas por
 *       situación, y filtrables por clase de hallazgo.
 *   2 · DE CUÁNTAS FUENTES SABEMOS — el histograma 1/8…8/8. Es literalmente
 *       «una gráfica de cuentas completas y aquellas que hagan falta
 *       información». Reparto medido: 3·5·12·63·51·41·11·6, mediana 5.
 *   3 · QUÉ FUENTE FALTA Y CUÁNTO DINERO TAPA — la mitad accionable: no dice
 *       «le faltan 4 fuentes», dice cuál y a quién pedírsela.
 *
 * ── UNA TRAMPA QUE HAY QUE CONOCER ANTES DE LEER ESTO ────────────────────
 *
 * «No la vemos» es el cubo peor medido POR DEFINICIÓN: `veredictoDe` mete ahí
 * una cuenta justamente cuando le faltan las llamadas o el consumo
 * (`alertas-veredicto.ts:412`). Que su mediana de fuentes sea la más baja no
 * es un hallazgo, es la definición. Lo que SÍ es un hecho —y por eso la
 * gráfica 1 arranca medida en dinero— es que ese cubo se lleva el 56% de la
 * facturación medida: la definición no dice nada del MRR.
 *
 * ── CONTRASTE, CON LOS NÚMEROS AL LADO ───────────────────────────────────
 *
 * Isla OSCURA sobre página clara: letra clara aquí dentro. Cada relleno lleva
 * escrito lo que mide contra el `#0F2040` del panel; el más justo es el GRIS
 * de «sin dato», 3.39:1, y el mínimo de un objeto gráfico es 3:1. El blanco
 * al 45% que usan los paneles vecinos mide 4.31:1 sobre este fondo y aquí NO
 * se usa: el tenue es 0.52 (5.4:1).
 * Ver [[atlas-dashboard-contrast-architecture]].
 */

const PANEL  = '#0F2040'
const BORDER = 'rgba(255,255,255,0.10)'
const TX_HI  = '#FFFFFF'                      /* 16.14:1 */
const TX_MID = 'rgba(255,255,255,0.70)'       /*  8.48:1 */
/* 0.52 y no el 0.45 de los paneles vecinos: sobre este `#0F2040` el 45% mide
   4.31:1, por debajo del 4.5 de AA. El mínimo que pasa es 0.47; 0.52 da 5.4.
   Medido el 9 oct 2026. */
const TX_LOW = 'rgba(255,255,255,0.52)'       /*  4.99:1 */

/** Todo texto de color va en un `<span>` que declara su propio `background`:
 *  `globals.css` fuerza a blanco cualquiera que no lo haga, y esto es una
 *  isla oscura. */
const C = (color: string, extra: React.CSSProperties = {}): React.CSSProperties =>
  ({ color, background: 'transparent', ...extra })

/**
 * LA PALETA DE SITUACIONES ES PROPIA DE ESTA GRÁFICA, no la del semáforo.
 *
 * Salía de `LUZ[SITUACION[k].luz].color` y la luz NO es única por situación:
 * `no_la_vemos` y `sin_auditar` son las dos «amarillo» y además van PEGADAS
 * en la pila. Resultado: 152 de las 192 cuentas en un único bloque amarillo
 * sin frontera, con dos pastillas idénticas en la leyenda rotuladas distinto.
 * Lo mismo `oportunidad` y `en_orden`, las dos «verde».
 *
 * Estos siete se calcularon, no se eligieron: `scripts/mide-paleta-situaciones.py`
 * exige 3:1 contra el panel, 10 de separación OKLab entre los que se tocan en
 * la pila, 8 entre cualquier par, y 8 contra los tres colores de asesor —que
 * conviven en la misma tarjeta—. El naranja «natural» para `apagandose` era
 * `#F97316`, que resultó ser EXACTAMENTE el de Claudia; `#B5651D` es el que
 * pasa las seis restricciones sin romper la escala rojo→ámbar→amarillo.
 */
/* ══════════════════════════════════════════════════════════════════════════
   LA PALETA SALE DEL TEMA, Y EL NÚMERO DE SERIES TAMBIÉN (oct 2026)
   ══════════════════════════════════════════════════════════════════════════

   Dirección cerró la paleta a marino, plata, naranja y blanco. Medido con
   `scripts/mide-paleta-dashboard.py`, eso da un trilema:

     paleta cerrada + 7 categorías  ->  separación 3.7 en OKLab. ILEGIBLE.
     paleta cerrada + legibilidad   ->  máximo 3 categorías.
     7 categorías + legibilidad     ->  22.6, pero es un arcoíris (prohibido).

   Esta gráfica apila de dos maneras según el corte:

     · por ASESOR  (cuando el corte es «situación») -> 3 series. La paleta lo
       da holgado: 21.2 de separación medida. Se restyla y ya.
     · por SITUACIÓN (los otros cinco cortes)       -> 7 series. Ése es el
       caso ilegible, y además los datos lo agravan: hoy `en_orden` tiene CERO
       cuentas y `oportunidad` UNA, mientras `no_la_vemos` y `sin_auditar` se
       llevan 152 de 193.

   Así que al apilar por situación se agrupa en TRES BANDAS DE RIESGO, que no
   son un invento: agrupan la `luz` que ya trae `SITUACION` en
   `lib/alertas-veredicto.ts`. Las siete situaciones NO se pierden — siguen en
   el tooltip, con su cuenta. Lo que se quita es pretender que siete colores se
   distinguen cuando se separan 3.7.
   ══════════════════════════════════════════════════════════════════════════ */

/** Las tres bandas, de menor a mayor riesgo. Separación medida: 11.1. */
const BANDA_COLOR: Record<string, string> = {
  bajo:  TEMA.SILVER[300],   /* 7.65:1 sobre la tarjeta */
  medio: '#E5A585',          /* 6.30:1 — interpolación OKLab plata→naranja */
  alto:  TEMA.ORANGE[500],   /* 5.04:1 */
}
const BANDA_TITULO: Record<string, string> = {
  bajo:  'En orden o con oportunidad',
  medio: 'Falta información',
  alto:  'Hay que actuar',
}
/** De qué banda es cada situación. Agrupa la `luz` del catálogo. */
const BANDA_DE: Record<string, string> = {
  en_orden: 'bajo', oportunidad: 'bajo', hay_que_mostrarle: 'bajo',
  sin_auditar: 'medio', no_la_vemos: 'medio',
  apagandose: 'alto', se_va: 'alto',
}
const ORDEN_BANDA = ['bajo', 'medio', 'alto']
/** Sólo la banda alta lleva trama: es la que hay que reconocer a dos metros,
 *  y la que tiene que sobrevivir a una impresión en gris. */
const BANDA_TRAMA: Record<string, boolean> = { bajo: false, medio: false, alto: true }

const COLOR_ASESOR: Record<string, string> = TEMA.ASESOR
const COLOR_CLASE: Record<string, string> = {
  riesgo:   TEMA.ORANGE[500],
  entrega:  TEMA.WHITE.soft,
  analisis: TEMA.SILVER[500],
}
const GRIS  = TEMA.SILVER[500]
const VERDE = TEMA.ORANGE[400]   /* lo que antes era «bien» ahora es acento */

const pesos = (n: number) => TEMA.mxn(n)
const miles = (n: number) => TEMA.mxnCompacto(n)

type Medida = 'cuentas' | 'mrr'
type Corte = 'situacion' | 'hallazgo' | 'asesor' | 'relacion' | 'candidatura' | 'tamano'
type Clase = '' | 'riesgo' | 'entrega' | 'analisis'

const CORTES: Record<Corte, { label: string; pregunta: string; particion: boolean }> = {
  situacion:   { label: 'Situación de la cuenta', particion: true,
                 pregunta: 'En qué estado está la cartera, y de quién es cada parte' },
  hallazgo:    { label: 'Tipo de hallazgo',       particion: false,
                 pregunta: 'De qué está hecho el trabajo que tiene encima el equipo' },
  asesor:      { label: 'Asesor',                 particion: true,
                 pregunta: 'Cómo se reparte la cartera entre los tres, y con qué mezcla' },
  relacion:    { label: 'Nivel de relación',      particion: true,
                 pregunta: 'Cuánta cartera tiene relación construida, y cuánta no' },
  candidatura: { label: 'Candidatura de crecimiento', particion: true,
                 pregunta: 'A qué es candidata la cartera, y qué parte no lo es a nada hoy' },
  tamano:      { label: 'Tamaño (las 25 TOP)',    particion: true,
                 pregunta: 'Si las cuentas grandes están mejor atendidas que el resto' },
}

const CLASES: { k: Clase; label: string }[] = [
  { k: '',         label: 'Hallazgos de toda clase' },
  { k: 'riesgo',   label: 'Sólo riesgo' },
  { k: 'entrega',  label: 'Sólo para enseñarle' },
  { k: 'analisis', label: 'Sólo lo que nos falta' },
]

/** Cuántas filas del corte se pintan antes de agrupar el resto.
 *  «Tipo de hallazgo» tiene 26 valores y una gráfica de 26 barras no se lee;
 *  el resto va a un cubo «otros» que SE DECLARA, nunca se tira. */
const TOPE_FILAS = 12

export default function DashAlertasGraficas({ datos }: { datos: PayloadTablero }) {
  const [medida, setMedida] = useState<Medida>('mrr')
  const [corte,  setCorte]  = useState<Corte>('situacion')
  const [quien,  setQuien]  = useState('')
  const [clase,  setClase]  = useState<Clase>('')

  /* Los asesores que existen en los DATOS: pueblan el combo. */
  const asesores = useMemo(() => {
    const vivos = Array.from(new Set(
      datos.filas.map(f => f.asesor).filter(Boolean))).sort() as string[]
    return datos.filas.some(f => !f.asesor) ? [...vivos, 'sin asesor'] : vivos
  }, [datos.filas])

  /* `quien` NO se usa crudo: si el dato se recarga y ese asesor ya no está,
     el combo se queda mostrando un valor que no filtra nada y la pantalla
     enseña la cartera entera bajo su nombre. Se deriva. */
  const quienOk = quien && asesores.includes(quien) ? quien : ''

  const filas = useMemo(
    () => quienOk ? datos.filas.filter(f => f.asesor === quienOk) : datos.filas,
    [datos.filas, quienOk])

  /* Los asesores PRESENTES en lo filtrado: éstos son los que llevan barra y
     pastilla. Con `quienOk` puesto son uno, y usar la lista completa dejaba
     dos `<Bar>` vacíos y dos pastillas prometiendo series que no se dibujan. */
  const asesoresVista = useMemo(() => {
    const presentes = new Set(filas.map(f => f.asesor ?? 'sin asesor'))
    return asesores.filter(a => presentes.has(a))
  }, [asesores, filas])

  /* El dinero que NO se puede sumar. Diez cuentas vivas no tienen importe en
     ninguna fuente; meterlas como cero diría que no valen nada, cuando lo que
     pasa es que no lo sabemos. Se cuentan aparte y se dicen con palabras.
     Ver [[feedback-cero-sin-medicion]]. */
  const sinImporte = filas.filter(f => f.mrr === null).length
  const conImporte = filas.length - sinImporte
  const totalMrr   = filas.reduce((s, f) => s + (f.mrr ?? 0), 0)

  const vale = (f: FilaTablero) => medida === 'mrr' ? (f.mrr ?? 0) : 1
  const fmt  = (v: number) => medida === 'mrr' ? miles(v) : String(Math.round(v))
  const fmtLargo = (v: number) =>
    medida === 'mrr' ? pesos(v) : `${Math.round(v)} ${v === 1 ? 'cuenta' : 'cuentas'}`

  const def = CORTES[corte]
  const titular = datos.alcance.asesor
    ? `Cartera de ${datos.alcance.asesor}`
    : quienOk ? `Cartera de ${quienOk}` : 'Cartera completa'

  /* Los hallazgos de una fila, ya filtrados por la clase elegida. */
  const hallazgosDe = (f: FilaTablero) => clase
    ? f.hallazgos.filter(i => datos.catalogo[i]?.clase === clase)
    : f.hallazgos

  const apilaPor: 'situacion' | 'asesor' = corte === 'situacion' ? 'asesor' : 'situacion'
  const series = useMemo(() => {
    if (apilaPor === 'asesor') {
      /* Misma FORMA que la otra rama aunque `trama` y `dentro` vayan vacíos:
         si las dos ramas devuelven tipos distintos, TypeScript infiere una
         unión y tocar `.dentro` revienta en la rama equivocada. */
      return asesoresVista.map(a => ({
        k: a, label: a, color: COLOR_ASESOR[a] ?? GRIS,
        trama: false, dentro: [] as string[],
      }))
    }
    /* TRES BANDAS, no siete situaciones. Siete colores se separan 3.7 en
       OKLab y nadie los distingue; tres se separan 11.1. Y sólo las bandas
       PRESENTES: pintar una vacía daría una serie de altura cero y una
       pastilla prometiendo algo que no está. */
    const presentes = new Set(filas.map(f => BANDA_DE[f.situacion] ?? 'medio'))
    return ORDEN_BANDA.filter(b => presentes.has(b)).map(b => ({
      k: b,
      label: BANDA_TITULO[b],
      color: BANDA_COLOR[b],
      trama: BANDA_TRAMA[b],
      /* Qué situaciones hay dentro, para que el tooltip y la leyenda lo digan.
         La información de las siete no se pierde: cambia de sitio. */
      dentro: datos.situaciones
        .filter(s => (BANDA_DE[s.k] ?? 'medio') === b
                  && filas.some(f => f.situacion === s.k))
        .map(s => s.titulo),
    }))
  }, [apilaPor, asesoresVista, filas, datos.situaciones])

  const g1 = useMemo(() => {
    const cubo = new Map<string, { label: string; color: string; total: number; cuentas: number; por: Record<string, number> }>()
    const mete = (clave: string, label: string, color: string, f: FilaTablero) => {
      let e = cubo.get(clave)
      if (!e) { e = { label, color, total: 0, cuentas: 0, por: {} }; cubo.set(clave, e) }
      /* Al apilar por situación, la SERIE es la BANDA. El dato de la fila no
         cambia —`f.situacion` sigue siendo la situación exacta— sólo cambia
         en qué cubo de color cae. */
      const serie = apilaPor === 'asesor'
        ? (f.asesor ?? 'sin asesor')
        : (BANDA_DE[f.situacion] ?? 'medio')
      e.total += vale(f)
      e.cuentas += 1
      e.por[serie] = (e.por[serie] ?? 0) + vale(f)
    }

    for (const f of filas) {
      if (corte === 'situacion') {
        const s = datos.situaciones.find(x => x.k === f.situacion)
        /* Cuando el corte ES la situación, cada FILA es una situación (las
           siete siguen ahí, con su nombre) y lo que se apila dentro son los
           tres asesores. El color de la fila es su acento de riesgo: una tira
           ordenada plata→naranja, no una serie que compita con otras. */
        mete(f.situacion, s?.titulo ?? f.situacion,
             TEMA.acentoDeSituacion(f.situacion), f)
      } else if (corte === 'asesor') {
        const a = f.asesor ?? 'sin asesor'
        mete(a, a, COLOR_ASESOR[a] ?? GRIS, f)
      } else if (corte === 'relacion') {
        mete(f.relacionNivel, f.relacionNivel, GRIS, f)
      } else if (corte === 'candidatura') {
        /* TRES cubos, no dos. «Hoy no es candidata a nada» metía en el mismo
           saco a la cuenta sana sin espacio para crecer y a la que SÍ tiene
           candidatura pero de las de resolver primero —estabilizar,
           reactivar—, que `datos.candidatura` no publica porque sólo trae las
           de CRECIMIENTO. Eran dos cosas opuestas bajo un rótulo que negaba
           las dos. */
        const k = f.candidatura
          ?? (f.candidaturasTotal > 0 ? 'Primero hay que resolverle algo'
                                      : 'Hoy no es candidata a nada')
        mete(k, k, f.candidatura ? VERDE : f.candidaturasTotal > 0 ? '#FBBF24' : GRIS, f)
      } else if (corte === 'tamano') {
        mete(f.esTop ? 'top' : 'resto', f.esTop ? 'top' : 'resto',
             f.esTop ? '#EAB308' : GRIS, f)
      } else {
        for (const i of new Set(hallazgosDe(f))) {
          const h = datos.catalogo[i]
          if (h) mete(h.titulo, h.titulo, COLOR_CLASE[h.clase] ?? GRIS, f)
        }
      }
    }

    /* El rótulo del corte por tamaño lleva el CONTEO REAL del cubo. Decía
       «Las 25 más grandes» siempre, y con el filtro de Dan puesto esa barra
       tiene 7: un rótulo constante sobre un cubo que cambia. */
    if (corte === 'tamano') {
      const t = cubo.get('top'), r = cubo.get('resto')
      if (t) t.label = quienOk ? `${t.cuentas} de las 25 TOP` : `Las ${t.cuentas} TOP`
      if (r) r.label = `El resto (${r.cuentas})`
    }

    const todas = Array.from(cubo.values()).sort((a, b) => b.total - a.total)
    if (corte === 'situacion') {
      /* La situación se lee en el orden del catálogo —de peor a mejor—, no
         por tamaño: es un semáforo y un semáforo tiene su orden. */
      const pos = new Map(datos.situaciones.map((s, i) => [s.titulo, i]))
      todas.sort((a, b) => (pos.get(a.label) ?? 99) - (pos.get(b.label) ?? 99))
    }

    const apariciones = todas.reduce((s, x) => s + x.cuentas, 0)
    if (todas.length <= TOPE_FILAS) {
      return { filas: todas, otros: null as null | { n: number; total: number }, apariciones }
    }

    /* TOPE + CUBO «OTROS», nunca un top-N a secas: tirar la cola miente sin
       decirlo. Ver [[feedback-tablas-deben-cerrar]]. */
    const visibles = todas.slice(0, TOPE_FILAS)
    const cola = todas.slice(TOPE_FILAS)
    const otros = {
      label: `Otros ${cola.length} tipos`, color: GRIS,
      total: cola.reduce((s, x) => s + x.total, 0),
      cuentas: cola.reduce((s, x) => s + x.cuentas, 0),
      por: cola.reduce<Record<string, number>>((acc, x) => {
        for (const [k, v] of Object.entries(x.por)) acc[k] = (acc[k] ?? 0) + v
        return acc
      }, {}),
    }
    return { filas: [...visibles, otros], otros: { n: cola.length, total: otros.total }, apariciones }
  }, [filas, corte, medida, clase, apilaPor, quienOk, datos.situaciones, datos.catalogo])

  /* El assert de cierre, para los cortes que SÍ son partición. */
  const sumaG1 = g1.filas.reduce((s, f) => s + f.total, 0)
  const totalG1 = medida === 'mrr' ? totalMrr : filas.length
  const descuadre = def.particion && Math.abs(sumaG1 - totalG1) > 0.5
    ? `los cubos suman ${fmt(sumaG1)} y la cartera filtrada mide ${fmt(totalG1)}`
    : null

  const datosG1 = g1.filas.map(f => ({ name: f.label, ...f.por }))

  /** Cuántas apariciones hay de cada clase de hallazgo en la vista. */
  const mezclaClases = useMemo(() => {
    const n: Record<string, number> = { riesgo: 0, entrega: 0, analisis: 0 }
    for (const f of filas) {
      for (const i of new Set(f.hallazgos)) {
        const h = datos.catalogo[i]
        if (h) n[h.clase] = (n[h.clase] ?? 0) + 1
      }
    }
    return [
      { k: 'riesgo',   label: 'riesgo',          n: n.riesgo },
      { k: 'entrega',  label: 'para enseñarle',  n: n.entrega },
      { k: 'analisis', label: 'nos falta',       n: n.analisis },
    ]
  }, [filas, datos.catalogo])

  /* ── GRÁFICA 2 · de cuántas fuentes sabemos ──────────────────────────── */
  const g2 = useMemo(() => {
    const cubos = Array.from({ length: 9 }, (_, n) => ({
      n, cuentas: 0, valor: 0, por: {} as Record<string, number>,
    }))
    for (const f of filas) {
      const c = cubos[f.nFuentes]
      if (!c) continue
      c.cuentas += 1
      c.valor += vale(f)
      const a = f.asesor ?? 'sin asesor'
      c.por[a] = (c.por[a] ?? 0) + vale(f)
    }
    /* Sin una sola cuenta no hay histograma: devolver algo recortado pintaría
       una columna inventada —y el recorte de bordes convergía justo en «8/8»,
       el cubo mejor medido, que es la mentira más cómoda. */
    if (!filas.length) return []
    let i = 0, j = cubos.length - 1
    while (i < j && cubos[i].cuentas === 0) i++
    while (j > i && cubos[j].cuentas === 0) j--
    return cubos.slice(i, j + 1)
  }, [filas, medida])

  const medianaFuentes = useMemo(() => {
    if (!filas.length) return null
    const xs = filas.map(f => f.nFuentes).sort((a, b) => a - b)
    const m = Math.floor(xs.length / 2)
    return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2
  }, [filas])

  /** La mediana SÓLO si cae justo en una columna del histograma. */
  const medianaEnColumna = medianaFuentes !== null && Number.isInteger(medianaFuentes)
    ? medianaFuentes : null

  const datosG2 = g2.map(c => ({ name: `${c.n}/8`, ...c.por }))
  /* Los cubos que tienen cuentas pero valen 0 en dinero. Son las más ciegas
     —sin importe medible— y en modo dinero su columna se dibuja a altura
     cero, idéntica a «aquí no hay nadie». Se nombran debajo. */
  const mudos = medida === 'mrr' ? g2.filter(c => c.cuentas > 0 && c.valor === 0) : []

  /* ── GRÁFICA 3 · qué fuente falta y cuánto dinero tapa ───────────────── */
  const g3 = useMemo(() => datos.fuentes.map((fu, i) => {
    let nCon = 0, nSin = 0, dineroSin = 0, nSinImporte = 0
    for (const f of filas) {
      if (f.fuentes[i]) { nCon += 1; continue }
      nSin += 1
      /* El dinero tapado NO suma las cuentas sin importe como cero. La fila
         de «Facturación» decía «10 sin dato · $0», y leído así parece que ese
         hueco no esconde nada — cuando es justo el único cuyo dinero no se
         puede conocer. */
      if (f.mrr === null) nSinImporte += 1
      else dineroSin += f.mrr
    }
    return { ...fu, nCon, nSin, dineroSin, nSinImporte }
  }).sort((a, b) => medida === 'mrr' ? b.dineroSin - a.dineroSin : b.nSin - a.nSin),
  [filas, medida, datos.fuentes])

  const tooltip = {
    contentStyle: {
      background: TEMA.NAVY[900], border: `1px solid ${BORDER}`,
      borderRadius: 10, fontSize: TEMA.FUENTE.cuerpo,
    },
    labelStyle: { color: TX_HI, fontWeight: 700 },
    itemStyle: { color: TX_HI },
    cursor: { fill: 'rgba(255,255,255,0.05)' },
  }

  /** Devuelve los combos a su estado inicial. Lo llama el botón «restablecer»
   *  de cada tarjeta y la tecla R. */
  const reestablecer = () => {
    setMedida('mrr'); setCorte('situacion'); setQuien(''); setClase('')
  }

  /* ── LOS INSIGHTS ─────────────────────────────────────────────────────
     Una frase en lenguaje natural encima de cada gráfica, como pidió
     dirección. Se CALCULAN de los datos a la vista, y cuando no hay nada que
     destacar devuelven `null` y la tarjeta no pinta la banda: una frase
     inventada para rellenar el hueco entrena a no leerla. */

  const insightG1 = useMemo(() => {
    if (datosG1.length === 0) return null
    const tot = datosG1.reduce((s, d) => s + d.total, 0)
    if (tot <= 0) return null
    const orden = [...datosG1].sort((a, b) => b.total - a.total)
    /* Cuántas barras hacen falta para pasar del 60%: es la frase que de verdad
       cambia una decisión —«tres concentran el 62%»— y no un máximo suelto. */
    let acum = 0, n = 0
    for (const d of orden) { acum += d.total; n += 1; if (acum / tot >= 0.6) break }
    const pct = Math.round((acum / tot) * 100)
    if (n >= orden.length) return null   // repartido: no hay concentración que contar
    const cuales = orden.slice(0, n).map(d => d.name).join(', ')
    return medida === 'mrr'
      ? `${n === 1 ? 'Una sola categoría concentra' : `${n} categorías concentran`} `
        + `el ${pct}% del dinero: ${cuales}.`
      : `${n === 1 ? 'Una sola categoría concentra' : `${n} categorías concentran`} `
        + `el ${pct}% de las cuentas: ${cuales}.`
  }, [datosG1, medida])

  const insightG2 = useMemo(() => {
    if (filas.length === 0) return null
    const ciegas = filas.filter(f => f.nFuentes <= 3)
    if (ciegas.length === 0) return null
    const dinero = ciegas.reduce((s, f) => s + (f.mrr ?? 0), 0)
    const pct = Math.round((ciegas.length / filas.length) * 100)
    return `${ciegas.length} cuentas (${pct}%) se ven con 3 fuentes o menos de 8`
      + (dinero > 0 ? `, y ahí hay ${miles(dinero)} al mes.` : '.')
  }, [filas])

  const insightG3 = useMemo(() => {
    const peor = g3[0]
    if (!peor || peor.nSin === 0) return null
    const pct = Math.round((peor.nSin / Math.max(filas.length, 1)) * 100)
    return `La fuente que más tapa es ${peor.etiqueta.toLowerCase()}: le falta al ${pct}% `
      + `de la cartera` + (peor.dineroSin > 0 ? `, ${miles(peor.dineroSin)} al mes.` : '.')
  }, [g3, filas.length])

  const Cabecera = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                  gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
      <div>
        <div className="flex items-center gap-2">
          <BellRing size={13} style={{ color: '#F87171' }} />
          <h3 className="text-xs font-bold uppercase tracking-[0.10em]" style={C(TX_HI)}>
            Alertas de Cliente · análisis de la cartera
          </h3>
        </div>
        <p style={C(TX_LOW, { fontSize: 11, marginTop: 3 })}>
          {def.pregunta}. {titular}:{' '}
          <span style={C(TX_MID, { fontWeight: 600 })}>
            {filas.length} {filas.length === 1 ? 'cuenta' : 'cuentas'} · {pesos(totalMrr)} al mes
          </span>
          {sinImporte > 0 && (
            <span style={C('#FBBF24')}>
              {' '}· ese importe es el de {conImporte}; de las otras {sinImporte} no
              hay cifra en ninguna fuente
            </span>
          )}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 210 }}>
          <CustomSelect value={corte} onChange={v => setCorte(v as Corte)}
            options={(Object.keys(CORTES) as Corte[]).map(k => ({ value: k, label: CORTES[k].label }))}
            className="cp-select text-xs" />
        </div>
        <div style={{ minWidth: 150 }}>
          <CustomSelect value={medida} onChange={v => setMedida(v as Medida)}
            options={[{ value: 'mrr', label: 'Medir en dinero' },
                      { value: 'cuentas', label: 'Medir en cuentas' }]}
            className="cp-select text-xs" />
        </div>
        {/* El filtro de clase sólo manda sobre el corte por hallazgo; en los
            demás no tendría a qué aplicarse y se oculta en vez de quedarse
            ahí sin hacer nada. */}
        {corte === 'hallazgo' && (
          <div style={{ minWidth: 180 }}>
            <CustomSelect value={clase} onChange={v => setClase(v as Clase)}
              options={CLASES.map(c => ({ value: c.k, label: c.label }))}
              className="cp-select text-xs" />
          </div>
        )}
        <div style={{ minWidth: 140 }}>
          <CustomSelect value={quienOk} onChange={setQuien}
            options={[{ value: '', label: 'Toda la cartera' },
                      ...asesores.map(a => ({ value: a, label: a }))]}
            className="cp-select text-xs" />
        </div>
      </div>
    </div>
  )

  const Aviso = datos.falla ? (
    <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: 10, padding: '9px 13px', marginBottom: 14 }}>
      <span style={C('#FCA5A5', { fontSize: 11.5 })}>
        Una fuente no cargó, y eso cambia lo que se puede afirmar: {datos.falla}
      </span>
    </div>
  ) : null

  /* ── SIN UNA SOLA FILA NO SE DIBUJA NADA ──────────────────────────────
   *
   * Sin este candado, con `filas = []` la gráfica 3 pintaba las ocho fuentes
   * en VERDE AL 100% —«0 sin dato» en todas— que es exactamente lo contrario
   * de lo que pasa: no es que esté todo completo, es que no se leyó nada. Y
   * el caso llega sin banner rojo cuando un rol de asesor trae un nombre que
   * no empata con ninguna cuenta: `veredictosDeCartera` devuelve cero filas
   * y `falla: null`. La pantalla se veía perfecta y vacía. */
  if (!filas.length) {
    return (
      <div className="px-6 pb-5">
        <div className="rounded-2xl p-5" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
          {Cabecera}
          {Aviso}
          <p style={C('#FBBF24', { fontSize: 12.5, lineHeight: 1.7 })}>
            No hay ni una cuenta que medir en esta vista. <strong style={C('#FBBF24')}>
            Esto no es una cartera sana: es una lectura que no ocurrió.</strong>{' '}
            {datos.falla
              ? 'El motivo está en el aviso de arriba.'
              : quienOk
                ? `Ninguna cuenta viva figura con «${quienOk}» como asesor.`
                : 'No se recibió ninguna cuenta viva, y ninguna fuente declaró fallo — '
                  + 'que es la combinación que hay que mirar primero.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    /* ANCHO MÁXIMO Y CENTRADO. En 4K el tablero se estiraba hasta que una
       barra cruzaba metro y medio de pantalla y el ojo perdía la fila. */
    <div className="px-6 pb-5" style={{ maxWidth: TEMA.ANCHO_MAX, margin: '0 auto' }}>
      <div className="rounded-2xl p-5" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
        {Cabecera}
        {Aviso}
      </div>

      {/* Grid de tarjetas con separación de base 8. */}
      <div style={{ display: 'grid', gap: TEMA.BASE * 2, marginTop: TEMA.BASE * 2 }}>

      {/* ══ 1 · EL CORTE ELEGIDO ════════════════════════════════════════ */}
      <ChartCard
        titulo={def.label}
        subtitulo={apilaPor === 'asesor'
          ? 'cada barra, repartida entre los asesores de esta vista'
          : 'cada barra, repartida por la banda de riesgo de sus cuentas'}
        ayuda={def.pregunta + '. ' + (apilaPor === 'asesor'
          ? 'Dentro de cada barra conviven los tres asesores.'
          : 'Las siete situaciones del catálogo se agrupan en tres bandas de riesgo: '
            + 'siete colores se separan 3.7 en OKLab y nadie los distingue, tres se separan 11.1. '
            + 'La leyenda dice qué situaciones hay dentro de cada banda.')}
        insight={insightG1}
        descripcion={`Gráfica de barras horizontales de ${def.label.toLowerCase()}. `
          + datosG1.map(d => `${d.name}: ${fmtLargo(d.total)}`).join('. ')}
        onReestablecer={reestablecer}
      >

        {!def.particion && (
          <p style={C('#FBBF24', { fontSize: 10.5, marginBottom: 8, lineHeight: 1.5 })}>
            Una cuenta tiene {(g1.apariciones / Math.max(filas.length, 1)).toFixed(1)} de estos
            hallazgos de media, así que aparece en varias barras. Esta columna NO suma la
            cartera: no es un reparto, es un recuento por tipo.
          </p>
        )}
        {descuadre && (
          <p style={C('#FCA5A5', { fontSize: 10.5, marginBottom: 8 })}>
            Los cubos no cierran — {descuadre}. No te fíes de esta gráfica hasta que cuadre.
          </p>
        )}

        <ResponsiveContainer width="100%" height={Math.max(150, datosG1.length * 30)}>
          <BarChart data={datosG1} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
            <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 10 }}
              axisLine={false} tickLine={false} tickFormatter={fmt} />
            <YAxis type="category" dataKey="name" width={165}
              tick={{ fill: TX_MID, fontSize: 10 }} axisLine={false} tickLine={false}
              tickFormatter={(v: string) => v.length > 24 ? v.slice(0, 24) + '…' : v} />
            <Tooltip {...tooltip} formatter={(v: number, n: string) => [fmtLargo(v), n]} />
            {/* La trama de la banda alta. Va en `<defs>` DENTRO del SVG de la
                gráfica: un `<pattern>` declarado en otro SVG del documento no
                es alcanzable por `url(#id)` desde éste. */}
            <defs>
              <pattern id={TEMA.TRAMAS.alto} width="6" height="6"
                patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill={BANDA_COLOR.alto} />
                <line x1="0" y1="0" x2="0" y2="6" stroke={TEMA.NAVY[900]}
                  strokeWidth="2" opacity="0.42" />
              </pattern>
            </defs>
            {/* `stroke` del color del panel: en una apilada, dos segmentos
                contiguos de tonos parecidos se funden sin una frontera. Y NADA
                de `radius`: en un apilado se lo lleva la última SERIE de la
                lista, que casi nunca es el último segmento con valor de esa
                fila — redondeaba un borde que está en medio de la barra. */}
            {series.map(s => (
              <Bar key={s.k} dataKey={s.k} name={s.label} stackId="a"
                fill={s.trama ? `url(#${TEMA.TRAMAS.alto})` : s.color}
                stroke={PANEL} strokeWidth={1} maxBarSize={22} />
            ))}
          </BarChart>
        </ResponsiveContainer>

        <Leyenda items={series} />

        {/* LA MEZCLA DE CLASES, cuando el corte es por hallazgo y no se ha
            filtrado. Sin esto nada en la gráfica distingue una amenaza de un
            logro: las 26 barras se ven iguales y «Lo que le hemos resuelto»
            —que es bueno— queda al lado de «Nunca se le ha contactado». */}
        {corte === 'hallazgo' && !clase && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8,
                        alignItems: 'baseline' }}>
            <span style={C(TX_LOW, { fontSize: 10.5 })}>De qué clase son:</span>
            {mezclaClases.map(m => (
              <Pastilla key={m.k} color={COLOR_CLASE[m.k] ?? GRIS}
                texto={`${m.label} · ${m.n.toLocaleString('es-MX')}`} />
            ))}
            <span style={C(TX_LOW, { fontSize: 10.5 })}>
              — el combo de al lado deja ver una sola clase
            </span>
          </div>
        )}

        {g1.otros && (
          <p style={C(TX_LOW, { fontSize: 10.5, marginTop: 6 })}>
            Los {g1.otros.n} tipos restantes van agrupados en «Otros» y valen {fmtLargo(g1.otros.total)}.
            No se tiran: entre las {TOPE_FILAS} barras y ese grupo están{' '}
            {g1.apariciones.toLocaleString('es-MX')} apariciones, que es el total de esta vista.
          </p>
        )}

      </ChartCard>

      {/* ══ 2 · DE CUÁNTAS FUENTES SABEMOS ══════════════════════════════ */}
      <ChartCard
        titulo="De cuántas fuentes sabemos de cada cuenta"
        subtitulo="facturación · consumo · llamadas · tickets · reuniones · contacto · auditoría · ficha"
        ayuda="Cada columna es un número de fuentes con dato, de 0 a 8, y su altura es la
          cartera que está en ese nivel de ceguera. Con tres fuentes de ocho no se emite
          juicio: se pide lo que falta."
        insight={insightG2}
        descripcion={`Columnas por número de fuentes con dato. `
          + datosG2.map(d => `${d.name}: ${fmtLargo(d.total)}`).join('. ')}
        onReestablecer={reestablecer}
      >
        <p style={C(TX_LOW, { fontSize: TEMA.FUENTE.cuerpo, marginBottom: 10, lineHeight: 1.6 })}>
          Con tres fuentes de ocho no se emite juicio, se pide lo que falta.
          {medianaFuentes !== null && (
            <> La mediana de esta cartera está en <span style={C(TX_HI, { fontWeight: 700 })}>
              {medianaFuentes} de 8</span>
              {medianaEnColumna === null
                ? ' — cae entre dos columnas, así que no se marca ninguna.'
                : ', marcada con la raya.'}</>
          )}
        </p>

        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={datosG2} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: TX_MID, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.52)', fontSize: 10 }}
              axisLine={false} tickLine={false} tickFormatter={fmt} width={48} />
            <Tooltip {...tooltip} formatter={(v: number, n: string) => [fmtLargo(v), n]}
              labelFormatter={(l: string) => `${l} fuentes con dato`} />
            {asesoresVista.map(a => (
              <Bar key={a} dataKey={a} name={a} stackId="f" fill={COLOR_ASESOR[a] ?? GRIS}
                stroke={PANEL} strokeWidth={1} maxBarSize={54} />
            ))}
            {/* Dos líneas superpuestas: la de abajo hace de funda del color del
                panel para que la discontinua se lea también sobre la barra, que
                es justo donde cae. Sola, el blanco al 45% sobre el morado de
                Fátima medía 1.57:1.

                Y SÓLO SI LA MEDIANA CAE EN UNA COLUMNA. Con un número par de
                cuentas —192 lo es— la mediana puede ser x.5, y entonces una
                raya redondeada se planta sobre «5/8» mientras el párrafo de
                arriba dice 4.5: la raya contradiría al texto. Cuando pasa, no
                hay raya y el texto lo dice con palabras. */}
            {medianaEnColumna !== null && (
              <ReferenceLine x={`${medianaEnColumna}/8`} stroke={PANEL} strokeWidth={3} />
            )}
            {medianaEnColumna !== null && (
              <ReferenceLine x={`${medianaEnColumna}/8`} stroke={TX_HI}
                strokeWidth={1} strokeDasharray="3 3" />
            )}
          </BarChart>
        </ResponsiveContainer>
        <Leyenda items={asesoresVista.map(a => ({ k: a, label: a, color: COLOR_ASESOR[a] ?? GRIS }))} />

        {mudos.length > 0 && (
          <p style={C('#FBBF24', { fontSize: 10.5, marginTop: 6, lineHeight: 1.5 })}>
            Medido en dinero, {mudos.map(c => `${c.n}/8`).join(' y ')} se dibuja{mudos.length > 1 ? 'n' : ''} a
            cero y ahí hay {mudos.reduce((s, c) => s + c.cuentas, 0)} cuenta
            {mudos.reduce((s, c) => s + c.cuentas, 0) === 1 ? '' : 's'}: son las más ciegas y
            ninguna tiene importe medible. Cambia a «Medir en cuentas» para verlas.
          </p>
        )}

      </ChartCard>

      {/* ══ 3 · QUÉ FUENTE FALTA, Y CUÁNTO DINERO TAPA ══════════════════ */}
      <ChartCard
        titulo="Qué fuente falta, y cuánto dinero tapa"
        subtitulo={medida === 'mrr'
          ? 'ordenadas por el dinero que hay detrás del hueco, no por el alfabeto'
          : 'ordenadas por cuántas cuentas se quedan sin ese dato'}
        ayuda="Cada fila es una de las ocho fuentes. La parte clara es la cartera que SÍ
          tiene ese dato; la plata, la que no. Y cuando parte de lo que falta tampoco tiene
          importe, la cifra lleva «≥»: el dinero tapado es al menos ése."
        insight={insightG3}
        descripcion={`Cobertura de las ocho fuentes. `
          + g3.map(f => `${f.etiqueta}: ${f.nSin} sin dato`).join('. ')}
        onReestablecer={reestablecer}
      >

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 10 }}>
          {g3.map(f => {
            const pct = (f.nSin / filas.length) * 100
            const medible = f.nSin > f.nSinImporte
            return (
              <div key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={C(TX_MID, { fontSize: 11, width: 92, flexShrink: 0 })}>{f.etiqueta}</span>
                <div style={{ flex: 1, height: 16, borderRadius: 4, overflow: 'hidden', display: 'flex',
                              background: 'rgba(255,255,255,0.05)' }}>
                  {/* Dos tramos opacos y un hueco de 2px entre ellos: el ojo
                      separa mejor por el hueco que por el borde. */}
                  <div style={{ width: `${100 - pct}%`, background: VERDE }} />
                  <div style={{ width: 2, background: PANEL }} />
                  <div style={{ width: `${pct}%`, background: GRIS }} />
                </div>
                <span style={C(pct > 50 ? '#FBBF24' : TX_MID,
                               { fontSize: 11, width: 108, textAlign: 'right', flexShrink: 0,
                                 fontVariantNumeric: 'tabular-nums' })}>
                  {f.nSin} sin dato
                </span>
                {/* El «≥» NO es adorno. Si algunas de las cuentas sin este
                    dato tampoco tienen importe, la cifra es un SUELO: el
                    dinero real que tapa el hueco es ése más lo que no se
                    sabe. La primera versión ponía «$1.78M +9», y un «+9»
                    pegado a una cifra en millones se lee como nueve millones.
                    Un símbolo que ya significa «al menos» no se malinterpreta. */}
                <span style={C(medible ? TX_HI : '#FBBF24',
                               { fontSize: 11, fontWeight: 700, width: 86, textAlign: 'right',
                                 flexShrink: 0, fontVariantNumeric: 'tabular-nums' })}
                      title={f.nSinImporte > 0
                        ? `${f.nSinImporte} de las ${f.nSin} cuentas sin este dato tampoco tienen `
                          + `importe en ninguna fuente, así que el dinero tapado es al menos éste`
                        : undefined}>
                  {medible
                    ? `${f.nSinImporte > 0 ? '≥ ' : ''}${miles(f.dineroSin)}`
                    : 'sin medir'}
                </span>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 14, flexWrap: 'wrap',
                      alignItems: 'baseline' }}>
          <Pastilla color={VERDE} texto="con dato" />
          <Pastilla color={GRIS} texto="sin dato" />
          {g3.some(f => f.nSinImporte > 0) && (
            <span style={C(TX_LOW, { fontSize: 10.5 })}>
              «≥» quiere decir que parte de las cuentas sin ese dato tampoco tienen importe:
              el dinero tapado es al menos el que se ve.
            </span>
          )}
        </div>

        {g3[0] && g3[0].nSin > 0 && g3[0].dineroSin > 0 && (
          <p style={C(TX_LOW, { fontSize: 11, marginTop: 10, lineHeight: 1.6 })}>
            La fuente que más dinero tapa es <span style={C(TX_HI, { fontWeight: 700 })}>
              {g3[0].etiqueta.toLowerCase()}</span>: {g3[0].nSin} cuentas
            y {pesos(g3[0].dineroSin)} al mes sin ese dato.
            {' '}Quién lo consigue: {g3[0].pedirA}.
          </p>
        )}

        <p style={C(TX_LOW, { fontSize: 10, marginTop: 14, lineHeight: 1.7 })}>
          «No la vemos» es el cubo peor medido por construcción —una cuenta entra ahí justamente
          cuando le faltan las llamadas o el consumo—, así que su mediana baja de fuentes no es un
          hallazgo. Lo que sí lo es: ahí vive el {totalMrr > 0
            ? Math.round(filas.filter(f => f.situacion === 'no_la_vemos')
                .reduce((s, f) => s + (f.mrr ?? 0), 0) / totalMrr * 100)
            : 0}% de la facturación MEDIDA —la de {conImporte} de estas {filas.length} cuentas—,
          y de eso la definición no dice nada.
          {sinImporte > 0 && (
            <> Medido en dinero, las {sinImporte} cuentas sin importe no mueven ninguna barra;
            para verlas hay que cambiar el combo a «Medir en cuentas».</>
          )}
        </p>
      </ChartCard>

      </div>
    </div>
  )
}

/* ── Piezas ──────────────────────────────────────────────────────────────── */

/* `Titulo` y `Separador` se retiran: cada gráfica tiene ahora su propia
   tarjeta y el encabezado lo pone `ChartCard`. Dejarlos aquí sin usar sería
   dos formas de titular conviviendo, y la siguiente persona elegiría la
   equivocada. */

/**
 * La leyenda dice QUÉ HAY DENTRO de cada banda.
 *
 * Es lo que impide que agrupar siete situaciones en tres bandas sea una
 * pérdida: la banda se llama «Hay que actuar» y debajo, en pequeño, están las
 * situaciones concretas que la componen y que hoy tienen cuentas. Sin esto, el
 * lector ve tres cubos y no sabe de qué están hechos.
 */
function Leyenda({ items }: {
  items: { k: string; label: string; color: string; trama?: boolean; dentro?: string[] }[]
}) {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 10 }}>
      {items.map(i => (
        <div key={i.k} style={{ maxWidth: 230 }}>
          <Pastilla color={i.color} texto={i.label} trama={i.trama} />
          {i.dentro && i.dentro.length > 0 && (
            <p style={{
              fontSize: 11.5, color: TEMA.TX.low, marginTop: 3, marginLeft: 16,
              lineHeight: 1.45,
            }}>{i.dentro.join(' · ')}</p>
          )}
        </div>
      ))}
    </div>
  )
}

function Pastilla({ color, texto, trama }: {
  color: string; texto: string; trama?: boolean
}) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {/* La muestra lleva la MISMA trama que la barra. Si la leyenda pinta un
          cuadro liso y la barra va rayada, el lector no empareja las dos. */}
      <span style={{
        width: 11, height: 11, borderRadius: 2, flexShrink: 0,
        background: trama
          ? `repeating-linear-gradient(45deg, ${color} 0 3px, rgba(11,31,58,0.42) 3px 5px)`
          : color,
      }} />
      <span style={C(TX_MID, { fontSize: TEMA.FUENTE.etiqueta })}>{texto}</span>
    </span>
  )
}

/** El hueco mientras el motor de veredictos calcula. Dice qué se está
 *  esperando: un bloque vacío se lee como una pantalla rota. */
export function GraficasCargando() {
  return (
    <div className="px-6 pb-5">
      <div className="rounded-2xl p-5" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2">
          <EyeOff size={13} style={{ color: TX_LOW }} />
          <span style={C(TX_MID, { fontSize: 12 })}>
            Leyendo las ocho fuentes de las cuentas vivas para armar el análisis…
          </span>
        </div>
      </div>
    </div>
  )
}
