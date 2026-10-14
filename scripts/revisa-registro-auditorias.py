# -*- coding: utf-8 -*-
u"""¿Cada auditoria esta colgada de la cuenta de la que habla?

   POR QUE EXISTE
   --------------
   El 13 oct 2026, reordenando el TOP 50, salio que `ancona-autopartes` estaba
   registrada en el consecutivo **F24**, que es CBS Compresores. El expediente
   declara dentro «VIP · CID 24924», y ese CID es **F4, Ancona Autopartes**. Una
   transposicion: F4 -> F24.

   Lo que eso produce no es un enlace roto, es algo peor en las dos direcciones:

     · la ficha de CBS Compresores enseña un boton «Auditoria» que abre el
       expediente CONFIDENCIAL de OTRO cliente;
     · y Ancona, que es de quien habla el expediente, no tiene boton — asi que
       su asesor cree que no tiene auditoria y podria volver a escribirla.

   `revisa-casos-auditoria.py` no lo veia, y hace bien: comprueba que cada caso
   este COMPLETO y REGISTRADO. Nadie comprobaba que estuviera registrado en la
   cuenta CORRECTA. Son dos preguntas distintas y hacian falta las dos.

   COMO LO DECIDE, Y QUE NO HACE
   -----------------------------
   **Por CID, nunca por nombre.** Casi todos los expedientes declaran el CID del
   cliente en su prosa; ese CID se resuelve contra `cuentas` y se compara con el
   consecutivo del registro. Es exacto y no opina.

   Cuando un expediente NO declara CID, este guion **no adivina**: lo reporta
   aparte para que alguien lo lea. Cruzar por nombre es justo lo que ya mezclo
   cuentas en este repo mas de una vez, y un detector que resuelve a lo probable
   acaba proponiendo cambios falsos con cara de certeza.
   Ver [[dids-fuente]] y [[feedback-verificar-antes-asegurar]].

   Tampoco toca nada: imprime el cambio y se detiene con codigo 1.

   USO
       python scripts/revisa-registro-auditorias.py
       python scripts/revisa-registro-auditorias.py --autoprueba
"""
import io
import os
import re
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(RAIZ, 'app', 'auditoria')

# Un CID del repo son 4-6 digitos. Se exige la palabra «CID» delante para no
# recoger cualquier numero suelto de la prosa —hay miles— y se toman TODOS los
# que aparezcan: un expediente puede nombrar el CID de un vecino al explicar
# por que no es el suyo.
RE_CID = re.compile(r'\bCID\s*:?\s*(\d{4,6})\b')


def cids_declarados(texto):
    return [m.group(1) for m in RE_CID.finditer(texto)]


# Los campos donde un expediente dice DE QUIEN habla. Un CID aqui es el sujeto;
# un CID en mitad de la prosa puede ser el de un vecino.
#
# `resumen_ejecutivo` SE CAYO DE ESTA LISTA EL 14 OCT 2026, y es la correccion
# que mas importa de este archivo. No es un campo de identidad: es PROSA, y en
# este repo son miles de caracteres que comparan la cuenta con sus vecinas.
# `torres-corzo` acuso en falso justamente por eso. Su resumen dice «El CID
# central, 130723» —que el regex NO recoge, porque lleva «central,» en medio— y
# nombra «el CID 164410 con 2.75x» para decir que ese OTRO es el que dobló. El
# unico CID que el regex encontraba en el resumen era el del vecino, asi que la
# rama (a) devolvia 164410 = C18 Gigacable y el detector pedia mover el
# expediente de GTC a la ficha de otro cliente. Aplicar ese «arreglo» habria
# roto un registro correcto y ensenado un expediente CONFIDENCIAL a quien no es.
#
# Los tres que quedan son autopresentaciones de una linea; el resumen es un
# ensayo. La diferencia no es de grado: en una linea no caben los vecinos.
RE_IDENTIDAD = re.compile(
    r"(?:tipo_cliente|descripcion_contexto|nombre)\s*:\s*'((?:[^'\\]|\\.)*)'")


