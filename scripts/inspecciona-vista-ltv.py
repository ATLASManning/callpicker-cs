"""Que trae REALMENTE la vista de Zoho que hoy alimenta a LTV.

   Importa mucho para el reemplazo: si esta vista ya tiene las dos columnas que
   direccion pidio —«MRR Inicio Contrato» e «Importe Acumulado Recurrente»—
   entonces el refresco semanal puede ser automatico por API, y no hace falta
   que nadie exporte un archivo a mano cada lunes.

   Las credenciales no se imprimen.
"""
import sys, io, json, re, collections, urllib.request, urllib.parse
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
txt = urllib.request.urlopen(rq, timeout=150).read().decode('utf-8', 'replace').lstrip('\ufeff')


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
    filas = [dict(zip(cols, r)) for r in raw] if raw and isinstance(raw[0], list) else raw
else:
    ln = [x for x in txt.split('\n') if x.strip()]
    cols = csv(ln[0])
    filas = [dict(zip(cols, csv(x))) for x in ln[1:]]

print('vista LTV: %s filas · %d columnas' % (format(len(filas), ','), len(cols)))
print()
print('=== TODAS LAS COLUMNAS ===')
for i, c in enumerate(cols):
    print('  %2d  %s' % (i, c))

print()
print('=== ¿ESTAN LAS DOS QUE PIDIO DIRECCION? ===')
BUSCA = {
    'MRR Inicio Contrato': ['mrr_inicio', 'inicio_contrato', 'mrr_inicio_contrato'],
    'Importe Acumulado Recurrente': ['importe_acumulado_recurrente', 'acumulado_recurrente'],
}
for etiqueta, claves in BUSCA.items():
    hit = [c for c in cols if any(k in c.lower().replace(' ', '_') for k in claves)]
    print('  %-32s %s' % (etiqueta, hit or '** NO ESTA en esta vista'))

print()
print('=== MUESTRA DE VALORES ===')
if filas:
    f0 = filas[0]
    for c in cols:
        v = str(f0.get(c, ''))[:38]
        if v:
            print('  %-34s %s' % (c[:34], v))
