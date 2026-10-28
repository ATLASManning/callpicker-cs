# -*- coding: utf-8 -*-
u"""COMPRUEBA EL ALTA DE GS TRACKME (C70) EN PANTALLA, no en la base.

   Que la fila exista no prueba que la ficha la pinte, y el 201 del POST no
   prueba que el motor de alertas la vea. Se piden las DOS cosas:

     1. `/api/alertas/veredictos`, que es donde se decide si es TOP y que
        hallazgos se le abren. La lista viene en la clave `rows`.
     2. El HTML servido de `/cuentas/<id>`, buscando frases ANCLADAS del
        expediente — no «la pagina carga», sino «esta frase concreta sale».

   Y con dos controles NEGATIVOS, que es lo que hace que sirva:

     - La investigacion del grupo que direccion mando quitar no debe aparecer
       («este es el cliente, no le busques por otros lados», 28 oct 2026).
     - La afirmacion FALSA que llevo esta alta unas horas —«el CID 56655 no
       aparece en el archivo de cortes»— tampoco. Se desmintio con
       `mide-cortes-cuenta.py 56655`: hay nueve cortes medibles.

   USO
       python scripts/verifica-alta-c70.py <cookie> [<id>]

   La cookie la da `node scripts/sesion-local.cjs`. Necesita el servidor en
   el 3100.
"""
import io
import json
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

if len(sys.argv) < 2:
    print(__doc__)
    raise SystemExit(2)
COOKIE = sys.argv[1]
ID = sys.argv[2] if len(sys.argv) > 2 else 'ba97d6ea-fa66-49d3-bfd3-91facebd1b2e'
BASE = 'http://localhost:3100'
H = {'Cookie': 'cp_session=' + COOKIE, 'User-Agent': 'verifica-alta-c70'}

fallos = []


def get(path):
    r = urllib.request.Request(BASE + path, headers=H)
    with urllib.request.urlopen(r, timeout=300) as x:
        return x.status, x.read().decode('utf-8', 'replace')


# ── 1. El motor la ve, lee bien su dinero y NO la hace TOP ──────────────────
st, raw = get('/api/alertas/veredictos')
print(u'\n  /api/alertas/veredictos -> HTTP %s' % st)
d = json.loads(raw)
lista = d.get('rows')
if not isinstance(lista, list):
    print(u'  *** la respuesta ya no trae `rows`. Claves: %s'
          % u', '.join(sorted(d.keys())))
    raise SystemExit(1)
print(u'  filas servidas: %d   (total %s, mostradas %s)'
      % (len(lista), d.get('total'), d.get('mostradas')))

mio = [v for v in lista if str(v.get('cid')) == '56655'
       or 'Trackme' in str(v.get('empresa', ''))]
if not mio:
    fallos.append(u'GS Trackme NO aparece en /api/alertas/veredictos')
else:
    v = mio[0]
    ver = v.get('veredicto') or {}
    print(u'  GS Trackme: mrr=%s | esTop=%s | situacion=%s | luz=%s'
          % (v.get('mrr'), v.get('esTop'), ver.get('situacion'), ver.get('luz')))
    titulos = [str(h.get('titulo')) for h in (ver.get('hallazgos') or [])]
    for t in titulos:
        print(u'      - %s' % t)
    if v.get('esTop') is not False:
        fallos.append(u'esTop deberia ser falso: $2,488 la deja en el lugar 160 de 194')
    if v.get('mrr') != 2488:
        fallos.append(u'el motor lee un MRR de %s, no 2,488' % v.get('mrr'))
    # El consumo SE MIDE, asi que la ceguera de medicion NO debe abrirse. Es
    # el hallazgo que la primera version de la nota daba por hecho.
    ciegos = [t for t in titulos if u'no cruza' in t or u'sin medici' in t.lower()]
    if ciegos:
        fallos.append(u'se abrio ceguera de medicion (%s) y hay 9 cortes medibles'
                      % u'; '.join(ciegos))
    if not any(u'no lo que usa' in t or u'que no usa' in t for t in titulos):
        fallos.append(u'con el 1.2% de la bolsa, el motor deberia decir que paga'
                      u' mas de lo que usa')

# ── 2. La ficha servida: frases ancladas del expediente ─────────────────────
st, html = get('/cuentas/' + ID)
print(u'\n  /cuentas/%s -> HTTP %s, %d caracteres' % (ID, st, len(html)))

ANCLAS = [
    u'GS Trackme',
    u'C70',
    u'Erick',
    u'Enrique Gomez',                            # el contacto de origen
    u'Ian Abdala',                               # el segundo interlocutor
    u'118633',                                   # la peticion abierta
    u'112819',                                   # el ticket de cancelacion
    u'3 Extensiones Visibilidad y Control IL',
    u'DID Internacional Barcelona',
    u'529994541949',                             # el tercer DID, sin facturar
    u'Sercurezza',                               # la linea del cliente ya apagada
    u'2,488',
    u'4,500',                                    # la bolsa: 3 x 1,500
    u'1.2%',                                     # el consumo del mejor mes
    u'falta justo el corte de agosto de 2026',
]
for a in ANCLAS:
    hay = a in html
    print(u'  %s  %s' % (u'ok  ' if hay else u'*** ', a))
    if not hay:
        fallos.append(u'la ficha no sirve «%s»' % a)

# ── 3. Controles negativos ──────────────────────────────────────────────────
PROHIBIDO = [
    # Investigacion del grupo y de la competencia, retirada por instruccion.
    u'GS Connect', u'gsconnect', u'24 empresas', u'1.001 a 5.000',
    u'Subcontrataciones', u'357 8365', u'gruposisprovisa.com/',
    # La afirmacion falsa, corregida el mismo dia.
    u'va a abrir `sin_consumo_medible`', u'meterla\n  al corte',
]
for p in PROHIBIDO:
    if p in html:
        fallos.append(u'la ficha todavia publica «%s»' % p)
        print(u'  *** sigue el texto retirado: %s' % p)
print(u'  ok   ninguna de las %d cadenas retiradas aparece' % len(PROHIBIDO))

for mal in (u'Ã', u'â€', u'ï»¿'):
    if mal in html:
        fallos.append(u'acento doblemente codificado en la ficha: %s' % mal)

print(u'\n  ' + (u'TODO CUADRA.' if not fallos else u'%d FALLO(S):' % len(fallos)))
for f in fallos:
    print(u'    *** %s' % f)
sys.exit(1 if fallos else 0)
