# -*- coding: utf-8 -*-
u"""Prueba que los conciliadores de auditoría SABEN FALLAR.

    python -I scripts/prueba-conciliadores-al-reves.py [lineacel|odontoprev|todos]

Rompe una COPIA del documento publicado de mil maneras —una cifra, una suma, una
nota, las marcas de conciliación, el lector entero— y exige que el guion salga
con código 1 en cada caso. Y después comprueba que el documento INTACTO sale con
código 0: un guion que siempre falla no sirve para nada.

── POR QUÉ EXISTE ─────────────────────────────────────────────────────────────
Una regla sólo se prueba con lo que NO debe pasar. Un conciliador que nunca se
ha visto en rojo es una decoración ([[feedback-probar-al-reves]]).

── LA TRAMPA QUE YA NOS COSTÓ UNA VEZ ─────────────────────────────────────────
En Cargo Lift, la rotura «romper los SVG» usaba `replace('<title>', ..., 1)` y
tocaba el `<title>` del `<head>`: la rotura NUNCA llegaba al gráfico y pareció
que el guion se le escapaba. Era la PRUEBA la que estaba mal. Por eso aquí cada
rotura verifica que el texto que busca aparece, y cuántas veces, ANTES de
aplicarse. **Una rotura que no se aplica se lee igual que un candado que no
sirve.**
"""
from __future__ import division

import io
import os
import shutil
import subprocess
import sys
import tempfile

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable


def doc(nombre):
    return os.path.join(RAIZ, 'public', 'auditorias', nombre)


def gui(nombre):
    return os.path.join(RAIZ, 'scripts', nombre)


CASOS = {
    'lineacel': {
        'guion': gui('concilia-auditoria-lineacel.py'),
        'doc': doc('Auditoria-LINEACEL-Salientes-2026.html'),
        'roturas': [
            (u'cambiar el total de llamadas', u'"total": 181816', u'"total": 181800'),
            (u'cambiar los minutos del periodo', u'"mins": 118924', u'"mins": 118900'),
            (u'quitarle una llamada a un mes',
             u'[91, 30133, 34547', u'[91, 30133, 34540'),
            (u'romper el reparto por desenlace',
             u'"Redirected": 109680', u'"Redirected": 109600'),
            (u'descuadrar la tabla de agentes',
             u'{"s": "Elsa López", "n": 26249', u'{"s": "Elsa López", "n": 26200'),
            (u'borrar las notas de corrección', u'<!--NOTA:INICIO-->', u'<!--NOTA-BORRADA-->'),
            (u'borrar la declaración de desfases',
             u'<!-- CONCILIACION:MARCADOS', u'<!-- NADA:'),
            (u'revertir el superlativo de la peor hora',
             u'De las horas en que de verdad se marca, la peor es 12:00 (51.5%)',
             u'Peor: 12:00 (51.5%)'),
            (u'revertir el superlativo del día más bajo',
             u'de lunes a viernes el día más bajo es el miércoles',
             u'El miércoles es el día más bajo'),
            (u'volver a meter a Claudia en el plan',
             u'<td>KAM (Erick) + SAC</td>', u'<td>KAM (Claudia) + SAC</td>'),
            (u'romper el lector entero: matar el const D',
             u'const D=', u'const DD_ROTO='),
        ],
    },
    'odontoprev': {
        'guion': gui('concilia-auditoria-odontoprev.py'),
        'doc': doc('Auditoria-Odontoprev-Trafico-2026.html'),
        'roturas': [
            # Las celdas son `<td class="r">`, no `class="n"`. Y «>1,291<» sale
            # dos veces, así que se rompe por una celda que SÍ es única: el
            # guardián de «la rotura no se aplica» cazó los dos errores.
            (u'descuadrar la columna «Entrantes» de destinos',
             u'>50,307<', u'>50,300<'),
            (u'descuadrar la columna «Atendidas» de destinos',
             u'>49,974<', u'>49,900<'),
            (u'romper la suma de «nunca volvieron»',
             u'class="r">378<', u'class="r">300<'),
            # Ojo: esto NO quita la fila, le cambia el identificador. La tabla
            # sigue cerrando y sigue teniendo 21 filas, así que las sumas no la
            # cazan: hace falta el candado de «un ID de línea es un número».
            (u'poner un identificador de línea que no es un número',
             u'>36821<', u'>FUERA<'),
            (u'duplicar el identificador de dos líneas',
             u'>36823<', u'>36821<'),
            (u'borrar las notas de corrección', u'<!--NOTA:INICIO-->', u'<!--NOTA-BORRADA-->'),
            (u'borrar la declaración de desfases',
             u'<!-- CONCILIACION:MARCADOS', u'<!-- NADA:'),
            (u'meter a Claudia en el documento',
             u'<h3>Definiciones</h3>', u'<h3>Definiciones (Claudia)</h3>'),
            (u'romper el lector entero: matar las tablas',
             u'<table', u'<tabla-rota'),
        ],
    },
}


