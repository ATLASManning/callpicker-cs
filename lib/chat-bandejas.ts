/**
 * lib/chat-bandejas.ts
 * Inventario de bandejas de Callpicker Chat: tipo, proveedor, estado de
 * medición y cuál es la bandeja principal de cada cliente.
 *
 * ── POR QUÉ ESTE MÓDULO EXISTE ─────────────────────────────────────────────
 * El tablero ya publica la mezcla de canal por MENSAJES. Faltaba el inventario
 * por CANTIDAD de bandejas, que responde otra pregunta: no «por dónde entra el
 * tráfico» sino «qué tenemos montado y cuánto de eso podemos ver».
 *
 * ── LAS TRES TRAMPAS QUE ESTE MÓDULO NO PUEDE DEJAR PASAR ──────────────────
 *
 * 1. UN CERO NO ES UNA BANDEJA OCIOSA. De las 208 bandejas «WhatsApp API»,
 *    solo 9 tienen medición válida: 129 quedaron en `LIM` —el recolector topó
 *    su límite y nunca las abrió— y 70 en error. Llamarlas ociosas sería
 *    confundir ceguera con inactividad, y manda al asesor a ofrecerle al
 *    cliente que apague bandejas que quizá está usando. Por eso `ociosas` solo
 *    cuenta las que tienen reconciliación OK y cero mensajes.
 *
 * 2. UN CONTEO GRANDE PUEDE SER UN SOLO CLIENTE. 127 de esas 208 bandejas API
 *    son de GRUPO TORRES CORZO —el 61%—. Sin él la relación se invierte: 81
 *    API contra 196 QR. Por eso cada tipo publica su cliente dominante y qué
 *    porcentaje aporta: un total sin su dominante engaña.
 *
 * 3. «SIN TIPO» NO ES UN HUECO DE CALIDAD, ES UNA FECHA. Las 480 bandejas
 *    tipificadas se midieron entre el 2 y el 6 de agosto de 2026; las 588 sin
 *    tipo, entre junio y julio. El campo entró al export en esa ventana. El
 *    inventario por tipo NO es una muestra aleatoria del portafolio: es lo que
 *    se midió con el esquema nuevo.
 */
import { CHAT_CLIENTES } from '@/app/callpicker-chat/chat-data'

export interface TipoBandeja {
  tipo: string
  bandejas: number
  clientes: number
  /** Reconciliación OK: la única lectura en la que se puede confiar. */
  medidas: number
  /** Nunca se abrieron: límite del recolector o error HTTP. */
  sinMedicion: number
  conTrafico: number
  /** OK y cero mensajes. Ociosa de verdad, no simplemente no vista. */
  ociosas: number
  contratadas: number
  mensajes: number
  /** El cliente que más bandejas aporta a este tipo, y cuántas. */
  dominante: string | null
  dominanteBandejas: number
}

export interface ProveedorBandeja {
  proveedor: string
  bandejas: number
  clientes: number
}

export interface InventarioBandejas {
  totalBandejas: number
  conTipo: number
  sinTipo: number
  tipos: TipoBandeja[]
  proveedores: ProveedorBandeja[]
  /** Clientes con al menos una bandeja Whatsbail (QR no oficial). */
  clientesWhatsbail: number
  /** De ésos, los que NO tienen ninguna bandeja Gupshup: sin respaldo oficial. */
  clientesSoloWhatsbail: number
  soloWhatsbail: { nombre: string; tier: string | null; bandejas: number; mensajes: number }[]
  /** Reparto global del estado de medición. */
  medicion: { ok: number; lim: number; err: number; sinDato: number }
  /** Bandeja principal por CLIENTE — ver la nota de `principales`. */
  principales: {
    nombre: string; tier: string | null
    bandeja: string; tipo: string; mensajes: number
    pesoEnCliente: number; bandejasCliente: number
  }[]
  principalPorTipo: { tipo: string; clientes: number }[]
  /** Cobertura de la sección de bandeja principal. */
  clientesConPrincipal: number
  clientesTotales: number
  volumenConPrincipal: number
  volumenTotal: number
}

const SIN_TIPO = '(sin tipo en el archivo)'
const SIN_PROV = '(sin proveedor)'

/**
 * La bandeja NO trae identificador de cuenta: `ChatInbox` no tiene ese campo y
 * el generador agrupa por CID. Por eso la «bandeja principal» solo puede
 * calcularse por CLIENTE. Pedirla por cuenta no es que falte — es que el dato
 * publicado no permite responderlo, y decir «cuenta» donde hay «cliente» sería
 * inventar una precisión que no existe.
 */
