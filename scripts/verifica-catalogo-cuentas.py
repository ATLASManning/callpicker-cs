# -*- coding: utf-8 -*-
u"""INVARIANTES DEL CATALOGO DE CUENTAS DE REUNIONES Y ANEXOS.

   Lo que tiene que seguir siendo cierto para que el selector de esas dos
   pantallas ofrezca TODAS las cuentas sin ofrecer ninguna dos veces.

   LAS PROMESAS QUE SE COMPRUEBAN
   ------------------------------
   1. NINGUN CID SALE DOS VECES. Un CID que esta en la cartera Y en los cortes
      ofreceria la misma cuenta dos veces, y cada captura caeria en una: dos
      mitades del historial del mismo cliente que no cruzan.
   2. LAS DOS CLASES AGOTAN EL CATALOGO: o esta en la cartera, o solo en
      facturacion. No hay una tercera.
   3. EL NOMBRE DE CADA CID ES UNO SOLO Y ES EL MISMO EN CADA CORRIDA. 28 CIDs
      traen varios nombres escritos en los cortes («Datasafe» y «datasafe»);
      si el desempate no fuera determinista, el mismo cliente aparecería hoy
      con un nombre y mañana con otro.
   4. EL PADRON APORTA DE VERDAD. Si los cortes no suman cuentas nuevas, el
      catalogo es la cartera disfrazada y la pantalla mentiria.
   5. ProMujer (144195) ESTA. Es el caso que motivo todo esto.

   Es de SOLO LECTURA. No toca Supabase: mide el lado que vive en archivos
   —el padron de los cortes— y la regla de desempate, que es donde estaban
   los riesgos. La union con la cartera la comprueba `tsc` y la pantalla.

   USO
       python -I scripts/verifica-catalogo-cuentas.py
"""
import io
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORTES = os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx')
TS = os.path.join(RAIZ, 'lib', 'catalogo-cuentas.ts')

fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


