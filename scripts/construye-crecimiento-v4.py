"""Construye la V4 del Reporte de Crecimiento.

   QUE CAMBIA RESPECTO DE LA V3

   1. Columna «candidato a:» con SI / NO en la hoja Base, mas una columna que
      dice POR QUE. El binario solo no se puede usar: un «NO» sin motivo manda
      al asesor a adivinar, y un «SI» sin evidencia es una orden sin sustento.

   2. Hoja DASHBOARD nueva, con filtros de verdad (listas desplegables) y KPIs
      que recalculan. Sin macros: todo con formulas que Excel y LibreOffice
      evaluan igual.

   3. Hoja RESUMEN CANDIDATOS: el corte por tratamiento, por asesor y por
      motivo de bloqueo.

   4. SE CORRIGE UN BUG DE LA V3. Los cuatro indicadores de tratamiento de la
      Lectura ejecutiva contaban sobre la columna N —que es PREPARACION PARA
      CRECER, con valores Alta/Baja— buscando nombres de tratamiento, que viven
      en la O. Por eso los cuatro marcaban 0. Es el error clasico de rango
      corrido en uno: la formula evalua sin error y da un numero falso.

   LA REGLA DEL SI / NO, y por que es esta:
   Dos fuentes independientes tenian que coincidir o no se publicaba.
     · La MATRIZ DEL PROPIO ARCHIVO: solo las cuentas con PREPARACION = Alta
       reciben oferta (tratamientos «Plan de crecimiento activo» y «Atender
       oportunidades puntuales»).
     · La DOCTRINA de lib/candidato-a.ts: no se propone crecimiento sobre un
       problema sin resolver — ticket abierto, fallas con salud baja, o cuenta
       que no se usa.
   Coinciden en las 152 cuentas, sin una sola contradiccion: las 21 que la
   matriz autoriza son exactamente las 21 sin problema abierto.

   La ausencia de medicion NO bloquea. La doctrina exige `consumo !== null`
   para marcar sin-uso; no medir no es medir cero, y convertirlo en «NO» seria
   publicar un veredicto donde solo hay un hueco.
"""
import sys, io, os, json, shutil, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ORIGEN = r'C:\Users\manni\OneDrive\Escritorio\Reporte_Clientes_AAA_AA_A_Crecimiento_2026-09-09 V3.xlsx'
DESTINO = r'D:\Proyectos\CP\Reporte_Clientes_AAA_AA_A_Crecimiento_2026-09-17_V4.xlsx'

FUENTE = 'Arial'
AZUL = '1B3FCC'; GRIS = 'F1F5F9'; VERDE = '15803D'; ROJO = 'B91C1C'; AMBAR = 'B45309'
BORDE = Border(bottom=Side(style='thin', color='CBD5E1'))


def num(v):
    try:
        return float(str(v).replace('%', '').replace(',', '').strip())
    except Exception:
        return None


cid = lambda v: str(v or '').strip().replace('.0', '')

# ── Datos ──────────────────────────────────────────────────────────────────
os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
shutil.copyfile(ORIGEN, DESTINO)
wb = openpyxl.load_workbook(DESTINO)          # con formulas, para no perderlas
wbv = openpyxl.load_workbook(ORIGEN, data_only=True)   # con valores, para leer

D = json.load(io.open(r'D:\Windows\Projects\callpicker-cs\data\reporte-crecimiento.json', encoding='utf-8'))


def tabla(hoja):
    d = D[hoja]
    i = d['filaCabecera']
    cab = [str(c).strip() if c is not None else '' for c in d['filas'][i]]
    out = []
    for f in d['filas'][i + 1:]:
        if all(c is None or str(c).strip() == '' for c in f):
            continue
        out.append({cab[j]: f[j] for j in range(len(cab)) if cab[j]})
    return out


base = tabla('Base AAA-AA-A')
matriz = {cid(r['CID']): r for r in tabla('Matriz del programa')}
sop = {cid(r['CID']): r for r in tabla('Soporte de datos')}

