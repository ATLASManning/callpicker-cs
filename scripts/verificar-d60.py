"""Verifica la ficha D60 en produccion contra lo que realmente se rinde.

   /cuentas/[id] es server component: el HTML que baja YA trae los datos, asi que
   buscar texto en el es prueba, no suposicion.

   Trampa conocida (me mordio dos veces): React inserta separadores <!-- --> de
   nodo de texto entre literal y expresion, asi que «CID 31510» baja como
   «CID <!-- -->31510». Hay que limpiarlos ANTES de buscar o todo da falso
   negativo.
"""
import sys, io, re, json, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

ID = '26a15fd8-92b2-4c3c-a9ca-a6045e9bb096'
URL = 'https://callpicker-cs.vercel.app/cuentas/' + ID

req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=90) as r:
    html = r.read().decode('utf-8', 'replace')
    codigo = r.status

# 1) separadores de React   2) escapes \xNN del payload de Next   3) entidades
plano = html.replace('<!-- -->', '')
plano = re.sub(r'\\x([0-9a-fA-F]{2})', lambda m: chr(int(m.group(1), 16)), plano)
plano = re.sub(r'\\u([0-9a-fA-F]{4})', lambda m: chr(int(m.group(1), 16)), plano)
plano = (plano.replace('&#x27;', "'").replace('&quot;', '"')
              .replace('&amp;', '&').replace('&#39;', "'"))

print('HTTP %s · %s bytes' % (codigo, format(len(html), ',')))
print()

PRUEBAS = [
    ('Nombre en el encabezado',      'Supreme Resources México'),
    ('Consecutivo D60',              'D60'),
    ('Badge CID pegado al nombre',   'CID 31510'),
    ('Asesor Dan',                   'Dan'),
    ('Giro / quimicos',              'químicos especializados'),
    ('RFC en grupo empresarial',     'SRM150506K25'),
    ('Domicilio fiscal CDMX',        'Ana Bolena'),
    ('Segundo sitio Queretaro',      'El Marqués'),
    ('Sitio web',                    'supremeresources.com.mx'),
    ('Plan vigente',                 'Visibilidad y Control 400 minutos'),
    ('Head count sin inventar',      'Head count exacto NO publicado'),
    ('Inteligencia KAM',             'Distribuidor EXCLUSIVO'),
    ('Hueco declarado: contacto',    'CONTACTO PRINCIPAL con nombre, cargo y correo: SIN CAPTURAR'),
    ('Panel de llamadas presente',   'SIN LECTURA'),
]

ok = 0
for etiqueta, aguja in PRUEBAS:
    hay = aguja in plano
    ok += hay
    print('  %s  %-30s %s' % ('SI ' if hay else '** ', etiqueta, aguja[:46]))

print()
print('%d de %d en pantalla.' % (ok, len(PRUEBAS)))

# El badge del CID debe ir pegado al nombre, no en cualquier parte de la pagina.
m = re.search(r'Supreme Resources México(.{0,400}?)CID 31510', plano, re.S)
print()
if m:
    print('CID a %d caracteres del nombre (mismo encabezado).' % len(m.group(1)))
else:
    print('** El CID no aparece junto al nombre — revisar el encabezado.')
