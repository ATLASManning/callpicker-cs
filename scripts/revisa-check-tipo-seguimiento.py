# -*- coding: utf-8 -*-
u"""¿Admite la base TODOS los tipos de seguimiento que el codigo ofrece hoy?

   POR QUE EXISTE
   --------------
   El 2 nov 2026 se añadio `solicitud_cancelacion` al combo de «Seguimiento
   KAM». Si la columna `seguimientos.tipo` llevara un CHECK con la lista vieja,
   el combo ofreceria la opcion, el asesor la elegiria, y el POST moriria con un
   500 que en pantalla se ve como «no se guardo, vuelve a intentar» — o peor, se
   perderia en silencio. Ya paso con el CHECK de `alertas_episodios`, dos veces,
   y el guion hermano de esto es `revisa-check-condicion-vivo.py`.

   No hay forma de LEER un CHECK desde PostgREST: se prueba metiendole cada
   tipo y mirando cual rechaza. La fila de prueba se borra despues.

   LOS TIPOS SE LEEN DEL CODIGO, no se teclean aqui. El dia que alguien añada
   el decimo, se comprueba solo. Un espejo escrito a mano deja de ser espejo.

   Tambien se prueba `resultado`, porque la solicitud de cancelacion trae sus
   propios resultados (`retenida`, `downgrade_negociado`…) y esa columna podria
   llevar su propio CHECK.

   Credenciales de `.env.local`, y NO se imprimen.

   USO
       python scripts/revisa-check-tipo-seguimiento.py
"""
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** faltan credenciales'); sys.exit(2)

CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY,
       'Content-Type': 'application/json', 'Prefer': 'return=representation'}
SOLO_LEER = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}

MARCA = u'PRUEBA_CHECK_TIPO_SEGUIMIENTO'


def sin_comentarios(s):
    s = re.sub(r'/\*[\s\S]*?\*/', ' ', s)
    return re.sub(r'//[^\n]*', ' ', s)


# ── Los tipos, leidos del tipo de TypeScript ────────────────────────────────
src_tipos = io.open(os.path.join(RAIZ, 'lib', 'types.ts'), encoding='utf-8').read()
m = re.search(r'export type TipoSeguimiento\s*=([\s\S]*?)(?=\nexport )', src_tipos)
if not m:
    print(u'  *** no encuentro `export type TipoSeguimiento` en lib/types.ts')
    sys.exit(2)
DECLARADOS = sorted(set(re.findall(r"'([a-z_]+)'", sin_comentarios(m.group(1)))))

# ── Y los que el combo OFRECE de verdad ─────────────────────────────────────
# Lo que importa no es el tipo de TS sino lo que el asesor puede elegir: si el
# catalogo ofreciera algo que el tipo no declara, el combo lo manda igual.
cat = os.path.join(RAIZ, 'lib', 'seguimiento-tipos.ts')
OFRECIDOS = []
if os.path.exists(cat):
    src_cat = sin_comentarios(io.open(cat, encoding='utf-8').read())
    mt = re.search(r'TIPOS_SEGUIMIENTO[^=]*=([\s\S]*?)\n\]', src_cat)
    if mt:
        OFRECIDOS = sorted(set(re.findall(r"value:\s*'([a-z_]+)'", mt.group(1))))
    # LOS RESULTADOS SE LEEN DE LAS LISTAS, NO DEL MAPA. La primera version
    # miraba `RESULTADOS_POR_TIPO`, que no contiene cadenas sino referencias a
    # las constantes (`{ solicitud_cancelacion: RESULTADOS_CANCELACION }`): la
    # busqueda de `'...'` volvia vacia, la seccion entera se saltaba — y el
    # guion no decia que no la habia probado. Un verificador que calla lo que
    # no miro es el mismo fallo de [[feedback-verificar-antes-asegurar]].
    RESULTADOS = sorted(set(
        v for bloque in re.findall(r'const RESULTADOS_[A-Z_]+[^=]*=\s*\[([\s\S]*?)\]', src_cat)
        for v in re.findall(r"'([a-z_]+)'", bloque)
    ))