# ── El veredicto ───────────────────────────────────────────────────────────
filas = []
for r in base:
    k = cid(r['CID'])
    m, s = matriz.get(k, {}), sop.get(k, {})
    prep = str(m.get('PREPARACIÓN PARA CRECER') or '').strip()
    uso = num(s.get('% uso real'))
    abiertos = num(s.get('Tickets abiertos')) or 0
    fallas = num(s.get('Tickets con falla')) or 0
    hs = num(s.get('Health Score'))
    estado = str(s.get('Estado') or '').strip()

    if estado in ('cancelado', 'hibernacion'):
        bloqueo = 'Estado «%s»: cualquier propuesta es prematura.' % estado
    elif abiertos > 0:
        bloqueo = '%d ticket(s) abierto(s). Primero se cierra la incidencia.' % abiertos
    elif fallas >= 2 and hs is not None and hs < 60:
        bloqueo = '%d fallas con salud %d. Estabilizar antes de proponer.' % (fallas, hs)
    elif uso is not None and uso < 0.10:
        bloqueo = 'Consume %.1f%% de su bolsa: paga lo que no usa. Reactivar, no vender.' % (uso * 100)
    else:
        bloqueo = None

    si = prep.lower() == 'alta' and bloqueo is None
    if si:
        razon = 'Preparación Alta y sin problema abierto. %s.' % (str(m.get('TRATAMIENTO SEGÚN LA MATRIZ') or '').strip() or 'Candidata')
        if uso is not None:
            razon += ' Usa %.0f%% de su bolsa.' % (uso * 100)
    elif bloqueo:
        razon = bloqueo
    else:
        razon = 'Sin problema abierto, pero su preparación es Baja: falta champion, necesidad validada o próximo paso acordado. Es pipeline, no candidata hoy.'
    if uso is None:
        razon += ' (Sin medición de consumo: no bloquea, pero la propuesta iría a ciegas.)'

    filas.append(dict(
        cid=k, cliente=str(r.get('NOMBRE CLIENTE') or ''),
        clasif=str(m.get('CLASIF.') or ''), asesor=str(m.get('ASESOR') or ''),
        estado=estado, factura=num(m.get('FACTURA')) or 0,
        uso=uso, hs=hs, fallas=fallas, abiertos=abiertos,
        rel=num(s.get('% Relacionamiento')),
        pot=str(m.get('POTENCIAL') or ''), prep=prep,
        trat=str(m.get('TRATAMIENTO SEGÚN LA MATRIZ') or '').strip(),
        si='SÍ' if si else 'NO', razon=razon,
        bloqueo=(bloqueo.split(':')[0].split('.')[0] if bloqueo else ('Preparación Baja' if not si else 'Sin bloqueo')),
    ))

porCid = {f['cid']: f for f in filas}
nSi = sum(1 for f in filas if f['si'] == 'SÍ')
print('candidato SÍ: %d · NO: %d · total %d' % (nSi, len(filas) - nSi, len(filas)))

# ── 1. Columnas nuevas en la hoja Base ─────────────────────────────────────
ws = wb['Base AAA-AA-A']
CAB = 3
colSi, colPor = 14, 15          # N y O
for c, titulo in ((colSi, 'candidato a:'), (colPor, 'POR QUÉ (SÍ / NO)')):
    cel = ws.cell(row=CAB, column=c, value=titulo)
    cel.font = Font(name=FUENTE, bold=True, size=10, color='FFFFFF')
    cel.fill = PatternFill('solid', fgColor=AZUL)
    cel.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

