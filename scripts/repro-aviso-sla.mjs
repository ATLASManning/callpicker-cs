/**
 * REPRODUCCIÓN DEL AVISO DIARIO POR CORREO
 *
 *   node scripts/repro-aviso-sla.mjs <raiz-del-repo> <salida.html>
 *
 * Llama a `cuerpoDeAviso()` —la función REAL que manda el correo— y escribe su
 * HTML a un archivo para poder abrirlo y MIRARLO. Sin credenciales, sin red y
 * sin mandarle nada a nadie.
 *
 * ── POR QUÉ ESTO EXISTE ───────────────────────────────────────────────────
 *
 * Porque `scripts/mide-tonos-sla.mjs` mide contraste y el contraste no es el
 * render. En este mismo encargo el semáforo de la ficha salió BLANCO SOBRE
 * BLANCO con todas las mediciones en verde: el bug no era un tono flojo, era
 * el tono correcto aplicado al elemento equivocado. Eso sólo se ve mirando.
 * [[feedback-verificar-antes-asegurar]]
 *
 * Y el correo es el peor sitio para enterarse tarde: una pantalla rota se
 * recarga, un correo mal pintado ya está en la bandeja de alguien.
 *
 * ── LO QUE ESTO NO PRUEBA ─────────────────────────────────────────────────
 *
 * Que Gmail y Outlook lo pinten igual. Ninguno de los dos es un navegador:
 * Gmail tira el `<style>` y Outlook renderiza con Word. Por eso el cuerpo va
 * con tabla y estilos EN LÍNEA, que es lo único que ambos respetan — pero
 * comprobarlo de verdad es mandarse el correo a uno mismo, y eso no lo hace un
 * guión. Lo que esto cierra es el paso anterior: que el HTML esté bien armado y
 * se lea.
 *
 * ── LOS DATOS SON INVENTADOS, Y SE DICE ───────────────────────────────────
 *
 * Las cinco cuentas de la muestra no existen. Van rotuladas como prueba dentro
 * del propio render para que nadie confunda esta reproducción con un aviso
 * real: un archivo que se parece a un correo de producción y trae cifras falsas
 * es una trampa esperando a que alguien lo reenvíe. [[feedback-contexto-ia-sin-huecos]]
 */
import jitiPkg from 'jiti'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const RAIZ = process.argv[2]
const SALIDA = process.argv[3]
if (!RAIZ || !SALIDA) {
  console.error('uso: node scripts/repro-aviso-sla.mjs <raiz-del-repo> <salida.html>')
  process.exit(2)
}

const crear = jitiPkg.createJiti ?? jitiPkg
const jiti = crear(fileURLToPath(import.meta.url), { alias: { '@': RAIZ } })

/* Se importa `lib/alertas-sla-correo.ts`, NO `lib/alertas-sla-aviso.ts`. El
   segundo importa `resend` y `lib/supabase.ts`, y ése construye un
   `RealtimeClient` al cargarse que bajo Node 20 revienta por falta de WebSocket
   nativo. El cuerpo del correo se separó del que lo manda justo para esto. */
const { cuerpoDeAviso } = await jiti.import(path.join(RAIZ, 'lib/alertas-sla-correo.ts'))
const { semaforoDe } = await jiti.import(path.join(RAIZ, 'lib/alertas-sla.ts'))

const HOY = '2026-11-26'
const SIN_INHABILES = new Set()

/* Cinco casos que recorren TODAS las ramas de color de la plantilla: las dos
   que pintan ROJO (vencida e incumplida) y las tres que pintan ÁMBAR. Si aquí
   sólo hubiera vencidas, la rama ámbar no se renderizaría y mirar el archivo no
   diría nada de ella. */
