# -*- coding: utf-8 -*-
"""Que actividades estan esperando el Vobo, y cerrar las que direccion autorice.

   POR QUE EXISTE
   --------------
   Jose Manuel, 25 sep 2026: «con que me lo pase a mi Daniel o el asesor con el
   Vobo. Yo te dare la instruccion de dar por concluida la actividad.»

   El Mapa de Decisores exige DOS personas con nombre y cargo en la ficha, y que
   se declare quien DECIDE. Hay cuentas donde de verdad decide una sola persona
   —un dueno, una empresa de tres—. Para esas el asesor marca «solo existe un
   decisor» y eso NO cierra nada: registra la investigacion y deja la actividad
   abierta, esperando. El Vobo de Daniel y la instruccion de cierre viajan fuera
   del tablero; este script es el puente.

   Sin el, la solicitud quedaria enterrada en un campo de texto y nadie se
   enteraria. Una cola de autorizacion que nadie puede consultar no es una cola,
   es un agujero.

   USO
   ---
       python scripts/autorizaciones.py                 # lista lo que espera
       python scripts/autorizaciones.py --ver <id>      # la investigacion completa
       python scripts/autorizaciones.py --cerrar <id>   # ejecuta la instruccion

   `--cerrar` ESCRIBE en Supabase: marca la actividad completada con el sello de
   autorizacion, crea el seguimiento y actualiza `ultimo_contacto`, que es lo
   mismo que hace la ruta de cierre. Pide confirmacion escrita antes de tocar
   nada. Sin `--cerrar`, el script es de SOLO LECTURA.
"""
import io
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARCA = 'AUTORIZACIÓN PENDIENTE'
# Mexico va en UTC-6 todo el ano. Vercel corre en UTC: `datetime.now()` sin huso
# adelanta el dia despues de las 18:00 locales. Ver lib/fecha-local.ts.
MEXICO = timezone(timedelta(hours=-6))

E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'],
     'Content-Type': 'application/json'}
B = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def sb(tabla, params):
    f, o = [], 0
    while True:
        r = urllib.request.Request(B + tabla + '?' + params + '&offset=%d&limit=1000' % o, headers=H)
        d = json.load(urllib.request.urlopen(r, timeout=60))
        f += d
        if len(d) < 1000:
            return f
        o += 1000


def patch(tabla, filtro, cuerpo):
    r = urllib.request.Request(B + tabla + '?' + filtro, method='PATCH',
                               data=json.dumps(cuerpo).encode('utf-8'),
                               headers=dict(H, Prefer='return=representation'))
    return json.load(urllib.request.urlopen(r, timeout=60))


def post(tabla, cuerpo):
    r = urllib.request.Request(B + tabla, method='POST',
                               data=json.dumps(cuerpo).encode('utf-8'),
                               headers=dict(H, Prefer='return=representation'))
    return json.load(urllib.request.urlopen(r, timeout=60))


def pendientes():
    act = sb('actividades', 'select=id,asesor,empresa,consecutivo,cuenta_id,tipo,descripcion,'
                            'motivo_pendiente,tiempo_reportado_min,completada,actualizado_en')
    return [a for a in act
            if not a.get('completada')
            and str(a.get('motivo_pendiente') or '').startswith('[' + MARCA)]


def nota_de(a):
    t = str(a.get('motivo_pendiente') or '')
    i = t.find('\n\n')
    return t[i + 2:] if i != -1 else ''


args = sys.argv[1:]

# ── ver una ──────────────────────────────────────────────────────────
if '--ver' in args:
    idx = args[args.index('--ver') + 1]
    got = [a for a in pendientes() if a['id'].startswith(idx)]
    if not got:
        sys.exit('No hay ninguna solicitud pendiente cuyo id empiece por %s' % idx)
    a = got[0]
    print('=' * 72)
    print('%s · %s (%s) · asesor %s' % (a['id'], a['empresa'], a.get('consecutivo'), a['asesor']))
    print('=' * 72)
    print()
    print('LA TAREA QUE SE LE PIDIO:')
    print('  ' + str(a.get('descripcion') or '').split('\n')[0])
    print()
    print('LO QUE ENTREGO:')
    for ln in nota_de(a).split('\n'):
        print('  ' + ln)
    print()
    print('Tiempo reportado: %s min' % a.get('tiempo_reportado_min'))
    print()
    print('Para cerrarla:  python scripts/autorizaciones.py --cerrar %s' % a['id'][:8])
    sys.exit(0)

