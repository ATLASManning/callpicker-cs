# -*- coding: utf-8 -*-
u"""
QUIÉN ES DUEÑO DE QUÉ, Y DÓNDE LAS DOS COLUMNAS NO COINCIDEN
=============================================================

    python scripts/mide-cartera-asesor.py

POR QUÉ EXISTE
--------------
`lib/dueno.ts` compara dos columnas que nadie ha obligado nunca a coincidir:
`usuarios.asesor_nombre` (lo elige un select en Gestión de Usuarios) y
`cuentas.asesor` (**lo escribe la carga semanal**). Y `lib/types.ts` afirma en
un comentario que «las 71 cuentas ya están a su nombre en `cuentas.asesor`»
desde el 15 oct 2026.

Las tres cosas no pueden ser verdad a la vez si la tabla sigue diciendo otra
cosa. Un comentario no es una medición, y una columna que reescribe la carga
semanal puede volver a su valor anterior sin que nadie toque nada.
[[feedback-verificar-antes-asegurar]] [[erick-sustituye-a-claudia]]

Este guion NO escribe. Cuenta, cruza y, si hay algo que corregir, imprime el
UPDATE para que lo autorice una persona. Un cambio de nombre de asesor ya tumbó
el tablero entero una vez.

QUÉ IMPRIME
-----------
  · cuántas cuentas tiene cada asesor en `cuentas.asesor`, por estado;
  · los nombres de `usuarios.asesor_nombre` que NO existen en `cuentas.asesor`
    —ésos son los que `lib/dueno.ts` deja con cartera vacía—;
  · qué expedientes de auditoría pertenecen a una cuenta cuyo dueño cambió;
  · y el UPDATE propuesto, sin ejecutarlo.
"""
from __future__ import print_function
import io
import json
import os
import sys
import unicodedata
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# El relevo que hay que comprobar. Si mañana hay otro, se cambia aquí y el
# guion sigue sirviendo.
SALE, ENTRA = u'Claudia', u'Erick'


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
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
    pet = urllib.request.Request(
        URL + '/rest/v1/' + consulta,
        headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
    return json.loads(urllib.request.urlopen(pet, timeout=120).read().decode('utf-8'))


def plano(s):
    s = unicodedata.normalize('NFD', (s or u'').strip())
    return u''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()


print(u'')
print(u'  CARTERA POR ASESOR · lo que dice la tabla hoy')
print(u'  ' + u'═' * 72)

cuentas = rest('cuentas?select=id,cid,consecutivo,empresa,asesor,estado&limit=5000')
usuarios = rest('usuarios?select=email,asesor_nombre,activo,rol&limit=500')

por_asesor = {}
for c in cuentas:
    a = (c.get('asesor') or u'(vacío)').strip() or u'(vacío)'
    d = por_asesor.setdefault(a, {'total': 0, 'estados': {}})
    d['total'] += 1
    e = (c.get('estado') or u'(sin estado)')
    d['estados'][e] = d['estados'].get(e, 0) + 1

print(u'\n  `cuentas.asesor` · %d cuentas en total' % len(cuentas))
for a in sorted(por_asesor, key=lambda x: -por_asesor[x]['total']):
    d = por_asesor[a]
    det = u', '.join(u'%s %d' % (k, v) for k, v in
                     sorted(d['estados'].items(), key=lambda x: -x[1]))
    print(u'    %-14s %4d   %s' % (a, d['total'], det))

print(u'\n  `usuarios.asesor_nombre` · quién puede abrir una cartera')
nombres_cuentas = set(plano(a) for a in por_asesor)
for u_ in sorted(usuarios, key=lambda x: str(x.get('asesor_nombre') or '')):
    nom = (u_.get('asesor_nombre') or u'').strip()
    if not nom:
        continue
    marca = u'ok' if plano(nom) in nombres_cuentas else u'*** SIN CARTERA ***'
    print(u'    %-18s activo=%-5s rol=%-14s %s'
          % (nom, u_.get('activo'), u_.get('rol'), marca))

# ── LOS SNAPSHOTS DEL REPO CONTRA LA TABLA VIVA ─────────────────────────────
#
# Esto es lo que faltaba. La tabla `cuentas` quedó correcta el 15 oct 2026, y
# dos archivos de `data/` siguieron publicando la cartera anterior durante dos
# meses porque nadie los regeneró — y su propio campo `generado` estaba
# TECLEADO A MANO, así que tampoco delataba la edad.
#
# De `crecimiento-escalera.json` sale el `asesor` de `veredicto-candidatura
# .json`, y de ahí `auditoria_alarma`, que lo lee una persona antes de escribir
# un reporte de cliente. Una cadena de cuatro pasos en la que ningún paso
# comprobaba al anterior.
#
# La comprobación más barata que existe: comparar los dos repartos.
# [[feedback-auditorias-verificar]]
print(u'')
print(u'  LOS SNAPSHOTS DEL REPO, CONTRA LA TABLA')
print(u'  ' + u'─' * 72)

vivo = {}
for c in cuentas:
    a = plano(c.get('asesor'))
    if a:
        vivo[a] = vivo.get(a, 0) + 1

desfasados = []
for nombre, clave in (('crecimiento-escalera.json', 'cuentas'),
                      ('veredicto-candidatura.json', 'cuentas')):
    ruta = os.path.join(RAIZ, 'data', nombre)
    if not os.path.exists(ruta):
        print(u'    %-30s NO EXISTE' % nombre)
        continue
    doc = json.load(io.open(ruta, encoding='utf-8'))
    filas = doc.get(clave) or []
    filas = [x for x in (filas if isinstance(filas, list) else filas.values())
             if isinstance(x, dict)]
    snap = {}
    for x in filas:
        a = plano(x.get('asesor'))
        if a:
            snap[a] = snap.get(a, 0) + 1
    difieren = sorted(set(snap) | set(vivo))
    mal = [n for n in difieren if snap.get(n, 0) != vivo.get(n, 0)]
    sello = doc.get('generado') or u'(sin sello)'
    if mal:
        desfasados.append(nombre)
        print(u'    %-30s *** DESFASADO *** sello «%s»' % (nombre, sello))
        for n in mal:
            print(u'        %-12s snapshot %3d  ·  tabla %3d'
                  % (n, snap.get(n, 0), vivo.get(n, 0)))
    else:
        print(u'    %-30s ok  %d cuentas · sello «%s»' % (nombre, len(filas), sello))

if desfasados:
    print(u'')
    print(u'    No se arregla a mano. Se regenera la cadena, EN ORDEN, porque')
    print(u'    cada guion lee la salida del anterior:')
    print(u'        python scripts/crecimiento-escalera.py')
    print(u'        python scripts/extrae-auditorias.py')
    print(u'        python scripts/veredicto-candidatura.py')

# ── El relevo ───────────────────────────────────────────────────────────────
pend = [c for c in cuentas if plano(c.get('asesor')) == plano(SALE)]
print(u'')
print(u'  EL RELEVO %s → %s' % (SALE, ENTRA))
print(u'  ' + u'─' * 72)
if not pend:
    print(u'    Ninguna cuenta sigue a nombre de %s. El relevo está completo en'
          u' la tabla.' % SALE)
else:
    vivas = [c for c in pend if (c.get('estado') or '') not in
             ('cancelado', 'hibernacion', 'inactivo')]
    print(u'    %d cuentas siguen a nombre de %s (%d vivas).'
          % (len(pend), SALE, len(vivas)))
    print(u'')
    print(u'    LAS PRIMERAS 15, PARA QUE SE VEA QUÉ SON:')
    for c in sorted(pend, key=lambda x: str(x.get('consecutivo') or ''))[:15]:
        print(u'      %-7s %-38s %s'
              % (c.get('consecutivo') or u'—', (c.get('empresa') or u'')[:38],
                 c.get('estado')))
    if len(pend) > 15:
        print(u'      … y %d más.' % (len(pend) - 15))

    # Los expedientes de auditoría que cuelgan de esas cuentas.
    reg = os.path.join(RAIZ, 'data', 'auditorias-candidatura.json')
    if os.path.exists(reg):
        casos = json.load(io.open(reg, encoding='utf-8'))['casos']
        cids = set(str(c.get('cid') or '') for c in pend if c.get('cid'))
        tocados = [k for k in casos if str(k.get('cid') or '') in cids]
        print(u'')
        print(u'    EXPEDIENTES DE AUDITORÍA QUE CUELGAN DE ELLAS: %d' % len(tocados))
        for k in tocados:
            print(u'      %-34s asesor del expediente: %s'
                  % (str(k.get('nombre'))[:34], k.get('asesor')))

    print(u'')
    print(u'  ESTO NO SE EJECUTA AQUÍ. El UPDATE propuesto, para autorizar:')
    print(u'  ' + u'─' * 72)
    print(u"    update cuentas set asesor = '%s' where asesor = '%s';" % (ENTRA, SALE))
    print(u'    -- afecta %d filas. Antes de correrlo:' % len(pend))
    print(u"    --   1. `cuentas.asesor` LO ESCRIBE LA CARGA SEMANAL: si la hoja")
    print(u"    --      de origen sigue diciendo «%s», el UPDATE se deshace solo" % SALE)
    print(u'    --      el viernes. Corregir la hoja de origen es lo primero.')
    print(u"    --   2. `%s` tiene que estar en ASESOR_CONFIG de lib/types.ts" % ENTRA)
    print(u'    --      (lo está) o la portada muere en el `.map()`.')
    print(u'    --   3. Volver a correr este guion y comprobar que da cero.')

print(u'')
print(u'  ' + u'═' * 72)
fallos = (1 if pend else 0) + len(desfasados)
if not fallos:
    print(u'  La tabla, los dos snapshots y la lista de accesos dicen lo mismo.')
    sys.exit(0)
if pend:
    print(u'  *** %d cuenta(s) siguen a nombre de %s en la tabla. ***' % (len(pend), SALE))
if desfasados:
    print(u'  *** %d snapshot(s) del repo no coinciden con la tabla: %s ***'
          % (len(desfasados), u', '.join(desfasados)))
print(u'')
sys.exit(1)
