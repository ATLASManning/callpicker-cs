/**
 * atlas-context.ts — Construye el contexto dinámico para Atlas IA.
 * Solo se llama desde rutas de servidor (app/api/chat/route.ts).
 */
import { supabaseAdmin } from './supabase'
import rawTickets from './tickets-data.json'
import { STATIC_CASES } from '@/app/auditoria/cases'
import { ticketStatsCuenta } from './tickets-cuenta'
import { cortesDeCuenta } from './cortes-cuenta'
import { detectDataGaps, CAMPOS_GAP_SELECT, type CuentaGapInput } from './data-gaps'
import { contarRespuestasRadar } from './radar'
import { normalizarNombre, NOMBRES_CHURN_GRC, NOMBRES_CANCELACION } from './elegibilidad'
import { getZohoMap, lookupZoho } from './zoho-enrich'
import { datosEnriquecidosDeCuenta } from './enriquecimiento/cuenta'
import { AAA_GRC_2026 } from '@/app/churn/aaa-grc-data'
import { REPORTE_S18_AGOSTO_2026 } from '@/app/churn/reporte-actual'
import { CLIENTES_CANCELADOS } from './churn-cancelados-data'

interface TicketRaw {
  cid: string; empresa: string; fecha: string
  categoria: string; es_falla: string; mes: string
}

// ── Pre-cómputo en carga de módulo (estático) ─────────────────────────────────
const TICKETS = rawTickets as TicketRaw[]

const TICKET_SUMMARY = (() => {
  const total  = TICKETS.length
  const fallas = TICKETS.filter(t => t.es_falla === 'Si').length
  const pctF   = ((fallas / total) * 100).toFixed(1)

  const byCat: Record<string, number> = {}
  const byMes: Record<string, { total: number; fallas: number }> = {}
  for (const t of TICKETS) {
    byCat[t.categoria] = (byCat[t.categoria] || 0) + 1
    if (!byMes[t.mes]) byMes[t.mes] = { total: 0, fallas: 0 }
    byMes[t.mes].total++
    if (t.es_falla === 'Si') byMes[t.mes].fallas++
  }

  const topCat = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([c, n]) => `${c}(${n})`).join(', ')

  const meses   = Object.keys(byMes).sort()
  const lastMes = meses[meses.length - 1] ?? '—'
  const lm      = byMes[lastMes] ?? { total: 0, fallas: 0 }

  return `TICKETS SOPORTE (Feb-Ago 2026):
  Total historico: ${total} | Fallas: ${fallas} (${pctF}%)
  Ultimo mes disponible (${lastMes}): ${lm.total} tickets, ${lm.fallas} fallas
  Top categorias: ${topCat}`
})()

const AUDITORIA_SUMMARY = (() => {
  const byAsesor: Record<string, string[]> = {}
  for (const c of STATIC_CASES) {
    const a = c.asesor ?? 'Sin asignar'
    if (!byAsesor[a]) byAsesor[a] = []
    byAsesor[a].push(
      `${c.nombre} (${c.estado}${c.hallazgos?.length ? `, ${c.hallazgos.length} hallazgos` : ''})`
    )
  }
  const lines = Object.entries(byAsesor)
    .map(([a, casos]) => `  ${a}: ${casos.join(' | ')}`)
  return `AUDITORIA ESTRATEGICA (${STATIC_CASES.length} casos activos):\n${lines.join('\n')}`
})()

// ── Helper: lunes de la semana actual ─────────────────────────────────────────
function getMonday(): string {
  const d   = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const m   = new Date(d)
  m.setDate(diff)
  return m.toISOString().split('T')[0]
}

// ── Semaforo calculado (igual que lib/types.ts) ───────────────────────────────
function sem(hs: number | null): string {
  if (!hs) return 'sin_dato'
  if (hs >= 80) return 'verde'
  if (hs >= 60) return 'azul'
  if (hs >= 40) return 'amarillo'
  if (hs >= 20) return 'naranja'
  return 'rojo'
}


// ── Dossier por cuenta — se inyecta cuando la pregunta menciona una cuenta ────
// Motivo (incidente Servinox, 31 Ago 2026): el contexto general solo nombra a
// las cuentas con HS<40, así que Atlas respondía "no tengo esa información"
// sobre cuentas perfectamente vivas. El dossier trae facturación, servicios,
// consumo, tickets, actividades, seguimientos, Radar y huecos de datos de LA
// cuenta preguntada — todo desde las fuentes vivas.

