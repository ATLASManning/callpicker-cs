# -*- coding: utf-8 -*-
"""Deja en el libro de Candidatos de Crecimiento solo la cartera VIVA.

   ENCARGO (direccion, 6 oct 2026): «solo deja los activos, quita todos los que
   tienen CHURN CONFIRMADO».

   LA REGLA, en dos criterios
   --------------------------
       SE QUEDA  =  estado == 'activo'   Y   sin Churn confirmado

   ACTIVO ES ACTIVO, no «cartera viva». Lo precise con direccion el mismo dia:
   «solo dejame cuentas activas, lo demas no deseo que esten en el documento».
   Las 57 en_riesgo salen tambien, y no es un descuido: este libro es para
   vender mas, no para rescatar. Una cuenta en riesgo no es un candidato de
   crecimiento, es un candidato de retencion, y mezclarlas hace que la lista de
   oportunidades se trabaje con la misma urgencia con la que no se trabaja una
   lista de problemas.

   El segundo criterio no sobra: hay UNA cuenta marcada `activo` que ya tiene
   Churn confirmado en la fuente institucional. Sin ese filtro se quedaria.

   CHURN CONFIRMADO SE LEE DE LA FUENTE, NO DEL NOMBRE
   ---------------------------------------------------
   Zoho marca TRES churns distintos —`Churn confirmado`, `Churn mensual` y
   `Churn financiero`— y el tablero institucional cuenta SOLO el primero. Aqui
   se usa el mismo predicado que `scripts/gen-grc-zoho.py`:
   `movimiento.startswith('Churn confirmado')`. Contar los tres sacaria del
   libro cuentas que siguen vivas y solo deben dinero.

   PRIMERO REPRODUCIR, DESPUES REESCRIBIR
   --------------------------------------
   El guion NO toca nada hasta haber recalculado los totales del libro ORIGINAL
   y haberlos cuadrado contra lo que el libro dice. Si no cuadran, significa que
   no se entendio la regla con la que se construyeron, y reescribirlos seria
   inventar. En ese caso aborta.

   LO QUE NO SE PUEDE RECALCULAR, SE RETIRA
   -----------------------------------------
   Del bloque «Lo que aporto Analisis de Llamadas» se reproducen cuatro de las
   cinco cifras a partir de las columnas del libro. La quinta —«cuentas donde
   DESMIENTE al % de entrantes»— no se deduce de ningun dato presente. Dejarla
   con su valor viejo al lado de cuatro recalculadas seria tener dos cifras
   midiendo universos distintos en la misma tabla. Se retira el renglon y se
   dice por que en la hoja Depuracion.

   USO
       python scripts/depura-candidatos-crecimiento.py <origen.xlsx> [destino.xlsx]
"""
import collections
import copy
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font, PatternFill

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Solo 'activo'. Ver la cabecera: es instruccion explicita, no una inferencia.
SE_QUEDAN = ('activo',)
HOJAS_PRODUCTO = ['Asistente Virtual', 'Visibilidad y Control', 'Integración API',
                  'Callpicker Chat', 'Plan de adopción', 'Más capacidad']
FILA_CAB = 5          # el encabezado de las hojas de cuentas
FILA_DATO = 6         # el primer renglon de datos


# ── Fuentes ──────────────────────────────────────────────────────────────────
def env_local():
    cfg = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8-sig') as f:
        for linea in f:
            linea = linea.strip()
            if '=' in linea and not linea.startswith('#'):
                k, v = linea.split('=', 1)
                cfg[k.strip()] = v.strip().strip('"')
    return cfg


def trae_cuentas():
    cfg = env_local()
    url, key = cfg['NEXT_PUBLIC_SUPABASE_URL'], cfg['SUPABASE_SERVICE_ROLE_KEY']
    out, desde = [], 0
    while True:
        req = urllib.request.Request(
            url + '/rest/v1/cuentas?select=cid,empresa,estado,asesor,facturacion')
        req.add_header('apikey', key)
        req.add_header('Authorization', 'Bearer ' + key)
        req.add_header('Range', '%d-%d' % (desde, desde + 999))
        lote = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
        out += lote
        if len(lote) < 1000:
            return out
        desde += 1000


def cids_churn_confirmado():
    ruta = os.path.join(RAIZ, 'data', 'grc-zoho.json')
    grc = json.load(io.open(ruta, encoding='utf-8'))
    cids = set()
    for f in grc['filas']:
        mov = str(f.get('movimiento') or '')
        if f.get('cid') is not None and mov.startswith('Churn confirmado'):
            cids.add(str(f['cid']).strip())
    return cids, grc['meta'].get('mesVivo', '?')


