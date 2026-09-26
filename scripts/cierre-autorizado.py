# -*- coding: utf-8 -*-
"""Cierre administrativo de actividades atrapadas por el defecto del boton.

   POR QUE EXISTE
   --------------
   Hasta el 26 de septiembre de 2026, una actividad que vencia SIN haberse
   iniciado quedaba muerta: el auto-vencimiento la pasaba a `bloqueada`, el boton
   «Iniciar actividad» estaba deshabilitado justo para ese estado, y el
   formulario de tiempo y observacion solo aparecia si habia `iniciada_en`. No se
   podia completar NI justificar. Lo reporto Claudia y era cierto.

   El defecto ya esta corregido, pero las que quedaron atrapadas siguen contando
   como incumplimiento. Direccion autoriza cerrarlas:

       «Actividad concluida fuera del calendario, autorizo Daniel Martinez»

   QUE HACE Y QUE NO HACE
   ----------------------
   SI: marca la actividad completada, con un resultado que dice por que se cerro
       asi, quien lo autorizo, y el estado VERIFICABLE de la cuenta en ese
       momento. Nada de texto generico: si el Radar estaba en 6 de 12, eso queda
       escrito.

   NO: **no crea el seguimiento** que el cierre normal genera, y no toca
       `ultimo_contacto`. Un cierre administrativo NO es una conversacion con el
       cliente. Registrarlo como tal falsearia la señal que mas predice la baja
       —de las cuentas sin seguimiento se fue el 28% contra el 13%— justo para
       maquillar un numero. La actividad se cierra; la relacion con el cliente
       sigue diciendo la verdad.

   NO: no inventa tiempo. `tiempo_reportado_min` y `tiempo_medido_min` quedan en
       cero, que es lo que de verdad se midio.

   USO
   ---
       python scripts/cierre-autorizado.py            # ensayo, no escribe
       python scripts/cierre-autorizado.py --ejecutar
       python scripts/cierre-autorizado.py --ejecutar --semana 2026-09-21

   Sin `--ejecutar` es de SOLO LECTURA y solo imprime lo que haria.
"""
import io
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EJECUTAR = '--ejecutar' in sys.argv
SEMANA = '2026-09-21'
if '--semana' in sys.argv:
    SEMANA = sys.argv[sys.argv.index('--semana') + 1]
# Mexico va en UTC-6 todo el año. Ver lib/fecha-local.ts.
MX = timezone(timedelta(hours=-6))
HOY = datetime.now(MX).strftime('%Y-%m-%d')

AUTORIZA = 'Actividad concluida fuera del calendario. Autorizó Daniel Martínez.'

E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'],
     'Content-Type': 'application/json'}
B = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def sb(t, p):
    f, o = [], 0
    while True:
        d = json.load(urllib.request.urlopen(
            urllib.request.Request(B + t + '?' + p + '&offset=%d&limit=1000' % o, headers=H), timeout=90))
        f += d
        if len(d) < 1000:
            return f
        o += 1000


def patch(t, filtro, cuerpo):
    r = urllib.request.Request(B + t + '?' + filtro, method='PATCH',
                               data=json.dumps(cuerpo).encode('utf-8'),
                               headers=dict(H, Prefer='return=representation'))
    return json.load(urllib.request.urlopen(r, timeout=60))


A = sb('actividades', 'select=id,asesor,empresa,consecutivo,cuenta_id,tipo,estado,completada,'
                      'semana_inicio,fecha_vencimiento,resultado')
CU = {c['id']: c for c in sb('cuentas', 'select=id,consecutivo,empresa,activo_desde,contacto_nombre,'
                                        'contacto_cargo,contacto_tel,contacto_email,contactos_json')}
RAD = {}
for r in sb('radar_respuestas', 'select=cuenta_id,respuestas,creado_en'):
    if r.get('cuenta_id'):
        RAD.setdefault(r['cuenta_id'], []).append(r)


def criticos(c):
    """Los mismos criticos que `detectDataGaps` en lib/data-gaps.ts."""
    f = []
    if not c.get('activo_desde'):
        f.append('fecha de inicio')
    for k, lab in (('contacto_nombre', 'contacto'), ('contacto_cargo', 'cargo'),
                   ('contacto_tel', 'teléfono'), ('contacto_email', 'correo')):
        if not c.get(k):
            f.append(lab)
    j = c.get('contactos_json')
    if isinstance(j, str):
        try:
            j = json.loads(j)
        except ValueError:
            j = None
    if not (isinstance(j, list) and len(j) >= 2):
        f.append('mapa de decisores')
    return f


