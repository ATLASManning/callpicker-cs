# -*- coding: utf-8 -*-
u"""
QUÉ CADENCIA SOPORTA DE VERDAD LA INFRAESTRUCTURA
==================================================

    python scripts/mide-cadencia-cron.py

POR QUÉ EXISTE
--------------
El Prompt Maestro fija como objetivo del §15 «procesar eventos disponibles en
menos de 15 minutos». Hoy `vercel.json` declara DOS crons, los dos una vez al
día. Antes de prometer una cadencia en pantalla hay que saber dos cosas, y
ninguna se sabe leyendo el repositorio:

  1. ¿Cuánto tarda de verdad la corrida? Si roza el techo declarado
     (`maxDuration = 300`), partirla en más pases frecuentes no es una mejora:
     es cambiar un fallo por otro.
  2. ¿Está corriendo? `/api/cron/refresh-tenure` estuvo programado MESES sin
     correr nunca, porque el middleware le servía el login con HTTP 200 y
     Vercel lo daba por exitoso. Un cron que no corre no se nota solo.
     [[feedback-verificar-antes-asegurar]]

Este guion NO escribe. Lee la tabla `corridas` y mide. Si la tabla no existe o
está vacía, lo dice con palabras en vez de concluir que todo va bien: un cero
sin medición no es un cero. [[feedback-cero-sin-medicion]]

LO QUE NO PUEDE DECIR
---------------------
El plan de Vercel. Ningún dato de la base lo sabe. Lo que sí puede hacer es
acotar la pregunta: si una corrida real pasó de 60 segundos y terminó bien, el
techo de 60 s no está aplicándose. Eso es evidencia, no el dato.
"""
from __future__ import print_function
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    ruta = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(ruta):
        return None
    for linea in io.open(ruta, encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** falta NEXT_PUBLIC_SUPABASE_URL o la llave de servicio en .env.local')
    sys.exit(2)


def rest(consulta):
    u"""Devuelve (filas, error). No revienta: un 404 de tabla inexistente es un
    dato que hay que reportar, no una excepción que mate la medición."""
    pet = urllib.request.Request(
        URL + '/rest/v1/' + consulta,
        headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
    try:
        return json.loads(urllib.request.urlopen(pet, timeout=120).read().decode('utf-8')), None
    except urllib.error.HTTPError as e:
        try:
            detalle = json.loads(e.read().decode('utf-8'))
            msg = detalle.get('message') or detalle.get('hint') or str(detalle)
        except Exception:
            msg = u'HTTP %s' % e.code
        return None, u'HTTP %s · %s' % (e.code, msg)
    except Exception as e:                                   # noqa: BLE001
        return None, u'%s: %s' % (type(e).__name__, e)


print(u'')
print(u'  CADENCIA REAL DE LAS TAREAS PROGRAMADAS')
print(u'  ' + u'=' * 72)

# ── Lo que el repositorio DECLARA ───────────────────────────────────────────
declarado = []
ruta_vercel = os.path.join(RAIZ, 'vercel.json')
if os.path.exists(ruta_vercel):
    cfg = json.load(io.open(ruta_vercel, encoding='utf-8'))
    declarado = cfg.get('crons') or []

print(u'\n  DECLARADO en vercel.json: %d cron(s)' % len(declarado))
for c in declarado:
    print(u'    %-34s %s' % (c.get('path'), c.get('schedule')))
if len(declarado) == 2 and all(
        (c.get('schedule') or '').split()[1:2] not in ([], ['*'])
        for c in declarado):
    print(u'')
    print(u'    Las dos son de frecuencia diaria o menor (el campo de la hora')
    print(u'    es fijo, no `*`). Ninguna puede disparar cada 15 minutos tal')
    print(u'    como está escrita, sea cual sea el plan.')

# ── Lo que la base REGISTRA ─────────────────────────────────────────────────
print(u'')
print(u'  REGISTRADO en la tabla `corridas`')
print(u'  ' + u'-' * 72)

filas, err = rest('corridas?select=*&order=creado_en.desc&limit=200')
if filas is None:
    # El orden puede fallar si la columna se llama de otro modo. Reintentar sin
    # ordenar antes de dar la tabla por inexistente: distinguir «no hay tabla»
    # de «no existe esa columna» es justo lo que esta medición debe separar.
    filas, err2 = rest('corridas?select=*&limit=200')
    if filas is None:
        print(u'    *** NO SE PUDO LEER: %s' % (err2 or err))
        print(u'    Eso NO significa que no haya corridas. Significa que esta')
        print(u'    medición no puede concluir nada sobre la cadencia.')
        print(u'')
        print(u'  ' + u'=' * 72)
        sys.exit(1)
    print(u'    (sin ordenar: la columna de fecha no se llama `creado_en`)')

if not filas:
    print(u'    La tabla existe y está VACÍA.')
    print(u'    No es «todo bien»: es que nadie está registrando las corridas,')
    print(u'    así que un cron que deje de correr no se notaría.')
    print(u'')
    print(u'  ' + u'=' * 72)
    sys.exit(1)

cols = sorted(filas[0].keys())
print(u'    %d fila(s) leídas. Columnas: %s' % (len(filas), u', '.join(cols)))

# Localizar, sin suponer, la columna de duración y la de identidad.
col_dur = next((c for c in cols if 'dur' in c or 'ms' in c or 'seg' in c), None)
col_que = next((c for c in cols if c in ('tarea', 'nombre', 'ruta', 'tipo', 'path')), None)
col_fec = next((c for c in cols if 'creado' in c or 'fecha' in c or 'inicio' in c), None)
col_est = next((c for c in cols if 'estado' in c or 'ok' in c or 'exito' in c), None)

print(u'')
print(u'    columna de duración: %s' % (col_dur or u'*** NINGUNA ***'))
print(u'    columna de identidad: %s' % (col_que or u'*** NINGUNA ***'))
print(u'    columna de fecha:    %s' % (col_fec or u'*** NINGUNA ***'))
print(u'    columna de estado:   %s' % (col_est or u'*** NINGUNA ***'))

if not col_dur:
    print(u'')
    print(u'    *** La tabla no guarda cuánto tardó la corrida. ***')
    print(u'    Sin eso no se puede saber si la corrida roza el techo de 300 s,')
    print(u'    y por tanto no se puede decidir una cadencia más frecuente con')
    print(u'    fundamento. Es el primer hueco que hay que cerrar del §15.')
else:
    duraciones = [(f.get(col_dur), f) for f in filas
                  if isinstance(f.get(col_dur), (int, float))]
    if not duraciones:
        print(u'')
        print(u'    La columna existe pero NINGUNA fila trae un número.')
    else:
        duraciones.sort(key=lambda x: -x[0])
        peor, fpeor = duraciones[0]
        print(u'')
        print(u'    corridas con duración medida: %d de %d'
              % (len(duraciones), len(filas)))
        print(u'    la más larga: %s  (%s)'
              % (peor, fpeor.get(col_fec) or u'sin fecha'))
        # El umbral de 60 s es la frontera que separa los planes de Vercel.
        # Pasarlo con éxito es evidencia de que el techo de 60 s no aplica.
        unidad = u'ms' if peor > 1000 else u's'
        seg = peor / 1000.0 if unidad == u'ms' else peor
        print(u'    interpretada como %.1f segundos (unidad inferida: %s)'
              % (seg, unidad))
        if seg > 60:
            print(u'    => Una corrida pasó de 60 s. El techo de 60 s NO aplica aquí.')
        else:
            print(u'    => Ninguna pasó de 60 s. Esto NO distingue el plan:')
            print(u'       una corrida corta cabe en cualquiera de los dos.')

# ── ¿Cada cuánto aparecen de verdad? ────────────────────────────────────────
if col_fec and col_que:
    print(u'')
    print(u'    ÚLTIMAS CORRIDAS POR TAREA')
    vistas = {}
    for f in filas:
        q = str(f.get(col_que) or u'(sin nombre)')
        vistas.setdefault(q, []).append(f)
    for q in sorted(vistas, key=lambda x: -len(vistas[x])):
        fs = sorted(vistas[q], key=lambda x: str(x.get(col_fec) or ''), reverse=True)
        est = (u' · estado %s' % fs[0].get(col_est)) if col_est else u''
        print(u'      %-28s %3d corridas · última %s%s'
              % (q[:28], len(fs), fs[0].get(col_fec), est))

    declaradas = set((c.get('path') or '').rsplit('/', 1)[-1] for c in declarado)
    registradas = set(str(k).rsplit('/', 1)[-1] for k in vistas)
    huerfanas = declaradas - registradas
    if huerfanas:
        print(u'')
        print(u'    *** DECLARADAS EN vercel.json Y SIN NINGUNA CORRIDA REGISTRADA:')
        for h in sorted(huerfanas):
            print(u'        %s' % h)
        print(u'    Es exactamente el fallo de `refresh-tenure`: programado y')
        print(u'    silencioso. Puede ser que no registre, o que no corra.')

print(u'')
print(u'  ' + u'=' * 72)
print(u'  Lo que esta medición NO puede decir: el plan de Vercel.')
print(u'  Lo que sí acota: la cadencia declarada y la duración real observada.')
print(u'')
