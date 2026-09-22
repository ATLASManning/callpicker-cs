# -*- coding: utf-8 -*-
"""Bloquea las actividades SAC vivas cuya cuenta ya NO es cartera viva.

   POR QUE
   -------
   Una actividad de «Completar Perfil» sobre una cuenta que se fue le pide al
   asesor trabajo que no sirve, y ademas le ocupa uno de los 4 espacios de su
   semana. Dirección lo señalo sobre GRUPO HOLTON (F46): «quita o cierra la
   actividad, se encuentra en dormidas, no es cuenta activa».

   COMO, Y POR QUE ASI
   -------------------
   NO se borra. Se pasa a `estado = 'bloqueada'` con el motivo escrito, que es
   como la casa ya cierra estos casos (hay 94 asi; «Campus Residencias» dice
   «Cuenta cancelada»). Borrar perdería el rastro de que la actividad existió y
   por que murio — y la regla de la casa es que a una cuenta muerta se le MARCA,
   no se le quita.

   Tampoco se toca nada mas: ni se genera un reemplazo —eso es el generador de
   los lunes, con su propia autorizacion— ni se cambia el estado de la cuenta.

   ALCANCE
   -------
   No solo Holton: TODA actividad sin completar cuya cuenta este hoy en
   `hibernacion` o `cancelado`. Si se arregla solo la que se reporto, las demas
   siguen ahi y vuelven la semana que viene como «2ª SOLICITUD».

   USO
   ---
       python scripts/bloquea-actividades-dormidas.py            # diagnostica
       python scripts/bloquea-actividades-dormidas.py --aplicar
"""
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APLICAR = '--aplicar' in sys.argv

MUERTAS = ('hibernacion', 'cancelado')
ABIERTAS = ('pendiente', 'en_proceso', 'iniciada')

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


cuentas = rest('cuentas?select=id,cid,consecutivo,empresa,estado,asesor&limit=500')
por_id = dict((c['id'], c) for c in cuentas)
print('cartera: %d cuentas · %d fuera de cartera viva'
      % (len(cuentas), sum(1 for c in cuentas if c['estado'] in MUERTAS)))

act = rest('actividades?completada=eq.false&select=id,cuenta_id,empresa,consecutivo,tipo,'
           'estado,prioridad,asesor,semana_inicio,fecha_vencimiento,motivo_pendiente'
           '&order=semana_inicio.desc&limit=1000')
print('actividades sin completar: %d' % len(act))

# Solo las que siguen VIVAS: una ya bloqueada no se vuelve a bloquear.
obj = []
for a in act:
    if str(a.get('estado')) not in ABIERTAS:
        continue
    c = por_id.get(a.get('cuenta_id'))
    if c and c['estado'] in MUERTAS:
        obj.append((a, c))

print('\n=== ACTIVIDADES VIVAS SOBRE CUENTAS QUE YA NO LO ESTAN ===')
if not obj:
    print('  ninguna — nada que cerrar')
else:
    print('  %-6s %-34s %-12s %-11s %-9s %-11s'
          % ('CONS', 'EMPRESA', 'TIPO', 'ESTADO CTA', 'ASESOR', 'SEMANA'))
    for a, c in obj:
        print('  %-6s %-34s %-12s %-11s %-9s %-11s'
              % (c['consecutivo'], str(a.get('empresa'))[:34], a.get('tipo'),
                 c['estado'], a.get('asesor'), a.get('semana_inicio')))
print('\n  total: %d' % len(obj))

# Que le queda a cada asesor esa semana, para decirlo y no esconderlo.
if obj:
    print('\n=== EFECTO EN LA SEMANA DE CADA ASESOR ===')
    for asesor, semana in sorted(set((str(a.get('asesor')), str(a.get('semana_inicio')))
                                     for a, _ in obj)):
        dela = [a for a in act if str(a.get('asesor')) == asesor
                and str(a.get('semana_inicio')) == semana]
        vivas = [a for a in dela if str(a.get('estado')) in ABIERTAS]
        quedan = len([a for a in vivas
                      if a['id'] not in set(x['id'] for x, _ in obj)])
        print('  %-9s semana %s: %d sin completar -> quedan %d vivas tras cerrar'
              % (asesor, semana, len(vivas), quedan))

if not obj:
    raise SystemExit(0)

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/bloquea-actividades-dormidas.py --aplicar')
    raise SystemExit(0)

print('\n=== CERRANDO ===')
for a, c in obj:
    previo = (a.get('motivo_pendiente') or '').strip()
    motivo = ('Cerrada el 2026-09-22 por instrucción de dirección: la cuenta está en Dormidas '
              '(estado «%s»), no es cartera viva, y una actividad de seguimiento sobre ella le '
              'pide al asesor trabajo que ya no aplica. La actividad NO se borra: queda como '
              'bloqueada para conservar el rastro.' % c['estado'])
    if previo:
        motivo += '\n\nMotivo que ya traía: %s' % previo
    r = rest('actividades?id=eq.%s' % a['id'], 'PATCH',
             {'estado': 'bloqueada', 'motivo_pendiente': motivo})
    assert len(r) == 1, 'se actualizaron %d filas para %s' % (len(r), a['id'])
    print('  %-6s %-34s %s -> bloqueada'
          % (c['consecutivo'], str(a.get('empresa'))[:34], a.get('tipo')))

print('\n=== COMPROBANDO, releyendo de la base ===')
ids = [a['id'] for a, _ in obj]
rel = rest('actividades?id=in.(%s)&select=id,empresa,estado,completada,motivo_pendiente'
           % ','.join(ids))
mal = [x for x in rel if x['estado'] != 'bloqueada']
for x in rel:
    print('  %-34s estado=%-11s completada=%s'
          % (str(x['empresa'])[:34], x['estado'], x['completada']))
assert not mal, '%d no quedaron bloqueadas' % len(mal)
assert all((x.get('motivo_pendiente') or '').strip() for x in rel), 'alguna quedo sin motivo'

# Y que no se haya tocado nada de mas.
sigue = rest('actividades?completada=eq.false&estado=in.(%s)&select=id' % ','.join(ABIERTAS))
print('\n  actividades vivas que quedan en total: %d (antes %d)'
      % (len(sigue), len([a for a in act if str(a.get('estado')) in ABIERTAS])))
print('  todas con motivo escrito  OK')
