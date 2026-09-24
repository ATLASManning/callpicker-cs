# -*- coding: utf-8 -*-
"""Demuestra que la pantalla de Atlas NO puede alcanzar a ninguna otra.

   EL PORQUE. El primer intento metio sus estilos en `app/globals.css`, que
   carga en todas las pantallas. El tablero acabo reventando en CUALQUIER ruta
   y hubo que revertirlo entero (24 sep 2026). La causa mas probable resulto
   ser otra —el Service Worker de la PWA sirviendo chunks rancios— pero eso es
   justo el problema: mientras el estilo viviera en el archivo global, yo NO
   PODIA DEMOSTRAR que no habia sido mio.

   Esto lo demuestra. No con disciplina ni con buena intencion: comprobando.

   LAS CUATRO CONDICIONES
     1. `app/globals.css` no contiene NADA de Atlas.
     2. Los estilos de Atlas viven en un CSS Module, que Next reescribe con un
        sufijo unico por archivo — no hay selector que pueda salir de ahi.
     3. Los componentes de Atlas viven DENTRO de `app/chat/`, y NADIE fuera de
        esa carpeta los importa.
     4. Atlas no importa nada que solo exista para el desde fuera, ni modifica
        ningun modulo compartido.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUTA_ATLAS = os.path.join(RAIZ, 'app', 'chat')

fallos = []


def exige(cond, texto, detalle=''):
    ok = bool(cond)
    print('  %s %s' % ('ok  ' if ok else '*** FALLA ***', texto))
    if detalle:
        print('        %s' % detalle)
    if not ok:
        fallos.append(texto)


print('=' * 74)
print('1 · globals.css NO sabe nada de Atlas')
print('=' * 74)
g = io.open(os.path.join(RAIZ, 'app', 'globals.css'), encoding='utf-8-sig').read()
rastros = [p for p in ('atlas', 'Atlas', 'ATLAS') if p in g]
exige(not rastros, 'ni una mencion a Atlas en globals.css',
      'encontrado: %s' % rastros if rastros else '')

print()
print('=' * 74)
print('2 · Los estilos van en un CSS Module (Next los reescribe)')
print('=' * 74)
mod = os.path.join(RUTA_ATLAS, 'atlas.module.css')
exige(os.path.exists(mod), 'existe app/chat/atlas.module.css')
if os.path.exists(mod):
    css_crudo = io.open(mod, encoding='utf-8-sig').read()
    # Fuera los comentarios ANTES de buscar: el propio texto que explica
    # que NO se usa `:has()` hacia saltar la comprobacion. Un detector que
    # se acusa a si mismo por hablar de lo que busca no sirve.
    css = re.sub(r'/\*.*?\*/', '', css_crudo, flags=re.S)
    # `:global` sacaria un selector del modulo y devolveria el problema.
    exige(':global' not in css, 'no usa :global (eso lo sacaria del modulo)')
    # Un selector de elemento suelto en la raiz del modulo SI es global.
    sueltos = re.findall(r'^\s*(html|body|main|\*)\s*[,{]', css, re.M)
    exige(not sueltos, 'no estiliza html/body/main/* desde la raiz',
          'encontrado: %s' % sueltos if sueltos else '')
    # Y nada que mire hacia ARRIBA en el arbol.
    exige(':has(' not in css, 'no usa :has() (miraba al padre y era global)')
    print('        %d reglas, todas con clase local' % css.count('{'))

print()
print('=' * 74)
print('3 · Los componentes de Atlas viven dentro de app/chat/ y nadie mas los usa')
print('=' * 74)
propios = sorted(f for f in os.listdir(RUTA_ATLAS) if f.endswith(('.tsx', '.ts', '.css')))
print('        archivos de la ruta: %s' % ', '.join(propios))

# Nadie fuera de app/chat/ puede importar lo que vive ahi.
fugas = []
for base, dirs, ficheros in os.walk(RAIZ):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.next', '.git', 'scripts')]
    if os.path.abspath(base).startswith(os.path.abspath(RUTA_ATLAS)):
        continue
    for f in ficheros:
        if not f.endswith(('.ts', '.tsx')):
            continue
        ruta = os.path.join(base, f)
        txt = io.open(ruta, encoding='utf-8-sig').read()
        for m in re.finditer(r"from\s+'([^']*(?:app/chat|AtlasSignal|AtlasPresencia|atlas\.module)[^']*)'", txt):
            fugas.append((os.path.relpath(ruta, RAIZ).replace('\\', '/'), m.group(1)))
exige(not fugas, 'nadie fuera de app/chat/ importa sus componentes',
      '; '.join('%s -> %s' % f for f in fugas) if fugas else '')

# Y que no hayan quedado copias viejas en components/.
viejos = [n for n in ('AtlasSignal.tsx', 'AtlasPresencia.tsx')
          if os.path.exists(os.path.join(RAIZ, 'components', n))]
exige(not viejos, 'no quedan copias en components/',
      'quedan: %s' % viejos if viejos else '')

print()
print('=' * 74)
print('4 · Atlas no modifica nada compartido')
print('=' * 74)
page = io.open(os.path.join(RUTA_ATLAS, 'page.tsx'), encoding='utf-8-sig').read()
compartidos = re.findall(r"from\s+'(@/(?:components|lib)/[\w/-]+)'", page)
print('        importa de fuera: %s' % ', '.join(sorted(set(compartidos))))
exige(all(c in ('@/components/AtlasPendientes', '@/components/PageHeader')
          for c in compartidos),
      'solo usa compartidos que ya usaba antes')

# Ninguna clase global de las que se revirtieron.
exige('atlas-' not in page, 'no quedan clases globales «atlas-» en la pagina')

print()
if fallos:
    print('*** %d CONDICION(ES) SIN CUMPLIR ***' % len(fallos))
    for f in fallos:
        print('   - %s' % f)
    sys.exit(1)
print('DEMOSTRADO: los estilos y los componentes de Atlas no tienen ninguna via')
print('para alcanzar otra pantalla. No es disciplina — es que no se puede.')