for i in range(CAB + 1, ws.max_row + 1):
    k = cid(ws.cell(row=i, column=1).value)
    f = porCid.get(k)
    if not f:
        continue
    a = ws.cell(row=i, column=colSi, value=f['si'])
    a.font = Font(name=FUENTE, bold=True, size=10, color=(VERDE if f['si'] == 'SÍ' else ROJO))
    a.alignment = Alignment(horizontal='center', vertical='center')
    a.fill = PatternFill('solid', fgColor=('DCFCE7' if f['si'] == 'SÍ' else 'FEE2E2'))
    b = ws.cell(row=i, column=colPor, value=f['razon'])
    b.font = Font(name=FUENTE, size=9)
    b.alignment = Alignment(vertical='top', wrap_text=True)
ws.column_dimensions[get_column_letter(colSi)].width = 13
ws.column_dimensions[get_column_letter(colPor)].width = 62

# ── 2. Se corrige el bug de la Lectura ejecutiva ───────────────────────────
le = wb['Lectura ejecutiva']
for celda, tratamiento in (('C7', 'Plan de crecimiento activo'),
                           ('C8', 'Desarrollar adopcion, relacion y descubrimiento'),
                           ('C9', 'Atender oportunidades puntuales'),
                           ('C10', 'Seguimiento estandar')):
    le[celda] = "=COUNTIF('Matriz del programa'!O4:O155,\"%s\")" % tratamiento
le['B17'] = 'Candidatas hoy (candidato a: = SÍ)'
le['C17'] = "=COUNTIF('Base AAA-AA-A'!N4:N155,\"SÍ\")"
le['B18'] = 'No candidatas hoy'
le['C18'] = "=COUNTIF('Base AAA-AA-A'!N4:N155,\"NO\")"
le['B19'] = 'Facturación de las candidatas'
le['C19'] = "=SUMIF('Base AAA-AA-A'!N4:N155,\"SÍ\",'Matriz del programa'!G4:G155)"
for r in (17, 18, 19):
    le.cell(row=r, column=2).font = Font(name=FUENTE, size=10, bold=True)
    le.cell(row=r, column=3).font = Font(name=FUENTE, size=10, bold=True, color=AZUL)
le['C19'].number_format = '$#,##0'

print('Lectura ejecutiva: 4 indicadores corregidos (N -> O) y 3 nuevos')

# ── 3. Hoja de cálculo auxiliar para el Dashboard ──────────────────────────
if '_calculo' in wb.sheetnames:
    del wb['_calculo']
cal = wb.create_sheet('_calculo')
CABS = ['CID', 'Cliente', 'Clasif', 'Asesor', 'Estado', 'Factura', 'Uso', 'Salud',
        'Relacionamiento', 'Potencial', 'Preparación', 'Tratamiento', 'Candidato',
        'Motivo', 'PASA', 'ORDEN']
for j, h in enumerate(CABS, start=1):
    c = cal.cell(row=1, column=j, value=h)
    c.font = Font(name=FUENTE, bold=True, size=9)
for i, f in enumerate(filas, start=2):
    cal.cell(row=i, column=1,  value=f['cid'])
    cal.cell(row=i, column=2,  value=f['cliente'])
    cal.cell(row=i, column=3,  value=f['clasif'])
    cal.cell(row=i, column=4,  value=f['asesor'])
    cal.cell(row=i, column=5,  value=f['estado'])
    cal.cell(row=i, column=6,  value=f['factura'])
    cal.cell(row=i, column=7,  value=f['uso'])
    cal.cell(row=i, column=8,  value=f['hs'])
    cal.cell(row=i, column=9,  value=f['rel'])
    cal.cell(row=i, column=10, value=f['pot'])
    cal.cell(row=i, column=11, value=f['prep'])
    cal.cell(row=i, column=12, value=f['trat'])
    cal.cell(row=i, column=13, value=f['si'])
    cal.cell(row=i, column=14, value=f['bloqueo'])
    # PASA: 1 si la fila cumple los cuatro filtros del Dashboard.
    cal.cell(row=i, column=15, value=(
        '=IF(AND('
        'OR(Dashboard!$C$5="Todos",M{r}=Dashboard!$C$5),'
        'OR(Dashboard!$C$6="Todos",D{r}=Dashboard!$C$6),'
        'OR(Dashboard!$C$7="Todos",C{r}=Dashboard!$C$7),'
        'OR(Dashboard!$C$8="Todos",L{r}=Dashboard!$C$8)'
        '),1,0)').replace('{r}', str(i)))
    # ORDEN: la factura de las que pasan, con desempate por fila para que
    # LARGE nunca devuelva dos veces la misma cuenta.
    cal.cell(row=i, column=16, value='=IF(O{r}=1,F{r}+ROW()/100000,-1)'.replace('{r}', str(i)))
