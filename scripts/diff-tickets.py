# -*- coding: utf-8 -*-
"""Compara el dataset de tickets recien generado contra el que hay en git HEAD.

   POR QUE EXISTE
   --------------
   Jose Manuel lo dijo con estas palabras: «es lo que existe mas lo que va
   saliendo o integrandose en la semana... es el mismo mas lo nuevo de cada
   semana». O sea que el export es ACUMULATIVO.

   De ahi salen tres comprobaciones que antes nadie hacia:

   1. NADA DEBE DESAPARECER. Si un `ticket_id` que estaba ya no esta, el export
      cambio de criterio o se perdio algo. Es la misma trampa que ya mordio con
      GRC, donde «un export nuevo REESCRIBE meses cerrados» (-$70,150 en
      mayo-agosto) y solo se vio porque alguien concilio antes de publicar.

   2. LOS MESES VIEJOS CRECEN HACIA ATRAS. El export solo trae CERRADOS, asi que
      un ticket abierto el 20 de septiembre entra hasta que cierra — puede que
      la semana siguiente. Medir cuanto crece cada mes entre cortes es la unica
      forma de saber que tan atrasado va el modulo, en vez de intuirlo.

   3. EL VOCABULARIO PUEDE CAMBIAR. Si la mesa empieza a usar una categoria, una
      prioridad o un producto que `lib/tickets-norm.ts` no conoce, caeria en
      «Sin clasificar» SIN QUE NADIE SE ENTERE. Aqui se avisa.

   Es de SOLO LECTURA: no toca ningun archivo.

   USO
   ---
       python scripts/diff-tickets.py           # trabajo vs HEAD
       python scripts/diff-tickets.py HEAD~3    # contra otra revision
"""
import io
import json
import os
import subprocess
import sys
import unicodedata
from collections import Counter, defaultdict
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REL = 'lib/tickets-data.json'

# Mexico va en UTC-6 todo el ano desde 2022 (verificado contra la base de husos
# de Windows). En el codigo de produccion se usa Intl, que sigue bien si la
# politica cambia; aqui basta la resta.
OFFSET = timedelta(hours=6)


def sa(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s or '')
                   if unicodedata.category(c) != 'Mn').lower().strip()


def mes_apertura(t):
    a = t.get('apertura') or ''
    if not a:
        return ''
    try:
        return (datetime.strptime(a[:19], '%Y-%m-%dT%H:%M:%S') - OFFSET).strftime('%Y-%m')
    except ValueError:
        return ''


def carga_de_git(rev):
    r = subprocess.run(['git', 'show', '%s:%s' % (rev, REL)], cwd=RAIZ,
                       capture_output=True, timeout=120)
    if r.returncode != 0:
        return None
    return json.loads(r.stdout.decode('utf-8'))


def vocabulario(filas):
    v = {}
    for campo in ('prioridad', 'categoria', 'subcategoria', 'producto', 'propietario', 'es_falla'):
        v[campo] = Counter(str(t.get(campo) or '') for t in filas)
    return v


