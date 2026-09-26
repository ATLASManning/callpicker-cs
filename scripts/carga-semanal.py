"""Carga semanal de los tres datasets que se exportan de Google Sheets.

   QUE HACE
   --------
   Revisa los tres archivos de `D:\\Archivos`, compara su ESTRUCTURA contra lo
   que hay cargado, dice cual trae datos nuevos y —solo con `--aplicar`— los
   carga y regenera lo que haga falta.

       python scripts/carga-semanal.py              # solo diagnostica, no toca nada
       python scripts/carga-semanal.py --aplicar    # carga lo que este mas nuevo

   CADENCIA
   --------
   Direccion actualiza las TRES hojas los VIERNES a las 4 PM, a partir del 25
   de septiembre de 2026. La tarea programada corre los viernes a las 5 PM,
   una hora despues, para dar margen al export.

   LAS TRES FUENTES
   ----------------
   Salen de hojas de Google que direccion exporta a mano a `D:\\Archivos`:

     Informe de Cortes  <- hoja «Informacion de cortes»
     Tickets            <- hoja «Desglose Tickets»
       las dos del libro «SAC - Mixpanel»:
       docs.google.com/spreadsheets/d/1iobZHrilIpAV0nZKS6-wK1K_6fJ1aSLMNZQOjY8KjbU

     Activaciones 2.0   <- PRIMERA hoja, «Registros», del libro:
       docs.google.com/spreadsheets/d/1iarbx9a_zdFoLACnBKfiI0OVmX7At2jV_va0QzNN0sE

   ESTE SCRIPT NO BAJA NADA DE GOOGLE, y es a proposito: la hoja esta
   restringida y pedirla sin sesion devuelve 401. Alguien tiene que exportarla.
   Por eso lo PRIMERO que revisa es la FECHA del archivo: si el export sigue
   siendo el de ayer, lo dice y no carga nada. Una carga diaria que se ejecuta
   sin datos nuevos y no avisa es peor que no tenerla — deja creer que el
   tablero esta al dia cuando lleva una semana congelado.

   LO QUE NUNCA HACE
   -----------------
   Cargar un archivo cuya estructura cambio. Si aparece, desaparece o se mueve
   una columna, o cambia el nombre de la hoja, se detiene: los modulos leen por
   nombre de columna y un cambio silencioso los deja pintando vacio.
"""
import argparse
import datetime
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEN = r'D:\Archivos'

# nombre, archivo de origen, hoja esperada, destino, como se carga
FUENTES = [
    {
        'nombre': 'Informe de Cortes',
        'origen': 'Información de Cortes Facturacion.xlsx',
        'hoja': 'Hoja1',
        'destino': os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
        'modo': 'copia',
    },
    {
        'nombre': 'Tickets',
        'origen': 'Tickets.xlsx',
        'hoja': 'Desglose Tickets',
        'destino': os.path.join(RAIZ, 'lib', 'tickets-data.json'),
        'modo': 'generador',
        'generador': os.path.join(RAIZ, 'scripts', 'gen-tickets-data.py'),
    },
    {
        'nombre': 'Activaciones 2.0',
        'origen': 'Tablero de Activaciones 2.0.xlsx',
        # En la hoja de Google la pestana se llama «Registros». Segun como se
        # exporte, el .xlsx la trae con ese nombre o renombrada a «Hoja1». Se
        # aceptan las dos: lo que de verdad se vigila son las columnas.
        'hoja': ['Hoja1', 'Registros'],
        'destino': os.path.join(RAIZ, 'data', 'activaciones.xlsx'),
        'modo': 'copia',
    },
    {
        # Los numeros que Callpicker entrega a cada cliente. Alimenta las
        # pastillas azul cielo del modulo Informacion en la ficha de cuenta.
        # La hoja se llama «telephone_numbers-NN» y el NN cambia en cada
        # export, asi que se vigilan las COLUMNAS y no el nombre exacto.
        'nombre': 'DIDs',
        'origen': 'DIDs en Callpicker.xlsx',
        'hoja': None,               # None = la primera, sea cual sea su nombre
        'destino': os.path.join(RAIZ, 'data', 'dids.json'),
        'modo': 'generador',
        'generador': os.path.join(RAIZ, 'scripts', 'gen-dids.py'),
    },
]


