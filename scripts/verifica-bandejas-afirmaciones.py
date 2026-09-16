"""Verifica a mano las refutaciones del panel adversarial sobre las bandejas.

   Los agentes pueden equivocarse. Cada afirmacion grave se comprueba aqui
   contra app/callpicker-chat/chat-data.ts, que es el dato que la pantalla lee.
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
        if s.startswith(']'):
            break
        if s.startswith('{'):
            CL.append(json.loads(s.rstrip(',')))

bandejas = [(c, b) for c in CL for b in (c.get('inboxes') or [])]
print('clientes %d · bandejas %s' % (len(CL), format(len(bandejas), ',')))

# ── 1. ¿Las 208 «WhatsApp API» son de un solo cliente? ──────────────────────
api = [(c, b) for c, b in bandejas if b.get('tipo') == 'WhatsApp API']
qr  = [(c, b) for c, b in bandejas if b.get('tipo') == 'WhatsApp QR']
porCli = collections.Counter(c['nombre'] for c, b in api)
print()
print('=== 1 · ¿la ventaja de la API es un solo cliente? ===')
print('  bandejas WhatsApp API: %d' % len(api))
for n, k in porCli.most_common(4):
    print('    %-34s %3d  (%.0f%%)' % (n[:34], k, 100 * k / len(api)))
mayor = porCli.most_common(1)[0]
print('  API sin «%s»: %d   ·   QR: %d' % (mayor[0][:24], len(api) - mayor[1], len(qr)))

# ── 2. ¿Los ceros de la API son ocio o falta de medicion? ──────────────────
def reparto(par):
    r = collections.Counter(b.get('reconciliacion') for c, b in par)
    conTrafico = sum(1 for c, b in par if (b.get('mensajes') or 0) > 0)
    okCero = sum(1 for c, b in par if b.get('reconciliacion') == 'OK' and not (b.get('mensajes') or 0))
    return r, conTrafico, okCero

for etq, par in (('WhatsApp API', api), ('WhatsApp QR', qr)):
    r, ct, ok0 = reparto(par)
    print()
    print('=== 2 · %s (%d bandejas) ===' % (etq, len(par)))
    print('    reconciliación : %s' % dict(r))
    print('    con tráfico    : %d' % ct)
    print('    OCIOSAS de verdad (recon OK y 0 mensajes): %d' % ok0)

# ── 3. ¿El corte tipo/sin-tipo es de fecha? ────────────────────────────────
# El periodo vive en el cliente; se usa como aproximacion.
print()
print('=== 3 · ¿«sin tipo» es hueco de dato o corte de fecha? ===')
per = collections.defaultdict(collections.Counter)
for c, b in bandejas:
    per['con tipo' if b.get('tipo') else 'sin tipo'][c.get('periodo')] += 1
for k in ('con tipo', 'sin tipo'):
    top = per[k].most_common(4)
    print('  %-9s periodos: %s' % (k, ', '.join('%s×%d' % (p, n) for p, n in top)))

# ── 4. ¿Gas Economico domina el QR? ────────────────────────────────────────
volQR = collections.Counter()
for c, b in qr:
    volQR[c['nombre']] += b.get('mensajes') or 0
tot = sum(volQR.values())
print()
print('=== 4 · concentración del volumen QR (total %s) ===' % format(tot, ','))
acum = 0
for n, v in volQR.most_common(5):
    acum += v
    print('  %-40s %9s  %5.1f%%   acumulado %5.1f%%' % (n[:40], format(v, ','), 100*v/tot, 100*acum/tot))

# ── 5. ¿Los clientes mas grandes aportan cero clasificado? ─────────────────
print()
print('=== 5 · los clientes de mayor volumen, ¿aportan mensajes clasificados? ===')
grandes = sorted(CL, key=lambda c: -(c.get('mensajes') or 0))[:9]
totPort = sum(c.get('mensajes') or 0 for c in CL)
sumG = clasG = 0
for c in grandes:
    clas = sum(b.get('mensajes') or 0 for b in (c.get('inboxes') or []) if b.get('tipo'))
    sumG += c['mensajes']; clasG += clas
    print('  %-34s %9s mensajes   clasificados por tipo: %s' % (c['nombre'][:34], format(c['mensajes'], ','), format(clas, ',')))
print('  -> esos 9 son el %.1f%% del portafolio y aportan %s mensajes clasificados' % (100*sumG/totPort, format(clasG, ',')))

# ── 6. ¿Cuadra el conteo de contratadas? ──────────────────────────────────
declaradas = sum(c.get('inboxesContratados') or 0 for c in CL)
publicadas = sum(1 for c, b in bandejas if b.get('contratado'))
print()
print('=== 6 · contratadas: lo declarado vs lo publicado ===')
print('  suma de inboxesContratados por cliente : %d' % declaradas)
print('  bandejas con contratado=true           : %d' % publicadas)
print('  -> faltan %d bandejas contratadas en el desglose' % (declaradas - publicadas))
relleno = sum(c.get('inboxesRelleno') or 0 for c in CL)
print('  inboxesRelleno (descartadas sin id/nombre): %d' % relleno)
