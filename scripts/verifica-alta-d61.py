# -*- coding: utf-8 -*-
u"""COMPRUEBA EL ALTA DE EURO STERN (D61) EN PANTALLA, no en la base.

   Que la fila exista no prueba que la ficha la pinte, y el 201 del POST no
   prueba que el motor de alertas la vea. Se piden tres cosas:

     1. `/api/alertas/veredictos`, donde se decide si es TOP y que hallazgos
        se le abren. La lista viene en la clave `rows`.
     2. El HTML servido de `/cuentas/<id>`, buscando frases ANCLADAS del
        expediente — no «la pagina carga», sino «esta frase concreta sale».
     3. La fila en la base, para los candados que NO son de texto.

   Y con cuatro controles NEGATIVOS, que es lo que hace que sirva:

     - NO puede ser TOP. Con $6,463 cae en la posicion 91 de 143 y el corte
       esta en $15,607. Si sale TOP, algo lee mal el importe.
     - EL CONTACTO ES EL DE LA FICHA DE DIRECCION Y NADA MAS:
       handrade@eurostern.com.mx y el MOVIL 3312721787. Dos cosas NO pueden
       aparecer: el buzon corporativo callcenter@eurostern.com.mx o un cargo
       «pendiente de confirmar» (seria inventar un interlocutor), y un NOMBRE
       —la captura no lo trae, y deducir «Andrade» del buzon es inventarlo.
       Tampoco puede sembrarse como telefono el 3336304545: ese es nuestro
       propio DID de la sede Minerva, no la via directa a la persona.
     - EL MOTOR NO PUEDE DECIR QUE NO CONSUME. Los dos cortes dan 65.4% y
       69.8% de una bolsa de 2,500 minutos. Si un hallazgo publica un
       porcentaje de consumo cercano a cero, uno de los dos miente — y en C70
       mintio la nota. Por eso este guion LEE los hallazgos y no los cuenta.
     - EL «1er PAGO» NO PUEDE SER EL MRR. $3,851 es el primer cobro y $3,320
       el MRR de esa linea. Si la ficha publica 3,851 como facturacion, se
       colo la columna equivocada. [[altas-cuentas]]

   USO
       python scripts/verifica-alta-d61.py <cookie> [<id>]

   La cookie la da `node scripts/sesion-local.cjs`. Necesita el servidor en
   el 3100.
"""
import io
import json
import os
import re
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

if len(sys.argv) < 2:
    print(__doc__)
    raise SystemExit(2)
COOKIE = sys.argv[1]
ID = sys.argv[2] if len(sys.argv) > 2 else '6c39b041-30e5-402c-b91d-038369351ace'
CID = '181577'
BASE = 'http://localhost:3100'
H = {'Cookie': 'cp_session=' + COOKIE, 'User-Agent': 'verifica-alta-d61'}

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
print(u'  filas servidas: %d   (total %s)' % (len(lista), d.get('total')))

mio = [v for v in lista if str(v.get('cid')) == CID
       or 'EURO STERN' in str(v.get('empresa', '')).upper()]
if not mio:
    fallos.append(u'EURO STERN NO aparece en /api/alertas/veredictos')
    hall = []
else:
    v = mio[0]
    ver = v.get('veredicto') or {}
    print(u'  EURO STERN: mrr=%s | esTop=%s | situacion=%s | luz=%s'
          % (v.get('mrr'), v.get('esTop'), ver.get('situacion'), ver.get('luz')))
    if v.get('esTop'):
        fallos.append(u'sale esTop=True y con $6,463 cae en la posicion 91 de 143')
    if v.get('mrr') not in (6463, 6463.0, '6463'):
        fallos.append(u'el motor lee un MRR distinto de 6,463: %s' % v.get('mrr'))
    if v.get('mrr') in (3851, 3851.0, '3851'):
        fallos.append(u'el motor lee 3,851, que es el «1er Pago» y NO el MRR')
    hall = ver.get('hallazgos') or []
    print(u'\n  HALLAZGOS QUE ABRE EL MOTOR (%d) — se LEEN, no se cuentan:' % len(hall))
    for h in hall:
        print(u'    · %s' % (h if isinstance(h, str) else json.dumps(h, ensure_ascii=False))[:300])

