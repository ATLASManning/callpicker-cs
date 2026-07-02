/**
 * Actualiza facturacion en Supabase para cuentas GRUPO cuya
 * sub-cuentas en Zoho tienen un prefijo acrónimo (ej: GTC = Grupo Torres Corzo).
 * Suma solo las sub-cuentas del mes más reciente.
 */
import { createClient } from '@supabase/supabase-js'
import querystring from 'querystring'

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

function acronym(nombre) {
  return nombre.trim().split(/\s+/)
    .filter(w => w.length >= 2)
    .map(w => norm(w)[0] ?? '')
    .join('')
}

function parseMRR(s) {
  if (!s) return null
  const n = parseFloat(String(s).replace(/[$,\s]/g, ''))
  return isNaN(n) ? null : Math.round(n)
}

const MESES = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 }

function parseMesAnio(fecha) {
  if (!fecha) return ''
  const parts = fecha.trim().split(' ')
  if (parts.length >= 3) return `${parts[1]} ${parts[2]}`
  if (fecha.includes('-')) { const p = fecha.split('-'); return `${p[1]}-${p[0]}` }
  return fecha
}

function mesRank(mesAnio) {
  const [m, y] = mesAnio.split(' ')
  return (parseInt(y ?? '0') * 100) + (MESES[m] ?? 0)
}

async function main() {
  const apply = process.argv.includes('--apply')

  // 1. Obtener cuentas GRUPO de Supabase
  const { data: cuentas, error } = await sb.from('cuentas')
    .select('id, empresa, cid, facturacion, consecutivo, grupo_empresarial')
    .not('grupo_empresarial', 'is', null)
    .neq('grupo_empresarial', '')
  if (error) throw error
  console.log(`${cuentas.length} cuentas con grupo=true`)

  // 2. Zoho LTV
  console.log('Obteniendo token Zoho...')
  const token = await getZohoToken()
  console.log('Descargando LTV de Zoho...')
  const zohoRows = await getZohoLTV(token)
  console.log(`${zohoRows.length} registros LTV en Zoho\n`)

  const updates = [], noMatch = []

  for (const c of cuentas) {
    const acr = acronym(c.empresa)
    if (acr.length < 3) { noMatch.push({ ...c, razon: `acrónimo muy corto: "${acr}"` }); continue }

    // Buscar sub-cuentas cuyo nombre_cliente empiece con el acrónimo
    const sub = zohoRows.filter(r => {
      const n = norm(r.nombre_cliente ?? '')
      return n.startsWith(acr + ' ') || n.startsWith(acr + '-') || n === acr
    })

    if (sub.length === 0) { noMatch.push({ ...c, razon: `sin match para acrónimo "${acr.toUpperCase()}"` }); continue }

    // Encontrar mes más reciente
    const fechas = sub.map(r => parseMesAnio(r.ultima_factura)).filter(Boolean)
    const mesReciente = fechas.sort((a, b) => mesRank(b) - mesRank(a))[0]

    // Sumar solo ese mes
    const subMes = sub.filter(r => parseMesAnio(r.ultima_factura) === mesReciente)
    const mrrTotal = Math.round(subMes.reduce((s, r) => s + (parseMRR(r.mrr_limpio) ?? 0), 0))

    updates.push({
      id: c.id,
      empresa: c.empresa,
      acr: acr.toUpperCase(),
      subCuentas: sub.length,
      subMes: subMes.length,
      mesReciente,
      mrrAntes: c.facturacion,
      mrrNuevo: mrrTotal,
    })
  }

  console.log(`✅ CON MATCH (${updates.length}):`)
  for (const u of updates) {
    console.log(`  [${u.id}] ${u.empresa} → acrónimo "${u.acr}" → ${u.subMes}/${u.subCuentas} sub-cuentas en ${u.mesReciente} → MRR $${u.mrrNuevo.toLocaleString()} (antes $${u.mrrAntes?.toLocaleString() ?? '—'})`)
  }

  console.log(`\n❌ SIN MATCH (${noMatch.length}):`)
  for (const u of noMatch) {
    console.log(`  [${u.id}] ${u.empresa} — ${u.razon}`)
  }

  if (!apply) {
    console.log('\n⚠️  Agrega --apply para actualizar Supabase')
    return
  }

  console.log('\nAplicando en Supabase...')
  let ok = 0, fail = 0
  for (const u of updates) {
    if (!u.mrrNuevo) continue
    const { error: e } = await sb.from('cuentas').update({ facturacion: u.mrrNuevo }).eq('id', u.id)
    if (e) { console.error(`  ❌ ${u.empresa}: ${e.message}`); fail++ }
    else { console.log(`  ✅ ${u.empresa}: $${u.mrrNuevo.toLocaleString()}`); ok++ }
  }
  console.log(`\nActualizadas: ${ok} | Errores: ${fail}`)
}

main().catch(console.error)
