# -*- coding: utf-8 -*-
"""El Excel del veredicto: a qué es candidato cada cuenta, o por qué no.

   Solo pinta. Todo el juicio vive en `veredicto-candidatura.py`, para que
   cambiar el formato no pueda alterar un número.
"""
import io
import json
import os
import re
import sys
from collections import Counter

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FECHA = '2026-09-22'
DEST = os.path.join('D:' + os.sep, 'Proyectos', 'CP',
                    'Candidatos_Crecimiento_%s_V8.xlsx' % FECHA)

D = json.load(io.open(os.path.join(RAIZ, 'data', 'veredicto-candidatura.json'), encoding='utf-8'))
F = D['cuentas']
AUD = json.load(io.open(os.path.join(RAIZ, 'data', 'auditorias-candidatura.json'), encoding='utf-8'))['casos']

AZUL, MARINO, GRIS = '1B3FCC', '0F172A', '64748B'
VERDE, AMBAR, ROJO = '15803D', 'B45309', 'B91C1C'
FUENTE = 'Arial'
h1 = Font(name=FUENTE, size=15, bold=True, color=MARINO)
h2 = Font(name=FUENTE, size=11, bold=True, color=AZUL)
cabF = Font(name=FUENTE, size=9, bold=True, color='FFFFFF')
txt = Font(name=FUENTE, size=9, color=MARINO)
nota = Font(name=FUENTE, size=9, color=GRIS, italic=True)
fill_cab = PatternFill('solid', fgColor=AZUL)
borde = Border(bottom=Side(style='thin', color='D8DEE9'))
wrap = Alignment(wrap_text=True, vertical='top')


def tabla(ws, fila, cols, datos, anchos=None, colorear=None):
    for j, c in enumerate(cols):
        cel = ws.cell(row=fila, column=2 + j, value=c)
        cel.font, cel.fill = cabF, fill_cab
        cel.alignment = Alignment(wrap_text=True, vertical='center')
    for i, r in enumerate(datos):
        for j, v in enumerate(r):
            cel = ws.cell(row=fila + 1 + i, column=2 + j, value=v)
            cel.font = txt
            cel.border = borde
            cel.alignment = wrap if isinstance(v, str) and len(str(v)) > 40 else Alignment(vertical='top')
            if colorear and j == 0:
                col = colorear(r)
                if col:
                    cel.font = Font(name=FUENTE, size=9, bold=True, color=col)
    if anchos:
        for j, a in enumerate(anchos):
            ws.column_dimensions[get_column_letter(2 + j)].width = a
    return fila + len(datos) + 2


def titulo(ws, fila, t, sub=None):
    ws.cell(row=fila, column=2, value=t).font = h1
    if sub:
        ws.cell(row=fila + 1, column=2, value=sub).font = nota
        return fila + 3
    return fila + 2


def color_ver(r):
    v = str(r[0])
    if v.startswith('NO CANDIDATO'):
        return GRIS
    if 'no hoy' in v:
        return AMBAR
    return VERDE


wb = Workbook()

# ══════════════════════════════════════════════════════════════════════════
#  1 · VEREDICTO
# ══════════════════════════════════════════════════════════════════════════
ws = wb.active
ws.title = 'Veredicto'
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'A QUÉ ES CANDIDATO CADA CLIENTE',
           'Callpicker · Dirección de Satisfacción al Cliente · 22 de septiembre de 2026 · '
           'las 221 cuentas de la cartera, ninguna sin respuesta')

cc = Counter(f['candidato_a'] for f in F)
r = tabla(ws, r, ['Candidato a', 'Cuentas', 'Se puede abordar hoy', 'Bloqueadas', 'Qué lo sostiene'],
          [[p, n,
            sum(1 for f in F if f['candidato_a'] == p and not f['bloqueado']),
            sum(1 for f in F if f['candidato_a'] == p and f['bloqueado']),
            {'Asistente Virtual': 'Llamadas entrantes sin contestar, medidas en Análisis de Llamadas',
             'Visibilidad y Control': 'Está en Comunicación Empresarial: es el siguiente escalón',
             'Integración API': 'Visitó la sección Desarrolladores del panel',
             'Callpicker Chat': 'Varios números y etiquetas de canal digital en ellos',
             'Plan de adopción': 'Usa menos del 40% de lo que paga: venderle más aceleraría la baja',
             'Más capacidad': 'Consume 85% o más de su bolsa: ya está en el techo',
             '—': 'No hay señal; en la columna «Por qué» se dice exactamente qué falta'}.get(p, '')]
           for p, n in cc.most_common()]
          + [['TOTAL', len(F), sum(1 for f in F if not f['bloqueado']),
              sum(1 for f in F if f['bloqueado']), '']],
          anchos=[24, 10, 20, 12, 72], colorear=None)

