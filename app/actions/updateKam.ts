'use server'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase'

export async function updateKam(cuentaId: string, formData: FormData) {
  const texto = (formData.get('observaciones_kam') as string ?? '').trim()
  await supabaseAdmin
    .from('cuentas')
    .update({ observaciones_kam: texto || null })
    .eq('id', cuentaId)
  revalidatePath(`/cuentas/${cuentaId}`)
}
