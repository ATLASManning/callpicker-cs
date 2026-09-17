"""Que trae el export de septiembre, antes de construir nada sobre el.

   Direccion fijo las doce columnas que debe llevar el nuevo LTV. Aqui se
   comprueba que existan de verdad, con que nombre exacto, en que unidad, y si
   hay filas repetidas por cliente — que es lo que decide si se suma o se toma
   una sola.

   Interesa especialmente «Ingreso Perdido Contrato (BCY) Fraude-Reestructura»:
   si esa columna separa la reestructura de la perdida real, el nuevo LTV puede
   publicar las dos por separado y no repetir el $1.7M inflado de septiembre.
"""
import sys, io, collections, openpyxl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

P = r'C:\Users\manni\Downloads\Septiembre.xlsx'
wb = openpyxl.load_workbook(P, data_only=True, read_only=True)
print('hojas: %s' % wb.sheetnames)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]

print()
print('=== COLUMNAS DEL ARCHIVO (%d) ===' % len(cab))
for i, c in enumerate(cab):
    print('  %2d  %s' % (i, c))

PEDIDAS = [
    'Cliente', 'clasificacion_cliente', 'Facturas_2026', 'Meses Activo',
    'Importe Acumulado Recurrente', 'MRR Inicio Contrato (BCY)',
    'MRR Fin Contrato (BCY)', 'Ingreso Ganado Contrato (BCY)', 'Movimiento MRR',
    'Ingreso Perdido Contrato (BCY) Real',
    'Ingreso Perdido Contrato (BCY) Fraude-Reestructura',
    'Rango MRR Fin Contrato',
]
print()
print('=== LAS DOCE QUE PIDIO DIRECCION ===')
falt = []
for p in PEDIDAS:
    hay = p in cab
    if not hay:
        falt.append(p)
    print('  %s %s' % ('ok  ' if hay else '** ', p))
if falt:
    print()
    print('  no aparecen con ese nombre exacto. Parecidas:')
    for f in falt:
        clave = f.split()[0].lower()
        print('    %-52s -> %s' % (f[:52], [c for c in cab if clave in c.lower()][:3]))

filas = [r for r in it]
print()
print('filas de datos: %s' % format(len(filas), ','))

ix = {c: i for i, c in enumerate(cab)}


def val(r, col):
    i = ix.get(col)
    return r[i] if i is not None else None


def num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        import re
        s = re.sub(r'[^0-9.\-]', '', str(v or ''))
        return float(s) if s not in ('', '-', '.') else 0.0
    except Exception:
        return 0.0


if 'Cliente' in ix:
    porCli = collections.Counter(str(val(r, 'Cliente') or '').strip() for r in filas)
    rep = {k: v for k, v in porCli.items() if v > 1 and k}
    print('clientes distintos: %s' % format(len(porCli), ','))
    print('clientes con MAS DE UNA fila: %d' % len(rep))
    if rep:
        print('  los de mas filas:')
        for k, v in sorted(rep.items(), key=lambda x: -x[1])[:6]:
            print('    %-42s %d filas' % (k[:42], v))
        print('  -> hay que decidir si se suman o si una anula a la otra.')

for col in ('Movimiento MRR', 'Rango MRR Fin Contrato', 'clasificacion_cliente'):
    if col in ix:
        c = collections.Counter(str(val(r, col) or '(vacío)').strip() for r in filas)
        print()
        print('=== %s ===' % col)
        for k, n in c.most_common(10):
            print('  %-42s %s' % (k[:42], format(n, ',')))

print()
print('=== LA COLUMNA QUE SEPARA LA REESTRUCTURA ===')
for col in ('Ingreso Perdido Contrato (BCY) Real',
            'Ingreso Perdido Contrato (BCY) Fraude-Reestructura',
            'Ingreso Ganado Contrato (BCY)',
            'Importe Acumulado Recurrente',
            'MRR Inicio Contrato (BCY)', 'MRR Fin Contrato (BCY)'):
    if col in ix:
        vals = [num(val(r, col)) for r in filas]
        nz = [v for v in vals if v]
        print('  %-52s suma $%-16s  %d filas con valor'
              % (col[:52], format(round(sum(vals)), ','), len(nz)))

print()
print('=== UNA FILA COMPLETA, PARA VER LAS UNIDADES ===')
if filas:
    for c in cab:
        v = str(val(filas[0], c))[:44]
        if v and v != 'None':
            print('  %-52s %s' % (c[:52], v))
wb.close()
