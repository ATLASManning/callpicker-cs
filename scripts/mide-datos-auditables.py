# -*- coding: utf-8 -*-
u"""A cuantas cuentas enciende la alerta «Faltan datos para poder auditarla».

   POR QUE EXISTE
   --------------
   La alerta la pidio direccion el 12 oct 2026: «si en alguna no se te facilita
   por falta de datos indicanos en ALERTAS para requisitar los campos
   faltantes». Esta escrita y no mete errores de tipo, pero **no entra a
   produccion hasta saber a cuantas cuentas enciende**.

   El riesgo no es que falle: es que inunde. Si enciende en ochenta cuentas, el
   asesor aprende a cerrarla sin leerla y de paso deja de leer las otras tres de
   ceguera que si funcionan. Una alerta que salta siempre no informa de nada.
   **El numero decide si entra, si sube el minimo o si se reparte por
   severidad** — y el numero se mide, no se estima.

   QUE REPLICA, EXACTAMENTE
   ------------------------
   La condicion de `lib/alertas-detectar.ts`: poblacion `estado in ('activo',
   'en_riesgo')` —la misma que carga el detector, no las 223 de la tabla— y
   dispara si falta AL MENOS UNO de los tres criticos. Los dos opcionales se
   cuentan pero no disparan.

   Es una REPLICA, con lo que eso implica ([[feedback-verificar-antes-asegurar]]):
   mide el dato y la regla, NO prueba que la alerta se pinte. Para eso hay que
   correr el motor. Por eso el guion dice al final que falta ese paso, en vez de
   dejar creer que con esto queda verificado.

   Y mide el SOLAPAMIENTO con las tres alertas de ceguera que ya existen
   —`sin_radar`, `sin_contactos`, `sin_ficha`—, porque el numero que importa no
   es «a cuantas enciende» sino «a cuantas les agrega una linea que no tenian».

   USO
       python scripts/mide-datos-auditables.py
       python scripts/mide-datos-auditables.py --detalle    # cuenta por cuenta
"""
import io
import os
import re
import sys
import json
import urllib.request
from collections import Counter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DETALLE = '--detalle' in sys.argv


def env(c):
    for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}


def trae(ruta):
    r = urllib.request.Request(URL + '/rest/v1/' + ruta, headers=CAB)
    return json.loads(urllib.request.urlopen(r, timeout=120).read().decode('utf-8'))


def lleno(v):
    return bool(str(v or '').strip())


# Los mismos tres criticos y dos opcionales que la tabla REQUISITOS_FICHA del
# detector. Si alli se cambian, aqui tambien — y si se desincronizan, este
# medidor empieza a mentir. De ahi la comprobacion de abajo.
CRITICOS   = [('giro', u'giro'), ('servicio', u'servicio'),
              ('activo_desde', u'antiguedad')]
OPCIONALES = [('tamano_empresa', u'tamaño'), ('notas', u'notas')]

# ── LA REPLICA NO PUEDE DIVERGIR DEL DETECTOR EN SILENCIO ─────────────────
# Se lee el .ts y se comprueba que los cinco campos esten ahi. No valida la
# logica —eso no se puede leer con una expresion regular— pero si caza el caso
# que de verdad pasa: que alguien agregue o quite un campo alla y este medidor
# siga publicando un numero de otra regla.
TS = io.open(os.path.join(RAIZ, 'lib', 'alertas-detectar.ts'), encoding='utf-8').read()
bloque = TS.split('REQUISITOS_FICHA', 1)[-1].split('\n]', 1)[0] if 'REQUISITOS_FICHA' in TS else ''
desfase = [c for c, _ in CRITICOS + OPCIONALES if ("campo: '%s'" % c) not in bloque]
sobran = [m for m in re.findall(r"campo: '([a-z_]+)'", bloque)
          if m not in [c for c, _ in CRITICOS + OPCIONALES]]
if not bloque:
    print(u'  *** no encontre REQUISITOS_FICHA en lib/alertas-detectar.ts.')
    print(u'      O la rama no esta puesta, o se renombro. NO se mide a ciegas.')
    sys.exit(2)
if desfase or sobran:
    print(u'  *** LA REPLICA Y EL DETECTOR NO MIRAN LO MISMO.')
    if desfase:
        print(u'      en este guion y NO en el .ts: %s' % u', '.join(desfase))
    if sobran:
        print(u'      en el .ts y NO en este guion: %s' % u', '.join(sobran))
    print(u'      Cualquier numero que saque seria de otra regla. Se detiene.')
    sys.exit(2)
print(u'  los 5 campos del detector y los de este guion coinciden.\n')

C = trae('cuentas?select=id,consecutivo,empresa,asesor,estado,facturacion,'
         'giro,servicio,activo_desde,tamano_empresa,notas,contactos_json,'
         'observaciones_kam&estado=in.(activo,en_riesgo)')
print(u'  ══ POBLACION ══════════════════════════════════════════════')
print(u'  %d cuentas activo/en_riesgo (la que carga el detector)' % len(C))

rad = {x['cuenta_id'] for x in trae('radar_respuestas?select=cuenta_id') if x.get('cuenta_id')}


def cuantos_contactos(v):
    if isinstance(v, list):
        return len(v)
    if isinstance(v, str) and v.strip():
        try:
            a = json.loads(v)
            return len(a) if isinstance(a, list) else 0
        except Exception:
            return 0
    return 0