else:
    RESULTADOS = []

if not OFRECIDOS:
    print(u'  *** no pude leer el catalogo del combo (lib/seguimiento-tipos.ts).')
    print(u'      Sin el, esta prueba no significa nada: un verificador que')
    print(u'      concluye exito por defecto es peor que no tenerlo.')
    sys.exit(2)
if not RESULTADOS:
    print(u'  *** no pude leer ninguna lista de resultados del catalogo.')
    print(u'      `resultado` es la otra columna que puede llevar CHECK: sin')
    print(u'      esta lista la prueba se quedaria a medias y en silencio.')
    sys.exit(2)

TIPOS = sorted(set(DECLARADOS) | set(OFRECIDOS))
print(u'\n  el tipo de TS declara %d: %s' % (len(DECLARADOS), u', '.join(DECLARADOS)))
print(u'  el combo ofrece %d: %s' % (len(OFRECIDOS), u', '.join(OFRECIDOS)))
huerfanos = sorted(set(OFRECIDOS) - set(DECLARADOS))
if huerfanos:
    print(u'  ojo: el combo ofrece %s y el tipo no lo declara' % u', '.join(huerfanos))

# ── QUÉ TIPOS HAY GUARDADOS HOY ─────────────────────────────────────────────
# Un `ADD CONSTRAINT` VALIDA las filas vivas: si la tabla trae un tipo que la
# lista nueva no contempla, la sentencia falla al correrla —no al dia siguiente,
# pero igual de molesto— y hay que decidir que se hace con esos renglones. Asi
# que la migracion se escribe mirando esto, no de memoria.
try:
    r = urllib.request.Request(URL + '/rest/v1/seguimientos?select=tipo&limit=10000',
                               headers=SOLO_LEER)
    filas = json.loads(urllib.request.urlopen(r, timeout=60).read())
    cuenta_tipos = {}
    for f in filas:
        k = f.get('tipo')
        k = u'(nulo)' if k is None else unicode(k) if sys.version_info[0] < 3 else str(k)
        cuenta_tipos[k] = cuenta_tipos.get(k, 0) + 1
    print(u'\n  en la tabla hay %s seguimiento(s), con %d tipo(s) distinto(s):'
          % (format(len(filas), ',d'), len(cuenta_tipos)))
    for k in sorted(cuenta_tipos, key=lambda x: -cuenta_tipos[x]):
        aviso = u'' if k in TIPOS else u'   <-- NO esta en el catalogo del codigo'
        print(u'      %-24s %5d%s' % (k, cuenta_tipos[k], aviso))
    sueltos = sorted(k for k in cuenta_tipos if k not in TIPOS)
    if sueltos:
        print(u'      Esos %d tienen que entrar en la lista del CHECK o la'
              u' migracion falla.' % len(sueltos))
except Exception as e:
    print(u'\n  *** no pude leer los tipos guardados: %s' % e)
    print(u'      La migracion NO se escribe sin esto.')
    sys.exit(2)

# ── Una cuenta cualquiera para colgarle la fila de prueba ───────────────────
try:
    r = urllib.request.Request(URL + '/rest/v1/cuentas?select=id&limit=1', headers=SOLO_LEER)
    CUENTA = json.loads(urllib.request.urlopen(r, timeout=30).read())[0]['id']
except Exception as e:
    print(u'  *** no pude leer una cuenta de prueba: %s' % e); sys.exit(2)


def prueba(campo, valor, extra=None):
    u"""Inserta una fila con ese valor y devuelve (admitido, cuerpo_del_error)."""
    fila = {'cuenta_id': CUENTA, 'tipo': 'nota', 'descripcion': MARCA,
            'resultado': 'pendiente', 'asesor': MARCA, 'fecha': '2000-01-01'}
    fila[campo] = valor
    if extra:
        fila.update(extra)
    req = urllib.request.Request(URL + '/rest/v1/seguimientos',
                                 data=json.dumps([fila]).encode('utf-8'),
                                 headers=CAB, method='POST')
    try:
        creadas = json.loads(urllib.request.urlopen(req, timeout=30).read())
    except urllib.error.HTTPError as e:
        return False, e.read().decode('utf-8', 'replace')
    for f in creadas:
        d = urllib.request.Request(URL + '/rest/v1/seguimientos?id=eq.' + str(f['id']),
                                   headers=CAB, method='DELETE')
        urllib.request.urlopen(d, timeout=30).read()
    return True, ''


