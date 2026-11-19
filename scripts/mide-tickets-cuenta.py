# -*- coding: utf-8 -*-
u"""MIDE LOS TICKETS DE UNA CUENTA, CON LAS REGLAS DE `lib/tickets-norm.ts`.

    python -I scripts/mide-tickets-cuenta.py <CID>

POR QUÉ EXISTE
--------------
Cada expediente de auditoría publica las mismas ocho cifras de la mesa
—cuántos, de qué producto, cuántas fallas, la mediana y la media de
resolución, el que más tardó, los que pasaron de siete días— y hasta ahora
cada uno las volvía a contar a mano. Teclear una cifra que el dato puede mover
sin avisar es la forma más barata de publicar una mentira
([[feedback-verificar-antes-asegurar]]).

LAS TRES TRAMPAS QUE ESTE GUION RESPETA, porque `lib/tickets-norm.ts` las
documenta y saltárselas ya costó cifras publicadas:

  1. `fecha`/`mes` es el mes de CIERRE, no de apertura. Un ticket abierto en
     enero y cerrado en septiembre se grafica en septiembre. Aquí salen LOS
     DOS ejes, cada uno con su nombre.

  2. EL EXPORT SÓLO TRAE CERRADOS. «Abiertos: 0» no es una medición, es la
     forma de la fuente. `ABIERTOS_MEDIBLE` se calcula del propio archivo y se
     imprime como lo que es.

  3. EL PRODUCTO SON TRES CAJONES —Chat, Voz y «sin producto»—, no dos. Una
     pantalla que enseñaba dos dejaba fuera a los que el export no clasifica.

  4. La mediana se toma del par central cuando n es par. `dur[n // 2]` coge el
     valor SUPERIOR y siempre sesga arriba: eso ya publicó un 70 donde había
     un 69.

Los CIDs internos 0 y 1 (Callpicker, Digitum, pruebas) se avisan y no se
cuentan como cliente, igual que hace la capa de normalización.
"""
from __future__ import division

import io
import json
import os
import sys
from collections import Counter

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FUENTE = os.path.join(RAIZ, 'lib', 'tickets-data.json')

INTERNOS = ('0', '1')