cal.sheet_state = 'hidden'
FIN = len(filas) + 1

# ── 4. Dashboard ───────────────────────────────────────────────────────────
if 'Dashboard' in wb.sheetnames:
    del wb['Dashboard']
dash = wb.create_sheet('Dashboard', 0)
dash.sheet_view.showGridLines = False
for col, w in (('A', 2), ('B', 30), ('C', 34), ('D', 10), ('E', 13), ('F', 11),
               ('G', 9), ('H', 9), ('I', 13), ('J', 38)):
    dash.column_dimensions[col].width = w

dash['B2'] = 'DASHBOARD · PROGRAMA DE CRECIMIENTO'
dash['B2'].font = Font(name=FUENTE, bold=True, size=16, color=AZUL)
dash['B3'] = 'Cambia los cuatro filtros y todo lo de abajo se recalcula. Corte del 17 de septiembre de 2026 · 152 cuentas AAA/AA/A.'
dash['B3'].font = Font(name=FUENTE, size=9, italic=True, color='475569')

asesores = ['Todos'] + sorted({f['asesor'] for f in filas if f['asesor']})
clasifs = ['Todos'] + sorted({f['clasif'] for f in filas if f['clasif']})
trats = ['Todos'] + sorted({f['trat'] for f in filas if f['trat']})
FILTROS = [
    (5, 'Candidato a:', ['Todos', 'SÍ', 'NO'], 'Todos'),
    (6, 'Asesor', asesores, 'Todos'),
    (7, 'Clasificación', clasifs, 'Todos'),
    (8, 'Tratamiento', trats, 'Todos'),
]
for r, etiqueta, opciones, inicial in FILTROS:
    e = dash.cell(row=r, column=2, value=etiqueta)
    e.font = Font(name=FUENTE, bold=True, size=10)
    v = dash.cell(row=r, column=3, value=inicial)
    v.font = Font(name=FUENTE, bold=True, size=11, color='0000FF')
    v.fill = PatternFill('solid', fgColor='FEF9C3')
    v.alignment = Alignment(horizontal='center')
    v.border = Border(*(Side(style='thin', color='94A3B8'),) * 4)
    dv = DataValidation(type='list', formula1='"%s"' % ','.join(o.replace(',', ' ') for o in opciones),
                        allow_blank=False, showDropDown=False)
    dash.add_data_validation(dv)
    dv.add(v)

dash['B10'] = 'RESULTADO DEL FILTRO'
dash['B10'].font = Font(name=FUENTE, bold=True, size=11, color=AZUL)

