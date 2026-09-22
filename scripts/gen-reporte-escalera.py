# -*- coding: utf-8 -*-
"""Arma el Excel del reporte V5 desde data/crecimiento-escalera.json.

   Separado del calculo a proposito: `crecimiento-escalera.py` decide y este
   solo pinta. Asi el veredicto se puede auditar sin abrir Excel, y cambiar el
   formato no puede alterar un numero.
"""
import io
import json
import os
import sys
from collections import Counter, defaultdict

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FECHA = '2026-09-21'
DEST = os.path.join('D:' + os.sep, 'Proyectos', 'CP',
                    'Reporte_Crecimiento_Escalera_Producto_%s_V5.xlsx' % FECHA)

d = json.load(io.open(os.path.join(RAIZ, 'data', 'crecimiento-escalera.json'), encoding='utf-8'))
F = d['cuentas']

# ── Paleta y estilos ──────────────────────────────────────────────────────
AZUL = '1B3FCC'
MARINO = '0F172A'
GRIS = '64748B'
FONDO_CAB = 'E8EEFC'
FUENTE = 'Arial'

h1 = Font(name=FUENTE, size=15, bold=True, color=MARINO)
h2 = Font(name=FUENTE, size=11, bold=True, color=AZUL)
cab = Font(name=FUENTE, size=9, bold=True, color='FFFFFF')
txt = Font(name=FUENTE, size=10, color=MARINO)
txt_s = Font(name=FUENTE, size=9, color=MARINO)
nota = Font(name=FUENTE, size=9, color=GRIS, italic=True)
fill_cab = PatternFill('solid', fgColor=AZUL)
fill_sec = PatternFill('solid', fgColor=FONDO_CAB)
borde = Border(bottom=Side(style='thin', color='D8DEE9'))
wrap = Alignment(wrap_text=True, vertical='top')


def tabla(ws, fila, cols, datos, anchos=None):
    """Pinta una tabla con encabezado. Devuelve la fila siguiente."""
    for j, c in enumerate(cols):
        cel = ws.cell(row=fila, column=2 + j, value=c)
        cel.font = cab
        cel.fill = fill_cab
        cel.alignment = Alignment(wrap_text=True, vertical='center')
    for i, r in enumerate(datos):
        for j, v in enumerate(r):
            cel = ws.cell(row=fila + 1 + i, column=2 + j, value=v)
            cel.font = txt_s
            cel.border = borde
            cel.alignment = wrap if isinstance(v, str) and len(str(v)) > 40 else Alignment(vertical='top')
    if anchos:
        for j, a in enumerate(anchos):
            ws.column_dimensions[get_column_letter(2 + j)].width = a
    return fila + len(datos) + 2


def titulo(ws, fila, t, sub=None):
    ws.cell(row=fila, column=2, value=t).font = h1
    if sub:
        c = ws.cell(row=fila + 1, column=2, value=sub)
        c.font = nota
        return fila + 3
    return fila + 2


wb = Workbook()

# ══════════════════════════════════════════════════════════════════════════
#  1 · DASHBOARD
# ══════════════════════════════════════════════════════════════════════════
ws = wb.active
ws.title = 'Dashboard'
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'ESCALERA DE PRODUCTO · CANDIDATOS A CRECIMIENTO',
           'Callpicker · Dirección de Satisfacción al Cliente · corte del 21 de septiembre de 2026 · '
           '221 cuentas de la cartera gestionada')

pel = Counter(f['peldano'] for f in F)
acc = [f for f in F if f['accionable']]
blo = [f for f in F if not f['accionable']]
r2 = Counter(f['oferta'] for f in F if f['peldano'] == '2 · VyC')

