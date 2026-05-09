require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

async function main() {
  // Query the view directly
  const { data: viewData, error: viewError } = await supabase
    .from('vista_semaforo_asesor')
    .select('*')

  console.log('=== vista_semaforo_asesor ===')
  if (viewError) {
    console.error('View error:', viewError.message)
    console.log('The view may not exist. Checking manually...')
  } else {
    console.log(JSON.stringify(viewData, null, 2))
  }

  // Manual count to verify
  const { data: raw } = await supabase
    .from('cuentas')
    .select('asesor, health_score, estado, facturacion')
    .eq('estado', 'activo')

  console.log('\n=== Manual aggregation ===')
  const agg = {}
  for (const r of raw || []) {
    if (!agg[r.asesor]) agg[r.asesor] = { amarillo: 0, total: 0, facturacion: 0 }
    agg[r.asesor].total++
    agg[r.asesor].facturacion += r.facturacion || 0
    const hs = r.health_score || 0
    if (hs >= 80) agg[r.asesor].verde = (agg[r.asesor].verde || 0) + 1
    else if (hs >= 60) agg[r.asesor].azul = (agg[r.asesor].azul || 0) + 1
    else if (hs >= 40) agg[r.asesor].amarillo++
    else if (hs >= 20) agg[r.asesor].naranja = (agg[r.asesor].naranja || 0) + 1
    else agg[r.asesor].rojo = (agg[r.asesor].rojo || 0) + 1
  }
  console.log(JSON.stringify(agg, null, 2))

  // Show health_score distribution for Fatima
  const fCuentas = (raw || []).filter(r => r.asesor === 'Fátima' || r.asesor.includes('tima'))
  console.log('\nFátima accounts health_score sample:')
  console.log(fCuentas.slice(0,5).map(r => `asesor="${r.asesor}" hs=${r.health_score} estado=${r.estado}`).join('\n'))
  console.log('Total Fátima in active:', fCuentas.length)
}

main().catch(console.error)
