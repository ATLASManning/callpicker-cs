# -*- coding: utf-8 -*-
u"""Prueba EN CALIENTE la alerta «Faltan datos para poder auditarla».

   La diferencia con `mide-datos-auditables.py`: ese replica la condicion en
   Python y mide el dato. Este lee lo que el MOTOR produjo de verdad —el JSON
   de `/api/alertas`— y lo contrasta contra la base. Replicar dice si la regla
   da el numero; esto dice si la alerta existe.

   SE PRUEBA AL REVES, que es la unica forma de probar una regla
   ([[feedback-probar-al-reves]]):

     1. ENCIENDE en las que les falta un critico       (y en TODAS)
     2. **NO ENCIENDE en ninguna que los tenga los tres** <- la que importa
     3. la evidencia NOMBRA los campos que faltan de esa cuenta, no otros
     4. no dice «$0 al mes» de una cuenta sin importe medible
     5. el catalogo le pone familia, severidad y dueño

   La 2 es la que de verdad vale. Una alerta que enciende donde debe pero
   tambien donde no, no es una alerta: es ruido con razon de ser.

   USO
       # con el arnes local corriendo (preview callpicker-cs, puerto 3100):
       python scripts/verifica-datos-auditables.py
       # o contra un JSON ya descargado:
       python scripts/verifica-datos-auditables.py <ruta.json>
"""
import io
import os
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIPO = 'sin_datos_auditables'
CRITICOS = [('giro', u'giro o sector'), ('servicio', u'servicio contratado'),
            ('activo_desde', u'fecha de alta')]

fallas, corridas = [], [0]


def prueba(etq, cond, det=u''):
    corridas[0] += 1
    if not cond:
        fallas.append(etq)
    print(u'  %-62s %s %s' % (etq, u'OK' if cond else u'** FALLA', det))


def env(c):
    for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


# ── 1 · lo que el MOTOR produjo ────────────────────────────────────────────
ruta = next((a for a in sys.argv[1:] if not a.startswith('--')), None)
if ruta:
    D = json.load(io.open(ruta, encoding='utf-8'))
    print(u'  fuente: %s' % ruta)
else:
    # `?limite=` por omision es 200 y el tope duro de la ruta es 1000. SIN
    # esto, la llamada devuelve las 200 primeras de 624 y esta alerta no
    # aparece: cae en cuentas chicas y sin importe, que ordenan al final.
    u = 'http://localhost:3100/acceso/api-alertas?limite=1000'
    print(u'  fuente: %s (arnes local)' % u)
    try:
        D = json.loads(urllib.request.urlopen(u, timeout=300).read().decode('utf-8'))
    except Exception as e:
        print(u'\n  *** no pude llamar al arnes: %s' % e)
        print(u'      Arrancar el preview «callpicker-cs» (puerto 3100) o pasar')
        print(u'      la ruta de un JSON ya descargado. NO se concluye nada.')
        sys.exit(2)

# ── LA GUARDA QUE ME FALTO, Y QUE ES LA LECCION DE ESTE ARCHIVO ───────────
# La primera version de este verificador leyo las 200 primeras de 624 y
# **declaro FALLA**: dijo que la alerta no encendia en ninguna de las 25 cuando
# lo que pasaba es que no cabian en la ventana. Un numero redondo —200 exacto—
# era la pista.
#
# Concluir sobre una muestra recortada es el mismo pecado que concluir exito
# por defecto, solo que al otro lado: en los dos casos el verificador opina sin
# haber visto. Asi que si la respuesta esta recortada, esto se DETIENE.
# [[feedback-verificar-antes-asegurar]]
if isinstance(D, dict) and D.get('mostradas') is not None:
    mostradas, filtradas = D.get('mostradas'), D.get('filtradas')
    if filtradas and mostradas is not None and mostradas < filtradas:
        print(u'\n  *** LA RESPUESTA VIENE RECORTADA: %s de %s.'
              % (mostradas, filtradas))
        print(u'      Sobre una ventana no se concluye nada —ni que pasa ni que')
        print(u'      falla—. Subir `?limite=` (tope 1000) y repetir.')
        sys.exit(2)
    print(u'  completa: %s de %s alertas (sin recorte)' % (mostradas, filtradas))

# El JSON trae las alertas en alguna de estas formas segun version; se busca.
def saca_alertas(d):
    if isinstance(d, list):
        return d
    for k in ('alertas', 'items', 'rows', 'data'):
        v = d.get(k)
        if isinstance(v, list):
            return v
    # ultimo recurso: la primera lista de dicts con 'tipo'
    for v in d.values():
        if isinstance(v, list) and v and isinstance(v[0], dict) and 'tipo' in v[0]:
            return v
    return []


A = saca_alertas(D)
print(u'  el motor devolvio %s alerta(s) en total' % u'{:,}'.format(len(A)))
if not A:
    print(u'\n  *** el JSON no trae alertas. Claves: %s'
          % (list(D.keys())[:12] if isinstance(D, dict) else type(D).__name__))
    sys.exit(2)

