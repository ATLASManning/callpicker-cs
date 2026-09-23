# -*- coding: utf-8 -*-
"""Cierra la actividad de Fátima sobre F32 y la cambia por otra cuenta suya.

   POR QUÉ
   -------
   F32 Petroil pasó hoy a Dan. La actividad de «Completar Perfil» de la semana
   del 21 de septiembre seguía con Fátima, así que le pedía trabajo sobre una
   cuenta que ya no es suya. Dirección: «quita la actividad a Fátima de F32 y
   cámbiala por otra».

   CÓMO SE ELIGE LA NUEVA
   ----------------------
   NO se reimplementa la selección del generador —huecos de perfil, Radar,
   carry-over, dedup de 8 semanas—: duplicarla es garantizar que un día las dos
   copias digan cosas distintas. Esto es un reemplazo manual, puntual y por
   instrucción, y se elige con la regla de negocio que dirección ya fijó: **el
   orden lo manda el riesgo**. De las cuentas elegibles de Fátima se toma la de
   menor Health Score, y a igual score la de mayor facturación.

   Se respetan las compuertas que sí son reglas duras:
     · estado activo o en_riesgo (una cuenta muerta no recibe actividades)
     · que no tenga ya una actividad esta semana
     · que Fátima no la haya trabajado en las últimas 8 semanas
     · contacto localizable, porque sin interlocutor la actividad nace muerta

   La actividad nueva dice EN SU TEXTO que es un reemplazo y por qué. Nadie
   debe encontrársela el lunes sin saber de dónde salió.

   USO
   ---
       python scripts/reemplaza-actividad-f32.py            # diagnostica
       python scripts/reemplaza-actividad-f32.py --aplicar
"""
import datetime
import io
import json
import os
import sys
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

APLICAR = '--aplicar' in sys.argv
ASESOR = 'Fátima'
SEMANA = '2026-09-21'
VENCE = '2026-09-25'
HOY = '2026-09-22'
CONSECUTIVO_FUERA = 'F32'
VIVAS = ('activo', 'en_riesgo')
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


def lleno(v):
    s = str(v or '').strip().lower()
    return bool(s) and s not in ('n/a', 'na', 'pendiente', 'tbd', '-', '0', 'none', 'null')


# ══════════════════════════════════════════════════════════════════════════
#  1 · La actividad que sale
# ══════════════════════════════════════════════════════════════════════════
sem = rest('actividades?asesor=eq.%s&semana_inicio=eq.%s&select=id,cuenta_id,consecutivo,'
           'empresa,tipo,estado,completada,prioridad&order=consecutivo'
           % (urllib.parse.quote(ASESOR), SEMANA))
print('=== LA SEMANA DE %s (%s) ===' % (ASESOR, SEMANA))
for a in sem:
    print('  %-5s %-36s %-12s %-11s completada=%s'
          % (a.get('consecutivo'), str(a.get('empresa'))[:36], a['tipo'], a['estado'], a['completada']))
vivas = [a for a in sem if a['estado'] in ABIERTAS]
print('  %d actividades · %d vivas' % (len(sem), len(vivas)))

fuera = [a for a in sem if str(a.get('consecutivo')) == CONSECUTIVO_FUERA
         and a['estado'] in ABIERTAS]
if not fuera:
    print('\n  La actividad de %s ya no está viva: nada que quitar.' % CONSECUTIVO_FUERA)
    raise SystemExit(0)
assert len(fuera) == 1, 'hay %d actividades vivas de %s' % (len(fuera), CONSECUTIVO_FUERA)
saliente = fuera[0]

# ══════════════════════════════════════════════════════════════════════════
#  2 · La candidata que entra
# ══════════════════════════════════════════════════════════════════════════
cuentas = rest('cuentas?asesor=eq.%s&select=id,consecutivo,cid,empresa,estado,health_score,'
               'facturacion,dias_sin_actividad,contacto_nombre,contacto_email,contacto_tel,'
               'contacto_cargo&limit=500' % urllib.parse.quote(ASESOR))
print('\n=== CARTERA DE %s: %d cuentas ===' % (ASESOR, len(cuentas)))

