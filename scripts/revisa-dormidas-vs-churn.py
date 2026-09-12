"""Regla de direccion (12 sep 2026):

    SOLO lo que esta en Churn con movimiento «Churn confirmado» queda bajo el
    concepto  dormidas = cancelado = baja de servicio.

   Ni Downgrade, ni la lista de cancelados de los cortes semanales, ni Zoho
   Dormidos, ni las senales internas de las notas.

   Este script mide las dos direcciones del desajuste. NO escribe nada.
"""
import sys, io, os, re, json, unicodedata, collections, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
os.chdir(r"D:\Windows\Projects\callpicker-cs")

MUERTOS = ('hibernacion', 'cancelado')


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)


# ── GRC · Churn confirmado (incluye «+ Fraude») ────────────────────────────
g = io.open('app/churn/aaa-grc-data.ts', encoding='utf-8').read()
mes = None
churn = collections.defaultdict(list)
for ln in g.split('\n'):
    mm = re.search(r"^\s*mes:\s*'([^']+)'", ln)
    if mm:
        mes = mm.group(1)
    m = re.search(r"cliente:\s*'(.*?)'.*?movimiento:\s*'(.*?)'", ln)
    if m and 'Churn confirmado' in m.group(2):
        p = re.search(r'perdido:\s*([\d.]+)', ln)
        churn[m.group(1)].append((mes, m.group(2), float(p.group(1)) if p else 0.0))
NCHURN = {norm(c): c for c in churn}
print('GRC · Churn confirmado: %d clientes distintos' % len(churn))

# ── Cartera ────────────────────────────────────────────────────────────────
env = {}
for l in io.open('.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
r = urllib.request.Request(
    env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?select=id,consecutivo,cid,empresa,asesor,estado,health_score,facturacion,notas&limit=1000',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
cu = json.loads(urllib.request.urlopen(r, timeout=60).read().decode())
print('cartera: %d cuentas' % len(cu))
print()


def tieneChurn(c):
    n = norm(c['empresa'])
    if n in NCHURN:
        return NCHURN[n]
    # GRC no trae CID: se acepta contencion de nombre solo si es inequivoca
    hits = [orig for k, orig in NCHURN.items() if len(n) > 6 and len(k) > 6 and (n in k or k in n)]
    return hits[0] if len(hits) == 1 else None


print('=' * 96)
print('A · EN DORMIDA O CANCELADO **SIN** «Churn confirmado» — no deberian estar ahi')
print('=' * 96)
sobran = [c for c in cu if c['estado'] in MUERTOS and not tieneChurn(c)]
print('%-5s %-32s %-9s %-12s %5s %11s  %s' % ('CONS', 'EMPRESA', 'ASESOR', 'ESTADO', 'HS', 'FACT', 'NOTA'))
for c in sorted(sobran, key=lambda x: -(x['facturacion'] or 0)):
    nota = re.sub(r'\s+', ' ', str(c.get('notas') or ''))[:46]
    print('%-5s %-32s %-9s %-12s %5s %11s  %s' % (
        c['consecutivo'], c['empresa'][:32], (c['asesor'] or '')[:9], c['estado'],
        c['health_score'], '$' + format(round(c['facturacion'] or 0), ','), nota))
print()
print('  TOTAL: %d cuentas · $%s de facturacion' % (len(sobran), format(round(sum(c['facturacion'] or 0 for c in sobran)), ',')))
print('  por asesor: %s' % dict(collections.Counter((c['asesor'] or '?') for c in sobran)))
print('  por estado: %s' % dict(collections.Counter(c['estado'] for c in sobran)))
print()

print('=' * 96)
print('B · CON «Churn confirmado» pero **VIVAS** en la cartera — deberian estar dormidas')
print('=' * 96)
faltan = [c for c in cu if c['estado'] not in MUERTOS and tieneChurn(c)]
for c in sorted(faltan, key=lambda x: -(x['facturacion'] or 0)):
    o = tieneChurn(c)
    print('%-5s %-32s %-9s %-12s %11s  %s' % (
        c['consecutivo'], c['empresa'][:32], (c['asesor'] or '')[:9], c['estado'],
        '$' + format(round(c['facturacion'] or 0), ','),
        ', '.join('%s (%s)' % (ms, mv) for ms, mv, _ in churn[o])))
print('  TOTAL: %d' % len(faltan))
print()

print('=' * 96)
print('C · CORRECTAS — con «Churn confirmado» y ya en Dormida o cancelado')
print('=' * 96)
ok = [c for c in cu if c['estado'] in MUERTOS and tieneChurn(c)]
print('  %d cuentas · $%s' % (len(ok), format(round(sum(c['facturacion'] or 0 for c in ok)), ',')))
print()
print('RESUMEN: %d correctas · %d sobran en Dormida · %d faltan por dormir' % (len(ok), len(sobran), len(faltan)))