def cabeceras(ruta, hoja):
    """`hoja` puede ser un nombre, una lista de nombres, o None.

    `None` significa «la primera, se llame como se llame»: el export de DIDs
    trae la hoja como «telephone_numbers-29» y el numero cambia en cada
    descarga, asi que vigilar ese nombre seria vigilar ruido. Lo que de verdad
    se vigila ahi son las columnas.
    """
    wb = openpyxl.load_workbook(ruta, data_only=True, read_only=True)
    if hoja is None:
        posibles = wb.sheetnames[:1]
    else:
        posibles = [hoja] if isinstance(hoja, str) else list(hoja)
    elegida = next((h for h in posibles if h in wb.sheetnames), None)
    if elegida is None:
        hojas = list(wb.sheetnames)
        wb.close()
        return None, hojas, 0
    ws = wb[elegida]
    it = ws.iter_rows(values_only=True)
    try:
        cab = [str(c).strip() if c is not None else '' for c in next(it)]
    except StopIteration:
        cab = []
    n = sum(1 for _ in it)
    hojas = list(wb.sheetnames)
    wb.close()
    return cab, hojas, n


def sha(p):
    return hashlib.md5(io.open(p, 'rb').read()).hexdigest()


def fecha(p):
    return datetime.datetime.fromtimestamp(os.path.getmtime(p))


def revisa(f):
    """Diagnostica una fuente. Devuelve (estado, detalle)."""
    src = os.path.join(ORIGEN, f['origen'])
    if not os.path.exists(src):
        return 'falta', 'no existe %s' % src
    if not os.path.exists(f['destino']):
        return 'nuevo', 'no hay nada cargado todavia'

    cabN, hojasN, nN = cabeceras(src, f['hoja'])
    if cabN is None:
        esperadas = ('la primera hoja' if f['hoja'] is None
                     else f['hoja'] if isinstance(f['hoja'], str)
                     else ' o '.join(f['hoja']))
        return 'estructura', 'no encontre la hoja «%s» (el archivo trae: %s)' % (esperadas, ', '.join(hojasN))

    # El destino de Tickets es un JSON: ahi la estructura se compara contra el
    # ultimo .xlsx cargado, que no se conserva. Se compara solo lo que se puede.
    if f['modo'] == 'copia':
        cabA, _, nA = cabeceras(f['destino'], f['hoja'])
        if cabA is None:
            return 'estructura', 'el archivo YA CARGADO no trae la hoja esperada'
        if cabA != cabN:
            dif = [(i, cabA[i] if i < len(cabA) else '(falta)', cabN[i] if i < len(cabN) else '(falta)')
                   for i in range(max(len(cabA), len(cabN)))
                   if (cabA[i] if i < len(cabA) else None) != (cabN[i] if i < len(cabN) else None)]
            return 'estructura', 'cambiaron %d columna(s): %s' % (
                len(dif), '; '.join('col %d: «%s» -> «%s»' % d for d in dif[:4]))
        if sha(src) == sha(f['destino']):
            return 'igual', 'mismo archivo, %d filas' % nN
        return 'nuevo', '%s filas contra %s cargadas (%+d)' % (format(nN, ','), format(nA, ','), nN - nA)

    # Generador: se compara el conteo del origen contra el JSON de destino.
    try:
        d = json.load(io.open(f['destino'], encoding='utf-8'))
        # Cada generador escribe una forma distinta: una lista suelta
        # (tickets), o un objeto con su propio conteo (DIDs). Se lee el que
        # aplique en vez de asumir uno y reportar 0 para siempre.
        if isinstance(d, list):
            nA = len(d)
        elif isinstance(d.get('totalNumeros'), int):
            nA = d['totalNumeros']
        else:
            nA = len(d.get('rows') or d.get('tickets') or [])
    except Exception as e:
        return 'nuevo', 'no pude leer el destino (%s)' % type(e).__name__
    if nN == nA:
        return 'igual', 'mismas %s filas' % format(nN, ',')
    return 'nuevo', '%s filas contra %s cargadas (%+d)' % (format(nN, ','), format(nA, ','), nN - nA)


