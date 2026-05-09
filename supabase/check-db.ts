import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function main() {
  // Count by asesor
  const { data: counts, error: e1 } = await supabase
    .from('cuentas')
    .select('asesor, consecutivo')
    .order('consecutivo')

  if (e1) { console.error(e1); return }

  const byAsesor: Record<string, string[]> = {}
  for (const row of counts || []) {
    if (!byAsesor[row.asesor]) byAsesor[row.asesor] = []
    byAsesor[row.asesor].push(row.consecutivo)
  }

  console.log('\n=== Accounts by asesor ===')
  for (const [asesor, consecs] of Object.entries(byAsesor)) {
    // Show char codes to detect encoding issues
    const codes = [...asesor].map(c => c.charCodeAt(0).toString(16)).join(',')
    console.log(`"${asesor}" [${codes}] → ${consecs.length} accounts: ${consecs.slice(0,10).join(', ')}${consecs.length>10?'...':''}`)
  }

  console.log('\nTotal:', (counts||[]).length)

  // Check F accounts specifically
  const fAccounts = (counts||[]).filter(r => r.consecutivo.startsWith('F'))
  console.log('\nF accounts in DB:', fAccounts.length)
  if (fAccounts.length > 0) {
    const sample = fAccounts[0]
    console.log('Sample F account asesor:', JSON.stringify(sample.asesor))
    const codes = [...sample.asesor].map(c => c.charCodeAt(0).toString(16)).join(',')
    console.log('Char codes:', codes)
  }
}

main().catch(console.error)
