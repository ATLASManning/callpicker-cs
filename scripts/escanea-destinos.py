"""Cuanto del 'Lost' entrante NO es una llamada perdida de verdad.

   D2 mostro que un destino 'Agente Virtual OOAPAS' recibe llamadas que el
   sistema marca Lost porque ninguna extension humana contesto. Este script
   inventaria TODOS los destinos de las entrantes Lost para ver de que tamano
   es el problema y con que se puede distinguir.
"""
import sys, io, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

ENT = r"C:\Users\manni\OneDrive\Escritorio\Llamadas_entrantes_Clientes_AAA_Poco_Consumo_Actualizado.xlsx"
wb = openpyxl.load_workbook(ENT, data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() for c in next(it)]
ix = {c: k for k, c in enumerate(cab)}

destLost = collections.Counter()
destTodo = collections.Counter()
porCid = collections.defaultdict(lambda: collections.Counter())
n = 0
for r in it:
    n += 1
    t = str(r[ix['destination_type']] or '').strip()
    d = str(r[ix['destination_data_1']] or '').strip()
    d = d if d and d.upper() != 'NULL' else '(sin destino)'
    cid = str(r[ix['customer_id']] or '').strip()
    destTodo[d] += 1
    if t == 'Lost':
        destLost[d] += 1
        porCid[cid][d] += 1
wb.close()

tot = sum(destLost.values())
print('entrantes totales: %s · Lost: %s' % (format(n, ','), format(tot, ',')))
print()
print('=== destinos de las entrantes Lost (top 30) ===')
for d, k in destLost.most_common(30):
    print('  %8s (%5.2f%%)  %s' % (format(k, ','), 100*k/tot, d[:60]))

print()
print('=== destinos que NO parecen extension humana ===')
CLAVES = ['virtual', 'agente', 'bot', 'ia ', ' ia', 'asistente', 'ivr', 'menu', 'menú',
          'cola', 'queue', 'grupo', 'ring', 'hunt', 'buzon', 'buzón', 'voicemail']
sosp = [(d, k) for d, k in destLost.items()
        if any(c in d.lower() for c in CLAVES)]
sosp.sort(key=lambda x: -x[1])
sub = sum(k for _, k in sosp)
print('  %s de %s Lost (%.1f%%) van a un destino no-humano' % (format(sub, ','), format(tot, ','), 100*sub/tot))
for d, k in sosp[:25]:
    print('     %8s  %s' % (format(k, ','), d[:60]))

print()
print('=== cuentas donde el Lost es MAYORITARIAMENTE no-humano ===')
import json
cu = json.load(io.open(r'D:\Proyectos\CP\cartera_asesor.json', encoding='utf-8'))
nom = {str(c.get('cid') or '').strip(): (c['consecutivo'], c['empresa']) for c in cu}
filas = []
for cid, dd in porCid.items():
    t = sum(dd.values())
    nh = sum(k for d, k in dd.items() if any(c in d.lower() for c in CLAVES))
    if t >= 50 and nh / t > 0.30:
        cons, emp = nom.get(cid, ('?', '(fuera de cartera)'))
        filas.append((cons, emp[:30], t, nh, 100*nh/t, dd.most_common(1)[0][0][:34]))
for f in sorted(filas, key=lambda x: -x[4]):
    print('  %-5s %-30s Lost=%-7s no-humano=%-7s %5.1f%%  destino top: %s' % f)
if not filas:
    print('  (ninguna)')
