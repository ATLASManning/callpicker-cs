"""Que sabemos HOY de las bandejas de Callpicker Chat: tipo, proveedor, volumen
   y cual es la bandeja principal de cada cuenta.

   Antes de construir nada hay que saber que tan lejos llega el dato. La
   respuesta corta, que este script comprueba: el tipo de bandeja solo explica
   una fraccion chica del volumen, y eso hay que decirlo en pantalla o el
   tablero mide la ausencia como si fuera medicion.

   Solo lee app/callpicker-chat/chat-data.ts. No cambia nada.
"""
import sys, io, json, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RUTA = r'D:\Windows\Projects\callpicker-cs\app\callpicker-chat\chat-data.ts'
lineas = io.open(RUTA, encoding='utf-8').read().split('\n')

# CHAT_CLIENTES es un objeto por linea entre el [ y el ]
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

RES = next((json.loads(l.split('=', 1)[1].strip().removesuffix(' as const'))
            for l in lineas if l.startswith('export const CHAT_RESUMEN')), {})
SAC = next((json.loads(l.split('=', 1)[1].strip().removesuffix(' as const'))
            for l in lineas if l.startswith('export const CHAT_SACUX')), {})

print('cuentas de chat leidas: %d' % len(CL))
print('resumen declarado     : %s clientes · %s cuentas · %s bandejas · %s mensajes'
      % (RES.get('clientes'), RES.get('cuentas'),
         format(RES.get('inboxes', 0), ','), format(RES.get('mensajes', 0), ',')))

# ── Hasta donde llega la clasificacion ──────────────────────────────────────
v = SAC.get('volumen', {})
print()
print('=== HASTA DONDE LLEGA EL DATO (lo que limita todo lo demas) ===')
print('  mensajes totales            : %s' % format(v.get('total', 0), ','))
print('  explicados por bandeja      : %s  (%.1f%%)' % (format(v.get('explicadoPorBandeja', 0), ','), v.get('pctExplicado', 0)))
print('  clasificados por TIPO       : %s  (%.1f%%)' % (format(v.get('clasificadoPorTipo', 0), ','), v.get('pctClasificado', 0)))
print('  -> el %.1f%% del volumen NO tiene tipo conocido' % (100 - v.get('pctClasificado', 0)))

print()
print('=== MEZCLA DE CANAL declarada (sobre lo que si se pudo clasificar) ===')
mz = SAC.get('mezclaCanal', {})
tot = sum(mz.values()) or 1
for k, n in sorted(mz.items(), key=lambda x: -x[1]):
    if n:
        print('  %-26s %10s  %5.1f%% de lo clasificado' % (k, format(n, ','), 100 * n / tot))
sinCl = mz.get('Sin clasificar', 0)
print('  -> «Sin clasificar» solo es %.1f%% de esta tabla' % (100 * sinCl / tot))

# ── Bandejas: tipo, proveedor, estado ───────────────────────────────────────
tipos = collections.Counter(); prov = collections.Counter()
volTipo = collections.Counter(); contra = collections.Counter()
act = collections.Counter(); obs = collections.Counter()
nB = 0
principal = collections.Counter()
conMasDeUna = mixtas = 0

for c in CL:
    inb = c.get('inboxes') or []
    nB += len(inb)
    if len(inb) > 1:
        conMasDeUna += 1
    vistos = set()
    for b in inb:
        tp = b.get('tipo') or '(sin tipo)'
        pv = b.get('proveedor') or '(sin proveedor)'
        tipos[tp] += 1; prov[pv] += 1; vistos.add(tp)
        volTipo[tp] += b.get('mensajes') or 0
        if b.get('contratado'): contra[tp] += 1
        if b.get('activo'):     act[tp] += 1
        if b.get('observado'):  obs[tp] += 1
    if len({t for t in vistos if t != '(sin tipo)'}) > 1:
        mixtas += 1
    conTrafico = [b for b in inb if (b.get('mensajes') or 0) > 0]
    if conTrafico:
        principal[max(conTrafico, key=lambda b: b['mensajes']).get('tipo') or '(sin tipo)'] += 1