ws.cell(row=r, column=2, value='DÓNDE ESTÁ CADA CUENTA').font = h2
r += 1
r = tabla(ws, r,
          ['Peldaño', 'Cuentas', 'Accionables hoy', 'Bloqueadas', 'Qué se le ofrece'],
          [[p,
            n,
            sum(1 for f in F if f['peldano'] == p and f['accionable']),
            sum(1 for f in F if f['peldano'] == p and not f['accionable']),
            {'1 · CE': 'Subir a Visibilidad y Control',
             '2 · VyC': 'Integración CRM con API, o Asistente Virtual',
             'otro producto': 'Calltracking, conmutador o números sueltos: fuera de la escalera',
             'sin dato de producto': 'Nada: primero hay que registrar qué tiene'}.get(p, '')]
           for p, n in pel.most_common()]
          + [['TOTAL', len(F), len(acc), len(blo), '']],
          anchos=[24, 10, 16, 12, 56])

ws.cell(row=r, column=2, value='PELDAÑO 2 · POR QUÉ RAMA').font = h2
r += 1
r = tabla(ws, r, ['Rama', 'Cuentas', 'Accionables', 'De dónde sale la señal'],
          [[o, n,
            sum(1 for f in F if f['oferta'] == o and f['accionable']),
            {'Integracion CRM con API': 'Visitó la sección Desarrolladores del panel en algún corte',
             'Asistente Virtual': '60% o más de sus llamadas son entrantes',
             'VyC sin senal: cualificar en llamada': 'Ninguna de las dos señales: NO se propone a ciegas',
             'Ya tiene el siguiente escalon': 'Ya tiene API o Asistente Virtual registrado'}.get(o, '')]
           for o, n in r2.most_common()],
          anchos=[40, 10, 12, 62])

ws.cell(row=r, column=2, value='CALLPICKER CHAT · corre en paralelo, no es un peldaño').font = h2
r += 1
r = tabla(ws, r, ['Situación', 'Cuentas'],
          [['Ya tienen Chat (bandera, servicio, plan, adopción o ticket de Chat)',
            sum(1 for f in F if f['tiene_Chat'])],
           ['Candidatas: 2 o más señales y sin Chat', sum(1 for f in F if f['chat_candidata'])],
           ['Con etiquetas de canal digital en sus números', sum(1 for f in F if f['dids_digital'])],
           ['Resto: sin señal suficiente para proponerlo',
            len(F) - sum(1 for f in F if f['tiene_Chat']) - sum(1 for f in F if f['chat_candidata'])]],
          anchos=[64, 12])

ws.cell(row=r, column=2, value='POR QUÉ SE BLOQUEAN LAS 100').font = h2
r += 1
import re as _re
mot = Counter(_re.sub(r'\d+[\d.,]*', 'N', b).strip() for f in blo for b in f['bloqueos'])
r = tabla(ws, r, ['Motivo', 'Cuentas'], [[m, n] for m, n in mot.most_common()],
          anchos=[52, 12])

# ══════════════════════════════════════════════════════════════════════════
#  2 · ESCALERA POR CUENTA
# ══════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet('Escalera por cuenta')
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'LAS 221 CUENTAS, UNA POR RENGLÓN',
           'El peldaño sale de tres fuentes (adopción, servicio de la ficha, plan facturado). '
           'La columna «Respaldo» dice cuántas lo confirman: 1 significa que una sola fuente lo sostiene.')

COLS = ['CID', 'Cliente', 'Asesor', 'Estado', 'Peldaño', 'Qué ofrecerle', 'Respaldo',
        'Nivel adopción CE', 'Nivel adopción VyC', 'Servicio en la ficha', 'Plan facturado',
        'Monto', '% consumo', '% entrantes', 'Visitas Desarrolladores',
        'Números', 'Núm. con canal digital', 'Ya tiene Chat', 'Ya tiene AV', 'Ya tiene API',
        'Tickets', 'Fallas', 'Health Score', 'Accionable', 'Qué lo bloquea']

def pct(v):
    return None if v is None else round(v, 1)