def cid_sujeto(texto):
    u"""El CID del que habla el expediente, o None si no se puede afirmar.

       MI PRIMERA VERSION TOMABA «EL CID QUE MAS SE REPITE» Y ACUSO EN FALSO.
       `rds-invest-vacay` nombra UN solo CID, el 178011, y lo nombra justo para
       decir lo contrario de lo que yo deduje: «Grupo Sofia (F66, CID 178011) —
       sin consecutivo propio en cartera». O sea que el expediente explicaba su
       pertenencia a otra cuenta y el detector lo leyo como su identidad, y
       propuso moverlo a la ficha de Sofia. Aplicar ese «arreglo» habria roto
       un registro que estaba bien.

       Una mencion no es una identidad. Para afirmar que un CID es el sujeto
       hace falta UNA de dos cosas, y si no hay ninguna se dice que no se sabe:

         (a) que aparezca en un campo de IDENTIDAD —`tipo_cliente`, `nombre`,
             `descripcion_contexto`, `resumen_ejecutivo`—, que es donde un
             expediente se presenta; o
         (b) que domine de forma clara: tres menciones o mas, y al menos el
             doble que cualquier otro CID del archivo.

       Un detector que propone cambios falsos con cara de certeza es peor que
       uno que calla: el primero rompe cosas que estaban bien.
    """
    todos = cids_declarados(texto)
    if not todos:
        return None
    # (a) identidad declarada. Un campo que nombra DOS CIDs distintos no
    #     resuelve nada —esta comparando, no presentandose—, asi que se salta y
    #     se sigue buscando. Afirmar con el primero seria elegir a cara o cruz.
    for m in RE_IDENTIDAD.finditer(texto):
        enc = cids_declarados(m.group(1))
        if len(set(enc)) == 1:
            return enc[0]
    # (b) dominio claro
    frec = {}
    for x in todos:
        frec[x] = frec.get(x, 0) + 1
    orden = sorted(frec.items(), key=lambda p: -p[1])
    mejor, n = orden[0]
    segundo = orden[1][1] if len(orden) > 1 else 0
    if n >= 3 and n >= 2 * max(segundo, 1):
        return mejor
    return None


