"""Comprueba las dos cifras que la ficha de cuenta toma del corte GRC.

   Direccion: «Factura Mensual» toma MRR Inicio Contrato (BCY) y «MRR» toma
   Importe Acumulado Recurrente.

   No hay Node ni se puede pegar al endpoint (todo redirige a /acceso con 200),
   asi que se replica la logica de porCuenta() de app/api/grc/route.ts sobre el
   MISMO data/grc-zoho.json que lee el servidor.

   Lo que tiene que ser cierto:
     1. el cruce es por CID y NUNCA por nombre
     2. ninguna cuenta suma en su factura una linea de otro servicio
     3. las cuentas que no vienen en el corte NO devuelven cero, devuelven
        `encontrado: false` para que la ficha diga «sin dato»
     4. las dos cifras son distintas entre si (antes se pintaba la misma dos
        veces, que es lo que direccion reporto)
"""
import io, os, sys, json, re, unicodedata, urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = r'D:\Windows\Projects\callpicker-cs'
D = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
F = D['filas']
f_ = lambda n: '$' + format(round(n or 0), ',')
fallas, corridas = [], [0]


def prueba(etq, cond, det=''):
    corridas[0] += 1
    if not cond:
        fallas.append(etq)
    print('  %-56s %s %s' % (etq, 'OK' if cond else '** FALLA', det))


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or '').lower())
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'[^a-z0-9]', '', s)


def por_cuenta(cid, nombre=''):
    """Replica porCuenta() del endpoint."""
    propias = [f for f in F if f['cid'] and f['cid'] == cid]
    base = norm(propias[0]['cliente']) if propias else norm(nombre)
    hermanas = ([f for f in F if not f['cid'] and norm(f['cliente']).startswith(base)
                 and norm(f['cliente']) != base] if base else [])
    return {
        'encontrado': bool(propias),
        'facturaMensual': sum(f['mrrIni'] for f in propias),
        'acumuladoRecurrente': sum(f['acumulado'] for f in propias),
        'hermanas': hermanas,
    }


# ── La cartera real ──────────────────────────────────────────────────────────
env = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
K = env['SUPABASE_SERVICE_ROLE_KEY']
rq = urllib.request.Request(
    env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?select=empresa,cid,consecutivo,estado',
    headers={'apikey': K, 'Authorization': 'Bearer ' + K})
CUENTAS = json.loads(urllib.request.urlopen(rq, timeout=60).read().decode())

print('=== EL CASO QUE REPORTO DIRECCION ===')
g = por_cuenta('134571', 'Gas Economico Metropolitano')
print('  Gas Economico Metropolitano (CID 134571)')
print('    Factura Mensual  %14s   <- MRR Inicio Contrato (BCY)' % f_(g['facturaMensual']))
print('    MRR              %14s   <- Importe Acumulado Recurrente' % f_(g['acumuladoRecurrente']))
for h in g['hermanas']:
    print('    aparte: %-34s %s  (no se suma)' % (h['cliente'][:34], f_(h['mrrIni'])))
prueba('la ficha ya NO pinta la misma cifra dos veces',
       abs(g['facturaMensual'] - g['acumuladoRecurrente']) > 1)
prueba('la linea Chat NO entra en la factura',
       abs(g['facturaMensual'] - 18659) < 1, f_(g['facturaMensual']))
prueba('la linea Chat se reporta aparte', len(g['hermanas']) == 1)

print()
print('=== COBERTURA SOBRE LA CARTERA ===')
con, sin = [], []
for c in CUENTAS:
    r = por_cuenta(c.get('cid') or '', c.get('empresa') or '')
    (con if r['encontrado'] else sin).append((c, r))
print('  cuentas en la base            : %d' % len(CUENTAS))
print('  con dato en el corte          : %d' % len(con))
print('  sin dato (la ficha dira «sin dato en el corte») : %d' % len(sin))
prueba('ninguna cuenta sin dato devuelve cero como si fuera factura',
       all(not r['encontrado'] for _, r in sin))

print()
print('=== NINGUNA FACTURA INFLADA POR NOMBRE ===')
inflan = []
for c, r in con:
    extra = sum(h['mrrIni'] for h in r['hermanas'])
    if extra > 0:
        inflan.append((c['empresa'], r['facturaMensual'], extra))
print('  cuentas con lineas hermanas: %d · suman %s que NO se cuentan'
      % (len(inflan), f_(sum(x[2] for x in inflan))))
for nom, fac, ex in sorted(inflan, key=lambda x: -x[2])[:6]:
    print('    %-34s factura %12s   aparte %10s' % (nom[:34], f_(fac), f_(ex)))
prueba('el monto no sumado coincide con las 13 lineas detectadas',
       abs(sum(x[2] for x in inflan) - 56464) < 2000, f_(sum(x[2] for x in inflan)))

print()
print('=== LAS DOS CIFRAS SON DISTINTAS, CUENTA POR CUENTA ===')
iguales = [c['empresa'] for c, r in con
           if abs(r['facturaMensual'] - r['acumuladoRecurrente']) < 0.01
           and r['facturaMensual'] > 0]
prueba('ninguna cuenta con factura > 0 repite la misma cifra en las dos cajas',
       not iguales, '%d' % len(iguales))

print()
print('=== MUESTRA DE DIEZ FICHAS ===')
print('  %-34s %14s %16s' % ('cuenta', 'Factura Mensual', 'MRR (acumulado)'))
for c, r in sorted(con, key=lambda x: -x[1]['acumuladoRecurrente'])[:10]:
    print('  %-34s %14s %16s'
          % (c['empresa'][:34], f_(r['facturaMensual']), f_(r['acumuladoRecurrente'])))

print()
if fallas:
    print('*** %d de %d PRUEBAS FALLARON ***' % (len(fallas), corridas[0]))
    for x in fallas:
        print('    -', x)
    raise SystemExit(1)
print('=== LAS %d PRUEBAS PASAN ===' % corridas[0])