ws.cell(row=r, column=2, value='DE DÓNDE SALE CADA VEREDICTO').font = h2
r += 1
r = tabla(ws, r, ['Fuente', 'Cuentas'],
          [[s, n] for s, n in Counter(f['fuente_veredicto'] for f in F).most_common()],
          anchos=[46, 10])

ws.cell(row=r, column=2, value='LO QUE APORTÓ ANÁLISIS DE LLAMADAS').font = h2
r += 1
con_ll = [f for f in F if f['ll_entrantes']]
r = tabla(ws, r, ['Concepto', 'Valor'],
          [['Cuentas con lectura de llamadas utilizable', len(con_ll)],
           ['Cuentas sin lectura (ahí no se afirma nada)', len(F) - len(con_ll)],
           ['Veredictos que decide la lectura de llamadas',
            sum(1 for f in F if f['fuente_veredicto'].startswith('Análisis de Llamadas'))],
           ['Cuentas donde DESMIENTE al % de entrantes del corte',
            sum(1 for f in F if f['ll_desmiente_al_corte'])],
           ['Llamadas entrantes sin contestar en la cartera medida',
            sum(f['ll_sin_contestar'] or 0 for f in con_ll)]],
          anchos=[56, 16])

# ══════════════════════════════════════════════════════════════════════════
#  2 · LAS 221, UNA POR RENGLÓN
# ══════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet('Las 221 cuentas')
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'EL VEREDICTO, CUENTA POR CUENTA',
           'Ordenadas por lo que pagan. «CANDIDATO A X — no hoy» significa que el caso existe pero hay '
           'algo abierto que resolver primero; la columna «Qué lo bloquea» dice qué.')

COLS = ['Veredicto', 'Candidato a', 'Cliente', 'CID', 'Asesor', 'Monto', 'Por qué',
        'De qué tamaño', 'Avisos', 'Fuente',
        'Extensiones', 'Min/ext', 'Minutos consumidos', 'Llamadas totales',
        'Entrantes', 'Sin contestar', '% sin contestar', '% por menú',
        'Números', 'Sin asignar', 'Visitas Desarrolladores',
        'Tickets', 'Fallas', 'Tickets/ext', 'Mediana resolución (h)', 'Categoría top',
        'Servicio en la ficha', '% consumo', 'Health Score',
        'Tiene auditoría', 'Qué lo bloquea']
datos = []
for f in sorted(F, key=lambda x: (x['candidato_a'] == '—', -(x['monto_ultimo_corte'] or 0))):
    datos.append([
        f['veredicto'], f['candidato_a'], f['empresa'], f['cid'] or '(sin CID)', f['asesor'],
        f['monto_ultimo_corte'], f['porque'],
        f['dimension'], ' · '.join(f['avisos']) or '—', f['fuente_veredicto'],
        f['extensiones'], f['min_por_extension'], f['minutos_consumidos'], f['llamadas_total'],
        f['ll_entrantes'], f['ll_sin_contestar'], f['ll_pct_sin_contestar'], f['ll_pct_menu'],
        f['dids'], f['dids_libres'], f['visitas_desarrolladores'],
        f['tickets'], f['fallas'], f['tickets_por_extension'],
        f['tickets_horas_mediana'], f['tickets_categoria_top'],
        (f['servicio_ficha'] or '(vacío)')[:110],
        round(f['pct_consumo'], 1) if f['pct_consumo'] is not None else None,
        f['health_score'], 'Sí' if f['tiene_auditoria'] else '',
        '; '.join(f['bloqueos']) or '—',
    ])
tabla(ws, r, COLS, datos,
      anchos=[34, 22, 30, 9, 10, 11, 74, 60, 60, 30,
              11, 10, 15, 13, 11, 12, 13, 11, 9, 11, 13,
              9, 8, 11, 16, 20, 44, 11, 11, 12, 38],
      colorear=color_ver)
ws.freeze_panes = 'D%d' % (r + 1)