# CONTROL NEGATIVO 3: la cuenta SI consume (65.4% y 69.8%). Un hallazgo que
# publique un consumo cercano a cero contradice los cortes.
texto_h = u' '.join(h if isinstance(h, str) else json.dumps(h, ensure_ascii=False)
                    for h in hall)
pcts = [float(p) for p in re.findall(r'(\d+(?:\.\d+)?)\s*%', texto_h)]
bajos = [p for p in pcts if 0 <= p <= 5]
if bajos:
    print(u'\n  (!) el motor publica porcentajes BAJOS: %s'
          % u', '.join(u'%g%%' % p for p in bajos))
    print(u'      Los dos cortes medidos dan 65.4% y 69.8% de una bolsa de 2,500.')
    print(u'      Hay que LEER de que es cada porcentaje: si alguno es de consumo')
    print(u'      de voz, la ficha esta mal y se corrige DENTRO del texto')
    print(u'      publicado, no en silencio.')
elif pcts:
    print(u'\n  (i) porcentajes publicados por el motor: %s — leerlos antes de'
          u' darlos por buenos.' % u', '.join(u'%g%%' % p for p in pcts))

# ── 2. La ficha se pinta, y dice lo que tiene que decir ─────────────────────
st2, html = get('/cuentas/' + ID)
print(u'\n  /cuentas/%s -> HTTP %s · %d caracteres' % (ID, st2, len(html)))

ANCLAS = [
    (u'EURO STERN',          u'el nombre de la cuenta'),
    (u'D61',                 u'el consecutivo'),
    (u'181577',              u'el CID sembrado'),
    (u'TRES TICKETS DE CANCELACION',
                             u'el dato que manda, y no estaba en ningun resumen'),
    (u'109900',              u'el folio del mas largo de los tres (425 h)'),
    (u'OSPEM',               u'la agencia que el GRC da por desactivada'),
    (u'MRR estable',         u'Zeekr, la que sostiene la relacion'),
    (u'65.4%',               u'que esta cuenta SI usa el servicio'),
    (u'523336304545',        u'el unico DID nuestro: la sede Minerva'),
    (u'pool de inventario',  u'el CID 499, para que nadie lo cruce por etiqueta'),
    (u'2,395 horas',         u'el onboarding de cien dias'),
    (u'$2,245',              u'la oportunidad de Zeekr que NO cuadra con su primer pago'),
    (u'AA',                  u'la banda que dice el GRC, junto a la AAA de direccion'),
    (u'handrade@eurostern.com.mx',
                             u'el unico interlocutor, el mismo en las tres agencias'),
    (u'3312721787',          u'el movil, que es la via directa'),
]
print(u'\n  FRASES QUE TIENEN QUE SALIR EN LA FICHA SERVIDA:')
for frase, porque in ANCLAS:
    ok = frase in html
    if not ok:
        fallos.append(u'no sale en la ficha: «%s»' % frase)
    print(u'    %s«%s» — %s' % (u'ok   ' if ok else u'*** FALTA *** ', frase, porque))

# Ningun enlace de memoria puede llegar a la pantalla.
enl = sorted(set(re.findall(r'\[\[[a-z0-9\-]+\]\]', html)))
if enl:
    fallos.append(u'enlaces de memoria impresos en la ficha: %s' % u', '.join(enl))
print(u'    %senlaces [[..]] visibles: %s'
      % (u'ok   ' if not enl else u'*** ', u', '.join(enl) if enl else u'ninguno'))