ya_esta_semana = set(a['cuenta_id'] for a in sem if a.get('cuenta_id'))

hace8 = (datetime.date(2026, 9, 21) - datetime.timedelta(days=56)).isoformat()
recientes = rest('actividades?asesor=eq.%s&tipo=eq.validacion&semana_inicio=gte.%s'
                 '&semana_inicio=lt.%s&select=cuenta_id,semana_inicio'
                 % (urllib.parse.quote(ASESOR), hace8, SEMANA)) or []
trabajadas = set(r['cuenta_id'] for r in recientes if r.get('cuenta_id'))
print('  trabajadas por %s en las últimas 8 semanas: %d' % (ASESOR, len(trabajadas)))

descartes = {'no viva': 0, 'ya tiene esta semana': 0, 'trabajada <8 semanas': 0, 'sin contacto': 0}
candidatas = []
for c in cuentas:
    if c['estado'] not in VIVAS:
        descartes['no viva'] += 1; continue
    if c['id'] in ya_esta_semana:
        descartes['ya tiene esta semana'] += 1; continue
    if c['id'] in trabajadas:
        descartes['trabajada <8 semanas'] += 1; continue
    if not (lleno(c.get('contacto_nombre')) and lleno(c.get('contacto_email'))
            and lleno(c.get('contacto_tel'))):
        descartes['sin contacto'] += 1; continue
    candidatas.append(c)

print('  descartadas: %s' % descartes)
print('  candidatas  : %d' % len(candidatas))
assert len(candidatas) + sum(descartes.values()) == len(cuentas), 'la cuenta no cierra'
print('  cierre: %d candidatas + %d descartadas = %d  OK'
      % (len(candidatas), sum(descartes.values()), len(cuentas)))

if not candidatas:
    raise SystemExit('No hay ninguna cuenta elegible para reemplazar. No se inventa una.')

# El orden lo manda el riesgo: menor Health Score primero; a igual score, la
# que más factura, porque ahí la pérdida pesa más.
candidatas.sort(key=lambda c: (c['health_score'], -float(c['facturacion'] or 0)))
print('\n=== LAS 6 DE MAYOR RIESGO ===')
print('  %-5s %-36s %-11s %4s %12s %s' % ('#', 'EMPRESA', 'ESTADO', 'HS', 'FACT.', 'DÍAS S/ACT'))
for c in candidatas[:6]:
    print('  %-5s %-36s %-11s %4s %12s %s'
          % (c['consecutivo'], c['empresa'][:36], c['estado'], c['health_score'],
             '{:,.0f}'.format(float(c['facturacion'] or 0)), c.get('dias_sin_actividad')))
nueva = candidatas[0]
print('\n  ENTRA: %s · %s (HS %s)' % (nueva['consecutivo'], nueva['empresa'], nueva['health_score']))

hs = nueva['health_score']
semaforo = ('verde' if hs >= 80 else 'azul' if hs >= 60 else 'amarillo' if hs >= 40
            else 'naranja' if hs >= 20 else 'rojo')

DESC = (
    '[REEMPLAZO — sustituye a Petroil - Corp de Estaciones (F32)]\n\n'
    'TU CUENTA ESTA SEMANA — %s\n\n'
    'F32 pasó a la cartera de Dan el 22 de septiembre por instrucción de dirección, así que su '
    'actividad dejó de tener sentido para ti. Esta la reemplaza: se eligió por ser la cuenta '
    'tuya con mayor riesgo que no tiene actividad esta semana ni se ha trabajado en las últimas '
    '8 semanas (Health Score %s, facturación $%s).\n\n'
    'QUÉ HAY QUE HACER. Lo mismo que en la que sustituye: completar el perfil de la cuenta y el '
    'Radar. Deja capturado el contacto con nombre, cargo, teléfono y correo, y responde las '
    'preguntas del Radar que sigan en blanco. No es una tarea del tablero: es un cliente que hoy '
    'no tiene a nadie más viendo por él.'
    % (nueva['empresa'], hs, '{:,.0f}'.format(float(nueva['facturacion'] or 0)))
)