if '--autoprueba' in sys.argv:
    print(u'  DEBE SACAR EL CID DE LA FORMA EN QUE SE ESCRIBE AQUI:')
    casos = [(u'tipo_cliente: «VIP · CID 24924 · Cadena 14 sucursales»', [u'24924']),
             (u'Ancona Autopartes (CID 24924), cadena de refaccionarias', [u'24924']),
             (u'GRUPO TORRES CORZO (D1 · CID 130723) — la cuenta MAYOR', [u'130723']),
             (u'el CID: 164410 doblo su volumen', [u'164410']),
             (u'su CID 146201 no aparece en el archivo de cortes', [u'146201'])]
    fallos = []
    for txt, esp in casos:
        got = cids_declarados(txt)
        ok = got == esp
        if not ok:
            fallos.append(u'%r -> %r, esperaba %r' % (txt[:40], got, esp))
        print(u'    %-56s %s' % (txt[:56], u'OK' if ok else u'** %r' % got))
    print(u'\n  NO DEBE RECOGER NUMEROS QUE NO SON CID:')
    for txt in (u'24,341 de 43,860 entrantes sin contestar',
                u'son 1,200 empleados y 32 oficinas',
                u'el folio 106428 lleva 155 dias'):
        got = cids_declarados(txt)
        ok = not got
        if not ok:
            fallos.append(u'recoge de mas en %r: %r' % (txt[:40], got))
        print(u'    %-56s %s' % (txt[:56], u'intacto' if ok else u'** %r' % got))
    print(u'\n  DEBE AFIRMAR LA IDENTIDAD SOLO CUANDO SE PUEDE:')
    # El caso real que me hizo acusar en falso, y su contrario.
    rds = (u"  { label: 'Pertenencia', value: 'Grupo Sofia (F66, CID 178011) "
           u"— sin consecutivo propio en cartera' },")
    ancona = (u"  nombre: 'Ancona Autopartes',\n"
              u"  tipo_cliente: 'VIP · CID 24924 · Cadena 14 sucursales',\n"
              u"  resumen_ejecutivo: 'Ancona Autopartes (CID 24924), cadena…',")
    vecino3 = (u"  nota: 'el CID 164410 doblo su volumen; el CID 164410 mantuvo "
               u"su tasa; comparado con el CID 164410 otra vez',")
    # EL CASO QUE ACUSO EN FALSO (14 oct 2026). El resumen ejecutivo nombra al
    # VECINO para contrastarlo —«doblaron dos: el 164410 y Torres Corzo»— y el
    # CID propio aparece ahi como «El CID central, 130723», que el regex no
    # recoge. Mientras `resumen_ejecutivo` conto como campo de identidad, esto
    # devolvia 164410 y el detector pedia mover el expediente a otra ficha.
    gtc = (u"/** GRUPO TORRES CORZO (D1 · CID 130723) — la cuenta mayor */\n"
           u"  nombre: 'Grupo Torres Corzo',\n"
           u"  resumen_ejecutivo: 'Doblaron DOS: el CID 164410 con 2.75x y "
           u"Torres Corzo con 2.21x. El CID central, 130723, desaparecio.',\n"
           u"  hallazgos: ['los 386 DIDs del CID 130723 traen plazas', "
           u"'el 17.2% del CID 164410 es otra cosa', "
           u"'llamadas del CID 130723 en la entrega oct-2026', "
           u"'fuente: CID 130723'],")
    # Un campo de identidad que nombra DOS CIDs no resuelve: compara.
    ambiguo = (u"  tipo_cliente: 'Enterprise · CID 24924, antes CID 164410',\n"
               u"  nombre: 'Caso ambiguo',")
    for etq, txt, esp in (
            (u'una sola mencion, y es de OTRO  -> no se afirma', rds, None),
            (u'declarado en tipo_cliente       -> si se afirma', ancona, u'24924'),
            (u'repetido 3 veces sin rival      -> si se afirma', vecino3, u'164410'),
            (u'el resumen nombra al VECINO     -> gana el propio', gtc, u'130723'),
            (u'identidad con DOS cids          -> no se afirma', ambiguo, None)):
        got = cid_sujeto(txt)
        ok = got == esp
        if not ok:
            fallos.append(u'%s -> %r, esperaba %r' % (etq, got, esp))
        print(u'    %-50s %s' % (etq, u'OK' if ok else u'** devolvio %r' % got))

    # Y el archivo REAL, que es de donde salio el fallo. Una cadena fabricada
    # se puede escribir para que pase; el expediente de verdad, no.
    print(u'\n  EL EXPEDIENTE REAL QUE ACUSO EN FALSO:')
    freal = os.path.join(AUD, 'torres-corzo-data.ts')
    if os.path.exists(freal):
        got = cid_sujeto(io.open(freal, encoding='utf-8').read())
        ok = got == u'130723'
        if not ok:
            fallos.append(u'torres-corzo-data.ts -> %r, esperaba 130723' % got)
        print(u'    %-50s %s' % (u'torres-corzo-data.ts -> D1 (CID 130723)',
                                 u'OK' if ok else u'** devolvio %r' % got))
    else:
        fallos.append(u'no esta torres-corzo-data.ts: el caso no se comprobo')
        print(u'    ** no esta el archivo — el caso NO se comprobo')

    print(u'\n  %s' % (u'la autoprueba pasa entera' if not fallos
                       else u'*** FALLA:\n    - ' + u'\n    - '.join(fallos)))
    sys.exit(1 if fallos else 0)


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
r = urllib.request.Request(
    URL + '/rest/v1/cuentas?select=cid,consecutivo,empresa,asesor,estado&limit=1000',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
cuentas = json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))
por_cid = {}
for c in cuentas:
    k = str(c.get('cid') or '').strip()
    if k:
        por_cid.setdefault(k, []).append(c)
