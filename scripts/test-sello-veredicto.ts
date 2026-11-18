/**
 * EL SELLO DE LOS TEXTOS DEL MOTOR DE RIESGO
 * ===========================================
 *
 *     npm run test:veredicto          comprueba
 *     npm run test:veredicto -- --sella   imprime los literales para pegar
 *
 * POR QUÉ EXISTE
 * --------------
 * `docs/MOTOR_RIESGO.md` declara el motor intocable sin solicitud expresa, y el
 * propio documento reconoce el agujero: **«No hay test de snapshot de los
 * textos. Hoy nada impide que un cambio reescriba el `porque` de una situación
 * sin que salte ninguna prueba. Es el candado más barato de los que pide el
 * prompt y el único que protege de verdad lo que declara intocable.»**
 *
 * Esto es ese candado. Y NO levanta el otro: añadir una prueba no modifica el
 * motor. `lib/alertas-veredicto.ts` queda exactamente igual.
 *
 * QUÉ PROTEGE, Y QUÉ NO
 * ----------------------
 * Protege la SALIDA de `veredictoDe` para siete entradas, una por situación:
 * la situación elegida, la luz, el dueño, la acción y el `porque` **carácter a
 * carácter**. Un cambio que reescriba una de esas frases rompe la prueba y
 * aparece como un diff en este archivo, que hay que aprobar a mano.
 *
 * NO protege que el texto sea el CORRECTO: protege que no cambie sin que nadie
 * se entere. Son cosas distintas y conviene no confundirlas.
 *
 * LOS LITERALES NO SE TECLEAN
 * ----------------------------
 * Se generan con `--sella` desde el motor real. Teclear a mano lo que debería
 * decir convertiría el sello en una segunda opinión mía sobre el texto, que es
 * justo lo que un sello no es. [[feedback-verificar-antes-asegurar]]
 */
import { veredictoDe, type EstadoCuenta, type Veredicto } from '../lib/alertas-veredicto'
import type { Alerta, TipoAlerta, Familia, Severidad, Dueno } from '../lib/alertas'

const sella = process.argv.includes('--sella')
let fallos = 0

/* ── Las entradas ─────────────────────────────────────────────────────────────
   Una cuenta base sana, y siete variantes mínimas. Cada variante cambia LO
   MENOS POSIBLE: si una entrada tocara cinco campos, no se sabría cuál llevó al
   veredicto, y el día que la prueba fallara no diría dónde mirar. */

function alerta(tipo: TipoAlerta, extra: Partial<Alerta> = {}): Alerta {
  return {
    id: `a-${tipo}`, tipo,
    familia: (extra.familia ?? 'riesgo') as Familia,
    severidad: (extra.severidad ?? 'alta') as Severidad,
    dueno: (extra.dueno ?? 'asesor') as Dueno,
    cuentaId: 'c-1', consecutivo: 'CS-001', cid: '162474',
    empresa: 'Empresa de Prueba', asesor: 'Asesor de Prueba',
    mrr: 10000, esTop: false,
    titulo: extra.titulo ?? `Título de ${tipo}`,
    evidencia: extra.evidencia ?? 'evidencia de prueba',
    accion: 'acción de prueba',
    enlace: '/cuentas/c-1', enlaceEtiqueta: 'Ver cuenta',
    ...extra,
  } as Alerta
}

const BASE: EstadoCuenta = {
  cuentaId: 'c-1', empresa: 'Empresa de Prueba', asesor: 'Asesor de Prueba',
  mrr: 10000, esTop: false,
  alertas: [],
  consumoPct: 55, diasSinContacto: 10,
  tieneLlamadas: true, perdidas: 3, pctPerdidas: 5,
  tieneAuditoria: true, candidatura: null, productosSinUso: 0,
  tickets: 4, fallas: 0, reuniones: 2, relacionPct: 70, fuentes: 8,
}