const CASOS = [
  { sev: 'critica', limite: '2026-11-19', empresa: 'PRUEBA · Comercial del Norte & Cía',
    cons: 'D91', accion: 'Llamar hoy al director de operaciones y confirmar si la baja de las 12 extensiones es definitiva.', mrr: 84200 },
  { sev: 'alta', limite: '2026-11-25', empresa: 'PRUEBA · Servicios Integrales',
    cons: 'D92', accion: 'Pedirle al contacto de facturación el plan que cree que tiene contratado y cruzarlo con el GRC.', mrr: 41300 },
  { sev: 'alta', limite: '2026-11-26', empresa: 'PRUEBA · Grupo Peninsular',
    cons: 'C93', accion: 'Agendar la reunión de revisión trimestral antes del cierre de mes y llevar el consumo de los 3 meses.', mrr: 27800 },
  { sev: 'media', limite: '2026-11-27', empresa: 'PRUEBA · Distribuidora Bajío',
    cons: 'C94', accion: 'Mostrarle el módulo de Voz y Chat en una demo de 20 minutos; paga el plan y no lo ha activado.', mrr: 15600 },
  { sev: 'media', limite: '2026-12-10', empresa: 'PRUEBA · Inmobiliaria Centro',
    cons: 'D95', accion: 'Corregir el contacto de la ficha: el que está registrado ya no trabaja ahí.', mrr: null },
]

const LINEAS = CASOS.map((c, i) => ({
  empresa: c.empresa,
  consecutivo: c.cons,
  condicion: 'consumo',
  semaforo: semaforoDe(
    { estado: 'abierta', severidad: c.sev, fechaLimite: c.limite },
    HOY, SIN_INHABILES,
  ),
  severidad: c.sev,
  accion_sugerida: c.accion,
  /* `null` a propósito en el último: el correo tiene que decir «sin importe» en
     vez de pintar «$0». Un cero sin medición no es un cero.
     [[feedback-cero-sin-medicion]] */
  mrr: c.mrr,
  cuenta_id: `prueba-${i + 1}`,
}))

const VARIANTES = [
  ['El correo del asesor', cuerpoDeAviso('Erick', LINEAS, HOY, false)],
  ['El correo de dirección (tablero de incumplimientos)',
   cuerpoDeAviso('dirección', LINEAS, HOY, true)],
]

/* El `viewport` es de ESTA envoltura, no del correo. Sin él, Chrome en móvil
   finge un ancho de 980px y lo encoge: la reproducción se vería «bien» y no
   habría enseñado nada del ancho real al que la mayoría lee el correo. Los
   clientes de correo hacen lo suyo —Gmail inyecta su propio viewport, Outlook
   usa Word—, pero ninguno ensancha la pantalla: si aquí no cabe, allá tampoco. */
const html = `<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reproducción del aviso diario SLA</title>
<body style="margin:0;padding:24px;background:#E7EDF2;font-family:-apple-system,Segoe UI,sans-serif">
  <div style="max-width:760px;margin:0 auto 24px;background:#FFF4CE;border:1px solid #D8B34A;border-radius:10px;padding:14px 18px;color:#5A4208;font-size:13px;line-height:1.6">
    <strong>Esto no es un correo real.</strong> Las cinco cuentas son inventadas y
    van rotuladas «PRUEBA» a propósito. Es el HTML que
    <code>cuerpoDeAviso()</code> devuelve, generado por
    <code>scripts/repro-aviso-sla.mjs</code> para poder mirarlo. Los tonos se
    miden aparte, en <code>scripts/mide-tonos-sla.mjs</code>.
  </div>
${VARIANTES.map(([titulo, cuerpo]) => `
  <div style="max-width:760px;margin:0 auto 10px;color:#2A3B4C;font-size:12px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">${titulo}</div>
  <div style="margin:0 auto 32px">${cuerpo}</div>
`).join('')}
</body>`

fs.writeFileSync(SALIDA, html, 'utf8')
console.log(`escrito ${SALIDA}`)
console.log(`${VARIANTES.length} variantes · ${LINEAS.length} renglones cada una`)
