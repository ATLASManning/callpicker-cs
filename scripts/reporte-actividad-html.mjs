/**
 * ARMA EL HTML del reporte de actividad a partir del JSON que mide
 * `scripts/reporte-actividad-usuario.mjs`. Solo lectura sobre el JSON.
 *
 * NINGUNA CIFRA SE TECLEA AQUÍ. Todas salen del JSON, incluidas las de las
 * sugerencias del final: una recomendación con un número escrito a mano deja de
 * ser un hallazgo y pasa a ser una opinión con cara de dato.
 * [[feedback-verificar-antes-asegurar]]
 *
 * LO QUE EL REPORTE DECLARA COMO NO MEDIBLE, EN VEZ DE DIBUJAR UN CERO
 *   · `reuniones` no guarda autor -> no se atribuyen a nadie.
 *   · la duración de una visita la manda el navegador y es TIEMPO DE PESTAÑA
 *     ABIERTA, no tiempo de trabajo. Se publica con ese nombre.
 *   · las cuentas sin ningún contacto registrado NO son «contactadas hace
 *     mucho»: son no medibles, y van en su propio bloque.
 *   · los días anteriores al primer registro de `uso_dashboard` se marcan
 *     como sin medición, no como días sin entrar. [[feedback-cero-sin-medicion]]
 *
 * GRÁFICAS: una sola serie por gráfica (azul), magnitud en barras, con tabla
 * equivalente debajo. El estado NUNCA lo lleva solo el color: va punto + texto.
 *
 * USO
 *     node scripts/reporte-actividad-html.mjs <ruta-del-json> [--salida <archivo.html>]
 */
import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const ENTRADA = args.find(a => !a.startsWith('--'))
const iSal = args.indexOf('--salida')
if (!ENTRADA || !fs.existsSync(ENTRADA)) {
  console.log('\n  Falta el JSON medido (o no existe).')
  console.log('  node scripts/reporte-actividad-html.mjs <ruta-del-json> [--salida x.html]\n')
  process.exit(2)
}
const D = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'))

const SALIDA = iSal >= 0 && args[iSal + 1]
  ? args[iSal + 1]
  : path.join('D:', 'Archivos', 'reportes',
      `actividad-${D.correo.split('@')[0]}-${D.ventana.hasta}.html`)

/* ── utilidades ─────────────────────────────────────────────────────────── */
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
const pesos = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-MX')
const miles = n => Number(n || 0).toLocaleString('es-MX')
const DIAS_SEM = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
/** Día de la semana SIN pasar por zonas: la fecha ya viene anclada a México. */
function diaSemana(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}
const esFinDeSemana = iso => [0, 6].includes(diaSemana(iso))
/**
 * UN IMPORTE SIN SU ORIGEN NO ES UN IMPORTE.
 *
 * `importeDeCuenta` tiene tres orígenes y NO valen lo mismo:
 *   · `grc`      — el MRR institucional. Es el bueno.
 *   · `cuentas`  — la columna `facturacion` guardada en la ficha. Es un
 *                  respaldo: se usa cuando el GRC ya no trae la cuenta (porque
 *                  se fue), y NO es la cifra institucional.
 *   · `sin_dato` — no hay importe en ninguna fuente. Eso es NO MEDIBLE y se
 *                  escribe con palabras, nunca como «$0». [[feedback-cero-sin-medicion]]
 *
 * Pintar los tres iguales mezcla la cifra institucional con un respaldo y con
 * una ausencia, que es justo lo que no debe pasar. [[feedback-fuente-unica-cuentas]]
 */
function importeTxt(x) {
  if (!x || x.origenMrr === 'sin_dato') return '<span class="nomed">sin medir</span>'
  if (x.origenMrr === 'cuentas') {
    return `${pesos(x.mrr)} <span class="chip ficha" title="De la columna guardada en la ficha, `
      + `no del GRC: la cuenta ya no aparece en el export institucional.">ficha</span>`
  }
  return pesos(x.mrr)
}
/** La misma marca, en texto plano: las sugerencias no llevan HTML. */
function importePlano(x) {
  if (!x || x.origenMrr === 'sin_dato') return 'sin importe medible'
  if (x.origenMrr === 'cuentas') return `${pesos(x.mrr)} (de la ficha, no del GRC)`
  return pesos(x.mrr)
}
function duracion(seg) {
  if (seg === null || seg === undefined || !Number.isFinite(seg)) return '—'
  if (seg < 60) return `${Math.round(seg)}s`
  if (seg < 3600) return `${Math.round(seg / 60)}m`
  const h = Math.floor(seg / 3600), m = Math.round((seg % 3600) / 60)
  return `${h}h ${String(m).padStart(2, '0')}m`
}

