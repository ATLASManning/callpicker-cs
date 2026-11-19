# -*- coding: utf-8 -*-
u"""Genera el documento PUBLICADO de la auditoría v4.0 de ODONTOPREV a partir
del reporte entregado, con las correcciones de conciliación visibles dentro.

    python -I scripts/publica-auditoria-odontoprev.py <reporte-entregado.html>

Escribe `public/auditorias/Auditoria-Odontoprev-Trafico-2026.html`.

Cada sustitución se verifica: si una no aparece exactamente una vez, no se
escribe nada. Una corrección que no se aplica se lee igual que una hecha.

Las notas van entre `<!--NOTA:INICIO-->` / `<!--NOTA:FIN-->`; el conciliador las
recorta antes de buscar texto y exige que sigan ahí.
"""
from __future__ import division

import io
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'public', 'auditorias',
                       'Auditoria-Odontoprev-Trafico-2026.html')

CSS = (u'\n.corr{border:1px solid #e9d9b0;border-left:4px solid #c08a00;'
       u'background:#fdf8ec;color:#52421c;border-radius:0 4px 4px 0;'
       u'padding:10px 13px;margin:12px 0;font-size:9.5pt;line-height:1.55;'
       u'text-align:left}'
       u'\n.corr b{color:#3d3014}'
       u'\n.corr code{background:rgba(0,0,0,.05);padding:1px 4px;border-radius:3px;'
       u'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:9pt}\n')

MARCADOS = [
    'recuperacion-solo-5-o-mas',
    'recuperacion-dos-bases',
    'horas-tres-valores',
    'solape-extension-y-horario',
    'hora-21-no-cierra',
    'fuente-viva-truncada',
    'mrr-23325-desactualizado',
    'dias-sin-marcar-156-o-157',
]


def nota(cuerpo):
    return u'<!--NOTA:INICIO--><div class="corr">%s</div><!--NOTA:FIN-->' % cuerpo