print()
print('=== TIPO DE BANDEJA (%s bandejas) ===' % format(nB, ','))
print('  %-24s %9s %13s %12s %9s %11s' % ('tipo', 'bandejas', 'mensajes', 'contratadas', 'activas', 'observadas'))
for k, n in tipos.most_common():
    print('  %-24s %9s %13s %12s %9s %11s'
          % (str(k)[:24], format(n, ','), format(volTipo[k], ','), contra[k], act[k], obs[k]))

print()
print('=== PROVEEDOR ===')
for k, n in prov.most_common(12):
    print('  %-42s %s' % (str(k)[:42], format(n, ',')))

print()
print('=== BANDEJA PRINCIPAL de cada cuenta (la de mayor volumen) ===')
print('  cuentas con mas de una bandeja: %d   ·   con tipos mezclados: %d' % (conMasDeUna, mixtas))
for k, n in principal.most_common():
    print('  %-24s %d cuentas' % (str(k)[:24], n))

# ── QR vs API por cuenta, desde el campo sacux ──────────────────────────────
qr = api = ambos = ninguno = 0
soloQR = []
for c in CL:
    s = c.get('sacux') or {}
    q, a = s.get('mensajesQR') or 0, s.get('mensajesAPI') or 0
    if q and a: ambos += 1
    elif q:     qr += 1; soloQR.append((q, c.get('cliente'), c.get('tier')))
    elif a:     api += 1
    else:       ninguno += 1
print()
print('=== QR vs API, POR CUENTA (solo donde hay mensajes clasificados) ===')
print('  solo WhatsApp QR   : %d cuentas' % qr)
print('  solo WhatsApp API  : %d cuentas' % api)
print('  las dos            : %d cuentas' % ambos)
print('  sin clasificar     : %d cuentas  <- la mayoria' % ninguno)
print()
print('  las que dependen SOLO de QR, por volumen:')
for q, cli, tier in sorted(soloQR, key=lambda x: -x[0])[:8]:
    print('    %-44s %9s mensajes   tier %s' % (str(cli)[:44], format(q, ','), tier))

# ── La bandeja principal, con nombre y peso ─────────────────────────────────
print()
print('=== BANDEJA PRINCIPAL · las cuentas de mayor volumen ===')
print('  %-30s %-28s %-16s %9s %7s %s' % ('cliente', 'bandeja principal', 'tipo', 'mensajes', 'peso', 'bandejas'))
filas = []
for c in CL:
    inb = [b for b in (c.get('inboxes') or []) if (b.get('mensajes') or 0) > 0]
    if not inb:
        continue
    tot = sum(b['mensajes'] for b in inb)
    p = max(inb, key=lambda b: b['mensajes'])
    filas.append((p['mensajes'], c.get('nombre'), p.get('nombre'), p.get('tipo') or '(sin tipo)',
                  100 * p['mensajes'] / tot, len(c.get('inboxes') or [])))
for m, cli, ban, tp, peso, nb in sorted(filas, reverse=True)[:12]:
    print('  %-30s %-28s %-16s %9s %6.1f%% %d' % (str(cli)[:30], str(ban)[:28], tp[:16], format(m, ','), peso, nb))
print()
print('  cuentas con al menos una bandeja con tráfico: %d de %d' % (len(filas), len(CL)))

# ── Lo que de verdad es solido: los CONTEOS ─────────────────────────────────
conTipo = sum(n for k, n in tipos.items() if k != '(sin tipo)')
print()
print('=== QUÉ SE PUEDE AFIRMAR Y QUÉ NO ===')
print('  CONTEOS de bandeja (sólidos, cubren las %s bandejas del corte):' % format(nB, ','))
print('    con tipo conocido : %s de %s  (%.0f%%)' % (format(conTipo, ','), format(nB, ','), 100 * conTipo / nB))
print('    WhatsApp QR       : %s bandejas' % format(tipos.get('WhatsApp QR', 0), ','))
print('    WhatsApp API      : %s bandejas' % format(tipos.get('WhatsApp API', 0), ','))
print('  VOLÚMENES por tipo (NO representativos: solo %.1f%% del total está clasificado)' % v.get('pctClasificado', 0))
