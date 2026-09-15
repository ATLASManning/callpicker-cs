"""Busca un texto de la UI dentro de los chunks JS de produccion.

   El dashboard esta detras de /acceso y yo no entro credenciales, asi que no
   puedo abrir la pantalla. Pero el middleware excluye `_next/static`
   (middleware.ts:101), asi que los chunks SI son publicos: si el texto nuevo
   aparece ahi, el deploy aterrizo de verdad.

   El problema es averiguar como se llama el chunk de una ruta protegida: pedir
   /analisis-llamadas redirige a /acceso y devuelve los chunks del login. La
   vuelta es sacar el buildId del HTML de /acceso y leer el manifiesto, que si
   se sirve sin sesion.

   Trampa conocida: los acentos viajan escapados como \\xNN o \\uNNNN dentro
   del JS. Hay que desescapar antes de buscar o todo da falso negativo.
"""
import sys, io, re, urllib.request, urllib.error
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = 'https://callpicker-cs.vercel.app'
AGUJAS = [
    ('explicacion de «Numeros»',      'conmutador con cien empleados'),
    ('declaracion de periodo',        'El filtro de mes no aplica a esta tabla'),
    ('bolsa que hace cerrar',         'otros destinos'),
]


def baja(u):
    r = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(r, timeout=90).read().decode('utf-8', 'replace')


html = baja(BASE + '/acceso')
ids = set(re.findall(r'/_next/static/([A-Za-z0-9_\-]{6,})/_(?:ssg|build)Manifest', html))
ids |= set(re.findall(r'"buildId"\s*:\s*"([^"]+)"', html))
ids |= set(re.findall(r'/_next/static/([A-Za-z0-9_\-]{10,})/', html))
print('buildId candidatos: %s' % (sorted(ids) or 'ninguno'))

# Todo chunk que la app mencione en cualquier parte, empezando por los del login.
rutas = set(re.findall(r'/_next/static/[^"\'\s\\]+?\.js', html))
for bid in ids:
    for m in ('_buildManifest.js', '_ssgManifest.js'):
        try:
            txt = baja('%s/_next/static/%s/%s' % (BASE, bid, m))
            rutas |= set(re.findall(r'static/[^"\'\s\\]+?\.js', txt))
            print('  %s -> %d rutas' % (m, len(rutas)))
        except urllib.error.HTTPError as e:
            print('  %s -> HTTP %s' % (m, e.code))

rutas = sorted({r if r.startswith('/') else '/_next/' + r for r in rutas})
print('chunks a revisar: %d' % len(rutas))

texto, ok = '', 0
for c in rutas:
    try:
        texto += baja(BASE + c); ok += 1
    except urllib.error.HTTPError:
        pass
print('descargados: %d  (%s caracteres)' % (ok, format(len(texto), ',')))

plano = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m: chr(int(m.group(1), 16)), texto)
plano = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), plano)

print()
for etiqueta, a in AGUJAS:
    print('  %s %-26s %s' % ('SI ' if a in plano else '** ', etiqueta, a[:46]))
print()
print('Si salen ** puede ser que el chunk de la ruta protegida no este listado')
print('en el manifiesto — eso NO prueba que el deploy fallo, solo que no se')
print('alcanzo a leer desde fuera de la sesion.')
