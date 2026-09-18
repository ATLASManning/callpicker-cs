"""Restablece la contrasena de un usuario del dashboard. LO CORRE EL USUARIO.

   Para que sirve
   --------------
   El login vence la contrasena cada 30 dias (`usuarios.password_expira`). Si se
   vence, `app/api/auth/login/route.ts:45` responde `password_expirado` y ya no
   hay forma de entrar — y el modulo para cambiarla vive detras del login, asi
   que se vuelve un circulo: para renovarla hay que poder entrar.

   POR QUE EXISTE ESTE SCRIPT Y NO SE USAN LOS ENDPOINTS
   ----------------------------------------------------
   Los endpoints de reset viven detras del login (middleware.ts), asi que quien
   ya se quedo fuera no los alcanza: para renovarla habria que poder entrar.
   Este script va directo a la base y rompe ese circulo.

   Nota historica: hasta el 18 sep 2026 esos dos endpoints guardaban un SHA-256
   PLANO mientras el login validaba con PBKDF2-SHA512 con salt, asi que usarlos
   dejaba la cuenta irrecuperable. Ya se corrigieron —ambos usan hashPassword()
   de lib/password.ts—, pero si alguna cuenta quedo con un hash viejo, se
   reconoce porque NO tiene dos puntos; este script la repara igual.

   POR QUE LO CORRES TU Y NO CLAUDE
   --------------------------------
   La contrasena se teclea aqui, con `getpass`: no se ve en pantalla, no queda
   en el historial del shell y no viaja en ningun mensaje. Claude nunca la ve.

   Uso
   ---
       python scripts/restablece-password.py josel@callpicker.com

   Necesita `.env.local` con SUPABASE_SERVICE_ROLE_KEY — sin esa llave no hace
   nada, igual que el resto de los scripts de esta carpeta.
"""
import getpass
import hashlib
import io
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Los mismos parametros de lib/password.ts. Si alli cambian, aqui tambien.
ITERS, KEYLEN, DIGEST = 100_000, 64, 'sha512'
# lib/password.ts -> passwordExpira(): 30 dias.
DIAS_VIGENCIA = 30


def pbkdf2(plain: str, salt: str) -> str:
    """Igual que crypto.pbkdf2Sync(plain, salt, ...) de Node.

    Ojo con el salt: Node recibe la cadena HEX y usa sus bytes UTF-8, no el
    hex decodificado. Por eso va .encode() y no bytes.fromhex().
    """
    return hashlib.pbkdf2_hmac(DIGEST, plain.encode('utf-8'), salt.encode('utf-8'),
                               ITERS, KEYLEN).hex()


def verifica(plain: str, guardado: str) -> bool:
    """Replica verifyPassword() de lib/password.ts."""
    partes = guardado.split(':')
    if len(partes) != 2:
        return False
    salt, h = partes
    return pbkdf2(plain, salt) == h


# ── Prueba de vector conocido ────────────────────────────────────────────────
# PBKDF2-HMAC-SHA512("password", "salt", 1 iteracion, 64 bytes). Si esto no da,
# el algoritmo de esta maquina no es el que espera el login y NO hay que
# escribir nada en la base.
KAT = ('867f70cf1ade02cff3752599a3a53dc4af34c7a669815ae5d513554e1c8cf252'
       'c02d470a285a0501bad999bfe943c08f050235d7d68b1da55e63f73b60a57fce')
real = hashlib.pbkdf2_hmac('sha512', b'password', b'salt', 1, 64).hex()
if real != KAT:
    print('*** El PBKDF2 de esta maquina no coincide con el vector conocido.')
    print('    esperado: %s' % KAT)
    print('    obtenido: %s' % real)
    raise SystemExit('No se escribe nada. Revisar antes de continuar.')

# ── Credenciales del proyecto ────────────────────────────────────────────────
if len(sys.argv) < 2:
    raise SystemExit('Uso: python scripts/restablece-password.py <correo>')
EMAIL = sys.argv[1].strip().lower()

env = {}
ruta_env = os.path.join(RAIZ, '.env.local')
if not os.path.exists(ruta_env):
    raise SystemExit('No encuentro .env.local en %s' % RAIZ)
for linea in io.open(ruta_env, encoding='utf-8'):
    linea = linea.strip()
    if '=' in linea and not linea.startswith('#'):
        k, v = linea.split('=', 1)
        env[k.strip()] = v.strip().strip('"')

try:
    URL = env['NEXT_PUBLIC_SUPABASE_URL']
    KEY = env['SUPABASE_SERVICE_ROLE_KEY']
except KeyError as e:
    raise SystemExit('Falta %s en .env.local' % e)

CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
       'Content-Type': 'application/json'}


def pide(path, datos=None, metodo='GET'):
    req = urllib.request.Request(URL + path, headers=dict(CAB), method=metodo)
    if datos is not None:
        req.add_header('Prefer', 'return=representation')
        req.data = json.dumps(datos).encode('utf-8')
    try:
        cuerpo = urllib.request.urlopen(req, timeout=30).read().decode()
        return json.loads(cuerpo) if cuerpo else []
    except urllib.error.HTTPError as e:
        raise SystemExit('Supabase respondio %s: %s' % (e.code, e.read().decode()[:300]))


# ── El usuario ───────────────────────────────────────────────────────────────
us = pide('/rest/v1/usuarios?email=eq.%s&select=id,email,nombre,rol,activo,password_expira' % EMAIL)
if not us:
    raise SystemExit('No existe ningun usuario con el correo %s' % EMAIL)
u = us[0]

print('=== CUENTA ===')
print('  %-16s %s' % ('correo', u['email']))
print('  %-16s %s' % ('nombre', u['nombre']))
print('  %-16s %s' % ('rol', u['rol']))
print('  %-16s %s' % ('activo', u['activo']))
exp = u['password_expira']
if exp:
    venc = datetime.fromisoformat(exp.replace('Z', '+00:00'))
    dias = (venc - datetime.now(timezone.utc)).days
    print('  %-16s %s  (%s)' % ('vence', exp[:10],
                                'vencida hace %d dias' % abs(dias) if dias < 0 else 'faltan %d dias' % dias))
else:
    print('  %-16s sin fecha' % 'vence')

if not u['activo']:
    print()
    print('  OJO: la cuenta esta INACTIVA. Aunque se cambie la contrasena, el')
    print('  login la va a rechazar hasta que alguien la reactive.')

# ── La contrasena nueva ──────────────────────────────────────────────────────
print()
print('Escribe la contrasena nueva. No se ve al teclearla y no queda en el')
print('historial. Minimo 8 caracteres.')
p1 = getpass.getpass('  contrasena nueva : ')
if len(p1) < 8:
    raise SystemExit('Muy corta: minimo 8 caracteres. No se escribio nada.')
p2 = getpass.getpass('  repitela         : ')
if p1 != p2:
    raise SystemExit('No coinciden. No se escribio nada.')

salt = os.urandom(16).hex()
guardado = '%s:%s' % (salt, pbkdf2(p1, salt))

# Antes de tocar la base: comprobar que el login podra validarla.
if not verifica(p1, guardado):
    raise SystemExit('El hash no se valida contra si mismo. No se escribio nada.')

expira = (datetime.now(timezone.utc) + timedelta(days=DIAS_VIGENCIA)).isoformat()
pide('/rest/v1/usuarios?id=eq.%s' % u['id'],
     {'password_hash': guardado, 'password_expira': expira}, 'PATCH')

# Releer de la base y volver a validar, para no confiar en que el PATCH sirvio.
of = pide('/rest/v1/usuarios?id=eq.%s&select=password_hash,password_expira' % u['id'])[0]
ok = verifica(p1, of['password_hash'])

print()
print('=== RESULTADO ===')
print('  contrasena guardada    : %s' % ('si' if ok else '** NO — el hash de la base no valida'))
print('  vence                  : %s  (%d dias)' % (of['password_expira'][:10], DIAS_VIGENCIA))
print('  algoritmo              : PBKDF2-SHA512, %s iteraciones, salt de 16 bytes' % f'{ITERS:,}')
# La lista blanca de lib/auth.ts se evalua en CADA login, aparte de la tabla
# `usuarios`: un correo con fila y contrasena buena pero fuera de la lista se
# rechaza igual. Decir «ya puedes entrar» sin revisarla seria mentir.
en_lista = None
try:
    auth = io.open(os.path.join(RAIZ, 'lib', 'auth.ts'), encoding='utf-8').read()
    en_lista = ("'%s'" % EMAIL) in auth
except OSError:
    pass

print()
if en_lista is False:
    print('  OJO: %s NO aparece en la lista blanca de lib/auth.ts.' % EMAIL)
    print('  El login lo va a rechazar aunque la contrasena sea correcta.')
elif en_lista is None:
    print('  (No pude leer lib/auth.ts para revisar la lista blanca.)')

if ok and en_lista is not False:
    print('  Ya puedes entrar en /acceso con ese correo y esa contrasena.')
elif ok:
    print('  La contrasena quedo bien, pero falta el alta en la lista blanca.')
else:
    print('  Algo fallo. NO vuelvas a correr el script sin revisar antes.')
    raise SystemExit(1)
