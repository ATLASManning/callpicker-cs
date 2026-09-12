"""Conciliacion minuciosa de Churn confirmado contra la cartera.

   Va mas alla de /api/conciliacion, que responde "que hay que hacer". Aqui se
   revisa lo que esa vista NO muestra:

     1. Las 5 cuentas que quedaron SIN senal al corregir el bug de
        gen-churn-cancelados.py. Estan en Dormida: ¿les queda alguna razon?
     2. TATSA — dirección la declara error de administracion; se documenta
        aparte y no se cuenta como baja.
     3. Los nombres de GRC con Churn confirmado que NO cruzaron con la cartera.
        GRC no trae CID: si un nombre difiere, la cuenta se escapa en silencio.
     4. Cuentas en Dormida/cancelado SIN ninguna senal que lo sostenga.
"""
import sys, io, os, re, json, unicodedata, collections, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
os.chdir(r"D:\Windows\Projects\callpicker-cs")

EXCLUIR = {'tatsa'}          # error de administracion, por instruccion de direccion


def norm(s):
    s = unicodedata.normalize('NFD', str(s or '')).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]', '', s)


# ── Senales ────────────────────────────────────────────────────────────────
g = io.open('app/churn/aaa-grc-data.ts', encoding='utf-8').read()
grc = collections.defaultdict(list)
for ln in g.split('\n'):
    m = re.search(r"cliente:\s*'(.*?)'.*?movimiento:\s*'(.*?)'", ln)
    if not m:
        continue
    per = re.search(r"perdido:\s*([\d.]+)", ln)
    mes = None
    grc[m.group(1)].append((m.group(2), float(per.group(1)) if per else 0.0))
# mes real: se recorre por bloques
mes_actual = None
grc_mes = collections.defaultdict(list)
for ln in g.split('\n'):
    mm = re.search(r"^\s*mes:\s*'([^']+)'", ln)
    if mm:
        mes_actual = mm.group(1)
    m = re.search(r"cliente:\s*'(.*?)'.*?movimiento:\s*'(.*?)'", ln)
    if m:
        grc_mes[m.group(1)].append((mes_actual, m.group(2)))

CHURN_GRC = {c for c, v in grc.items() if any('Churn confirmado' in mv for mv, _ in v)}
DOWN_GRC = {c for c, v in grc.items() if any('Downgrade' in mv for mv, _ in v)}

c = io.open('lib/churn-cancelados-data.ts', encoding='utf-8').read()
CANCEL = {}
for m in re.finditer(r"cliente:\s*'(.*?)'\s*,\s*periodo:\s*'(.*?)'", c):
    CANCEL[m.group(1)] = m.group(2)

print('=== FUENTES ===')
print('  GRC · Churn confirmado : %d clientes' % len(CHURN_GRC))
print('  GRC · Downgrade        : %d clientes' % len(DOWN_GRC))
print('  Churn · Analisis DATA  : %d cancelados (ya corregido)' % len(CANCEL))

# ── Cartera ────────────────────────────────────────────────────────────────
env = {}
for l in io.open('.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']


