import { createClient } from '@supabase/supabase-js'
import querystring from 'querystring'
import { writeFileSync } from 'fs'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getZohoToken() {
  const body = querystring.stringify({
    refresh_token: '1000.0b874d840f392fdef84d7cc3953c3ab8.f52368b3598c05abfc6180aef5baa269',
    client_id:     '1000.N3KPRCPVXPDHCO5TOI011FJ4O31N6S',
    client_secret: '1cd85d090fcba3c5b35bd430a67c089e9e6e1b8787',
    grant_type:    'refresh_token',
  })
  const res = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body,
  })
  const j = await res.json()
  if (!j.access_token) throw new Error('No token: ' + JSON.stringify(j))
  return j.access_token
}

function parseCSVLine(line) {
  const result = []; let cur = ''; let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++ } else inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim()); return result
}

async function getZohoLTV(token) {
  const url = 'https://analyticsapi.zoho.com/restapi/v2/workspaces/245443000000046001/views/245443000009872084/data'
  const res = await fetch(url, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}`, 'ZANALYTICS-ORGID': '66885981' }
  })
  const text = await res.text()
  const lines = text.replace(/^﻿/, '').split('\n').filter(l => l.trim())
  const cols = parseCSVLine(lines[0])
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i])
    const obj = {}
    cols.forEach((c, idx) => obj[c] = vals[idx] ?? '')
    rows.push(obj)
  }
  return rows
}

function norm(s) {
  return (s ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim()
}

function parseMRR(s) {
  if (!s) return null
  const n = parseFloat(String(s).replace(/[$,\s]/g, ''))
  return isNaN(n) ? null : Math.round(n)
}

async function main() {
  console.log('Obteniendo cuentas TOP de Supabase...')
  // TOP = consecutivo D1-D38, F1-F46, C1-C43
  const TOP_RANGES = { F: 46, D: 38, C: 43 }
  function isTop(consecutivo) {
    if (!consecutivo) return false
    const prefix = consecutivo[0]
    const num = parseInt(consecutivo.slice(1), 10)
    return !!TOP_RANGES[prefix] && num >= 1 && num <= TOP_RANGES[prefix]
  }

  const { data: allCuentas, error } = await sb
    .from('cuentas')
    .select('id, empresa, cid, facturacion, consecutivo')
  const cuentas = (allCuentas ?? []).filter(c => isTop(c.consecutivo))
  if (error) throw error
  console.log(`${cuentas.length} cuentas TOP encontradas`)

  console.log('Obteniendo token Zoho...')
  const token = await getZohoToken()

  console.log('Descargando LTV de Zoho...')
  const zohoRows = await getZohoLTV(token)
  console.log(`${zohoRows.length} registros LTV`)

  const byCid = {}, byNorm = {}
  for (const r of zohoRows) {
    const cid = (r.id_cliente ?? '').trim()
    if (cid) byCid[cid] = r
    const n = norm(r.nombre_cliente ?? '')
    if (n) byNorm[n] = r
  }

  const updates = [], noMatch = []

  for (const c of cuentas) {
    let zoho = null
    if (c.cid) zoho = byCid[c.cid.trim()]
    if (!zoho) {
      const normEmp = norm(c.empresa)
      zoho = byNorm[normEmp]
      if (!zoho) {
        const words = normEmp.split(/\s+/).filter(w => w.length >= 4)
        if (words[0]) zoho = Object.values(byNorm).find(r => norm(r.nombre_cliente).includes(words[0]))
      }
    }
    if (zoho) {
      const mrr = parseMRR(zoho.mrr_limpio)
      updates.push({ id: c.id, empresa: c.empresa, cid: c.cid, facturacion_actual: c.facturacion, mrr_zoho: mrr, zoho_nombre: zoho.nombre_cliente, ltv: zoho.clasificacion_ltv, semaforo: zoho.semaforo_actividad })
    } else {
      noMatch.push({ id: c.id, empresa: c.empresa, cid: c.cid })
    }
  }

  console.log(`\n✅ CON MATCH: ${updates.length}`)
  updates.forEach(u => console.log(`  [${u.id}] ${u.empresa} → MRR $${u.mrr_zoho?.toLocaleString()} (antes $${u.facturacion_actual?.toLocaleString()}) | ${u.ltv} | ${u.semaforo}`))
  console.log(`\n❌ SIN MATCH: ${noMatch.length}`)
  noMatch.forEach(u => console.log(`  [${u.id}] ${u.empresa} | CID: ${u.cid ?? '—'}`))

  writeFileSync('./scripts/facturacion_result.json', JSON.stringify({ updates, noMatch }, null, 2))
  console.log('\nResultado en scripts/facturacion_result.json')
  console.log('\nEjecuta con --apply para actualizar Supabase')

  if (process.argv.includes('--apply')) {
    console.log('\nAplicando actualizaciones en Supabase...')
    let ok = 0, fail = 0
    for (const u of updates) {
      if (u.mrr_zoho == null) continue
      const { error: e } = await sb.from('cuentas').update({ facturacion: u.mrr_zoho }).eq('id', u.id)
      if (e) { console.error(`  ❌ ${u.empresa}: ${e.message}`); fail++ }
      else { console.log(`  ✅ ${u.empresa}: $${u.mrr_zoho.toLocaleString()}`); ok++ }
    }
    console.log(`\nActualizadas: ${ok} | Errores: ${fail}`)
  }
}

main().catch(console.error)
