# -*- coding: utf-8 -*-
u"""COMPRUEBA EL ALTA DE ISHOP MIXUP (C71) EN PANTALLA, no en la base.

   Que la fila exista no prueba que la ficha la pinte, y el 201 del POST no
   prueba que el motor de alertas la vea. Se piden tres cosas:

     1. `/api/alertas/veredictos`, donde se decide si es TOP y que hallazgos
        se le abren. La lista viene en la clave `rows`.
     2. El HTML servido de `/cuentas/<id>`, buscando frases ANCLADAS del
        expediente — no «la pagina carga», sino «esta frase concreta sale».
     3. La fila en la base, para los candados que NO son de texto.

   Y con tres controles NEGATIVOS, que es lo que hace que sirva:

     - NO puede ser TOP. Con $5,512 cae en la posicion 109 de 142 y el corte
       esta en $15,607. Si sale TOP, algo lee mal el importe.
     - EL UNICO CONTACTO ES LIZ FLORES, la que trae el registro de Zoho CRM.
       Los canales publicos de la ficha corporativa (el 800, ARCO, el correo
       de reclutamiento) NO pueden aparecer como contacto de la cuenta:
       publicarlos ahi es inventar un interlocutor. Se comprueban los campos
       `contacto_*` y `contactos_json`, no el HTML entero — esos correos SI
       salen en `notas`, donde se explica por que no se capturan.
     - EL MOTOR NO PUEDE DECIR QUE CONSUME. La nota afirma CERO minutos en
       los dos cortes. Si un hallazgo trae un porcentaje de uso distinto de
       cero, uno de los dos miente — y en C70 mintio la nota. Por eso este
       guion LEE los hallazgos y no solo los cuenta. [[altas-cuentas]]

   USO
       python scripts/verifica-alta-c71.py <cookie> [<id>]

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
ID = sys.argv[2] if len(sys.argv) > 2 else '852919cd-1688-4b26-9764-9b36533e29ca'
CID = '189819'
BASE = 'http://localhost:3100'
H = {'Cookie': 'cp_session=' + COOKIE, 'User-Agent': 'verifica-alta-c71'}

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
       or 'ISHOP' in str(v.get('empresa', '')).upper()]
if not mio:
    fallos.append(u'ISHOP MIXUP NO aparece en /api/alertas/veredictos')
    hall = []
else:
    v = mio[0]
    ver = v.get('veredicto') or {}
    print(u'  ISHOP MIXUP: mrr=%s | esTop=%s | situacion=%s | luz=%s'
          % (v.get('mrr'), v.get('esTop'), ver.get('situacion'), ver.get('luz')))
    if v.get('esTop'):
        fallos.append(u'sale esTop=True y con $5,512 cae en la posicion 109 de 142')
    if v.get('mrr') not in (5512, 5512.0, '5512'):
        fallos.append(u'el motor lee un MRR distinto de 5,512: %s' % v.get('mrr'))
    hall = ver.get('hallazgos') or []
    print(u'\n  HALLAZGOS QUE ABRE EL MOTOR (%d) — se LEEN, no se cuentan:' % len(hall))
    for h in hall:
        print(u'    · %s' % (h if isinstance(h, str) else json.dumps(h, ensure_ascii=False))[:300])

# CONTROL NEGATIVO 3: la nota dice CERO minutos. Si el motor publica un
# porcentaje de uso distinto de cero, uno de los dos miente.
texto_h = u' '.join(h if isinstance(h, str) else json.dumps(h, ensure_ascii=False)
                    for h in hall)
pcts = [p for p in re.findall(r'(\d+(?:\.\d+)?)\s*%', texto_h)
        if float(p) not in (0.0, 100.0)]
if pcts:
    print(u'\n  (!) el motor publica porcentajes en sus hallazgos: %s' % u', '.join(pcts))
    print(u'      La nota afirma CERO minutos consumidos en los dos cortes.')
    print(u'      Hay que LEER de que es cada porcentaje antes de darlo por bueno:')
    print(u'      si alguno es de consumo de voz, la nota esta mal y se corrige')
    print(u'      DENTRO del texto publicado, no en silencio.')

# ── 2. La ficha se pinta, y dice lo que tiene que decir ─────────────────────
st2, html = get('/cuentas/' + ID)
print(u'\n  /cuentas/%s -> HTTP %s · %d caracteres' % (ID, st2, len(html)))

ANCLAS = [
    (u'ISHOP MIXUP',        u'el nombre de la cuenta'),
    (u'C71',                u'el consecutivo'),
    (u'189819',             u'el CID'),
    (u'525598187427',       u'el unico DID, sin etiqueta'),
    (u'NO HA GASTADO UN MINUTO',
                            u'el dato que manda: cero consumo en los dos cortes'),
    (u'55 7583 9999',       u'el numero que ata esta cuenta con Tech People'),
    (u'todavia no arranca', u'el cierre de la lectura, en una frase'),
    (u'no se recibio respuesta',
                            u'la cita de la activacion: cerro sin validar parametros'),
    # Lo que aporto el registro de Zoho CRM. Si algo de esto no se pinta, el
    # expediente que ve Erick vuelve a ser el de antes de la correccion.
    (u'Liz Flores',         u'el unico interlocutor del expediente'),
    (u'Direccion y ellos',  u'que NO es quien decide, dicho con las palabras del CRM'),
    (u'CloudTalk',          u'contra quien se gano, y que llegamos referidos'),
    (u'UNA CUENTA INDEPENDIENTE',
                            u'la pregunta que la propia venta dejo abierta con Tech People'),
    (u'VEINTISEIS VECES',   u'el eco de CP 190196: mismo hueco, cuenta 26x mayor'),
]
print(u'\n  FRASES QUE TIENEN QUE SALIR EN LA FICHA SERVIDA:')
for frase, porque in ANCLAS:
    ok = frase in html
    if not ok:
        fallos.append(u'no sale en la ficha: «%s»' % frase)
    print(u'    %s«%s» — %s' % (u'ok   ' if ok else u'*** FALTA *** ', frase, porque))

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
          'contacto_nombre,contacto_cargo,contacto_tel,contacto_email,contactos_json'
          '&consecutivo=eq.C71',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
with urllib.request.urlopen(r, timeout=90) as x:
    fila = json.loads(x.read().decode('utf-8', 'replace'))
if len(fila) != 1:
    fallos.append(u'C71 aparece %d veces en `cuentas`, no una' % len(fila))
else:
    f = fila[0]
    print(u'\n  LA FILA: %s · %s · %s · %s · $%s'
          % (f['consecutivo'], f['empresa'], f['asesor'], f['estado'], f['facturacion']))
    if f['asesor'] != 'Erick':
        fallos.append(u'el asesor no es Erick: %s' % f['asesor'])
    if str(f['cid']) != CID:
        fallos.append(u'el CID no es %s: %s' % (CID, f['cid']))
    # CONTROL NEGATIVO 2 — el interlocutor es el de Zoho, y SOLO ese.
    # Positivo: Liz Flores con su correo y su telefono, tal como vienen en el
    # registro de la oportunidad CP 189819.
    ESPERADO = {
        'contacto_nombre': u'Liz Flores',
        'contacto_tel':    u'5951219350',
        'contacto_email':  u'lizbeth.flores@mixup.com',
    }
    for k, v in sorted(ESPERADO.items()):
        if (f[k] or u'').strip() != v:
            fallos.append(u'`%s` deberia ser «%s» y trae «%s»' % (k, v, f[k]))
    # Negativo: los canales CORPORATIVOS de la ficha publica no pueden salir
    # como contacto de la cuenta. Se explican en `notas`; ahi si pueden estar.
    CORPORATIVOS = (u'arco@mixup.com', u'alejandra.chavez@mixup.com',
                    u'800 006 4987', u'8000064987')
    campos = u' '.join(
        f[k] if isinstance(f[k], str) else json.dumps(f[k], ensure_ascii=False)
        for k in ('contacto_nombre', 'contacto_cargo', 'contacto_tel',
                  'contacto_email', 'contactos_json') if f[k])
    colados = [c for c in CORPORATIVOS if c.replace(u' ', u'') in campos.replace(u' ', u'')]
    if colados:
        fallos.append(u'un canal CORPORATIVO esta publicado como contacto de la '
                      u'cuenta: %s' % u', '.join(colados))
    # Y uno solo: si aparecen dos entradas, alguien agrego un interlocutor que
    # Zoho no trae.
    cj = f['contactos_json'] or []
    if len(cj) != 1:
        fallos.append(u'`contactos_json` trae %d entradas y Zoho solo registra una '
                      u'(Liz Flores)' % len(cj))
    print(u'    contacto: %s · %s · %s   (%d en contactos_json)'
          % (f['contacto_nombre'], f['contacto_tel'], f['contacto_email'], len(cj)))

print(u'\n  ' + u'-' * 68)
if fallos:
    print(u'  %d FALLO(S):' % len(fallos))
    for x in fallos:
        print(u'    *** %s' % x)
    raise SystemExit(1)
print(u'  El alta de C71 esta en la base, el motor la ve y la ficha la pinta.')