/* ── la rejilla de días de la ventana, con los ceros explicados ─────────── */
const dias = []
{
  const [y, m, d] = D.ventana.desde.split('-').map(Number)
  const cur = new Date(Date.UTC(y, m - 1, d))
  const fin = D.ventana.hasta
  for (let i = 0; i < 60; i++) {
    const iso = cur.toISOString().slice(0, 10)
    const n = D.navegacion.porDia[iso] ?? 0
    dias.push({
      iso, n,
      finDeSemana: esFinDeSemana(iso),
      /* Antes del primer registro de la tabla no hay medición: ese día no es
         un cero, es un hueco. */
      medible: !D.ventana.usoEmpiezaEl || iso >= D.ventana.usoEmpiezaEl,
    })
    if (iso >= fin) break
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
}
const maxDia = Math.max(1, ...dias.map(d => d.n))

/* horas: sólo la franja con dato, pero sin inventar los extremos */
const horasConDato = Object.keys(D.navegacion.porHora).map(Number).sort((a, b) => a - b)
const hIni = horasConDato.length ? Math.min(...horasConDato) : 0
const hFin = horasConDato.length ? Math.max(...horasConDato) : 23
const horas = []
for (let h = hIni; h <= hFin; h++) horas.push({ h, n: D.navegacion.porHora[h] ?? 0 })
const maxHora = Math.max(1, ...horas.map(x => x.n))

/* alertas por tipo, contadas sobre SUS cuentas */
const tiposAlerta = {}
for (const r of D.riesgo) for (const a of r.alertas) {
  tiposAlerta[a.tipo] = (tiposAlerta[a.tipo] ?? 0) + 1
}
const alertasOrden = Object.entries(tiposAlerta).sort((a, b) => b[1] - a[1])
const maxAlerta = Math.max(1, ...alertasOrden.map(x => x[1]))

/* estados de la cartera, como magnitud + punto de estado */
const ESTADO_COLOR = {
  activo: 'var(--st-good)', en_riesgo: 'var(--st-warning)',
  hibernacion: 'var(--st-serious)', cancelado: 'var(--st-critical)',
}
const estados = Object.entries(D.cartera.porEstado).sort((a, b) => b[1] - a[1])
const maxEstado = Math.max(1, ...estados.map(x => x[1]))

/* Desglose del MRR por origen: la cifra institucional y el respaldo de la
   ficha no se suman a ciegas en un solo número grande. */
const mrrDeGrc = D.cartera.cuentas.filter(c => c.origenMrr === 'grc')
  .reduce((s, c) => s + c.mrr, 0)
const mrrDeFicha = D.cartera.cuentas.filter(c => c.origenMrr === 'cuentas')
  .reduce((s, c) => s + c.mrr, 0)

/* ── CHURN ──────────────────────────────────────────────────────────────── */
const CH = D.churn ?? { cuentas: [], perdidoGrc: 0, solicitudes: [], control: {} }
const chSinImporteGrc = CH.cuentas.filter(c => !c.perdidoGrc)
const chUltimoMrr = chSinImporteGrc.filter(c => c.origenMrr !== 'sin_dato')
  .reduce((s, c) => s + c.mrr, 0)
const porDireccion = CH.cuentas.filter(c => c.puertas.includes('DIRECCIÓN'))

/* ── SUGERENCIAS: se CALCULAN, no se escriben ───────────────────────────── */
const sug = []

/* UNA CUENTA APAGADA NO ES UN PENDIENTE. Hibernación y cancelado ya salieron
   de la operación —D7 Jason de México y D22 KOMBITEC entraron a Dormidas esta
   misma semana por churn confirmado por dirección—, así que mandarlo a
   «reactivarlas» sería pedirle trabajo sobre una baja ya consumada. Las tablas
   de arriba SÍ las muestran, con su estado a la vista; lo que se filtra aquí
   es la recomendación, no el dato. [[churn-confirmado-direccion]] */
const APAGADA = new Set(['hibernacion', 'cancelado'])
const estadoDe = new Map(D.cartera.cuentas.map(c => [c.consecutivo, c.estado]))
const viva = x => !APAGADA.has(estadoDe.get(x.consecutivo) ?? x.estado ?? '')
const apagadasEnLista = lista => lista.filter(x => !viva(x))
const carteraTotal = D.cartera.total
const consultadas = D.navegacion.porCuenta.length
const capturasTotal = D.capturas.seguimientos.length + D.capturas.actividades.length
  + D.capturas.anexos.length
const cuentasTocadas = new Set([
  ...D.navegacion.porCuenta.map(c => c.consecutivo),
  ...D.capturas.seguimientos.map(s => s.cuenta.split(' ')[0]),
  ...D.capturas.actividades.map(a => a.cuenta.split(' ')[0]),
])

/* 1 · concentración de la semana */
const cuentasVivas = D.cartera.cuentas.filter(viva)
const apagadas = carteraTotal - cuentasVivas.length
const vivasSinTocar = cuentasVivas.filter(c => !cuentasTocadas.has(c.consecutivo)).length
if (consultadas > 0 && carteraTotal > 0) {
  const pct = Math.round((consultadas / carteraTotal) * 100)
  const top = D.navegacion.porCuenta[0]
  const pctTop = Math.round((top.visitas / D.navegacion.visitas) * 100)
  sug.push({
    titulo: `Repartir la semana: abrió ${consultadas} de sus ${carteraTotal} cuentas (${pct}%)`,
    prioridad: 'alta',
    porque: `En la ventana consultó ${consultadas} cuentas distintas de ${carteraTotal} `
      + `(${pct}%), y ${pctTop}% de sus ${D.navegacion.visitas} visitas fueron a una sola: `
      + `${top.consecutivo} ${top.empresa}. Las ${capturasTotal} capturas del periodo son todas `
      + `de esa misma cuenta.`,
    accion: `Atender ${top.consecutivo} está bien; el problema es que las otras `
      + `${vivasSinTocar} cuentas VIVAS de su cartera no aparecen en ningún registro `
      + `de la semana (las ${apagadas} apagadas no cuentan).`,
  })
}

/* 2 · la cuenta de mayor MRR con alertas abiertas */
const mayor = [...D.riesgo].filter(viva).sort((a, b) => b.mrr - a.mrr)[0]
if (mayor) {
  sug.push({
    titulo: `Primero ${mayor.consecutivo} ${mayor.empresa}: es su mayor exposición`,
    prioridad: 'alta',
    porque: `${importePlano(mayor)} de MRR${mayor.top ? ', cuenta TOP' : ''}, Health Score `
      + `${mayor.hs ?? '—'}, y ${mayor.alertas.length} alerta(s) abierta(s): `
      + mayor.alertas.map(a => a.tipo).join(', ') + '.'
      + (cuentasTocadas.has(mayor.consecutivo)
        ? ' La consultó en la ventana.'
        : ' NO la consultó ni capturó nada en la ventana.'),
    accion: 'Es la cuenta donde una semana sin movimiento cuesta más dinero.',
  })
}

/* 3 · sin contacto por encima del corte — sólo las que siguen vivas */
{
  const p = D.sinContacto.pasados.filter(viva)
  const apagadas = apagadasEnLista(D.sinContacto.pasados)
  if (p.length) {
    const peor = p[0]
    const mrrP = p.filter(x => x.origenMrr !== 'sin_dato').reduce((s, x) => s + x.mrr, 0)
    const sinMedir = p.filter(x => x.origenMrr === 'sin_dato').length
    const tops = p.filter(x => x.top)
    sug.push({
      titulo: `Reactivar las ${p.length} cuentas vivas con más de ${D.sinContacto.corte} días sin contacto`,
      prioridad: 'alta',
      porque: `La más vieja es ${peor.consecutivo} ${peor.empresa}, ${peor.dias} días `
        + `(último contacto ${peor.ultimoContacto}). Entre las ${p.length} suman ${pesos(mrrP)} `
        + `de MRR medible (GRC y ficha mezclados: el desglose está en la tabla)`
        + (sinMedir ? `, y ${sinMedir} no tienen importe medible` : '')
        + (tops.length ? `. Hay ${tops.length} TOP en la lista: `
            + tops.map(x => `${x.consecutivo} ${x.empresa} (${x.dias} d)`).join(', ') + '.' : '.')
        + (apagadas.length ? ` Otras ${apagadas.length} rebasan el corte pero ya están `
            + `apagadas (${apagadas.map(x => x.consecutivo).join(', ')}): ésas no son pendiente suyo.` : ''),
      accion: 'Una llamada registrada basta para sacarlas del listado; sin registro, siguen contando.',
    })
  }
}

/* 4 · el hueco grande: sin NINGÚN contacto registrado */
{
  const n = D.sinContacto.nunca.filter(viva)
  if (n.length) {
    const pct = Math.round((n.length / Math.max(1, cuentasVivas.length)) * 100)
    const mrrN = n.filter(x => x.origenMrr !== 'sin_dato').reduce((s, x) => s + x.mrr, 0)
    sug.push({
      titulo: `${n.length} de sus ${cuentasVivas.length} cuentas vivas no tienen NI UN contacto registrado`,
      prioridad: 'alta',
      porque: `Es el ${pct}% de su cartera viva y ${pesos(mrrN)} de MRR medible `
        + `(el bloque de arriba cuenta ${D.sinContacto.nunca.length} porque incluye las `
        + `apagadas, que aquí no se le piden). Esto NO significa `
        + `que no las haya atendido: significa que no hay nada escrito, y por eso no son `
        + `medibles ni para el Health Score ni para las alertas.`,
      accion: 'Mientras no se registre, el trabajo hecho no existe para el tablero — '
        + 'ni para defender la cuenta cuando alguien pregunte.',
    })
  }
}

/* 4.5 · churn sin aviso escrito. Es un hallazgo sobre el REGISTRO, no sobre su
   trabajo, y así se redacta: una baja sin solicitud capturada no prueba que no
   hubiera señales — prueba que nadie las escribió. */
if (CH.cuentas.length && CH.solicitudes.length === 0) {
  sug.push({
    titulo: `Capturar la solicitud de cancelación: las ${CH.cuentas.length} bajas se fueron sin aviso escrito`,
    prioridad: 'alta',
    porque: `Su cartera acumula ${CH.cuentas.length} cuentas en churn confirmado `
      + `(${pesos(CH.perdidoGrc)} medidos por el GRC) y CERO solicitudes de cancelación `
      + `registradas en toda su historia. No prueba que no hubiera señales: prueba que `
      + `no quedaron escritas, y sin ese registro no hay nada que revisar para evitar la siguiente.`,
    accion: 'El formato de Seguimiento KAM · Solicitud de cancelación es el único lugar '
      + 'donde esa señal queda amarrada a la cuenta antes de que se vaya.',
  })
}

/* 5 · higiene de datos, por tipo de alerta */
const higiene = ['sin_ficha', 'sin_contactos', 'sin_radar', 'sin_importe', 'sin_datos_auditables']
const higieneTot = higiene.reduce((s, k) => s + (tiposAlerta[k] ?? 0), 0)
if (higieneTot) {
  const detalle = higiene.filter(k => tiposAlerta[k])
    .map(k => `${k} (${tiposAlerta[k]})`).join(', ')
  sug.push({
    titulo: 'Cerrar las alertas que se resuelven capturando, no vendiendo',
    prioridad: 'media',
    porque: `${higieneTot} de las alertas abiertas de su cartera son de falta de dato: ${detalle}.`,
    accion: 'Son las más baratas de cerrar y las que más ensucian el resto de los indicadores.',
  })
}

/* 6 · cuentas que consultó y que están marcadas de riesgo, sin captura */
const todasLasCapturas = [...D.capturas.seguimientos, ...D.capturas.actividades,
                          ...D.capturas.anexos]
const abiertasSinCaptura = D.navegacion.porCuenta.filter(c =>
  !todasLasCapturas.some(x => String(x.cuenta).startsWith(c.consecutivo + ' ')))
const vistasSinCaptura = abiertasSinCaptura.filter(viva)
const vistasApagadas = abiertasSinCaptura.filter(c => !viva(c))
if (vistasSinCaptura.length) {
  sug.push({
    titulo: `${vistasSinCaptura.length} cuenta(s) que abrió y de las que no quedó nada escrito`,
    prioridad: 'media',
    porque: vistasSinCaptura.map(c => `${c.consecutivo} ${c.empresa} (${c.visitas} visita(s))`).join('; ')
      + '.' + (vistasApagadas.length
        ? ` No se cuentan aquí ${vistasApagadas.map(c => `${c.consecutivo} ${c.empresa}`).join(', ')}: `
          + `está en Dormidas y no se le pide gestión sobre una cuenta apagada.` : ''),
    accion: 'Consultar no deja rastro de gestión. Si hubo contacto, falta el seguimiento; '
      + 'si fue sólo revisión, no cuenta como atención.',
  })
}

/* ── el documento ───────────────────────────────────────────────────────── */
const barrasDia = dias.map((d, i) => {
  const w = 100 / dias.length
  const x = i * w
  const alto = d.n === 0 ? 0 : (d.n / maxDia) * 100
  const etiqueta = `${DIAS_SEM[diaSemana(d.iso)]} ${d.iso.slice(8)} · ${d.n} visita(s)`
    + (d.finDeSemana ? ' · fin de semana' : '')
    + (!d.medible ? ' · SIN MEDICIÓN' : '')
  return `<g><title>${esc(etiqueta)}</title>
    <rect x="${(x + w * 0.18).toFixed(2)}" y="${(100 - alto).toFixed(2)}"
          width="${(w * 0.64).toFixed(2)}" height="${alto.toFixed(2)}"
          rx="1.2" fill="${d.medible ? 'var(--serie)' : 'var(--sin-medicion)'}"></rect>
    <rect x="${(x + w * 0.18).toFixed(2)}" y="0" width="${(w * 0.64).toFixed(2)}" height="100"
          fill="transparent"></rect></g>`
}).join('\n')

const barrasHora = horas.map((hh, i) => {
  const w = 100 / horas.length
  const x = i * w
  const alto = hh.n === 0 ? 0 : (hh.n / maxHora) * 100
  return `<g><title>${esc(`${String(hh.h).padStart(2, '0')}:00 · ${hh.n} visita(s)`)}</title>
    <rect x="${(x + w * 0.18).toFixed(2)}" y="${(100 - alto).toFixed(2)}"
          width="${(w * 0.64).toFixed(2)}" height="${alto.toFixed(2)}"
          rx="1.2" fill="var(--serie)"></rect>
    <rect x="${(x + w * 0.18).toFixed(2)}" y="0" width="${(w * 0.64).toFixed(2)}" height="100"
          fill="transparent"></rect></g>`
}).join('\n')

const filaBarra = (etq, n, max, extra = '') => `
  <div class="fila">
    <div class="fila-etq">${extra}${esc(etq)}</div>
    <div class="fila-barra"><span style="width:${((n / max) * 100).toFixed(1)}%"></span></div>
    <div class="fila-num">${miles(n)}</div>
  </div>`

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Actividad de ${esc(D.usuario.nombre ?? D.correo)}</title>
<style>
  :root {
    color-scheme: light;
    --plano:#f9f9f7; --sup:#fcfcfb;
    --tinta:#0b0b0b; --tinta-2:#52514e; --tinta-3:#898781;
    --linea:#e1e0d9; --eje:#c3c2b7; --borde:rgba(11,11,11,.10);
    --serie:#2a78d6; --sin-medicion:#c3c2b7;
    --st-good:#0ca30c; --st-warning:#fab219; --st-serious:#ec835a; --st-critical:#d03b3b;
    --aviso:#fff8e6; --aviso-borde:#eda100;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      color-scheme: dark;
      --plano:#0d0d0d; --sup:#1a1a19;
      --tinta:#f0efec; --tinta-2:#c3c2b7; --tinta-3:#898781;
      --linea:#2c2c2a; --eje:#383835; --borde:rgba(255,255,255,.10);
      --serie:#3987e5; --sin-medicion:#383835;
      --aviso:#2a2416; --aviso-borde:#c98500;
    }
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --plano:#0d0d0d; --sup:#1a1a19;
    --tinta:#f0efec; --tinta-2:#c3c2b7; --tinta-3:#898781;
    --linea:#2c2c2a; --eje:#383835; --borde:rgba(255,255,255,.10);
    --serie:#3987e5; --sin-medicion:#383835;
    --aviso:#2a2416; --aviso-borde:#c98500;
  }
  * { box-sizing:border-box; }
  body {
    margin:0; background:var(--plano); color:var(--tinta);
    font:15px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;
    padding:28px 16px 64px;
  }
  .wrap { max-width:1060px; margin:0 auto; }
  h1 { font-size:26px; line-height:1.2; margin:0 0 4px; letter-spacing:-.01em; }
  h2 { font-size:17px; margin:34px 0 12px; letter-spacing:-.005em; }
  h3 { font-size:14px; margin:20px 0 8px; color:var(--tinta-2); font-weight:600; }
  .sub { color:var(--tinta-2); margin:0 0 20px; font-size:14px; }
  .card {
    background:var(--sup); border:1px solid var(--borde); border-radius:10px;
    padding:18px 18px 16px; margin-bottom:16px;
  }
  .aviso {
    background:var(--aviso); border:1px solid var(--aviso-borde); border-left-width:4px;
    border-radius:8px; padding:14px 16px; margin:0 0 20px; font-size:14px;
  }
  /* SÓLO el rótulo del aviso va en su propia línea. Un b dentro de un li es
     énfasis EN LA FRASE: con display:block parte la oración en tres y el
     párrafo deja de leerse. (Sin acentos graves: esto vive en una plantilla.) */
  .aviso > b { display:block; margin-bottom:6px; }
  .aviso ul { margin:8px 0 0; padding-left:20px; }
  .aviso li { margin:4px 0; }
  .tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; }
  .tile { background:var(--sup); border:1px solid var(--borde); border-radius:10px; padding:14px 16px; }
  .tile .n { font-size:28px; font-weight:650; letter-spacing:-.02em; display:block; }
  .tile .k { color:var(--tinta-2); font-size:12.5px; }
  .tile .nota { color:var(--tinta-3); font-size:11.5px; margin-top:3px; }
  svg.g { width:100%; height:150px; display:block; }
  .ejex { display:flex; margin-top:6px; color:var(--tinta-3); font-size:11.5px; }
  .ejex span { flex:1; text-align:center; }
  .ejex .fin { color:var(--tinta-3); }
  table { width:100%; border-collapse:collapse; font-size:13.5px; }
  th, td { text-align:left; padding:7px 8px; border-bottom:1px solid var(--linea); vertical-align:top; }
  th { color:var(--tinta-2); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.03em; }
  td.num, th.num { text-align:right; font-variant-numeric:tabular-nums; }
  .fila { display:grid; grid-template-columns:minmax(150px,230px) 1fr 54px; gap:10px; align-items:center; margin:5px 0; }
  .fila-etq { font-size:13px; color:var(--tinta-2); }
  .fila-barra { background:var(--linea); border-radius:3px; height:9px; overflow:hidden; }
  .fila-barra span { display:block; height:100%; background:var(--serie); border-radius:3px; }
  .fila-num { text-align:right; font-variant-numeric:tabular-nums; font-size:13px; }
  .punto { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:7px; vertical-align:1px; }
  .chip { display:inline-block; border:1px solid var(--borde); border-radius:99px;
          padding:1px 8px; font-size:11.5px; color:var(--tinta-2); margin:2px 4px 2px 0; }
  .top { border-color:var(--serie); color:var(--serie); font-weight:600; }
  /* «sin medir» y «ficha» NO son adornos: marcan que la cifra de al lado no es
     la institucional, o que no existe. Van en tinta apagada y en cursiva para
     que nadie los lea como un importe más. */
  .nomed { color:var(--tinta-3); font-style:italic; }
  .chip.ficha { font-style:italic; }
  details { margin-top:10px; }
  summary { cursor:pointer; color:var(--tinta-2); font-size:13px; }
  .sg { border-left:4px solid var(--eje); padding:2px 0 2px 14px; margin:0 0 18px; }
  .sg.alta { border-left-color:var(--st-critical); }
  .sg.media { border-left-color:var(--st-warning); }
  .sg h3 { margin:0 0 4px; color:var(--tinta); font-size:15px; }
  .sg p { margin:4px 0; font-size:13.5px; color:var(--tinta-2); }
  .sg .acc { color:var(--tinta); }
  .pie { color:var(--tinta-3); font-size:12px; margin-top:34px; border-top:1px solid var(--linea); padding-top:14px; }
  @media (max-width:640px) {
    .fila { grid-template-columns:minmax(110px,1fr) 1fr 44px; }
    h1 { font-size:21px; }
  }
