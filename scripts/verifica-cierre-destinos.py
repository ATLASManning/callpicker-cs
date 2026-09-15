"""Comprueba que la tabla de destinos ahora SI cierra contra el KPI de cabecera.

   Hay dos cortes en la cadena y los dos podian perder datos:
     1. el generador, top-14 por cuenta      -> ahora bolsa «otros destinos» + assert
     2. el API, .slice(0, 15) del agregado   -> ahora lo cortado cae en la misma bolsa

   El paso 2 vive en TypeScript y aqui no hay Node, asi que se replica su logica
   exacta en Python sobre el mismo JSON que consume el endpoint. Si el total de
   la tabla replicada empata con el KPI, el cierre es real de punta a punta.

   Antes del arreglo: 19,320 no contestadas (4.00%) y 281,919 contestadas
   (13.58%) quedaban fuera de la tabla sin que nada lo dijera.
"""
import sys, io, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

OTROS = 'otros destinos'
D = json.load(io.open(r'D:\Windows\Projects\callpicker-cs\data\analisis-llamadas.json', encoding='utf-8'))
cuentas = D['cuentas']

# ── Paso 1: cierre por cuenta (lo que el assert del generador ya exige) ──────
malas = []
for cid, c in cuentas.items():
    e = c.get('ent')
    if not e:
        continue
    lost = e['tipos'].get('Lost', 0)
    total = e['total']
    dl = sum(x['l'] for x in e['dest'])
    dc = sum(x['c'] for x in e['dest'])
    if dl != lost or dc != total - lost:
        malas.append((cid, c['empresa'], lost, dl, total - lost, dc))

print('=== PASO 1 · cierre por cuenta en el JSON ===')
print('  cuentas con entrantes : %d' % sum(1 for c in cuentas.values() if c.get('ent')))
print('  cuentas que NO cierran: %d' % len(malas))
for m in malas[:5]:
    print('    %s' % (m,))

# ── Paso 2: replica exacta de la agregacion del API (cartera completa) ──────
dest = {}
for c in cuentas.values():
    e = c.get('ent')
    if not e:
        continue
    for x in e['dest']:
        a = dest.get(x['d']) or {'l': 0, 'c': 0, 'min': 0, 'n': 0, 'nDesc': False, 'otros': 0}
        a['l'] += x['l']; a['c'] += x['c']; a['min'] += x['min']
        if x['n'] < 0:
            a['nDesc'] = True
        else:
            a['n'] += x['n']
        a['otros'] += x.get('otros', 0)
        dest[x['d']] = a

todos = [dict(d=k, l=v['l'], c=v['c'], min=v['min'],
              n=(-1 if v['nDesc'] else v['n']), otros=v['otros'])
         for k, v in dest.items()]
conNombre = sorted([x for x in todos if x['d'] != OTROS], key=lambda x: -x['l'])
bolsa = conNombre[15:] + [x for x in todos if x['d'] == OTROS]
tabla = conNombre[:15]
if bolsa:
    tabla.append(dict(d=OTROS,
                      l=sum(x['l'] for x in bolsa), c=sum(x['c'] for x in bolsa),
                      min=sum(x['min'] for x in bolsa), n=-1,
                      otros=sum(x['otros'] or 1 for x in bolsa)))

# KPI de cabecera: alcance.total y alcance.perdidas, del conteo completo de tipos
kpiTotal = sum(c['ent']['total'] for c in cuentas.values() if c.get('ent'))
kpiLost = sum(c['ent']['tipos'].get('Lost', 0) for c in cuentas.values() if c.get('ent'))
tablaL = sum(x['l'] for x in tabla)
tablaC = sum(x['c'] for x in tabla)

print()
print('=== PASO 2 · replica del API, cartera completa ===')
print('  renglones en la tabla       : %d' % len(tabla))
print()
print('  KPI «Sin contestar»         : %s' % format(kpiLost, ','))
print('  suma de la tabla            : %s' % format(tablaL, ','))
print('  -> %s' % ('CIERRA' if tablaL == kpiLost else 'NO CIERRA, faltan %s' % format(kpiLost - tablaL, ',')))
print()
print('  Contestadas reales          : %s' % format(kpiTotal - kpiLost, ','))
print('  suma de la tabla            : %s' % format(tablaC, ','))
print('  -> %s' % ('CIERRA' if tablaC == kpiTotal - kpiLost else 'NO CIERRA, faltan %s' % format(kpiTotal - kpiLost - tablaC, ',')))

print()
print('=== LA TABLA COMO SE VERA ===')
print('  %-40s %12s %12s %10s' % ('Destino', 'Sin contestar', 'Contestadas', 'Números'))
for x in tabla:
    etiqueta = ('otros destinos (%s)' % format(x['otros'], ',')) if x['d'] == OTROS and x['otros'] else x['d']
    print('  %-40s %12s %12s %10s' % (etiqueta[:40], format(x['l'], ','), format(x['c'], ','),
                                      format(x['n'], ',') if x['n'] > 0 else '—'))
