"""Comprueba a quien alcanza la exclusion manual del programa SAC.

   Replica esExclusionManual() de lib/elegibilidad.ts contra la cartera real.
   Dos cosas que tiene que probar:
     1. las cuentas que dirección pidió excluir quedan excluidas
     2. NINGUNA otra queda excluida por accidente — el cruce por nombre
        normalizado borra acentos y signos, asi que dos nombres parecidos
        pueden colapsar en el mismo. Por eso se agrego el CID como llave fuerte.
"""
import sys, io, json, unicodedata, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# Espejo de EXCLUSIONES_SAC en lib/elegibilidad.ts
EXCLUSIONES = [
    {'nombre': 'Pitahaya',           'cid': None},
    {'nombre': 'Centinela Property', 'cid': '140527'},
]


def norm(s):
    """Replica de normalizarNombre()."""
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or ''))
                if not (0x300 <= ord(c) <= 0x36f)).lower()
    return ''.join(c for c in s if c.isalnum() and ord(c) < 128)


NOMBRES = {norm(e['nombre']) for e in EXCLUSIONES}
CIDS = {e['cid'] for e in EXCLUSIONES if e['cid']}


def excluida(c):
    cid = str(c.get('cid') or '').strip()
    if cid and cid in CIDS:
        return 'cid'
    if norm(c.get('empresa')) in NOMBRES:
        return 'nombre'
    return None


env = {}
for l in io.open(r'D:\Windows\Projects\callpicker-cs\.env.local', encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
rq = urllib.request.Request(
    env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?select=cid,empresa,consecutivo,asesor,estado',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
cart = json.loads(urllib.request.urlopen(rq, timeout=60).read().decode())

print('cartera: %d cuentas' % len(cart))
print()
print('=== cuentas que quedan FUERA del programa SAC ===')
print('  %-6s %-34s %-9s %-12s %s' % ('#', 'empresa', 'asesor', 'estado', 'empata por'))
hits = []
for c in sorted(cart, key=lambda x: x['consecutivo']):
    via = excluida(c)
    if via:
        hits.append(c)
        print('  %-6s %-34s %-9s %-12s %s'
              % (c['consecutivo'], c['empresa'][:34], c['asesor'] or '—', c['estado'], via))
print()
print('  total: %d  (esperadas: %d)' % (len(hits), len(EXCLUSIONES)))

# ¿Algun nombre de la cartera colapsa con otro al normalizar? Eso es lo que
# hace fragil el cruce por nombre, y la razon de haber agregado el CID.
colisiones = {}
for c in cart:
    colisiones.setdefault(norm(c['empresa']), []).append(c['consecutivo'])
dobles = {k: v for k, v in colisiones.items() if len(v) > 1}
print()
print('=== nombres que colapsan al normalizar (fragilidad del cruce por nombre) ===')
print('  %s' % (dobles if dobles else 'ninguno hoy — pero el CID lo blinda para mañana'))

print()
print('=== siguen activas y en cartera (excluir NO es cancelar) ===')
for c in hits:
    viva = c['estado'] in ('activo', 'en_riesgo')
    print('  %-6s %-30s estado=%-12s sigueViva=%s' % (c['consecutivo'], c['empresa'][:30], c['estado'], viva))
