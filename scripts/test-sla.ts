/**
 * EL SLA DE ALERTAS, PROBADO AL REVÉS
 * ===================================
 *
 *     npm run test:sla
 *
 * POR QUÉ EXISTE, Y QUÉ NO PRUEBA
 * -------------------------------
 * El encargo trae doce criterios de aceptación. SEIS de ellos no necesitan base
 * de datos —son aritmética de plazos, el semáforo, las validaciones y los
 * topes— y son los que se comprueban aquí. Los otros seis (RLS, que el banner
 * cuadre con un conteo SQL, la inmutabilidad de la bitácora, el no duplicado)
 * sólo se pueden comprobar DESPUÉS de correr la migración en Supabase, y se
 * reportan como no cumplidos hasta entonces. Un verificador que se pusiera
 * verde sobre lo que no midió sería peor que no tenerlo.
 *
 * LAS REGLAS SE PRUEBAN CON LO QUE **NO** DEBE PASAR
 * --------------------------------------------------
 * Comprobar que un resumen de 200 caracteres cierra una alerta no dice nada
 * sobre si uno de tres también la cierra. Así que casi todo lo de aquí son
 * negaciones: la segunda reprogramación BLOQUEADA, el «sin respuesta» que NO
 * cierra, la auditoría que NO sirve de evidencia, el festivo que NO cuenta.
 * [[feedback-probar-al-reves]]
 *
 * LA CONFIGURACIÓN SE LEE DE LA MIGRACIÓN, NO SE TECLEA
 * ----------------------------------------------------
 * Los plazos viven en el INSERT de `sla_config` de
 * `scripts/migracion-alertas-sla.sql`. Este guion los PARSEA de ahí. Si se
 * teclearan aquí, la prueba seguiría verde el día que alguien cambie un plazo
 * en la migración y rompa la monotonía de la escala — que es justo el fallo que
 * no se ve. [[feedback-verificar-antes-asegurar]]
 */
import { readFileSync } from 'fs'
import { join } from 'path'
import { CONDICION, type Condicion, INDICIO_BAJA } from '../lib/alertas'
import {
  esHabil, esFinDeSemana, sumaDiasHabiles, diasHabilesEntre, siguienteHabil,
} from '../lib/dias-habiles'
import {
  plazoDe, plazoPorSeveridad, semaforoDe, ordenaCola, reprograma,
  validaSeguimiento, validaReunion, validaEdicion, validaAuditoria, diffDeCampos,
  efectoDeResultado, limiteDeReintento, escalamientoDe, tocaNotificar, diasDeRetraso,
  frasesDeCierre, accionSugerida, sube, ESCALA_SEVERIDAD, ETIQUETA_NIVEL,
  type FilaConfig, type SeveridadSla, type EvidenciaTipo,
} from '../lib/alertas-sla'

let fallos = 0
function check(ok: boolean, que: string, detalle = '') {
  console.log(`  ${ok ? 'ok   ' : 'FALLA'}  ${que}${ok ? '' : '   — ' + detalle}`)
  if (!ok) fallos++
}
function titulo(t: string) {
  console.log('')
  console.log('  ' + t)
  console.log('  ' + '-'.repeat(74))
}

/* ── LA CONFIGURACIÓN REAL, LEÍDA DE LA MIGRACIÓN ───────────────────────── */

const SQL = readFileSync(
  join(__dirname, '..', 'scripts', 'migracion-alertas-sla.sql'), 'utf8')

/* Las filas de `sla_parametros` son ('clave', 20, 'unidad', …) y las de
   `dias_inhabiles` son ('2026-01-01', 'motivo', 'ley'): ninguna casa con este
   patrón, que exige texto-texto-número-ARRAY. Así el filtro es estructural y no
   depende de recortar el archivo por líneas. */
const CONFIG: FilaConfig[] = Array.from(
  SQL.matchAll(/\(\s*'([a-z_]+)',\s*'(critica|alta|media|baja)',\s*(\d+),\s*ARRAY\[([^\]]*)\]/g),
).map(m => ({
  condicion: m[1] as Condicion,
  severidad_base: m[2] as SeveridadSla,
  plazo_dias: Number(m[3]),
  evidencia: Array.from(m[4].matchAll(/'([a-z]+)'/g)).map(x => x[1]) as EvidenciaTipo[],
  porque: '',
}))

/* El calendario de prueba: los festivos de 2026 que la migración siembra. Se
   leen del mismo archivo, por la misma razón. */