fallos = []
print(u'\n  %-24s %s' % (u'tipo', u'¿lo admite la columna?'))
print(u'  ' + u'─' * 60)
for t in TIPOS:
    ok, err = prueba('tipo', t)
    if ok:
        print(u'  %-24s ok' % t)
    else:
        print(u'  %-24s *** RECHAZADO' % t)
        # El NOMBRE del constraint es lo que hace falta para la migracion, y es
        # lo primero que se pierde si se recorta el cuerpo del error.
        try:
            j = json.loads(err)
            print(u'      %s · %s' % (j.get('code'), j.get('message')))
        except ValueError:
            print(u'      %s' % err.strip()[:300])
        fallos.append(('tipo', t))

if RESULTADOS:
    print(u'\n  %-24s %s' % (u'resultado', u'¿lo admite la columna?'))
    print(u'  ' + u'─' * 60)
    for v in RESULTADOS:
        ok, err = prueba('resultado', v)
        if ok:
            print(u'  %-24s ok' % v)
        else:
            print(u'  %-24s *** RECHAZADO' % v)
            try:
                j = json.loads(err)
                print(u'      %s · %s' % (j.get('code'), j.get('message')))
            except ValueError:
                print(u'      %s' % err.strip()[:300])
            fallos.append(('resultado', v))

# ── CONTROL NEGATIVO ────────────────────────────────────────────────────────
# Si la columna no tiene CHECK, TODO pasa — incluida una basura. Sin esta
# prueba, el verde de arriba no distingue «la base acepta el tipo nuevo» de
# «la base acepta cualquier cosa», y son dos noticias distintas: la segunda
# dice que la unica defensa del dato es el combo.
ok_basura, _ = prueba('tipo', 'esto_no_es_un_tipo_de_seguimiento')
print(u'')
if ok_basura:
    print(u'  SIN CHECK: la columna `tipo` acepta hasta '
          u'«esto_no_es_un_tipo_de_seguimiento».')
    print(u'  O sea que el tipo nuevo entra, pero el unico filtro es el combo:')
    print(u'  cualquier POST a /api/seguimientos puede escribir lo que quiera.')
else:
    print(u'  HAY CHECK: la columna rechaza un valor inventado, asi que los '
          u'«ok» de arriba')
    print(u'  son de verdad — la base los admite uno por uno.')

# ── Que no quede basura ─────────────────────────────────────────────────────
r = urllib.request.Request(
    URL + '/rest/v1/seguimientos?select=id&descripcion=eq.' + MARCA, headers=SOLO_LEER)
resto = json.loads(urllib.request.urlopen(r, timeout=30).read())
if resto:
    print(u'\n  *** quedaron %d fila(s) de prueba sin borrar. Borrando…' % len(resto))
    for f in resto:
        d = urllib.request.Request(URL + '/rest/v1/seguimientos?id=eq.' + str(f['id']),
                                   headers=CAB, method='DELETE')
        urllib.request.urlopen(d, timeout=30).read()
    print(u'      borradas.')
else:
    print(u'  no queda ninguna fila de prueba en la tabla.')

print(u'')
if fallos:
    print(u'  *** %d valor(es) que el codigo ofrece y la base RECHAZA:' % len(fallos))
    for campo, v in fallos:
        print(u'      %s = %s' % (campo, v))
    print(u'      Hasta ampliar el CHECK en Supabase, elegir esa opcion en el')
    print(u'      combo NO guarda nada.')
    sys.exit(1)
print(u'  la base admite todo lo que el combo ofrece.')