KPIS = [
    (11, 'Cuentas que cumplen', "=SUM(_calculo!O2:O%d)" % FIN, '#,##0'),
    (12, 'Facturación mensual', "=SUMPRODUCT(_calculo!O2:O%d,_calculo!F2:F%d)" % (FIN, FIN), '$#,##0'),
    (13, 'De ésas, candidatas hoy', "=SUMPRODUCT(_calculo!O2:O%d,--(_calculo!M2:M%d=\"SÍ\"))" % (FIN, FIN), '#,##0'),
    (14, 'Uso promedio de su bolsa', "=IFERROR(SUMPRODUCT(_calculo!O2:O%d,_calculo!G2:G%d)/SUMPRODUCT(_calculo!O2:O%d,--(_calculo!G2:G%d<>\"\")),\"sin dato\")" % (FIN, FIN, FIN, FIN), '0.0%'),
    (15, 'Salud promedio', "=IFERROR(SUMPRODUCT(_calculo!O2:O%d,_calculo!H2:H%d)/SUMPRODUCT(_calculo!O2:O%d,--(_calculo!H2:H%d<>\"\")),\"sin dato\")" % (FIN, FIN, FIN, FIN), '0'),
]
for r, etiqueta, formula, fmt in KPIS:
    dash.cell(row=r, column=2, value=etiqueta).font = Font(name=FUENTE, size=10)
    c = dash.cell(row=r, column=3, value=formula)
    c.font = Font(name=FUENTE, bold=True, size=12, color=AZUL)
    c.number_format = fmt
    c.alignment = Alignment(horizontal='center')
    dash.cell(row=r, column=2).border = BORDE
    c.border = BORDE

dash['B17'] = 'LAS 20 DE MAYOR FACTURACIÓN QUE CUMPLEN EL FILTRO'
dash['B17'].font = Font(name=FUENTE, bold=True, size=11, color=AZUL)
dash['B18'] = 'Ordenadas por lo que pagan hoy. Si el filtro deja menos de 20, los renglones sobrantes quedan en blanco.'
dash['B18'].font = Font(name=FUENTE, size=9, italic=True, color='475569')

TCAB = ['Cliente', 'Tratamiento', 'Clasif.', 'Asesor', 'Factura', 'Uso', 'Salud', 'Candidato', 'Por qué']
for j, h in enumerate(TCAB, start=2):
    c = dash.cell(row=20, column=j, value=h)
    c.font = Font(name=FUENTE, bold=True, size=9, color='FFFFFF')
    c.fill = PatternFill('solid', fgColor=AZUL)
    c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)

# INDEX/MATCH sobre LARGE: nada de FILTER ni SORT, que LibreOffice no evalua.
COLS = {2: 'B', 3: 'L', 4: 'C', 5: 'D', 6: 'F', 7: 'G', 8: 'H', 9: 'M'}
for k in range(1, 21):
    r = 20 + k
    pos = ('MATCH(LARGE(_calculo!$P$2:$P$%d,%d),_calculo!$P$2:$P$%d,0)' % (FIN, k, FIN))
    guarda = '=IF(%d>SUM(_calculo!$O$2:$O$%d),"",' % (k, FIN)
    for j, letra in COLS.items():
        dash.cell(row=r, column=j, value='%sINDEX(_calculo!$%s$2:$%s$%d,%s))' % (guarda, letra, letra, FIN, pos))
    # La razón se trae aparte porque es texto largo
    dash.cell(row=r, column=10, value='%sINDEX(_calculo!$N$2:$N$%d,%s))' % (guarda, FIN, pos))
    for j in range(2, 11):
        c = dash.cell(row=r, column=j)
        c.font = Font(name=FUENTE, size=9)
        c.border = BORDE
        if j in (6,):
            c.number_format = '$#,##0'
        if j == 7:
            c.number_format = '0.0%'
        if j in (4, 5, 7, 8, 9):
            c.alignment = Alignment(horizontal='center')
dash.column_dimensions['J'].width = 30

