# -*- coding: utf-8 -*-
"""Saca de PRODUCCIÓN el marcado real de un módulo y lo deja listo para mirarlo.

   POR QUE EXISTE
   --------------
   Las pruebas de datos no ven un defecto visual. En las gráficas del Dashboard,
   tres defectos reales no los cazó ninguna aserción: había que abrir la
   pantalla. Y aquí no hay Node, así que no hay `next dev` que abrir.

   **Esto NO es una réplica.** Una reproducción escrita a mano en Python miente
   confirmando: reproduce lo que el autor cree que hizo, no lo que el servidor
   sirve. Lo que hace este script es pedir la página REAL a producción y
   recortar el subárbol del módulo tal cual viene, con sus estilos en línea.
   Lo que se ve es lo que hay.

   LO QUE SÃ FALTA, Y HAY QUE SABERLO
   Las clases de Tailwind viven en la hoja compilada del build, que no se
   recorta. Se carga Tailwind por CDN para cubrirlas, pero no es byte a byte:
   un ancho o un `truncate` pueden no coincidir. Para juzgar colores, tabla,
   cifras y desbordes alcanza; para juzgar un pixel de padding, no.

   USO
   ---
       python scripts/mira-modulo.py "Clientes activados arriba de"
       python scripts/mira-modulo.py "Clientes activados" --ruta /activaciones

   Imprime la ruta del .html y el comando para servirlo.
"""
import argparse
import base64
import gzip
import hashlib
import hmac
import io
import json
import os
import re
import sys
import time
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

ap = argparse.ArgumentParser()
ap.add_argument('ancla', help='un trozo de texto que sólo aparezca en el módulo')
ap.add_argument('--ruta', default='/activaciones')
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--salida', default=None)
ap.add_argument('--fondo', default='#EFF6FF')
ap.add_argument('--depurar', action='store_true')
ap.add_argument('--ventana', type=int, default=4000,
                help='cuántos bytes antes del ancla puede abrir la tarjeta')
args = ap.parse_args()


def token():
    """El secreto se LEE del .env.local y no se imprime nunca."""
    env = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as f:
        for l in f:
            l = l.strip()
            if '=' in l and not l.startswith('#'):
                k, v = l.split('=', 1)
                env[k.strip()] = v.strip().strip('"')
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    sec, now = env['JWT_SECRET'].encode(), int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(sec, (cab + '.' + cue).encode(), hashlib.sha256).digest())


r = urllib.request.Request(args.base + args.ruta)
r.add_header('Cookie', 'cp_session=' + token())
r.add_header('Accept-Encoding', 'gzip')
r.add_header('Cache-Control', 'no-cache')
with urllib.request.urlopen(r, timeout=300) as x:
    b = x.read()
    if (x.headers.get('Content-Encoding') or '').lower() == 'gzip':
        b = gzip.decompress(b)
html = b.decode('utf-8', 'replace')
print(u'  %s%s · %d KB' % (args.base, args.ruta, len(html) / 1024))

# â”€â”€ FUERA LOS <script>, Y NO ES COSMÉTICO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Next sirve el payload RSC dentro de etiquetas <script>, con el MISMO marcado
# escapado. Dos consecuencias, y las dos rompieron el primer intento:
#   1. El ancla aparece ANTES en el payload que en el DOM, así que la búsqueda
#      aterrizaba dentro del script.
#   2. Ese payload lleva miles de `<div>` escapados, de modo que el balance de
#      etiquetas contaba basura y el recorte salía vacío — 0 KB.
# Se sustituyen por espacios para no mover ningún índice.
RX_SCRIPT = re.compile(r'<script\b[\s\S]*?</script\s*>', re.I)
html = RX_SCRIPT.sub(lambda m: ' ' * len(m.group(0)), html)
print(u'  sin los <script> del payload RSC: %d KB de DOM' % (
    len(html.replace(' ', '')) / 1024))

i = html.find(args.ancla)
if i < 0:
    print(u'  *** el ancla «%s» no aparece en la página servida.' % args.ancla)
    sys.exit(1)

# â”€â”€ Hacia atrás hasta el <div> que ABRE el módulo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# Se sube etiqueta por etiqueta contando el balance: el <div> que abre es el
# primero que queda sin cerrar por encima del ancla. Buscar «el <div> anterior»
# a secas cae dentro del encabezado y recorta media tarjeta.
RX_TAG = re.compile(r'<(/?)(\w+)([^>]*?)(/?)>')
abiertos = []
for m in RX_TAG.finditer(html, 0, i):
    cierra, nombre, _, auto = m.group(1), m.group(2).lower(), m.group(3), m.group(4)
    if nombre in ('br', 'img', 'input', 'meta', 'link', 'hr', 'path', 'circle'):
        continue
    if auto == '/':
        continue
    if cierra:
        while abiertos and abiertos[-1][0] != nombre:
            abiertos.pop()
        if abiertos:
            abiertos.pop()
    else:
        abiertos.append((nombre, m.start()))