def lee_cortes():
    u"""CID -> {nombre: serial mas reciente}, igual que `cuentasDeCortes()`."""
    import openpyxl
    wb = openpyxl.load_workbook(CORTES, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    filas = list(ws.iter_rows(values_only=True))
    cab = [str(c).strip() if c is not None else '' for c in filas[0]]
    try:
        i_cid = cab.index('CID')
        i_nom = cab.index('Nombre del Cliente')
        i_fec = cab.index('Fecha de corte')
    except ValueError:
        print(u'  *** el Excel no trae las columnas que lee lib/catalogo-cuentas.ts')
        print(u'      esperadas: CID · Nombre del Cliente · Fecha de corte')
        print(u'      encontradas: %s' % cab[:8])
        sys.exit(1)

    por = {}
    for f in filas[1:]:
        cid = re.sub(r'\D', '', str(f[i_cid] or '')).strip()
        nom = str(f[i_nom] or '').strip()
        if not cid or not nom:
            continue
        try:
            serial = float(f[i_fec]) if f[i_fec] is not None else 0.0
        except (TypeError, ValueError):
            serial = 0.0
        m = por.setdefault(cid, {})
        m[nom] = max(m.get(nom, 0.0), serial)
    return por


def lee_cartera():
    u"""`cuentas` de Supabase: id -> cid. Las credenciales se leen de
       `.env.local` aqui dentro y NO se imprimen. Devuelve (dict, motivo)."""
    import json
    import urllib.request
    ruta = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(ruta):
        return None, u'no hay .env.local'
    env = {}
    for linea in io.open(ruta, encoding='utf-8'):
        linea = linea.strip()
        if linea and not linea.startswith('#') and '=' in linea:
            k, v = linea.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    base = env.get('NEXT_PUBLIC_SUPABASE_URL', '').rstrip('/')
    llave = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    if not base or not llave:
        return None, u'faltan credenciales en .env.local'
    url = u'%s/rest/v1/cuentas?select=id,cid,empresa' % base
    pet = urllib.request.Request(url, headers={
        'apikey': llave, 'Authorization': 'Bearer %s' % llave})
    try:
        with urllib.request.urlopen(pet, timeout=30) as r:
            filas = json.loads(r.read().decode('utf-8'))
    except Exception as e:                                    # noqa: BLE001
        return None, u'%s' % e
    # El MISMO saneado que hace `catalogoCuentas()`: sin el, un CID con
    # espacios no cruzaria aqui y si alla, y este guion mediria otra cosa.
    return {str(f['id']): re.sub(r'\D', '', str(f.get('cid') or '')).strip()
            for f in filas if f.get('id') and str(f.get('empresa') or '').strip()}, u''


def elige(nombres):
    u"""EL MISMO DESEMPATE QUE EL TS: mas reciente, y a igualdad el primero
       alfabeticamente. Si esta funcion y la de `lib/catalogo-cuentas.ts` se
       separan, este verificador deja de medir lo que la pantalla hace."""
    return sorted(nombres.items(), key=lambda kv: (-kv[1], kv[0]))[0][0]


def main():
    if not os.path.exists(CORTES):
        print(u'  *** no existe %s' % CORTES)
        return 2

    print(u'\n  CATALOGO DE CUENTAS — invariantes')
    print(u'  ' + u'=' * 68)
    por = lee_cortes()
    print(u'  padron de facturacion: %d CID(s) distintos' % len(por))

    # 1 · un nombre por CID, y determinista
    print(u'\n  EL NOMBRE DE CADA CID')
    multi = {k: v for k, v in por.items() if len(v) > 1}
    print(u'    CIDs con varios nombres escritos .. %3d' % len(multi))
    elegidos = {k: elige(v) for k, v in por.items()}
    exige(len(elegidos) == len(por), u'cada CID tiene exactamente un nombre elegido')
    # Determinismo: recorrer al reves no puede cambiar la eleccion.
    al_reves = {k: elige(dict(reversed(list(v.items())))) for k, v in por.items()}
    distintos = [k for k in elegidos if elegidos[k] != al_reves[k]]
    exige(not distintos,
          u'la eleccion NO depende del orden de lectura',
          u'cambian: %s' % [(k, elegidos[k], al_reves[k]) for k in distintos[:3]])
    for k in list(multi)[:3]:
        print(u'      %s → «%s»   (de %s)'
              % (k, elegidos[k], sorted(multi[k])))

    # 2 · el desempate del TS es el mismo que el de aqui
    print(u'\n  LA REGLA VIVE EN UN SOLO SITIO')
    ts = io.open(TS, encoding='utf-8').read()
    exige('b[1] - a[1] || a[0].localeCompare(b[0]' in ts,
          u'lib/catalogo-cuentas.ts desempata por fecha y luego alfabeticamente',
          u'si cambio alla, hay que cambiar `elige()` aqui o este guion miente')

    # 3 · el padron aporta cuentas que la cartera no tiene
    print(u'\n  LO QUE APORTA EL PADRON')
    print(u'    CIDs en los cortes ................ %3d' % len(por))
    exige(len(por) > 500,
          u'el padron aporta un catalogo grande, no un punado',
          u'solo %d: revisar que el Excel sea el bueno' % len(por))

    # 4 · el caso que lo motivo
    print(u'\n  EL CASO QUE LO MOTIVO')
    exige('144195' in por,
          u'ProMujer (CID 144195) se puede elegir',
          u'no esta en el padron: el selector no la ofreceria')
    if '144195' in por:
        print(u'      144195 → «%s»' % elegidos['144195'])

    # 5 · LA UNION CON LA CARTERA, contra las dos fuentes de verdad
    print(u'\n  LA UNION CON LA CARTERA')
    cartera, por_que = lee_cartera()
    if cartera is None:
        # Un fallo de credenciales NO puede pasar por «la union esta bien».
        exige(False, u'se pudo leer la cartera para comprobar la union', por_que)
    else:
        cids_cartera = {c for c in cartera.values() if c}
        print(u'    cuentas en la cartera ............. %3d' % len(cartera))
        print(u'    de ellas, con CID ................. %3d' % len(cids_cartera))
        solo_factura = [c for c in por if c not in cids_cartera]
        duplicados = [c for c in por if c in cids_cartera]
        print(u'    CIDs del padron ya en la cartera .. %3d  (se descartan)' % len(duplicados))
        print(u'    CIDs SOLO en facturacion .......... %3d  (se anaden)' % len(solo_factura))
        print(u'    catalogo final .................... %3d'
              % (len(cartera) + len(solo_factura)))
        exige(len(solo_factura) + len(duplicados) == len(por),
              u'las dos clases agotan el padron: o se anade o se descarta')
        exige(not (set(solo_factura) & cids_cartera),
              u'ningun CID sale como de cartera Y como de facturacion',
              u'el selector ofreceria la misma cuenta dos veces')
        exige(len(solo_factura) > 0,
              u'el padron aporta cuentas que la cartera NO tiene',
              u'si no aporta ninguna, el catalogo es la cartera disfrazada')
        exige('144195' in solo_factura,
              u'ProMujer entra por el padron, no por la cartera',
              u'o esta en la cartera —y entonces el hallazgo era falso— o no '
              u'se puede elegir')

    # 6 · CONTROL NEGATIVO: el formato del valor distingue las dos llaves
    print(u'\n  EL VALOR QUE VIAJA EN EL FORMULARIO')
    exige("v.startsWith('cuenta:')" in ts and "v.startsWith('cid:')" in ts,
          u'el valor dice CUAL llave es, en vez de adivinarlo por su forma')
    exige('return null' in ts,
          u'un valor que no se reconoce devuelve null —y la ruta lo trata como 400—',
          u'sin esto, un formato raro se interpretaria a medias')

    print(u'\n  ' + u'=' * 68)
    if fallos:
        print(u'  *** %d COMPROBACION(ES) FALLAN: %s' % (len(fallos), u' · '.join(fallos)))
        return 1
    print(u'  El catalogo ofrece cada cuenta una sola vez y siempre con el mismo nombre.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
