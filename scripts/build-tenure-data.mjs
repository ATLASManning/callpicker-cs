/**
 * Genera lib/facturacion-data.json desde Supabase (tabla cuentas).
 * Crea una fila por mes por CID entre primera_factura y ultima_factura.
 *
 * Uso: node scripts/build-tenure-data.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function toIsoMonth(date) {
  return date.toISOString().slice(0, 10)  // YYYY-MM-DD
}

function parseDate(s) {
  if (!s) return null
  // Acepta YYYY-MM-DD o YYYY-MM
  const d = new Date(s + (s.length === 7 ? '-01' : ''))
  return isNaN(d.getTime()) ? null : d
}

// Determina toggle_status: 1 si la ultima_factura está en los últimos 3 meses
function toggleStatus(ultimaFechaStr) {
  const ultima = parseDate(ultimaFechaStr)
  if (!ultima) return 0
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 3)
  return ultima >= cutoff ? 1 : 0
}

async function main() {
  console.log('Obteniendo cuentas de Supabase...')

  let allCuentas = []
  let page = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await sb
      .from('cuentas')
      .select('cid, empresa, facturacion, primera_factura, ultima_factura, clasificacion')
      .not('cid', 'is', null)
      .not('primera_factura', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1)

    if (error) throw error
    if (!data || data.length === 0) break
    allCuentas.push(...data)
    if (data.length < pageSize) break
    page++
  }

  console.log(`${allCuentas.length} cuentas encontradas`)

  const rows = []
  let sinFechas = 0

  for (const c of allCuentas) {
    const primera = parseDate(c.primera_factura)
    const ultima  = parseDate(c.ultima_factura)

    if (!primera || !ultima) { sinFechas++; continue }

    const cid          = c.cid ?? 'UNKNOWN'
    const nombre       = c.empresa ?? ''
    const plan         = c.facturacion ?? 0
    const clasif       = c.clasificacion ?? 'N/A'
    const toggle       = toggleStatus(c.ultima_factura)
    const consumo      = plan > 0 ? 50 : 0  // valor aproximado

    // Genera una fila por mes (primer día)
    let cur = new Date(primera.getFullYear(), primera.getMonth(), 1)
    const end = new Date(ultima.getFullYear(), ultima.getMonth(), 1)

    while (cur <= end) {
      rows.push({
        CID:                      cid,
        'Nombre del Cliente':     nombre,
        'Fecha de corte':         toIsoMonth(cur),
        'Nombre del Plan':        'Callpicker',
        'Clasificación de empresa': clasif,
        'Monto del plan':         plan,
        '% Consumo':              consumo,
        'Toggle Status':          toggle,
        'Total de interacciones': 0,
      })
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
  }

  console.log(`Generando ${rows.length} filas (${sinFechas} cuentas sin fechas omitidas)`)

  const out = join(ROOT, 'lib', 'facturacion-data.json')
  writeFileSync(out, JSON.stringify(rows, null, 0), 'utf-8')
  console.log(`✅ Guardado en ${out}`)

  // Resumen rápido
  const cidsUnicos = new Set(rows.map(r => r.CID)).size
  console.log(`CIDs únicos: ${cidsUnicos}`)
  const mrrTotal = [...new Set(rows.map(r => r.CID))].reduce((s, cid) => {
    const last = rows.filter(r => r.CID === cid).at(-1)
    return s + (last?.['Monto del plan'] ?? 0)
  }, 0)
  console.log(`MRR total: $${Math.round(mrrTotal).toLocaleString('es-MX')}`)
}

main().catch(console.error)
