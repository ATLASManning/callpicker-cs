"""Replica lib/zoho-enrich.ts contra la vista real y muestra que veran las cuentas.

   No hay Node local, asi que la unica forma de saber si el remapeo dice la
   verdad es reproducir lookupZoho() sobre el MISMO dato que lee el servidor y
   comparar el antes contra el despues, cuenta por cuenta.

   Tambien mide una decision que NO se cambio y conviene tener a la vista: el
   mapa excluye las filas con semaforo «4 - Dormido». Para la mensualidad es
   correcto —una subcuenta dormida no factura— pero para el ACUMULADO significa
   perder el historial de lo que esa subcuenta si pago en su momento.
"""
import sys, io, json, re, unicodedata, urllib.request, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')

cuerpo = urllib.parse.urlencode({
    'grant_type': 'refresh_token', 'client_id': env['ZOHO_CLIENT_ID'],
    'client_secret': env['ZOHO_CLIENT_SECRET'], 'refresh_token': env['ZOHO_REFRESH_TOKEN'],
}).encode()
tok = json.loads(urllib.request.urlopen(urllib.request.Request(
    'https://accounts.zoho.com/oauth/v2/token', data=cuerpo,
    headers={'Content-Type': 'application/x-www-form-urlencoded'}), timeout=60).read().decode())['access_token']

u = ('https://analyticsapi.zoho.com/restapi/v2/workspaces/%s/views/%s/data?responseFormat=json'
     % (env['ZOHO_WORKSPACE_ID'], env['ZOHO_VIEW_ID_FACTURACION']))
txt = urllib.request.urlopen(urllib.request.Request(u, headers={
    'Authorization': 'Zoho-oauthtoken ' + tok, 'ZANALYTICS-ORGID': env['ZOHO_ORG_ID'],
}), timeout=180).read().decode('utf-8', 'replace').lstrip('\ufeff')


def csv(line):
    out, cur, q, i = [], '', False, 0
    while i < len(line):
        c = line[i]
        if c == '"':
            if q and i + 1 < len(line) and line[i + 1] == '"':
                cur += '"'; i += 1
            else:
                q = not q
        elif c == ',' and not q:
            out.append(cur.strip()); cur = ''
        else:
            cur += c
        i += 1
    out.append(cur.strip())
    return out


if txt.lstrip().startswith('{'):
    d = json.loads(txt).get('data', {})
    cols, raw = d.get('columns', []), d.get('rows', [])
    R = [dict(zip(cols, r)) for r in raw] if raw and isinstance(raw[0], list) else raw
else:
    ln = [x for x in txt.split('\n') if x.strip()]
    cols = csv(ln[0]); R = [dict(zip(cols, csv(x))) for x in ln[1:]]

print('vista LTV: %s filas' % format(len(R), ','))


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or '')).lower()
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'[^a-z0-9\s]', '', s).strip()


def num(v):
    try:
        return float(re.sub(r'[$,]', '', str(v or '')))
    except Exception:
        return 0.0


def construir(incluirDormidas):
    m = {}
    for r in R:
        n = norm(r.get('nombre_cliente'))
        if not n:
            continue
        sema = r.get('semaforo_actividad') or ''
        d = m.setdefault(n, {'acum': 0.0, 'mrrViejo': 0.0, 'fact': 0.0, 'sema': sema})
        if incluirDormidas or sema != '4 - Dormido':
            d['acum'] += num(r.get('importe_acumulado_recurrente'))
            d['mrrViejo'] += num(r.get('mrr_limpio'))
            d['fact'] += num(r.get('ticket_limpio_promedio'))
    return m


MAPA = construir(False)
MAPA_CON = construir(True)


def siglas(n):
    return ''.join(w[0] for w in n.split() if len(w) >= 3)


def lookup(empresa, m):
    n = norm(empresa)
    pal = [w for w in n.split() if len(w) >= 3][:2]
    sg = siglas(n)
    hit = [k for k in m if (pal and all(w in k for w in pal)) or (len(sg) >= 3 and (k.split() or [''])[0] == sg)]
    if not hit:
        return m.get(n)
    return {'acum': sum(m[k]['acum'] for k in hit), 'mrrViejo': sum(m[k]['mrrViejo'] for k in hit),
            'fact': sum(m[k]['fact'] for k in hit), 'n': len(hit)}


rq = urllib.request.Request(env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?select=consecutivo,empresa,asesor',
                            headers={'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
                                     'Authorization': 'Bearer ' + env['SUPABASE_SERVICE_ROLE_KEY']})
cart = json.loads(urllib.request.urlopen(rq, timeout=60).read().decode())

print()
print('=== QUE CAMBIA EN PANTALLA (antes: mrr_limpio · ahora: acumulado) ===')
print('  %-32s %14s %16s %8s' % ('cuenta', 'antes (MRR)', 'ahora (acum.)', 'factor'))
filas = []
for c in cart:
    z = lookup(c['empresa'], MAPA)
    if not z or not z.get('mrrViejo'):
        continue
    filas.append((z['acum'], z['mrrViejo'], z['fact'], c['empresa'], c['consecutivo']))
filas.sort(reverse=True)
for acum, viejo, fact, emp, con in filas[:10]:
    print('  %-32s %14s %16s %7.0fx' % (emp[:32], format(round(viejo), ','), format(round(acum), ','), acum / viejo))

print()
print('  cuentas con dato : %d de %d' % (len(filas), len(cart)))
print('  suma antes (MRR) : $%s' % format(round(sum(f[1] for f in filas)), ','))
print('  suma ahora (acum): $%s' % format(round(sum(f[0] for f in filas)), ','))
print('  factura mensual  : $%s   (no cambia)' % format(round(sum(f[2] for f in filas)), ','))

print()
print('=== LA DECISION QUE NO SE TOCO: LAS FILAS DORMIDAS ===')
conD = sum((lookup(c['empresa'], MAPA_CON) or {}).get('acum', 0) for c in cart)
sinD = sum((lookup(c['empresa'], MAPA) or {}).get('acum', 0) for c in cart)
print('  acumulado EXCLUYENDO dormidas (como quedo) : $%s' % format(round(sinD), ','))
print('  acumulado INCLUYENDOLAS                    : $%s' % format(round(conD), ','))
print('  diferencia                                 : $%s  (%.1f%%)'
      % (format(round(conD - sinD), ','), 100 * (conD - sinD) / sinD if sinD else 0))
print('  -> excluirlas es correcto para una mensualidad, pero para un ACUMULADO')
print('     significa perder lo que esas subcuentas si pagaron. Queda para decidir.')

print()
print('=== LA FAMILIA GTC, QUE ES LA QUE PREOCUPA ===')
gtc = sorted([k for k in MAPA if k.startswith('gtc')])
print('  claves que empiezan con «gtc»: %d' % len(gtc))
for k in gtc[:8]:
    print('    %-30s acumulado $%-14s mensual $%s'
          % (k[:30], format(round(MAPA[k]['acum']), ','), format(round(MAPA[k]['fact']), ',')))
z = lookup('GRUPO TORRES CORZO', MAPA)
if z:
    print('  lookup(«GRUPO TORRES CORZO») suma %d claves -> acumulado $%s · mensual $%s'
          % (z.get('n', 0), format(round(z['acum']), ','), format(round(z['fact']), ',')))
