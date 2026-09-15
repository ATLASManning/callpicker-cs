"""Cuanto se pierde por el corte de 14 destinos en el panel «Analisis de Llamadas».

   El generador de la FICHA de cuenta (gen-llamadas-data.py:243-247) recorta al
   top-N pero guarda el resto en un bucket «otros destinos» y ademas verifica el
   cierre con un assert. El generador del PANEL GLOBAL (gen-analisis-llamadas.py:171)
   hace `[:14]` y tira lo demas sin bucket ni verificacion.

   Este script mide la consecuencia sobre data/analisis-llamadas.json:
     · cuantas cuentas topan el corte
     · cuantas no contestadas quedan fuera de la tabla
     · cuantas contestadas quedan fuera (el sesgo es peor aqui: el corte ordena
       por perdidas, asi que el destino que contesta casi todo es el primero que cae)
     · si la columna «Sin contestar» de la tabla reconcilia con el KPI de cabecera
"""
import sys, io, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

D = json.load(io.open(r'D:\Windows\Projects\callpicker-cs\data\analisis-llamadas.json', encoding='utf-8'))
cuentas = D['cuentas']

topan = 0
lostTotal = lostEnTabla = 0
contTotal = contEnTabla = 0
peores = []

for cid, c in cuentas.items():
    e = c.get('ent')
    if not e:
        continue
    # Verdad de la cuenta: los tipos se acumulan ANTES del recorte.
    lost = e['tipos'].get('Lost', 0)
    cont = e['total'] - lost
    # Lo que sobrevivio al [:14]
    dl = sum(x['l'] for x in e['dest'])
    dc = sum(x['c'] for x in e['dest'])
    lostTotal += lost; lostEnTabla += dl
    contTotal += cont; contEnTabla += dc
    if len(e['dest']) >= 14:
        topan += 1
    if lost - dl > 0:
        peores.append((lost - dl, cont - dc, c['empresa'][:36], cid, len(e['dest'])))

print('=== CORTE DE 14 DESTINOS POR CUENTA ===')
print('  cuentas con entrantes            : %d' % sum(1 for c in cuentas.values() if c.get('ent')))
print('  cuentas que TOPAN el corte (>=14): %d' % topan)
print()
print('  NO CONTESTADAS')
print('    reales (KPI de cabecera)       : %s' % format(lostTotal, ','))
print('    visibles en la tabla           : %s' % format(lostEnTabla, ','))
print('    fuera de la tabla              : %s  (%.2f%%)'
      % (format(lostTotal - lostEnTabla, ','), 100 * (lostTotal - lostEnTabla) / max(lostTotal, 1)))
print()
print('  CONTESTADAS')
print('    reales                         : %s' % format(contTotal, ','))
print('    visibles en la tabla           : %s' % format(contEnTabla, ','))
print('    fuera de la tabla              : %s  (%.2f%%)'
      % (format(contTotal - contEnTabla, ','), 100 * (contTotal - contEnTabla) / max(contTotal, 1)))

print()
print('=== CUENTAS DONDE MAS SE PIERDE ===')
print('  %-38s %6s %12s %12s %6s' % ('empresa', 'CID', 'perd.fuera', 'cont.fuera', 'dest'))
for l, cc, emp, cid, nd in sorted(peores, reverse=True)[:12]:
    print('  %-38s %6s %12s %12s %6d' % (emp, cid, format(l, ','), format(cc, ','), nd))

print()
print('  cuentas con algo fuera de la tabla: %d de %d'
      % (len(peores), sum(1 for c in cuentas.values() if c.get('ent'))))
print()
print('LECTURA: el KPI «Sin contestar» de la cabecera usa el total real; la tabla')
print('de destinos solo suma lo que sobrevivio al corte. Por eso no reconcilian.')
