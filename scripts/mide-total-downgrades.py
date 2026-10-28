# -*- coding: utf-8 -*-
u"""MIDE EL HUECO ENTRE `downgradeTotalReal` Y LA SUMA DE LAS FILAS.

   La pantalla calcula el ingreso perdido por downgrade SUMANDO LAS FILAS, y
   nunca consulta `downgradeTotalReal`. Cuando el corte detalla un top y declara
   un total mayor, la tarjeta publica el top como si fuera el mes entero.

   Esto mide CUANTO se esta subdeclarando en cada corte, antes de arreglarlo.
   Es de SOLO LECTURA. [[feedback-tablas-deben-cerrar]]

   USO
       python scripts/mide-total-downgrades.py
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

RX_TOTAL = re.compile(r'downgradeTotalReal:\s*([0-9.]+)')
RX_ID = re.compile(r"\bid:\s*'([^']+)'")
RX_PERDIDA = re.compile(r'perdida:\s*([0-9.]+)')


def d(x):
    return u'$' + format(round(x, 2), ',.2f')


def bloques(texto):
    u"""Cada `downgrades: [` con su contenido, y el id del reporte que lo envuelve."""
    out = []
    for m in re.finditer(r'\bdowngrades:\s*\[', texto):
        # el id mas cercano POR ENCIMA
        ids = RX_ID.findall(texto[:m.start()])
        rid = ids[-1] if ids else u'(sin id)'
        # el total declarado, si aparece entre ese id y aqui
        cab = texto[m.start() - 600:m.start()]
        tot = RX_TOTAL.findall(cab)
        # cerrar el corchete contando profundidad
        i, prof = m.end(), 1
        while i < len(texto) and prof:
            if texto[i] == '[':
                prof += 1
            elif texto[i] == ']':
                prof -= 1
            i += 1
        cuerpo = texto[m.end():i - 1]
        filas = [float(x) for x in RX_PERDIDA.findall(cuerpo)]
        out.append((rid, float(tot[-1]) if tot else None, sum(filas), len(filas)))
    return out


def main():
    todos = []
    for rel in ('app/churn/page.tsx', 'app/churn/reporte-actual.ts'):
        ruta = os.path.join(RAIZ, rel)
        if os.path.exists(ruta):
            todos += bloques(io.open(ruta, encoding='utf-8').read())

    print(u'\n  DOWNGRADES — total declarado contra suma de filas')
    print(u'  ' + u'=' * 74)
    print(u'  %-26s %14s %14s %9s' % (u'corte', u'declarado', u'suma filas', u'filas'))
    print(u'  ' + u'-' * 74)

    desvian, sin_total, oculto = [], [], 0.0
    for rid, tot, suma, n in todos:
        if tot is None:
            sin_total.append((rid, suma, n))
            marca = u'  (no declara)'
        elif abs(tot - suma) < 0.01:
            marca = u'  ok'
        else:
            desvian.append((rid, tot, suma, n))
            oculto += (tot - suma)
            marca = u'  <<< DESVIA %s' % d(tot - suma)
        print(u'  %-26s %14s %14s %9d%s'
              % (rid[:26], d(tot) if tot is not None else u'—', d(suma), n, marca))

    print(u'  ' + u'-' * 74)
    print(u'\n  %d corte(s) declaran un total DISTINTO de lo que suman sus filas.'
          % len(desvian))
    if desvian:
        print(u'  La pantalla publica la SUMA, asi que subdeclara %s en total:' % d(oculto))
        for rid, tot, suma, n in sorted(desvian, key=lambda r: r[1] - r[2], reverse=True):
            print(u'      %-24s publica %-14s cuando el corte dice %-14s (%.0f%% de menos)'
                  % (rid[:24], d(suma), d(tot), 100.0 * (tot - suma) / tot))
    print(u'\n  %d corte(s) no declaran total: ahi la suma de filas ES el dato y'
          % len(sin_total))
    print(u'  esta bien que se publique.')
    print(u'')
    return 0


if __name__ == '__main__':
    sys.exit(main())