# ── cerrar una ───────────────────────────────────────────────────────
if '--cerrar' in args:
    idx = args[args.index('--cerrar') + 1]
    got = [a for a in pendientes() if a['id'].startswith(idx)]
    if not got:
        sys.exit('No hay ninguna solicitud pendiente cuyo id empiece por %s' % idx)
    if len(got) > 1:
        sys.exit('Ese prefijo coincide con %d solicitudes. Usa mas caracteres del id.' % len(got))
    a = got[0]
    quien = args[args.index('--cerrar') + 2] if len(args) > args.index('--cerrar') + 2 else ''
    if not quien or '@' not in quien:
        quien = 'josel@callpicker.com'

    print('Se va a CERRAR esta actividad:')
    print('  %s · %s (%s) · asesor %s' % (a['id'], a['empresa'], a.get('consecutivo'), a['asesor']))
    print('  autoriza: %s' % quien)
    print()
    print('LO QUE ENTREGO EL ASESOR:')
    for ln in nota_de(a).split('\n'):
        print('  ' + ln)
    print()
    print('Esto marca la actividad como completada y crea el seguimiento en la')
    print('cuenta. No se puede deshacer desde aqui.')
    resp = input('Escribe CERRAR para confirmar: ').strip()
    if resp != 'CERRAR':
        sys.exit('Cancelado. No se toco nada.')

    hoy = datetime.now(MEXICO).strftime('%Y-%m-%d')
    sello = ('AUTORIZADO por Daniel Martínez (%s) el %s — cierre con un solo decisor identificado.'
             % (quien, hoy))
    resultado = sello + '\n\n' + nota_de(a)

    patch('actividades', 'id=eq.' + a['id'], {
        'completada': True,
        'estado': 'completada',
        'resultado': resultado,
        'motivo_pendiente': None,
        'actualizado_en': datetime.now(timezone.utc).isoformat(),
    })
    if a.get('cuenta_id'):
        post('seguimientos', {
            'cuenta_id': a['cuenta_id'],
            'fecha': hoy,
            'tipo': 'nota',
            'descripcion': str(a.get('descripcion') or '')[:500],
            'resultado': resultado,
            'asesor': a.get('asesor'),
            'duracion_min': a.get('tiempo_reportado_min'),
        })
        patch('cuentas', 'id=eq.' + a['cuenta_id'], {'ultimo_contacto': hoy})
    print()
    print('Cerrada. El sello de autorizacion quedo dentro del resultado.')
    sys.exit(0)

# ── listar ───────────────────────────────────────────────────────────
p = pendientes()
print('=== ACTIVIDADES ESPERANDO TU INSTRUCCION DE CIERRE ===')
print()
if not p:
    print('  Ninguna. No hay solicitudes de cierre con un solo decisor.')
    print()
    print('  (Aparecen aqui cuando un asesor investiga una cuenta, concluye que')
    print('   de verdad decide una sola persona y lo sustenta. El sistema NO la')
    print('   cierra: la deja esperando el Vobo de Daniel y tu instruccion.)')
    sys.exit(0)

print('  %-10s %-11s %-28s %-9s %s' % ('ID', 'ASESOR', 'CUENTA', 'REPORTA', 'DECIDE'))
for a in sorted(p, key=lambda x: str(x.get('actualizado_en') or '')):
    nota = nota_de(a)
    decide = ''
    for ln in nota.split('\n'):
        if ln.startswith('DECIDE:'):
            decide = ln[7:].strip()
            break
    print('  %-10s %-11s %-28s %-9s %s'
          % (a['id'][:8], a['asesor'], a['empresa'][:28],
             '%s min' % a.get('tiempo_reportado_min'), decide[:40]))
print()
print('  %d solicitud(es).' % len(p))
print()
print('  Ver la investigacion completa:  python scripts/autorizaciones.py --ver <id>')
print('  Dar por concluida:              python scripts/autorizaciones.py --cerrar <id>')
