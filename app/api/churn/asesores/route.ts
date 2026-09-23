import { NextResponse } from 'next/server'
import { getCuentas } from '@/lib/supabase'
import { normalizarNombre } from '@/lib/elegibilidad'
import { AAA_GRC_FLAT } from '@/app/churn/aaa-grc-data'
import { reglaPara, claveAlias } from '@/lib/grc-asesor-alias'

/**
 * Quién es el asesor de cada cliente del export de GRC — y de quién NO se sabe.
 *
 * POR QUÉ NO SE USA `/api/cuentas`
 * --------------------------------
 * Esa ruta RECORTA la cartera cuando quien entra es un asesor: devuelve solo
 * las suyas. La concentración de Churn y Downgrade de GRC AAA tiene que nombrar
 * al responsable de CADA cuenta, así que con esa fuente un asesor vería el
 * resto de la tabla como «sin asesor» y nada en pantalla se lo advertiría. Un
 * recorte silencioso es peor que no tener el dato.
 *
 * No amplía lo que ya se ve: el módulo Churn muestra a todo el que entra el
 * nombre y el MRR perdido de cada cliente. Esto solo añade de quién es la
 * cuenta.
 *
 * TRES VÍAS, EN ESTE ORDEN
 * ------------------------
 *   1. `cartera` — el nombre de GRC es idéntico al de una cuenta.
 *   2. `alias`   — una regla CONFIRMADA por dirección lo apunta a una cuenta.
 *   3. `directo` — una regla confirmada da el asesor porque no hay cuenta.
 *
 * Y lo que no entra por ninguna NO se adivina. Para esos se devuelve, aparte,
 * la cuenta a la que MÁS se parece, marcada como sugerencia sin confirmar: la
 * pantalla la muestra en su propio bloque y no la suma a ningún asesor. El
 * parecido se equivoca —propone «ADSA» ≈ «TATSA» con 0.67, que son dos
 * empresas distintas—, así que sirve para preguntar, nunca para asignar.
 */

/** Parecido 0..1 entre dos nombres ya normalizados con espacios. */
function parecido(a: string, b: string): number {
  if (!a || !b) return 0
  if (a === b) return 1
  // Que uno contenga al otro es la señal fuerte: «hotel real de minas san
  // miguel» dentro de «hotel real de minas san miguel de allende».
  if (a.includes(b) || b.includes(a)) return 0.88
  const bigramas = (s: string) => {
    const g = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2))
    return g
  }
  const ga = bigramas(a), gb = bigramas(b)
  if (!ga.size || !gb.size) return 0
  let comunes = 0
  ga.forEach(x => { if (gb.has(x)) comunes++ })
  return (2 * comunes) / (ga.size + gb.size)
}

const UMBRAL_SUGERENCIA = 0.62

export async function GET() {
  try {
    const cuentas = await getCuentas()

    /* Índice por nombre normalizado. Un nombre que dos cuentas comparten con
       distinto dueño no se puede resolver sin inventar: se retira del índice
       y se reporta. */
    const idx: Record<string, { asesor: string; consecutivo: string; empresa: string }> = {}
    const ambiguos: string[] = []
    for (const c of cuentas) {
      const k = normalizarNombre(c.empresa)
      if (!k || !c.asesor) continue
      const previo = idx[k]
      if (previo && previo.asesor !== c.asesor) {
        if (!ambiguos.includes(k)) ambiguos.push(k)
        continue
      }
      idx[k] = { asesor: c.asesor, consecutivo: c.consecutivo ?? '', empresa: c.empresa }
    }
    for (const k of ambiguos) delete idx[k]

    /* Índice de las cuentas por su nombre EXACTO, para las reglas que apuntan
       a una cuenta concreta. */
    const porEmpresa: Record<string, { asesor: string; consecutivo: string }> = {}
    for (const c of cuentas) {
      if (c.asesor) porEmpresa[c.empresa] = { asesor: c.asesor, consecutivo: c.consecutivo ?? '' }
    }

    const nombresGrc = Array.from(new Set(AAA_GRC_FLAT.map(r => r.cliente).filter(Boolean)))

    const porCliente: Record<string, {
      asesor: string; via: 'cartera' | 'alias' | 'directo'; cuenta?: string; nota?: string
    }> = {}
    const sinResolver: string[] = []

    for (const nombre of nombresGrc) {
      const k = normalizarNombre(nombre)
      if (!k) continue

      const enCartera = idx[k]
      if (enCartera) {
        porCliente[k] = { asesor: enCartera.asesor, via: 'cartera', cuenta: enCartera.empresa }
        continue
      }

      const regla = reglaPara(nombre)
      if (regla?.cuenta) {
        const c = porEmpresa[regla.cuenta]
        if (c) {
          porCliente[k] = { asesor: c.asesor, via: 'alias', cuenta: regla.cuenta, nota: regla.nota }
          continue
        }
        // La regla apunta a una cuenta que ya no existe: es un error de la
        // tabla, no del dato. Se deja sin resolver para que se note.
      } else if (regla?.asesor) {
        porCliente[k] = { asesor: regla.asesor, via: 'directo', nota: regla.nota }
        continue
      }
      sinResolver.push(nombre)
    }

    /* Sugerencias: a qué cuenta se parece cada uno de los que no cruzan.
       NO son atribuciones — la pantalla las muestra aparte y sin sumarlas. */
    const candidatos = cuentas
      .filter(c => c.asesor)
      .map(c => ({ k: claveAlias(c.empresa), empresa: c.empresa, asesor: c.asesor, consecutivo: c.consecutivo ?? '' }))

    const sugerencias = sinResolver.map(nombre => {
      const s = claveAlias(nombre)
      let mejor: typeof candidatos[number] | null = null
      let score = 0
      for (const c of candidatos) {
        const p = parecido(s, c.k)
        if (p > score) { score = p; mejor = c }
      }
      return score >= UMBRAL_SUGERENCIA && mejor
        ? {
            cliente: nombre, parecido: Math.round(score * 100) / 100,
            cuenta: mejor.empresa, consecutivo: mejor.consecutivo, asesor: mejor.asesor,
          }
        : { cliente: nombre, parecido: 0 }
    })

    return NextResponse.json({
      porCliente,
      sugerencias: sugerencias.filter(s => s.parecido > 0).sort((a, b) => b.parecido - a.parecido),
      sinParecido: sugerencias.filter(s => s.parecido === 0).map(s => s.cliente),
      ambiguos,
      totalCuentas: cuentas.length,
      nombresGrc: nombresGrc.length,
      resueltos: Object.keys(porCliente).length,
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Error leyendo la cartera' },
      { status: 500 },
    )
  }
}