const CASOS: Array<{ nombre: string; e: EstadoCuenta }> = [
  {
    nombre: 'se_va · hay una baja escrita',
    e: { ...BASE, alertas: [alerta('baja_declarada', {
      titulo: 'Baja declarada', evidencia: 'el cliente avisó por correo el 3 de noviembre',
    })] },
  },
  {
    /* OJO CON ESTE CASO. La primera versión ponía consumo 0 y 74 días de
       silencio, y el motor contestó `se_va`, no `apagandose`: las dos cosas
       juntas son su firma de baja no dicha. El caso sólo aísla «apagándose» si
       el contacto es reciente. Sellarlo con la etiqueta equivocada habría
       dejado `apagandose` sin proteger y la prueba en verde. */
    nombre: 'apagandose · dejó de consumir, pero el contacto es reciente',
    e: { ...BASE, consumoPct: 0, diasSinContacto: 10 },
  },
  {
    nombre: 'no_la_vemos · faltan fuentes para poder opinar',
    e: { ...BASE, consumoPct: null, diasSinContacto: null,
         tieneLlamadas: false, perdidas: null, pctPerdidas: null,
         tieneAuditoria: false, tickets: null, fuentes: 2 },
  },
  {
    nombre: 'sin_auditar · hay datos y falta el análisis',
    e: { ...BASE, tieneAuditoria: false },
  },
  {
    nombre: 'hay_que_mostrarle · material de valor sin presentar',
    e: { ...BASE, perdidas: 180, pctPerdidas: 42, reuniones: 0 },
  },
  {
    nombre: 'oportunidad · la casa en orden y espacio para crecer',
    e: { ...BASE, candidatura: 'Videollamada', productosSinUso: 0 },
  },
  {
    /* La cuenta BASE no está «en orden»: con 3 llamadas perdidas y 4 tickets
       resueltos, el motor encuentra dos cosas que mostrarle y la manda a
       `hay_que_mostrarle`. Para aislar `en_orden` hay que quitarle TAMBIÉN el
       material de valor — que es, en sí, un hallazgo del motor: casi ninguna
       cuenta medida se queda sin nada que enseñar. */
    nombre: 'en_orden · nada que hacer esta semana',
    e: { ...BASE, perdidas: 0, pctPerdidas: 0, tickets: 0, productosSinUso: 0 },
  },
]

/* ── EL SELLO ─────────────────────────────────────────────────────────────────
   Generado con `--sella` desde el motor real el 18 nov 2026. Cada cambio aquí
   es un cambio del texto que lee un asesor, y tiene que aprobarse a mano. */
const SELLO: Record<string, Pick<Veredicto, 'situacion' | 'luz' | 'dueno' | 'accion' | 'porque'>> =
{
  "se_va · hay una baja escrita": {
    "situacion": "se_va",
    "luz": "rojo",
    "dueno": "asesor",
    "accion": "Llamar esta semana y confirmar qué está pasando",
    "porque": "Hay señal de salida escrita: «el cliente avisó por correo el 3 de noviembre». Son $10,000 al mes."
  },
  "apagandose · dejó de consumir, pero el contacto es reciente": {
    "situacion": "apagandose",
    "luz": "naranja",
    "dueno": "asesor",
    "accion": "Revisar con el cliente por qué bajó el uso, y qué le falta para volver",
    "porque": "No registra consumo en su último corte y lleva 10 días sin contacto."
  },
  "no_la_vemos · faltan fuentes para poder opinar": {
    "situacion": "no_la_vemos",
    "luz": "amarillo",
    "dueno": "asesor",
    "accion": "Pedir el Excel de llamadas y completar la ficha: hoy no alcanza para opinar",
    "porque": "Sólo 2 de ocho fuentes tienen dato de esta cuenta. Con eso no se puede decir si está bien o mal, y decirlo igual sería inventar. Son $10,000 al mes."
  },
  "sin_auditar · hay datos y falta el análisis": {
    "situacion": "sin_auditar",
    "luz": "amarillo",
    "dueno": "asesor",
    "accion": "Escribir su auditoría con estos hallazgos y agendar para presentárselos",
    "porque": "Hay 2 cosas de su propia operación que el cliente no ve: llamadas que se le están escapando, lo que le hemos resuelto. Nadie ha escrito su análisis, y ese análisis es justo lo que se le lleva a la reunión."
  },
  "hay_que_mostrarle · material de valor sin presentar": {
    "situacion": "hay_que_mostrarle",
    "luz": "azul",
    "dueno": "asesor",
    "accion": "Presentarle los hallazgos de su operación en la próxima reunión",
    "porque": "Hay 2 cosas de su propia operación que el cliente no ve en su día a día: llamadas que se le están escapando, lo que le hemos resuelto."
  },
  "oportunidad · la casa en orden y espacio para crecer": {
    "situacion": "oportunidad",
    "luz": "verde",
    "dueno": "asesor",
    "accion": "Proponer Videollamada, y llevarle sus hallazgos a la misma reunión",
    "porque": "Está medida, auditada, sin ninguna alerta de riesgo abierta, y tiene espacio para crecer. Son $10,000 al mes hoy. Con qué abrir la conversación: llamadas que se le están escapando, lo que le hemos resuelto."
  },
  "en_orden · nada que hacer esta semana": {
    "situacion": "en_orden",
    "luz": "verde",
    "dueno": "asesor",
    "accion": "Nada esta semana",
    "porque": "Consume, se le ha contactado y no tiene ninguna alerta de riesgo abierta. Una cuenta en orden no necesita una tarea inventada."
  }
}

