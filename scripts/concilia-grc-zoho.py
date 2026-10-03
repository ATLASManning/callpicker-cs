# -*- coding: utf-8 -*-
"""Concilia el `grc-zoho.json` recien generado contra el respaldo anterior.

   POR QUE EXISTE
   --------------
   El export de Zoho REESCRIBE el mes que ya estaba. No lo agrega: lo cambia.
   Ya mordio una vez en el otro dataset —mayo-agosto se movieron -$70,150.54
   contra lo ya reportado a direccion— y solo se vio porque alguien concilio
   antes de publicar.

   `verifica-grc.py` compara contra una tabla ESCRITA A MANO de lo que publica
   el tablero (`PUB`). Cuando el mes se mueve, esa prueba falla — y la
   tentacion es actualizar el numero y seguir. Esto es lo que hay que correr
   ANTES de tocar `PUB`: dice fila por fila QUIEN cambio y POR CUANTO, y exige
   que el delta cierre al centavo. Un numero nuevo que no se puede explicar no
   se publica.

   USO
   ---
       python scripts/concilia-grc-zoho.py data/grc-zoho.<fecha>.bak.json

   Es de SOLO LECTURA.
"""
import collections
import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUEVO = os.path.join(RAIZ, 'data', 'grc-zoho.json')
f_ = lambda v: ('-$' if v < 0 else '$') + format(abs(round(v, 2)), ',.2f')


