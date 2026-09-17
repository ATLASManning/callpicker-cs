"""Los titulos del detalle tienen que ser LOS DEL EXPORT, caracter por caracter.

   Direccion los fijo asi: quien compare la pantalla contra el archivo tiene que
   encontrar la misma palabra, sin traducir «Perdida real» a «Ingreso Perdido
   Contrato (BCY) Real» en la cabeza.

   Esta prueba lee las cabeceras REALES del .xlsx y las compara contra el
   arreglo COLUMNAS de la pagina. Si alguien abrevia un titulo «para que se vea
   mejor», o si el export cambia una cabecera, esto falla.
"""
import io, re, sys, openpyxl

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

XLSX = sys.argv[1] if len(sys.argv) > 1 else r'C:\Users\manni\Downloads\Septiembre.xlsx'
PAGE = r'D:\Windows\Projects\callpicker-cs\app\facturacion\page.tsx'

# Columnas del export que NO son del detalle: son la llave del mes.
NO_DETALLE = ('Mes Nombre', 'Año_Mes fecha')

wb = openpyxl.load_workbook(XLSX, read_only=True)
ws = wb[wb.sheetnames[0]]
cab = [str(c).strip() for c in next(ws.iter_rows(values_only=True)) if c is not None]
wb.close()
EXCEL = [c for c in cab if c not in NO_DETALLE]

t = io.open(PAGE, encoding='utf-8').read()
bloque = re.search(r'const COLUMNAS: ColDet\[\] = \[(.*?)\n\]\n', t, re.S)
if not bloque:
    raise SystemExit('No encontre el arreglo COLUMNAS en la pagina.')
CODE = re.findall(r"h:\s*'([^']+)'", bloque.group(1))
DEL_CRUCE = re.findall(r"h:\s*'([^']+)'[^}]*cruce:\s*true", bloque.group(1))
DEL_EXPORT = [h for h in CODE if h not in DEL_CRUCE]

print('=== TITULOS DEL DETALLE CONTRA LOS DEL EXCEL ===')
print('  %-3s %-52s %s' % ('#', 'cabecera del .xlsx', 'titulo en pantalla'))
mal = 0
for i in range(max(len(EXCEL), len(DEL_EXPORT))):
    e = EXCEL[i] if i < len(EXCEL) else '(falta en el codigo)'
    c = DEL_EXPORT[i] if i < len(DEL_EXPORT) else '(falta en el codigo)'
    igual = e == c
    mal += 0 if igual else 1
    print('  %-3d %-52s %-52s %s' % (i + 1, e, c, 'igual' if igual else '*** DIFIERE'))

print()
print('  del export: %d en el .xlsx · %d en la pantalla' % (len(EXCEL), len(DEL_EXPORT)))
print('  del cruce con la cartera (no vienen del export): %s' % ', '.join(DEL_CRUCE))
print('  el CSV se arma del mismo arreglo: %s'
      % ('si' if 'CSV_CAB = [...COLUMNAS.map(c => c.h)' in t else '*** NO'))

if mal:
    print()
    print('*** %d TITULOS NO COINCIDEN ***' % mal)
    raise SystemExit(1)
print()
print('=== LOS %d TITULOS COINCIDEN CARACTER POR CARACTER ===' % len(EXCEL))