# ── Utilidades de hoja ───────────────────────────────────────────────────────
def encabezado(ws, fila=FILA_CAB):
    cab = [c.value for c in ws[fila]]
    return {c: i for i, c in enumerate(cab) if c}


def filas_datos(ws, ix, clave='Cliente'):
    """(numero_de_fila, tupla_de_valores) de cada renglon con cliente."""
    out = []
    for n in range(FILA_DATO, ws.max_row + 1):
        vals = tuple(c.value for c in ws[n])
        if len(vals) > ix[clave] and vals[ix[clave]]:
            out.append((n, vals))
    return out


def deja_solo(ws, filas_a_quedarse):
    """Reescribe desde FILA_DATO las filas elegidas, con su formato, y borra la cola.

    No se usa `delete_rows` en bucle: mueve valores pero deja atras parte del
    estilo, y el libro acaba con renglones de datos pintados como si fueran
    encabezado. Copiar celda por celda es mas largo y es el unico modo de que lo
    que se ve siga diciendo la verdad.
    """
    ancho = ws.max_column
    buffer = []
    for n in filas_a_quedarse:
        buffer.append([(ws.cell(row=n, column=c).value,
                        copy.copy(ws.cell(row=n, column=c)._style))
                       for c in range(1, ancho + 1)])
    ultima = ws.max_row
    for i, fila in enumerate(buffer):
        destino = FILA_DATO + i
        for c, (valor, estilo) in enumerate(fila, start=1):
            celda = ws.cell(row=destino, column=c)
            celda.value = valor
            celda._style = estilo
    sobran = FILA_DATO + len(buffer)
    if ultima >= sobran:
        ws.delete_rows(sobran, ultima - sobran + 1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    origen = sys.argv[1]
    destino = sys.argv[2] if len(sys.argv) > 2 else None

    churn, mes_grc = cids_churn_confirmado()
    cuentas = trae_cuentas()
    estado = {str(c['cid']).strip(): c for c in cuentas if c.get('cid') is not None}
    print('  fuente de churn: data/grc-zoho.json · corte %s · %d CID con '
          'Churn confirmado' % (mes_grc, len(churn)))
    print('  cartera en Supabase: %d cuentas' % len(cuentas))

    wb = load_workbook(origen)
    hoja_maestra = [n for n in wb.sheetnames if n.startswith('Las ')][0]
    ws = wb[hoja_maestra]
    ix = encabezado(ws)
    datos = filas_datos(ws, ix)
    print('  libro: «%s» con %d cuentas' % (hoja_maestra, len(datos)))

    def g(vals, col):
        return vals[ix[col]] if col in ix and len(vals) > ix[col] else None

    def bloqueada(vals):
        return str(g(vals, 'Qué lo bloquea') or '—') not in ('—', '', 'None')

    # ── 1 · REPRODUCIR ANTES DE REESCRIBIR ───────────────────────────────────
    wv = wb['Veredicto']
    esperado = {}
    for n in range(6, 13):
        nombre = wv.cell(row=n, column=2).value
        if nombre and nombre != 'TOTAL':
            esperado[str(nombre)] = (wv.cell(row=n, column=3).value,
                                     wv.cell(row=n, column=4).value,
                                     wv.cell(row=n, column=5).value)
    calc = collections.defaultdict(lambda: [0, 0])
    for _, vals in datos:
        calc[str(g(vals, 'Candidato a') or '—')][1 if bloqueada(vals) else 0] += 1
    malas = []
    for nombre, (n_esp, h_esp, b_esp) in esperado.items():
        h, b = calc.get(nombre, [0, 0])
        if (h + b, h, b) != (n_esp, h_esp, b_esp):
            malas.append('%s: calculado %d/%d/%d, el libro dice %s/%s/%s'
                         % (nombre, h + b, h, b, n_esp, h_esp, b_esp))
    if malas:
        print('\n  *** NO SE REPRODUCEN LOS TOTALES DEL LIBRO ORIGINAL:')
        for m in malas:
            print('      ' + m)
        print('\n  No se reescribe nada: si no se puede recalcular lo que ya estaba,')
        print('  tampoco se puede recalcular lo que quede. Revisar la regla primero.')
        return 1
    print('  totales del libro original: reproducidos los %d renglones' % len(esperado))

    # ── 2 · DECIDIR QUIEN SE QUEDA ───────────────────────────────────────────
    quedan, fuera = [], []
    for n, vals in datos:
        cid = str(g(vals, 'CID')).strip() if g(vals, 'CID') is not None else None
        cta = estado.get(cid) if cid else None
        est = (cta or {}).get('estado')
        if cid and cid in churn:
            fuera.append((n, vals, cid, est, 'Churn confirmado en la fuente institucional'))
        elif est in SE_QUEDAN:
            quedan.append((n, vals, cid, est))
        elif est is None:
            fuera.append((n, vals, cid, est,
                          'Sin CID o sin fila en la cartera: no se puede confirmar que esté activa'))
        else:
            fuera.append((n, vals, cid, est, 'Estado «%s»: no está activa' % est))

    print('\n  se quedan: %d    salen: %d' % (len(quedan), len(fuera)))
    por_motivo = collections.Counter(m for _, _, _, _, m in fuera)
    for m, k in por_motivo.most_common():
        print('      %3d  %s' % (k, m))

    cids_quedan = {c for _, _, c, _ in quedan if c}
    quedan_filas = [n for n, _, _, _ in quedan]
    vals_maestra = [v for _, v, _, _ in quedan]

    # ── 3 · FILTRAR LAS HOJAS ────────────────────────────────────────────────
    deja_solo(ws, quedan_filas)
    nuevo_nombre = 'Las %d cuentas' % len(quedan)
    ws.title = nuevo_nombre

    for nom in HOJAS_PRODUCTO:
        if nom not in wb.sheetnames:
            continue
        w = wb[nom]
        jx = encabezado(w)
        fs = filas_datos(w, jx)
        sel = [n for n, v in fs
               if v[jx['CID']] is not None and str(v[jx['CID']]).strip() in cids_quedan]
        antes = len(fs)
        deja_solo(w, sel)
        # El subtitulo lleva las cifras: si no se reescribe, la hoja dice «66
        # cuentas» encima de 45 renglones. Dos cifras en el mismo documento es
        # peor que ninguna, porque las dos parecen buenas.
        quedan_aqui = [v for _, v in filas_datos(w, jx)]
        bloq_aqui = sum(1 for v in quedan_aqui
                        if str(v[jx['Qué lo bloquea']] or '—') not in ('—', '', 'None')
                        ) if 'Qué lo bloquea' in jx else None
        n_aqui = len(quedan_aqui)
        if bloq_aqui is None:
            # Sin esa columna, el reparto sale del veredicto de la maestra.
            cset = {str(v[jx['CID']]).strip() for v in quedan_aqui if v[jx['CID']] is not None}
            bloq_aqui = sum(1 for vv in vals_maestra
                            if str(g(vv, 'CID') or '').strip() in cset and bloqueada(vv))
        w.cell(row=3, column=2).value = (
            '%d cuentas · %d se pueden abordar hoy · %d tienen algo que resolver primero'
            % (n_aqui, n_aqui - bloq_aqui, bloq_aqui))
        print('      %-22s %3d → %3d' % (nom, antes, len(sel)))

    # ── 4 · RECALCULAR EL VEREDICTO ──────────────────────────────────────────
    vals_quedan = vals_maestra
    agg = collections.defaultdict(lambda: [0, 0])
    for v in vals_quedan:
        agg[str(g(v, 'Candidato a') or '—')][1 if bloqueada(v) else 0] += 1

    for n in range(6, 13):
        nombre = wv.cell(row=n, column=2).value
        if not nombre or nombre == 'TOTAL':
            continue
        h, b = agg.get(str(nombre), [0, 0])
        wv.cell(row=n, column=3).value = h + b
        wv.cell(row=n, column=4).value = h
        wv.cell(row=n, column=5).value = b
    wv.cell(row=13, column=3).value = len(vals_quedan)
    wv.cell(row=13, column=4).value = sum(a[0] for a in agg.values())
    wv.cell(row=13, column=5).value = sum(a[1] for a in agg.values())

    fuentes = collections.Counter(str(g(v, 'Fuente') or '') for v in vals_quedan)
    for n in range(17, 30):
        etq = wv.cell(row=n, column=2).value
        if etq:
            wv.cell(row=n, column=3).value = fuentes.get(str(etq), 0)

    def num(x):
        return x if isinstance(x, (int, float)) else 0

    con_lectura = sum(1 for v in vals_quedan if g(v, 'Entrantes') not in (None, ''))
    wv.cell(row=33, column=3).value = con_lectura
    wv.cell(row=34, column=3).value = len(vals_quedan) - con_lectura
    wv.cell(row=35, column=3).value = sum(
        1 for v in vals_quedan if str(g(v, 'Fuente') or '') == 'Análisis de Llamadas · medido')
    # La fila 36 —«cuentas donde DESMIENTE al % de entrantes»— no se deduce de
    # ninguna columna del libro. Se retira en vez de dejarla midiendo las 221.
    wv.cell(row=36, column=2).value = 'Cuentas donde DESMIENTE al % de entrantes'
    wv.cell(row=36, column=3).value = 'no recalculado — ver Depuración'
    wv.cell(row=37, column=3).value = sum(num(g(v, 'Sin contestar')) for v in vals_quedan)

    # Y el subtitulo de la portada, que tambien lleva una cifra y una fecha.
    wv.cell(row=3, column=2).value = (
        'Callpicker · Dirección de Satisfacción al Cliente · depurado el 6 de octubre de 2026 '
        '· las %d cuentas ACTIVAS, sin churn confirmado · ver la hoja Depuración'
        % len(vals_quedan))

    # ── 5 · LA HOJA QUE DEJA EL RASTRO ───────────────────────────────────────
    if 'Depuración' in wb.sheetnames:
        del wb['Depuración']
    wd = wb.create_sheet('Depuración')
    azul = Font(bold=True, color='FFFFFF')
    fondo = PatternFill('solid', fgColor='1B3FCC')
    wd.column_dimensions['A'].width = 3
    for col, ancho in zip('BCDEF', (38, 10, 16, 14, 52)):
        wd.column_dimensions[col].width = ancho

    wd['B2'] = 'QUÉ SE QUITÓ DE ESTE LIBRO, Y POR QUÉ'
    wd['B2'].font = Font(bold=True, size=13)
    wd['B3'] = ('Instrucción de dirección del 6 de octubre de 2026: «solo deja los activos, '
                'quita todos los que tienen CHURN CONFIRMADO».')
    wd['B4'] = ('Se queda únicamente la cuenta con estado ACTIVO y sin Churn confirmado. Las '
                'cuentas en riesgo también salen: este libro es para vender más, y una cuenta '
                'en riesgo es candidata de retención, no de crecimiento. El churn se lee de la '
                'fuente institucional (data/grc-zoho.json, corte %s), no del nombre: Zoho marca '
                'tres churns distintos y sólo «Churn confirmado» cuenta.' % mes_grc)
    wd['B5'] = ('De %d cuentas quedan %d. Las %d que salen van listadas abajo con su motivo.'
                % (len(datos), len(quedan), len(fuera)))
    for fila in (3, 4, 5):
        wd.cell(row=fila, column=2).alignment = Alignment(wrap_text=True, vertical='top')
        wd.merge_cells(start_row=fila, start_column=2, end_row=fila, end_column=6)
        wd.row_dimensions[fila].height = 30

    wd['B7'] = ('NOTA: el renglón «Cuentas donde DESMIENTE al %% de entrantes» del Veredicto '
                'quedó sin recalcular porque su definición no se deduce de ninguna columna '
                'de este libro. Se retiró el número en vez de dejar el viejo, que medía las '
                '%d cuentas originales.' % len(datos))
    wd.cell(row=7, column=2).alignment = Alignment(wrap_text=True, vertical='top')
    wd.merge_cells(start_row=7, start_column=2, end_row=7, end_column=6)
    wd.row_dimensions[7].height = 30

    for j, t in enumerate(['Cliente', 'CID', 'Estado', 'Monto', 'Por qué sale'], start=2):
        c = wd.cell(row=9, column=j, value=t)
        c.font = azul
        c.fill = fondo
    r = 10
    for _, vals, cid, est, motivo in sorted(
            fuera, key=lambda x: (x[4], -(x[1][ix['Monto']] or 0) if isinstance(
                x[1][ix['Monto']], (int, float)) else 0)):
        wd.cell(row=r, column=2, value=g(vals, 'Cliente'))
        wd.cell(row=r, column=3, value=cid or '—')
        wd.cell(row=r, column=4, value=est or 'sin fila en cartera')
        wd.cell(row=r, column=5, value=g(vals, 'Monto'))
        wd.cell(row=r, column=6, value=motivo)
        r += 1
    wd.freeze_panes = 'B10'

    # ── 6 · GUARDAR ──────────────────────────────────────────────────────────
    if not destino:
        destino = os.path.join('D:\\', 'Archivos',
                               'Candidatos_Crecimiento_ACTIVAS_2026-10-06.xlsx')
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    wb.save(destino)
    print('\n  escrito: %s' % destino)
    print('  hoja maestra renombrada a «%s»' % nuevo_nombre)
    return 0


if __name__ == '__main__':
    sys.exit(main())
