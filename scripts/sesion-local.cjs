/**
 * SESION LOCAL PARA MIRAR UNA PANTALLA EN EL DEV SERVER.
 *
 * El arnés `/acceso/vista-*` pinta el armazón pero sus APIs siguen pidiendo
 * sesión: devuelven 401 y la pantalla se queda en los tabs vacíos. Verificar
 * «que renderiza» con las tablas sin datos no prueba nada.
 *
 * Esto firma una cookie `cp_session` CON EL MISMO SECRETO LOCAL que usa el
 * servidor de desarrollo, para abrir el tablero en localhost y leer el DOM.
 *
 * NO ES UN BYPASS: usa `JWT_SECRET` de `.env.local`, o sea el secreto que ya
 * está en esta máquina. En producción el secreto es otro y esta cookie no vale
 * nada ahí. El token dura una hora a propósito.
 *
 * El secreto se LEE aquí dentro y NUNCA se imprime. Lo único que sale por
 * pantalla es el token, que es lo que hay que pegar en la cookie.
 *
 * USO
 *     node scripts/sesion-local.cjs [correo]
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const RAIZ = path.dirname(__dirname)

function env(clave) {
  const p = path.join(RAIZ, '.env.local')
  if (!fs.existsSync(p)) return null
  for (const ln of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = ln.trim()
    if (t.startsWith(clave + '=')) return t.slice(clave.length + 1).trim().replace(/^['"]|['"]$/g, '')
  }
  return null
}

const SECRETO = env('JWT_SECRET')
if (!SECRETO) {
  console.error('  *** JWT_SECRET no esta en .env.local. No se firma nada.')
  process.exit(2)
}

const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')

const correo = process.argv[2] || 'josel@callpicker.com'
const ahora = Math.floor(Date.now() / 1000)
const cabecera = b64({ alg: 'HS256', typ: 'JWT' })
const cuerpo = b64({
  email: correo,
  nombre: 'Verificacion local',
  rol: 'admin',
  asesor_nombre: null,
  iat: ahora,
  exp: ahora + 3600,
})
const firma = crypto.createHmac('sha256', SECRETO)
  .update(cabecera + '.' + cuerpo).digest('base64url')

console.log(cabecera + '.' + cuerpo + '.' + firma)
