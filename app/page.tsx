import { Suspense } from 'react'
import {
  CalendarDays, AlertCircle, Ticket, LifeBuoy, ArrowUpRight,
} from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SaludCarteraChart, { type FilaSalud } from '@/components/charts/SaludCarteraChart'
import BarraFiltros from '@/components/charts/BarraFiltros'
import { DashFiltrosProvider } from '@/lib/dash-filtros'
import * as TEMA from '@/lib/chart-theme'
import TopRiesgoTable from '@/components/TopRiesgoTable'
import AutoRefresh from '@/components/AutoRefresh'
import DashAlertasGraficas, { GraficasCargando } from '@/components/DashAlertasGraficas'
import SoloEnCliente from '@/components/charts/SoloEnCliente'
import TopCuentasVersatil, { type CuentaRank } from '@/components/TopCuentasVersatil'
import CandidatoA from '@/components/CandidatoA'
import { type ResultadoCandidato } from '@/lib/candidato-a'
import { candidatosDeCartera, faltantesDeFicha } from '@/lib/candidatos-cartera'
/* Del módulo ligero: `@/lib/focos-riesgo` también lo exporta, pero arrastra los
   3.5 MB de tickets-data.json y el Excel de cortes a esta página. */
import { detectarAlertas } from '@/lib/alertas-detectar'
import { alertasConMemoria } from '@/lib/alertas-episodios'
import { riesgoPorCuenta, CATALOGO } from '@/lib/alertas'
import { veredictosDeCartera } from '@/lib/alertas-estado'
import { proyectaTablero } from '@/lib/alertas-tablero'
import { getKPIs, getCuentas, getAdopcionProductoAll, type AdopcionRow } from '@/lib/supabase'
import { type Cuenta } from '@/lib/types'
import { ticketStatsCuenta } from '@/lib/tickets-cuenta'
import Link from 'next/link'
import { COBERTURA } from '@/lib/tickets-norm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { hoyEnPalabras, selloMexico } from '@/lib/fecha-local'

export const dynamic = 'force-dynamic'

// ── Paleta ────────────────────────────────────────────────────────────────────
// Toda sale de `lib/chart-theme.ts` (importado como TEMA). La paleta local de
// esta página —cian, verde, ámbar, rojo— se fue con las secciones que la
// usaban, retiradas por dirección el 12 oct 2026.


/* Las etiquetas de los números —las que distinguen un canal digital de un
   número sin asignar— se mudaron a `lib/candidatos-cartera.ts` con la
   derivación que las usaba. */

// ── Helpers ───────────────────────────────────────────────────────────────────
function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

/* `computeFaltantes` vivía aquí y ahora es `faltantesDeFicha`, en
   `lib/candidatos-cartera.ts`. Lo comparten las Alertas Críticas, el ranking
   versátil y la candidatura: tres consumidores de la misma lista de campos
   obligatorios, que tenían que contarla igual y ahora no pueden contarla de
   otra forma. */

/**
 * Días desde que HABLAMOS con el cliente. `null` = nunca se registró uno.
 *
 * ERA LA TERCERA DEFINICIÓN DE CONTACTO, Y LA FLOJA (arreglado el 7 oct 2026).
 *
 * Esto calculaba el número aquí, a partir de `c.ultimo_contacto`. Dos problemas,
 * los dos medidos:
 *
 *   · `ultimo_contacto` es la definición AMPLIA: la fecha mayor entre la columna
 *     guardada y cualquier renglón del historial. Y esa columna se escribe al
 *     cerrar CUALQUIER actividad, incluida una `validacion` interna — 49 cuentas
 *     con $242,425 parecían contactadas sin un solo contacto por canal real.
 *   · `new Date(...)` más `Date.now()` en un componente de servidor: Vercel va en
 *     UTC y México seis horas atrás. Ver [[feedback-fechas-zona-mexico]].
 *
 * Por eso Sección Amarilla salía con 36 días aquí y 97 en el reloj de alertas:
 * son los dos números del §ANO-04 del Prompt Maestro, y venían de dos
 * definiciones distintas de la misma palabra.
 *
 * `getCuentas` ya resuelve `dias_sin_contacto` con la definición ÚNICA de
 * `lib/contacto-cuenta.ts` —sólo llamada, correo, WhatsApp, reunión, visita y
 * videollamada—, así que aquí sólo se lee. No se recalcula nada.
 */
