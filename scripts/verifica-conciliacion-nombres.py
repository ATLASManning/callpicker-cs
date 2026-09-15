"""¿Reparar la codificacion mejoro la conciliacion por nombre?

   `norm` de llamadas-data.ts se deriva del nombre de empresa y es la llave con
   la que lib/llamadas-cuenta.ts concilia una cuenta cuando el CID no empata
   (conciliar(), rama `via: 'nombre'`). Si el nombre venia roto —«Oce√°nica»— su
   `norm` tambien lo estaba y jamas iba a empatar con «Oceánica» de la cartera.

   Mide cuantas cuentas del archivo empatan por nombre con la cartera, y en
   particular que pasa con las que estaban rotas: como venian antes y si ahora
   encuentran a su cuenta.
"""
import sys, io, os, re, json, unicodedata, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _texto_roto import arregla

RAIZ = r'D:\Windows\Projects\callpicker-cs'


def norm(s):
    """Replica de normalizarNombre() de lib/llamadas-cuenta.ts."""
    s = (s or '').lower()
    s = ''.join(c for c in unicodedata.normalize('NFD', s)
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'\s+', ' ', re.sub(r'[^a-z0-9\s]', ' ', s)).strip()


def comoVenia(bueno):
    """El nombre tal como llegaba antes del arreglo: UTF-8 leido como Mac Roman."""
    try:
        return bueno.encode('utf-8').decode('mac_roman')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return None


# ── Archivo de llamadas ─────────────────────────────────────────────────────
txt = io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8').read()
archivo = {}
for m in re.finditer(r'^\s*"(\d+)":\s*(\{.*\}),\s*$', txt, re.M):
    archivo[m.group(1)] = json.loads(m.group(2)).get('empresa', '')

# ── Cartera ─────────────────────────────────────────────────────────────────
env = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1); env[k.strip()] = v.strip().strip('"')
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
rq = urllib.request.Request(
    env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?select=cid,empresa,consecutivo,asesor',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
cart = json.loads(urllib.request.urlopen(rq, timeout=60).read().decode())

porNombre = {}
for c in cart:
    porNombre.setdefault(norm(c['empresa']), []).append(c)

print('archivo de llamadas : %d cuentas' % len(archivo))
print('cartera             : %d cuentas' % len(cart))

# conciliar() solo acepta el empate por nombre si es UNICO (hits.length !== 1 -> null)
unico = sum(1 for e in archivo.values() if len(porNombre.get(norm(e), [])) == 1)
print()
print('empatan por nombre con exactamente una cuenta: %d de %d' % (unico, len(archivo)))

# ── Las que estaban rotas ───────────────────────────────────────────────────
# Solo las que de verdad viajaban rotas: un nombre ASCII se ve igual de los dos
# lados y nunca estuvo dañado, así que no cuenta.
rotas = sorted({e for e in archivo.values()
                if comoVenia(e) and comoVenia(e) != e and arregla(comoVenia(e)) == e})
print()
print('=== empresas que llegaban con la codificacion rota ===')
if not rotas:
    print('  ninguna')
for buena in rotas:
    malo = comoVenia(buena)
    ahora = porNombre.get(norm(buena), [])
    antes = porNombre.get(norm(malo), [])
    et = lambda h: ('%s · %s' % (h[0]['consecutivo'], h[0]['asesor'] or '[sin asesor]')) if len(h) == 1 else 'SIN EMPATE'
    print('  %-30s  antes: %-12s  ahora: %s' % (buena[:30], et(antes), et(ahora)))
    print('      llegaba como: %s' % malo[:52])
