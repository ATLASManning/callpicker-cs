"""Confirma que el enriquecimiento de Zoho encuentra a Supreme Resources Mexico.

   `facturacion` se dejo en 0 a proposito: la factura y el MRR NO se capturan a
   mano, se resuelven en vivo contra Zoho por NOMBRE (lib/zoho-enrich.ts). Eso
   solo funciona si el nombre con el que se dio de alta la cuenta empata con el
   nombre del cliente en la vista de Zoho. Esto lo comprueba replicando
   exactamente normStr() y lookupZoho() de TypeScript.

   Las credenciales se leen de .env.local y nunca se imprimen.
"""
import sys, io, re, json, unicodedata, urllib.request, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')

cuerpo = urllib.parse.urlencode({
    'grant_type': 'refresh_token',
    'client_id': env['ZOHO_CLIENT_ID'],
    'client_secret': env['ZOHO_CLIENT_SECRET'],
    'refresh_token': env['ZOHO_REFRESH_TOKEN'],
}).encode()
tk = urllib.request.Request('https://accounts.zoho.com/oauth/v2/token', data=cuerpo,
                            headers={'Content-Type': 'application/x-www-form-urlencoded'})
tok = json.loads(urllib.request.urlopen(tk, timeout=60).read().decode())['access_token']

u = ('https://analyticsapi.zoho.com/restapi/v2/workspaces/%s/views/%s/data?responseFormat=json'
     % (env['ZOHO_WORKSPACE_ID'], env['ZOHO_VIEW_ID_FACTURACION']))
rq = urllib.request.Request(u, headers={'Authorization': 'Zoho-oauthtoken ' + tok,
                                        'ZANALYTICS-ORGID': env['ZOHO_ORG_ID']})
txt = urllib.request.urlopen(rq, timeout=120).read().decode('utf-8', 'replace').lstrip('\ufeff')


def filas(t):
    if t.lstrip().startswith('{'):
        d = json.loads(t).get('data', {})
        cols, rs = d.get('columns', []), d.get('rows', [])
        if rs and isinstance(rs[0], list):
            return [dict(zip(cols, r)) for r in rs]
        return rs
    ln = [x for x in t.split('\n') if x.strip()]
    cols = next(csv(ln[0]))
    return [dict(zip(cols, next(csv(x)))) for x in ln[1:]]


def csv(line):
    out, cur, q = [], '', False
    i = 0
    while i < len(line):
        ch = line[i]
        if ch == '"':
            if q and i + 1 < len(line) and line[i + 1] == '"':
                cur += '"'; i += 1
            else:
                q = not q
        elif ch == ',' and not q:
            out.append(cur.strip()); cur = ''
        else:
            cur += ch
        i += 1
    out.append(cur.strip())
    yield out


R = filas(txt)
print('vista de Zoho: %d filas' % len(R))


def normStr(s):
    s = (s or '').lower()
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'[^a-z0-9\s]', '', s).strip()


mapa = {}
for row in R:
    n = normStr(row.get('nombre_cliente', ''))
    if not n:
        continue
    sema = row.get('semaforo_actividad', '') or ''
    if n not in mapa:
        mapa[n] = {'mrr': 0.0, 'fac': 0.0, 'sema': sema, 'seg': row.get('segmento_factura', '')}
    if sema != '4 - Dormido':
        def num(v):
            try: return float(re.sub(r'[$,]', '', str(v or '')))
            except Exception: return 0.0
        mapa[n]['mrr'] += num(row.get('mrr_limpio'))
        mapa[n]['fac'] += num(row.get('ticket_limpio_promedio'))
        mapa[n]['sema'] = sema

EMPRESA = 'Supreme Resources México'
n = normStr(EMPRESA)
palabras = [w for w in n.split() if len(w) >= 3][:2]
siglas = ''.join(w[0] for w in n.split() if len(w) >= 3)
print('normalizado    : «%s»   palabras=%s   siglas=%s' % (n, palabras, siglas))
print()

emp = [k for k in mapa if 'supreme' in k]
print('filas de Zoho que contienen «supreme»: %d' % len(emp))
for k in emp:
    v = mapa[k]
    print('  «%s»  factura=%s  mrr=%s  %s  %s' % (k, v['fac'], v['mrr'], v['sema'], v['seg']))
print()

# lookupZoho() exacto
hit = set()
for k in mapa:
    porPalabras = bool(palabras) and all(w in k for w in palabras)
    porSiglas = len(siglas) >= 3 and (k.split() or [''])[0] == siglas
    if porPalabras or porSiglas:
        hit.add(k)

if hit:
    mrr = sum(mapa[k]['mrr'] for k in hit)
    fac = sum(mapa[k]['fac'] for k in hit)
    sema = next((mapa[k]['sema'] for k in hit if mapa[k]['sema'] != '4 - Dormido'), '4 - Dormido')
    print('EMPATA con %d clave(s): %s' % (len(hit), sorted(hit)))
    print('  Factura Mensual -> $%s' % format(round(fac), ','))
    print('  MRR             -> $%s' % format(round(mrr), ','))
    print('  Semaforo        -> %s' % sema)
    print()
    print('Pantalla del usuario: Factura $980 · MRR $993 · Semaforo «1 - Activo».')
else:
    print('** NO EMPATA. La ficha mostraria «—» en Factura Mensual.')