function compara(nombre: string, v: Veredicto): void {
  const esperado = SELLO[nombre]
  if (!esperado) {
    console.log(`  FALTA  ${nombre}`)
    console.log('         no está en el sello. Si el caso es nuevo, séllalo con --sella;')
    console.log('         si desapareció del sello, alguien lo borró.')
    fallos++
    return
  }
  const campos: Array<keyof typeof esperado> = ['situacion', 'luz', 'dueno', 'accion', 'porque']
  const rotos = campos.filter(c => v[c] !== esperado[c])
  if (!rotos.length) { console.log(`  ok     ${nombre}`); return }

  console.log(`  ROTO   ${nombre}`)
  for (const c of rotos) {
    console.log(`         ${c}`)
    console.log(`           sello:  ${JSON.stringify(esperado[c])}`)
    console.log(`           ahora:  ${JSON.stringify(v[c])}`)
  }
  fallos++
}

function main(): void {
  console.log('')
  console.log('  EL SELLO DE LOS TEXTOS DEL MOTOR DE RIESGO')
  console.log('  ' + '='.repeat(72))

  if (sella) {
    const nuevo: Record<string, unknown> = {}
    for (const c of CASOS) {
      const v = veredictoDe(c.e)
      nuevo[c.nombre] = {
        situacion: v.situacion, luz: v.luz, dueno: v.dueno,
        accion: v.accion, porque: v.porque,
      }
    }
    console.log('')
    console.log('  Pega esto como el valor de SELLO (entre las comillas invertidas):')
    console.log('')
    console.log(JSON.stringify(nuevo, null, 2))
    console.log('')
    console.log('  LÉELO ANTES DE PEGARLO. Sellar un texto roto lo vuelve la')
    console.log('  referencia, y a partir de ahí la prueba defiende el error.')
    return
  }

  console.log('')
  for (const c of CASOS) compara(c.nombre, veredictoDe(c.e))

  /* ── Las siete situaciones existen y están selladas ───────────────────────
     Sin esto, borrar un caso del sello dejaría la prueba en verde con menos
     cobertura, que es la forma más silenciosa de perder un candado. */
  const SITUACIONES = ['se_va', 'apagandose', 'no_la_vemos', 'sin_auditar',
                       'hay_que_mostrarle', 'oportunidad', 'en_orden']
  const selladas = new Set(Object.values(SELLO).map(s => s.situacion))
  const sinSellar = SITUACIONES.filter(s => !selladas.has(s as Veredicto['situacion']))
  console.log('')
  if (sinSellar.length) {
    console.log(`  ROTO   situaciones sin un caso sellado: ${sinSellar.join(', ')}`)
    fallos++
  } else {
    console.log(`  ok     las ${SITUACIONES.length} situaciones tienen caso sellado`)
  }

  console.log('')
  if (fallos) {
    console.log(`  *** ${fallos} fallo(s).`)
    console.log('')
    console.log('  Si el cambio de texto es DELIBERADO: vuelve a sellar con --sella,')
    console.log('  lee lo que imprime y pégalo. El diff de este archivo es el')
    console.log('  registro de que alguien lo aprobó.')
    process.exit(1)
  }
  console.log('  Los textos del motor son los sellados.')
}

main()