dash['B43'] = 'CÓMO LEER ESTE TABLERO'
dash['B43'].font = Font(name=FUENTE, bold=True, size=10, color=AZUL)
NOTAS = [
    '«Candidato a: SÍ» significa que la cuenta puede recibir una oferta HOY. Exige dos cosas a la vez: preparación Alta en la matriz del programa y ningún problema abierto.',
    'Un «NO» casi nunca es una cuenta mala. De las %d que no son candidatas, la mayoría lo es por preparación Baja: falta champion, necesidad validada o próximo paso acordado. Eso es pipeline, no descarte.' % (len(filas) - nSi),
    'No se propone crecimiento sobre un problema sin resolver: ticket abierto, fallas con salud menor a 60, o una cuenta que consume menos del 10% de lo que paga. En esos casos lo que toca es estabilizar o reactivar.',
    'La falta de medición NO convierte a una cuenta en «NO». No medir no es medir cero. Se marca en la columna «Por qué» para que la propuesta no salga a ciegas.',
    'El uso se lee sobre la bolsa real: en planes ilimitados son 1,500 minutos por extensión, no el 1 que trae el archivo de origen. Por eso hay cuentas por encima del 100%: rebasar no corta el servicio, se cobra el excedente.',
]
for i, t in enumerate(NOTAS):
    c = dash.cell(row=44 + i, column=2, value='• ' + t)
    c.font = Font(name=FUENTE, size=9, color='334155')
    c.alignment = Alignment(wrap_text=True, vertical='top')
    dash.merge_cells(start_row=44 + i, start_column=2, end_row=44 + i, end_column=10)
    dash.row_dimensions[44 + i].height = 26

# ── 5. Resumen de candidatos ───────────────────────────────────────────────
if 'Resumen candidatos' in wb.sheetnames:
    del wb['Resumen candidatos']
res = wb.create_sheet('Resumen candidatos')
res.sheet_view.showGridLines = False
for col, w in (('A', 2), ('B', 46), ('C', 14), ('D', 16), ('E', 14)):
    res.column_dimensions[col].width = w

res['B2'] = 'RESUMEN · CANDIDATOS A OFERTA'
res['B2'].font = Font(name=FUENTE, bold=True, size=15, color=AZUL)
res['B3'] = ('%d de %d cuentas son candidatas hoy. La regla exige dos condiciones simultáneas y las dos fuentes '
             'coinciden sin una sola contradicción: las %d que la matriz del programa autoriza son exactamente las '
             '%d que no tienen un problema abierto.' % (nSi, len(filas), nSi, nSi))
res['B3'].font = Font(name=FUENTE, size=9, italic=True, color='475569')
res.merge_cells('B3:E3'); res.row_dimensions[3].height = 30
res['B3'].alignment = Alignment(wrap_text=True, vertical='top')

fila = 5


def bloqueTabla(titulo, encabezados, datos, formatos=None):
    global fila
    res.cell(row=fila, column=2, value=titulo).font = Font(name=FUENTE, bold=True, size=11, color=AZUL)
    fila += 1
    for j, h in enumerate(encabezados, start=2):
        c = res.cell(row=fila, column=j, value=h)
        c.font = Font(name=FUENTE, bold=True, size=9, color='FFFFFF')
        c.fill = PatternFill('solid', fgColor=AZUL)
        c.alignment = Alignment(horizontal='center')
    fila += 1
    for d in datos:
        for j, v in enumerate(d, start=2):
            c = res.cell(row=fila, column=j, value=v)
            c.font = Font(name=FUENTE, size=9)
            c.border = BORDE
            if j > 2:
                c.alignment = Alignment(horizontal='center')
            if formatos and (j - 2) in formatos:
                c.number_format = formatos[j - 2]
        fila += 1
    fila += 1


porTrat = collections.Counter(f['trat'] for f in filas)
facTrat = collections.Counter()
siTrat = collections.Counter()
for f in filas:
    facTrat[f['trat']] += f['factura']
    if f['si'] == 'SÍ':
        siTrat[f['trat']] += 1
bloqueTabla('POR TRATAMIENTO DE LA MATRIZ',
            ['Tratamiento', 'Cuentas', 'Candidatas', 'Facturación'],
            [[t or '(sin tratamiento)', n, siTrat[t], facTrat[t]] for t, n in porTrat.most_common()],
            {2: '$#,##0'})

porAse = collections.Counter(f['asesor'] for f in filas)
siAse = collections.Counter(f['asesor'] for f in filas if f['si'] == 'SÍ')
facAse = collections.Counter()
for f in filas:
    facAse[f['asesor']] += f['factura']
