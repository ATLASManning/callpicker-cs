# -*- coding: utf-8 -*-
u"""gen-planes-pago.py — «Planes 2.0.xlsx» -> data/planes-pago.json

   Origen: Google Sheet «Planes 2.0» (Callpicker comercial)
   https://docs.google.com/spreadsheets/d/1cGBKeR7G5YozqWsaL3pf0ZA7LLZSV8AHWJk_-UAyaqE/

   EL CONECTOR DE DRIVE NO ALCANZA ESTE ARCHIVO
   --------------------------------------------
   Vive en otra cuenta de Google y devuelve «Requested entity was not found»,
   igual que el Sheet de Callpicker Chat. El camino es el mismo:
   Archivo > Descargar > Microsoft Excel (.xlsx), y correr esto.

   LAS LIGAS VIVEN EN EL HIPERVINCULO, NO EN EL TEXTO
   --------------------------------------------------
   Tres celdas de folleto tienen el TEXTO roto —terminan en `/vieww`— mientras
   su hipervinculo apunta bien. Un volcado de texto copiaria la rota y nadie
   lo notaria hasta que un cliente abriera un 404. Aqui se lee SIEMPRE
   `cell.hyperlink.target`, y el texto de la celda solo sirve de respaldo.

   EL CRUCE ENTRE LAS DOS HOJAS ES POR LIGA, NUNCA POR NOMBRE
   ----------------------------------------------------------
   «Links Planes Base» trae la liga de pago y el precio mensual; «PLANES» trae
   el precio ANUAL y el nombre comercial. Los nombres NO coinciden: lo que una
   llama «CE / 60 min» la otra lo llama «Basico 60 min», y «CE con grabacion
   200» es «Emprendedor 200 min c/ Grab». Cruzar por parecido mezcla planes,
   que es la misma trampa documentada en [[dids-fuente]]. La liga de pago es
   un identificador exacto: por ahi se cruza.

   LO QUE ESTE GUION SE NIEGA A HACER
   ----------------------------------
   · No inventa el precio anual de un plan que no cruza: queda en `null` y se
     cuenta aparte. Un `null` NO es un cero. [[feedback-cero-sin-medicion]]
   · No corrige en silencio una discrepancia entre las dos hojas: la escribe
     en `meta.avisos` para que se vea en pantalla.
   · No publica si el reparto no cierra.

   USO
   ---
       python scripts/gen-planes-pago.py ["ruta\\Planes 2.0.xlsx"]

   Sin argumento busca el .xlsx mas reciente que empiece por «Planes 2.0» en
   la carpeta de Descargas, y lo ARCHIVA en D:\\Proyectos\\CP\\Planes\\.
"""
import glob
import io
import json
import os
import re
import shutil
import sys
from datetime import date

from openpyxl import load_workbook

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ     = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA   = os.path.join(RAIZ, 'data', 'planes-pago.json')
ARCHIVO  = r'D:\Proyectos\CP\Planes'
DESCARGAS = os.path.join(os.path.expanduser('~'), 'Downloads')
SHEET_URL = ('https://docs.google.com/spreadsheets/d/'
             '1cGBKeR7G5YozqWsaL3pf0ZA7LLZSV8AHWJk_-UAyaqE/edit')

HOJA_LINKS  = u'Links Planes Base'
HOJA_PLANES = u'PLANES'
# Prefijo de las ligas de pago reales. Cualquier cosa fuera de aqui no es una
# liga de cobro y no se publica como tal.
PREFIJO_PAGO = 'https://admin.callpicker.com/payments/'


def liga(celda):
    u"""El destino del hipervinculo. Nunca el texto: ver la cabecera."""
    if celda is None or celda.hyperlink is None:
        return None
    t = (celda.hyperlink.target or u'').strip()
    return t or None


def texto(celda):
    if celda is None or celda.value in (None, ''):
        return None
    return re.sub(r'\s+', u' ', u'%s' % celda.value).strip()


def numero(celda):
    if celda is None or celda.value in (None, ''):
        return None
    try:
        return round(float(celda.value), 2)
    except (TypeError, ValueError):
        return None