def corre(guion, ruta):
    p = subprocess.Popen([PY, '-I', guion, ruta], cwd=RAIZ,
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    salida = p.communicate()[0].decode('utf-8', 'replace')
    return p.returncode, salida


def prueba(nombre, caso):
    print(u'\n   %s' % nombre.upper())
    print(u'   ' + u'=' * 68)
    if not os.path.exists(caso['doc']):
        print(u'   *** no existe %s' % caso['doc'])
        return 1
    base = io.open(caso['doc'], 'r', encoding='utf-8').read()
    tmp = tempfile.mkdtemp(prefix='concilia-')
    copia = os.path.join(tmp, 'copia.html')

    # Control POSITIVO primero: el documento intacto tiene que salir en verde.
    # Si no, todo lo de abajo mide otra cosa.
    cod, _ = corre(caso['guion'], caso['doc'])
    if cod != 0:
        print(u'   [FALLA] el documento INTACTO sale con código %d: un guion que '
              u'siempre falla no prueba nada' % cod)
        shutil.rmtree(tmp, ignore_errors=True)
        return 1
    print(u'   [ OK ]  control positivo · el documento intacto sale en verde')

    malas = 0
    for i, (etiq, buscar, poner) in enumerate(caso['roturas'], 1):
        veces = base.count(buscar)
        if veces == 0:
            print(u'   [FALLA] %2d · %-52s LA ROTURA NO SE APLICA: «%s» no está '
                  u'en el documento' % (i, etiq, buscar[:36]))
            malas += 1
            continue
        roto = base.replace(buscar, poner)
        with io.open(copia, 'w', encoding='utf-8', newline='\n') as f:
            f.write(roto)
        cod, _ = corre(caso['guion'], copia)
        marca = u'[ OK ]' if cod == 1 else u'[FALLA]'
        print(u'   %s %2d · %-52s %d sitio(s) roto(s) → código %d'
              % (marca, i, etiq, veces, cod))
        if cod != 1:
            malas += 1

    shutil.rmtree(tmp, ignore_errors=True)
    print(u'\n   %d de %d roturas cazadas' % (len(caso['roturas']) - malas,
                                              len(caso['roturas'])))
    return malas


def main():
    cual = (sys.argv[1] if len(sys.argv) > 1 else 'todos').lower()
    quienes = list(CASOS) if cual in ('todos', 'all') else [cual]
    for q in quienes:
        if q not in CASOS:
            print(u'   no conozco «%s». Hay: %s' % (q, u', '.join(CASOS)))
            return 2
    malas = sum(prueba(q, CASOS[q]) for q in quienes)
    print(u'\n   ' + u'=' * 68)
    if malas:
        print(u'   *** %d rotura(s) sin cazar. Un candado que no vigila lo que dice'
              u' vigilar\n       no es un candado.' % malas)
        return 1
    print(u'   Todas las roturas cazadas, y los documentos intactos en verde.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