# ── 3. Los candados que no son de texto: la fila en la base ─────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env = {}
for line in io.open(os.path.join(ROOT, '.env.local'), encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, val = line.split('=', 1)
        env[k.strip()] = val.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
r = urllib.request.Request(
    URL + '/rest/v1/cuentas?select=consecutivo,empresa,asesor,estado,cid,facturacion,'
          'activo_desde,contacto_nombre,contacto_cargo,contacto_tel,contacto_email,'
          'contactos_json,servicios_json&consecutivo=eq.D61',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
with urllib.request.urlopen(r, timeout=90) as x:
    fila = json.loads(x.read().decode('utf-8', 'replace'))
if len(fila) != 1:
    fallos.append(u'D61 aparece %d veces en `cuentas`, no una' % len(fila))
else:
    f = fila[0]
    print(u'\n  LA FILA: %s · %s · %s · %s · $%s · desde %s'
          % (f['consecutivo'], f['empresa'], f['asesor'], f['estado'],
             f['facturacion'], f['activo_desde']))
    if f['asesor'] != 'Dan':
        fallos.append(u'el asesor no es Dan: %s' % f['asesor'])
    if str(f['cid']) != CID:
        fallos.append(u'el CID no es %s: %s' % (CID, f['cid']))
    if float(f['facturacion']) != 6463.0:
        fallos.append(u'la facturacion no es 6,463: %s' % f['facturacion'])
    # CONTROL NEGATIVO 2 — el interlocutor es el de la ficha, y SOLO ese.
    ESPERADO = {'contacto_email': u'handrade@eurostern.com.mx',
                'contacto_tel':   u'3312721787'}
    for k, val in sorted(ESPERADO.items()):
        if (f[k] or u'').strip() != val:
            fallos.append(u'`%s` deberia ser «%s» y trae «%s»' % (k, val, f[k]))
    # El NOMBRE no existe en la captura: sembrarlo seria deducirlo del buzon.
    if f['contacto_nombre']:
        fallos.append(u'`contacto_nombre` trae «%s» y la ficha de direccion no da '
                      u'ningun nombre' % f['contacto_nombre'])
    campos = json.dumps({k: f[k] for k in ('contacto_nombre', 'contacto_cargo',
                                           'contacto_tel', 'contacto_email',
                                           'contactos_json')}, ensure_ascii=False)
    # Ni canales corporativos, ni cargos sin confirmar, ni nuestro propio DID
    # disfrazado de telefono del cliente.
    for c, porque in ((u'callcenter@eurostern.com.mx', u'es un buzon corporativo'),
                      (u'Martin del Campo', u'su vigencia esta sin confirmar'),
                      (u'Acosta Morones',   u'su vigencia esta sin confirmar'),
                      (u'Andrade',          u'es una deduccion del buzon, no un dato')):
        if c in campos:
            fallos.append(u'«%s» esta publicado como contacto y %s' % (c, porque))
    if u'3336304545' in (f['contacto_tel'] or u''):
        fallos.append(u'el telefono sembrado es 3336304545, que es NUESTRO DID de '
                      u'la sede Minerva, no la via directa al interlocutor')
    cj = f['contactos_json'] or []
    if len(cj) != 1:
        fallos.append(u'`contactos_json` trae %d entradas y el expediente registra '
                      u'UNO, el mismo para las tres agencias' % len(cj))
    print(u'    contacto: %s · %s   (%d en contactos_json; nombre SIN CAPTURAR a '
          u'proposito)' % (f['contacto_email'], f['contacto_tel'], len(cj)))
    # Los TRES servicios tienen que estar declarados: es la forma en que esta
    # cuenta guarda sus otros dos CIDs, porque la tabla solo tiene uno.
    sj = f['servicios_json'] or []
    txt = json.dumps(sj, ensure_ascii=False)
    for c in ('181577', '164747', '169341'):
        if c not in txt:
            fallos.append(u'el CID %s del cliente no esta declarado en `servicios_json`' % c)
    print(u'    servicios_json: %d entrada(s), con los tres CIDs del cliente' % len(sj))

print(u'\n  ' + u'-' * 68)
if fallos:
    print(u'  %d FALLO(S):' % len(fallos))
    for x in fallos:
        print(u'    *** %s' % x)
    raise SystemExit(1)
print(u'  El alta de D61 esta en la base, el motor la ve y la ficha la pinta.')