def entero_id(celda):
    u"""El Plan ID viene como float («5925.0») y como «NA» cuando no hay."""
    v = numero(celda)
    if v is None:
        t = texto(celda)
        return None if t in (None, u'NA', u'-') else t
    return u'%d' % int(v)


def localiza_libro():
    if len(sys.argv) > 1:
        return sys.argv[1]
    cands = sorted(glob.glob(os.path.join(DESCARGAS, 'Planes 2.0*.xlsx')),
                   key=os.path.getmtime, reverse=True)
    if not cands:
        sys.exit(u'  *** No encuentro ningun «Planes 2.0*.xlsx» en %s.\n'
                 u'      Bajalo del Sheet: Archivo > Descargar > Microsoft Excel.\n'
                 u'      %s' % (DESCARGAS, SHEET_URL))
    return cands[0]


def archiva(ruta):
    u"""Guarda el corte con su fecha. No se pisa el de la semana pasada."""
    try:
        if not os.path.isdir(ARCHIVO):
            os.makedirs(ARCHIVO)
        destino = os.path.join(ARCHIVO, u'Planes 2.0 - %s.xlsx' % date.today().isoformat())
        if os.path.abspath(ruta) != os.path.abspath(destino):
            shutil.copy2(ruta, destino)
        return destino
    except Exception as e:                                   # noqa: BLE001
        print(u'  (aviso) no se pudo archivar el corte: %s' % e)
        return None


# ── 1. El catalogo de PLANES: precio anual y nombre comercial, por liga ──────
def lee_planes(wb):
    u"""{liga_de_pago: {...}} mas la lista de columnas sin liga, que se dicen."""
    ws = wb[HOJA_PLANES]
    por_liga = {}
    sin_liga = []
    for col in range(6, ws.max_column + 1):                  # de F en adelante
        enc = texto(ws.cell(row=3, column=col))
        if not enc:
            continue
        bloque_col = col
        bloque = None
        while bloque_col >= 6 and bloque is None:            # el bloque esta fusionado
            bloque = texto(ws.cell(row=1, column=bloque_col))
            bloque_col -= 1
        c_anu, c_men = ws.cell(row=4, column=col), ws.cell(row=5, column=col)
        ficha = {
            'etiquetaHoja': enc.replace(u'\n', u' / '),
            'bloque':       bloque,
            'anualidad':    numero(c_anu),
            'mensualidad':  numero(c_men),
            'folleto':      liga(ws.cell(row=2, column=col)),
        }
        la, lm = liga(c_anu), liga(c_men)
        if not la and not lm:
            sin_liga.append(ficha['etiquetaHoja'])
            continue
        for l in (la, lm):
            if l:
                por_liga[l] = ficha
    return por_liga, sin_liga


# ── 2. Las filas de «Links Planes Base» ──────────────────────────────────────
def lee_links(wb):
    ws = wb[HOJA_LINKS]
    filas, esquema = [], None
    for r in range(1, ws.max_row + 1):
        b = texto(ws.cell(row=r, column=2))
        if b == u'Bolsa de Minutos':
            esquema = 'bolsa'
            continue
        if b == u'Por Extensión':
            esquema = 'extension'
            continue
        # Los dos encabezados de la hoja. El de la fila 31 ademas esta MAL
        # —rotula «Extensiones» la columna del precio— y por eso no se usa
        # ninguno: las columnas se leen por posicion, que es lo unico estable.
        if b in (None, u'Funcionalidad'):
            continue
        c = numero(ws.cell(row=r, column=3))
        if c is None:
            continue
        filas.append({
            'fila':        r,
            'esquema':     esquema,
            'familia':     b,
            'cantidad':    int(c),
            'mensualidad': numero(ws.cell(row=r, column=4)),
            'planIdMensual': entero_id(ws.cell(row=r, column=5)),
            'ligaMensual':   liga(ws.cell(row=r, column=6)),
            'planIdAnual':   entero_id(ws.cell(row=r, column=7)),
            'ligaAnual':     liga(ws.cell(row=r, column=8)),
            'folleto':       liga(ws.cell(row=r, column=1)),
        })
    return filas


