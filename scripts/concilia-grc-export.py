# -*- coding: utf-8 -*-
"""Diff entre el aaa-grc-data.ts anterior y el recien generado.

   Un export nuevo de Zoho no solo agrega el mes en curso: tambien REESCRIBE
   meses ya cerrados, porque un contrato marcado churn que despues se factura
   desaparece del corte. Esos cambios son invisibles en el total y mueven
   cifras ya reportadas a direccion, asi que aqui se sacan uno por uno y el
   delta tiene que cerrar al centavo.

   Uso: python scripts/concilia-grc-export.py <ts_anterior> <ts_nuevo>
"""
import sys, io, re, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

FILA = re.compile(
    r"\{ cliente: '(.*?)', clas: '([^']*)',.*?"
    r"movimiento: '([^']*)', perdido: ([-\d.]+), perdido2: ([-\d.]+)")

MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
         'Julio', 'Agosto', 'Septiembre']


def lee(ruta):
    s = io.open(ruta, encoding='utf-8').read()
    out = {}
    for b in re.split(r"\n  \{\n    mes: '", s)[1:]:
        mes = b.split("'")[0]
        for cli, clas, mov, per, per2 in FILA.findall(b):
            out.setdefault(mes, []).append(
                {'cliente': cli, 'clas': clas, 'mov': mov,
                 'per': float(per), 'per2': float(per2)})
    return out


ant, nue = lee(sys.argv[1]), lee(sys.argv[2])

print('%-12s %13s %13s %12s   %s' % ('Mes', 'perdida antes', 'perdida ahora', 'delta', 'filas'))
print('-' * 80)
gran_delta = 0.0
detalles = []
for m in MESES:
    a, n = ant.get(m, []), nue.get(m, [])
    pa, pn = sum(f['per'] for f in a), sum(f['per'] for f in n)
    gran_delta += pn - pa
    marca = '' if abs(pn - pa) < 0.01 else '  <<<'
    print('%-12s %13s %13s %12s   %d -> %d%s'
          % (m, format(pa, ',.2f'), format(pn, ',.2f'), format(pn - pa, ',.2f'),
             len(a), len(n), marca))
    if abs(pn - pa) < 0.01 and len(a) == len(n):
        continue
    ia = collections.defaultdict(float); ian = collections.Counter()
    for f in a:
        ia[(f['cliente'], f['mov'])] += f['per']; ian[(f['cliente'], f['mov'])] += 1
    inu = collections.defaultdict(float); inn = collections.Counter()
    for f in n:
        inu[(f['cliente'], f['mov'])] += f['per']; inn[(f['cliente'], f['mov'])] += 1
    for k in sorted(set(ia) | set(inu)):
        d = inu[k] - ia[k]
        if abs(d) < 0.01 and ian[k] == inn[k]:
            continue
        que = 'SALE' if k not in inu else ('ENTRA' if k not in ia else 'CAMBIA')
        detalles.append((m, que, k[0], k[1], ia[k], inu[k], d))

print('-' * 80)
print('%-12s %13s %13s %12s' % ('DELTA TOTAL', '', '', format(gran_delta, ',.2f')))

# El mes nuevo no es un "cambio": se separa para que el movimiento de los meses
# YA REPORTADOS quede a la vista solo.
sep_nuevo = sum(f['per'] for f in nue.get('Septiembre', []))
print('  de los cuales Septiembre (mes nuevo): %s' % format(sep_nuevo, ',.2f'))
print('  movimiento en meses YA CERRADOS:      %s' % format(gran_delta - sep_nuevo, ',.2f'))

if detalles:
    print()
    print('=== CADA FILA QUE CAMBIO EN UN MES YA CERRADO ===')
    print('%-11s %-6s %-44s %12s %12s %12s'
          % ('Mes', 'Que', 'Cliente / movimiento', 'antes', 'ahora', 'delta'))
    suma = 0.0
    for m, que, cli, mov, va, vn, d in detalles:
        if m == 'Septiembre':
            continue
        print('%-11s %-6s %-44s %12s %12s %12s'
              % (m, que, (cli[:28] + ' / ' + mov[:13])[:44],
                 format(va, ',.2f'), format(vn, ',.2f'), format(d, ',.2f')))
        suma += d
    print('%-63s %12s' % ('suma de los cambios listados', format(suma, ',.2f')))
    print()
    ok = abs(suma - (gran_delta - sep_nuevo)) < 0.01
    print('CIERRA: %s' % ('si, al centavo' if ok else
                          'NO - faltan $%s por explicar'
                          % format((gran_delta - sep_nuevo) - suma, ',.2f')))