function diasSinContactoDe(c: Cuenta): number | null {
  return c.dias_sin_contacto ?? null
}

const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * Formatea 'AAAA-MM-DD[ HH:MM]' SIN pasar por `new Date`.
 *
 * Pasar por Date reintroduce el problema que se está arreglando: el servidor de
 * Vercel va en UTC y México seis horas atrás, así que un sello de la tarde se
 * rendería con el día siguiente (o el anterior, según el sentido). El texto ya
 * viene anclado a hora de México desde lib/tickets-norm.ts; aquí solo se pinta.
 */
function fmtSelloMx(sello: string) {
  if (!sello) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(sello)
  if (!m) return sello
  const mes = MES_CORTO[Number(m[2]) - 1] ?? m[2]
  return `${m[3]} ${mes} ${m[1].slice(2)}`
}

// ── Tickets globales ──────────────────────────────────────────────────────────
// El tipo local desapareció: ahora la forma la define lib/tickets-norm.ts, que
// es también donde se arreglan los campos crudos del export.
const globalTickets = {
  total:  COBERTURA.total,
  fallas: COBERTURA.fallasBandera,
  /* Esta tira cuenta TODO lo exportado y el panel de analisis que va debajo
     cuenta los de clientes: 6,034 contra 5,786. Dos cifras distintas, una
     encima de la otra, para lo que cualquiera lee como la misma cosa. La
     resta se declara aqui en vez de dejar que alguien la descubra restando. */
  internos: COBERTURA.internos,
  /**
   * Antes era `max(t.fecha)`, y `fecha` solo tiene precisión de MES: valía
   * '2026-09', que `new Date()` parsea como el día 1, así que la portada se
   * declaraba «datos al 01 sep 26» cuando el archivo llega al 23 de septiembre.
   * 22 días de desfase justo en el indicador cuyo único trabajo es decir qué tan
   * fresco está el dato. Ahora es la última APERTURA real, en hora de México.
   */
  ultima: COBERTURA.hasta,
}

