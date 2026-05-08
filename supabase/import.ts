/**
 * Import script — Top Customer.xlsx → Supabase
 * Run: npx ts-node --project tsconfig.import.json supabase/import.ts "path/to/Top Customer.xlsx"
 */
import * as XLSX from 'xlsx'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function readExcel(filePath: string) {
  return XLSX.readFile(filePath)
}

function getCellValue(ws: XLSX.WorkSheet, row: number, col: string): string {
  const cell = ws[`${col}${row}`]
  if (!cell) return ''
  return String(cell.v ?? '').trim()
}

/**
 * Truncate to `max` chars. Returns null if empty.
 * Use for EVERY VARCHAR column — pass the schema limit.
 */
function trunc(val: string | null | undefined, max: number): string | null {
  if (!val) return null
  const s = String(val).trim()
  if (!s) return null
  return s.length > max ? s.slice(0, max) : s
}

/**
 * Convert Excel date serial or string to ISO date "YYYY-MM-DD".
 * Returns null for invalid or out-of-range values.
 */
function excelDateToISO(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') {
    if (val <= 0) return null          // 0 or negative = no date
    if (val > 60000) return null       // > year 2064 = garbage
    const d = XLSX.SSF.parse_date_code(val)
    if (!d || d.y < 1990 || d.y > 2100) return null
    return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  if (typeof val === 'string') {
    const date = new Date(val)
    const y = date.getFullYear()
    if (!isNaN(date.getTime()) && y >= 1990 && y <= 2100) {
      return date.toISOString().split('T')[0]
    }
  }
  return null
}

function detectAsesor(text: string, prefix?: string): 'Fátima' | 'Dan' | 'Claudia' {
  const t = (text || '').toLowerCase()
  if (
    t.includes('fátima') || t.includes('fatima') ||
    t.includes('fã¡tima') || t.includes('fátima') ||
    t.includes('gonzalez') || t.includes('gonzález')
  ) return 'Fátima'
  if (t.includes('dan')) return 'Dan'
  if (t.includes('claudia')) return 'Claudia'
  if (prefix === 'D') return 'Dan'
  if (prefix === 'C') return 'Claudia'
  return 'Fátima'
}

// ── Parse TOP sheet ───────────────────────────────────────────────────────────
// Columns: A=CONSEC, B=CID(numeric), C=EMPRESA, D=FACTURACION, E=SERVICIO
function parseTopSheet(wb: XLSX.WorkBook) {
  const ws = wb.Sheets['TOP']
  if (!ws) { console.warn('⚠  No TOP sheet found'); return [] }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:E200')
  const accounts: { consecutivo: string; empresa: string; facturacion: number; servicio: string }[] = []

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = r + 1
    const consec   = getCellValue(ws, row, 'A')
    const empresa  = getCellValue(ws, row, 'C')
    const facStr   = getCellValue(ws, row, 'D')
    const servicio = getCellValue(ws, row, 'E')

    if (!consec || !empresa) continue
    if (!/^[FDC]\d+$/.test(consec)) continue

    const facturacion = parseFloat(facStr.replace(/[^0-9.]/g, '')) || 0
    accounts.push({ consecutivo: consec, empresa, facturacion, servicio })
  }
  return accounts
}