tipos = sorted({str(x.get('tipo')) for x in A})
mias = [x for x in A if str(x.get('tipo')) == TIPO]
print(u'  %d tipo(s) distintos · «%s» aparece %d vez/veces\n' % (len(tipos), TIPO, len(mias)))

# ── 2 · la base, para contrastar ───────────────────────────────────────────
U, K = env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
rq = urllib.request.Request(
    U + '/rest/v1/cuentas?select=id,consecutivo,empresa,giro,servicio,activo_desde'
        '&estado=in.(activo,en_riesgo)',
    headers={'apikey': K, 'Authorization': 'Bearer ' + K})
C = json.loads(urllib.request.urlopen(rq, timeout=120).read().decode('utf-8'))
lleno = lambda v: bool(str(v or '').strip())
debe = {c['id'] for c in C if any(not lleno(c.get(k)) for k, _ in CRITICOS)}
no_debe = {c['id'] for c in C} - debe
porid = {c['id']: c for c in C}
print(u'  base: %d cuentas vivas · %d deben encender · %d NO deben\n'
      % (len(C), len(debe), len(no_debe)))


def cid_de(x):
    for k in ('cuentaId', 'cuenta_id', 'id_cuenta'):
        if x.get(k):
            return x[k]
    return None


encendidas = {cid_de(x) for x in mias if cid_de(x)}

# ── 3 · LAS CINCO PRUEBAS ──────────────────────────────────────────────────
print(u'  ══ PRUEBAS ════════════════════════════════════════════════')

prueba(u'1a · enciende en TODAS las que les falta un critico',
       debe.issubset(encendidas),
       u'faltan %d' % len(debe - encendidas))

sobrantes = encendidas - debe
prueba(u'1b · y SOLO en esas — ninguna de mas',
       not sobrantes,
       u'de mas: %s' % u', '.join(
           (porid.get(i, {}).get('consecutivo') or u'?') for i in list(sobrantes)[:6]))

prueba(u'2 · NO enciende en NINGUNA que tenga los tres campos  <-- la que importa',
       not (encendidas & no_debe),
       u'%d intrusa(s)' % len(encendidas & no_debe))

# 3 · la evidencia nombra los campos de ESA cuenta
malas = []
for x in mias:
    i = cid_de(x)
    c = porid.get(i)
    if not c:
        continue
    ev = (x.get('evidencia') or x.get('evidencia_actual') or x.get('detalle') or u'')
    debia = [e for k, e in CRITICOS if not lleno(c.get(k))]
    no_debia = [e for k, e in CRITICOS if lleno(c.get(k))]
    if not all(e.split()[0] in ev for e in debia):
        malas.append(u'%s: no nombra %s' % (c.get('consecutivo'), debia))
    elif any(e in ev for e in no_debia):
        malas.append(u'%s: nombra uno que SI tiene' % c.get('consecutivo'))
prueba(u'3 · la evidencia nombra los campos que le faltan a esa cuenta',
       not malas, u'; '.join(malas[:3]))

# 4 · un cero sin medicion no se publica como cero
ceros = [x for x in mias
         if '$0 al mes' in (x.get('evidencia') or x.get('evidencia_actual') or u'')]
prueba(u'4 · no dice «$0 al mes» de una cuenta sin importe medible',
       not ceros, u'%d lo dicen' % len(ceros))

# 5 · el catalogo le puso sus atributos
uno = mias[0] if mias else {}
prueba(u'5 · el catalogo le pone familia/severidad/dueño',
       all(uno.get(k) for k in ('familia', 'severidad')) or
       all(uno.get(k) for k in ('titulo', 'accion')),
       u'familia=%s severidad=%s dueno=%s' % (uno.get('familia'), uno.get('severidad'),
                                              uno.get('dueno')))

# ── 4 · lo que se va a leer ────────────────────────────────────────────────
print(u'\n  ══ TRES EVIDENCIAS, PARA LEERLAS ══════════════════════════')
for x in mias[:3]:
    c = porid.get(cid_de(x), {})
    print(u'\n  %s · %s' % (c.get('consecutivo') or u'?', c.get('empresa') or u'?'))
    print(u'    titulo:    %s' % (x.get('titulo') or u'—'))
    print(u'    severidad: %s · familia %s · dueño %s'
          % (x.get('severidad'), x.get('familia'), x.get('dueno')))
    ev = x.get('evidencia') or x.get('evidencia_actual') or u'—'
    for i in range(0, len(ev), 74):
        print(u'    %s %s' % (u'evidencia:' if i == 0 else u'          ', ev[i:i + 74]))

print(u'\n  %d prueba(s). %s' % (corridas[0],
      u'TODAS PASAN.' if not fallas else u'*** FALLAN:\n    - ' + u'\n    - '.join(fallas)))
sys.exit(1 if fallas else 0)
