"""Replica lib/chat-bandejas.ts y comprueba lo que la banda va a publicar.

   No hay Node local, asi que la unica forma de saber que el componente dira la
   verdad es reproducir su derivacion sobre el MISMO dato y comparar contra los
   numeros que el texto de la pantalla afirma a mano.
"""
import sys, io, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RUTA = r'D:\Windows\Projects\callpicker-cs\app\callpicker-chat\chat-data.ts'
lineas = io.open(RUTA, encoding='utf-8').read().split('\n')
CL, dentro = [], False
for l in lineas:
    if l.startswith('export const CHAT_CLIENTES'):
        dentro = True; continue
    if dentro:
        s = l.strip()
        if s.startswith(']'): break
        if s.startswith('{'): CL.append(json.loads(s.rstrip(',')))

SIN_TIPO = '(sin tipo en el archivo)'
tipos = collections.defaultdict(lambda: dict(
    bandejas=0, clientes=set(), medidas=0, sinMedicion=0, conTrafico=0,
    ociosas=0, contratadas=0, mensajes=0, porCliente=collections.Counter()))
med = collections.Counter()
conWB, conGS = set(), set()
datos = {}

for c in CL:
    for b in (c.get('inboxes') or []):
        t = tipos[b.get('tipo') or SIN_TIPO]
        m = b.get('mensajes') or 0
        t['bandejas'] += 1; t['clientes'].add(c['cid']); t['mensajes'] += m
        t['porCliente'][c['nombre']] += 1
        if b.get('contratado'): t['contratadas'] += 1
        if m > 0: t['conTrafico'] += 1
        r = b.get('reconciliacion')
        if r == 'OK':
            t['medidas'] += 1
            if m == 0: t['ociosas'] += 1
        elif r in ('LIM', 'ERR'):
            t['sinMedicion'] += 1
        med[r or 'sinDato'] += 1
        if b.get('proveedor') == 'Whatsbail': conWB.add(c['nombre'])
        if b.get('proveedor') == 'Gupshup':   conGS.add(c['nombre'])
    datos[c['nombre']] = (c.get('tier'), len(c.get('inboxes') or []), c.get('mensajes') or 0)

tot = sum(t['bandejas'] for t in tipos.values())
sinT = tipos[SIN_TIPO]['bandejas']
print('=== TABLA QUE VA A PINTAR LA BANDA ===')
print('  %-26s %9s %8s %8s %8s %11s %8s  %s' % ('tipo','bandejas','clientes','medidas','sin ver','con tráfico','ociosas','domina'))
for k, t in sorted(tipos.items(), key=lambda x: -x[1]['bandejas']):
    dom, dn = (t['porCliente'].most_common(1) or [(None, 0)])[0]
    print('  %-26s %9s %8s %8s %8s %11s %8s  %s %d (%.0f%%)'
          % (k[:26], format(t['bandejas'], ','), len(t['clientes']), t['medidas'],
             format(t['sinMedicion'], ','), t['conTrafico'], t['ociosas'],
             str(dom)[:22], dn, 100 * dn / t['bandejas']))

print()
print('=== AFIRMACIONES ESCRITAS A MANO EN LA PANTALLA ===')
api, qr = tipos.get('WhatsApp API', {}), tipos.get('WhatsApp QR', {})
domApi, domApiN = api['porCliente'].most_common(1)[0]
pruebas = [
    ('total de bandejas = 1,068',        tot == 1068,                       tot),
    ('«127 de esas 208 son un cliente»', domApiN == 127 and api['bandejas'] == 208, '%s: %d de %d' % (domApi[:20], domApiN, api['bandejas'])),
    ('«quedan 81 API contra 196 QR»',    api['bandejas'] - domApiN == 81 and qr['bandejas'] == 196,
                                          '%d vs %d' % (api['bandejas'] - domApiN, qr['bandejas'])),
    ('«solo 9 API con medición válida»', api['medidas'] == 9,               api['medidas']),
    ('«ociosas: 7 API contra 17 QR»',    api['ociosas'] == 7 and qr['ociosas'] == 17,
                                          '%d vs %d' % (api['ociosas'], qr['ociosas'])),
]
for etq, ok, val in pruebas:
    print('  %s %-38s %s' % ('ok  ' if ok else '**  ', etq, val))

soloWB = sorted([(datos[x][2], x, datos[x][0], datos[x][1]) for x in conWB if x not in conGS], reverse=True)
print()
print('=== RIESGO POR PROVEEDOR (no depende de clasificar tráfico) ===')
print('  clientes con Whatsbail            : %d' % len(conWB))
print('  de ésos, SIN ninguna Gupshup      : %d' % len(soloWB))
print('  (la banda de continuidad nombra 6, porque exige mensajes clasificados)')
for m, nom, tier, nb in soloWB[:8]:
    print('    %-40s tier %-4s %2d bandejas %9s mensajes' % (nom[:40], tier, nb, format(m, ',')))

print()
print('=== BANDEJA PRINCIPAL ===')
prin = collections.Counter(); volCon = 0; filas = []
for c in CL:
    ct = [b for b in (c.get('inboxes') or []) if (b.get('mensajes') or 0) > 0]
    if not ct: continue
    total = sum(b['mensajes'] for b in ct)
    top = max(ct, key=lambda b: b['mensajes'])
    prin[top.get('tipo') or SIN_TIPO] += 1
    volCon += c.get('mensajes') or 0
    filas.append((top['mensajes'], c['nombre'], top.get('nombre'), top.get('tipo') or SIN_TIPO,
                  100 * top['mensajes'] / total, len(c.get('inboxes') or [])))
volTot = sum(c.get('mensajes') or 0 for c in CL)
print('  cubre %d de %d clientes  ·  %.1f%% del volumen' % (len(filas), len(CL), 100 * volCon / volTot))
for k, v in prin.most_common():
    print('    %-26s %d clientes' % (k[:26], v))
print('  las de mayor volumen:')
for m, cli, ban, tp, peso, nb in sorted(filas, reverse=True)[:6]:
    print('    %-32s %-26s %-16s %8s %5.0f%% de %d' % (cli[:32], str(ban)[:26], tp[:16], format(m, ','), peso, nb))

print()
print('=== EL 34%% CORREGIDO ===')
expl, totPort = 138493, 1427007
volQR = tipos['WhatsApp QR']['mensajes']
print('  WhatsApp QR: %s mensajes' % format(volQR, ','))
print('    %% de lo desglosado (lo que decía antes) : %.0f%%' % (100 * volQR / expl))
print('    %% del portafolio   (lo que dice ahora)  : %.1f%%' % (100 * volQR / totPort))