// ═════════════════════════════════════════════════════════════════════════════
export default async function DashboardPage() {
  const h = headers()
  const rol          = h.get('x-user-rol') ?? 'viewer'
  const asesorHeader = decodeURIComponent(h.get('x-user-asesor') ?? '')

  /* FALLA CERRADO. `rol === 'asesor' && !!asesorHeader` parecía defensivo y era
   * lo contrario: con el rol puesto y el nombre vacío, `isAsesor` quedaba en
   * false, `soloSuCartera` en undefined y la portada servía la cartera COMPLETA
   * de la empresa — más de lo que vería con su nombre bien puesto. Un permiso a
   * medio configurar se resuelve negando. */
  if (rol === 'asesor' && !asesorHeader) {
    redirect('/acceso?motivo=sin_cartera')
  }
  const isAsesor     = rol === 'asesor'

  /* LOS TRES BLOQUES, EL MISMO UNIVERSO.
     `getCuentas` ya se filtraba por asesora y `getKPIs` no, así que la portada
     de una asesora ponía su listado de 68 cuentas al lado de la facturación de
     las 192 de la empresa, sin una etiqueta que lo dijera. Medido: las barras
     de distribución de Dan sumaban el 35% del alto, las de Fátima el 33% y las
     de Claudia el 32% — cada una un tercio, porque el denominador era de todos.
     Desde el 12 oct 2026 la salud de la cartera también sale de `cuentas`, así
     que una asesora ve la suya. `getSemaforoByAsesor` ya no se llama aquí: sólo
     alimentaba los tres paneles que `SaludCarteraChart` sustituye. */
  const soloSuCartera = isAsesor ? { asesor: asesorHeader } : undefined
  const [kpis, allCuentas, adopRows, alertasRes] = await Promise.all([
    getKPIs(soloSuCartera),
    getCuentas(soloSuCartera),
    getAdopcionProductoAll(),
    /* El motor de alertas NO puede tumbar la portada, y tampoco puede fallar en
       silencio: si una fuente no responde, el panel lo DICE. Un cero aquí se
       leería como «no hay riesgo», que es la mentira más cara que puede contar
       este tablero. Ver [[feedback-cero-sin-medicion]]. */
    alertasConMemoria(() => detectarAlertas(soloSuCartera), soloSuCartera).then(
      ({ alertas }) => ({ ok: true as const, alertas }),
      (e: unknown) => ({ ok: false as const,
                         motivo: (e as Error)?.message || 'una fuente no respondió' })),
  ])

  const alertas = alertasRes.ok ? alertasRes.alertas : []

  /* ── EL ANÁLISIS DE ALERTAS, SIN BLOQUEAR LA PORTADA ────────────────────
   *
   * `veredictosDeCartera` cuesta entre 1.6 y 2.7 segundos —medido, y lo que
   * pesa son las lecturas globales de facturación y cortes, no el número de
   * cuentas—. La promesa se crea aquí y NO se espera: el componente `Graficas`
   * es `async`, así que React lo suspende y suelta el resto de la portada
   * mientras tanto. Es el mismo patrón que bajó `/asesores` de 4.5 a 1.8
   * segundos, y la portada es la pantalla con la que se empieza el día.
   *
   * SÍ, ESTO VUELVE A CORRER `detectarAlertas` — una vez aquí y otra dentro
   * del motor de veredictos, que no cachea. Se asume a sabiendas: la segunda
   * pasada va fuera del camino crítico gracias al `<Suspense>`, y la
   * alternativa —pasarle las alertas ya detectadas— le cambiaría la firma a
   * una función que usan tres pantallas para ahorrar algo que el usuario no
   * espera. Si algún día el motor se cachea, esto se cae solo. */
  const alcance = { asesor: isAsesor ? asesorHeader : null }
  const tablero = veredictosDeCartera(soloSuCartera)
    .then(v => proyectaTablero(v.cuentas, v.falla, alcance))
    .catch((e: unknown) => proyectaTablero([], (e as Error)?.message
      ?? 'el motor de veredictos no respondió', alcance))

  async function Graficas() {
    return (
    <SoloEnCliente reserva={<GraficasCargando />}>
      <DashAlertasGraficas datos={await tablero} />
    </SoloEnCliente>
  )
  }

  /* ── QUIÉN ESTÁ EN RIESGO ───────────────────────────────────────────────
   *
   * Hasta el 6 oct 2026 el tablero lo definía como `health_score < 40`, y el
   * health score MÍNIMO de la cartera viva es 43: marcaba 0 cuentas y $0, y lo
   * iba a seguir marcando pasara lo que pasara. Instrucción de dirección: «una
   * cuenta con 0% de consumo o más de 60 días sin contacto se marca como riesgo
   * aunque el Health Score diga Observación».
   *
   * Ahora lo decide el motor de alertas, que ya mide esas dos cosas. Una sola
   * definición para el KPI, para el corte por ejecutivo y para el semáforo. */
  const riesgo = riesgoPorCuenta(alertas)

  // Último nivel registrado por cuenta+producto (puede haber historial)
  const adopMap = new Map<string, Map<string, AdopcionRow>>()
  adopRows.forEach(r => {
    if (!adopMap.has(r.cuenta_id)) adopMap.set(r.cuenta_id, new Map())
    const porProducto = adopMap.get(r.cuenta_id)!
    const actual = porProducto.get(r.producto)
    if (!actual || r.created_at > actual.created_at) porProducto.set(r.producto, r)
  })

  // Solo activas + en_riesgo para análisis
  const cuentas = allCuentas.filter(c => c.estado === 'activo' || c.estado === 'en_riesgo')

  /* ── Salud de la cartera: una fila por cuenta viva ─────────────────────
     La banda la decide la tarjeta (`bandaDe`) con la regla de dirección: el
     motor de alertas manda sobre el Health Score. Aquí sólo se le pasa el
     dato crudo, sin rellenar huecos: un Health Score o un importe que no
     existen viajan como `null`, nunca como 50 o como 0. */
  const filasSalud: FilaSalud[] = cuentas.map(c => {
    const r = riesgo.get(String(c.id))
    return {
      id: String(c.id),
      consecutivo: c.consecutivo ?? '',
      empresa: c.empresa,
      asesor: c.asesor ?? null,
      hs: c.health_score ?? null,
      mrr: c.facturacion ?? null,
      motivos: r ? Array.from(new Set(r.motivos.map(t => CATALOGO[t]?.titulo ?? t))) : [],
    }
  })

  // Top 10 riesgo con tickets
  const topRiesgo = [...cuentas]
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 10)
    .map(c => {
      // De la fuente completa: `rows` viene cortado a 20 y las fallas salían
      // contadas solo dentro de esa página.
      const r = ticketStatsCuenta(c.cid ?? null, c.empresa)
      return { ...c, zoho_tickets: { total: r.total, fallas: r.fallas, ultima: r.ultima } }
    })

  const topRiesgoTix    = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.total  ?? 0), 0)
  const topRiesgoFallas = topRiesgo.reduce((s, c) => s + (c.zoho_tickets?.fallas ?? 0), 0)

  // ── Top Cuentas — ranking versátil (13 dimensiones seleccionables) ────────
  /* ── Candidato a: — a qué es candidata cada cuenta ────────────────────────
   * La derivación se mudó a `lib/candidatos-cartera.ts` el 8 oct 2026. Vivía
   * aquí, setenta líneas en línea, y por eso ALERTAS no podía usarla: su
   * situación `oportunidad` colgaba de un campo que entraba como `null` y nunca
   * se podía disparar. Ahora las dos pantallas llaman a la MISMA función, que es
   * la única forma de que no acaben proponiendo cosas distintas. */
  const candidatosMap = await candidatosDeCartera(cuentas)
  const candidatos: ResultadoCandidato[] = cuentas
    .map(c => candidatosMap.get(String(c.id)))
    .filter((x): x is ResultadoCandidato => x !== undefined)

  const rankRows: CuentaRank[] = cuentas.map(c => {
    const tk = ticketStatsCuenta(c.cid ?? null, c.empresa)
    const porProducto = adopMap.get(c.id)
    let adopcionPct: number | null = null
    if (porProducto) {
      const scores = Array.from(porProducto.values())
        .filter(r => r.nivel !== 'no_aplica')
        .map(r => r.nivel === 'alto' ? 100 : r.nivel === 'medio' ? 50 : 0)
      if (scores.length > 0) adopcionPct = avg(scores)
    }
    return {
      id: String(c.id),
      consecutivo: c.consecutivo ?? '',
      empresa: c.empresa,
      asesor: c.asesor ?? null,
      facturacion: c.facturacion ?? 0,
      healthScore: c.health_score ?? 50,
      activoDesde: c.activo_desde,
      diasSinContacto: diasSinContactoDe(c),
      ticketsTotal: tk.total,
      ticketsFallas: tk.fallas,
      upsellValor: c.valor_upsell_estimado ?? 0,
      adopcionPct,
      faltantesCount: faltantesDeFicha(c).length,
    }
  })

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    /* El proveedor de filtros envuelve la portada: es lo que deja que elegir un
       asesor en una tarjeta filtre las demás. Es un componente de cliente que
       recibe hijos de servidor, así que no convierte la página en cliente. */
    <DashFiltrosProvider>
    <div className="min-h-screen">
      <AutoRefresh intervalMs={300_000} showIndicator={false} />

      <PageHeader
        title="Dashboard Customer Success"
        subtitle={hoyEnPalabras()}
        actions={
          <div className="flex items-center gap-3">
            <AutoRefresh intervalMs={300_000} showIndicator />
            <Link href="/reuniones" className="cp-btn cp-btn-primary">
              <CalendarDays size={14} /> Reuniones
            </Link>
          </div>
        }
      />

      {/* ── Banners fichas pendientes ────────────────────────────────────── */}
      {(kpis.faltaTC > 0 || kpis.faltaHS > 0) && (
        <div className="mx-6 mb-4 flex flex-wrap gap-3">
          {/* ESTOS DOS CHIPS NO LLEGABAN A AA, Y NO ERA COSA DEL REDISEÑO:
              venían así. Medido el 12 oct 2026, cada uno contra su fondo
              COMPUESTO —el chip semitransparente mezclado sobre el #EFF6FF de
              la página, que es lo que de verdad se ve—:

                naranja #C2410C sobre el chip al 12%  ->  4.22:1   ✗
                ámbar   #B45309 sobre el chip al 14%  ->  4.25:1   ✗

              Y teñirlos con el naranja del tema lo empeora: el naranja-700
              sobre esos mismos chips da 3.52 y 3.46. El problema no es el
              tono, es pintar TEXTO de color sobre un fondo de color.

              Así que el chip deja de teñir el texto. La página es clara, el
              chip es blanco, y el aviso lo llevan el BORDE y el ICONO, que son
              objetos gráficos y les basta 3:1. Medido:

                navy-900 sobre blanco                -> 16.52:1   ✓ (texto)
                naranja-700 sobre blanco             ->  4.27:1   ✓ (objeto)

              El naranja-500 NO vale aquí: sobre blanco mide 2.61:1. Es un
              acento de fondo oscuro. Ver `ACENTO` vs `ACENTO_CLARO` en el
              tema.

              Los dos chips quedan del mismo color a propósito: los dos dicen
              «falta un dato», y pintarlos distinto insinuaba una diferencia
              de gravedad que no existe. */}
          {([
            [kpis.faltaTC, 'FALTA_TC', `${kpis.faltaTC} cuentas sin ficha Top Customer`],
            [kpis.faltaHS, 'FALTA_HS', `${kpis.faltaHS} cuentas sin Health Score Callpicker`],
          ] as const).filter(([n]) => n > 0).map(([, clave, texto]) => (
            <Link key={clave} href={`/cuentas?warning=${clave}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold dash-foco"
              style={{
                border: `1px solid ${TEMA.ACENTO_CLARO}`,
                background: TEMA.TARJETA_CLARA,
                color: TEMA.TX_PAGINA.hi,
                minHeight: TEMA.MINIMOS.areaClic,
              }}>
              <AlertCircle size={14} style={{ color: TEMA.ACENTO_CLARO, flexShrink: 0 }} />
              {texto}
            </Link>
          ))}
        </div>
      )}

      {/* ══ §1 ALERTAS DE CLIENTE — el ANÁLISIS, no la lista ═══════════════
       *
       * Aquí vivió «Cumplimiento SAC Semanal» —tres medidores de actividades
       * cerradas por ejecutivo— hasta que dirección lo cambió por el panel de
       * alertas el 6 oct 2026. Y ese panel duraba hasta hoy.
       *
       * Instrucción del 8 oct 2026, con la captura del Dashboard delante:
       * «esto es exactamente lo que encontramos en Alertas de cliente; lo que
       * debe existir en el Dashboard son gráficas del tema en cuestión, con
       * los combos que permita elegir datos para obtener data».
       *
       * Tenía razón: `PanelAlertas` pintaba las mismas cifras y las mismas
       * diez filas que `/alertas`. Dos pantallas para lo mismo. La lista se
       * queda donde ya estaba y el Dashboard pasa a responder lo que una
       * lista no puede: de qué está hecha la cartera y qué nos falta para
       * poder opinar de ella.
       */}
      <BarraFiltros />
      <Suspense fallback={<GraficasCargando />}>
        <Graficas />
      </Suspense>

      {/* ══ §1a Salud de la cartera ══════════════════════════════════════
          Sustituye a «Semáforo por Asesor», «Distribución General» y
          «Distribución por Asesor · Rango de Salud» (12 oct 2026): los tres
          pintaban el mismo dato, dos de sus cinco colores eran cero por
          construcción y el importe de las líneas era un promedio. Va aquí,
          junto al análisis de alertas y al ranking, porque los tres comparten
          el filtro de asesor. Ver el encabezado de `SaludCarteraChart`. */}
      <div className="px-6 pb-5" style={{ maxWidth: 1440, margin: '0 auto' }}>
        <SaludCarteraChart filas={filasSalud} />
      </div>

      {/* ══ §1b Top Cuentas · Ranking Versátil ════════════════════════════ */}
      <TopCuentasVersatil data={rankRows} />

      {/* ══ Candidato a: — blindaje y crecimiento con evidencia ══════════ */}
      <CandidatoA data={candidatos} />

      {/* ══ §10 Las diez de menor Health Score ═════════════════════════════
          Panel oscuro SIN `cp-card`, a propósito: esa clase pinta de blanco
          todo `<span>` sin fondo declarado y la tabla colorea días, fallas y
          bandas así. El título ya no dice «en riesgo»: el riesgo lo decide el
          motor de alertas (ver la salud de la cartera), y estas diez salen del
          Health Score, que no es lo mismo. */}
      <div className="px-6 pb-5" style={{ maxWidth: TEMA.ANCHO_MAX, margin: '0 auto' }}>
        <div style={{ background: TEMA.NAVY[700], border: `1px solid ${TEMA.BORDE}`,
                      borderRadius: TEMA.RADIO, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px 12px', borderBottom: `1px solid ${TEMA.BORDE}` }}>
            <div>
              <h3 style={{ fontSize: TEMA.FUENTE.titulo, fontWeight: 800, color: TEMA.TX.hi, margin: 0 }}>
                Las 10 cuentas de menor Health Score
              </h3>
              <p style={{ fontSize: TEMA.FUENTE.subtitulo, color: TEMA.TX.low, marginTop: 4 }}>
                Con sus tickets de Zoho Desk · el riesgo lo marca el motor, arriba en la salud de la cartera
              </p>
            </div>
            <Link href="/cuentas" style={{ fontSize: TEMA.FUENTE.etiqueta, color: TEMA.CIAN[400],
                                           fontWeight: 700, textDecoration: 'none' }}
              className="hover:underline flex items-center gap-1">
              Ver todas <ArrowUpRight size={13} />
            </Link>
          </div>
          <TopRiesgoTable cuentas={topRiesgo} dark />
          {topRiesgoTix > 0 && (
            <div style={{ padding: '10px 20px', borderTop: `1px solid ${TEMA.BORDE}`,
                          fontSize: TEMA.FUENTE.etiqueta, color: TEMA.TX.low,
                          display: 'flex', alignItems: 'center', gap: 6 }}>
              <Ticket size={13} /> Entre las diez: {topRiesgoTix} tickets
              {topRiesgoFallas > 0 && (
                <span style={{ color: TEMA.CIAN[400], fontWeight: 700 }}>· {topRiesgoFallas} fallas</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ §12 Tickets Zoho Desk — la franja de frescura ═════════════════
          El análisis de tickets que iba debajo lo retiró dirección el 12 oct
          2026; queda la franja, que dice de cuándo es el dato y lleva a
          `/tickets`. Las fallas son las del ARCHIVO, internos incluidos: el
          universo va escrito al lado de cada cifra. */}
      <div className="px-6 mb-5" style={{ maxWidth: TEMA.ANCHO_MAX, margin: '0 auto 20px' }}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2"
          style={{ background: TEMA.NAVY[900], border: `1px solid ${TEMA.BORDE}`,
                   borderRadius: 12, padding: '12px 20px' }}>
          <div className="flex items-center gap-2">
            <Ticket size={15} style={{ color: TEMA.CIAN[400] }} />
            <span style={{ fontSize: TEMA.FUENTE.cuerpo, fontWeight: 800, color: TEMA.TX.hi }}>Tickets Zoho Desk</span>
            <span style={{ fontSize: TEMA.FUENTE.etiqueta, color: TEMA.TX.low }}>
              · último ticket abierto el {fmtSelloMx(globalTickets.ultima)} (hora de México)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span style={{ fontSize: TEMA.FUENTE.etiqueta, color: TEMA.TX.low }}>
              <span style={{ fontSize: TEMA.FUENTE.valor, fontWeight: 800, color: TEMA.TX.hi }}>
                {globalTickets.total.toLocaleString('es-MX')}
              </span>{' '}
              en el archivo{globalTickets.internos > 0 && `, ${globalTickets.internos} de ellos internos`}
            </span>
            <span style={{ fontSize: TEMA.FUENTE.etiqueta, color: TEMA.TX.low }}>
              <span style={{ fontSize: TEMA.FUENTE.valor, fontWeight: 800, color: TEMA.CIAN[400] }}>
                {globalTickets.fallas.toLocaleString('es-MX')}
              </span>{' '}
              fallas en el archivo
            </span>
            <Link href="/tickets" style={{ fontSize: TEMA.FUENTE.etiqueta, color: TEMA.CIAN[400],
                                           fontWeight: 700, textDecoration: 'none' }}
              className="hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight size={13} />
            </Link>
            <a href="https://ayuda.callpicker.com/" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg"
              style={{ padding: '6px 12px', fontSize: TEMA.FUENTE.etiqueta, fontWeight: 800,
                       background: TEMA.CIAN[500], color: TEMA.NAVY[900], textDecoration: 'none' }}>
              <LifeBuoy size={14} /> Centro de Ayuda
            </a>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="px-6 pb-6 pt-2 flex items-center gap-2 text-[10px] text-textLow">
        <span className="text-cp font-bold">CALLPICKER CUSTOMER SUCCESS</span>
        <span>·</span>
        <span>Datos en tiempo real · force-dynamic · auto-refresh 5 min</span>
        <span>·</span>
        <span>{selloMexico()}</span>
      </div>
    </div>
    </DashFiltrosProvider>
  )
}