</style>
</head>
<body>
<div class="wrap">

  <h1>Actividad de ${esc(D.usuario.nombre ?? D.correo)}</h1>
  <p class="sub">
    ${esc(D.correo)} · rol ${esc(D.usuario.rol)} · cartera «${esc(D.usuario.asesor)}»<br>
    Ventana: <b>${esc(D.ventana.desde)}</b> a <b>${esc(D.ventana.hasta)}</b>
    (${D.ventana.dias} días, hora de México) · generado ${esc(D.generado.slice(0, 16).replace('T', ' '))} UTC
  </p>

  <div class="aviso">
    <b>Lo que este reporte NO puede decir — y por qué</b>
    <ul>
      <li><b>Reuniones:</b> la tabla no guarda quién la creó, así que ninguna reunión se
          atribuye a nadie. No se cuentan aquí ni a favor ni en contra.</li>
      <li><b>Duración de una visita:</b> la mide el navegador y es <b>tiempo de pestaña
          abierta</b>, no tiempo de trabajo. ${D.navegacion.sinDuracion} de
          ${D.navegacion.visitas} visitas llegaron sin duración y no entran en ningún promedio.</li>
      <li><b>Sin contacto registrado:</b> ${D.sinContacto.nunca.length} cuentas no tienen
          ni un contacto escrito. Eso es <b>falta de medición</b>, no «nunca se atendió», y
          va en su propio bloque, separado de las que sí tienen fecha.</li>
      <li><b>Dos relojes distintos:</b> la actividad —visitas y capturas— es de la
          ventana ${esc(D.ventana.desde)} a ${esc(D.ventana.hasta)}. El riesgo, el churn
          y los días sin contacto son <b>foto del día en que se generó</b>
          (${esc(D.generado.slice(0, 10))}), porque así se preguntó: cuáles están en riesgo
          <i>en este momento</i>. No se mezclan.</li>
      <li><b>Churn:</b> el GRC no guarda asesor, así que el churn de la empresa
          <b>no se puede repartir por persona</b>. Lo que sí se mide es cuáles de las
          cuentas que hoy trae en cartera están en churn confirmado — ${CH.cuentas.length} —
          y eso no es ni «su churn del año» ni «el churn».</li>
      <li><b>Importes:</b> un monto marcado <span class="chip ficha">ficha</span> sale de
          la columna guardada en la cuenta, no del GRC; se usa cuando la cuenta ya no
          aparece en el export institucional. Lo que dice <span class="nomed">sin medir</span>
          no existe en ninguna fuente, y no es cero.</li>
      <li><b>Navegación:</b> el registro <code>uso_dashboard</code> empieza el
          ${esc(D.ventana.usoEmpiezaEl ?? '—')}. En la ventana hubo
          ${miles(D.navegacion.control.visitasDeTodos)} visitas de
          ${D.navegacion.control.correosActivos.length} usuarios, así que un día en cero
          es un día sin entrar, no el registro caído.</li>
    </ul>
  </div>

  <div class="tiles">
    <div class="tile"><span class="n">${miles(D.cartera.total)}</span>
      <span class="k">cuentas en cartera</span></div>
    <div class="tile"><span class="n">${pesos(D.cartera.mrrMedible)}</span>
      <span class="k">MRR medible</span>
      <div class="nota">${pesos(mrrDeGrc)} del GRC · ${pesos(mrrDeFicha)} de la ficha ·
        ${D.cartera.sinMrrMedible} cuenta(s) sin importe medible</div></div>
    <div class="tile"><span class="n">${miles(D.navegacion.visitas)}</span>
      <span class="k">visitas en la semana</span>
      <div class="nota">${D.navegacion.porCuenta.length} cuenta(s) distinta(s) abierta(s)</div></div>
    <div class="tile"><span class="n">${miles(capturasTotal)}</span>
      <span class="k">capturas</span>
      <div class="nota">${D.capturas.seguimientos.length} seguimiento(s) ·
        ${D.capturas.actividades.length} actividad(es) · ${D.capturas.anexos.length} anexo(s)</div></div>
    <div class="tile"><span class="n">${miles(D.riesgo.length)}</span>
      <span class="k">cuentas con alerta abierta</span>
      <div class="nota">de ${D.cartera.total}</div></div>
    <div class="tile"><span class="n">${miles(D.sinContacto.pasados.length)}</span>
      <span class="k">+${D.sinContacto.corte} días sin contacto</span>
      <div class="nota">y ${D.sinContacto.nunca.length} sin ningún registro</div></div>
  </div>

  <h2>Cuándo entró</h2>
  <div class="card">
    <h3>Visitas por día</h3>
    <svg class="g" viewBox="0 0 100 100" preserveAspectRatio="none" role="img"
         aria-label="Visitas por día de la ventana">${barrasDia}</svg>
    <div class="ejex">${dias.map(d =>
      `<span class="${d.finDeSemana ? 'fin' : ''}">${DIAS_SEM[diaSemana(d.iso)]} ${d.iso.slice(8)}</span>`).join('')}</div>
    <details><summary>Ver la tabla</summary>
      <table><thead><tr><th>Día</th><th class="num">Visitas</th><th>Nota</th></tr></thead><tbody>
      ${dias.map(d => `<tr><td>${DIAS_SEM[diaSemana(d.iso)]} ${esc(d.iso)}</td>
        <td class="num">${d.n}</td>
        <td>${!d.medible ? 'sin medición' : d.finDeSemana ? 'fin de semana' : d.n === 0 ? 'no entró' : ''}</td></tr>`).join('')}
      </tbody></table>
    </details>
  </div>

  <div class="card">
    <h3>Visitas por hora (hora de México)</h3>
    <svg class="g" viewBox="0 0 100 100" preserveAspectRatio="none" role="img"
         aria-label="Visitas por hora del día">${barrasHora}</svg>
    <div class="ejex">${horas.map(h => `<span>${String(h.h).padStart(2, '0')}h</span>`).join('')}</div>
    <p class="sub" style="margin:10px 0 0">
      Sólo se dibujan las horas con dato (${String(hIni).padStart(2, '0')}h a
      ${String(hFin).padStart(2, '0')}h). Fuera de esa franja no hubo ninguna visita.</p>
  </div>

  <h2>Qué consultó</h2>
  <div class="card">
    <h3>Por apartado</h3>
    ${Object.entries(D.navegacion.porSeccion).sort((a, b) => b[1] - a[1])
      .map(([k, v]) => filaBarra(k, v, Math.max(...Object.values(D.navegacion.porSeccion)))).join('')}
  </div>

  <div class="card">
    <h3>Cuentas que abrió</h3>
    <table><thead><tr><th>Cuenta</th><th class="num">Visitas</th>
      <th class="num">Pestaña abierta</th><th>¿Quedó algo escrito?</th></tr></thead><tbody>
    ${D.navegacion.porCuenta.map(c => {
      const cap = [...D.capturas.seguimientos, ...D.capturas.actividades, ...D.capturas.anexos]
        .filter(x => String(x.cuenta).startsWith(c.consecutivo + ' '))
      return `<tr><td><b>${esc(c.consecutivo)}</b> ${esc(c.empresa)}</td>
        <td class="num">${c.visitas}</td><td class="num">${duracion(c.seg)}</td>
        <td>${cap.length ? `sí · ${cap.length} captura(s)` : '<b>no</b>'}</td></tr>`
    }).join('')}
    </tbody></table>
    <p class="sub" style="margin:10px 0 0">
      «Pestaña abierta» es el tiempo que el navegador reportó con la página cargada.
      No es tiempo de trabajo: una pestaña olvidada abierta suma igual.</p>
  </div>

  <h2>Qué capturó</h2>
  <div class="card">
    ${capturasTotal === 0 ? '<p class="sub">Ninguna captura en la ventana.</p>' : ''}
    ${D.capturas.seguimientos.length ? `<h3>Seguimientos (${D.capturas.seguimientos.length})</h3>
    <table><thead><tr><th>Día</th><th>Hora</th><th>Tipo</th><th>Cuenta</th><th>Qué dice</th></tr></thead><tbody>
    ${D.capturas.seguimientos.map(s => `<tr><td>${esc(s.dia)}</td>
      <td class="num">${String(s.hora).padStart(2, '0')}h</td><td>${esc(s.tipo)}</td>
      <td>${esc(s.cuenta)}</td><td>${esc(s.descripcion)}…</td></tr>`).join('')}
    </tbody></table>` : ''}
    ${D.capturas.actividades.length ? `<h3>Actividades (${D.capturas.actividades.length})</h3>
    <table><thead><tr><th>Día</th><th>Tipo</th><th>Cuenta</th><th>Estado</th></tr></thead><tbody>
    ${D.capturas.actividades.map(a => `<tr><td>${esc(a.dia)}</td><td>${esc(a.tipo)}</td>
      <td>${esc(a.cuenta)}</td><td>${esc(a.estado)}${a.completada ? ' · completada' : ''}</td></tr>`).join('')}
    </tbody></table>` : ''}
    ${D.capturas.anexos.length ? `<h3>Documentos subidos (${D.capturas.anexos.length})</h3>
    <table><thead><tr><th>Día</th><th>Documento</th><th>Tema</th><th>Cuenta</th></tr></thead><tbody>
    ${D.capturas.anexos.map(x => `<tr><td>${esc(x.dia)}</td><td>${esc(x.documento)}</td>
      <td>${esc(x.tema)}</td><td>${esc(x.cuenta)}</td></tr>`).join('')}
    </tbody></table>` : `<p class="sub">Documentos subidos por él en la ventana: 0.
      (En el mismo periodo otras personas subieron ${D.anexosDeOtros}.)</p>`}
  </div>

  <h2>Su cartera</h2>
  <div class="card">
    <h3>Por estado</h3>
    ${estados.map(([k, v]) => filaBarra(k, v, maxEstado,
      `<span class="punto" style="background:${ESTADO_COLOR[k] ?? 'var(--eje)'}"></span>`)).join('')}
    <p class="sub" style="margin:10px 0 0">El color acompaña al nombre del estado; nunca lo sustituye.</p>
  </div>

  <h2>Riesgo hoy</h2>
  <div class="card">
    <h3>Alertas abiertas por tipo, en sus ${D.cartera.total} cuentas</h3>
    ${alertasOrden.map(([k, v]) => filaBarra(k, v, maxAlerta)).join('')}
  </div>

  <div class="card">
    <h3>Las cuentas de mayor riesgo, y por qué</h3>
    <table><thead><tr><th>Cuenta</th><th class="num">MRR</th><th class="num">HS</th>
      <th>Estado</th><th>Por qué</th></tr></thead><tbody>
    ${[...D.riesgo].sort((a, b) => (b.alertas.length - a.alertas.length) || (b.mrr - a.mrr))
      .slice(0, 15).map(r => `<tr>
      <td><b>${esc(r.consecutivo)}</b> ${esc(r.empresa)}${r.top ? ' <span class="chip top">TOP</span>' : ''}</td>
      <td class="num">${importeTxt(r)}</td>
      <td class="num">${r.hs ?? '—'}</td>
      <td><span class="punto" style="background:${ESTADO_COLOR[r.estado] ?? 'var(--eje)'}"></span>${esc(r.estado)}</td>
      <td>${r.alertas.map(a => `<span class="chip">${esc(a.tipo)}</span>`).join('')}</td></tr>`).join('')}
    </tbody></table>
    <p class="sub" style="margin:10px 0 0">
      Ordenadas por número de alertas abiertas y, a igualdad, por MRR.
      Se muestran 15 de ${D.riesgo.length}.</p>
  </div>

  <h2>Sin contacto</h2>
  <div class="card">
    <h3>Más de ${D.sinContacto.corte} días desde el último contacto efectivo (${D.sinContacto.pasados.length})</h3>
    <table><thead><tr><th>Cuenta</th><th class="num">Días</th><th>Último contacto</th>
      <th class="num">MRR</th><th>Estado</th></tr></thead><tbody>
    ${D.sinContacto.pasados.map(s => `<tr>
      <td><b>${esc(s.consecutivo)}</b> ${esc(s.empresa)}${s.top ? ' <span class="chip top">TOP</span>' : ''}</td>
      <td class="num">${s.dias}</td><td>${esc(s.ultimoContacto)}</td>
      <td class="num">${importeTxt(s)}</td>
      <td><span class="punto" style="background:${ESTADO_COLOR[s.estado] ?? 'var(--eje)'}"></span>${esc(s.estado)}</td></tr>`).join('')}
    </tbody></table>
  </div>

  <div class="card">
    <h3>Sin ningún contacto registrado (${D.sinContacto.nunca.length}) — esto es falta de medición</h3>
    <p class="sub">
      Estas cuentas no tienen una sola fecha de contacto en seguimientos, actividades ni
      reuniones. No se puede afirmar que no se atendieron; se afirma que <b>no hay registro</b>,
      y sin registro no entran en ningún indicador.
    </p>
    <details><summary>Ver las ${D.sinContacto.nunca.length} cuentas</summary>
      <table><thead><tr><th>Cuenta</th><th class="num">MRR</th><th>Estado</th></tr></thead><tbody>
      ${[...D.sinContacto.nunca].sort((a, b) => b.mrr - a.mrr).map(s => `<tr>
        <td><b>${esc(s.consecutivo)}</b> ${esc(s.empresa)}${s.top ? ' <span class="chip top">TOP</span>' : ''}</td>
        <td class="num">${importeTxt(s)}</td>
        <td><span class="punto" style="background:${ESTADO_COLOR[s.estado] ?? 'var(--eje)'}"></span>${esc(s.estado)}</td></tr>`).join('')}
      </tbody></table>
    </details>
  </div>

  <h2>Churn de su cartera</h2>
  <div class="card">
    <h3>${CH.cuentas.length} cuenta(s) de su cartera están en churn confirmado</h3>
    <p class="sub" style="margin:0 0 12px">
      <b>${pesos(CH.perdidoGrc)}</b> de pérdida medida por el GRC, más
      ${chSinImporteGrc.length} cuenta(s) que el GRC todavía no registra como baja
      — su último importe conocido suma ${pesos(chUltimoMrr)}, que
      <b>no es lo mismo</b> que pérdida reconocida y por eso va separado.
      El mes vivo (<b>${esc(CH.mesVivoExcluido ?? 'ninguno')}</b>) NO cuenta: el mes en
      curso son clientes que tardan en pagar, no bajas.
    </p>
    <table><thead><tr><th>Cuenta</th><th>Por dónde entró</th><th>Mes del GRC</th>
      <th class="num">Pérdida GRC</th><th class="num">Último MRR</th><th>Estado</th></tr></thead><tbody>
    ${CH.cuentas.map(c => `<tr>
      <td><b>${esc(c.consecutivo)}</b> ${esc(c.empresa)}${c.top ? ' <span class="chip top">TOP</span>' : ''}</td>
      <td>${c.puertas.map(p => `<span class="chip">${esc(p)}</span>`).join('')}</td>
      <td>${c.mesesGrc.length ? esc(c.mesesGrc.join(', ')) : '<span class="nomed">no está en el GRC</span>'}</td>
      <td class="num">${c.perdidoGrc ? pesos(c.perdidoGrc) : '<span class="nomed">sin importe</span>'}</td>
      <td class="num">${importeTxt(c)}</td>
      <td><span class="punto" style="background:${ESTADO_COLOR[c.estado] ?? 'var(--eje)'}"></span>${esc(c.estado)}</td></tr>`).join('')}
    </tbody></table>
    <p class="sub" style="margin:12px 0 0">
      <b>Las tres puertas no son lo mismo.</b> <b>GRC</b> es el export institucional y es
      la única que trae pesos. <b>DATA</b> son las cancelaciones confirmadas en Análisis
      DATA, que confirman la baja pero no dicen cuánto. <b>DIRECCIÓN</b> es la lista que
      dirección declaró y que ninguna fuente trae todavía${porDireccion.length
        ? ` — ${porDireccion.map(c => `${esc(c.consecutivo)} ${esc(c.empresa)}`).join(' y ')}
            ${porDireccion.length > 1 ? 'entraron' : 'entró'} por ahí, y por eso
            ${porDireccion.length > 1 ? 'sus pérdidas aún no aparecen' : 'su pérdida aún no aparece'}
            en el GRC` : ''}.
    </p>
  </div>

  <div class="card">
    <h3>Lo que estas ${CH.cuentas.length} cuentas NO son: el churn de la empresa</h3>
    <p class="sub">
      El GRC <b>no tiene columna de asesor</b>. Lo único que se puede cruzar es el nombre
      contra las cuentas que siguen en el sistema, y de los
      <b>${miles(CH.control.nombresChurnGrc)}</b> nombres con «Churn confirmado» del año,
      sólo <b>${miles(CH.control.cruzanConUnaCuenta)}</b> cruzan con alguna cuenta;
      <b>${miles(CH.control.noCruzanConNingunaCuenta)}</b> no cruzan con ninguna y no se le
      pueden atribuir a nadie. Así que esto es «el churn que toca su cartera de hoy»,
      no «su churn del año» ni mucho menos «el churn».
    </p>
    <p class="sub" style="margin-top:8px">
      Solicitudes de cancelación registradas en su cartera, en toda su historia:
      <b>${CH.solicitudes.length}</b>.
      ${CH.solicitudes.length === 0
        ? 'Ninguna de las ' + CH.cuentas.length + ' bajas tuvo un aviso escrito antes de irse. '
          + 'Eso no prueba que no hubiera señales: prueba que no quedaron registradas.'
        : ''}
    </p>
    ${CH.solicitudes.length ? `<table><thead><tr><th>Fecha</th><th>Cuenta</th>
      <th class="num">MRR</th><th>Qué dice</th></tr></thead><tbody>
    ${CH.solicitudes.map(s => `<tr><td>${esc(s.fecha)}</td>
      <td><b>${esc(s.consecutivo)}</b> ${esc(s.empresa)}</td>
      <td class="num">${importeTxt(s)}</td><td>${esc(s.descripcion)}…</td></tr>`).join('')}
    </tbody></table>` : ''}
  </div>

  <h2>Sugerencias que debe atender</h2>
  ${sug.map(s => `<div class="sg ${esc(s.prioridad)}">
    <h3>${esc(s.titulo)}</h3>
    <p>${esc(s.porque)}</p>
    <p class="acc">${esc(s.accion)}</p>
  </div>`).join('')}

  <p class="pie">
    Medido con <code>scripts/reporte-actividad-usuario.mjs</code> y dibujado con
    <code>scripts/reporte-actividad-html.mjs</code>. Ninguna cifra de este documento está
    escrita a mano: todas salen de <code>${esc(path.basename(ENTRADA))}</code>.
    Las fuentes son <code>uso_dashboard</code>, <code>cuentas</code>,
    <code>seguimientos</code>, <code>actividades</code>, <code>anexos</code> y
    <code>alertas_episodios</code> de Supabase, más el mapa de MRR del GRC.
  </p>

</div>
</body>
</html>`

fs.mkdirSync(path.dirname(SALIDA), { recursive: true })
fs.writeFileSync(SALIDA, html, 'utf8')
console.log(`\n  escrito ${SALIDA} (${Math.round(html.length / 1024)} KB)`)
console.log(`  sugerencias calculadas: ${sug.length}\n`)
