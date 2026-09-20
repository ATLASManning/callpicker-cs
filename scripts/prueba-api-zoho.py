# -*- coding: utf-8 -*-
"""¿Se puede refrescar Gross Revenue Churn sin navegador y sin clic derecho?

   CONCLUSIONES DE LA INVESTIGACION (20 Sep 2026) — leer antes de reintentar:

   1. El API de Zoho Analytics FUNCIONA hoy con las credenciales que ya viven en
      .env.local. Probado: 7,381 filas / 1.8 MB de la vista de Facturacion en UNA
      sola llamada sincrona. No hace falta navegador ni sesion iniciada.

   2. El scope del refresh token es ZohoAnalytics.data.read. Alcanza para LEER
      datos de una vista cuyo ID ya se conozca. NO alcanza para listar vistas ni
      pedir metadatos del workspace: eso exige ZohoAnalytics.modeling.read y
      responde INVALID_OAUTHSCOPE (8540).

   3. La vista 245443000007094051 del link que comparte Jose Manuel es un
      DASHBOARD, no una tabla. Los dashboards no se exportan como datos:
      responde SYNC_EXPORT_NOT_ALLOWED (8133). Ninguna forma de mandar CONFIG al
      endpoint bulk lo salva — se probaron las cuatro (query quoted, query crudo,
      header, body form) y todas dan LESS_THAN_MIN_OCCURANCE. No se insista: el
      problema no es el metodo, es que un dashboard no tiene datos propios.

   4. Por lo tanto lo UNICO que falta para automatizar es el viewId de la TABLA
      que alimenta el dashboard — la que abre «Ver datos subyacentes». Se obtiene
      de dos maneras:
         a) Jose Manuel hace el clic derecho una vez y pega la URL resultante;
            el viewId viene en la URL. Treinta segundos, una sola vez.
         b) Se agrega ZohoAnalytics.modeling.read al token en el API Console y
            entonces este script puede listar las vistas y encontrarla solo.

   5. Ojo al decodificar: Zoho ignora responseFormat=json en vistas grandes y
      devuelve text/csv CON BOM. Hay que usar utf-8-sig o revienta el parseo.

   Uso:  python scripts/prueba-api-zoho.py            -> diagnostico completo
         python scripts/prueba-api-zoho.py <viewId>   -> lee esa vista y describe

   Solo lectura. No imprime credenciales.
"""
import sys, io, json, urllib.request, urllib.error, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = r'D:\Windows\Projects\callpicker-cs'
DASHBOARD = '245443000007094051'

env = {}
for l in io.open(RAIZ + r'\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        env[k.strip()] = v.strip().strip('"')

WS = env['ZOHO_WORKSPACE_ID']
vista = sys.argv[1] if len(sys.argv) > 1 else env.get('ZOHO_VIEW_ID_FACTURACION', '')

cuerpo = urllib.parse.urlencode({
    'grant_type': 'refresh_token',
    'client_id': env['ZOHO_CLIENT_ID'],
    'client_secret': env['ZOHO_CLIENT_SECRET'],
    'refresh_token': env['ZOHO_REFRESH_TOKEN'],
}).encode()
r = json.loads(urllib.request.urlopen(urllib.request.Request(
    'https://accounts.zoho.com/oauth/v2/token', data=cuerpo,
    headers={'Content-Type': 'application/x-www-form-urlencoded'}), timeout=45).read().decode())

print('scope del token: %s' % r.get('scope', '(no reportado)'))
print('workspace:       %s' % WS)
print('vista a leer:    %s%s' % (vista, '' if len(sys.argv) > 1 else '  (Facturacion, por defecto)'))
print()

H = {'Authorization': 'Zoho-oauthtoken ' + r['access_token'], 'ZANALYTICS-ORGID': env['ZOHO_ORG_ID']}
url = ('https://analyticsapi.zoho.com/restapi/v2/workspaces/%s/views/%s/data?responseFormat=json'
       % (WS, vista))

try:
    with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=180) as x:
        crudo = x.read().decode('utf-8-sig', 'replace')     # BOM: ver nota 5
        tipo = x.headers.get('Content-Type', '')
except urllib.error.HTTPError as e:
    detalle = e.read()[:300].decode('utf-8', 'replace')
    print('HTTP %s · %s' % (e.code, detalle))
    if '8133' in detalle:
        print('-> SYNC_EXPORT_NOT_ALLOWED: esta vista es un dashboard. Ver nota 3.')
    if '8540' in detalle:
        print('-> INVALID_OAUTHSCOPE: falta modeling.read. Ver nota 2.')
    raise SystemExit
except Exception as e:
    print('no se pudo: %s' % str(e)[:160])
    raise SystemExit

lineas = crudo.splitlines()
print('HTTP 200 · %s · %s caracteres · %s filas'
      % (tipo, format(len(crudo), ','), format(max(len(lineas) - 1, 0), ',')))
if not lineas:
    raise SystemExit

cols = [c.strip() for c in lineas[0].split(',')]
print()
print('columnas (%d): %s' % (len(cols), ', '.join(cols[:14]) + (' ...' if len(cols) > 14 else '')))
print()
print('¿sirve para Gross Revenue Churn?')
texto = ' '.join(cols).lower()
for etq, llaves in [('mes / fecha',  ('mes', 'fecha', 'month', 'date', 'periodo', 'cohorte')),
                    ('MRR inicio',   ('mrr inicio', 'mrr_inicio', 'mrr')),
                    ('churn',        ('churn',)),
                    ('downgrade',    ('downgrade',)),
                    ('cuenta / CID', ('cid', 'cuenta', 'cliente', 'account'))]:
    hay = [k for k in llaves if k in texto]
    print('  %-14s %s' % (etq, ('si · %s' % hay[0]) if hay else 'NO APARECE'))
