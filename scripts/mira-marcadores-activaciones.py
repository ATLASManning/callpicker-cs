# -*- coding: utf-8 -*-
u"""LOS CLIENTES CON NOMBRE-MARCADOR «cpNNNNNN» DEL TABLERO DE ACTIVACIONES.

   ── POR QUE EXISTE ────────────────────────────────────────────────────────
   El 6 nov 2026 el export BORRO el ID 190131. Venia como `pagada` con $478 de
   primer pago, pero su Cliente era el marcador «cp190131» y no traia Ejecutivo
   ni Vendedor, asi que leida sola parecia un registro de prueba. No lo era:
   ese CID es «Ayudate LTA» y factura — el importe del corte coincide al peso.
   Una activacion de octubre, un mes ya publicado, dejo de contarse.

   El diff no lo caza solo: busca la reaparicion POR NOMBRE, y el nombre era un
   marcador. **Cuando el nombre que desaparece es `cpNNNNNN`, hay que cruzar el
   ID contra los cortes de facturacion, que es donde esta el nombre real.**
   Este guion hace ese cruce para TODOS los marcadores de una vez, antes de que
   a alguien le parezcan basura. [[activaciones-fuente]]

   Una fila casi vacia se COMPLETA, no se borra.

   LO QUE IMPRIME, por cada marcador:
     · su fila de activaciones (tipo, importe, mes, ejecutivo)
     · si ese CID esta en `data/cortes-facturacion.xlsx`, con que NOMBRE REAL,
       que plan y por cuanto — y si el importe coincide con el primer pago
     · si ese CID esta en la cartera (`data/cuentas.*` via el GRC)

   NO corrige nada: las correcciones van en la hoja de origen, no aqui.

   USO
       python -I scripts/mira-marcadores-activaciones.py
       python -I scripts/mira-marcadores-activaciones.py "D:\\Archivos\\otro.xlsx"
       python -I scripts/mira-marcadores-activaciones.py --autoprueba
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NUEVO = r'D:\Archivos\Tablero de Activaciones 2.0.xlsx'
CORTES = os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx')
GRC = os.path.join(RAIZ, 'data', 'grc-zoho.json')

#: Un nombre de cliente que es el propio CID con un prefijo. No es un cliente:
#: es el hueco que dejo quien capturo, con el numero puesto para que la fila
#: exista. `re.fullmatch` y no `startswith`, para no cazar a un cliente que de
#: verdad se llame «CP Algo».
MARCADOR = re.compile(r'^\s*cp\s*(\d{4,8})\s*$', re.IGNORECASE)


def es_marcador(nombre):
    m = MARCADOR.match(str(nombre or ''))
    return m.group(1) if m else None


def filas(ruta, hoja=None):
    u"""Las filas de la primera hoja (o la nombrada) como dicts por encabezado."""
    wb = openpyxl.load_workbook(ruta, data_only=True, read_only=True)
    ws = wb[hoja] if hoja and hoja in wb.sheetnames else wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    cab = [str(c).strip() if c is not None else '' for c in next(it)]
    out = []
    for r in it:
        if all(c is None for c in r):
            continue
        out.append(dict(zip(cab, r)))
    wb.close()
    return out, cab


def col(cab, *candidatas):
    u"""El encabezado real que empata EXACTAMENTE con alguna candidata.

       Sin acentos y sin distinguir mayusculas, pero **sin buscar por
       subcadena**. La primera version de este guion si lo hacia y eligio
       `Cuenta` —una metrica numerica del corte— creyendo que era el nombre
       del cliente: imprimio «None» y «0» como si fueran nombres. Una columna
       que se parece en el rotulo no es la columna.
       [[feedback-metricas-derivadas-origen]]
    """
    def n(s):
        return ''.join(c for c in str(s).lower() if c.isalnum())
    mapa = {n(c): c for c in cab}
    for c in candidatas:
        if n(c) in mapa:
            return mapa[n(c)]
    return None


def dinero(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def pesos(v):
    return u'$%s' % format(v, u',.2f') if v is not None else u'—'


def mira(act_ruta, cortes_ruta, di=print):
    u"""Devuelve la lista de marcadores con lo que se pudo cruzar."""
    act, cab = filas(act_ruta, 'Hoja1')
    c_id = col(cab, 'ID')
    c_cli = col(cab, 'Cliente')
    c_tipo = col(cab, 'Tipo')
    c_pago = col(cab, '1er Pago')
    c_mes = col(cab, 'Mes 1er Pago')
    c_fec = col(cab, 'Fecha 1er Pago')
    c_eje = col(cab, 'Ejecutivo')
    c_vnd = col(cab, 'Vendedor')
    if not c_id or not c_cli:
        di(u'  *** el archivo no trae columnas ID y Cliente: %s' % cab[:6])
        return None

    marc = []
    for f in act:
        cid = es_marcador(f.get(c_cli))
        if cid:
            marc.append((cid, f))

    cortes = {}
    if not os.path.exists(cortes_ruta):
        di(u'  *** no esta %s — sin el no se puede nombrar a nadie, y un' % cortes_ruta)
        di(u'      «no aparece» sin haber mirado es inventarse una ausencia.')
        return None

    cf, ccab = filas(cortes_ruta)
    k_id = col(ccab, 'CID')
    k_nom = col(ccab, 'Nombre del Cliente')
    k_pla = col(ccab, 'Nombre del Plan')
    k_imp = col(ccab, 'Monto del plan')
    k_fec = col(ccab, 'Fecha de corte')
    faltan = [n for n, k in ((u'CID', k_id), (u'Nombre del Cliente', k_nom),
                             (u'Nombre del Plan', k_pla),
                             (u'Monto del plan', k_imp),
                             (u'Fecha de corte', k_fec)) if not k]
    if faltan:
        di(u'  *** cortes-facturacion.xlsx cambio de estructura: falta(n) %s'
           % u', '.join(faltan))
        di(u'      Trae: %s' % u', '.join(str(c) for c in ccab[:12] if c))
        di(u'      NO se sigue con columnas adivinadas.')
        return None

    for f in cf:
        cid = re.sub(r'\D', '', str(f.get(k_id) or ''))
        if cid:
            cortes.setdefault(cid, []).append({
                'nombre': f.get(k_nom), 'plan': f.get(k_pla),
                'monto': dinero(f.get(k_imp)), 'fecha': f.get(k_fec)})
    for v in cortes.values():   # el corte mas reciente primero
        v.sort(key=lambda h: str(h['fecha'] or ''), reverse=True)

    di(u'')
    di(u'  %d fila(s) con nombre-marcador «cpNNNNNN» en %d del tablero'
       % (len(marc), len(act)))
    di(u'  ' + u'=' * 72)

    salida = []
    for cid, f in sorted(marc, key=lambda x: x[0]):
        pago = dinero(f.get(c_pago))
        di(u'')
        di(u'  cp%s   %-11s %-10s %s' % (
            cid, str(f.get(c_tipo) or u'—'), pesos(pago),
            str(f.get(c_mes) or u'sin mes')))
        di(u'           fecha 1er pago  %s' % (f.get(c_fec) if c_fec else u'—'))
        di(u'           ejecutivo       %s' % (f.get(c_eje) or u'SIN CAPTURAR'))
        di(u'           vendedor        %s' % (f.get(c_vnd) or u'SIN CAPTURAR'))

        hits = cortes.get(cid) or []
        if not hits:
            di(u'           facturacion     el CID no aparece en los cortes.')
            di(u'                           NO quiere decir que no exista: los')
            di(u'                           cortes son un snapshot. Preguntar.')
        else:
            h = hits[0]           # el mas reciente
            coincide = (pago is not None and h['monto'] is not None
                        and abs(h['monto'] - pago) < 0.01)
            di(u'           NOMBRE REAL     «%s»' % (h['nombre'] or u'—'))
            di(u'           facturacion     %s · %s · corte %s%s'
               % (h['plan'], pesos(h['monto']),
                  str(h['fecha'])[:10],
                  u'   COINCIDE AL PESO' if coincide else u''))
            if len(hits) > 1:
                di(u'                           y %d corte(s) mas: sigue facturando.'
                   % (len(hits) - 1))
        salida.append({'cid': cid, 'pago': pago,
                       'tipo': f.get(c_tipo), 'cortes': hits})

    di(u'')
    sin = [m for m in salida if not m['cortes']]
    con = [m for m in salida if m['cortes']]
    di(u'  %d con nombre real en facturacion · %d sin cruce' % (len(con), len(sin)))
    di(u'')
    di(u'  NINGUNO SE BORRA. Una fila casi vacia se completa: hay que pedirle a')
    di(u'  quien mantiene la hoja el nombre real, el Ejecutivo y el Vendedor.')
    return salida


# ── Autoprueba ───────────────────────────────────────────────────────────────
# Lo que una corrida buena no enseña: que el detector NO se lleve por delante a
# un cliente que legitimamente empiece por «cp». [[feedback-probar-al-reves]]
def autoprueba():
    print(u'\n  AUTOPRUEBA — que el detector no cace de mas')
    print(u'  ' + u'-' * 68)
    casos = [
        (u'cp190131', u'190131'), (u'CP190131', u'190131'),
        (u' cp 190131 ', u'190131'), (u'cp12345678', u'12345678'),
        (u'CP Soluciones', None), (u'cpanel', None), (u'cp', None),
        (u'cp190131 SA de CV', None), (u'Grupo CP 123', None),
        (u'cp123', None), (u'', None), (None, None),
    ]
    malos = 0
    for nombre, esp in casos:
        dio = es_marcador(nombre)
        bien = dio == esp
        if not bien:
            malos += 1
        print(u'    %-24s -> %-10s %s'
              % (repr(nombre)[:24], dio,
                 u'ok' if bien else u'*** FALLA *** esperaba %s' % esp))
    print(u'')
    print(u'  %s' % (u'las %d comprobaciones pasan' % len(casos) if not malos
                     else u'*** %d FALLA(S) ***' % malos))
    return 1 if malos else 0


def main():
    if '--autoprueba' in sys.argv:
        return autoprueba()
    ruta = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else NUEVO
    if not os.path.exists(ruta):
        print(u'  *** no esta %s' % ruta)
        return 2
    return 0 if mira(ruta, CORTES) is not None else 2


if __name__ == '__main__':
    sys.exit(main())
