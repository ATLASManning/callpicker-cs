"""Designa el contacto principal de D60 — Supreme Resources Mexico.

   Direccion confirmo el 14 sep 2026: Oscar Zamora, Direccion de Operaciones.
   Ese era el unico hueco que impedia cerrar los contactos.

   Se llenan los cuatro campos del bloque principal porque lib/data-gaps.ts los
   pide por separado y marca cada uno como hueco CRITICO. El telefono directo
   sigue sin capturarse y se deja en null a proposito: el detector tiene que
   seguir pidiendolo, no taparlo con el conmutador general.

   El cargo de Gerardo Gomez sigue sin confirmar y asi se queda escrito.
"""
import sys, io, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}
ID = '26a15fd8-92b2-4c3c-a9ca-a6045e9bb096'

r = urllib.request.Request(URL + '/rest/v1/cuentas?select=contactos_json,observaciones_kam,notas&id=eq.' + ID,
                           headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
act = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())[0]

CONTACTOS = []
for c in act['contactos_json']:
    if c['nombre'] == 'Oscar Zamora':
        c = dict(c, cargo='Dirección de Operaciones · contacto principal')
    elif c['nombre'] == 'Gerardo Gómez':
        c = dict(c, cargo='Interlocutor de la cuenta · reunión sep 2026 · cargo sin confirmar')
    CONTACTOS.append(c)

BLOQUE = """

INTERLOCUTOR. Oscar Zamora, Dirección de Operaciones — confirmado por dirección
el 14 sep 2026. Es el contacto correcto para esta cuenta y no por jerarquía:
la conversación pendiente es por qué una operación con flota en la calle y
catorce áreas internas consume 39 de 400 minutos, y quien puede responder eso
es quien manda la operación, no compras ni finanzas. Llegar con el reporte de
llamadas por destino y preguntarle por dónde están pasando hoy.
Gerardo Gómez es el segundo contacto; su cargo sigue sin confirmar."""

NOTAS = act['notas'].replace(
    """· CONTACTO PRINCIPAL: sin designar. Hay dos candidatos; la minuta debe decir
  quién lleva la relación antes de fijarlo.""",
    """· TELÉFONO DIRECTO del contacto principal: SIN CAPTURAR. Hay correo pero no
  línea directa; el conmutador general no cuenta. Pedirlo en el próximo contacto.
· CARGO de Gerardo Gómez: sin confirmar.""",
).replace(
    """· CARGOS: SIN CONFIRMAR. Hay dos interlocutores con correo corporativo (Oscar
  Zamora y Gerardo Gómez, aportados por dirección) y siete personas más
  identificadas públicamente, pero de ninguna se conoce el puesto. Los nombres
  de esos dos se leyeron del buzón (oscar.zamora → Oscar Zamora): confirmarlos
  en la minuta.""",
    """· CONTACTO PRINCIPAL: Oscar Zamora, Dirección de Operaciones — confirmado por
  dirección el 14 sep 2026. Las otras siete personas del expediente vienen de
  fuentes públicas, NO son interlocutores y su cargo sigue sin confirmar.""",
)

PARCHE = {
    'contacto_nombre': 'Oscar Zamora',
    'contacto_cargo':  'Dirección de Operaciones',
    'contacto_email':  'oscar.zamora@sunshine-delivers.com',
    # contacto_tel se deja fuera: no hay línea directa y el detector de huecos
    # debe seguir pidiéndola.
    'contactos_json':  CONTACTOS,
    'observaciones_kam': act['observaciones_kam'].rstrip() + BLOQUE,
    'notas': NOTAS,
}

print('=== CONTACTO PRINCIPAL D60 ===')
for k in ('contacto_nombre', 'contacto_cargo', 'contacto_email'):
    print('  %-18s %s' % (k, PARCHE[k]))
print('  %-18s (sin capturar — sigue como hueco crítico)' % 'contacto_tel')
print()
print('  notas actualizadas: %s' % ('sí' if NOTAS != act['notas'] else '** NO cambiaron, revisar el texto buscado'))

if '--escribir' not in sys.argv:
    print()
    print('SIMULACION. Nada escrito.')
    raise SystemExit(0)

rq = urllib.request.Request(URL + '/rest/v1/cuentas?id=eq.' + ID,
                            data=json.dumps(PARCHE).encode(),
                            headers=dict(H, **{'Prefer': 'return=representation'}), method='PATCH')
c = json.loads(urllib.request.urlopen(rq, timeout=60).read().decode())[0]
print()
print('=== QUEDO ASI ===')
print('  principal : %s · %s · %s' % (c['contacto_nombre'], c['contacto_cargo'], c['contacto_email']))
print('  teléfono  : %s' % (c['contacto_tel'] or '(sigue sin capturar)'))
for x in c['contactos_json'][:3]:
    print('  %-22s %s' % (x['nombre'], x['cargo'][:52]))