def radar(cid):
    rr = RAD.get(cid, [])
    if not rr:
        return 0
    x = rr[-1].get('respuestas')
    if isinstance(x, str):
        try:
            x = json.loads(x)
        except ValueError:
            x = None
    return sum(1 for v in (x or {}).values() if str(v or '').strip())


def evidencia(a):
    """Lo VERIFICABLE de esta cuenta hoy. Nunca una frase generica."""
    c = CU.get(a.get('cuenta_id'))
    if not c:
        return 'No se pudo leer la ficha de la cuenta al momento del cierre.'
    if a.get('tipo') != 'validacion':
        return ('Tipo «%s»: su trabajo no deja evidencia verificable en los datos, '
                'así que este cierre NO acredita que se haya hecho — solo cierra la '
                'actividad que el tablero mantenía atrapada.' % a.get('tipo'))
    cr = criticos(c)
    rd = radar(c['id'])
    if not cr and rd >= 12:
        return ('Al cerrar: perfil SIN datos críticos faltantes y Radar de Cuenta %d de 12 '
                'respondidas. El trabajo estaba hecho; lo que faltaba era poder cerrarla.' % rd)
    partes = []
    if cr:
        partes.append('faltan datos críticos (%s)' % ', '.join(cr))
    if rd < 12:
        partes.append('Radar de Cuenta en %d de 12' % rd)
    return ('Al cerrar, el perfil seguía INCOMPLETO: %s. La cuenta sigue apareciendo en el '
            'diagnóstico de perfiles hasta que se complete.' % ' y '.join(partes))


# ── a quien le toca ──────────────────────────────────────────────────
# SOLO las bloqueadas: una `pendiente` no esta atrapada —el asesor todavia puede
# trabajarla— y cerrarsela seria quitarle el trabajo, no desbloquearselo.
objetivo = [a for a in A
            if a.get('semana_inicio') == SEMANA
            and not a.get('completada')
            and a.get('estado') == 'bloqueada']

print('=== CIERRE AUTORIZADO · semana %s ===' % SEMANA)
print('    «%s»' % AUTORIZA)
print('    modo: %s' % ('EJECUTAR (escribe en Supabase)' if EJECUTAR else 'ENSAYO (no escribe nada)'))
print()
if not objetivo:
    print('  No hay actividades bloqueadas en esa semana. Nada que cerrar.')
    sys.exit(0)

for a in objetivo:
    ev = evidencia(a)
    print('  %-8s %-5s %-24s %-11s vencio %s'
          % (a['asesor'], a.get('consecutivo'), str(a.get('empresa'))[:24],
             a.get('tipo'), a.get('fecha_vencimiento')))
    print('        %s' % ev)
    if a.get('resultado'):
        print('        OJO: ya traia resultado, NO se toca.')
    print()

print('  %d actividad(es).' % len(objetivo))
print()
print('  Lo que NO se hace: no se crea seguimiento y no se toca `ultimo_contacto`.')
print('  Un cierre administrativo no es una conversacion con el cliente.')
print()

if not EJECUTAR:
    print('  Ensayo. Para ejecutarlo: python scripts/cierre-autorizado.py --ejecutar')
    sys.exit(0)

hechas = 0
for a in objetivo:
    if a.get('resultado'):
        print('  saltada (ya tenia resultado): %s' % a.get('consecutivo'))
        continue
    texto = '\n\n'.join([
        '[CIERRE ADMINISTRATIVO %s] %s' % (HOY, AUTORIZA),
        'La actividad venció el %s y quedó atrapada por un defecto del tablero: una vez '
        'vencida sin haberse iniciado, no se podía completar ni justificar. El defecto se '
        'corrigió el 26 de septiembre de 2026.' % a.get('fecha_vencimiento'),
        evidencia(a),
        'Cerrada por Dirección, no por el asesor. NO se registró seguimiento: no hubo '
        'conversación con el cliente y el último contacto de la cuenta no se modifica.',
    ])
    patch('actividades', 'id=eq.' + a['id'], {
        'completada': True,
        'estado': 'completada',
        'resultado': texto,
        'tiempo_reportado_min': 0,
        'tiempo_medido_min': 0,
        'actualizado_en': datetime.now(timezone.utc).isoformat(),
    })
    hechas += 1
    print('  cerrada: %-5s %s' % (a.get('consecutivo'), a.get('empresa')))

print()
print('  %d cerrada(s). Ninguna fila de `seguimientos` creada, ningun `ultimo_contacto` tocado.' % hechas)
