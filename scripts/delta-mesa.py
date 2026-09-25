# -*- coding: utf-8 -*-
"""Que CAMBIO en la mesa de ayuda entre los dos ultimos cortes.

   POR QUE EXISTE
   --------------
   Re-extraer el reporte todos los dias no dice nada por si solo: el numero de
   vencidos lleva cuatro cortes clavado en 11 y leerlo asi entrena a no mirarlo.
   Lo que importa es el MOVIMIENTO — que folio entro, cual se resolvio, cual
   lleva un dia mas pudriendose y que cuenta cruzo a grave.

   Es de SOLO LECTURA: lee `data/mesa-ayuda/*.json` y escribe en pantalla.

   USO
   ---
       python scripts/delta-mesa.py              # los dos ultimos cortes
       python scripts/delta-mesa.py 2026-09-24 2026-09-25
"""
import glob
import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(RAIZ, 'data', 'mesa-ayuda')

# Los mismos umbrales que lib/soporte-cuenta.ts, para que la pantalla y esto
# nunca digan cosas distintas de la misma cuenta.
GRAVE_DIAS = 14
GRAVE_RACHA = 8
REINCIDE = 3


def cortes():
    return sorted(glob.glob(os.path.join(DIR, '*.json')))


def lee(ruta):
    return json.load(io.open(ruta, encoding='utf-8'))


def por_folio(corte):
    return {t['folio']: t for t in corte['ticketsVencidos']}


def kpi(corte, clave):
    return corte.get('kpis', {}).get(clave)


def flecha(nuevo, viejo):
    if nuevo is None or viejo is None:
        return '   s/d'
    d = nuevo - viejo
    if d == 0:
        return '    ='
    return '  %+d' % d


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    todos = cortes()
    if len(todos) < 2:
        print('  hacen falta al menos dos cortes; hay %d.' % len(todos))
        return 1

    if len(args) == 2:
        rutas = [os.path.join(DIR, a + '.json') for a in args]
        for r in rutas:
            if not os.path.isfile(r):
                print('  no existe el corte %s' % os.path.basename(r))
                return 1
        ant, act = lee(rutas[0]), lee(rutas[1])
    else:
        ant, act = lee(todos[-2]), lee(todos[-1])

    print('=' * 78)
    print('  MESA DE AYUDA — %s  (contra el corte del %s)' % (act['fecha'], ant['fecha']))
    if act.get('horaCorte'):
        print('  cerrada a las %s' % act['horaCorte'])
    print('=' * 78)
    print()

    # ── KPIs ──────────────────────────────────────────────────────────
    print('  %-22s %6s %6s %7s' % ('', 'HOY', 'AYER', 'CAMBIO'))
    for clave, etiqueta in [('abiertos', 'Tickets abiertos'),
                            ('enEspera', 'En espera'),
                            ('vencidos', 'Fuera de SLA'),
                            ('noAsignados', 'Sin asignar'),
                            ('nuevos24h', 'Nuevos en la ventana'),
                            ('cerrados24h', 'Cerrados en la ventana')]:
        a, b = kpi(act, clave), kpi(ant, clave)
        print('  %-22s %6s %6s %7s'
              % (etiqueta, '-' if a is None else a, '-' if b is None else b, flecha(a, b)))

    pa, pb = por_folio(act), por_folio(ant)
    nuevos = [pa[f] for f in pa if f not in pb]
    salieron = [pb[f] for f in pb if f not in pa]
    siguen = [f for f in pa if f in pb]

    # ── Movimiento ────────────────────────────────────────────────────
    print()
    print('  MOVIMIENTO: %d entraron · %d salieron · %d siguen'
          % (len(nuevos), len(salieron), len(siguen)))

    if nuevos:
        print()
        print('  ENTRARON a fuera de SLA:')
        for t in sorted(nuevos, key=lambda x: -(x['diasSLA'] or 0)):
            print('    + #%-8s %-28s %3s dias  %s'
                  % (t['folio'], (t['cuenta'] or '?')[:28], t['diasSLA'], t['responsable'] or '[sin responsable]'))

    if salieron:
        print()
        print('  SALIERON (resueltos o reasignados):')
        for t in sorted(salieron, key=lambda x: -(x['diasSLA'] or 0)):
            print('    - #%-8s %-28s llevaba %s dias' % (t['folio'], (t['cuenta'] or '?')[:28], t['diasSLA']))

    # ── Los que siguen y empeoran ─────────────────────────────────────
    empeoran = []
    for f in siguen:
        d1 = pa[f].get('diasSLA') or 0
        d0 = pb[f].get('diasSLA') or 0
        if d1 > d0:
            empeoran.append((pa[f], d0, d1))
    if empeoran:
        print()
        print('  SIGUEN Y SUMAN OTRO DIA:')
        for t, d0, d1 in sorted(empeoran, key=lambda x: -x[2]):
            marca = '  <-- GRAVE' if d1 >= GRAVE_DIAS else ''
            print('    ! #%-8s %-28s %d -> %d dias%s'
                  % (t['folio'], (t['cuenta'] or '?')[:28], d0, d1, marca))

    # ── Racha: en cuantos cortes ha aparecido cada cuenta ─────────────
    ventana = [lee(r) for r in todos]
    racha = {}
    for c in ventana:
        for cid in {t['cid'] for t in c['ticketsVencidos']}:
            racha[cid] = racha.get(cid, 0) + 1

    print()
    print('  ESTADO POR CUENTA (corte de hoy):')
    print('    %-9s %-28s %5s %6s %8s %s' % ('CID', 'CUENTA', 'FOL', 'PEOR', 'RACHA', 'SEVERIDAD'))
    porcid = {}
    for t in act['ticketsVencidos']:
        porcid.setdefault(t['cid'], []).append(t)
    for cid, ts in sorted(porcid.items(), key=lambda x: -max((t['diasSLA'] or 0) for t in x[1])):
        peor = max((t['diasSLA'] or 0) for t in ts)
        r = racha.get(cid, 0)
        sev = 'grave' if (peor >= GRAVE_DIAS or r >= GRAVE_RACHA) else 'atencion'
        nota = ' · reincide' if r >= REINCIDE else ''
        print('    %-9s %-28s %5d %6d %6d/%d %s%s'
              % (cid, (ts[0]['cuenta'] or '?')[:28], len(ts), peor, r, len(ventana), sev, nota))

    # ── Cierre ────────────────────────────────────────────────────────
    declarado = kpi(act, 'vencidos')
    extraidos = len(act['ticketsVencidos'])
    print()
    if declarado is not None and declarado != extraidos:
        print('  *** NO CIERRA: el reporte declara %d vencidos y se extrajeron %d.'
              % (declarado, extraidos))
        return 1
    print('  CIERRA: %d folios extraidos = los %s que declara el reporte.'
          % (extraidos, declarado))
    print('  Reparto: %d entraron + %d siguen = %d de hoy; ayer eran %d.'
          % (len(nuevos), len(siguen), extraidos, len(pb)))
    if len(nuevos) + len(siguen) != extraidos:
        print('  *** el reparto no suma.')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