datos = []
for f in sorted(F, key=lambda x: (x['peldano'], -(x['monto_ultimo_corte'] or 0))):
    resp = max(f['fuentes_CE'], f['fuentes_VyC'])
    datos.append([
        f['cid'] or '(sin CID)', f['empresa'], f['asesor'], f['estado'],
        f['peldano'], f['oferta'] or '—', resp,
        f['nivel_adop_CE'] or '(sin registro)', f['nivel_adop_VyC'] or '(sin registro)',
        (f['servicio_ficha'] or '(vacío)')[:120],
        (f['plan_ultimo_corte'] or '(sin corte)')[:70],
        f['monto_ultimo_corte'], pct(f['pct_consumo']), pct(f['pct_entrantes']),
        f['visitas_desarrolladores'], f['dids'], f['dids_digital'],
        'Sí' if f['tiene_Chat'] else 'no', 'Sí' if f['tiene_AV'] else 'no',
        'Sí' if f['tiene_API'] else 'no',
        f['tickets'], f['fallas'], f['health_score'],
        'Sí' if f['accionable'] else 'NO',
        '; '.join(f['bloqueos']) or '—',
    ])
tabla(ws, r, COLS, datos,
      anchos=[9, 30, 10, 12, 20, 34, 9, 16, 16, 44, 34, 11, 11, 11, 13, 9, 13, 10, 10, 10, 8, 8, 11, 10, 40])
ws.freeze_panes = 'C%d' % (r + 1)

# ══════════════════════════════════════════════════════════════════════════
#  3 · UNA HOJA POR PELDAÑO
# ══════════════════════════════════════════════════════════════════════════
def hoja_peldano(nombre, titulo_txt, sub, seleccion, cols_extra, fila_extra):
    w = wb.create_sheet(nombre)
    w.sheet_view.showGridLines = False
    rr = titulo(w, 2, titulo_txt, sub)
    sel = sorted(seleccion, key=lambda x: -(x['monto_ultimo_corte'] or 0))
    base = ['CID', 'Cliente', 'Asesor', 'Monto', 'Health Score']
    filas = [[f['cid'] or '(sin CID)', f['empresa'], f['asesor'],
              f['monto_ultimo_corte'], f['health_score']] + fila_extra(f) for f in sel]
    tabla(w, rr, base + cols_extra, filas,
          anchos=[9, 32, 10, 11, 11] + [22] * len(cols_extra))
    w.freeze_panes = 'C%d' % (rr + 1)
    return len(sel)


n1 = hoja_peldano(
    'P1 · CE a VyC',
    'PELDAÑO 1 · CLIENTES EN COMUNICACIÓN EMPRESARIAL',
    'Son los que pueden subir a Visibilidad y Control. «Respaldo 1» significa que una sola de las tres '
    'fuentes lo dice: conviene confirmarlo antes de llamar.',
    [f for f in F if f['peldano'] == '1 · CE'],
    ['Respaldo', 'Nivel adopción CE', 'Servicio en la ficha', 'Plan facturado', '% consumo',
     'Accionable', 'Qué lo bloquea'],
    lambda f: [f['fuentes_CE'], f['nivel_adop_CE'] or '(sin registro)',
               (f['servicio_ficha'] or '(vacío)')[:90], (f['plan_ultimo_corte'] or '(sin corte)')[:60],
               pct(f['pct_consumo']), 'Sí' if f['accionable'] else 'NO',
               '; '.join(f['bloqueos']) or '—'])

n2 = hoja_peldano(
    'P2 · VyC a API o AV',
    'PELDAÑO 2 · CLIENTES QUE YA TIENEN VISIBILIDAD Y CONTROL',
    'La rama la decide la EVIDENCIA, no el giro: visitas a la sección Desarrolladores para la integración '
    'con API, y peso de llamadas entrantes para el Asistente Virtual. Quien no tiene ninguna de las dos '
    'señales se cualifica en llamada; no se le propone a ciegas.',
    [f for f in F if f['peldano'] == '2 · VyC'],
    ['Rama', 'Visitas Desarrolladores', '% entrantes', '% consumo', 'Ya tiene API', 'Ya tiene AV',
     'Accionable', 'Qué lo bloquea'],
    lambda f: [f['oferta'] or '—', f['visitas_desarrolladores'], pct(f['pct_entrantes']),
               pct(f['pct_consumo']), 'Sí' if f['tiene_API'] else 'no',
               'Sí' if f['tiene_AV'] else 'no', 'Sí' if f['accionable'] else 'NO',
               '; '.join(f['bloqueos']) or '—'])