if not abiertos:
    print(u'  *** no se pudo encontrar la etiqueta que abre el módulo.')
    sys.exit(1)

# ── EL CONTENEDOR ES EL MÁS EXTERNO QUE ABRE CERCA, NO EL MÁS INTERNO ──────
# La primera versión tomaba el último <div> sin cerrar, o sea el MÁS INTERNO:
# la columna izquierda del encabezado. Devolvía 384 bytes —el título y el
# subtítulo— y lo imprimía como «0 KB», que se lee igual que un recorte
# correcto de un módulo pequeño. Un recorte parcial que parece completo es
# peor que un error: se mira el fragmento y se concluye que la pantalla está
# bien.
#
# La tarjeta de un módulo abre CERCA de su propio título —aquí 291 bytes
# antes—, mientras que los contenedores de página abren a decenas de miles.
# Así que se sube hasta el <div> más externo que siga dentro de la ventana, y
# la ventana se declara en lugar de quedar implícita.
candidatos = [(n, p) for n, p in abiertos
              if n == 'div' and (i - p) <= args.ventana]
if not candidatos:
    print(u'  *** ningún <div> abre en los %d bytes previos al ancla.' % args.ventana)
    print(u'      Subir --ventana, o el ancla no está dentro de una tarjeta.')
    sys.exit(1)
inicio = candidatos[0][1]          # el más externo de los cercanos
print(u'  contenedor: <div en %d, a %d bytes del ancla (de %d candidatos)'
      % (inicio, i - inicio, len(candidatos)))

# â”€â”€ Hacia delante hasta su cierre â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
prof, fin = 0, None
for m in RX_TAG.finditer(html, inicio):
    cierra, nombre, auto = m.group(1), m.group(2).lower(), m.group(4)
    if nombre in ('br', 'img', 'input', 'meta', 'link', 'hr', 'path', 'circle'):
        continue
    if auto == '/':
        continue
    if nombre != 'div':
        continue
    prof += -1 if cierra else 1
    if prof == 0:
        fin = m.end()
        break
if fin is None:
    print(u'  *** el módulo no cierra: el recorte seria parcial.')
    sys.exit(1)

trozo = html[inicio:fin]
print(u'  recortado: %d bytes de marcado, %d filas de tabla'
      % (len(trozo), trozo.count('<tr')))
if args.depurar or len(trozo) < 2000:
    print(u'\n  â”€â”€ DEPURACIÓN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€')
    print(u'  ancla en %d · inicio %d · fin %d' % (i, inicio, fin))
    print(u'  las 6 etiquetas sin cerrar por encima del ancla, de dentro afuera:')
    for nombre, pos in list(reversed(abiertos))[:6]:
        print(u'     <%-6s en %-8d  %s' % (nombre, pos, html[pos:pos + 110]))
    print(u'\n  lo recortado:\n  %s' % trozo[:400])
    print(u'\n  los 200 caracteres ANTES del ancla:\n  %s' % html[max(0, i - 200):i])
    if len(trozo) < 2000:
        sys.exit(1)

salida = args.salida or os.path.join(
    os.environ.get('TEMP', '.'), 'modulo-recortado.html')
doc = (u'<!doctype html>\n<html lang="es"><head><meta charset="utf-8">\n'
       u'<meta name="viewport" content="width=device-width, initial-scale=1">\n'
       u'<title>Recorte del modulo</title>\n'
       u'<script src="https://cdn.tailwindcss.com"></script>\n'
       u'<style>body{margin:0;padding:28px 32px;background:%s;'
       u'font-family:system-ui,-apple-system,"Segoe UI",sans-serif}</style>\n'
       u'</head><body>\n%s\n</body></html>\n' % (args.fondo, trozo))
with io.open(salida, 'w', encoding='utf-8') as f:
    f.write(doc)
print(u'\n  escrito en: %s' % salida)
print(u'  para verlo:  python -m http.server 8777 --directory "%s"'
      % os.path.dirname(salida))
print(u'  y abrir:     http://localhost:8777/%s' % os.path.basename(salida))
print(u'\n  OJO: faltan las clases de Tailwind del build (se carga el CDN).')
print(u'  Sirve para juzgar color, tabla, cifras y desbordes; no un padding.')