export function inventarioBandejas(): InventarioBandejas {
  const cl = CHAT_CLIENTES as any[]

  const porTipo = new Map<string, TipoBandeja & { _clientes: Set<string>; _porCliente: Map<string, number> }>()
  const porProv = new Map<string, { bandejas: number; _clientes: Set<string> }>()
  const medicion = { ok: 0, lim: 0, err: 0, sinDato: 0 }

  const conWhatsbail = new Set<string>()
  const conGupshup = new Set<string>()
  const datosCliente = new Map<string, { tier: string | null; bandejas: number; mensajes: number }>()

  for (const c of cl) {
    const id = String(c.cid ?? c.nombre)
    for (const b of (c.inboxes ?? []) as any[]) {
      const tipo = b.tipo || SIN_TIPO
      let t = porTipo.get(tipo)
      if (!t) {
        t = {
          tipo, bandejas: 0, clientes: 0, medidas: 0, sinMedicion: 0, conTrafico: 0,
          ociosas: 0, contratadas: 0, mensajes: 0, dominante: null, dominanteBandejas: 0,
          _clientes: new Set<string>(), _porCliente: new Map<string, number>(),
        }
        porTipo.set(tipo, t)
      }
      const msg = b.mensajes || 0
      t.bandejas++
      t._clientes.add(id)
      t._porCliente.set(c.nombre, (t._porCliente.get(c.nombre) ?? 0) + 1)
      t.mensajes += msg
      if (b.contratado) t.contratadas++
      if (msg > 0) t.conTrafico++
      if (b.reconciliacion === 'OK') {
        t.medidas++
        if (msg === 0) t.ociosas++
      } else if (b.reconciliacion === 'LIM' || b.reconciliacion === 'ERR') {
        t.sinMedicion++
      }

      switch (b.reconciliacion) {
        case 'OK':  medicion.ok++;  break
        case 'LIM': medicion.lim++; break
        case 'ERR': medicion.err++; break
        default:    medicion.sinDato++
      }

      const prov = b.proveedor || SIN_PROV
      let p = porProv.get(prov)
      if (!p) { p = { bandejas: 0, _clientes: new Set<string>() }; porProv.set(prov, p) }
      p.bandejas++
      p._clientes.add(id)

      if (b.proveedor === 'Whatsbail') conWhatsbail.add(c.nombre)
      if (b.proveedor === 'Gupshup')   conGupshup.add(c.nombre)
    }
    datosCliente.set(c.nombre, {
      tier: c.tier ?? null,
      bandejas: (c.inboxes ?? []).length,
      mensajes: c.mensajes || 0,
    })
  }

  const tipos = Array.from(porTipo.values()).map(t => {
    let dom: string | null = null, domN = 0
    for (const [nombre, n] of Array.from(t._porCliente.entries())) {
      if (n > domN) { dom = nombre; domN = n }
    }
    const { _clientes, _porCliente, ...limpio } = t
    return { ...limpio, clientes: _clientes.size, dominante: dom, dominanteBandejas: domN }
  }).sort((a, b) => b.bandejas - a.bandejas)

  const proveedores = Array.from(porProv.entries())
    .map(([proveedor, v]) => ({ proveedor, bandejas: v.bandejas, clientes: v._clientes.size }))
    .sort((a, b) => b.bandejas - a.bandejas)

  /* Riesgo de continuidad por PROVEEDOR, no por tráfico.
   * El `riesgoQR` que ya publica el tablero exige mensajes clasificados y por
   * eso solo alcanza a 6 clientes. Whatsbail es la conexión no oficial: quien
   * tiene bandejas suyas y ninguna de Gupshup no tiene respaldo en API
   * oficial, se le haya podido medir el tráfico o no. */
  const soloWhatsbail = Array.from(conWhatsbail)
    .filter(nombre => !conGupshup.has(nombre))
    .map(nombre => ({ nombre, ...(datosCliente.get(nombre) ?? { tier: null, bandejas: 0, mensajes: 0 }) }))
    .sort((a, b) => b.mensajes - a.mensajes)

  const principales: InventarioBandejas['principales'] = []
  const porTipoPrincipal = new Map<string, number>()
  let volumenConPrincipal = 0
  for (const c of cl) {
    const conTrafico = ((c.inboxes ?? []) as any[]).filter(b => (b.mensajes || 0) > 0)
    if (!conTrafico.length) continue
    const total = conTrafico.reduce((s, b) => s + b.mensajes, 0)
    const top = conTrafico.reduce((a, b) => (b.mensajes > a.mensajes ? b : a))
    const tipo = top.tipo || SIN_TIPO
    principales.push({
      nombre: c.nombre, tier: c.tier ?? null,
      bandeja: top.nombre || '(sin nombre)', tipo,
      mensajes: top.mensajes,
      pesoEnCliente: (100 * top.mensajes) / total,
      bandejasCliente: (c.inboxes ?? []).length,
    })
    porTipoPrincipal.set(tipo, (porTipoPrincipal.get(tipo) ?? 0) + 1)
    volumenConPrincipal += c.mensajes || 0
  }
  principales.sort((a, b) => b.mensajes - a.mensajes)

  const totalBandejas = tipos.reduce((s, t) => s + t.bandejas, 0)
  const sinTipo = tipos.find(t => t.tipo === SIN_TIPO)?.bandejas ?? 0

  return {
    totalBandejas,
    conTipo: totalBandejas - sinTipo,
    sinTipo,
    tipos,
    proveedores,
    clientesWhatsbail: conWhatsbail.size,
    clientesSoloWhatsbail: soloWhatsbail.length,
    soloWhatsbail,
    medicion,
    principales,
    principalPorTipo: Array.from(porTipoPrincipal.entries())
      .map(([tipo, clientes]) => ({ tipo, clientes }))
      .sort((a, b) => b.clientes - a.clientes),
    clientesConPrincipal: principales.length,
    clientesTotales: cl.length,
    volumenConPrincipal,
    volumenTotal: cl.reduce((s, c) => s + (c.mensajes || 0), 0),
  }
}