def q(p):
    r = urllib.request.Request(env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/' + p,
                               headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
    return json.loads(urllib.request.urlopen(r, timeout=60).read().decode())


cu = q('cuentas?select=id,consecutivo,cid,empresa,asesor,estado,health_score,facturacion,notas&limit=1000')
porNombre = {norm(x['empresa']): x for x in cu}
NCHURN = {norm(x) for x in CHURN_GRC}
NCANCEL = {norm(x) for x in CANCEL}
NDOWN = {norm(x) for x in DOWN_GRC}
print('  cartera                : %d cuentas' % len(cu))
print()

# ── 1 · Las que perdieron su senal al corregir el bug ──────────────────────
FALSOS = ['S&G LOCALIZACION', 'SAMALAB', 'El Surtidor', 'Petroil - Prebiem Oceanica', 'EMPODERA SALUD']
print('=' * 92)
print('1 · LAS 5 QUE QUEDARON SIN SENAL AL CORREGIR EL BUG — ¿por que siguen en Dormida?')
print('=' * 92)
print('%-5s %-28s %-9s %-12s %9s  %-8s %-8s %s' % ('CONS', 'EMPRESA', 'ASESOR', 'ESTADO', 'FACT', 'GRCchurn', 'cancel', 'GRCdowngrade'))
for f in FALSOS:
    n = norm(f)
    a = porNombre.get(n) or next((v for k, v in porNombre.items() if n in k or k in n), None)
    if not a:
        print('  %-28s (no cruza con la cartera)' % f[:28]); continue
    print('%-5s %-28s %-9s %-12s %9s  %-8s %-8s %s' % (
        a['consecutivo'], a['empresa'][:28], (a['asesor'] or '')[:9], a['estado'],
        '$' + format(round(a['facturacion'] or 0), ','),
        'SI' if norm(a['empresa']) in NCHURN else 'no',
        'SI' if norm(a['empresa']) in NCANCEL else 'no',
        'SI' if norm(a['empresa']) in NDOWN else 'no'))
    if a.get('notas'):
        print('        notas: %s' % str(a['notas']).replace('\n', ' ')[:150])
print()

# ── 2 · TATSA ──────────────────────────────────────────────────────────────
print('=' * 92)
print('2 · TATSA — declarada error de administracion por direccion')
print('=' * 92)
t = [x for x in cu if 'tatsa' in norm(x['empresa'])]
for a in t:
    print('  %-5s %-28s %-9s %-12s HS=%-4s %9s · CID=%r' % (
        a['consecutivo'], a['empresa'][:28], (a['asesor'] or '')[:9], a['estado'],
        a['health_score'], '$' + format(round(a['facturacion'] or 0), ','), a['cid']))
    print('        senales: GRC churn=%s · cancelados=%s · GRC downgrade=%s' % (
        norm(a['empresa']) in NCHURN, norm(a['empresa']) in NCANCEL, norm(a['empresa']) in NDOWN))
    if a.get('notas'):
        print('        notas: %s' % str(a['notas']).replace('\n', ' ')[:200])
gt = [x for x in CHURN_GRC if 'tatsa' in norm(x)] + [x for x in CANCEL if 'tatsa' in norm(x)]
print('  TATSA en las fuentes de baja: %s' % (gt if gt else 'NO APARECE en ninguna'))
print()

# ── 3 · Churn confirmado que NO cruza con la cartera ───────────────────────
print('=' * 92)
print('3 · CHURN CONFIRMADO EN GRC QUE SI CRUZA CON LA CARTERA')
print('=' * 92)
cruzan = []
for nombre in sorted(CHURN_GRC):
    n = norm(nombre)
    if n in EXCLUIR:
        continue
    a = porNombre.get(n)
    if a:
        cruzan.append((nombre, a))
print('  de los %d clientes con Churn confirmado en GRC, %d son cuentas de la cartera' % (len(CHURN_GRC), len(cruzan)))
print()
print('%-5s %-30s %-9s %-12s %10s  %s' % ('CONS', 'EMPRESA', 'ASESOR', 'ESTADO', 'FACT', 'MES(ES) DEL EVENTO'))
malos = []
for nombre, a in sorted(cruzan, key=lambda x: -(x[1]['facturacion'] or 0)):
    meses = [ms for ms, mv in grc_mes.get(nombre, []) if 'Churn confirmado' in mv]
    ok = a['estado'] in ('hibernacion', 'cancelado')
    if not ok:
        malos.append((a, meses))
    print('%-5s %-30s %-9s %-12s %10s  %s %s' % (
        a['consecutivo'], a['empresa'][:30], (a['asesor'] or '')[:9], a['estado'],
        '$' + format(round(a['facturacion'] or 0), ','), ', '.join(meses),
        '' if ok else '   <-- SIGUE VIVA EN LA CARTERA'))
print()
print('  incoherentes (churn confirmado pero estatus vivo): %d' % len(malos))
print()

# ── 4 · Dormidas/canceladas sin ninguna senal ──────────────────────────────
print('=' * 92)
print('4 · EN DORMIDA O CANCELADO SIN NINGUNA SENAL DE BAJA QUE LO SOSTENGA')
print('=' * 92)
sin = []
for a in cu:
    if a['estado'] not in ('hibernacion', 'cancelado'):
        continue
    n = norm(a['empresa'])
    if n in NCHURN or n in NCANCEL:
        continue
    sin.append(a)
print('  %d cuentas' % len(sin))
print('%-5s %-30s %-9s %-12s %10s  %s' % ('CONS', 'EMPRESA', 'ASESOR', 'ESTADO', 'FACT', 'GRC downgrade'))
for a in sorted(sin, key=lambda x: -(x['facturacion'] or 0)):
    print('%-5s %-30s %-9s %-12s %10s  %s' % (
        a['consecutivo'], a['empresa'][:30], (a['asesor'] or '')[:9], a['estado'],
        '$' + format(round(a['facturacion'] or 0), ','),
        'SI' if norm(a['empresa']) in NDOWN else '—'))