n3 = hoja_peldano(
    'P3 · Callpicker Chat',
    'CALLPICKER CHAT · CANDIDATAS POR EVIDENCIA, NO POR SECTOR',
    'Entra quien NO tiene Chat y reúne dos o más señales registradas: varios números, etiquetas de canal '
    'digital en sus propios números, mención del KAM, o varios sitios. El giro NO dispara por sí solo.',
    [f for f in F if f['chat_candidata']],
    ['Números', 'Núm. con canal digital', 'Etiquetas que lo delatan', 'Señales', 'Peldaño de voz',
     'Accionable', 'Qué lo bloquea'],
    lambda f: [f['dids'], f['dids_digital'], ', '.join(f['etiquetas_digital']) or '—',
               '; '.join(f['chat_senales']), f['peldano'],
               'Sí' if f['accionable'] else 'NO', '; '.join(f['bloqueos']) or '—'])

# ══════════════════════════════════════════════════════════════════════════
#  4 · DISCREPANCIAS Y HUECOS
# ══════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet('Datos a corregir')
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'LO QUE HAY QUE CORREGIR EN EL ORIGEN',
           'Ninguno de estos se arregla con más análisis. Cada renglón es una cuenta cuyo dato impide '
           'colocarla bien en la escalera.')

sin_fuente = [f for f in F if f['peldano'] == 'sin dato de producto']
una_fuente = [f for f in F if (f['tiene_CE'] and f['fuentes_CE'] == 1) or (f['tiene_VyC'] and f['fuentes_VyC'] == 1)]
sin_corte = [f for f in F if not f['plan_ultimo_corte'] and f['estado'] in ('activo', 'en_riesgo')]
sin_medir = [f for f in F if f['pct_consumo'] is None and f['plan_ultimo_corte']]

ws.cell(row=r, column=2, value='RESUMEN').font = h2
r += 1
r = tabla(ws, r, ['Problema', 'Cuentas', 'Por qué importa'],
          [['Sin ningún dato de producto', len(sin_fuente),
            'No se puede colocar en la escalera: no se sabe qué tiene contratado'],
           ['Peldaño sostenido por UNA sola fuente', len(una_fuente),
            'Puede ser correcto, pero nadie lo ha confirmado por segunda vía'],
           ['Cuenta viva sin corte de facturación', len(sin_corte),
            'Sin plan, monto ni consumo: la propuesta saldría sin dimensionar'],
           ['Con corte pero consumo no medible', len(sin_medir),
            'El plan no declara bolsa: no medir NO es medir cero'],
           ['tiene_ia_voz / tiene_ia_chat en falso para las 221', 221,
            'Los campos que dirían quién ya tiene Asistente Virtual están vacíos en la tabla'],
           ['tiene_integracion_api en verdadero solo en 1 cuenta', 220,
            'La rama de API se está decidiendo por visitas al panel, no por registro']],
          anchos=[46, 10, 70])

ws.cell(row=r, column=2, value='CUENTAS SIN NINGÚN DATO DE PRODUCTO').font = h2
r += 1
r = tabla(ws, r, ['CID', 'Cliente', 'Asesor', 'Estado', 'Servicio en la ficha'],
          [[f['cid'] or '(sin CID)', f['empresa'], f['asesor'], f['estado'],
            (f['servicio_ficha'] or '(vacío)')[:80]] for f in sin_fuente],
          anchos=[9, 32, 10, 12, 60])

