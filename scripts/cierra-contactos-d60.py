"""Cierra los contactos de D60 — Supreme Resources Mexico.

   Direccion instruyo cerrarlos. Lo que esta establecido y lo que no:

   SI: Oscar Zamora y Gerardo Gomez son los interlocutores de la cuenta. Sus
       correos los aporto direccion el 14 sep 2026 diciendo «son de ellos,
       acaban de tener una reunion». El dominio @sunshine-delivers.com se
       verifico contra la fuente: el sitio declara «Sunshine Delivers is a
       project by Supreme Resources», con el mismo domicilio y telefono.

   NO: el cargo de ninguno de los dos. La minuta de esa reunion no llego a este
       chat, asi que no hay de donde sacarlo. Los nombres mismos se leyeron del
       buzon (oscar.zamora -> Oscar Zamora), que es una lectura razonable pero
       no un dato confirmado.

   Que hace este script:
     · deja a los dos interlocutores al frente, marcados como lo que son
     · baja los siete nombres del directorio publico a una seccion aparte: no
       son interlocutores, son gente identificada en fuentes abiertas, y
       mezclarlos con los reales hace que el asesor no sepa a quien llamar
     · NO inventa un contacto principal. Con dos candidatos y sin minuta, elegir
       uno seria fabricar una jerarquia. El hueco queda dicho en notas.
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

INTERLOCUTOR = 'Interlocutor de la cuenta · reunión sep 2026 · cargo sin confirmar'
DIRECTORIO = 'Directorio público — NO es interlocutor · cargo sin confirmar'

CONTACTOS = [
    {'nombre': 'Oscar Zamora',  'cargo': INTERLOCUTOR,
     'email': 'oscar.zamora@sunshine-delivers.com',  'tel': ''},
    {'nombre': 'Gerardo Gómez', 'cargo': INTERLOCUTOR,
     'email': 'gerardo.gomez@sunshine-delivers.com', 'tel': ''},
    {'nombre': 'Conmutador general', 'cargo': 'Línea y correo generales — no es una persona',
     'email': 'info@supremeresources.com.mx', 'tel': '55 8854 4330'},
    {'nombre': 'Eduardo Díaz Landa',           'cargo': DIRECTORIO, 'email': '', 'tel': ''},
    {'nombre': 'Marielle Ruiz Olivera',        'cargo': DIRECTORIO, 'email': '', 'tel': ''},
    {'nombre': 'Fernando Vidauri Díaz',        'cargo': DIRECTORIO, 'email': '', 'tel': ''},
    {'nombre': 'Sandra Patricia de Paz Miguel',
     'cargo': 'Directorio público — figura en el registro mercantil CDMX 2025 del domicilio',
     'email': '', 'tel': ''},
    {'nombre': 'Juan Luis Scarpio',
     'cargo': 'Directorio público — perfil de desarrollo de negocio · sin confirmar', 'email': '', 'tel': ''},
    {'nombre': 'Itzel CE',                     'cargo': DIRECTORIO, 'email': '', 'tel': ''},
    {'nombre': 'Javier Martínez',
     'cargo': 'Directorio público — perfil de Supply Chain · sin confirmar', 'email': '', 'tel': ''},
]

PARCHE = {'contactos_json': CONTACTOS}

print('=== CIERRE DE CONTACTOS D60 ===')
print('  interlocutores reales : 2')
print('  línea general         : 1')
print('  directorio público    : 7')
print()
for c in CONTACTOS[:3]:
    print('  %-22s %-38s %s' % (c['nombre'], c['email'] or '—', c['cargo'][:44]))

if '--escribir' not in sys.argv:
    print()
    print('SIMULACION. Nada escrito.')
    raise SystemExit(0)

r = urllib.request.Request(URL + '/rest/v1/cuentas?id=eq.' + ID,
                           data=json.dumps(PARCHE).encode(),
                           headers=dict(H, **{'Prefer': 'return=representation'}), method='PATCH')
c = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())[0]
print()
print('=== QUEDO ASI ===')
for x in c['contactos_json']:
    print('  %-30s %-38s %s' % (x['nombre'], x['email'] or '—', x['cargo'][:46]))
