"""¿Se puede llegar a la vista 245443000007094051 de Zoho?

   Dos caminos distintos y conviene no confundirlos:

     1. La URL tal cual. Es una pantalla de navegador y exige sesion iniciada.
        Yo no inicio sesion con las credenciales de nadie, asi que si esto pide
        login la respuesta es no por ahi.

     2. El API de Zoho Analytics con las credenciales que el proyecto YA tiene
        configuradas en .env.local y que alimentan el modulo de Facturacion.
        Si la vista vive en el mismo workspace, se lee sin navegador.

   Las credenciales no se imprimen.
"""
import sys, io, json, re, urllib.request, urllib.error, urllib.parse
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

URL = 'https://marketingplus.zoho.com/reports/open-view/245443000007094051'
VISTA = '245443000007094051'

env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')

print('=== 1 · LA URL DIRECTA ===')
try:
    r = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(r, timeout=45) as x:
        cuerpo = x.read().decode('utf-8', 'replace')
        print('  HTTP %s · URL final: %s' % (x.status, x.geturl()))
        titulo = re.search(r'<title[^>]*>(.*?)</title>', cuerpo, re.S)
        print('  title: %s' % (titulo.group(1).strip()[:90] if titulo else '(sin title)'))
        pide_login = any(p in x.geturl().lower() or p in cuerpo[:4000].lower()
                         for p in ('accounts.zoho', 'signin', 'login'))
        print('  -> %s' % ('pide iniciar sesión' if pide_login else 'devolvió contenido'))
except urllib.error.HTTPError as e:
    print('  HTTP %s · %s' % (e.code, e.read()[:120].decode('utf-8', 'replace')))
except Exception as e:
    print('  no se pudo: %s' % str(e)[:110])

print()
print('=== 2 · EL API, CON LAS CREDENCIALES DEL PROYECTO ===')
faltan = [k for k in ('ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN',
                      'ZOHO_ORG_ID', 'ZOHO_WORKSPACE_ID') if not env.get(k)]
if faltan:
    print('  faltan credenciales: %s' % faltan)
    raise SystemExit

cuerpo = urllib.parse.urlencode({
    'grant_type': 'refresh_token',
    'client_id': env['ZOHO_CLIENT_ID'],
    'client_secret': env['ZOHO_CLIENT_SECRET'],
    'refresh_token': env['ZOHO_REFRESH_TOKEN'],
}).encode()
try:
    tk = urllib.request.Request('https://accounts.zoho.com/oauth/v2/token', data=cuerpo,
                                headers={'Content-Type': 'application/x-www-form-urlencoded'})
    tok = json.loads(urllib.request.urlopen(tk, timeout=45).read().decode())['access_token']
    print('  token obtenido: sí')
except Exception as e:
    print('  no se pudo obtener token: %s' % str(e)[:120])
    raise SystemExit

H = {'Authorization': 'Zoho-oauthtoken ' + tok, 'ZANALYTICS-ORGID': env['ZOHO_ORG_ID']}


def pide(etiqueta, url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=90) as x:
            t = x.read().decode('utf-8', 'replace')
            print('  %-34s HTTP %s · %s caracteres' % (etiqueta, x.status, format(len(t), ',')))
            return t
    except urllib.error.HTTPError as e:
        print('  %-34s HTTP %s · %s' % (etiqueta, e.code, e.read()[:150].decode('utf-8', 'replace')))
    except Exception as e:
        print('  %-34s %s' % (etiqueta, str(e)[:110]))
    return None


WS = env['ZOHO_WORKSPACE_ID']
print('  workspace configurado: %s' % WS)

# ¿Qué vistas tiene el workspace del proyecto, y está la nuestra entre ellas?
t = pide('vistas del workspace', 'https://analyticsapi.zoho.com/restapi/v2/workspaces/%s/views' % WS)
if t:
    try:
        vistas = json.loads(t).get('data', {}).get('views', [])
        print('    %d vistas en el workspace' % len(vistas))
        aqui = [v for v in vistas if str(v.get('viewId')) == VISTA]
        print('    ¿está la 245443000007094051?: %s' % ('SÍ' if aqui else 'no'))
        if aqui:
            print('    -> %s (%s)' % (aqui[0].get('viewName'), aqui[0].get('viewType')))
        else:
            print('    vistas disponibles (primeras 8):')
            for v in vistas[:8]:
                print('      %-22s %-12s %s' % (v.get('viewId'), v.get('viewType'), str(v.get('viewName'))[:46]))
    except Exception as e:
        print('    no se pudo interpretar: %s' % str(e)[:100])

# Intento directo contra la vista, por si vive en otro workspace accesible
t = pide('datos de la vista (directo)',
         'https://analyticsapi.zoho.com/restapi/v2/workspaces/%s/views/%s/data?responseFormat=json' % (WS, VISTA))
if t:
    print('    primeras líneas: %s' % t[:220].replace('\n', ' | '))