# ══════════════════════════════════════════════════════════════════════════
#  3 · UNA HOJA POR PRODUCTO
# ══════════════════════════════════════════════════════════════════════════
for prod, hoja in [('Asistente Virtual', 'Asistente Virtual'),
                   ('Visibilidad y Control', 'Visibilidad y Control'),
                   ('Integración API', 'Integración API'),
                   ('Callpicker Chat', 'Callpicker Chat'),
                   ('Plan de adopción', 'Plan de adopción'),
                   ('Más capacidad', 'Más capacidad')]:
    sel = [f for f in F if f['candidato_a'] == prod]
    if not sel:
        continue
    w = wb.create_sheet(hoja[:31])
    w.sheet_view.showGridLines = False
    hoy = sum(1 for f in sel if not f['bloqueado'])
    rr = titulo(w, 2, 'CANDIDATOS A %s' % prod.upper(),
                '%d cuentas · %d se pueden abordar hoy · %d tienen algo que resolver primero'
                % (len(sel), hoy, len(sel) - hoy))
    tabla(w, rr,
          ['Se puede hoy', 'Cliente', 'CID', 'Asesor', 'Monto', 'Por qué', 'De qué tamaño',
           'Avisos', 'Fuente', 'Entrantes', 'Sin contestar', '% sin contestar', 'Qué lo bloquea'],
          [['SÍ' if not f['bloqueado'] else 'no', f['empresa'], f['cid'] or '(sin CID)',
            f['asesor'], f['monto_ultimo_corte'], f['porque'], f['dimension'],
            ' · '.join(f['avisos']) or '—', f['fuente_veredicto'],
            f['ll_entrantes'], f['ll_sin_contestar'], f['ll_pct_sin_contestar'],
            '; '.join(f['bloqueos']) or '—']
           for f in sorted(sel, key=lambda x: (x['bloqueado'], -(x['ll_sin_contestar'] or 0),
                                               -(x['monto_ultimo_corte'] or 0)))],
          anchos=[12, 32, 9, 10, 11, 80, 62, 60, 30, 11, 12, 13, 38],
          colorear=lambda r: VERDE if r[0] == 'SÍ' else AMBAR)
    w.freeze_panes = 'D%d' % (rr + 1)

# ══════════════════════════════════════════════════════════════════════════
#  4 · AUDITORÍAS
# ══════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet('Auditorías cruzadas')
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'LAS 33 AUDITORÍAS DE CUENTA',
           'Cada una trae una candidatura que ya escribió un analista leyendo el caso completo. '
           'Pesa más que cualquier regla automática: cuando la auditoría nombra un producto que el '
           'cliente todavía no tiene, ése es el veredicto.')

por_nombre = {f['empresa']: f for f in F}
datos = []
for a in sorted(AUD, key=lambda x: x['nombre']):
    f = next((x for x in F if x['tiene_auditoria'] and x['auditoria_productos'] == a['productos_que_nombra']
              and x['auditoria_estado'] == a['estado']), None)
    datos.append([
        a['nombre'], a['estado'], a['fecha_auditoria'],
        ', '.join(a['productos_que_nombra']) or '(ninguno)',
        f['veredicto'] if f else 'La cuenta no está en la cartera',
        (a['potencial_corto'][0] if a['potencial_corto'] else '')[:200],
        (a['senal_alarma'] or '')[:200],
    ])
tabla(ws, r, ['Auditoría', 'Estado', 'Fecha', 'Productos que nombra', 'Veredicto de esta cuenta',
              'Primer potencial de corto plazo', 'Señal de alarma'],
      datos, anchos=[34, 16, 11, 40, 36, 74, 74])

# ══════════════════════════════════════════════════════════════════════════
#  5 · METODOLOGÍA
# ══════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet('Metodología')
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'CÓMO SE DECIDIÓ CADA VEREDICTO')
ws.column_dimensions['B'].width = 32
ws.column_dimensions['C'].width = 120