EDICIONES = [

    # 0 · la hoja de estilo
    (u'.center { text-align: center; }',
     u'.center { text-align: center; }' + CSS,
     u'clase .corr para que las notas se vean'),

    # 1 · las horas de conversación, con tres valores en el mismo documento
    (u'<h2><span class="num">01</span>',
     nota(u'<b>Las horas de conversación se publican con tres valores.</b> El '
          u'resumen dice <b>13,268</b>, la tabla de correcciones del apartado 08 '
          u'dice <b>13,267</b>, y sumando la columna «Horas» de las dos tablas '
          u'grandes salen <b>13,266</b>. Dos horas de diferencia sobre 13,266 '
          u'(0.015%) no mueven nada, pero una cifra con tres valores en el mismo '
          u'documento se le nota al cliente. La que cierra contra las tablas es '
          u'<b>13,266</b>, y de ahí salen los 8.81 minutos por llamada atendida.')
     + u'\n<h2><span class="num">01</span>',
     u'las tres versiones de las horas de conversación'),

    # 2 · el 62% suma dos poblaciones que pueden solaparse
    (u'<h2><span class="num">04</span>',
     nota(u'<b>El 62% es un techo, no una suma limpia.</b> El resumen suma el '
          u'42.47% de la extensión y el 19.6% de las horas sin cobertura y dice '
          u'que «entre las dos cosas cabe el 62%». Las dos poblaciones <b>pueden '
          u'solaparse</b>: una llamada perdida en esa extensión a las 21:00 cuenta '
          u'en los dos conjuntos, y el documento no publica la intersección. La '
          u'conclusión no cambia —las dos se arreglan configurando— pero la cifra '
          u'correcta es «hasta el 62%».'
          u'<br><br><b>Y las 21:00 no cierran:</b> el apartado 03 publica 492 '
          u'entradas, 4 atendidas y 298 perdidas. Las otras <b>190</b> son menú y '
          u'buzón, que el documento cuenta aparte en «Definiciones» pero no en esa '
          u'frase.')
     + u'\n<h2><span class="num">04</span>',
     u'el 62% solapable y las 190 llamadas de las 21:00'),

    # 3 · las dos bases de la recuperación
    (u'Destinos con cinco o más pérdidas.',
     u'Destinos con cinco o más pérdidas —cubren 2,816 de las 2,821, '
     u'así que quedan 5 fuera—.',
     u'el tamaño del recorte de la tabla de recuperación'),

    (u'<h2><span class="num">05</span>',
     nota(u'<b>Las dos tasas de recuperación no se miden sobre la misma base.</b> '
          u'El <b>63.2%</b> sale de 1,779 recuperadas en 24 h sobre las <b>2,816</b> '
          u'pérdidas que la tabla de arriba alcanza (sobre las 2,821 del periodo '
          u'daría 63.1%). El <b>74.8%</b> sí usa las 2,821: (2,821 − 712) / 2,821. '
          u'Las 712 que nunca volvieron, en cambio, suman <b>exactamente</b> la '
          u'columna de la tabla, y las tres columnas de las tablas de destinos y de '
          u'líneas cierran al récord contra 93,929, 90,381 y 2,821. Eso es lo '
          u'inusual, y conviene no estropearlo.')
     + u'\n<h2><span class="num">05</span>',
     u'las dos bases del 63.2% y el 74.8%'),

    # 4 · el importe institucional
    (u'<h2><span class="num">09</span>',
     nota(u'<b>El importe institucional ya no son $23,325.</b> En el corte vivo de '
          u'Gross Revenue Facturación este CID suma <b>$23,681.40</b> en dos líneas '
          u'—«Odontoprev ATC» $20,176.40 (agrupada) y «Odontoprev» $3,505.00—: la '
          u'línea grande subió $356.40 desde que se escribió este reporte. La '
          u'aritmética del apartado de abajo <b>es correcta sobre la base que usa</b> '
          u'($23,325 + $10,740.10 = $34,065.10, un 46.0%), así que no se parchea: '
          u'sobre la base viva serían $34,421.50 y un <b>45.4%</b>. El expediente '
          u'del módulo de Auditoría lleva la cifra vigente.')
     + u'\n<h2><span class="num">09</span>',
     u'el MRR de $23,325 contra el corte vivo'),

    # 5 · los días sin marcar
    (u'<h3>Fuente y método</h3>',
     nota(u'<b>Dos aclaraciones de medición.</b> (1) Del 1 de junio al 5 de '
          u'noviembre de 2026 hay <b>157</b> días, no 156: el documento los cuenta '
          u'una vez menos. No cambia el punto —el canal saliente lleva más de cinco '
          u'meses apagado—. (2) El cargo de WhatsApp del apartado 09 sale de la '
          u'<b>factura</b>, y nuestra propia fuente de Callpicker Chat <b>no lo '
          u'puede confirmar ni desmentir</b>: la lectura del corte vigente falló '
          u'(<code>operational_error</code>) y marca cero mensajes, que no es '
          u'desuso. El último dato fiable son <b>86,492 mensajes</b> en el corte '
          u'del 2 de septiembre, contra una bolsa contratada de <b>25,000</b> — el '
          u'346%. El apartado 09 pregunta cuántos mensajes caben en la ventana '
          u'gratuita de Meta y no menciona que la bolsa propia va rebasada: ésa es '
          u'la conversación más grande de las dos.')
     + u'\n<h3>Fuente y método</h3>',
     u'los 157 días y la lectura rota del Chat'),

    # 6 · nuestra propia fuente sigue truncada
    (u'<h3>Límites de esta medición</h3>',
     nota(u'<b>Y un límite que no es del documento, es nuestro.</b> Las <b>ocho</b> '
          u'cifras que el apartado 08 retira de la versión 3.0 coinciden <b>al '
          u'récord</b> con lo que hoy tiene nuestra fuente de llamadas: 76,385 '
          u'entrantes con corte al 14 de septiembre, 11 salientes desde el 13 de '
          u'abril, 51.4% sin columna de destino, septiembre al 1.57% sobre 4,575 '
          u'llamadas, el destino al 37.9%, Welbe 7 de 8 y 11,083 horas. Eso prueba '
          u'dos cosas: que este reporte describe bien lo que la v3.0 decía, y que '
          u'<b>la exportación truncada sigue siendo la que alimenta el tablero</b>. '
          u'Hasta que se recargue, la ficha de la cuenta y este documento dirán '
          u'cifras distintas de la misma cuenta, y la razón es nuestra.')
     + u'\n<h3>Límites de esta medición</h3>',
     u'nuestra fuente viva sigue siendo la truncada'),
]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    origen = sys.argv[1]
    if not os.path.exists(origen):
        print(u'*** No existe el reporte de origen: %s' % origen)
        return 1

    h = io.open(origen, 'r', encoding='utf-8', errors='replace').read()
    print(u'\n   origen:  %s (%s bytes)' % (os.path.basename(origen), len(h)))
    print(u'   destino: %s\n' % os.path.relpath(DESTINO, RAIZ))

    duros = []
    for i, (buscar, reemplazar, para) in enumerate(EDICIONES, 1):
        veces = h.count(buscar)
        if veces != 1:
            duros.append(u'edición %d (%s): aparece %d veces, no 1' % (i, para, veces))
            print(u'   [FALLA] %2d · %s  — aparece %d veces' % (i, para, veces))
            continue
        h = h.replace(buscar, reemplazar, 1)
        print(u'   [ OK ] %2d · %s' % (i, para))

    if duros:
        print(u'\n   *** No se escribe nada:')
        for d in duros:
            print(u'         · ' + d)
        return 1

    marca = u'<!-- CONCILIACION:MARCADOS %s -->' % u', '.join(MARCADOS)
    if u'</body>' not in h:
        print(u'   [FALLA] el documento no tiene </body>')
        return 1
    h = h.replace(u'</body>', marca + u'\n</body>', 1)

    # El aviso de cabecera. El conteo se MIDE: son las ediciones menos la de la
    # hoja de estilo. Una de ellas —el pie de la tabla de recuperación— se
    # corrige sobre el texto y no lleva nota propia, así que este aviso es su
    # registro: corregir en silencio es otro error.
    n_notas = h.count(u'<!--NOTA:INICIO-->') + 1
    n_corr = len(EDICIONES) - 1
    cabecera = nota(
        u'<b>%d aclaraciones de conciliación añadidas a este documento antes de '
        u'publicarlo</b>, %d de ellas señaladas en su sitio con este mismo fondo. '
        u'Ninguna cambia la tesis del reporte, y una buena parte dice lo contrario '
        u'de una corrección: <b>las tres columnas de las tablas de destinos y de '
        u'líneas cierran al récord</b> contra los totales del periodo, y la columna '
        u'«nunca volvieron» suma exactamente 712. Lo que se aclara son cuatro '
        u'desfases chicos —las horas de conversación publicadas con tres valores, '
        u'el 62%% que suma dos poblaciones solapables, las dos bases de la '
        u'recuperación y las 190 llamadas de las 21:00 sin explicar—, el importe '
        u'institucional, que subió $356.40 desde que se escribió, y un límite que '
        u'es <b>nuestro y no del documento</b>: la exportación truncada que esta '
        u'versión retira sigue siendo la que alimenta el tablero.'
        % (n_corr, n_notas - 1))

    ancla = u'<h2>Resumen ejecutivo</h2>'
    if ancla not in h:
        print(u'   [FALLA] no encuentro «%s» para poner el aviso de cabecera' % ancla)
        return 1
    h = h.replace(ancla, ancla + u'\n' + cabecera, 1)

    d = os.path.dirname(DESTINO)
    if not os.path.isdir(d):
        os.makedirs(d)
    with io.open(DESTINO, 'w', encoding='utf-8', newline='\n') as f:
        f.write(h)

    print(u'\n   %d aclaración(es) · %d nota(s) visibles · %d desfase(s) por clave'
          % (n_corr, n_notas, len(MARCADOS)))
    print(u'   escrito: %s (%s bytes)' % (os.path.relpath(DESTINO, RAIZ), len(h)))
    print(u'\n   Ahora: python -I scripts/concilia-auditoria-odontoprev.py')
    return 0


if __name__ == '__main__':
    sys.exit(main())
