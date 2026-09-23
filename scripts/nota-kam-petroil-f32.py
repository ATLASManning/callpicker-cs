# -*- coding: utf-8 -*-
"""Asienta en F32 quién lleva realmente la relación con Grupo Petroil.

   POR QUÉ IMPORTA
   ---------------
   La ficha decía, sin decirlo, algo falso. F32 factura $14,197 al mes, tiene
   300 sitios en 24 estados y CERO tickets. Leído desde el tablero eso parece
   una cuenta apagada; es justo lo contrario: no pasa por la mesa de ayuda
   porque dirección la atiende directo, todos los días, por teléfono y
   WhatsApp con el Jefe de Infraestructura.

   Sin esta nota, el siguiente que abra la ficha —o el próximo análisis
   automático— vuelve a leer «0 tickets» como silencio del cliente. Ya me pasó
   a mí hace diez minutos.

   QUÉ NO CAMBIA
   -------------
   El asesor. La cuenta sigue asignada a Dan en la cartera, que es lo que
   dirección instruyó hoy. KAM y asesor de cartera son dos cosas distintas y
   `cuentas` solo tiene campo para la segunda: por eso la primera se escribe
   en la bitácora, donde se lee, en vez de falsearla en `asesor`.

   USO
   ---
       python scripts/nota-kam-petroil-f32.py            # diagnostica
       python scripts/nota-kam-petroil-f32.py --aplicar
"""
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, 'scripts'))
from observaciones_kam import anteponer_entrada   # noqa: E402

APLICAR = '--aplicar' in sys.argv
FECHA = '2026-09-22'
CONSECUTIVO = 'F32'

_env = {}
for _ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    _ln = _ln.strip()
    if _ln and not _ln.startswith('#') and '=' in _ln:
        _k, _v = _ln.split('=', 1)
        _env[_k.strip()] = _v.strip().strip('"').strip("'")
URL = _env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
KEY = _env['SUPABASE_SERVICE_ROLE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer %s' % KEY,
     'Content-Type': 'application/json', 'Prefer': 'return=representation'}


def rest(ruta, metodo='GET', cuerpo=None):
    req = urllib.request.Request(
        URL + '/rest/v1/' + ruta,
        data=json.dumps(cuerpo).encode('utf-8') if cuerpo is not None else None,
        headers=H, method=metodo)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode('utf-8')
    return json.loads(t) if t.strip() else None


c = rest('cuentas?consecutivo=eq.%s&select=*' % CONSECUTIVO)[0]
print('=== %s · %s ===' % (c['consecutivo'], c['empresa']))
print('  asesor de cartera : %s' % c['asesor'])
print('  estado            : %s · HS %s' % (c['estado'], c['health_score']))
print('  facturación       : $%s' % '{:,.2f}'.format(float(c['facturacion'] or 0)))
print('\n=== CAMPOS DE RELACIÓN, COMO ESTÁN HOY ===')
for k in ('ultimo_contacto', 'proximo_contacto', 'fecha_ultima_llamada', 'dias_sin_actividad'):
    v = c.get(k)
    print('  %-22s %s' % (k, 'VACÍO' if v in (None, '', 0) else v))

NOTA = (
    'QUIÉN LLEVA ESTA CUENTA, EN LA PRÁCTICA. José Manuel López Delgadillo fue el vendedor y '
    'es el KAM de Grupo Petroil. La tiene en monitoreo diario y mantiene comunicación directa '
    'por teléfono y WhatsApp con el **Ing. Jesús Javier Rodríguez Méndez, Jefe de '
    'Infraestructura** (jerodriguez@petroil.com.mx · 66 9985 1044).\n\n'
    'CÓMO SE ATIENDE. Cualquier solicitud que llegue de alguien distinto al Ing. Javier se le '
    'reporta a José Manuel dentro de Callpicker, y él cierra la pinza con el Ing. El canal es '
    'uno solo y pasa por el mismo interlocutor.\n\n'
    'CÓMO LEER SUS CERO TICKETS. NO es una cuenta apagada: $14,197 al mes, 300 puntos en 24 '
    'estados y ni un ticket precisamente porque NO pasa por la mesa de ayuda. Cualquier '
    'análisis que trate «0 tickets» como falta de actividad está leyendo mal esta cuenta. '
    '(El 22 sep 2026 lo leí mal yo mismo y lo reporté como hueco de datos.)\n\n'
    'LO QUE SÍ ES UN HUECO REAL, Y SIGUE ABIERTO. El CID 146201 no aparece en el archivo de '
    'cortes de facturación: no hay medición de consumo, minutos ni extensiones para esta '
    'cuenta. Los $14,197 salen del campo guardado, no de un corte. Eso no lo explica el modelo '
    'de atención y hay que averiguarlo.\n\n'
    'ASESOR DE CARTERA vs KAM. La cuenta está asignada a Dan desde hoy, por instrucción de '
    'dirección, y así se queda. `cuentas` solo tiene campo para el asesor de cartera; que el '
    'KAM sea otro se registra aquí en vez de falsear ese campo.'
)

print('\n=== NOTA QUE SE VA A ANTEPONER ===')
for l in NOTA.split('\n'):
    print('  %s' % l[:104])

cuerpo = {'observaciones_kam': anteponer_entrada(c.get('observaciones_kam'), NOTA, 'sistema', FECHA)}

# El tablero mostraba la relación como vacía teniendo contacto diario. Se
# corrige con lo que dirección acaba de declarar, no con una suposición.
if not (c.get('ultimo_contacto') or '').strip():
    cuerpo['ultimo_contacto'] = FECHA
    print('\n  `ultimo_contacto` estaba VACÍO y hay contacto diario declarado: se pone %s' % FECHA)

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/nota-kam-petroil-f32.py --aplicar')
    raise SystemExit(0)

r = rest('cuentas?id=eq.%s' % c['id'], 'PATCH', cuerpo)
assert len(r) == 1, 'se actualizaron %d filas' % len(r)

print('\n=== COMPROBANDO, releyendo de la base ===')
d = rest('cuentas?consecutivo=eq.%s&select=consecutivo,empresa,asesor,ultimo_contacto,'
         'observaciones_kam' % CONSECUTIVO)[0]
print('  %s · %s · asesor %s · último contacto %s'
      % (d['consecutivo'], d['empresa'], d['asesor'], d['ultimo_contacto']))
texto = str(d['observaciones_kam'])
for esperado in ('KAM de Grupo Petroil', 'Ing. Jesús Javier Rodríguez Méndez',
                 'cierra la pinza', 'NO pasa por la mesa de ayuda', 'no aparece en el archivo de'):
    print('  contiene «%-38s»: %s' % (esperado[:38], 'sí' if esperado in texto else 'NO — REVISAR'))
assert d['asesor'] == 'Dan', 'el asesor no debía cambiar'
print('\n  El asesor sigue siendo Dan: la nota no lo toca.')