def carga(ruta):
    with io.open(ruta, encoding='utf-8') as f:
        return json.load(f)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    ant, nue = carga(sys.argv[1]), carga(NUEVO)

    print('=' * 76)
    print('  GRC ZOHO — respaldo  ->  archivo nuevo')
    print('=' * 76)
    print(f"  respaldo: {os.path.basename(sys.argv[1])}")
    print(f"  filas   : {len(ant['filas']):,}  ->  {len(nue['filas']):,}")
    for k in ('mesVivo', 'mes', 'origen'):
        if k in (ant.get('meta') or {}) or k in (nue.get('meta') or {}):
            print(f"  meta.{k:<8}: {(ant.get('meta') or {}).get(k)}  ->  "
                  f"{(nue.get('meta') or {}).get(k)}")

    # ── 1. La serie: que meses CERRADOS se movieron ───────────────────────
    sa = {m['mes']: m for m in ant.get('serie', [])}
    sn = {m['mes']: m for m in nue.get('serie', [])}
    print('\n  LA SERIE — un mes cerrado que se mueve es la senal de alarma')
    print(f"    {'MES':<12} {'MRR INICIO':>28} {'CHURN':>26} {'DOWNGRADE':>26}")
    movidos = []
    for m in sn:
        a, n = sa.get(m), sn[m]
        if not a:
            print(f'    {m:<12}  (NUEVO en este corte)')
            continue
        d = [n['mrrInicio'] - a['mrrInicio'], n['churn'] - a['churn'],
             n['downgrade'] - a['downgrade']]
        if all(abs(x) < 0.01 for x in d):
            print(f"    {m:<12} {'= sin cambio':>28} {'=':>26} {'=':>26}")
            continue
        movidos.append(m)
        print(f"    {m:<12} {f_(a['mrrInicio']) + ' -> ' + f_(n['mrrInicio']):>28} "
              f"{f_(a['churn']) + ' -> ' + f_(n['churn']):>26} "
              f"{f_(a['downgrade']) + ' -> ' + f_(n['downgrade']):>26}")
        print(f"    {'':12} {('delta ' + f_(d[0])):>28} {('delta ' + f_(d[1])):>26} "
              f"{('delta ' + f_(d[2])):>26}")

    # ── 2. Quien cambio, cliente por cliente ──────────────────────────────
    ka = {f['cliente']: f for f in ant['filas']}
    kn = {f['cliente']: f for f in nue['filas']}
    altas = [k for k in kn if k not in ka]
    bajas = [k for k in ka if k not in kn]
    print(f'\n  CLIENTES: {len(altas)} altas · {len(bajas)} BAJAS')
    if bajas:
        print('    ** un cliente que desaparece del export es la otra trampa:')
        for k in sorted(bajas, key=lambda x: -ka[x]['perdida'])[:12]:
            print(f"       {k[:40]:<42} perdia {f_(ka[k]['perdida'])}")

    # ── 3. El delta de perdida, explicado por causa ───────────────────────
    per_a = sum(f['perdida'] for f in ant['filas'])
    per_n = sum(f['perdida'] for f in nue['filas'])
    print(f'\n  PERDIDA REAL: {f_(per_a)}  ->  {f_(per_n)}   delta {f_(per_n - per_a)}')

    causas = collections.Counter()
    montos = collections.Counter()
    detalle = []
    for k in set(ka) | set(kn):
        a, n = ka.get(k), kn.get(k)
        pa = a['perdida'] if a else 0.0
        pn = n['perdida'] if n else 0.0
        if abs(pn - pa) < 0.01:
            continue
        if a is None:
            c = 'cliente NUEVO en el export'
        elif n is None:
            c = 'cliente que DESAPARECIO'
        elif pa > 0 and pn == 0:
            c = 'dejo de ser perdida (facturo)'
        elif pa == 0 and pn > 0:
            c = 'paso a ser perdida'
        else:
            c = 'cambio de monto'
        causas[c] += 1
        montos[c] += pn - pa
        detalle.append((pn - pa, k, c, pa, pn,
                        (a or {}).get('movimiento'), (n or {}).get('movimiento')))

    print('\n  POR QUE CAMBIO')
    print(f"    {'CAUSA':<34} {'n':>5} {'DELTA':>16}")
    for c, n_ in causas.most_common():
        print(f'    {c:<34} {n_:>5} {f_(montos[c]):>16}')
    suma = sum(montos.values())
    print(f"    {'TOTAL':<34} {sum(causas.values()):>5} {f_(suma):>16}")
    cierra = abs(suma - (per_n - per_a)) < 0.01
    print(f"    {'CIERRA contra el delta de perdida':<34} {'':>5} "
          f"{'SI' if cierra else '** NO':>16}")

    print('\n  LOS QUE MAS SE MOVIERON')
    print(f"    {'DELTA':>14}  {'CLIENTE':<34} {'ANTES':>11} {'AHORA':>11}  movimiento")
    for d, k, c, pa, pn, ma, mn in sorted(detalle, key=lambda x: -abs(x[0]))[:15]:
        mov = f'{ma} -> {mn}' if ma != mn else (mn or '-')
        print(f'    {f_(d):>14}  {k[:34]:<34} {f_(pa):>11} {f_(pn):>11}  {mov[:38]}')

    # ── 4. Las canastas ───────────────────────────────────────────────────
    print('\n  LAS TRES CANASTAS')
    print(f"    {'':<16} {'ANTES':>22} {'AHORA':>22}")
    for v in ('baja', 'sigue_viva', 'sin_verificar', 'na'):
        ca = [f for f in ant['filas'] if f['verificacion'] == v]
        cn = [f for f in nue['filas'] if f['verificacion'] == v]
        print(f"    {v:<16} {str(len(ca)) + ' · ' + f_(sum(x['perdida'] for x in ca)):>22} "
              f"{str(len(cn)) + ' · ' + f_(sum(x['perdida'] for x in cn)):>22}")
    assert len(nue['filas']) == sum(
        1 for f in nue['filas'] if f['verificacion'] in ('baja', 'sigue_viva', 'sin_verificar', 'na')
    ), 'las canastas no agotan las filas'
    print('    (las cuatro canastas agotan las filas: comprobado)')

    print()
    if movidos:
        print(f'  MESES QUE SE MOVIERON: {", ".join(movidos)}')
        print('  -> Actualizar la tabla PUB de scripts/verifica-grc.py SOLO con')
        print('     estos valores, y solo si el delta de arriba esta explicado.')
    else:
        print('  Ningun mes se movio.')
    return 0 if cierra else 1


if __name__ == '__main__':
    sys.exit(main())