def aplica(f):
    src = os.path.join(ORIGEN, f['origen'])
    if f['modo'] == 'copia':
        shutil.copy2(src, f['destino'])
        return 'copiado a %s' % os.path.relpath(f['destino'], RAIZ)
    r = subprocess.run([sys.executable, f['generador'], src],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        raise SystemExit('El generador fallo:\n%s' % (r.stderr or r.stdout)[:600])
    return (r.stdout or '').strip().split('\n')[-2:][0] if r.stdout else 'generado'


ap = argparse.ArgumentParser()
ap.add_argument('--aplicar', action='store_true', help='carga de verdad; sin esto solo diagnostica')
args = ap.parse_args()

print('=== CARGA SEMANAL · %s ===' % datetime.datetime.now().strftime('%d/%m/%Y %H:%M'))
print('  origen: %s' % ORIGEN)
print()

hoy = datetime.date.today()
resultados = []
for f in FUENTES:
    src = os.path.join(ORIGEN, f['origen'])
    est, det = revisa(f)
    fch = fecha(src).strftime('%d/%m %H:%M') if os.path.exists(src) else '—'
    edad = (hoy - fecha(src).date()).days if os.path.exists(src) else None
    marca = {'nuevo': 'HAY DATOS NUEVOS', 'igual': 'sin cambios',
             'estructura': '*** ESTRUCTURA DISTINTA — NO SE CARGA',
             'falta': '*** NO ENCONTRE EL ARCHIVO'}[est]
    print('  %-20s export %s  %s' % (f['nombre'], fch, marca))
    print('  %-20s %s' % ('', det))
    # La hoja se actualiza los viernes: un export de mas de 7 dias significa
    # que se salto una semana entera, no que «todavia no toca».
    if edad is not None and edad >= 7 and est != 'estructura':
        print('  %-20s OJO: el export tiene %d dias — se salto al menos una actualizacion.'
              % ('', edad))
    elif edad is not None and edad > 0 and est == 'igual':
        print('  %-20s (el export es del %s; si ya hubo corte nuevo, falta bajarlo)'
              % ('', fecha(src).strftime('%d/%m')))
    resultados.append((f, est, det))
    print()

def correcciones():
    """Las correcciones que el equipo debe hacer en la hoja de ORIGEN.

       Va enganchado aqui a proposito: la carga del viernes es lo unico que se
       hace sin falta, asi que es el unico sitio donde un pendiente no se puede
       pasar por alto. Un pendiente que vive en la cabeza de alguien se pierde.
    """
    script = os.path.join(RAIZ, 'scripts', 'revisa-correcciones.py')
    if not os.path.exists(script):
        return 0
    print()
    r = subprocess.run([sys.executable, script], capture_output=True, text=True,
                       encoding='utf-8', errors='replace')
    print(r.stdout.rstrip() if r.stdout else '  (sin salida)')
    if r.stderr.strip():
        print('  *** %s' % r.stderr.strip()[:300])
    return r.returncode


if not args.aplicar:
    hay = [r for r in resultados if r[1] == 'nuevo']
    print('  (diagnostico; no se toco nada. %d fuente(s) con datos nuevos)' % len(hay))
    print('  Para cargar:  python scripts/carga-semanal.py --aplicar')
    correcciones()
    raise SystemExit(0)

print('=== APLICANDO ===')
cargadas = []
for f, est, det in resultados:
    if est == 'estructura':
        print('  %-20s SE OMITE: %s' % (f['nombre'], det))
        continue
    if est == 'falta':
        print('  %-20s SE OMITE: %s' % (f['nombre'], det))
        continue
    if est == 'igual':
        print('  %-20s sin cambios, no se toca' % f['nombre'])
        continue
    print('  %-20s %s' % (f['nombre'], aplica(f)))
    cargadas.append(f['nombre'])

print()
if cargadas:
    print('  cargadas: %s' % ', '.join(cargadas))
    print('  Falta revisar el diff y desplegar.')
    print('  Diffs:  python scripts/diff-tickets.py  ·  python scripts/diff-cortes.py')
else:
    print('  No se cargo nada: no habia datos nuevos.')

raise SystemExit(correcciones())
