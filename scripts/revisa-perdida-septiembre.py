"""¿Donde esta la reestructura de GTC dentro del export?

   Direccion dijo que el $1.7M de churn de septiembre es reestructura de GTC y
   no perdida real. Pero el export clasifica $1,743,993 como «Ingreso Perdido
   Real» y solo $1,069 como «Fraude-Reestructura».

   O el export todavia no aplica ese ajuste, o la reestructura entra por otro
   lado. Este script lo averigua en vez de suponerlo: desglosa la perdida por
   movimiento y busca a GTC fila por fila.
"""
import sys, io, re, collections, openpyxl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

P = r'C:\Users\manni\Downloads\Septiembre.xlsx'
wb = openpyxl.load_workbook(P, data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
ix = {c: i for i, c in enumerate(cab)}
filas = [r for r in it]
wb.close()


def g(r, c):
    i = ix.get(c)
    return r[i] if i is not None else None


def n(v):
    if isinstance(v, (int, float)):
        return float(v)
    s = re.sub(r'[^0-9.\-]', '', str(v or ''))
    try:
        return float(s) if s not in ('', '-', '.') else 0.0
    except ValueError:
        return 0.0


REAL = 'Ingreso Perdido Contrato (BCY) Real'
FRAU = 'Ingreso Perdido Contrato (BCY) Fraude-Reestructura'
GAN = 'Ingreso Ganado Contrato (BCY)'

print('=== LA PERDIDA, DESGLOSADA POR MOVIMIENTO ===')
print('  %-40s %6s %16s %16s' % ('movimiento', 'filas', 'perdida real', 'fraude-reestr.'))
agr = collections.defaultdict(lambda: [0, 0.0, 0.0])
for r in filas:
    m = str(g(r, 'Movimiento MRR') or '(vacío)').strip()
    a = agr[m]
    a[0] += 1
    a[1] += n(g(r, REAL))
    a[2] += n(g(r, FRAU))
for m, (k, real, fra) in sorted(agr.items(), key=lambda x: -x[1][1]):
    print('  %-40s %6s %16s %16s' % (m[:40], format(k, ','), format(round(real), ','), format(round(fra), ',')))
print('  %-40s %6s %16s %16s' % ('TOTAL', format(len(filas), ','),
                                 format(round(sum(v[1] for v in agr.values())), ','),
                                 format(round(sum(v[2] for v in agr.values())), ',')))

print()
print('=== ¿ESTA GTC EN EL EXPORT? ===')
gtc = [r for r in filas if str(g(r, 'Cliente') or '').upper().startswith('GTC')
       or 'TORRES CORZO' in str(g(r, 'Cliente') or '').upper()]
print('  filas GTC: %d' % len(gtc))
tr = tf = tini = tfin = 0.0
for r in sorted(gtc, key=lambda x: -n(g(x, REAL))):
    tr += n(g(r, REAL)); tf += n(g(r, FRAU))
    tini += n(g(r, 'MRR Inicio Contrato (BCY)')); tfin += n(g(r, 'MRR Fin Contrato (BCY)'))
    print('  %-30s %-28s ini $%-10s fin $%-10s perdida $%-11s fraude $%s'
          % (str(g(r, 'Cliente'))[:30], str(g(r, 'Movimiento MRR') or '')[:28],
             format(round(n(g(r, 'MRR Inicio Contrato (BCY)'))), ','),
             format(round(n(g(r, 'MRR Fin Contrato (BCY)'))), ','),
             format(round(n(g(r, REAL))), ','), format(round(n(g(r, FRAU))), ',')))
print('  GTC suma: inicio $%s · fin $%s · perdida real $%s · fraude-reestr. $%s'
      % (format(round(tini), ','), format(round(tfin), ','), format(round(tr), ','), format(round(tf), ',')))

print()
print('=== LAS 10 MAYORES PERDIDAS DECLARADAS COMO «REAL» ===')
print('  %-38s %-26s %14s' % ('cliente', 'movimiento', 'perdida'))
for r in sorted(filas, key=lambda x: -n(g(x, REAL)))[:10]:
    print('  %-38s %-26s %14s'
          % (str(g(r, 'Cliente'))[:38], str(g(r, 'Movimiento MRR') or '')[:26],
             format(round(n(g(r, REAL))), ',')))

print()
print('=== ¿CIERRA LA ARITMETICA DEL MES? ===')
ini = sum(n(g(r, 'MRR Inicio Contrato (BCY)')) for r in filas)
fin = sum(n(g(r, 'MRR Fin Contrato (BCY)')) for r in filas)
real = sum(n(g(r, REAL)) for r in filas)
fra = sum(n(g(r, FRAU)) for r in filas)
gan = sum(n(g(r, GAN)) for r in filas)
print('  MRR inicio  %16s   (tablero: 4,905,228.27)' % format(round(ini, 2), ','))
print('  MRR fin     %16s' % format(round(fin, 2), ','))
print('  perdida real %15s' % format(round(real, 2), ','))
print('  fraude-reestr %14s' % format(round(fra, 2), ','))
print('  ganado      %16s' % format(round(gan, 2), ','))
print()
print('  inicio - perdida - fraude + ganado = %s' % format(round(ini - real - fra + gan, 2), ','))
print('  contra MRR fin                     = %s' % format(round(fin, 2), ','))
d = (ini - real - fra + gan) - fin
print('  diferencia                         = %s  %s'
      % (format(round(d, 2), ','), '(cierra)' if abs(d) < 1 else '** NO CIERRA'))
