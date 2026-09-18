"""Vuelca el reporte de crecimiento a JSON para poder analizarlo.

   El archivo vive en el Escritorio de OneDrive; el volcado va a D:, que es
   donde se trabaja.
"""
import sys, io, os, json, openpyxl
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

ORIGEN = r'C:\Users\manni\OneDrive\Escritorio\Reporte_Clientes_AAA_AA_A_Crecimiento_2026-09-09 V3.xlsx'
SALIDA = r'D:\Windows\Projects\callpicker-cs\data\reporte-crecimiento.json'

wb = openpyxl.load_workbook(ORIGEN, data_only=True)
libro = {}

for nm in wb.sheetnames:
    ws = wb[nm]
    filas = [list(r) for r in ws.iter_rows(values_only=True)]
    # La fila de encabezado es la primera que tiene 'CID' o 4+ celdas con texto
    iCab = None
    for i, f in enumerate(filas[:8]):
        vals = [str(c).strip() for c in f if c is not None and str(c).strip()]
        if any(v.upper() == 'CID' for v in vals) or len(vals) >= 5:
            iCab = i; break
    libro[nm] = {'filaCabecera': iCab, 'filas': filas}
    print('%-22s %4d filas · encabezado en la fila %s' % (nm, len(filas), (iCab or 0) + 1))

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
with io.open(SALIDA, 'w', encoding='utf-8') as f:
    json.dump(libro, f, ensure_ascii=False, default=str)
print()
print('escrito %s (%.1f KB)' % (SALIDA, os.path.getsize(SALIDA) / 1024))

# ── Encabezados completos de cada hoja ─────────────────────────────────────
for nm, d in libro.items():
    i = d['filaCabecera']
    if i is None:
        continue
    cab = [str(c).strip() if c is not None else '' for c in d['filas'][i]]
    print()
    print('=== %s ===' % nm)
    for j, c in enumerate(cab):
        if c:
            print('   %2d %s' % (j, c[:70]))
