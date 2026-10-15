# -*- coding: utf-8 -*-
u"""UN COLOR DE SEÑAL NO SE USA COMO LETRA.

   POR QUE EXISTE
   --------------
   El 15 oct 2026, al darle vida de color a Churn, la medicion en pantalla
   encontro OCHENTA textos por debajo del minimo. Todos el mismo error: el
   color vivo --el del punto del semaforo, el de la barra-- puesto tambien en
   el `color:` de la cifra.

       ambar   #f59e0b sobre su tinte .... 1.80:1   «14 dg.»
       naranja #f97316 sobre su tinte .... 2.29:1   «0 pend.»
       verde   #22c55e sobre su tinte .... 2.22:1   «1.91%»
       rojo    #ef4444 sobre blanco ...... 3.76:1   «$207,297»

   El color de señal comunica en el RELLENO. Como letra no se lee, y en este
   tablero la letra es la cifra: el dato entero.

   QUE BUSCA
   ---------
   `color:` --o `text-<semantico>-400/500`-- con un tono de señal en crudo.
   Lo que NO marca: ese mismo tono en `background`, `borderColor`, `fill` o
   `stroke`, que es donde debe estar.

   La salida da archivo y linea para ir al sitio, y propone la variante: en
   Churn son las constantes `_TX`, calculadas con `tonoSobreClaro`.

   USO
       python scripts/revisa-color-senal-texto.py
       python scripts/revisa-color-senal-texto.py app/churn/page.tsx
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#: Tonos de señal que NO llegan a 4.5:1 como letra sobre claro.
SENAL = {
    '#ef4444': u'rojo    3.76:1 sobre blanco',
    '#f97316': u'naranja 3.08:1',
    '#f59e0b': u'ambar   2.15:1',
    '#22c55e': u'verde   2.22:1',
    '#eab308': u'amarillo 1.75:1',
    '#84cc16': u'lima    1.84:1',
}
#: Las clases de Tailwind equivalentes.
CLASES = re.compile(
    r'\btext-(red|orange|amber|yellow|green|lime)-(300|400|500)\b')

#: `color:` seguido del tono, en estilo en linea o en una constante.
COLOR_HEX = re.compile(
    r'color:\s*[\'"`]?(#(?:' + '|'.join(h[1:] for h in SENAL) + r'))[\'"`]?',
    re.I)


def sin_comentarios(src):
    hueco = lambda m: re.sub(r'[^\n]', ' ', m.group(0))
    return re.sub(r'//[^\n]*', hueco, re.sub(r'/\*[\s\S]*?\*/', hueco, src))


def clases_remapeadas():
    u"""Las clases que `globals.css` ya corrige bajo `.cp-doc` o `.cp-churn`.

    Hace falta o el guion miente: `text-red-500` sigue escrito en el JSX, pero
    si la capa lo repinta a `#B83232` en pantalla PASA. La primera version
    acusaba cinco usos que estaban corregidos, y un detector que marca lo que
    ya esta bien se aprende a ignorar — que es peor que no tenerlo.

    Se mide sobre el CSS, no sobre una lista escrita a mano, para que anadir
    una regla alla la retire de aqui sola.
    """
    css = os.path.join(RAIZ, 'app', 'globals.css')
    if not os.path.exists(css):
        return set()
    src = io.open(css, encoding='utf-8').read()
    return set(re.findall(
        r'\.cp-(?:doc|churn)\s+\.(text-(?:red|orange|amber|yellow|green|lime)-\d{3})',
        src))


def revisa(ruta, cubiertas):
    src = sin_comentarios(io.open(ruta, encoding='utf-8').read())
    # El modulo lleva la capa? Si no, ninguna clase esta cubierta.
    capa = bool(re.search(r'\bcp-(doc|churn)\b', src))
    hallazgos = []
    for i, ln in enumerate(src.split('\n'), 1):
        for m in COLOR_HEX.finditer(ln):
            h = m.group(1).lower()
            hallazgos.append((i, h, SENAL[h], ln.strip()[:74]))
        for m in CLASES.finditer(ln):
            if capa and m.group(0) in cubiertas:
                continue   # la capa de globals.css ya lo repinta
            hallazgos.append((i, m.group(0), u'clase de Tailwind, bajo 4.5:1',
                              ln.strip()[:74]))
    return hallazgos


def main():
    objetivos = sys.argv[1:]
    if not objetivos:
        objetivos = []
        for base in ('app', 'components'):
            for dp, _d, fs in os.walk(os.path.join(RAIZ, base)):
                for f in fs:
                    if f.endswith('.tsx'):
                        objetivos.append(os.path.relpath(
                            os.path.join(dp, f), RAIZ).replace('\\', '/'))

    cubiertas = clases_remapeadas()
    print(u'\n  COLOR DE SEÑAL USADO COMO LETRA')
    print(u'  ' + u'=' * 72)
    print(u'  %d clase(s) ya repintadas por la capa de globals.css: no cuentan'
          % len(cubiertas))
    total = 0
    for rel in sorted(objetivos):
        ruta = os.path.join(RAIZ, *rel.split('/'))
        if not os.path.exists(ruta):
            continue
        hs = revisa(ruta, cubiertas)
        if not hs:
            continue
        print(u'\n  %s' % rel)
        for i, que, por, texto in hs[:10]:
            print(u'    %5d  %-24s %s' % (i, que, por))
            print(u'           %s' % texto)
        if len(hs) > 10:
            print(u'    … y %d mas' % (len(hs) - 10))
        total += len(hs)

    print(u'')
    print(u'  ' + u'=' * 72)
    if total:
        print(u'  *** %d uso(s). El color va en el RELLENO; para la letra, la'
              u' variante oscurecida' % total)
        print(u'      (`tonoSobreClaro`, o las constantes `_TX` de Churn).')
        sys.exit(1)
    print(u'  Ningun color de señal usado como letra.')
    print(u'')


if __name__ == '__main__':
    main()