ws.cell(row=r, column=2, value='CUENTAS VIVAS SIN CORTE DE FACTURACIÓN').font = h2
r += 1
tabla(ws, r, ['CID', 'Cliente', 'Asesor', 'Estado', 'Servicio en la ficha'],
      [[f['cid'] or '(sin CID)', f['empresa'], f['asesor'], f['estado'],
        (f['servicio_ficha'] or '(vacío)')[:80]] for f in sin_corte],
      anchos=[9, 32, 10, 12, 60])

# ══════════════════════════════════════════════════════════════════════════
#  5 · METODOLOGÍA
# ══════════════════════════════════════════════════════════════════════════
ws = wb.create_sheet('Metodología y límites')
ws.sheet_view.showGridLines = False
r = titulo(ws, 2, 'METODOLOGÍA, FUENTES Y LÍMITES')
ws.column_dimensions['B'].width = 34
ws.column_dimensions['C'].width = 118

MET = [
    ('La escalera', 'Instrucción de dirección del 21 de septiembre de 2026. (1) Quien tiene Comunicación '
     'Empresarial sube a Visibilidad y Control. (2) Quien ya tiene VyC recibe integración a CRM con API o '
     'un Asistente Virtual, según su análisis. (3) Quien tiene varios números y trabaja WhatsApp, redes o '
     'cuyo sector opera así, recibe Callpicker Chat.'),
    ('Universo', '221 cuentas de la tabla `cuentas`. 219 con CID utilizable: TATSA no tiene y Biolaboratorio '
     'Sadat trae «0», que no es un CID sino un hueco. Sin CID la cuenta no cruza contra ninguna otra fuente.'),
    ('De dónde sale el peldaño', 'De TRES fuentes, en este orden: (1) la tabla `adopcion_producto`, que el '
     'propio equipo mantiene y trae un nivel por producto y cuenta —«Voz CE», «Voz VyC»—; (2) el texto de '
     '`servicio` y `servicios_json` de la ficha; (3) el último plan facturado del informe de cortes. '
     'La columna «Respaldo» dice cuántas de las tres lo confirman.'),
    ('Por qué tres y no una', 'Porque discrepan. El servicio de la ficha es texto libre: 180 valores '
     'distintos para 179 cuentas, y 21 de ellos son una nota y no un servicio («En revisión no existe '
     'información», «Subcuenta integrada: PROBEMEDIC · CID 68328»). El plan facturado cubre 167 cuentas y '
     'la ficha 179; juntas, 214 de 221. Sola, ninguna llega.'),
    ('Rama del peldaño 2 — API', 'Se propone integración a CRM con API a quien visitó la sección '
     'Desarrolladores del panel en algún corte. Es la única evidencia REGISTRADA de interés técnico que '
     'existe hoy. Límite conocido, heredado del reporte anterior: una a tres visitas no son un proyecto, '
     'son una pregunta pendiente — la señal abre la conversación, no la cierra.'),
    ('Rama del peldaño 2 — Asistente Virtual', 'Se propone a quien tiene 60% o más de llamadas entrantes en '
     'su último corte: un Asistente Virtual atiende lo que ENTRA. Quien no llega a ese umbral y tampoco '
     'visitó Desarrolladores queda como «cualificar en llamada»; no se le propone a ciegas.'),
    ('Por qué el giro NO decide', 'El reporte V4 concluyó, cuenta por cuenta, que «WhatsApp y las '
     'integraciones se están deduciendo del sector y no del registro». Además `giro` no agrupa: 189 cuentas '
     'con valor en 183 formas distintas de escribirlo. Aquí el sector es un modulador de la conversación, '
     'nunca el disparador de la oferta.'),
    ('Qué SÍ dispara Chat', 'Evidencia registrada, dos señales o más: cinco o más números; etiquetas de canal '
     'digital en sus propios números (WhatsApp, redes, campañas, landing, marketing); mención del KAM en '
     'Observaciones; o tres o más sitios. Los DIDs son el aporte nuevo de esta versión: es registro, no '
     'inferencia.'),
    ('Quién ya tiene Chat', 'Se cruzan CINCO fuentes y basta una: la bandera `tiene_chat_activo`, el texto '
     'del servicio, el plan facturado, la tabla de adopción, y tener al menos un ticket de producto Chat. '
     'Por separado se contradicen —28 cuentas traen la bandera en verdadero sin ninguna evidencia detrás, y '
     'Pastelería Antares declara Chat en su servicio con la bandera en falso—.'),
    ('Qué bloquea', 'La doctrina ya implementada en lib/candidato-a.ts: cuenta cancelada o en hibernación · '
     'ticket abierto · dos o más fallas con Health Score menor a 60 · consumo por debajo del 10% de la bolsa. '
     'No se propone crecimiento sobre un problema sin resolver.'),
    ('Qué NO bloquea', 'La falta de medición. No medir no es medir cero: 57 cuentas tienen corte pero su plan '
     'no declara bolsa contra la cual medir, y convertir ese hueco en un «NO» sería publicar un veredicto '
     'donde solo hay ausencia. Se marcan y siguen siendo elegibles.'),
    ('Ticket abierto, un aviso', 'El export de tickets no trae campo de estado: un ticket abierto es el que no '
     'tiene fecha de cierre. Con ese criterio solo hay 2 tickets abiertos en 5,697, así que ese bloqueo casi '
     'no discrimina hoy. Es el dato, no el cruce.'),
    ('Minutos', 'La regla de dirección: en planes ilimitados el archivo trae 1 y equivale a 1,500 minutos por '
     'extensión. Misma implementación que lib/plan-minutos.ts, incluido el arreglo del 18 de septiembre por el '
     'que un plan con bolsa declarada ya no se descarta por mencionar «números virtuales».'),
    ('Facturación', 'El monto es el del último corte real, no la columna `facturacion` guardada en la cuenta: '
     'esa se sobreescribe en servidor y se desvía —GRUPO FRISA trae $1,622 guardados contra $16,539 reales—. '
     'Sirve para ordenar, no para cifrar.'),
    ('Lo que este reporte NO hace', 'No evalúa «preparación para crecer» en el sentido del programa —champion '
     'identificado, necesidad validada, presupuesto, próximo paso acordado—: nada de eso vive en los datos. '
     'Esta versión responde QUÉ ofrecerle a cada cliente y si hay algo que lo impida hoy. El CUÁNDO y el A '
     'QUIÉN siguen siendo trabajo del asesor.'),
    ('Reproducirlo', 'python scripts/crecimiento-escalera.py genera data/crecimiento-escalera.json con el '
     'detalle y los conteos; python scripts/gen-reporte-escalera.py arma este Excel a partir de ese JSON. '
     'El cálculo y el formato están separados: cambiar el formato no puede alterar un número.'),
]
for k, v in MET:
    ws.cell(row=r, column=2, value=k).font = h2
    c = ws.cell(row=r, column=3, value=v)
    c.font = txt_s
    c.alignment = wrap
    ws.row_dimensions[r].height = max(30, 13 * (len(v) // 108 + 1))
    r += 1

for hoja in wb.worksheets:
    hoja.sheet_properties.tabColor = AZUL

os.makedirs(os.path.dirname(DEST), exist_ok=True)
wb.save(DEST)

print('=== REPORTE V5 ===')
print('  %s' % DEST)
print('  %.0f KB' % (os.path.getsize(DEST) / 1024.0))
print()
print('  Escalera por cuenta:     %3d renglones' % len(F))
print('  P1 · CE a VyC:           %3d' % n1)
print('  P2 · VyC a API o AV:     %3d' % n2)
print('  P3 · Callpicker Chat:    %3d' % n3)
print('  Datos a corregir:        %3d sin producto · %3d vivas sin corte'
      % (len(sin_fuente), len(sin_corte)))
assert len(F) == 221, 'se perdieron cuentas'
print('\n  las 221 cuentas estan en la hoja de detalle  OK')