print(u'\n  ══ CAMPO POR CAMPO ════════════════════════════════════════')
print(u'  %-16s %6s %7s   %s' % (u'campo', u'faltan', u'%', u'papel'))
for campo, etq in CRITICOS + OPCIONALES:
    n = sum(1 for c in C if not lleno(c.get(campo)))
    papel = u'CRITICO — dispara' if (campo, etq) in CRITICOS else u'opcional — no dispara'
    print(u'  %-16s %6d %6.1f%%   %s' % (campo, n, 100.0 * n / max(len(C), 1), papel))

enciende = [c for c in C if any(not lleno(c.get(k)) for k, _ in CRITICOS)]
print(u'\n  ══ EL NUMERO QUE DECIDE ═══════════════════════════════════')
print(u'  ENCIENDE EN %d de %d cuentas (%.1f%%)'
      % (len(enciende), len(C), 100.0 * len(enciende) / max(len(C), 1)))
# ── EL DINERO NO SE PUBLICA COMO TOTAL, Y ESTO ES EL PUNTO ────────────────
# La primera version imprimia «facturacion implicada: $60,605» sumando
# `cuentas.facturacion`. Es la misma columna que las auditorias del TOP 50
# demostraron inservible — y de estas 25, CATORCE la traen en cero. Sumar
# ceros que en realidad son ausencias da un total que parece pequeño y solo
# dice que nadie capturo el importe. [[feedback-cero-sin-medicion]]
#
# El detector no tiene este problema: su evidencia usa el importe ya resuelto
# contra el GRC, y cuando no hay dato en ninguna fuente dice «un importe que no
# esta en ninguna fuente» con palabras. Aqui se replica esa honestidad: se
# separan las medibles de las que no, y lo que se suma se llama PISO.
con_dato = [c for c in enciende if float(c.get('facturacion') or 0) > 0]
sin_dato = [c for c in enciende if float(c.get('facturacion') or 0) <= 0]
piso = sum(float(c.get('facturacion') or 0) for c in con_dato)
print(u'  de esas, %d tienen importe en la ficha y %d NO lo tienen'
      % (len(con_dato), len(sin_dato)))
print(u'  PISO de facturacion (solo las %d medibles): $%s'
      % (len(con_dato), u'{:,.0f}'.format(piso)))
print(u'  NO es un total: las otras %d no valen cero, no se sabe cuanto valen.'
      % len(sin_dato))
print(u'  (Y el importe bueno sale del GRC, no de esta columna — el detector')
print(u'   ya lo resuelve asi. Ver [[grc-fuente-zoho]].)')

# Reparto por asesor: dice a quien hay que pedirle que capture.
por_asesor = Counter(c.get('asesor') or u'(sin asesor)' for c in enciende)
print(u'\n  a quien le toca capturar:')
for a, n in por_asesor.most_common():
    print(u'    %-10s %2d cuenta(s)' % (a, n))

# Cuantos criticos le faltan a cada una: una sola alerta por cuenta, pero no
# es lo mismo faltar uno que faltar tres.
cuantos = Counter(sum(1 for k, _ in CRITICOS if not lleno(c.get(k))) for c in enciende)
print(u'\n  reparto por cuantos criticos le faltan:')
for n in sorted(cuantos):
    print(u'    le faltan %d de 3 → %d cuenta(s)' % (n, cuantos[n]))

print(u'\n  ══ SOLAPAMIENTO CON LAS TRES DE CEGUERA QUE YA EXISTEN ════')
print(u'  Lo que importa no es a cuantas enciende, sino a cuantas les agrega')
print(u'  una linea que no tenian ya.')
ya = {}
for c in C:
    tiene = []
    if c['id'] not in rad:
        tiene.append(u'sin_radar')
    if cuantos_contactos(c.get('contactos_json')) == 0:
        tiene.append(u'sin_contactos')
    if not lleno(c.get('observaciones_kam')):
        tiene.append(u'sin_ficha')
    ya[c['id']] = tiene
for t in (u'sin_radar', u'sin_contactos', u'sin_ficha'):
    n = sum(1 for c in C if t in ya[c['id']])
    print(u'  %-16s ya enciende en %3d de %d cuentas' % (t, n, len(C)))

solos = [c for c in enciende if not ya[c['id']]]
print(u'\n  de las %d que enciende la nueva, %d NO tienen ninguna otra alerta'
      % (len(enciende), len(solos)))
print(u'  de ceguera abierta — a esas les agrega una fila nueva de verdad.')
mezcla = Counter(len(ya[c['id']]) for c in enciende)
for n in sorted(mezcla):
    print(u'    con %d otra(s) de ceguera ya abiertas → %d cuenta(s)' % (n, mezcla[n]))

if DETALLE:
    print(u'\n  ══ CUENTA POR CUENTA ══════════════════════════════════════')
    for c in sorted(enciende, key=lambda x: -float(x.get('facturacion') or 0)):
        faltan = [e for k, e in CRITICOS if not lleno(c.get(k))]
        opt = [e for k, e in OPCIONALES if not lleno(c.get(k))]
        print(u'  %-5s %-34s %-8s $%10s  falta: %s%s'
              % (c.get('consecutivo') or u'?', str(c.get('empresa'))[:34],
                 c.get('asesor') or u'—',
                 u'{:,.0f}'.format(float(c.get('facturacion') or 0)),
                 u', '.join(faltan),
                 u'  (+ %s)' % u', '.join(opt) if opt else u''))

print(u'\n  ══ LO QUE ESTO **NO** PRUEBA ══════════════════════════════')
print(u'  Esto es una REPLICA de la condicion sobre los mismos datos: mide el')
print(u'  dato y la regla. NO prueba que la alerta se construya, ni que su')
print(u'  evidencia se lea bien, ni que el catalogo le ponga la severidad.')
print(u'  Para eso hay que correr el motor y mirar la pantalla.')