// ── Parse Concentrado sheet ───────────────────────────────────────────────────
// A=FICHA UX, B=CID, C=NOMBRE CLIENTE, D=CONTACTO, E=CARGO, F=TEL OFICINA,
// G=CONTACTO FACT, H=TEL CELULAR, P=DIRECCIÓN FISCAL, Q=PAGINA WEB,
// T=LINK ZOHO, U=CUANTAS OFICINAS, V=TOTAL EMPLEADOS, W=ACTIVIDAD/GIRO,
// X=TAMAÑO EMPRESA, Y=SERVICIO, Z=ACTIVA DESDE, AB=EJECUTIVO POSTVENTA,
// AD=OBSERVACIONES, AE=NOMBRE DEL GRUPO
//
// DB VARCHAR limits (as of schema + applied ALTERs):
//   empresa VARCHAR(255), giro VARCHAR(255), num_oficinas VARCHAR(255),
//   total_empleados VARCHAR(100), tamano_empresa VARCHAR(50),
//   pagina_web VARCHAR(255), observaciones_kam TEXT (no limit)
function parseConcentrado(wb: XLSX.WorkBook): Map<string, Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>()
  const ws = wb.Sheets['Concentrado']
  if (!ws) { console.warn('⚠  No Concentrado sheet found'); return map }

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:AJ200')

  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const row = r + 1
    const consec = getCellValue(ws, row, 'A')
    if (!consec || !/^[FDC]\d+$/.test(consec)) continue

    const ejecutivoPost = getCellValue(ws, row, 'AB')
    const asesor = detectAsesor(ejecutivoPost, consec.charAt(0))

    // Z = CUENTA ACTIVA DESDE (Excel date serial or 0 = no date)
    const activoDesde = excelDateToISO(ws[`Z${row}`]?.v)

    const empresa = getCellValue(ws, row, 'C')

    map.set(consec, {
      consecutivo:       trunc(consec, 10),
      cid:               trunc(getCellValue(ws, row, 'B'), 20),
      empresa:           trunc(empresa, 250) || null,
      asesor,
      contacto_nombre:   trunc(getCellValue(ws, row, 'D'), 250),
      contacto_cargo:    trunc(getCellValue(ws, row, 'E'), 250),
      contacto_tel:      trunc(getCellValue(ws, row, 'F') || getCellValue(ws, row, 'H'), 100),
      direccion_fiscal:  trunc(getCellValue(ws, row, 'P'), 250),
      pagina_web:        trunc(getCellValue(ws, row, 'Q'), 250),
      zoho_link:         trunc(getCellValue(ws, row, 'T'), 250),
      num_oficinas:      trunc(getCellValue(ws, row, 'U'), 250),   // up to 534 chars in source
      total_empleados:   trunc(getCellValue(ws, row, 'V'), 95),    // VARCHAR(100) → cap at 95
      giro:              trunc(getCellValue(ws, row, 'W'), 250),   // up to 355 chars in source
      tamano_empresa:    trunc(getCellValue(ws, row, 'X'), 45),    // VARCHAR(50) → cap at 45
      servicio:          getCellValue(ws, row, 'Y') || null,
      activo_desde:      activoDesde,
      grupo_empresarial: trunc(getCellValue(ws, row, 'AE'), 250),
      observaciones_kam: getCellValue(ws, row, 'AD') || null,      // TEXT — no limit needed
    })
  }

  return map
}