export async function buildCuentaDossier(pregunta: string): Promise<{ text: string; empresa: string } | null> {
  const q = normalizarNombre(pregunta)
  if (q.length < 4) return null

  const { data: cuentas } = await supabaseAdmin
    .from('cuentas')
    .select(`id, consecutivo, cid, empresa, asesor, estado, health_score, facturacion, notas,
             score_adopcion, dias_sin_actividad, ultimo_contacto,
             tiene_chat_activo, tiene_integracion_api, tiene_pago_automatico,
             tiene_ia_voz, tiene_ia_chat, upsell_producto, crossell_producto,
             ${CAMPOS_GAP_SELECT}`)
  if (!cuentas?.length) return null

  // Coincidencia: nombre normalizado contenido en la pregunta, o CID exacto
  // como token numérico completo (nunca substring — un teléfono no debe
  // disparar una cuenta). Se prefiere el nombre más largo contra falsos
  // positivos cortos.
  const cidsEnPregunta = new Set(pregunta.match(/\d{3,}/g) ?? [])
  let mejor: (typeof cuentas)[number] | null = null
  let mejorLen = 0
  for (const c of cuentas) {
    const n = normalizarNombre(c.empresa)
    if (n.length >= 4 && q.includes(n) && n.length > mejorLen) { mejor = c; mejorLen = n.length }
    if (c.cid && cidsEnPregunta.has(String(c.cid).trim())) { mejor = c; mejorLen = 999 }
  }
  if (!mejor) return null
  const c = mejor

  // Cruce con las listas vivas de churn: a una cuenta perdida no se le ofrece
  // portafolio de crecimiento — el dossier lo advierte y el prompt lo respeta.
  const nEmp = normalizarNombre(c.empresa)
  const alertaChurn =
    NOMBRES_CANCELACION.has(nEmp) ? 'aparece en cancelaciones confirmadas (Churn > Analisis DATA)' :
    NOMBRES_CHURN_GRC.has(nEmp)   ? 'aparece como Churn confirmado (GRC AAA 2026)' :
    (c.estado && c.estado !== 'activo' && c.estado !== 'en_riesgo')
      ? `estado "${c.estado}" en la plataforma (no es cartera activa)` : null

  // Fuentes vivas en paralelo (facturación SIEMPRE desde Zoho en vivo — la
  // columna cuentas.facturacion es una copia guardada que envejece; incidente
  // GRUPO FRISA 31 Ago 2026: la columna decía $1,622 y la cifra real viva era
  // $16,539 con subcuentas agregadas)
  const [cortes, actsRes, segsRes, radarRes, zmap, enriq] = await Promise.all([
    cortesDeCuenta(c.cid, 4),
    supabaseAdmin.from('actividades')
      .select('tipo, estado, completada, semana_inicio, resultado')
      .eq('cuenta_id', c.id).order('semana_inicio', { ascending: false }).limit(12),
    supabaseAdmin.from('seguimientos')
      .select('fecha, tipo, descripcion, resultado')
      .eq('cuenta_id', c.id).order('fecha', { ascending: false }).limit(5),
    supabaseAdmin.from('radar_respuestas')
      .select('respuestas, creado_en')
      .eq('cuenta_id', c.id).order('creado_en', { ascending: false }).limit(1),
    getZohoMap(),
    datosEnriquecidosDeCuenta(c.id, c as never).catch(() => null),
  ])

  const z       = lookupZoho(c.empresa, zmap)
  const hsFalta = String(c.notas ?? '').includes('[FALTA_HS]')

  const tk    = ticketStatsCuenta(c.cid ?? null, c.empresa)
  const gaps  = detectDataGaps(c as unknown as CuentaGapInput)
  const crit  = gaps.filter(g => g.nivel === 'critico').map(g => g.campo)
  const imp   = gaps.filter(g => g.nivel === 'importante').map(g => g.campo)
  const radarN = contarRespuestasRadar(radarRes.data?.[0]?.respuestas ?? null)

  const acts = actsRes.data ?? []
  const segs = segsRes.data ?? []
  const actsComp = acts.filter(a => a.completada).length

  const modulos: Array<[string, boolean]> = [
    ['Callpicker Chat', !!c.tiene_chat_activo], ['Integración API', !!c.tiene_integracion_api],
    ['Pago automático', !!c.tiene_pago_automatico], ['IA de Voz', !!c.tiene_ia_voz],
    ['IA de Chat', !!c.tiene_ia_chat],
  ]
  const modOn  = modulos.filter(([, v]) => v).map(([n]) => n)
  const modOff = modulos.filter(([, v]) => !v).map(([n]) => n)

  const cortesTxt = cortes.length
    ? cortes.map(x => `    ${x.mes}: ${x.plan} | incl ${x.incl} min, consumidos ${x.cons} (${x.pct.toFixed(1)}%) | $${Math.round(x.monto).toLocaleString('es-MX')} | uso ${x.uso || '?'}`).join('\n')
    : '    Sin cortes registrados para su CID'

  const faltantes: string[] = []
  if (crit.length)  faltantes.push(`perfil con ${crit.length} dato(s) CRITICO(S) sin capturar: ${crit.join(', ')}`)
  if (imp.length)   faltantes.push(`datos importantes faltantes: ${imp.join(', ')}`)
  if (radarN < 12)  faltantes.push(`Radar de Cuenta ${radarN}/12 preguntas respondidas`)
  if (!acts.length) faltantes.push('sin actividades SAC registradas')
  if (!segs.length) faltantes.push('sin seguimientos KAM registrados')
  if (!c.ultimo_contacto) faltantes.push('sin fecha de último contacto')
  if (hsFalta)      faltantes.push('Health Score sin calcular (marca [FALTA_HS])')

  const antig = c.activo_desde ? `cliente desde ${String(c.activo_desde).slice(0, 10)}` : 'antigüedad sin registrar'

  const text = `DOSSIER DE CUENTA — ${c.empresa} (pregunta del usuario la menciona; USA ESTOS DATOS, la cuenta SI existe):
  Identidad: ${c.consecutivo} | CID ${c.cid ?? 'sin CID'} | Asesor: ${c.asesor} | Estado: ${c.estado} | HS ${hsFalta ? 'FALTA (sin calcular)' : c.health_score ?? '?'} | Adopción ${c.score_adopcion ?? '?'}/100 | ${antig}${alertaChurn ? `
  ALERTA CHURN: ${alertaChurn} — NO ofrecer portafolio de crecimiento; el enfoque correcto es retencion/reactivacion.` : ''}
  Facturación: ${z
    ? `Factura mensual (Zoho EN VIVO, con subcuentas): $${Math.round(z.factura_mensual).toLocaleString('es-MX')} | MRR: $${Math.round(z.mrr).toLocaleString('es-MX')}${z.segmento ? ` | Segmento: ${z.segmento}` : ''} — ESTA es la cifra oficial cuando pregunten cuanto factura`
    : `$${Number(c.facturacion ?? 0).toLocaleString('es-MX')}/mes (dato CRM guardado, PUEDE ESTAR DESACTUALIZADO — sin dato Zoho en vivo)`}
  Cortes de facturación del CID ${c.cid ?? '—'} (montos por plan individual — si el grupo tiene subcuentas son PARCIALES, no la factura total):
${cortesTxt}
  Módulos ACTIVOS: ${modOn.length ? modOn.join(', ') : 'NINGUNO (0/5)'}
  Módulos SIN activar: ${modOff.join(', ') || 'ninguno'}
  Upsell/Cross marcado en CRM: ${c.upsell_producto ?? '—'} / ${c.crossell_producto ?? '—'}
  Tickets: ${tk.total} totales, ${tk.fallas} fallas, ${tk.abiertos} abiertos | último: ${tk.ultima ?? '—'}
  Actividades SAC (últimas): ${acts.length ? `${acts.length} registradas, ${actsComp} completadas; última semana ${acts[0].semana_inicio}` : 'NINGUNA registrada'}
  Seguimientos KAM: ${segs.length ? segs.slice(0, 3).map(s => `[${String(s.fecha).slice(0, 10)}] ${s.tipo}: ${(s.descripcion ?? '').slice(0, 70)}`).join(' | ') : 'NINGUNO registrado'}
  Radar de Cuenta: ${radarN}/12 preguntas respondidas
  CALIDAD DE DATOS DE ESTA CUENTA: ${faltantes.length ? 'INCOMPLETA — ' + faltantes.join('; ') : 'completa'}${
    enriq && enriq.total ? `
  DATOS ENRIQUECIDOS (investigacion externa e interna — informacion ADICIONAL, no sustituye lo del KAM):
${Object.entries(enriq.porCampo).map(([campo, lista]) =>
    `    ${campo}: ${lista.slice(0, 4).map(x => `${x.valor_candidato} (${x.confianza_score}/100${x.matching_status === 'conflicto' ? ', DIFIERE del dato del KAM' : ''})`).join(' | ')}`
  ).join('\n')}${
    enriq.decisores.length ? `
  MAPA DE DECISORES localizado en el sitio de la empresa (personas publicadas, sin verificar con el cliente):
${enriq.decisores.map(d => `    ${d.persona_nombre} — ${d.cargo ?? 's/cargo'} [${d.rol_decision ?? 'rol sin definir'}]${d.email ? ` · ${d.email}` : ''}`).join('\n')}` : ''}${
    enriq.senales.length ? `
  LECTURA COMERCIAL detectada:
${enriq.senales.map(s => `    [${s.tipo.toUpperCase()}] ${s.titulo}: ${s.detalle}${s.accion ? ` -> ${s.accion}` : ''}`).join('\n')}` : ''}` : ''}`

  return { text, empresa: c.empresa }
}

