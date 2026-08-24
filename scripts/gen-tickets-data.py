"""
Regenera lib/tickets-data.json desde el Excel de Zoho Desk (Desglose Tickets).
Uso: python scripts/gen-tickets-data.py "D:\\Archivos\\Tickets.xlsx"

Notas de la transformación:
- ticket_id se toma del enlace (URL), NO de la columna TICKET_ID: esa columna
  pierde precisión en Excel (float64 no representa exacto un entero de 19
  dígitos) — confirmado comparando contra el dataset anterior, donde
  ticket_id no coincidia con el id real embebido en el enlace.
- fecha = FECHA (ya viene truncada al mes por Zoho) formateada YYYY-MM.
  mes = mismo valor (se usa en dos lugares distintos del código con ese
  nombre de campo, se mantienen ambos por compatibilidad).
- duracion_hrs se calcula parseando "X horas Y min" -> round(X + Y/60, 1),
  igual que el dataset anterior (verificado registro por registro).
- cierre/duracion pueden venir vacíos en tickets aún abiertos.
"""
import json
import re
import sys
import openpyxl

SRC = sys.argv[1] if len(sys.argv) > 1 else r'D:\Archivos\Tickets.xlsx'
OUT = r'D:\Windows\Projects\callpicker-cs\lib\tickets-data.json'

DUR_RE = re.compile(r'(\d+)\s*horas?\s*(\d+)\s*min')

def duracion_hrs(duracion):
    if not duracion:
        return None
    m = DUR_RE.search(duracion)
    if not m:
        return None
    h, mi = int(m.group(1)), int(m.group(2))
    return round(h + mi / 60, 1)

def ticket_id_from_enlace(enlace):
    if not enlace:
        return ''
    return enlace.rstrip('/').rsplit('/', 1)[-1]

wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
ws = wb['Desglose Tickets']
rows = list(ws.iter_rows(min_row=2, values_only=True))

out = []
for r in rows:
    cid, num, empresa, fecha, ticket_id_col, categoria, subcategoria, es_falla, producto, \
        enlace, propietario, apertura, cierre, duracion, prioridad = r[:15]

    if cid is None or empresa is None:
        continue  # fila vacía / de relleno

    fecha_str = fecha.strftime('%Y-%m') if fecha else ''

    out.append({
        'cid':            str(cid),
        'num':            str(num) if num is not None else '',
        'empresa':        str(empresa).strip(),
        'fecha':          fecha_str,
        'ticket_id':      ticket_id_from_enlace(enlace),
        'categoria':      categoria or '',
        'subcategoria':   subcategoria or '',
        'es_falla':       es_falla or 'No',
        'producto':       producto or '',
        'enlace':         enlace or '',
        'propietario':    propietario or '',
        'apertura':       apertura or '',
        'cierre':         cierre or '',
        'duracion':       duracion or '',
        'duracion_hrs':   duracion_hrs(duracion),
        'prioridad':      prioridad or '',
        'mes':            fecha_str,
    })

print(f'Filas leídas: {len(rows)}  ->  filas escritas: {len(out)}')

# Verificación rápida contra el dataset anterior
try:
    prev = json.load(open(OUT, encoding='utf-8'))
    print(f'Dataset anterior: {len(prev)} tickets  ->  nuevo: {len(out)} tickets  (diff: {len(out) - len(prev):+d})')
except FileNotFoundError:
    pass

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(out, f, ensure_ascii=False, indent=1)

print('Escrito en', OUT)