def main():
    rev = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'HEAD'

    nuevo = json.load(io.open(os.path.join(RAIZ, REL), encoding='utf-8'))
    viejo = carga_de_git(rev)
    if viejo is None:
        print('  no se pudo leer %s en %s (¿primera version?).' % (REL, rev))
        return 0

    print('=' * 76)
    print('  TICKETS — %s  ->  archivo nuevo' % rev)
    print('=' * 76)
    print()
    print('  filas: %d  ->  %d   (%+d)' % (len(viejo), len(nuevo), len(nuevo) - len(viejo)))

    ids_v = {t.get('ticket_id') for t in viejo if t.get('ticket_id')}
    ids_n = {t.get('ticket_id') for t in nuevo if t.get('ticket_id')}
    altas = ids_n - ids_v
    bajas = ids_v - ids_n
    print('  ticket_id unicos: %d  ->  %d' % (len(ids_v), len(ids_n)))
    print('  nuevos: %d   |   DESAPARECIDOS: %d' % (len(altas), len(bajas)))

    problemas = 0

    # ── 1. Nada debe desaparecer ──────────────────────────────────────
    if bajas:
        problemas += 1
        print()
        print('  *** %d TICKETS DESAPARECIERON. El export deberia ser acumulativo.' % len(bajas))
        porid = {t['ticket_id']: t for t in viejo}
        for tid in list(bajas)[:12]:
            t = porid[tid]
            print('      #%-8s %-26s apertura %s  cierre %s'
                  % (t.get('num'), (t.get('empresa') or '?')[:26],
                     (t.get('apertura') or '')[:10], (t.get('cierre') or '')[:10] or 'SIN CERRAR'))
        if len(bajas) > 12:
            print('      ... y %d mas' % (len(bajas) - 12))
        print('      Antes de publicar: confirmar con direccion si es un cambio de criterio')
        print('      del export o una perdida. NO se sube a produccion sin saberlo.')

    # ── 2. Cuanto crecio cada mes hacia atras ─────────────────────────
    mv = Counter(mes_apertura(t) for t in viejo if mes_apertura(t))
    mn = Counter(mes_apertura(t) for t in nuevo if mes_apertura(t))
    meses = sorted(set(mv) | set(mn))
    print()
    print('  POR MES DE APERTURA — cuanto se rellena hacia atras')
    print('    %-9s %8s %8s %8s   %s' % ('MES', 'ANTES', 'AHORA', 'CAMBIO', ''))
    for m in meses:
        a, b = mv.get(m, 0), mn.get(m, 0)
        d = b - a
        barra = ''
        if d > 0:
            barra = '+%.1f%%' % (100.0 * d / a) if a else 'nuevo'
        print('    %-9s %8d %8d %8s   %s' % (m, a, b, ('%+d' % d) if d else '=', barra))

    crecidos = [(m, mn.get(m, 0) - mv.get(m, 0)) for m in meses if mn.get(m, 0) > mv.get(m, 0)]
    if crecidos:
        viejos = [(m, d) for m, d in crecidos if m != meses[-1]]
        print()
        print('    El mes mas reciente crece por lo obvio. Lo que importa es que los'
              ' ANTERIORES')
        print('    tambien crecen: son tickets que ya estaban abiertos y hasta ahora cerraron.')
        if viejos:
            tot = sum(d for _, d in viejos)
            print('    -> %d tickets entraron en meses YA PASADOS: %s'
                  % (tot, ', '.join('%s +%d' % (m, d) for m, d in viejos)))
            print('    Esa es la medida real del retraso del modulo.')
        else:
            print('    -> ninguno esta vez: todo lo nuevo cae en el ultimo mes.')

    # ── 3. Vocabulario nuevo que la capa de normalizacion no conoce ───
    vv, vn = vocabulario(viejo), vocabulario(nuevo)
    print()
    print('  VOCABULARIO — valores que aparecen por primera vez')
    hubo = False
    for campo in vn:
        nuevos_val = set(vn[campo]) - set(vv[campo])
        if nuevos_val:
            hubo = True
            print('    %s:' % campo)
            for val in sorted(nuevos_val):
                print('      %-46r %d ticket(s)' % (val, vn[campo][val]))
    if not hubo:
        print('    ninguno: los mismos valores de siempre.')
    else:
        print()
        print('    OJO: si alguno de estos es una CATEGORIA o una PRIORIDAD que')
        print('    lib/tickets-norm.ts no reconoce, cae en «Sin clasificar» / «Sin')
        print('    prioridad» sin avisar. Revisar TIPOS y normPrioridad antes de publicar.')

    # ── 4. Sigue siendo un export de solo cerrados? ───────────────────
    sc_v = sum(1 for t in viejo if not str(t.get('cierre') or '').strip())
    sc_n = sum(1 for t in nuevo if not str(t.get('cierre') or '').strip())
    print()
    print('  SIN FECHA DE CIERRE: %d de %d (%.2f%%)  ->  %d de %d (%.2f%%)'
          % (sc_v, len(viejo), 100.0 * sc_v / max(1, len(viejo)),
             sc_n, len(nuevo), 100.0 * sc_n / max(1, len(nuevo))))
    medible = len(nuevo) > 0 and sc_n / len(nuevo) >= 0.01
    print('    ABIERTOS_MEDIBLE quedaria en %s (umbral 1%%).' % ('TRUE' if medible else 'false'))
    if medible:
        print('    *** CAMBIO DE FONDO: el export ya trae abiertos. Toda la pantalla que')
        print('    dice «no medible» hay que revisarla — eso ya no seria cierto.')

    # ── 5. Cobertura y CIDs ───────────────────────────────────────────
    def rango(filas):
        ap = [t.get('apertura') or '' for t in filas if t.get('apertura')]
        return (min(ap)[:10], max(ap)[:10]) if ap else ('—', '—')
    rv, rn = rango(viejo), rango(nuevo)
    print()
    print('  COBERTURA: %s .. %s  ->  %s .. %s' % (rv[0], rv[1], rn[0], rn[1]))
    cid_v = {str(t.get('cid') or '').strip() for t in viejo}
    cid_n = {str(t.get('cid') or '').strip() for t in nuevo}
    print('  CIDs distintos: %d -> %d   (%d nuevos)'
          % (len(cid_v), len(cid_n), len(cid_n - cid_v)))

    # ── Cierre ────────────────────────────────────────────────────────
    print()
    if len(altas) - len(bajas) != len(nuevo) - len(viejo):
        print('  *** el reparto no cuadra: %d altas - %d bajas != %+d de diferencia.'
              % (len(altas), len(bajas), len(nuevo) - len(viejo)))
        problemas += 1
    else:
        print('  CUADRA: %d altas - %d bajas = %+d filas.'
              % (len(altas), len(bajas), len(nuevo) - len(viejo)))

    if problemas:
        print()
        print('  *** %d problema(s). NO publicar sin resolverlos.' % problemas)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