const INHABILES = new Set(
  Array.from(SQL.matchAll(/\(\s*'(\d{4}-\d{2}-\d{2})',\s*'[^']+',\s*'(?:ley|empresa)'\s*\)/g))
    .map(m => m[1]),
)

titulo('0 · LA CONFIGURACIÓN SE LEYÓ DE VERDAD')
check(CONFIG.length >= 7, `se parsearon ${CONFIG.length} filas de sla_config`,
      'si esto falla, todo lo de abajo prueba un objeto vacío')
check(INHABILES.size >= 21, `se parsearon ${INHABILES.size} días inhábiles`)
check(INHABILES.has('2026-11-16'),
      'el 16 nov 2026 (Revolución, LUNES) está en el calendario')

titulo('1 · TODA CONDICIÓN QUE ALERTA TIENE PLAZO')
/* El hueco que nadie vería: una condición que el panel lista y que no tiene
   fila en `sla_config` no genera compromiso — la alerta sale sin fecha y sin
   semáforo, y parece atendida por omisión. */
const condicionesQueAlertan = new Set<Condicion>(
  Array.from(INDICIO_BAJA).map(t => CONDICION[t]),
)
const configuradas = new Set(CONFIG.map(f => f.condicion))
for (const c of Array.from(condicionesQueAlertan).sort()) {
  check(configuradas.has(c), `la condición \`${c}\` tiene plazo configurado`,
        'emite alertas de indicio de baja y no tendría fecha compromiso')
}
for (const f of CONFIG) {
  check(Object.values(CONDICION).includes(f.condicion),
        `\`${f.condicion}\` es una condición real del catálogo`,
        'una condición inventada nunca casaría con ningún episodio')
}

titulo('2 · LA ESCALA DE PLAZOS ES MONÓTONA')
/* Subir de severidad tiene que APRETAR el plazo. Si una fila declarara
   `media` con 1 día, subir de media a alta daría MÁS días y el ajuste por
   cuenta TOP relajaría el compromiso en vez de apretarlo. */
const mapa = plazoPorSeveridad(CONFIG)
console.log('     ' + ESCALA_SEVERIDAD.slice().reverse()
  .map(s => `${s}=${mapa[s] ?? '—'}`).join('  '))
let previo = 0
for (const s of ['critica', 'alta', 'media', 'baja'] as SeveridadSla[]) {
  const v = mapa[s]
  if (v === undefined) continue
  check(v >= previo, `${s} (${v} días) no es más corto que la severidad de arriba`,
        `rompe la monotonía: ${previo} días arriba`)
  previo = v
}
check(sube('alta') === 'critica', 'subir de alta da crítica')
check(sube('critica') === 'critica', 'crítica no sube más (tope de la escala)')

titulo('3 · DÍAS HÁBILES — LOS CASOS DEL ENCARGO')
// viernes 20 nov 2026
check(!esFinDeSemana('2026-11-20'), 'el 20 nov 2026 es viernes (día hábil)')
check(esFinDeSemana('2026-11-21'), 'el 21 nov 2026 es sábado')
check(esFinDeSemana('2026-11-22'), 'el 22 nov 2026 es domingo')
check(sumaDiasHabiles('2026-11-20', 1, INHABILES) === '2026-11-23',
      'generada el VIERNES 20, +1 día hábil → lunes 23',
      sumaDiasHabiles('2026-11-20', 1, INHABILES))
// El festivo: viernes 13 nov + 1 hábil salta el lunes 16 (Revolución) → martes 17
check(sumaDiasHabiles('2026-11-13', 1, INHABILES) === '2026-11-17',
      'generada el viernes 13, +1 → martes 17 (SALTA el festivo del lunes 16)',
      sumaDiasHabiles('2026-11-13', 1, INHABILES))
check(!esHabil('2026-11-16', INHABILES), 'el lunes 16 nov NO es hábil (festivo)')
// Miércoles 25 nov 2026 + 1 → jueves 26
check(sumaDiasHabiles('2026-11-25', 1, INHABILES) === '2026-11-26',
      'generada hoy (miércoles 25), +1 → jueves 26')
check(sumaDiasHabiles('2026-11-25', 2, INHABILES) === '2026-11-27',
      'generada hoy, +2 → viernes 27')
check(sumaDiasHabiles('2026-11-25', 3, INHABILES) === '2026-11-30',
      'generada hoy, +3 → lunes 30 (el fin de semana no cuenta)',
      sumaDiasHabiles('2026-11-25', 3, INHABILES))
check(sumaDiasHabiles('2026-11-25', 5, INHABILES) === '2026-12-02',
      'generada hoy, +5 → miércoles 2 dic',
      sumaDiasHabiles('2026-11-25', 5, INHABILES))
// Navidad 2026 cae viernes: 24 dic (jueves) + 1 hábil salta al lunes 28
check(sumaDiasHabiles('2026-12-24', 1, INHABILES) === '2026-12-28',
      'jueves 24 dic, +1 → lunes 28 (salta Navidad del viernes 25)',
      sumaDiasHabiles('2026-12-24', 1, INHABILES))
// Contar al revés
check(diasHabilesEntre('2026-11-20', '2026-11-23', INHABILES) === 1,
      'del viernes 20 al lunes 23 hay 1 día hábil')
check(diasHabilesEntre('2026-11-13', '2026-11-17', INHABILES) === 1,
      'del viernes 13 al martes 17 hay 1 día hábil (el festivo no cuenta)')
check(diasHabilesEntre('2026-11-25', '2026-11-25', INHABILES) === 0,
      'de un día a sí mismo hay 0 días hábiles')
check(diasHabilesEntre('2026-11-27', '2026-11-25', INHABILES) === 0,
      'hacia atrás devuelve 0, nunca un negativo escondido')
check(siguienteHabil('2026-11-21', INHABILES) === '2026-11-23',
      'el siguiente hábil de un sábado es el lunes')
check(siguienteHabil('2026-11-25', INHABILES) === '2026-11-25',
      'el siguiente hábil de un día hábil es él mismo')

titulo('4 · SEVERIDAD Y AJUSTES')
const base = plazoDe('contacto', { esTop: false, ticketAbierto: false }, CONFIG)
check(base.severidad === 'alta' && base.dias === 3,
      'contacto sin ajustes: alta, 3 días hábiles', `${base.severidad}/${base.dias}`)
const top = plazoDe('contacto', { esTop: true, ticketAbierto: false }, CONFIG)
check(top.severidad === 'critica' && top.dias === 1,
      'contacto en cuenta TOP: sube a crítica y 1 día', `${top.severidad}/${top.dias}`)
check(top.ajustes.includes('top_cartera'), 'el ajuste queda DICHO, no sólo aplicado')
const dos = plazoDe('ficha', { esTop: true, ticketAbierto: true }, CONFIG)
check(dos.severidad === 'critica',
      'ficha (media) con dos ajustes sube dos niveles a crítica', dos.severidad)
check(dos.dias >= 1, 'el plazo nunca baja de 1 día hábil', String(dos.dias))
const critTop = plazoDe('escrito', { esTop: true, ticketAbierto: true }, CONFIG)
check(critTop.dias === 1,
      'una crítica con dos ajustes sigue en 1 día: no hay plazo de cero', String(critTop.dias))
const sinFila = plazoDe('medicion', { esTop: false, ticketAbierto: false }, CONFIG)
check(sinFila.sinConfigurar,
      'una condición sin fila se declara SIN CONFIGURAR, no se le inventa plazo')

titulo('5 · EL SEMÁFORO, SIMULANDO FECHAS')
const sem = (limite: string, hoy: string, severidad: SeveridadSla = 'alta',
             estado: 'nueva' | 'cerrada' | 'bloqueada' = 'nueva',
             atendida: string | null = null) =>
  semaforoDe({ estado, severidad, fechaLimite: limite, fechaAtendida: atendida },
             hoy, INHABILES)

// Límite: viernes 4 dic 2026. Se recorre el calendario hacia él.
check(sem('2026-12-04', '2026-11-25').nivel === 'verde',
      'a 7 días hábiles → verde', sem('2026-12-04', '2026-11-25').nivel)
check(sem('2026-12-04', '2026-12-02').nivel === 'amarillo',
      'a 2 días hábiles → amarillo', sem('2026-12-04', '2026-12-02').nivel)
check(sem('2026-12-04', '2026-12-03').nivel === 'amarillo',
      'a 1 día hábil → amarillo', sem('2026-12-04', '2026-12-03').nivel)
check(sem('2026-12-04', '2026-12-04').nivel === 'naranja',
      'el mismo día → naranja «Vence hoy»', sem('2026-12-04', '2026-12-04').nivel)
check(/^Vence HOY, /.test(sem('2026-12-04', '2026-12-04').etiqueta),
      'y la etiqueta lo DICE: el color nunca es el único indicador',
      sem('2026-12-04', '2026-12-04').etiqueta)
/* Y NO PUEDE SER LA FRASE PELADA DEL NIVEL. El correo y la pastilla ya pintan
   `ETIQUETA_NIVEL[nivel]` encima; si la etiqueta fuera idéntica, naranja sería
   el único nivel que gasta su segunda línea repitiendo la primera en vez de
   decir cuándo vence. Aquí decía `=== 'Vence hoy'` y pasaba en verde: la
   prueba fijaba justo el defecto. Se vio MIRANDO el correo renderizado. */
check(sem('2026-12-04', '2026-12-04').etiqueta !== ETIQUETA_NIVEL.naranja,
      'y NO repite la frase del nivel: la segunda línea dice CUÁNDO',
      sem('2026-12-04', '2026-12-04').etiqueta)
check(sem('2026-12-04', '2026-12-04').etiqueta.includes('4 dic 2026'),
      'con la fecha en palabras, como los demás niveles',
      sem('2026-12-04', '2026-12-04').etiqueta)
check(sem('2026-12-04', '2026-12-07').nivel === 'rojo',
      'vencida 1 día hábil (lunes 7) → rojo', sem('2026-12-04', '2026-12-07').nivel)
check(sem('2026-12-04', '2026-12-08').nivel === 'rojo',
      'vencida 2 días hábiles → rojo', sem('2026-12-04', '2026-12-08').nivel)
check(sem('2026-12-04', '2026-12-09').nivel === 'rojo_intenso',
      'vencida 3 días hábiles → ROJO INTENSO', sem('2026-12-04', '2026-12-09').nivel)
check(sem('2026-12-04', '2026-12-09').fijada,
      'el rojo intenso se FIJA arriba: no se puede ocultar ni compactar')
check(/Vencida hace 3 días hábiles/.test(sem('2026-12-04', '2026-12-09').etiqueta),
      'y lleva el contador en palabras', sem('2026-12-04', '2026-12-09').etiqueta)

// La otra vía al rojo intenso: cualquier crítica vencida, sin esperar 3 días.
check(sem('2026-12-04', '2026-12-07', 'critica').nivel === 'rojo_intenso',
      'una CRÍTICA vencida 1 día ya es rojo intenso',
      sem('2026-12-04', '2026-12-07', 'critica').nivel)
check(sem('2026-12-04', '2026-12-03', 'critica').nivel === 'amarillo',
      'pero una crítica EN TIEMPO no es rojo intenso: la vía es estar vencida')

// Fin de semana: el sábado una alerta que venció el viernes ya está vencida
// aunque no haya transcurrido ningún día hábil.
const sabado = sem('2026-12-04', '2026-12-05')
check(sabado.vencida && sabado.habiles === 0,
      'vencida el viernes, mirada el sábado: vencida con 0 días hábiles',
      `${sabado.nivel}/${sabado.habiles}`)
check(/Vencida el /.test(sabado.etiqueta),
      'y se dice con la FECHA, no con un «hace 0 días»', sabado.etiqueta)

// Atendida, cerrada, bloqueada
check(sem('2026-12-04', '2026-12-09', 'alta', 'nueva', '2026-12-03').enTiempo === true,
      'atendida antes del límite → en tiempo, aunque hoy sea después')
check(sem('2026-12-04', '2026-12-09', 'alta', 'nueva', '2026-12-08').enTiempo === false,
      'atendida después del límite → fuera de plazo')
check(sem('2026-12-04', '2026-12-09', 'alta', 'cerrada').nivel === 'cerrada',
      'cerrada no tiene semáforo de vencimiento')
check(sem('2026-12-04', '2026-12-09', 'critica', 'bloqueada').nivel === 'bloqueada',
      'BLOQUEADA no corre contra el ejecutivo ni siendo crítica y vencida',
      'un reloj sobre trabajo de Ingeniería es cómo se entrena a no mirar el tablero')

/* Las DOS maneras de estar cerrada no dicen lo mismo, y la etiqueta lo
   distingue: una alerta que se apagó sola no es trabajo hecho. */
check(/^Cerrada el /.test(sem('2026-12-04', '2026-12-09', 'alta', 'cerrada', '2026-12-03').etiqueta),
      'cerrada CON atención registrada: lo dice con la fecha',
      sem('2026-12-04', '2026-12-09', 'alta', 'cerrada', '2026-12-03').etiqueta)
check(/dejó de verse/.test(sem('2026-12-04', '2026-12-09', 'alta', 'cerrada').etiqueta),
      'cerrada SIN atención: se dice que se apagó sola, no se calla',
      sem('2026-12-04', '2026-12-09', 'alta', 'cerrada').etiqueta)

/* ── NINGÚN NIVEL REPITE LA FRASE DE SU PASTILLA ─────────────────────────────
 *
 * El color nunca va solo: la pastilla pinta `ETIQUETA_NIVEL[nivel]` y debajo va
 * `semaforo.etiqueta`. Si las dos dicen lo mismo, ese nivel desperdicia la
 * única línea que puede decir CUÁNDO —y nadie se entera, porque no falla nada
 * ni baja ningún contraste—. Pasaba en DOS de los ocho: `naranja` («Vence hoy»
 * dos veces) y `cerrada` («Cerrada» dos veces). Se vio generando el correo con
 * `scripts/repro-aviso-sla.mjs` y MIRÁNDOLO. [[feedback-verificar-antes-asegurar]]
 *
 * Esto barre los ocho para que no vuelva por otro. */
const MUESTRA_NIVELES: Array<[string, ReturnType<typeof sem>]> = [
  ['verde',        sem('2026-12-30', '2026-11-25')],
  ['amarillo',     sem('2026-12-04', '2026-12-03')],
  ['naranja',      sem('2026-12-04', '2026-12-04')],
  ['rojo',         sem('2026-12-04', '2026-12-07')],
  ['rojo_intenso', sem('2026-12-04', '2026-12-09')],
  ['atendida',     sem('2026-12-04', '2026-12-09', 'alta', 'nueva', '2026-12-03')],
  ['cerrada',      sem('2026-12-04', '2026-12-09', 'alta', 'cerrada')],
  ['bloqueada',    sem('2026-12-04', '2026-12-09', 'alta', 'bloqueada')],
]
check(MUESTRA_NIVELES.length === Object.keys(ETIQUETA_NIVEL).length,
      `la muestra cubre los ${Object.keys(ETIQUETA_NIVEL).length} niveles, no un subconjunto`,
      `${MUESTRA_NIVELES.length} muestras`)
for (const [esperado, s] of MUESTRA_NIVELES) {
  check(s.nivel === esperado, `muestra de ${esperado}: el caso da ese nivel`, s.nivel)
  check(s.etiqueta.trim() !== ETIQUETA_NIVEL[s.nivel].trim(),
        `${esperado}: la etiqueta NO repite «${ETIQUETA_NIVEL[s.nivel]}»`, s.etiqueta)
  check(s.etiqueta.trim().length > 0,
        `${esperado}: y nunca va vacía — el color jamás es el único indicador`)
}

titulo('6 · EL ORDEN DE LA COLA ES OBLIGATORIO')
const cola = ordenaCola([
  { id: 'verde-caro',    semaforo: sem('2026-12-30', '2026-11-25'), mrr: 300_000 },
  { id: 'rojo-barato',   semaforo: sem('2026-11-20', '2026-11-24'), mrr: 1_000 },
  { id: 'intenso',       semaforo: sem('2026-11-16', '2026-11-25'), mrr: 500 },
  { id: 'naranja',       semaforo: sem('2026-11-25', '2026-11-25'), mrr: 10_000 },
  { id: 'rojo-caro',     semaforo: sem('2026-11-20', '2026-11-24'), mrr: 90_000 },
])
console.log('     ' + cola.map(x => x.id).join(' → '))
check(cola[0].id === 'intenso', 'el rojo intenso va primero aunque sea el más barato')
check(cola[1].id === 'rojo-caro' && cola[2].id === 'rojo-barato',
      'dentro del rojo manda el dinero, descendente')
check(cola[cola.length - 1].id === 'verde-caro',
      'el verde va último aunque sea la cuenta más grande')

titulo('7 · REPROGRAMAR: LA SEGUNDA LA BLOQUEA EL SISTEMA')
const motivoBueno = 'El contacto está de vacaciones hasta el lunes y no hay suplente'
const r1 = reprograma(
  { reprogramaciones: 0, motivo: motivoBueno, limiteActual: '2026-11-27', esAdmin: false },
  '2026-11-25', INHABILES)
check(r1.ok && r1.nuevoLimite === '2026-12-01',
      'primera reprogramación: +2 días hábiles desde el límite',
      r1.ok ? r1.nuevoLimite : r1.porque)
const r2 = reprograma(
  { reprogramaciones: 1, motivo: motivoBueno, limiteActual: '2026-12-01', esAdmin: false },
  '2026-11-25', INHABILES)
check(!r2.ok, 'SEGUNDA reprogramación del asesor: BLOQUEADA',
      'es el criterio 8 del encargo')
const r2admin = reprograma(
  { reprogramaciones: 1, motivo: motivoBueno, limiteActual: '2026-12-01', esAdmin: true },
  '2026-11-25', INHABILES)
check(r2admin.ok, 'la segunda SÍ la autoriza administración (la escotilla)')
const r3 = reprograma(
  { reprogramaciones: 2, motivo: motivoBueno, limiteActual: '2026-12-01', esAdmin: true },
  '2026-11-25', INHABILES)
check(!r3.ok, 'no hay una tercera, ni para administración')
const rCorto = reprograma(
  { reprogramaciones: 0, motivo: 'no pude', limiteActual: '2026-11-27', esAdmin: false },
  '2026-11-25', INHABILES)
check(!rCorto.ok, 'un motivo de 7 caracteres NO alcanza (mínimo 20)')
// Reprogramar una vencida no da más margen que reprogramarla a tiempo.
const rVencida = reprograma(
  { reprogramaciones: 0, motivo: motivoBueno, limiteActual: '2026-11-16', esAdmin: false },
  '2026-11-25', INHABILES)
check(rVencida.ok && rVencida.nuevoLimite < '2026-11-25',
      'reprogramar una vencida cuenta desde SU límite, no desde hoy: no premia el retraso',
      rVencida.ok ? rVencida.nuevoLimite : rVencida.porque)

titulo('8 · LA EVIDENCIA SE VALIDA CON LO QUE NO DEBE PASAR')
const CANALES = new Set(['llamada', 'whatsapp', 'email', 'reunion'])
const bueno = {
  tipo: 'llamada',
  contacto_nombre: 'Laura Mendoza', contacto_puesto: 'Gerente de operaciones',
  descripcion: 'Se llamó al contacto principal para entender la caída de consumo '
             + 'del 38%. Confirmó que cerraron dos sucursales en octubre y que el '
             + 'volumen no vuelve. Se propone ajustar el plan.',
  resultado: 'exitoso',
  proximo_paso: 'Enviar propuesta de plan a la medida', proximo_paso_fecha: '2026-11-27',
}
check(validaSeguimiento(bueno, CANALES).ok, 'un seguimiento completo SÍ cierra')
check(!validaSeguimiento({ ...bueno, descripcion: 'ok, ya quedó' }, CANALES).ok,
      'un resumen de 11 caracteres NO cierra (mínimo 80)')
check(!validaSeguimiento({ ...bueno, contacto_nombre: '' }, CANALES).ok,
      'sin el nombre de con quién se habló NO cierra')
check(!validaSeguimiento({ ...bueno, contacto_puesto: '  ' }, CANALES).ok,
      'sin el puesto NO cierra (un espacio no es un puesto)')
check(!validaSeguimiento({ ...bueno, tipo: 'nota' }, CANALES).ok,
      'una NOTA INTERNA no cierra: escribir sobre la cuenta no es haber hablado con ella')
check(!validaSeguimiento({ ...bueno, resultado: 'pendiente' }, CANALES).ok,
      '«pendiente» no es un resultado: es el valor con el que nace')
check(!validaSeguimiento({ ...bueno, proximo_paso: '' }, CANALES).ok,
      'sin próximo paso NO cierra')
check(!validaSeguimiento({ ...bueno, proximo_paso_fecha: 'la próxima semana' }, CANALES).ok,
      'un próximo paso sin FECHA real NO cierra')
const faltan = validaSeguimiento({ tipo: 'nota' }, CANALES).faltan
check(faltan.length >= 6, `se dicen TODAS las faltas (${faltan.length}), no la primera`,
      'un formulario que pide una cosa por intento se abandona')

const minuta = 'Se revisó con el cliente la pérdida de llamadas por destino. '
             + 'Se acordó depurar las extensiones muertas antes del cierre de mes '
             + 'y volver a medir en el corte siguiente. Responsable: Laura Mendoza.'
check(validaReunion({ fecha: '2026-11-25', participantes: 'Laura Mendoza, Erick',
                      resumen: minuta, acuerdos: 'Depurar extensiones muertas',
                      proximos_pasos: 'Medir en el corte de diciembre' }).ok,
      'una reunión con minuta, asistentes, acuerdos y próximos pasos SÍ cierra')
check(!validaReunion({ fecha: '2026-11-25', participantes: 'Laura',
                       resumen: 'Se habló de la cuenta.', acuerdos: 'varios',
                       proximos_pasos: 'seguir' }).ok,
      'una minuta de 23 caracteres NO cierra (mínimo 120)')
check(!validaReunion({ fecha: '2026-11-25', participantes: '', resumen: minuta,
                       acuerdos: 'x', proximos_pasos: 'y' }).ok,
      'una reunión sin asistentes NO cierra')

check(validaEdicion({ giro: { antes: null, despues: 'Salud' } }).ok,
      'una edición que cambia un campo SÍ cierra')
check(!validaEdicion({}).ok,
      'EDITAR SIN CAMBIAR NADA no cierra — es el criterio del encargo')
check(!validaEdicion(null).ok, 'un diff nulo no cierra')

/* EL DIFF ES LO QUE HACE QUE ESO SEA VERDAD, y por eso se prueba aparte: con un
   `Object.keys(body)` el formulario de la ficha —que manda la fila entera—
   reportaría treinta campos cambiados en cada guardado y toda edición cerraría
   cualquier alerta. Las cuatro pruebas de abajo son las cuatro falsas
   ediciones que eso producía. */
const ficha = {
  nombre: 'AGUA INMACULADA', giro: null, mrr: 23480,
  ultimo_contacto: '2026-11-20T00:00:00+00:00', notas: '',
}
check(Object.keys(diffDeCampos(ficha, { ...ficha })).length === 0,
      'guardar la ficha SIN TOCAR NADA da un diff vacío',
      'el formulario manda la fila entera: sin normalizar, todo campo «cambia»')
check(Object.keys(diffDeCampos(ficha, { giro: '' })).length === 0,
      'NULL en la base y `\'\'` en un input vacío son el MISMO valor')
check(Object.keys(diffDeCampos(ficha, { mrr: '23480' })).length === 0,
      '«23480» de un input numérico no es un cambio frente a 23480')
check(Object.keys(diffDeCampos(ficha, { ultimo_contacto: '2026-11-20' })).length === 0,
      'una fecha con hora de Supabase no cambia contra la misma fecha sin hora')
const d1 = diffDeCampos(ficha, { giro: 'Salud', mrr: 23480 })
check(Object.keys(d1).length === 1 && 'giro' in d1,
      'y un cambio REAL sí aparece, sólo él',
      `diff: ${JSON.stringify(d1)}`)
check(d1.giro.antes === null && d1.giro.despues === 'Salud',
      'el asiento guarda el antes Y el después, que es lo que se le enseña a quien pregunte')
check(Object.keys(diffDeCampos(ficha, {})).length === 0,
      'lo que el cuerpo NO trae no se tocó: no entra como «cambió a vacío»')
check(!validaAuditoria().ok,
      'la AUDITORÍA no puede cerrar hoy: los expedientes viven en código, no en una tabla',
      'devolver ok aquí sería un verificador que concluye éxito por defecto')

/* ── EL RETRASO SE CUENTA EN HÁBILES, igual que el plazo ─────────────────── */
check(diasDeRetraso('2026-11-20', '2026-11-23', INHABILES) === 1,
      'vencía el viernes 20 y se atendió el lunes 23: UN día hábil tarde, no tres',
      'contar el retraso en días de calendario acusa al equipo por el fin de semana')
check(diasDeRetraso('2026-11-20', '2026-11-20', INHABILES) === 0,
      'atendida el mismo día del plazo: cero retraso')
check(diasDeRetraso('2026-11-20', '2026-11-18', INHABILES) === 0,
      'atendida ANTES del plazo: cero, nunca un negativo escondido')
check(diasDeRetraso('2026-11-13', '2026-11-17', INHABILES) === 1,
      'vencía el viernes 13 y se atendió el martes 17: UN día hábil tarde',
      'son cuatro de calendario, pero el 14 y el 15 son fin de semana y el 16 '
    + 'es festivo — el mismo calendario que calcula el plazo calcula el '
    + 'incumplimiento, o el tablero acusa por los días que no se trabajó')

titulo('9 · «SIN RESPUESTA» NO CIERRA')
check(efectoDeResultado('sin_respuesta') === 'reintento',
      'sin_respuesta → reintento, la alerta SIGUE ABIERTA',
      'el caso Biolaboratorio Sadat: 4 intentos fallidos y la baja 73 días después')
check(efectoDeResultado('exitoso') === 'cierra', 'exitoso → cierra')
check(efectoDeResultado('riesgo_confirmado') === 'riesgo_confirmado',
      'riesgo confirmado → cierra ésta y la capa cualitativa abre la crítica')
check(efectoDeResultado('cancelacion_confirmada') === 'riesgo_confirmado',
      'la cancelación confirmada del formato oficial entra por la misma puerta')
check(limiteDeReintento('2026-11-25', INHABILES) === '2026-11-26',
      'el reintento es a 1 día hábil')
check(limiteDeReintento('2026-11-20', INHABILES) === '2026-11-23',
      'y también salta el fin de semana')

titulo('10 · ESCALAMIENTO Y NOTIFICACIONES')
/* `escalamientoDe` recibe SÓLO el semáforo, y el primer intento de esta prueba
   es la razón: le pasaba un semáforo calculado con severidad `alta` y una
   severidad `critica` suelta, y la función contestaba nivel 2 sobre lo que el
   encargo manda al 3. El dato tenía dos puertas y se descuadraron. Ahora la
   severidad entra UNA vez, al calcular el semáforo. */
check(escalamientoDe(sem('2026-12-04', '2026-12-04')).nivel === 1,
      'vence hoy → nivel 1 (al ejecutivo)')
check(escalamientoDe(sem('2026-12-04', '2026-12-07')).nivel === 2,
      'vencida 1 día → nivel 2 (ejecutivo y administración)')
check(escalamientoDe(sem('2026-12-04', '2026-12-09')).nivel === 3,
      'vencida 3 días → nivel 3 (tablero de incumplimientos)')
check(escalamientoDe(sem('2026-12-04', '2026-12-07', 'critica')).nivel === 3,
      'una crítica vencida UN día va directo al nivel 3')
check(/crítica vencida/.test(escalamientoDe(sem('2026-12-04', '2026-12-07', 'critica')).porque),
      'y el motivo dice por qué llegó ahí sin esperar tres días',
      escalamientoDe(sem('2026-12-04', '2026-12-07', 'critica')).porque)
check(escalamientoDe(sem('2026-12-04', '2026-11-25')).nivel === 0,
      'en tiempo no escala')
check(escalamientoDe(sem('2026-12-04', '2026-12-09', 'critica', 'bloqueada')).nivel === 0,
      'una BLOQUEADA no escala contra el ejecutivo')
check(!tocaNotificar(2, '2026-11-25', '2026-11-25'),
      'no se notifica dos veces el mismo día')
check(tocaNotificar(2, '2026-11-24', '2026-11-25'),
      'sí se notifica al día siguiente, aunque el nivel no haya subido')
check(!tocaNotificar(0, null, '2026-11-25'), 'nivel 0 no notifica')

titulo('11 · LAS DOS FRASES DEL CIERRE VAN JUNTAS')
const fr = frasesDeCierre('consumo', ['seguimiento'])
console.log('     atención: ' + fr.atencion)
console.log('     alerta:   ' + fr.alerta)
check(/NO apaga la alerta/.test(fr.alerta),
      'la pantalla dice que la evidencia NO apaga la alerta')
check(/vuelva a usar el servicio/.test(fr.alerta),
      'y dice QUÉ la apaga, con la frase de lib/alertas-movimiento.ts',
      'si se teclea aparte, las dos definiciones se separan sin que falle nada')
const frFact = frasesDeCierre('facturacion', ['seguimiento', 'reunion'])
check(/corte del GRC/.test(frFact.alerta),
      'facturación: la apaga el corte siguiente del GRC, no una conversación')
const acc = accionSugerida('silencio_60', '2026-11-27', ['seguimiento'])
check(/Antes del/.test(acc) && /próximo paso con fecha/.test(acc),
      'la acción sugerida lleva fecha y resultado esperado, no «dar seguimiento»')
console.log('     ' + acc)

console.log('')
console.log('  ' + '='.repeat(74))
if (fallos === 0) {
  console.log(`  TODO EN VERDE — ${CONFIG.length} condiciones configuradas, `
            + `${INHABILES.size} días inhábiles.`)
  console.log('')
  console.log('  LO QUE ESTO **NO** PRUEBA, y hay que decirlo: nada que necesite la')
  console.log('  base. Esta batería corre sobre funciones puras y NO SE CONECTA, así')
  console.log('  que no sabe —ni puede decir— si la migración está aplicada: los')
  console.log('  criterios de RLS, el banner contra un conteo SQL, la inmutabilidad')
  console.log('  de la bitácora y el no duplicado se comprueban aparte, con')
  console.log('  `verifica-sla-rest.py` y los dos .sql del editor.')
} else {
  console.log(`  ${fallos} FALLA(S).`)
}
console.log('')
process.exit(fallos === 0 ? 0 : 1)