def mediana(xs):
    u"""El par central promediado. Nunca `xs[n // 2]`, que sesga arriba."""
    s = sorted(xs)
    n = len(s)
    if not n:
        return None
    if n % 2:
        return s[n // 2]
    return (s[n // 2 - 1] + s[n // 2]) / 2.0


def main():
    if len(sys.argv) < 2:
        print(u'  uso: python -I scripts/mide-tickets-cuenta.py <CID>')
        return 2
    cid = sys.argv[1].strip()

    filas = json.load(io.open(FUENTE, encoding='utf-8'))
    tot_archivo = len(filas)
    sin_cierre_archivo = sum(1 for r in filas if not (r.get('cierre') or '').strip())

    t = [r for r in filas if str(r.get('cid') or '').strip() == cid]
    if not t:
        print(u'\n  El CID %s no tiene NI UN ticket en el archivo (leído, no supuesto).' % cid)
        print(u'  Y eso no es «cero tickets abiertos»: el export sólo trae cerrados.')
        return 0

    empresa = t[0].get('empresa') or u'(sin nombre)'
    print(u'\n  TICKETS DEL CID %s · %s' % (cid, empresa))
    print(u'  ' + u'=' * 70)
    if cid in INTERNOS:
        print(u'  *** OJO: es un CID INTERNO (Callpicker / pruebas). No es cliente.')

    print(u'\n  Totales')
    print(u'    tickets del CID ............ %d' % len(t))
    print(u'    el archivo entero .......... %d filas' % tot_archivo)

    # ── 2. «Abiertos» no es cero: es la forma de la fuente ──────────────
    sin_cierre = [r for r in t if not (r.get('cierre') or '').strip()]
    medible = sin_cierre_archivo > tot_archivo * 0.02
    print(u'\n  ¿Se pueden medir los ABIERTOS?')
    print(u'    filas sin cierre en el archivo ... %d de %d (%.2f%%)'
          % (sin_cierre_archivo, tot_archivo, 100.0 * sin_cierre_archivo / tot_archivo))
    print(u'    ABIERTOS_MEDIBLE ................ %s' % (u'SÍ' if medible else u'NO'))
    if not medible:
        print(u'    → «abiertos: %d» NO es una medición. El export sólo trae'
              u' cerrados.' % len(sin_cierre))

    # ── 1. Los DOS ejes temporales, cada uno con su nombre ──────────────
    por_cierre = Counter((r.get('fecha') or r.get('mes') or u'?')[:7] for r in t)
    por_apertura = Counter((r.get('apertura') or u'?')[:7] for r in t)
    print(u'\n  Por mes de CIERRE (que es lo que trae la columna `fecha`)')
    for m in sorted(por_cierre):
        print(u'    %s  %s %d' % (m, u'▇' * por_cierre[m], por_cierre[m]))
    print(u'  Por mes de APERTURA')
    for m in sorted(por_apertura):
        print(u'    %s  %s %d' % (m, u'▇' * por_apertura[m], por_apertura[m]))
    if sorted(por_cierre) != sorted(por_apertura):
        print(u'    → los dos ejes NO cubren los mismos meses: decir «mes» a'
              u' secas aquí es ambiguo.')

    # ── 3. El producto son TRES cajones ─────────────────────────────────
    prod = Counter((r.get('producto') or u'').strip() or u'(sin producto)' for r in t)
    print(u'\n  Producto (TRES cajones, no dos)')
    for p, n in prod.most_common():
        print(u'    %-18s %d' % (p, n))
    print(u'    suma ............. %d  (%s)'
          % (sum(prod.values()),
             u'cierra' if sum(prod.values()) == len(t) else u'*** NO CIERRA'))

    canal = Counter((r.get('categoria') or u'')
                    .replace(u'(', u'|').replace(u')', u'').split(u'|')[-1].strip()
                    or u'(sin canal)' for r in t)
    print(u'\n  Canal, leído de la categoría')
    for c, n in canal.most_common():
        print(u'    %-18s %d' % (c, n))

    # ── Fallas ──────────────────────────────────────────────────────────
    fallas = [r for r in t if (r.get('es_falla') or '').strip().lower()
              in ('si', u'sí', 'yes', 'true', '1')]
    print(u'\n  Fallas del servicio')
    print(u'    %d de %d (%.1f%%)' % (len(fallas), len(t), 100.0 * len(fallas) / len(t)))
    for r in sorted(fallas, key=lambda r: r.get('apertura') or ''):
        print(u'      · abierta %s · cerrada %s · %s / %s · folio %s'
              % ((r.get('apertura') or u'?')[:10], (r.get('cierre') or u'?')[:10],
                 r.get('categoria'), r.get('subcategoria'), r.get('num')))
    if fallas:
        ult = max((r.get('apertura') or '') for r in fallas)[:10]
        ult_cualquiera = max((r.get('apertura') or '') for r in t)[:10]
        print(u'    última FALLA abierta ............. %s' % ult)
        print(u'    última apertura de CUALQUIERA .... %s' % ult_cualquiera)
        if ult != ult_cualquiera:
            print(u'    → son fechas distintas. La evidencia del motor acumula'
                  u' `ultima` sobre TODOS\n      los tickets, así que ésa NO es'
                  u' la fecha de la última falla.')

    # ── 4. Resolución: mediana del par central ──────────────────────────
    dur = [float(r['duracion_hrs']) for r in t
           if r.get('duracion_hrs') not in (None, '', '-')]
    if dur:
        med = mediana(dur)
        print(u'\n  Tiempo de RESOLUCIÓN (no antigüedad: estos tickets están cerrados)')
        print(u'    medido sobre ....... %d de %d tickets' % (len(dur), len(t)))
        print(u'    mediana ............ %.1f h  (par central promediado)' % med)
        print(u'    media .............. %.1f h' % (sum(dur) / len(dur)))
        mas = sorted(t, key=lambda r: -float(r.get('duracion_hrs') or 0))[:3]
        for i, r in enumerate(mas, 1):
            h = float(r.get('duracion_hrs') or 0)
            print(u'    el %d.º que más tardó  %8.1f h · %.0f días · folio %s · %s'
                  % (i, h, round(h / 24.0), r.get('num'), r.get('subcategoria')))
        mas7 = [x for x in dur if x > 168]
        print(u'    por encima de 7 días  %d de %d (%.1f%%)'
              % (len(mas7), len(dur), 100.0 * len(mas7) / len(dur)))

    # ── Reincidencias ───────────────────────────────────────────────────
    sub = Counter((r.get('subcategoria') or u'(sin subcategoría)').strip() for r in t)
    print(u'\n  Reincidencias por subcategoría')
    for s, n in sub.most_common(10):
        print(u'    %-38s %d · %.1f%%' % (s[:38], n, 100.0 * n / len(t)))

    print(u'')
    return 0


if __name__ == '__main__':
    sys.exit(main())