// ── Parse individual Ficha UX sheets ─────────────────────────────────────────
// Layout verified against F1:
//   D1  = CID (numeric)
//   G2  = direccion_fiscal
//   G3  = pagina_web
//   G6  = zoho_link
//   G7  = num_oficinas
//   G8  = total_empleados
//   G9  = giro
//   G10 = tamano_empresa
//   G12 = activo_desde (Excel date serial)
//   G14 = ejecutivo postventa → asesor
//   C3  = contacto_nombre
//   C4  = contacto_cargo
//   C5  = contacto_tel (oficina)   / C7 = celular fallback
function parseFichaUX(ws: XLSX.WorkSheet, sheet: string): Record<string, unknown> {
  const get = (row: number, col: string) => getCellValue(ws, row, col)

  const ejecutivoPost = get(14, 'G')   // G14 = EJECUTIVO POSTVENTA
  const asesor = detectAsesor(ejecutivoPost, sheet.charAt(0))

  const activoDesde = excelDateToISO(ws['G12']?.v)   // G12 = CUENTA ACTIVA DESDE

  const fichaData: Record<string, unknown> = {
    asesor,
    cid:              trunc(get(1, 'D'), 20)   || undefined,
    contacto_nombre:  trunc(get(3, 'C'), 250)  || undefined,
    contacto_cargo:   trunc(get(4, 'C'), 250)  || undefined,
    contacto_tel:     trunc(get(5, 'C') || get(7, 'C'), 100) || undefined,
    direccion_fiscal: trunc(get(2, 'G'), 250)  || undefined,
    pagina_web:       trunc(get(3, 'G'), 250)  || undefined,
    zoho_link:        trunc(get(6, 'G'), 250)  || undefined,
    num_oficinas:     trunc(get(7, 'G'), 250)  || undefined,
    total_empleados:  trunc(get(8, 'G'), 95)   || undefined,   // VARCHAR(100)
    giro:             trunc(get(9, 'G'), 250)  || undefined,
    tamano_empresa:   trunc(get(10, 'G'), 45)  || undefined,   // VARCHAR(50)
  }

  if (activoDesde) fichaData.activo_desde = activoDesde

  // Remove undefined keys so they don't overwrite good Concentrado data
  Object.keys(fichaData).forEach(k => fichaData[k] === undefined && delete fichaData[k])

  return fichaData
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2] || path.join(__dirname, '../../Top Customer.xlsx')
  console.log(`Reading: ${xlsxPath}\n`)

  const wb = readExcel(xlsxPath)
  const topAccounts = parseTopSheet(wb)

  const fichaSheets = wb.SheetNames.filter(n => /^[FDC]\d+$/.test(n))
  const fSheets = fichaSheets.filter(n => n.startsWith('F')).length
  const dSheets = fichaSheets.filter(n => n.startsWith('D')).length
  const cSheets = fichaSheets.filter(n => n.startsWith('C')).length
  console.log(`TOP sheet    → ${topAccounts.length} accounts (F:${topAccounts.filter(a=>a.consecutivo.startsWith('F')).length} D:${topAccounts.filter(a=>a.consecutivo.startsWith('D')).length} C:${topAccounts.filter(a=>a.consecutivo.startsWith('C')).length})`)
  console.log(`Ficha sheets → ${fichaSheets.length} sheets (F:${fSheets} D:${dSheets} C:${cSheets})`)

  // ── Pass 1: seed accountMap from TOP sheet ────────────────────────────────
  const accountMap = new Map<string, Record<string, unknown>>()
  for (const acc of topAccounts) {
    accountMap.set(acc.consecutivo, {
      consecutivo:      trunc(acc.consecutivo, 10),
      empresa:          trunc(acc.empresa, 250),
      facturacion:      acc.facturacion,
      servicio:         acc.servicio || null,
      score_actividad:  50,
      score_adopcion:   50,
      score_pago:       50,
      score_relacional: 50,
      estado:           'activo',
    })
  }

  // ── Pass 2: merge Concentrado into ALL 108 accounts ───────────────────────
  // Accounts not in TOP (e.g. D10-D14, C15-C47) are ADDED here.
  const concentradoMap = parseConcentrado(wb)
  console.log(`Concentrado  → ${concentradoMap.size} accounts`)

  let mergeNew = 0, mergeExisting = 0
  // Use .forEach() instead of for...of to avoid TS Map iteration compilation issues
  concentradoMap.forEach((conData, consec) => {
    const existing = accountMap.get(consec)   // undefined if not in TOP

    if (existing) {
      // Account was in TOP — merge, keep TOP's facturación and empresa
      accountMap.set(consec, {
        ...existing,
        ...conData,
        consecutivo:     existing.consecutivo,
        empresa:         existing.empresa  || conData.empresa,
        facturacion:     (existing as any).facturacion !== undefined ? (existing as any).facturacion : ((conData as any).facturacion || 0),
        servicio:        existing.servicio || conData.servicio,
        score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
        estado:          'activo',
      })
      mergeExisting++
    } else {
      // Account only in Concentrado — add fresh with defaults
      accountMap.set(consec, {
        score_actividad: 50, score_adopcion: 50, score_pago: 50, score_relacional: 50,
        estado:          'activo',
        facturacion:     0,
        ...conData,
      })
      mergeNew++
    }
  })
  console.log(`After merge  → ${accountMap.size} accounts (updated:${mergeExisting} added:${mergeNew})`)

  // ── Pass 3: enrich with individual Ficha UX sheets ───────────────────────
  let enriched = 0
  for (const sheet of fichaSheets) {
    const ws = wb.Sheets[sheet]
    if (!ws) continue

    const existing = accountMap.get(sheet)
    if (!existing) continue   // not found in either TOP or Concentrado

    const fichaData = parseFichaUX(ws, sheet)
    accountMap.set(sheet, { ...existing, ...fichaData })
    enriched++
  }
  console.log(`Ficha UX     → ${enriched} accounts enriched`)

  // ── Filter and upsert ─────────────────────────────────────────────────────
  const allRows = Array.from(accountMap.values())
  const rowsWithEmpresa = allRows.filter(r => r.empresa)
  const rowsNoEmpresa   = allRows.filter(r => !r.empresa).map(r => r.consecutivo)

  if (rowsNoEmpresa.length) {
    console.warn(`\n⚠  Skipping ${rowsNoEmpresa.length} accounts with no empresa: ${rowsNoEmpresa.join(', ')}`)
  }

  console.log(`\nUpserting ${rowsWithEmpresa.length} accounts to Supabase…`)
  console.log(`  Fátima:  ${rowsWithEmpresa.filter(r => String(r.consecutivo).startsWith('F')).length} cuentas`)
  console.log(`  Dan:     ${rowsWithEmpresa.filter(r => String(r.consecutivo).startsWith('D')).length} cuentas`)
  console.log(`  Claudia: ${rowsWithEmpresa.filter(r => String(r.consecutivo).startsWith('C')).length} cuentas\n`)

  let totalErrors = 0
  for (let i = 0; i < rowsWithEmpresa.length; i += 50) {
    const chunk = rowsWithEmpresa.slice(i, i + 50)
    const label = `Chunk ${Math.floor(i / 50) + 1}`
    const { error } = await supabase
      .from('cuentas')
      .upsert(chunk, { onConflict: 'consecutivo' })
    if (error) {
      console.error(`✗ ${label} error:`, error.message)
      totalErrors++
    } else {
      console.log(`✓ ${label}: ${chunk.length} records`)
    }
  }

  if (totalErrors === 0) {
    console.log('\n✅ Import complete — todas las cuentas cargadas correctamente.')
  } else {
    console.error(`\n❌ Import terminó con ${totalErrors} error(es). Revisa los mensajes arriba.`)
  }
}

main().catch(console.error)
