"""Aplica la regla de direccion (12 sep 2026) sobre el estatus de las cuentas.

   UNA cuenta esta bajo el concepto dormida = cancelado = baja de servicio
   SOLO si tiene baja sustentada:
     · GRC con movimiento «Churn confirmado», o
     · cancelacion documentada en Churn > Analisis DATA / sesion con el cliente.

   Un DOWNGRADE no es baja. Una cuenta con solo Downgrade, o sin registro en
   GRC, vuelve a ACTIVA.

   Casos que resolvio direccion a mano:
     · F66 Sofia — NO esta en GRC, pero si en Cancelados (Semana 19 Sep 2026) y
       el cliente pidio la baja en sesion directa. SE QUEDA cancelado.
     · F13 S&G LOCALIZACION — solo Downgrade. Su nota dice «SERVICIO A DAR DE
       BAJA POR NO PODER INTEGRAR CRM ZOHO», pero eso es un servicio, no la
       cuenta. VUELVE A ACTIVA.

   Respalda el estado anterior antes de escribir.
"""
import sys, io, os, json, urllib.request, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
os.chdir(r"D:\Windows\Projects\callpicker-cs")
ESCRIBIR = '--escribir' in sys.argv

# Resuelto en la conciliacion; F13 movida a mano por instruccion de direccion.
VUELVEN = ['C10', 'D11', 'C27', 'F56', 'F9', 'F63', 'F13', 'F11', 'D17', 'F14',
           'F31', 'C63', 'C66', 'D53', 'C38', 'Z23', 'Z25', 'Z26', 'Z37', 'Z47']

env = {}
for l in io.open('.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
H = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY, 'Content-Type': 'application/json'}


def rest(path, metodo='GET', cuerpo=None, extra=None):
    h = dict(H)
    if extra:
        h.update(extra)
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    r = urllib.request.Request(URL + '/rest/v1/' + path, data=datos, headers=h, method=metodo)
    with urllib.request.urlopen(r, timeout=60) as x:
        t = x.read().decode()
    return json.loads(t) if t.strip() else None


cu = rest('cuentas?select=id,consecutivo,empresa,asesor,estado,health_score,facturacion&limit=1000')
porCons = {c['consecutivo']: c for c in cu}

objetivo = [porCons[k] for k in VUELVEN if k in porCons]
faltan = [k for k in VUELVEN if k not in porCons]
if faltan:
    print('!! consecutivos que no existen: %s' % faltan)

print('=== CUENTAS QUE VUELVEN A ACTIVA: %d ===' % len(objetivo))
print('%-5s %-32s %-9s %-14s %5s %11s' % ('CONS', 'EMPRESA', 'ASESOR', 'ESTADO ACTUAL', 'HS', 'FACT'))
for c in sorted(objetivo, key=lambda x: -(x['facturacion'] or 0)):
    print('%-5s %-32s %-9s %-14s %5s %11s' % (
        c['consecutivo'], c['empresa'][:32], (c['asesor'] or '')[:9], c['estado'],
        c['health_score'], '$' + format(round(c['facturacion'] or 0), ',')))
ya = [c for c in objetivo if c['estado'] == 'activo']
print()
print('  ya estaban en activo: %d' % len(ya))
print('  por cambiar          : %d' % len([c for c in objetivo if c['estado'] != 'activo']))
print('  facturacion que regresa a la cartera viva: $%s'
      % format(round(sum(c['facturacion'] or 0 for c in objetivo if c['estado'] != 'activo')), ','))
print('  por asesor: %s' % dict(collections.Counter((c['asesor'] or '?') for c in objetivo if c['estado'] != 'activo')))

if not ESCRIBIR:
    print()
    print('SIMULACION. Nada escrito. Correr con --escribir para aplicar.')
    raise SystemExit(0)

resp = os.path.join(r'D:\Proyectos\CP', 'respaldo_estados_2026-09-12.json')
io.open(resp, 'w', encoding='utf-8').write(json.dumps(
    [{'id': c['id'], 'consecutivo': c['consecutivo'], 'empresa': c['empresa'], 'estado': c['estado']}
     for c in objetivo], ensure_ascii=False, indent=1))
print()
print('respaldo del estado anterior: %s' % resp)
print()
print('=== ESCRIBIENDO ===')
n = 0
for c in objetivo:
    if c['estado'] == 'activo':
        continue
    rest('cuentas?id=eq.' + str(c['id']), 'PATCH', {'estado': 'activo'}, {'Prefer': 'return=minimal'})
    n += 1
    print('  [%2d] %-5s %-32s %s -> activo' % (n, c['consecutivo'], c['empresa'][:32], c['estado']))

print()
print('=== VERIFICACION (releido de Supabase) ===')
v = rest('cuentas?select=consecutivo,estado&consecutivo=in.(%s)' % ','.join(VUELVEN))
mal = [x for x in v if x['estado'] != 'activo']
print('  %d de %d quedaron en activo' % (len(v) - len(mal), len(v)))
if mal:
    print('  !! NO CUADRA: %s' % mal)
    raise SystemExit(1)
print('  [OK] las %d cuentas estan en activo.' % len(v))
