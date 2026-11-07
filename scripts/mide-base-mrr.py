# -*- coding: utf-8 -*-
u"""MIDE `GRC_BASE_MRR` DESDE EL EXPORT INSTITUCIONAL. Solo lectura.

POR QUE EXISTE
--------------
`GRC_BASE_MRR` (app/churn/grc-reporte.ts) es el DENOMINADOR de todo el modulo
Churn. Su comentario dice «SALE DEL EXPORT INSTITUCIONAL, ya no se captura a
mano», pero ningun guion lo calculaba: se tecleaba. Un espejo de constantes
tecleado a mano deja de ser espejo en cuanto la fuente se mueve, y aqui la
fuente se mueve CADA SEMANA — el export reescribe meses ya cerrados.
[[feedback-verificar-antes-asegurar]]

SE CALCULA DEL EXPORT, NO SE COPIA DEL TABLERO
----------------------------------------------
Es la diferencia entre una prueba y una tautologia. `verifica-contra-tablero.py`
TRANSCRIBE las cifras que publica Zoho; este guion las CALCULA del archivo. Que
las dos coincidan al centavo significa algo. Si yo copiara el tablero aqui,
la seccion 3 de aquel pasaria por construccion sin comprobar nada.
[[feedback-metricas-derivadas-origen]]

QUE ES LA BASE
--------------
La suma de «MRR Inicio Contrato (BCY)» sobre TODAS las filas del mes — las
3,654 del export institucional, no solo las de movimiento. Por eso el export
filtrado no sirve: sin las filas «MRR estable» la base son migajas.

USO
---
    python scripts/mide-base-mrr.py "C:/ruta/CRF.xlsx"
    python scripts/mide-base-mrr.py "C:/ruta/CRF.xlsx" --ts
        imprime el bloque TypeScript listo para pegar en grc-reporte.ts
"""
import collections
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENT = 0.005

MESES = [u'Enero', u'Febrero', u'Marzo', u'Abril', u'Mayo', u'Junio', u'Julio',
         u'Agosto', u'Septiembre', u'Octubre', u'Noviembre', u'Diciembre']

if len(sys.argv) < 2:
    raise SystemExit(u'Falta la ruta del .xlsx institucional.')
ORIGEN = sys.argv[1]
SOLO_TS = '--ts' in sys.argv[2:]

wb = openpyxl.load_workbook(ORIGEN, read_only=True, data_only=True)
hoja = wb[wb.sheetnames[0]]
it = hoja.iter_rows(values_only=True)
cab = [u'' if c is None else unicode(c).strip() if str is bytes else str(c).strip()
       for c in next(it)]
idx = {c: i for i, c in enumerate(cab)}

COL_MES = u'Mes Nombre'
COL_BASE = u'MRR Inicio Contrato (BCY)'
COL_MOV = u'Movimiento MRR'

# SIN LAS COLUMNAS NO HAY VEREDICTO. Un total calculado sobre una columna que no
# se encontro sale como 0 y se lee como «la base es cero».
faltan = [c for c in (COL_MES, COL_BASE) if c not in idx]
if faltan:
    print(u'\n  *** NO SE PUEDE CONCLUIR: faltan columnas %s' % u', '.join(faltan))
    print(u'      El archivo trae: %s' % u', '.join(c for c in cab if c))
    wb.close()
    sys.exit(2)

base = collections.OrderedDict()
filas = collections.Counter()
estables = collections.Counter()
for r in it:
    if all(v is None or str(v).strip() == u'' for v in r):
        continue
    mes = str(r[idx[COL_MES]] or u'').strip()
    if not mes:
        continue
    v = r[idx[COL_BASE]]
    base[mes] = base.get(mes, 0.0) + (float(v) if isinstance(v, (int, float)) else 0.0)
    filas[mes] += 1
    if COL_MOV in idx:
        mov = str(r[idx[COL_MOV]] or u'').strip().lower()
        if u'estable' in mov:
            estables[mes] += 1

orden = [m for m in MESES if m in base]
sobran = [m for m in base if m not in MESES]
if sobran:
    print(u'\n  *** meses que no reconozco: %s' % u', '.join(sobran))
    wb.close()
    sys.exit(2)

# CONTROL: sin filas «MRR estable» el archivo es el FILTRADO y la base es falsa.
sin_estables = [m for m in orden if estables[m] == 0]
if COL_MOV in idx and len(sin_estables) == len(orden):
    print(u'\n  *** ESTE ARCHIVO NO TRAE NI UNA FILA «MRR estable».')
    print(u'      Es el export del tablero, filtrado por movimiento: NO trae base')
    print(u'      de MRR. Lo que calcularia aqui serian migajas. No se usa.')
    wb.close()
    sys.exit(2)

if SOLO_TS:
    print(u'export const GRC_BASE_MRR: Record<string, number> = {')
    for m in orden:
        print(u'  %-11s %.2f,' % (m + u':', round(base[m], 2)))
    print(u'}')
    wb.close()
    sys.exit(0)

print(u'\n  BASE DE MRR MEDIDA DESDE %s' % os.path.basename(ORIGEN))
print(u'  ' + u'=' * 68)
print(u'    MES          FILAS   «MRR estable»        MRR INICIO')
for m in orden:
    print(u'    %-11s %6s %10s        %16s'
          % (m, format(filas[m], ','), format(estables[m], ','),
             u'$' + format(round(base[m], 2), ',.2f')))
print(u'    %-11s %6s %10s        %16s'
      % (u'TOTAL', format(sum(filas.values()), ','),
         format(sum(estables.values()), ','),
         u'$' + format(round(sum(base.values()), 2), ',.2f')))

# ── CONTRA LO QUE EL REPO TIENE HOY ─────────────────────────────────────────
ruta_ts = os.path.join(RAIZ, 'app', 'churn', 'grc-reporte.ts')
texto = io.open(ruta_ts, encoding='utf-8').read()
bloque = re.search(r'GRC_BASE_MRR[^{]*\{(.*?)\n\}', texto, re.S)
print(u'\n  CONTRA `GRC_BASE_MRR` DE grc-reporte.ts')
print(u'  ' + u'-' * 68)
if not bloque:
    print(u'  *** no encontre el bloque en %s. No concluyo nada.' % ruta_ts)
    wb.close()
    sys.exit(2)

actual = {}
for mm, vv in re.findall(r'(\w+)\s*:\s*([0-9]+(?:\.[0-9]+)?)', bloque.group(1)):
    actual[mm] = float(vv)

difs = 0
for m in orden:
    hay = actual.get(m)
    if hay is None:
        print(u'    FALTA  %-11s el repo no lo tiene · medido %s'
              % (m, u'$' + format(round(base[m], 2), ',.2f')))
        difs += 1
        continue
    d = round(base[m], 2) - round(hay, 2)
    if abs(d) < CENT:
        print(u'    ok     %-11s %s' % (m, u'$' + format(round(hay, 2), ',.2f')))
    else:
        print(u'    CAMBIA %-11s repo %s -> medido %s   (%s%s)'
              % (m, u'$' + format(round(hay, 2), ',.2f'),
                 u'$' + format(round(base[m], 2), ',.2f'),
                 u'+' if d > 0 else u'', format(round(d, 2), ',.2f')))
        difs += 1
for m in actual:
    if m not in orden:
        print(u'    SOBRA  %-11s esta en el repo y NO en el archivo' % m)
        difs += 1

print(u'')
if difs:
    print(u'  %d mes(es) distintos. Con `--ts` sale el bloque listo para pegar.' % difs)
else:
    print(u'  La base del repo coincide al centavo con el export.')
wb.close()
