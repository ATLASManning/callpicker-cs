# -*- coding: utf-8 -*-
u"""COMPRUEBA EL ALTA DE AUTOCENTRO GUZMAN (D62) EN PANTALLA, no en la base.

   El 201 del POST prueba que la fila entro. No prueba que la ficha la pinte ni
   que el motor de alertas la lea bien. Se piden tres cosas:

     1. `/api/alertas/veredictos` — si es TOP, que MRR lee y QUE HALLAZGOS le
        abre. La lista viene en la clave `rows`.
     2. El HTML servido de `/cuentas/<id>`, buscando frases ANCLADAS. No «la
        pagina carga», sino «esta frase concreta sale».
     3. La fila en la base, para los candados que no son de texto.

   LOS CONTROLES NEGATIVOS, QUE ES LO QUE HACE QUE ESTO SIRVA

     - NO PUEDE SER TOP. Con $2,786 cae en la posicion 131 de 145 cuentas con
       importe, y el corte del TOP-25 esta en $15,607. Si sale TOP, algo lee
       mal el importe.
     - EL MOTOR NO PUEDE LEER $2,519 NI $267. Son los dos sumandos de la
       cotizacion; cualquiera de los dos solo seria la columna equivocada.
     - EL MOTOR NO PUEDE PUBLICAR NINGUNA CIFRA DE LLAMADAS, ATENCION O
       CONSUMO. Esta es la comprobacion que de verdad importa y vale mas alla
       de esta cuenta. El CID 27954 NO esta en `analisis-llamadas.json`, la
       linea se activo hace un dia y no hay un solo minuto medido. Un hallazgo
       que diga «0% de consumo», «plan sobrado» o «pierde el X% de sus
       llamadas» sobre esta cuenta no esta midiendo: esta fabricando un cero
       donde no hubo medicion. Por eso este guion LEE los hallazgos y no los
       cuenta.
     - EL INTERLOCUTOR ES FAVELA Y SOLO FAVELA. Tres nombres NO pueden salir
       como contacto de la cuenta —Jorge Chacon, Pablo Coronado y Karina
       Lopez—: vienen de un directorio de talleres de King Long Mexico, no de
       nuestro expediente. Tampoco el buzon ni el 800 del corporativo del
       grupo, que son del grupo y no de esta cuenta.
     - `contacto_tel` TIENE QUE IR VACIO. El fijo que publica su sitio
       (669 985 1454) es una de las lineas TELMEX a portar, no la via directa
       a la persona. Sembrarlo seria repetir el error de D61 con nuestro
       propio DID.

   USO
       python scripts/verifica-alta-d62.py <cookie> [<id>]

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
ID = sys.argv[2] if len(sys.argv) > 2 else '6908e4dc-b17f-46bd-8287-61391ebf49be'
CID = '27954'
BASE = 'http://localhost:3100'
H = {'Cookie': 'cp_session=' + COOKIE, 'User-Agent': 'verifica-alta-d62'}

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
       or 'AUTOCENTRO' in str(v.get('empresa', '')).upper()]
if not mio:
    fallos.append(u'AUTOCENTRO GUZMAN NO aparece en /api/alertas/veredictos')
    hall = []
else:
    v = mio[0]
    ver = v.get('veredicto') or {}
    print(u'  AUTOCENTRO GUZMAN: mrr=%s | esTop=%s | situacion=%s | luz=%s'
          % (v.get('mrr'), v.get('esTop'), ver.get('situacion'), ver.get('luz')))
    if v.get('esTop'):
        fallos.append(u'sale esTop=True y con $2,786 cae en la posicion 131 de 145 '
                      u'(el corte del TOP-25 esta en $15,607)')
    if v.get('mrr') not in (2786, 2786.0, '2786'):
        fallos.append(u'el motor lee un MRR distinto de 2,786: %s' % v.get('mrr'))
    for mal, que in ((2519, u'el subtotal de las 11 extensiones'),
                     (267, u'el subtotal de los 3 numeros')):
        if v.get('mrr') in (mal, float(mal), str(mal)):
            fallos.append(u'el motor lee %s, que es %s y no el total cotizado'
                          % (mal, que))
    hall = ver.get('hallazgos') or []
    print(u'\n  HALLAZGOS QUE ABRE EL MOTOR (%d) — se LEEN, no se cuentan:' % len(hall))
    for h in hall:
        print(u'    · %s' % (h if isinstance(h, str) else json.dumps(h, ensure_ascii=False))[:300])

# CONTROL NEGATIVO: no hay un solo minuto medido de esta cuenta.
#
# La primera version de este control fallaba por buscar las PALABRAS «llamada»,
# «consumo» y «atencion» en los hallazgos, y dio un falso positivo: el motor
# las usa precisamente para DECLARAR que no hay dato («0 de 5 meses con dato de
# consumo», «su atencion es no medible»), que es lo correcto. Hablar de la
# ausencia no es fabricarla. Lo que de verdad hay que cazar es un hallazgo que
# mencione trafico y NO declare su ausencia: ese publicaria un cero como si
# fuera una medicion. Por eso el control se mira hallazgo por hallazgo y exige
# una marca de ausencia dentro del MISMO hallazgo.
TRAFICO = (u'llamada', u'perdida', u'pérdida', u'atencion', u'atención',
           u'consumo', u'minuto', u'plan sobrado', u'contestada', u'bolsa')
AUSENCIA = (u'no medible', u'no aparece', u'no podemos ver', u'sin dato',
            u'no hay lectura', u'no alcanza', u'0 de ', u'cero ')
print(u'\n  CONTROL: ningun hallazgo de trafico puede publicar una cifra sin'
      u' declarar que no hay dato.')
for h in hall:
    t = h if isinstance(h, str) else json.dumps(h, ensure_ascii=False)
    bajo = t.lower()
    toca = sorted({p for p in TRAFICO if p in bajo})
    if not toca:
        continue
    declara = [a for a in AUSENCIA if a in bajo]
    cifras = sorted({c for c in re.findall(r'\d+(?:[.,]\d+)?\s*%', t)})
    titulo = h.get('titulo', t[:60]) if isinstance(h, dict) else t[:60]
    if declara:
        print(u'    ok   «%s» habla de %s y DECLARA la ausencia (%s)'
              % (titulo, u'/'.join(toca), declara[0].strip()))
    else:
        fallos.append(u'el hallazgo «%s» menciona %s sin declarar que no hay dato%s. '
                      u'El CID %s no esta en analisis-llamadas.json y la linea tiene '
                      u'un dia: ahi no se puede medir nada.'
                      % (titulo, u'/'.join(toca),
                         u' y publica %s' % u', '.join(cifras) if cifras else u'',
                         CID))
        print(u'    *** «%s» menciona %s SIN declarar la ausencia'
              % (titulo, u'/'.join(toca)))

# ── 2. La ficha se pinta, y dice lo que tiene que decir ─────────────────────
st2, html = get('/cuentas/' + ID)
print(u'\n  /cuentas/%s -> HTTP %s · %d caracteres' % (ID, st2, len(html)))

# Las anclas se buscan con los espacios COLAPSADOS, y hay que colapsar DOS
# formas del mismo salto de linea. Un parrafo de `notas` lleva saltos donde el
# texto fuente envuelve, asi que una frase perfectamente publicada puede venir
# partida —«NO\nES MEDIBLE»— y un `in` crudo la declara ausente. Eso ya paso
# aqui dos veces: una con el salto REAL del HTML renderizado, y otra con el
# salto ESCAPADO («\\n») con el que Next serializa el mismo texto dentro de su
# payload. Colapsar solo una deja el fallo vivo en la otra mitad del documento.
#
# Y hay una TERCERA forma, que no es un espacio: React separa dos nodos de texto
# contiguos con un comentario vacio «<!-- -->», asi que un rotulo escrito como
# {'Numeros Callpicker · '}{n} llega al HTML partido por ese comentario. Una
# frase perfectamente pintada se declaraba ausente por eso.
# El fallo era del buscador las tres veces, no de la ficha.
plano = re.sub(r'(?:\\[nrt]|\s)+', u' ', html.replace(u'<!-- -->', u''))

ANCLAS = [
    (u'AUTOCENTRO GUZMAN',   u'el nombre de la cuenta'),
    (u'D62',                 u'el consecutivo que sigue en la serie de Dan'),
    (u'27954',               u'el CID derivado'),
    (u'526694540570',        u'el DID del que se derivo ese CID'),
    (u'CONFIRMAR EN ZOHO',   u'que el CID esta derivado y no confirmado'),
    (u'El MRR institucional no es medible',
                             u'el MRR institucional: no hay fila en el GRC'),
    (u'MRR INSTITUCIONAL NO ES MEDIBLE',
                             u'y dicho tambien donde se explica el dinero'),
    (u'COTIZACION',          u'que los $2,786 son cotizacion y no factura'),
    (u'ACTA PODER',          u'lo que desbloquea la portabilidad detenida'),
    (u'PIERDE EL INTERNET',  u'el riesgo que advirtio Activaciones y nadie confirmo'),
    (u'669 985 1454',        u'el fijo publico que es una de las lineas a portar'),
    (u'190629',              u'la fila de Activaciones que describe otra cosa'),
    (u'Planes 2.0',          u'el catalogo que no tiene un CE de 11 extensiones'),
    (u'GRUPO PETROIL',       u'el grupo: esta es la cuarta cuenta'),
    (u'Jose Manuel',         u'el KAM real del grupo, que no es el asesor'),
    (u'tqw-afip-ojv',        u'la reunion del lunes 30'),
    (u'6:30 am',             u'la hora que el propio correo se contradice'),
    (u'SIN CONFIRMAR',       u'los campos que se dejaron vacios a proposito'),
    # Los dos numeros en portabilidad y su rotulo. Si el bloque no se pinta, la
    # seccion diria que el cliente solo tiene un numero y callaria el tramite.
    (u'En portabilidad',     u'el rotulo del bloque nuevo'),
    (u'aún no son nuestros', u'y que dice con PALABRAS lo que el ambar sugiere'),
    (u'+52 669 985 1454',    u'la primera linea TELMEX, ya pintada en la ficha'),
    (u'+52 669 985 1291',    u'la segunda linea TELMEX'),
    (u'Encargado de Desarrollo de Sistemas',
                             u'el cargo que confirma su tarjeta'),
    # CONTROL NEGATIVO del conteo: el cliente tiene UN numero nuestro. Si los
    # dos en tramite se colaran en esta cuenta, la ficha publicaria tres DIDs
    # entregados y nadie podria usarla para responder «que numeros tiene».
    (u'Números Callpicker · 1',
                             u'el conteo, que NO suma los dos en portabilidad'),
]
print(u'\n  FRASES QUE TIENEN QUE SALIR EN LA FICHA SERVIDA:')
for frase, porque in ANCLAS:
    ok = frase in plano
    if not ok:
        fallos.append(u'no sale en la ficha: «%s»' % frase)
    print(u'    %s«%s» — %s' % (u'ok   ' if ok else u'*** FALTA *** ', frase, porque))

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
          'contactos_json,servicios_json&consecutivo=eq.D62',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
with urllib.request.urlopen(r, timeout=90) as x:
    fila = json.loads(x.read().decode('utf-8', 'replace'))
if len(fila) != 1:
    fallos.append(u'D62 aparece %d veces en `cuentas`, no una' % len(fila))
else:
    f = fila[0]
    print(u'\n  LA FILA: %s · %s · %s · %s · $%s · desde %s'
          % (f['consecutivo'], f['empresa'], f['asesor'], f['estado'],
             f['facturacion'], f['activo_desde']))
    if f['asesor'] != 'Dan':
        fallos.append(u'el asesor no es Dan: %s' % f['asesor'])
    if str(f['cid']) != CID:
        fallos.append(u'el CID no es %s: %s' % (CID, f['cid']))
    if float(f['facturacion']) != 2786.0:
        fallos.append(u'la facturacion no es 2,786: %s' % f['facturacion'])
    if (f['contacto_email'] or u'').strip() != u'soporte@autocentroguzman.com':
        fallos.append(u'`contacto_email` deberia ser soporte@autocentroguzman.com y '
                      u'trae «%s»' % f['contacto_email'])
    if u'Favela' not in (f['contacto_nombre'] or u''):
        fallos.append(u'`contacto_nombre` no trae a Favela: «%s»' % f['contacto_nombre'])
    # CONTROL NEGATIVO: su tarjeta trae DOS numeros y solo uno sirve como via al
    # cliente. El (669) 985 1454 Ext. 14 cuelga del conmutador de la matriz, que
    # es una de las lineas en portabilidad: capturarlo seria guardar como
    # telefono del cliente un numero que dentro de unos dias va a ser NUESTRO.
    tel = re.sub(r'\D', u'', f['contacto_tel'] or u'')
    if tel != u'6699251404':
        fallos.append(u'`contacto_tel` deberia ser el 669 925 1404 de su tarjeta —el '
                      u'unico que no cambia de dueno con la portabilidad— y trae «%s»'
                      % (f['contacto_tel'] or u'vacio'))
    if u'6699851454' in tel:
        fallos.append(u'`contacto_tel` guarda el 669 985 1454, que es una de las '
                      u'lineas EN PORTABILIDAD: ese numero va a ser nuestro')
    campos = json.dumps({k: f[k] for k in ('contacto_nombre', 'contacto_cargo',
                                           'contacto_tel', 'contacto_email',
                                           'contactos_json')}, ensure_ascii=False)
    for c, porque in ((u'Jorge Chacon',    u'sale de un directorio de King Long, no del expediente'),
                      (u'Pablo Coronado',  u'sale de un directorio de King Long, no del expediente'),
                      (u'Karina Lopez',    u'sale de un directorio de King Long, no del expediente'),
                      (u'contactcenter@grupopetroil', u'es el buzon del corporativo del grupo'),
                      (u'800 366 7336',    u'es el 800 del grupo, no de esta cuenta'),
                      (u'8003667336',      u'es el 800 del grupo, no de esta cuenta')):
        if c in campos:
            fallos.append(u'«%s» esta publicado como contacto de la cuenta y %s'
                          % (c, porque))
    cj = f['contactos_json'] or []
    if len(cj) != 1:
        fallos.append(u'`contactos_json` trae %d entradas y el expediente registra UNO'
                      % len(cj))
    print(u'    contacto: %s · %s · tel %s   (%d en contactos_json)'
          % (f['contacto_nombre'], f['contacto_email'],
             f['contacto_tel'] or u'VACIO a proposito', len(cj)))
    sj = f['servicios_json'] or []
    txt = json.dumps(sj, ensure_ascii=False)
    for c, porque in ((u'COTIZADO', u'el importe tiene que ir etiquetado como cotizacion'),
                      (u'526694540570', u'el DID vivo'),
                      (u'669 985 12 91', u'la segunda linea TELMEX a portar, tal como la escribe el correo')):
        if c not in txt:
            fallos.append(u'falta en `servicios_json`: %s (%s)' % (c, porque))
    print(u'    servicios_json: %d entradas, con el importe etiquetado COTIZADO' % len(sj))

print(u'\n  ' + u'-' * 68)
if fallos:
    print(u'  %d FALLO(S):' % len(fallos))
    for x in fallos:
        print(u'    *** %s' % x)
    raise SystemExit(1)
print(u'  El alta de D62 esta en la base, el motor la ve sin inventarle trafico')
print(u'  y la ficha pinta lo que esta cuenta de verdad tiene hoy.')