FILA = {
    'asesor': ASESOR,
    'cuenta_id': nueva['id'],
    'cid': nueva['cid'],
    'consecutivo': nueva['consecutivo'],
    'empresa': nueva['empresa'],
    'tipo': 'validacion',
    'descripcion': DESC,
    'prioridad': 'alta',
    'fecha_programada': SEMANA,
    'fecha_vencimiento': VENCE,
    'semana_inicio': SEMANA,
    'estado': 'pendiente',
    'completada': False,
    'semaforo_cuenta': semaforo,
    'hs_cuenta': hs,
}

print('\n=== LA FILA QUE SE CREARÍA ===')
for k in ('asesor', 'consecutivo', 'empresa', 'tipo', 'prioridad', 'semana_inicio',
          'fecha_vencimiento', 'estado', 'semaforo_cuenta', 'hs_cuenta'):
    print('  %-20s %s' % (k, FILA[k]))

if not APLICAR:
    print('\n  (diagnostico; no se escribio nada)')
    print('  Para aplicar:  python scripts/reemplaza-actividad-f32.py --aplicar')
    raise SystemExit(0)

# ══════════════════════════════════════════════════════════════════════════
#  3 · Aplicar
# ══════════════════════════════════════════════════════════════════════════
print('\n=== APLICANDO ===')
motivo = ('Cerrada el %s por instrucción de dirección. La cuenta F32 Petroil - Corp de '
          'Estaciones pasó a la cartera de Dan ese mismo día, así que esta actividad le pedía '
          'a %s trabajo sobre una cuenta que ya no es suya. Se sustituye por %s · %s. '
          'La actividad NO se borra: queda bloqueada para conservar el rastro.'
          % (HOY, ASESOR, nueva['consecutivo'], nueva['empresa']))
r = rest('actividades?id=eq.%s' % saliente['id'], 'PATCH',
         {'estado': 'bloqueada', 'motivo_pendiente': motivo})
assert len(r) == 1, 'no se cerró la saliente'
print('  cerrada  : %-5s %s' % (saliente.get('consecutivo'), saliente.get('empresa')))

r2 = rest('actividades', 'POST', FILA)
assert len(r2) == 1, 'se crearon %d filas' % len(r2)
print('  creada   : %-5s %s  (id %s)' % (nueva['consecutivo'], nueva['empresa'], r2[0]['id']))

# La casa deja rastro de cada alta en actividades_audit; este reemplazo también.
try:
    rest('actividades_audit', 'POST', {
        'asesor': ASESOR, 'semana_inicio': SEMANA, 'cuenta_id': nueva['id'],
        'empresa': nueva['empresa'], 'cid': nueva['cid'], 'accion': 'creado', 'codigo': None,
        'motivo': 'Reemplazo manual por instrucción de dirección: F32 cambió de asesor',
        'estatus_detectado': nueva['estado'], 'creado_en': HOY + 'T00:00:00+00:00',
    })
    print('  auditada : sí')
except Exception as e:
    print('  auditada : NO (%s) — la actividad sí se creó' % e)

print('\n=== COMPROBANDO, releyendo de la base ===')
sem2 = rest('actividades?asesor=eq.%s&semana_inicio=eq.%s&select=consecutivo,empresa,tipo,'
            'estado,completada&order=consecutivo' % (urllib.parse.quote(ASESOR), SEMANA))
for a in sem2:
    print('  %-5s %-36s %-12s %s' % (a.get('consecutivo'), str(a.get('empresa'))[:36],
                                     a['tipo'], a['estado']))
vivas2 = [a for a in sem2 if a['estado'] in ABIERTAS]
print('\n  vivas: %d (antes %d)' % (len(vivas2), len(vivas)))
assert not any(str(a.get('consecutivo')) == CONSECUTIVO_FUERA and a['estado'] in ABIERTAS
               for a in sem2), 'F32 sigue viva'
assert any(str(a.get('consecutivo')) == nueva['consecutivo'] and a['estado'] == 'pendiente'
           for a in sem2), 'la nueva no quedó pendiente'
print('  F32 fuera y %s dentro  OK' % nueva['consecutivo'])
