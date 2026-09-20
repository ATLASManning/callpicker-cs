# -*- coding: utf-8 -*-
"""¿Cuantas aclaraciones obligatorias dispararia el corte que esta cargado?

   Replica en seco lo que hace construirAclaraciones() en
   app/api/actividades/generar/route.ts, SIN escribir nada:

     evento de GRC-AAA-2026  ->  ¿esta en GRC_EVENTOS_PREVIOS?  -> no dispara
                             ->  ¿el nombre casa con una cuenta
                                 que tenga asesor?              -> DISPARA

   Existe porque una aclaracion de baja va FUERA del tope de 4 por asesor, no
   vence y no se cierra hasta documentar causa y acciones previas. Meter un mes
   en curso sin medir esto le puede caer a un asesor con cientos de bajas que
   no son bajas.

   Solo lectura. No imprime credenciales ni escribe en Supabase.
"""
import sys, io, os, re, json, unicodedata, collections, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = r'D:\Windows\Projects\callpicker-cs'
VIVO = ('activo', 'en_riesgo')


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or '')).lower()
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'[^a-z0-9]', '', s)


# ── Eventos que hoy viven en GRC-AAA-2026 ───────────────────────────────────
FILA = re.compile(
    r"\{ cliente: '(.*?)', clas: '([^']*)',.*?"
    r"mrrInicio: ([-\d.]+), mrrFin: ([-\d.]+),.*?"
    r"movimiento: '([^']*)', perdido: ([-\d.]+)")

s = io.open(os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts'), encoding='utf-8').read()
eventos = []
for b in re.split(r"\n  \{\n    mes: '", s)[1:]:
    mes = b.split("'")[0]
    for cli, clas, ini, fin, mov, per in FILA.findall(b):
        if 'Churn confirmado' in mov:
            tipo = 'churn'
        elif 'Downgrade' in mov:
            tipo = 'downgrade'
        else:
            continue
        n = norm(cli)
        if not n:
            continue
        eventos.append({'cliente': cli, 'norm': n, 'mes': mes.upper(), 'tipo': tipo,
                        'clas': clas, 'ini': float(ini), 'fin': float(fin),
                        'per': float(per), 'clave': '%s|%s|%s' % (n, mes.upper(), tipo)})

# ── El corte: lo que ya habia ocurrido y por tanto no dispara ───────────────
c = io.open(os.path.join(RAIZ, 'app', 'churn', 'grc-eventos-corte.ts'), encoding='utf-8').read()
previos = set(re.findall(r"^\s*'([^']+\|[^']+\|[^']+)',", c, re.M))

# ── El mes vivo: no es churn, es cartera por cobrar. Mismo filtro que
#    lib/aclaraciones.ts, o esta medicion mentiria sobre lo que pasaria.
rep = io.open(os.path.join(RAIZ, 'app', 'churn', 'grc-reporte.ts'), encoding='utf-8').read()
mv = re.search(r"GRC_MES_EN_CURSO:[^=]*=\s*'([^']*)'", rep)
VIVO_MES = (mv.group(1).upper() if mv else '')

tras_corte = [e for e in eventos if e['clave'] not in previos]
nuevos = [e for e in tras_corte if not VIVO_MES or e['mes'] != VIVO_MES]

print('eventos en GRC-AAA-2026 : %s' % format(len(eventos), ','))
print('congelados por el corte : %s' % format(len(previos), ','))
print('mes vivo (no dispara)   : %-11s %s eventos frenados'
      % (VIVO_MES or '(ninguno)',
         format(len(tras_corte) - len(nuevos), ',')))
print('NUEVOS (dispararian)    : %s' % format(len(nuevos), ','))
print()
if not nuevos:
    print('Nada que disparar.')
    raise SystemExit
print('  por mes:')
for m, n in collections.Counter(e['mes'] for e in nuevos).most_common():
    print('    %-12s %s' % (m, format(n, ',')))

# ── La cartera ──────────────────────────────────────────────────────────────
env = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
K = env['SUPABASE_SERVICE_ROLE_KEY']
rq = urllib.request.Request(
    env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?select=empresa,cid,asesor,estado',
    headers={'apikey': K, 'Authorization': 'Bearer ' + K})
cuentas = json.loads(urllib.request.urlopen(rq, timeout=90).read().decode())

# Mismo criterio que la ruta: un nombre normalizado que apunta a dos cuentas se
# descarta, para no atribuirle la baja a la cuenta equivocada.
por_nombre = {}
for x in cuentas:
    n = norm(x.get('empresa'))
    if not n:
        continue
    por_nombre[n] = None if n in por_nombre else x

print()
print('cuentas en la base      : %s  (con asesor: %s)'
      % (format(len(cuentas), ','),
         format(sum(1 for x in cuentas if x.get('asesor')), ',')))

dispara, sin_cuenta, sin_asesor = [], 0, 0
for e in nuevos:
    c = por_nombre.get(e['norm'])
    if not c:
        sin_cuenta += 1
        continue
    if not c.get('asesor'):
        sin_asesor += 1
        continue
    e['asesor'] = c['asesor']
    e['estado'] = c.get('estado') or '(sin estado)'
    dispara.append(e)

print()
print('=== LO QUE REALMENTE SE GENERARIA ===')
print('  aclaraciones obligatorias : %s' % format(len(dispara), ','))
print('  eventos sin cuenta en base: %s  (van al log, no generan)' % format(sin_cuenta, ','))
print('  con cuenta pero sin asesor: %s' % format(sin_asesor, ','))

if dispara:
    print()
    print('  por asesor:')
    for a, n in collections.Counter(e['asesor'] for e in dispara).most_common():
        print('    %-22s %s' % (a, format(n, ',')))

    # La pregunta que importa: ¿cuantas de esas "bajas" siguen vivas?
    firma = lambda e: e['tipo'] == 'churn' and e['fin'] == 0 and abs(e['per'] - e['ini']) < 0.01
    vivas = [e for e in dispara if e['estado'] in VIVO]
    vivas_firma = [e for e in vivas if firma(e)]
    print()
    print('  de esas aclaraciones, la cuenta esta:')
    for est, n in collections.Counter(e['estado'] for e in dispara).most_common():
        print('    %-22s %s' % (est, format(n, ',')))
    print()
    print('  >>> %s aclaraciones de BAJA sobre cuentas que la base da por VIVAS'
          % format(len(vivas), ','))
    print('  >>> de ellas %s traen la firma del contrato que aun no factura'
          % format(len(vivas_firma), ','))
    print('      (MRR fin en cero y perdida exactamente igual al MRR inicio)')
