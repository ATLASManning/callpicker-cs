# -*- coding: utf-8 -*-
u"""¿PUEDE LA LLAVE PUBLICA *ESCRIBIR*?

   La politica `service_role_all` que estaba abierta a `public` traia
   `cmd = ALL`, no solo SELECT: quien tuviera la llave publicable podia
   insertar, modificar y BORRAR. Que ya no LEA no prueba que ya no ESCRIBA.

   ── DOS METODOS QUE PROBE ANTES Y NO SIRVEN ───────────────────────────────
   1. INSERT con una columna inexistente. PostgREST valida el cuerpo contra su
      cache del esquema ANTES de tocar la base, asi que el 400 sale igual con
      permiso y sin el. Dio ABIERTO en las diez tablas, incluidas `cuentas` y
      `usuarios`, que sabiamos cerradas.
   2. DELETE con un filtro imposible. Peor todavia: **RLS no rechaza un
      borrado, le esconde las filas**. Un DELETE que no ve nada devuelve 204
      igual que uno permitido que no caso. Tambien dio ABIERTO en todo.

   Las dos veces lo que fallo fue el metodo, no la base. Y la primera version
   llevaba solo control POSITIVO, que no caza esto: un control positivo solo
   detecta la sonda muerta. Hizo falta el NEGATIVO —una tabla que sabemos
   cerrada— para ver que la sonda no distinguia nada.
   [[feedback-probar-al-reves]] [[project-callpicker-auth-pending]]

   ── EL METODO BUENO: INSERT CON CUERPO VACIO ──────────────────────────────
   `{}` se traduce a `INSERT ... DEFAULT VALUES`. El INSERT es la unica de las
   tres operaciones que RLS RECHAZA con error en vez de filtrar filas, porque
   se gobierna con WITH CHECK:

     · 42501 «new row violates row-level security policy» -> CERRADO, y es
       Postgres diciendolo con su propio codigo. No hay interpretacion.
     · 23502 (not null) -> paso RLS y lo paro una restriccion. ABIERTO.
     · 2xx -> ABIERTO y ademas escribio. No deberia pasar nunca.

   Con RLS puesto y sin politicas, nada llega a la tabla. Y si llegara, los
   NOT NULL lo paran: por eso el cuerpo va vacio y no con datos de mentira.

   USO
       python scripts/revisa-rls-escritura.py
"""
import io
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return None
    for ln in io.open(p, encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = (env('NEXT_PUBLIC_SUPABASE_URL') or '').rstrip('/')
ANON = env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
if not URL or not ANON:
    print(u'  *** faltan credenciales en .env.local.')
    sys.exit(2)

TABLAS = [
    'adopcion_producto', 'radar_respuestas',           # las que estaban abiertas
    'cuentas', 'usuarios', 'seguimientos', 'anexos',   # las de datos de cliente
    'chat_mensajes', 'enriquecimiento_decisores',      # las vacias, que no se
    'oportunidades', 'solicitudes_acceso', 'tickets',  # pueden medir leyendo
]


def intenta(tabla):
    req = urllib.request.Request(
        URL + '/rest/v1/' + tabla, data=b'{}', method='POST',
        headers={'apikey': ANON, 'Authorization': 'Bearer ' + ANON,
                 'Content-Type': 'application/json', 'Prefer': 'return=minimal'})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return u'*** ESCRIBIO', u'HTTP %s — hay que borrar esa fila A MANO' % r.status
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode('utf-8', 'replace')
        if '42501' in cuerpo:
            return u'CERRADO', u'42501 · RLS rechaza el alta'
        if '23502' in cuerpo or '23503' in cuerpo or '23505' in cuerpo:
            return u'*** ABIERTO', u'paso RLS; lo paro una restriccion de la tabla'
        return u'?', u'HTTP %s — %s' % (e.code, cuerpo[:80])
    except Exception as e:                                   # noqa: BLE001
        return u'?', str(e)[:80]


print(u'\n  RLS — ¿PUEDE *ESCRIBIR* LA LLAVE PUBLICA?')
print(u'  ' + u'=' * 72)
print(u'  proyecto: %s' % URL.replace('https://', '').split('.')[0])
print(u'  metodo: INSERT con cuerpo vacio. Con RLS puesto no llega nada.\n')

print(u'  %-30s %-16s %s' % (u'TABLA', u'VEREDICTO', u'POR QUE'))
print(u'  ' + u'-' * 72)
malas, dudosas = [], []
for t in TABLAS:
    v, por = intenta(t)
    print(u'  %-30s %-16s %s' % (t[:30], v, por))
    if v.startswith(u'***'):
        malas.append(t)
    elif v == u'?':
        dudosas.append(t)

print()
print(u'  ' + u'=' * 72)
if malas:
    print(u'  *** %d TABLA(S) ACEPTAN ESCRITURA de la llave publica: %s'
          % (len(malas), u', '.join(malas)))
    sys.exit(1)
if dudosas:
    print(u'  *** %d sin clasificar, asi que NO se puede concluir que esten'
          % len(dudosas))
    print(u'      cerradas: %s' % u', '.join(dudosas))
    sys.exit(1)
print(u'  Las %d tablas rechazan el alta con 42501: RLS las cubre tambien para'
      % len(TABLAS))
print(u'  escritura, y lo dice Postgres con su propio codigo de error.')