por_cons = {str(c.get('consecutivo') or '').strip().upper(): c for c in cuentas}

# El registro: id -> consecutivos
reg = io.open(os.path.join(AUD, 'registry.ts'), encoding='utf-8').read()
registro = {}
for m in re.finditer(r"id:\s*'([^']+)'[^}]*?consecutivos:\s*\[([^\]]*)\]", reg):
    registro[m.group(1)] = [x.upper() for x in re.findall(r"'([^']+)'", m.group(2))]

print(u'  %d auditoria(s) registradas · %d cuenta(s) en la cartera\n'
      % (len(registro), len(cuentas)))

malas, sin_cid, ok_n = [], [], 0
for caso_id, cons_reg in sorted(registro.items()):
    f = os.path.join(AUD, caso_id + '-data.ts')
    if not os.path.exists(f):
        # Los nombres de archivo no siempre calcan el id; se busca por contenido.
        cand = [x for x in os.listdir(AUD)
                if x.endswith('-data.ts')
                and ("id:     '%s'" % caso_id) in io.open(os.path.join(AUD, x), encoding='utf-8').read()]
        if not cand:
            cand = [x for x in os.listdir(AUD)
                    if x.endswith('-data.ts')
                    and ("'%s'" % caso_id) in io.open(os.path.join(AUD, x), encoding='utf-8').read()]
        if not cand:
            continue
        f = os.path.join(AUD, cand[0])
    txt = io.open(f, encoding='utf-8').read()
    suyo = cid_sujeto(txt)
    if not suyo:
        if cons_reg or RE_CID.search(txt):
            sin_cid.append((caso_id, cons_reg))
        continue
    duenos = por_cid.get(suyo, [])
    if not duenos:
        sin_cid.append((caso_id, cons_reg + [u'(CID %s no esta en cartera)' % suyo]))
        continue
    esperados = {str(d.get('consecutivo') or '').strip().upper() for d in duenos}
    if not cons_reg:
        # `consecutivos: []` es deliberado en las cuentas que nunca entraron a
        # la cartera. Pero si su CID SI esta, el vacio es un olvido.
        malas.append((caso_id, cons_reg, sorted(esperados), suyo, duenos[0], u'vacio y SI tiene cuenta'))
    elif not (set(cons_reg) & esperados):
        malas.append((caso_id, cons_reg, sorted(esperados), suyo, duenos[0], u'apunta a otra cuenta'))
    else:
        ok_n += 1

print(u'  ══ CRUZADAS POR CID ═══════════════════════════════════════')
print(u'  %d coinciden · %d NO coinciden' % (ok_n, len(malas)))

if malas:
    print(u'\n  *** EL REGISTRO APUNTA A LA CUENTA EQUIVOCADA ***')
    print(u'  Una auditoria colgada de otra cuenta enseña un expediente')
    print(u'  CONFIDENCIAL en la ficha de un cliente que no es, y deja al')
    print(u'  verdadero sin boton — como si no tuviera auditoria.\n')
    for caso, reg_c, esp, cid, d, motivo in malas:
        print(u'  %s   (%s)' % (caso, motivo))
        print(u'      declara CID %s = %s · %s · %s'
              % (cid, esp[0] if esp else u'?', d.get('empresa'), d.get('asesor')))
        for k in reg_c:
            otra = por_cons.get(k)
            print(u'      registrado en %-6s = %s'
                  % (k, (otra.get('empresa') if otra else u'(no existe esa cuenta)')))
        print(u'      ARREGLO: consecutivos: [%s]'
              % u', '.join(u"'%s'" % e for e in esp))

if sin_cid:
    print(u'\n  ══ NO DECLARAN CID · %d ═══════════════════════════════════' % len(sin_cid))
    print(u'  No se comprueban solas y NO se adivinan por nombre. Hay que')
    print(u'  leerlas si alguna vez se sospecha de su registro.')
    for caso, cons_reg in sin_cid:
        print(u'    %-28s registrada en %s' % (caso, u', '.join(cons_reg) or u'(ninguna)'))

sys.exit(1 if malas else 0)