MET = [
    ('El orden de decisión', 'Se aplica en este orden y el primero que acierta manda. (1) La AUDITORÍA, '
     'si la cuenta tiene una de las 33: ahí un analista ya leyó el caso completo. (2) ANÁLISIS DE '
     'LLAMADAS: si pierde el 20% o más de sus entrantes, Asistente Virtual. (3) La ESCALERA: CE sube a '
     'VyC; con VyC y visitas a Desarrolladores, Integración API. (4) CHAT por evidencia en sus números. '
     '(5) MÁS CAPACIDAD si consume 85% o más. (6) PLAN DE ADOPCIÓN si usa menos del 40%. (7) Y si nada '
     'acierta, NO CANDIDATO diciendo exactamente qué falta.'),
    ('Por qué las llamadas mandan sobre el corte', 'Antes el Asistente Virtual se decidía con el «% de '
     'llamadas entrantes» del corte de facturación. Ese dato se equivoca EN LAS DOS DIRECCIONES: no veía '
     'a Alianza Multimarca, con 40,935 llamadas sin contestar y un corte que decía 0% de entrantes; y '
     'señalaba a Gruas el Toques, que contesta el 96%. De 113 cuentas con ambas cifras, 42 estaban mal '
     'clasificadas. Ahora decide lo que importa: cuántas llamadas ENTRAN y NO se contestan.'),
    ('Reglas de llamadas que se respetan', 'Las del propio módulo, en lib/llamadas-cuenta.ts: entrante '
     '«Lost» y saliente «Lost» NO son lo mismo y jamás se suman —la primera es un cliente al que nadie '
     'contestó, la segunda una marcación que no conectó—; «Self_service» NO es una falla, el menú sí '
     'resolvió la llamada y va del lado atendido; y el denominador es siempre el total de entrantes. '
     'Volumen mínimo de 30 llamadas: por debajo no se interpreta.'),
    ('Cobertura de llamadas', '144 de las 221 cuentas tienen lectura utilizable, de dos extracciones con '
     'criterio distinto (86 de clientes con consumo de 0 a 40% de su plan, 62 del resto medido). En las '
     '77 restantes no se afirma nada: si además tienen VyC, se cae al dato grueso del corte y la columna '
     '«Fuente» lo dice como «señal de respaldo».'),
    ('Las auditorías', '33 archivos en app/auditoria/*-data.ts, cada uno con potencial_corto, '
     'potencial_largo, tácticas y señal de alarma escritas por un analista. 31 cruzaron contra la '
     'cartera; 2 son de cuentas que no existen en `cuentas` (Brand-Kern-Liebers y RDS / Invest Vacay) y '
     'se declaran aparte en vez de perderse. Dos cruzaron por alias verificado a mano: FINSUS → Finsus '
     'Growth y LABSUS → labsus lab.'),
    ('Qué NO se propone', 'Lo que el cliente ya tiene. Si la auditoría pide Chat y la cuenta ya usa Chat, '
     'se pasa al siguiente producto que nombre. Y no se propone más capacidad a quien usa menos del 40% '
     'de la que paga: el reporte anterior lo dejó dicho —«ampliarla acelera la baja en lugar de '
     'crecerla»— y por eso esas cuentas salen como Plan de adopción, que es una acción concreta, no un NO.'),
    ('Qué bloquea, y qué no', 'Bloquea: cuenta cancelada o en hibernación, ticket abierto, dos o más '
     'fallas con Health Score bajo 60, o consumo por debajo del 10%. Un bloqueo NO borra la candidatura: '
     'el veredicto dice «CANDIDATO A X — no hoy», porque perder la oportunidad de vista es peor que '
     'saber que hay algo que resolver antes. NO bloquea la falta de medición: no medir no es medir cero.'),
    ('Qué significa NO CANDIDATO', 'Que hoy no hay señal, y se dice cuál falta. De los 35: 17 no tienen '
     'corte de facturación, 11 no tienen registrado qué servicio contrataron, 4 están fuera de la '
     'escalera (calltracking, conmutador), 2 tienen un plan que no declara bolsa, y el resto usa su '
     'servicio a media máquina sin ninguna señal de canal. Ninguno se resuelve con más análisis: todos '
     'requieren un dato de origen o una llamada.'),
    ('Reproducirlo', 'python scripts/crecimiento-escalera.py → la escalera por cuenta · python '
     'scripts/extrae-auditorias.py → las 33 candidaturas · python scripts/veredicto-candidatura.py → el '
     'veredicto · python scripts/gen-reporte-veredicto.py → este Excel. El juicio vive en el tercero; '
     'este último solo pinta.'),
]
for k, v in MET:
    ws.cell(row=r, column=2, value=k).font = h2
    c = ws.cell(row=r, column=3, value=v)
    c.font, c.alignment = txt, wrap
    ws.row_dimensions[r].height = max(30, 12.5 * (len(v) // 112 + 1))
    r += 1

for hoja in wb.worksheets:
    hoja.sheet_properties.tabColor = AZUL

os.makedirs(os.path.dirname(DEST), exist_ok=True)
wb.save(DEST)

print('=== REPORTE V8 ===')
print('  %s  (%.0f KB)' % (DEST, os.path.getsize(DEST) / 1024.0))
print()
for p, n in cc.most_common():
    print('  %-24s %3d   hoy: %3d' % (p, n, sum(1 for f in F if f['candidato_a'] == p and not f['bloqueado'])))
assert sum(cc.values()) == 221, 'no cierra'
print('  %-24s %3d   (cierra)' % ('TOTAL', sum(cc.values())))
