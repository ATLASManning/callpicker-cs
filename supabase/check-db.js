require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function main() {
  const { data, error } = await supabase
    .from('cuentas')
    .select('asesor, consecutivo')
    .order('consecutivo')

  if (error) { console.error(error); return }

  const byAsesor = {}
  for (const row of data) {
    if (!byAsesor[row.asesor]) byAsesor[row.asesor] = []
    byAsesor[row.asesor].push(row.consecutivo)
  }

  console.log('=== Accounts by asesor ===')
  for (const [asesor, consecs] of Object.entries(byAsesor)) {
    const codes = Array.from(asesor).map(c => c.charCodeAt(0).toString(16)).join(',')
    console.log('"' + asesor + '" [' + codes + '] → ' + consecs.length + ' accounts: ' + consecs.slice(0,8).join(', '))
  }

  console.log('\nTotal:', data.length)

  const fAccts = data.filter(r => r.consecutivo.startsWith('F'))
  console.log('F accounts:', fAccts.length)
  if (fAccts.length > 0) {
    const codes = Array.from(fAccts[0].asesor).map(c => c.charCodeAt(0).toString(16)).join(',')
    console.log('F sample asesor:', JSON.stringify(fAccts[0].asesor), 'codes:', codes)
  }
}

main().catch(console.error)