// ── Builder principal ─────────────────────────────────────────────────────────
export async function buildAtlasContext(): Promise<{ text: string; modulos: string[] }> {
  const sections: string[] = [AUDITORIA_SUMMARY, TICKET_SUMMARY]
  const modulos: string[]  = ['base-conocimiento', 'auditoria', 'tickets']
  const asesorPorNombre: Record<string, string> = {}

  try {
    const monday      = getMonday()
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
    const today        = new Date().toISOString().split('T')[0]

    const [csRes, segsRes, actRes, reuRes, todasRes] = await Promise.all([
      supabaseAdmin
        .from('cuentas')
        .select('empresa,consecutivo,asesor,health_score,facturacion,estado,score_adopcion')
        .in('estado', ['activo', 'en_riesgo'])
        .order('health_score', { ascending: true }),

      supabaseAdmin
        .from('seguimientos')
        .select('empresa,tipo,descripcion,asesor,created_at')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(12),

      supabaseAdmin
        .from('actividades')
        .select('empresa,asesor,tipo,estado,completada')
        .eq('semana_inicio', monday)
        .limit(50),

      supabaseAdmin
        .from('reuniones')
        .select('titulo,tipo,fecha,asesor,empresa')
        .gte('fecha', today)
        .order('fecha', { ascending: true })
        .limit(6),

      // Todas las cuentas (sin filtro de estado) — solo para cruzar nombre →
      // asesor en la sección de churn (las canceladas ya no están "activas")
      supabaseAdmin
        .from('cuentas')
        .select('empresa,asesor'),
    ])

    for (const c of todasRes.data ?? []) {
      const k = normalizarNombre(c.empresa)
      if (k) asesorPorNombre[k] = c.asesor
    }

    // ── Cuentas ──────────────────────────────────────────────────────────────
    if (csRes.data?.length) {
      const cs    = csRes.data
      const total = cs.length

      const semCount:    Record<string, number> = {}
      const asesorStats: Record<string, { total: number; riesgo: number }> = {}

      for (const c of cs) {
        const s = sem(c.health_score)
        semCount[s] = (semCount[s] || 0) + 1
        if (!asesorStats[c.asesor]) asesorStats[c.asesor] = { total: 0, riesgo: 0 }
        asesorStats[c.asesor].total++
        if ((c.health_score ?? 100) < 40) asesorStats[c.asesor].riesgo++
      }

      const semLine    = Object.entries(semCount).map(([s, n]) => `${s}:${n}`).join(' | ')
      const asesorLine = Object.entries(asesorStats)
        .map(([a, d]) => `${a}(${d.total} cuentas, ${d.riesgo} en riesgo)`)
        .join(' | ')

      const topRiesgo = cs
        .filter(c => (c.health_score ?? 100) < 40)
        .slice(0, 12)
        .map(c => `    ${c.empresa} (${c.consecutivo}) HS:${c.health_score ?? '?'} [${c.asesor}]`)
        .join('\n')

      sections.push(
        `CUENTAS ACTIVAS (${total} totales):
  Semaforo: ${semLine}
  Por asesor: ${asesorLine}
  TOP RIESGO (HS<40):
${topRiesgo || '    Ninguna en riesgo critico'}`
      )
      modulos.push('cuentas')
    }

    // ── Seguimientos recientes ────────────────────────────────────────────────
    if (segsRes.data?.length) {
      const segs = segsRes.data
        .map(s => `  [${s.asesor}] ${s.empresa} — ${s.tipo}: "${(s.descripcion ?? '').slice(0, 100)}"`)
        .join('\n')
      sections.push(`SEGUIMIENTOS ULTIMOS 7 DIAS:\n${segs}`)
      modulos.push('seguimientos')
    }

    // ── Actividades SAC ───────────────────────────────────────────────────────
    if (actRes.data?.length) {
      const acts       = actRes.data
      const completadas = acts.filter(a => a.completada).length
      const pendientes  = acts.filter(a => !a.completada && a.estado === 'pendiente').length
      const bloqueadas  = acts.filter(a => a.estado === 'bloqueada').length

      const byAsesor: Record<string, { comp: number; total: number }> = {}
      for (const a of acts) {
        if (!byAsesor[a.asesor]) byAsesor[a.asesor] = { comp: 0, total: 0 }
        byAsesor[a.asesor].total++
        if (a.completada) byAsesor[a.asesor].comp++
      }
      const asesorLine = Object.entries(byAsesor)
        .map(([a, d]) => `${a}: ${d.comp}/${d.total}`)
        .join(' | ')

      sections.push(
        `ACTIVIDADES SAC SEMANA ${monday}:
  Total: ${acts.length} | Completadas: ${completadas} | Pendientes: ${pendientes} | Bloqueadas: ${bloqueadas}
  Por asesor: ${asesorLine}`
      )
      modulos.push('actividades')
    }

    // ── Reuniones próximas ────────────────────────────────────────────────────
    if (reuRes.data?.length) {
      const reu = reuRes.data
        .map(r =>
          `  ${r.fecha} — ${r.titulo} (${r.tipo})` +
          `${r.empresa ? ` con ${r.empresa}` : ''} [${r.asesor}]`
        )
        .join('\n')
      sections.push(`PROXIMAS REUNIONES:\n${reu}`)
      modulos.push('reuniones')
    }

  } catch (err) {
    console.error('[atlas-context] Error fetching live data:', err)
  }

  // ── Churn: GRC AAA 2026 + Cancelaciones DATA (estáticos — SIEMPRE van) ─────
  // Incidente 31 Ago 2026: Atlas contestó "no tengo ese dato" a "¿qué cuentas
  // de Dan tienen Downgrade?" cuando la respuesta vive en Churn > GRC AAA 2026.
  const asesorDe = (nombre: string): string => {
    const n = normalizarNombre(nombre)
    if (!n) return ''
    if (asesorPorNombre[n]) return `[${asesorPorNombre[n]}]`
    for (const [k, a] of Object.entries(asesorPorNombre)) {
      if (k.length >= 5 && n.length >= 5 && (n.includes(k) || k.includes(n))) return `[${a}]`
    }
    return ''
  }
  const money = (v: number) => `-$${Math.round(v).toLocaleString('es-MX')}`

  const grcLines: string[] = []
  for (const mes of AAA_GRC_2026) {
    const churn = mes.clientes.filter(r => r.movimiento.includes('Churn'))
    const down  = mes.clientes.filter(r => r.movimiento.includes('Downgrade'))
    const fmt = (rows: typeof mes.clientes) => rows
      .map(r => `${r.cliente}(${money(r.perdido || r.perdido2)})${asesorDe(r.cliente)}`)
      .join(', ')
    const tot = (rows: typeof mes.clientes) => rows.reduce((s, r) => s + (r.perdido || r.perdido2), 0)
    if (churn.length) grcLines.push(`  ${mes.mes} — CHURN CONFIRMADO (${churn.length} clientes, ${money(tot(churn))} MRR): ${fmt(churn)}`)
    if (down.length)  grcLines.push(`  ${mes.mes} — DOWNGRADES (${down.length} clientes, ${money(tot(down))} MRR): ${fmt(down)}`)
  }
  sections.push(
    `CHURN — GRC AAA 2026 (apartado Churn > GRC AAA 2026 | Enero a Julio | formato: cliente(MRR perdido)[asesor si está en cartera]):\n${grcLines.join('\n')}`
  )
  modulos.push('churn-grc')

  // Corte vigente de Gross Revenue Churn — misma fuente que renderiza el módulo.
  const rep = REPORTE_S18_AGOSTO_2026
  if (rep.grc) {
    const evo = rep.grc.evolucion
      .map(e => `${e.mes} ${e.pct}%${e.anterior !== undefined ? ` (ant. ${e.anterior}%)` : ''}`)
      .join(' · ')
    const antig = (rep.antiguedadSaldos ?? [])
      .map(a => `${a.rango} $${a.monto.toLocaleString('es-MX')}`).join(' · ')
    /* El corte trae clientes de toda la base de Zoho, no solo de la cartera CS.
     * Sin marcar cuáles están asignados, el modelo rellena el hueco inventando
     * asesores (comprobado el 2 sep 2026: atribuyó GTC y Embler a Dan y Fátima
     * cuando ninguna de esas cuentas existe en `cuentas`). Se anota explícito
     * en ambos sentidos para que no quede nada que suponer. */
    const cartera = (nombre: string) => asesorDe(nombre) || '[NO está en la cartera CS]'
    const limpio = (c: string) => c.replace('🔝 ', '')
    const top = rep.pendientes
      .filter(p => !p.cliente.startsWith('+'))
      .map(p => `${limpio(p.cliente)} $${p.monto.toLocaleString('es-MX')} (${p.mesesActivo} meses)${cartera(limpio(p.cliente))}`)
      .join(', ')
    const downs = rep.downgrades
      .map(d => `${limpio(d.cliente)} -$${d.perdida.toLocaleString('es-MX')}${cartera(limpio(d.cliente))} — ${d.nota}`)
      .join('; ')
    sections.push(
      `CHURN — CORTE VIGENTE (apartado Churn > ${rep.periodo}, al ${rep.fecha} | ` +
      `cada cliente trae entre corchetes su asesor o la marca de que NO está en la cartera CS — ` +
      `usa SOLO eso, nunca deduzcas el asesor por el nombre del cliente):\n` +
      `  Evolución GRC: ${evo}. Acumulado 2026: ${rep.grc.acumulado}%` +
      `${rep.grc.anterior !== undefined ? ` (ant. ${rep.grc.anterior}%)` : ''} — MES CORRIENDO, NO DEFINITIVO.\n` +
      `  Cartera en Activo: $${(rep.pendientesTotalReal ?? 0).toLocaleString('es-MX')} en ${rep.pendientesCuentasReal} cuentas. Top 10: ${top}.\n` +
      `  Dinero fuera de cartera: $72,631 en 71 cuentas — Suspendidos 27 ($18,692 · 25.2 días promedio) · Desactivados 23 ($33,899 · 11.9 días) · Cancelados 21 ($20,040).\n` +
      (antig ? `  Antigüedad de saldos (total $177,156.62): ${antig}.\n` : '') +
      `  Downgrades de agosto ($${(rep.downgradeTotalReal ?? 0).toLocaleString('es-MX')} · ${rep.downgrades.length} clientes): ${downs}\n` +
      `  ${rep.grc.notaEspecial ?? ''}\n` +
      `  Cadencia: el reporte se envía los martes. Próxima revisión: martes 8 de septiembre de 2026.`
    )
    modulos.push('churn-corte-vigente')
  }

  const porPeriodo: Record<string, string[]> = {}
  for (const c of CLIENTES_CANCELADOS) {
    if (!porPeriodo[c.periodo]) porPeriodo[c.periodo] = []
    porPeriodo[c.periodo].push(c.cliente)
  }
  sections.push(
    `CANCELACIONES CONFIRMADAS (apartado Churn > Análisis DATA — ${CLIENTES_CANCELADOS.length} clientes):\n` +
    Object.entries(porPeriodo).map(([p, cs]) => `  ${p}: ${cs.join(', ')}`).join('\n')
  )
  modulos.push('churn-cancelados')

  const sep = '\n\n────────────────────────────────\n\n'
  return { text: sections.join(sep), modulos }
}