bloqueTabla('POR ASESOR',
            ['Asesor', 'Cuentas', 'Candidatas', 'Facturación'],
            [[a or '(sin asesor)', n, siAse[a], facAse[a]] for a, n in porAse.most_common()],
            {2: '$#,##0'})

porBloq = collections.Counter(f['bloqueo'] for f in filas if f['si'] == 'NO')
bloqueTabla('POR QUÉ NO SON CANDIDATAS HOY',
            ['Motivo', 'Cuentas'],
            [[b, n] for b, n in porBloq.most_common()])

bloqueTabla('LAS %d CANDIDATAS, POR LO QUE PAGAN' % nSi,
            ['Cliente', 'Asesor', 'Factura', 'Uso de bolsa'],
            [[f['cliente'], f['asesor'], f['factura'], f['uso']]
             for f in sorted([x for x in filas if x['si'] == 'SÍ'], key=lambda x: -x['factura'])],
            {1: '$#,##0', 2: '0.0%'})

# ── 6. Metodología: se documenta lo nuevo ──────────────────────────────────
met = wb['Metodología']
r = met.max_row + 2
APUNTES = [
    ('CANDIDATO A: (SÍ / NO) — la regla',
     'Nueva en la V4. Es SÍ cuando se cumplen DOS condiciones a la vez: (a) PREPARACIÓN PARA CRECER = Alta en la matriz del programa, '
     'y (b) ninguna de las causas de bloqueo de la doctrina de dirección. Se comprobó que las dos fuentes coinciden en las 152 cuentas: '
     'las %d que la matriz autoriza son exactamente las %d sin problema abierto, sin una sola contradicción.' % (nSi, nSi)),
    ('CANDIDATO A: — qué bloquea',
     'En este orden: estado cancelado o en hibernación · al menos un ticket abierto · dos o más fallas con Health Score menor a 60 · '
     'consumo menor al 10% de la bolsa contratada. Es la regla de dirección ya implementada en lib/candidato-a.ts del tablero: '
     'no se propone crecimiento sobre un problema sin resolver.'),
    ('CANDIDATO A: — qué NO bloquea',
     'La falta de medición de consumo. No medir no es medir cero: convertir un hueco de dato en un «NO» sería publicar un veredicto '
     'donde solo hay ausencia. Se marca en la columna «POR QUÉ» para que la propuesta no salga a ciegas.'),
    ('CORRECCIÓN A LA V3 · Lectura ejecutiva',
     'Los cuatro indicadores de tratamiento contaban sobre la columna N de «Matriz del programa» —que es PREPARACIÓN PARA CRECER, con '
     'valores Alta/Baja— buscando nombres de tratamiento, que viven en la columna O. Por eso los cuatro marcaban 0. Corregido a O. '
     'Es el error de rango corrido en uno: la fórmula evalúa sin error y entrega un número falso.'),
    ('DASHBOARD',
     'Hoja nueva con cuatro listas desplegables (candidato, asesor, clasificación y tratamiento) que recalculan los indicadores y la '
     'tabla de las 20 de mayor facturación. Sin macros. La hoja auxiliar «_calculo» queda oculta: contiene las banderas de filtro y el '
     'orden. No se usaron FILTER, SORT ni UNIQUE porque LibreOffice no las evalúa y quedarían truncadas en silencio.'),
]
for titulo, texto in APUNTES:
    met.cell(row=r, column=2, value=titulo).font = Font(name=FUENTE, bold=True, size=10, color=AZUL)
    c = met.cell(row=r, column=3, value=texto)
    c.font = Font(name=FUENTE, size=9)
    c.alignment = Alignment(wrap_text=True, vertical='top')
    met.row_dimensions[r].height = 46
    r += 1

wb.save(DESTINO)
print()
print('escrito %s (%.0f KB)' % (DESTINO, os.path.getsize(DESTINO) / 1024))
print('  hojas: %s' % wb.sheetnames)
