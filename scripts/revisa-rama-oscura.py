# -*- coding: utf-8 -*-
u"""Ningun color fuera del tema en la rama OSCURA de un componente compartido.

   EL HUECO QUE TAPA
   -----------------
   `mide-paleta-dashboard.py` vigila una lista de archivos y exige que todo
   color salga de `lib/chart-theme.ts`. Eso vale para los que son SOLO del
   Dashboard. Pero hay componentes que comparten el Dashboard oscuro y las
   pantallas claras, y que llevan la forma `dark ? <del tema> : <paleta
   clara>`. `TopRiesgoTable` es el caso: 23 literales, todos legitimos,
   todos en la rama clara.

   Meter ese archivo en VIGILADOS acusaria su paleta clara, que no es asunto
   del rediseno. Dejarlo fuera sin mas deja la puerta abierta: manana alguien
   escribe `dark ? '#22C55E' : ...` y ningun detector lo ve, con lo que un
   verde se cuela en la paleta cerrada.

   Asi que este detector mira SOLO la rama oscura.

   COMO DECIDE
   -----------
   Para cada literal fuera del tema busca el `dark` mas cercano por delante y
   cuenta los `?` y los `:` que hay entre los dos. Con al menos un `?` y al
   menos un `:` por medio, el color cae DESPUES de los dos puntos: rama clara.
   Con `?` y sin `:`, cae antes: rama OSCURA, y eso se acusa.

   Y cuando no se puede decidir, lo dice. Un verificador que concluye exito
   por defecto es peor que no tenerlo: la primera version de esto usaba dos
   lineas de contexto y dejaba seis casos «sin decidir» que resultaron ser
   todos de la rama clara — los ternarios se parten en cuatro lineas.
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMA = os.path.join(RAIZ, 'lib', 'chart-theme.ts')

# Cuantas lineas de contexto se miran hacia atras para encontrar el `dark`.
# Cuatro, porque `hsColor` en `TopRiesgoTable` abre el ternario en una linea y
# cierra la rama clara tres mas abajo.
CONTEXTO = 4


def sin_comentarios(txt):
    u"""Quita comentarios CONSERVANDO los saltos, para no mover los numeros."""
    return re.sub(r'/\*[\s\S]*?\*/|//[^\n]*',
                  lambda m: re.sub(r'[^\n]', ' ', m.group(0)), txt)


def compartidos():
    u"""Los componentes a los que LA PORTADA les pasa `dark`.

       Ojo con el criterio, porque la primera version lo tenia mal: bastaba
       que la portada importara el componente y que el componente tuviera una
       rama `dark`. Con eso acusaba `PageHeader`, cuya rama oscura es de la
       pantalla de ATLAS IA —la unica que le pasa `dark`— y que ademas tiene
       su propio invariante de aislamiento. Un detector que acusa codigo de
       otra pantalla se acaba silenciando entero.

       Lo que importa es si el DASHBOARD lo pinta oscuro, o sea si en
       `page.tsx` aparece `<Componente ... dark ... />`.
    """
    portada = os.path.join(RAIZ, 'app', 'page.tsx')
    if not os.path.exists(portada):
        return []
    txt = sin_comentarios(io.open(portada, encoding='utf-8').read())

    # 1 · nombre -> ruta, de los imports.
    rutas = {}
    for m in re.finditer(
            r"import\s+(?:(\w+)|\{[^}]*\})[^'\n]*from '@/(components|lib)/([A-Za-z0-9_/\-]+)'",
            txt):
        if not m.group(1):
            continue
        base = os.path.join(RAIZ, m.group(2), *m.group(3).split('/'))
        for ext in ('.tsx', '.ts'):
            if os.path.exists(base + ext):
                rutas[m.group(1)] = base + ext
                break

    # 2 · de esos, los que la portada RENDERIZA con `dark`.
    fuera = []
    for nombre, p in rutas.items():
        for m in re.finditer(r'<%s\b([^>]*)>' % re.escape(nombre), txt):
            props = m.group(1)
            if re.search(r'\bdark\b(?!\s*=\s*\{?\s*false)', props):
                fuera.append(p)
                break
    return sorted(set(fuera))


if not os.path.exists(TEMA):
    print(u'  no hay tema todavia: nada que revisar.')
    sys.exit(0)

PERM = {h.upper() for h in re.findall(r'#[0-9a-fA-F]{6}\b',
                                      io.open(TEMA, encoding='utf-8').read())}

archivos = compartidos()
print(u'\n  %d componente(s) compartido(s) con rama `dark`.' % len(archivos))
print(u'  el tema declara %d colores.\n' % len(PERM))

oscuros, dudosos, claros = [], [], 0

for p in archivos:
    rel = os.path.relpath(p, RAIZ).replace('\\', '/')
    lineas = sin_comentarios(io.open(p, encoding='utf-8').read()).split('\n')
    for n, linea in enumerate(lineas, 1):
        for m in re.finditer(r'#[0-9a-fA-F]{6}\b', linea):
            h = m.group(0).upper()
            if h in PERM:
                continue
            desde = max(0, n - 1 - CONTEXTO)
            ctx = u'\n'.join(lineas[desde:n])
            pos = len(u'\n'.join(lineas[desde:n - 1])) + (1 if n - 1 > desde else 0) + m.start()
            marca = ctx.rfind('dark', 0, pos)
            if marca < 0:
                dudosos.append((rel, n, h, u'ningun `dark` en %d lineas' % CONTEXTO,
                                linea.strip()))
                continue
            tramo = ctx[marca:pos]
            interr = tramo.count('?')
            dosp = len(re.findall(r':(?!:)', tramo))
            if interr >= 1 and dosp >= 1:
                claros += 1
            elif interr >= 1:
                oscuros.append((rel, n, h, u'cae en la rama OSCURA', linea.strip()))
            else:
                dudosos.append((rel, n, h, u'`dark` cerca pero sin ternario',
                                linea.strip()))

print(u'  %d literal(es) en rama clara — legitimos, no son del rediseno.' % claros)

for lista, rotulo in ((oscuros, u'*** EN RAMA OSCURA'), (dudosos, u'??? SIN DECIDIR')):
    if lista:
        print(u'\n  %s: %d' % (rotulo, len(lista)))
        for rel, n, h, por, src in lista:
            print(u'      %s:%d  %s  — %s' % (rel, n, h, por))
            print(u'          %s' % src[:110])

mal = len(oscuros) + len(dudosos)
print(u'\n  %s' % (u'ningun color fuera del tema en rama oscura.' if not mal
                   else u'*** %d caso(s) por resolver.' % mal))
sys.exit(1 if mal else 0)
