# -*- coding: utf-8 -*-
u"""NINGUN [[enlace]] DE MEMORIA PUEDE LLEGAR A UNA PANTALLA.

   Los `[[nombre-de-memoria]]` son punteros MIOS: sirven en un comentario de
   codigo o en el docstring de un guion, donde nadie los ve. Dentro de un texto
   que se publica —las observaciones del KAM, las notas de un alta, un hallazgo
   de auditoria, la descripcion de un seguimiento— se imprimen tal cual en la
   pantalla que lee el asesor o la direccion. Ya paso una vez en Auditoria.

   Medido el 19 nov 2026, antes de este guion: TRES cuentas de 225 llevaban
   enlaces en `cuentas.notas` —C69, C70 y C71, las tres altas recientes— y 222
   estaban limpias. O sea: no es un problema del esquema, es un habito mio al
   escribir altas. Por eso el candado va aqui y no en el render.

   POR QUE BARRE TODAS LAS TABLAS Y NO SOLO `cuentas`
   Porque la fuga aparecio en la columna que no estaba mirando. Una sonda que
   vigila un solo sitio da un cero que no vale nada — el mismo vicio que tenian
   las sondas de RLS cuando solo miraban el esquema `public`. Las tablas y las
   columnas se DESCUBREN del spec de PostgREST; no se teclean.

   Lo que NO revisa: los archivos del repositorio. Ahi los enlaces son
   legitimos en comentarios, y los expedientes de auditoria ya los vigila
   `scripts/revisa-dossier-auditoria.mjs`.

   USO
       python scripts/revisa-enlaces-memoria.py

   Sale 1 si encuentra un enlace publicado. Las credenciales se leen de
   `.env.local` y NO se imprimen.
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = {}
for line in io.open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}

# Un enlace de memoria es `[[algo-en-kebab]]`. No se acepta cualquier doble
# corchete: `[[1]]` o `[[ver nota]]` no son enlaces y marcarlos seria ruido.
PAT = re.compile(r'\[\[[a-z0-9][a-z0-9\-]{2,70}\]\]')
TEXTO = ('text', 'character varying', 'json', 'jsonb')
TOPE = 2000          # filas por tabla; si una se llena, se DICE


def get(path):
    r = urllib.request.Request(URL + '/rest/v1/' + path, headers=H)
    with urllib.request.urlopen(r, timeout=180) as x:
        return json.loads(x.read().decode('utf-8', 'replace'))


spec = get('')
defs = spec.get('definitions') or {}
if not defs:
    print(u'*** el spec no trae `definitions`: no se mide sobre vacio.')
    raise SystemExit(1)

print(u'\n  tablas y vistas que expone PostgREST: %d' % len(defs))

fugas = []            # (tabla, llave, columna, enlaces)
truncadas = []
revisadas = 0
celdas = 0

for tabla in sorted(defs):
    props = (defs[tabla] or {}).get('properties') or {}
    cols = sorted(k for k, v in props.items() if (v or {}).get('format') in TEXTO)
    if not cols:
        continue
    # Una llave para poder NOMBRAR la fila en el reporte. Se toma la primera
    # que exista de verdad; si ninguna, se usa el indice.
    llaves = [k for k in ('consecutivo', 'id', 'cuenta_id', 'cid', 'nombre',
                          'empresa', 'folio') if k in props]
    sel = ','.join(sorted(set(llaves + cols)))
    try:
        filas = get('%s?select=%s&limit=%d' % (tabla, sel, TOPE))
    except urllib.error.HTTPError as e:
        print(u'  (!) %-28s no se pudo leer (HTTP %s): NO queda revisada'
              % (tabla, e.code))
        continue
    revisadas += 1
    if len(filas) == TOPE:
        truncadas.append(tabla)
    for i, f in enumerate(filas):
        etq = next((u'%s' % f[k] for k in llaves if f.get(k)), u'fila %d' % i)
        for c in cols:
            v = f.get(c)
            if v is None:
                continue
            if not isinstance(v, str):
                v = json.dumps(v, ensure_ascii=False)
            celdas += 1
            hits = sorted(set(PAT.findall(v)))
            if hits:
                fugas.append((tabla, etq, c, hits))

print(u'  tablas con columnas de texto revisadas: %d · celdas con dato: %d'
      % (revisadas, celdas))
if truncadas:
    print(u'  (!) LEIDAS SOLO LAS PRIMERAS %d FILAS de: %s — esas tablas quedan'
          u' revisadas EN PARTE, no al 100%%' % (TOPE, u', '.join(truncadas)))

print(u'\n  ' + u'-' * 70)
if fugas:
    print(u'  %d TEXTO(S) PUBLICADO(S) CON ENLACE DE MEMORIA:' % len(fugas))
    for tabla, etq, col, hits in fugas:
        print(u'    *** %s.%s · %s  ->  %s' % (tabla, col, etq, u', '.join(hits)))
    print(u'\n  Un [[enlace]] se escribe en el COMENTARIO del guion que genera el')
    print(u'  texto, no dentro del texto. En el texto va la regla con palabras.')
    raise SystemExit(1)
print(u'  Ningun enlace de memoria llega a una pantalla.')