def slug(s):
    s = s.lower()
    for a, b in ((u'á', 'a'), (u'é', 'e'), (u'í', 'i'), (u'ó', 'o'), (u'ú', 'u'), (u'ñ', 'n')):
        s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def main():
    ruta = localiza_libro()
    print(u'  libro: %s' % ruta)
    wb = load_workbook(ruta, data_only=True)
    faltan = [h for h in (HOJA_LINKS, HOJA_PLANES) if h not in wb.sheetnames]
    if faltan:
        sys.exit(u'  *** El libro no trae %s. Hojas: %s'
                 % (u' ni '.join(faltan), u', '.join(wb.sheetnames)))

    por_liga, sin_liga = lee_planes(wb)
    filas = lee_links(wb)
    print(u'  %d filas de plan en «%s» · %d columnas con liga en «%s»'
          % (len(filas), HOJA_LINKS, len(por_liga), HOJA_PLANES))

    avisos, planes = [], []
    cruzados = 0
    for f in filas:
        ficha = None
        for l in (f['ligaAnual'], f['ligaMensual']):
            if l and l in por_liga:
                ficha = por_liga[l]
                break
        if ficha:
            cruzados += 1

        # Comprobaciones. Ninguna corrige nada: todas HABLAN.
        if not f['ligaMensual'] and not f['ligaAnual']:
            avisos.append(u'«%s %s» no trae NINGUNA liga de pago (fila %d).'
                          % (f['familia'], f['cantidad'], f['fila']))
        for nombre, l in ((u'mensual', f['ligaMensual']), (u'anual', f['ligaAnual'])):
            if l and not l.startswith(PREFIJO_PAGO):
                avisos.append(u'La liga %s de «%s %s» no apunta al cobrador de '
                              u'Callpicker: %s' % (nombre, f['familia'], f['cantidad'], l))
        anual = ficha['anualidad'] if ficha else None
        if ficha and ficha['mensualidad'] is not None and f['mensualidad'] is not None \
           and abs(ficha['mensualidad'] - f['mensualidad']) > 0.01:
            avisos.append(u'«%s %s»: la mensualidad no cuadra entre las dos hojas '
                          u'— «%s» dice $%s y «%s» dice $%s.'
                          % (f['familia'], f['cantidad'], HOJA_LINKS, f['mensualidad'],
                             HOJA_PLANES, ficha['mensualidad']))
        # LA ETIQUETA DE «PLANES» TIENE QUE DECIR LA MISMA CANTIDAD QUE LA
        # FILA. Suena redundante y no lo es: hay dos columnas rotuladas «VyC /
        # 5000 min» con precios distintos, y la segunda es en realidad la de
        # 6000 segun la hoja de ligas. Quien lea solo «PLANES» ve dos planes
        # iguales a precio distinto y no sabe cual cobrar.
        if ficha and ficha['etiquetaHoja']:
            cifras = [int(x) for x in re.findall(r'\d+', ficha['etiquetaHoja'])]
            if cifras and f['cantidad'] not in cifras:
                avisos.append(u'«%s %s %s»: en «%s» esa columna se rotula «%s», '
                              u'que no dice la misma cantidad. Manda la hoja de '
                              u'ligas, que es la que va pegada al cobro.'
                              % (f['familia'], f['cantidad'],
                                 'minutos' if f['esquema'] == 'bolsa' else 'ext',
                                 HOJA_PLANES, ficha['etiquetaHoja']))

        # La anualidad es la promo «14x12»: se pagan 12 mensualidades y se
        # reciben 14 meses. O sea anual == mensual x 12, EXACTO. Si deja de
        # cumplirse, o cambio la promo o hay un dedazo; en los dos casos se
        # dice en vez de publicarlo sin mas.
        if anual is not None and f['mensualidad']:
            esperado = round(f['mensualidad'] * 12, 2)
            if abs(anual - esperado) > 0.01:
                avisos.append(u'«%s %s»: la anualidad $%s no es 12 x $%s = $%s. '
                              u'La promo 14x12 ya no se cumple ahi.'
                              % (f['familia'], f['cantidad'], anual,
                                 f['mensualidad'], esperado))

        # EL FOLLETO: cuando las dos hojas no dicen el mismo, manda «PLANES».
        # No es una preferencia: alli hay UNA columna por plan y por tanto un
        # folleto por plan, mientras que en la hoja de ligas el folleto se
        # teclea por fila y se repite —«CE con grabacion 200» lleva pegado el
        # de «CE 400»—. Mandarle al cliente el folleto de otro plan no rompe
        # nada visible: solo le promete lo que no contrato.
        folleto = f['folleto']
        if ficha and ficha['folleto'] and folleto and ficha['folleto'] != folleto:
            avisos.append(u'«%s %s»: el folleto de «%s» (%s) no es el de «%s» (%s). '
                          u'Se publica el de «%s», que tiene una columna por plan.'
                          % (f['familia'], f['cantidad'], HOJA_LINKS, folleto,
                             HOJA_PLANES, ficha['folleto'], HOJA_PLANES))
            folleto = ficha['folleto']

        unidad = 'minutos' if f['esquema'] == 'bolsa' else 'extensiones'
        planes.append({
            'id':       u'%s-%s-%d' % (f['esquema'], slug(f['familia']), f['cantidad']),
            'esquema':  f['esquema'],
            'familia':  f['familia'],
            'unidad':   unidad,
            'cantidad': f['cantidad'],
            'etiquetaHoja':  ficha['etiquetaHoja'] if ficha else None,
            'mensualidad':   f['mensualidad'],
            'anualidad':     anual,
            'planIdMensual': f['planIdMensual'],
            'planIdAnual':   f['planIdAnual'],
            'ligaMensual':   f['ligaMensual'],
            'ligaAnual':     f['ligaAnual'],
            'folleto':       folleto or (ficha['folleto'] if ficha else None),
        })

    # ── EL REPARTO CIERRA ────────────────────────────────────────────────────
    if len(planes) != len(filas):
        sys.exit(u'  *** %d filas leidas y %d planes emitidos. No publico.'
                 % (len(filas), len(planes)))
    con_mensual = sum(1 for p in planes if p['ligaMensual'])
    con_anual   = sum(1 for p in planes if p['ligaAnual'])
    sin_anualidad = [p['id'] for p in planes if p['anualidad'] is None]

    meta = {
        'origen':      os.path.basename(ruta),
        'sheet':       SHEET_URL,
        'hojaLigas':   HOJA_LINKS,
        'hojaPrecios': HOJA_PLANES,
        'generado':    date.today().isoformat(),
        'total':       len(planes),
        'bolsa':       sum(1 for p in planes if p['esquema'] == 'bolsa'),
        'extension':   sum(1 for p in planes if p['esquema'] == 'extension'),
        'conLigaMensual': con_mensual,
        'conLigaAnual':   con_anual,
        'cruzadosConPrecios': cruzados,
        'sinAnualidad': sin_anualidad,
        # Lo que el documento TIENE pero esta hoja NO cubre. Se nombra para
        # que nadie lea «33 planes» como «todo el catalogo».
        'fueraDeEstaHoja': sin_liga,
        'avisos':      avisos,
    }

    with io.open(SALIDA, 'w', encoding='utf-8') as fh:
        fh.write(json.dumps({'meta': meta, 'planes': planes},
                            ensure_ascii=False, indent=2, sort_keys=False))

    print(u'\n  %d planes -> %s' % (len(planes), os.path.relpath(SALIDA, RAIZ)))
    print(u'     bolsa de minutos %d · por extension %d' % (meta['bolsa'], meta['extension']))
    print(u'     con liga mensual %d · con liga anual %d' % (con_mensual, con_anual))
    print(u'     cruzados con precios de «%s»: %d de %d' % (HOJA_PLANES, cruzados, len(planes)))
    if sin_anualidad:
        print(u'     SIN precio anual (queda null, no cero): %s' % u', '.join(sin_anualidad))
    if sin_liga:
        print(u'\n  columnas de «%s» que NO estan en esta hoja (no llevan liga de pago):'
              % HOJA_PLANES)
        for s in sin_liga:
            print(u'     - %s' % s)
    if avisos:
        print(u'\n  *** %d AVISO(S) — van al JSON y se pintan en pantalla:' % len(avisos))
        for a in avisos:
            print(u'     - %s' % a)
    else:
        print(u'\n  sin avisos: las dos hojas cuadran y la promo 14x12 se cumple en todos.')

    arch = archiva(ruta)
    if arch:
        print(u'\n  corte archivado en %s' % arch)


if __name__ == '__main__':
    main()
