# -*- coding: utf-8 -*-
u"""Genera el documento PUBLICADO de la auditoría de LINEACEL a partir del
reporte tal como se entregó, aplicando las correcciones de conciliación y
dejándolas visibles dentro del propio documento.

    python -I scripts/publica-auditoria-lineacel.py <reporte-entregado.html>

Escribe `public/auditorias/Auditoria-LINEACEL-Salientes-2026.html`.

── POR QUÉ UN GENERADOR Y NO UNA EDICIÓN A MANO ───────────────────────────────
Porque así la diferencia entre «lo que nos entregaron» y «lo que publicamos» es
una lista legible y repetible, y porque CADA sustitución se verifica: si una no
aparece exactamente una vez, el guion se para y no escribe nada. Una corrección
que no se aplica se lee igual que una corrección hecha
([[feedback-verificar-antes-asegurar]]).

Las notas van entre `<!--NOTA:INICIO-->` / `<!--NOTA:FIN-->` para que
`concilia-auditoria-lineacel.py` las recorte antes de buscar texto —si no, el
detector se dispara con la propia nota— y para que EXIJA que sigan ahí.
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
                       'Auditoria-LINEACEL-Salientes-2026.html')

CSS = (u'.corr{display:block;margin-top:8px;padding:10px 12px;border-left:4px solid '
       u'var(--a);background:#fff8e8;border-radius:0 8px 8px 0;font-size:13.5px;'
       u'color:#5a4410;line-height:1.55}'
       u'.card.corr{display:block;border:1px solid #f0dcae;border-left:4px solid '
       u'var(--a);background:#fff8e8;color:#5a4410;margin:14px 0;font-size:14px}'
       u'.corr code{background:rgba(0,0,0,.05);padding:1px 4px;border-radius:3px;'
       u'font-size:12.5px}')

MARCADOS = [
    'canal-no-cierra',
    'duracion-no-cierra',
    'cortes-no-cubren-13may',
    'lt60-base-redondeo',
    'mrr-ficha-vs-grc',
    'chat-sin-medicion',
    'entrantes-fuera-del-alcance',
]


def nota(cuerpo, clase=u'card corr', estilo=u''):
    est = (u' style="%s"' % estilo) if estilo else u''
    return (u'<!--NOTA:INICIO--><div class="%s"%s>%s</div><!--NOTA:FIN-->'
            % (clase, est, cuerpo))


def inline(cuerpo):
    return u'<!--NOTA:INICIO--><span class="corr">%s</span><!--NOTA:FIN-->' % cuerpo


# ── Las sustituciones, en orden. (buscar, reemplazar, para_qué) ───────────────
EDICIONES = [

    # 0 · la hoja de estilo
    (u'.thesis{border-left:4px solid var(--b);',
     CSS + u'\n.thesis{border-left:4px solid var(--b);',
     u'clase .corr para que las notas se vean'),

    # 1 · el asesor en el plan de acción
    (u'<td>KAM (Claudia / suplente) + SAC</td>',
     u'<td>KAM (Erick) + SAC</td>',
     u'el responsable del plan: la cuenta es de Erick desde el 15 oct 2026'),

    # 2 · el score de pago
    (u'<li>Integración API en adopción «Alta» y pagos al corriente '
     u'(Health Score de pagos 100).</li>',
     u'<li>Integración API en adopción «Alta» y pagos al corriente.'
     + inline(u'<b>Corregido.</b> El borrador decía «Health Score de pagos 100». '
              u'La ficha de la cuenta tiene <b>score de pago 50</b>, y el Health '
              u'Score global es <b>52</b> (actividad 50 · adopción 67 · pago 50 · '
              u'relacional 27). Lo que sí consta es <code>pagos_al_corriente = '
              u'true</code> y cero incidencias de pago — que es una fortaleza real, '
              u'pero no un 100.')
     + u'</li>',
     u'el score de pago inventado'),

    # 3 · los días de silencio
    (u'<li>Sin mapa de decisores en la ficha, sin reuniones vinculadas y último '
     u'contacto de valor hace 42 días.</li>',
     u'<li>Sin mapa de decisores en la ficha, sin reuniones vinculadas y último '
     u'contacto que llegó al cliente el <b>8 de septiembre</b>: 65 días a la fecha '
     u'de este reporte.'
     + inline(u'<b>Corregido.</b> El borrador decía «hace 42 días», contados hasta '
              u'el 1 de octubre. Ese registro es una <b>nota interna</b> —Monse '
              u'pidiendo que alguien contactara a Roberto por sus dudas de corte y '
              u'pago—, no un contacto con el cliente. El último seguimiento que de '
              u'verdad llegó al cliente es del 8 de septiembre, y por eso la alerta '
              u'<code>silencio_60</code> está <b>crítica</b> y escaló el 8 de '
              u'noviembre. Veintitrés días de diferencia son los que separan «hay '
              u'que llamar» de «hay que explicar por qué no se llamó».')
     + u'</li>',
     u'los 42 días contados desde una nota interna'),

    # 4 · el Chat
    (u'<li>Callpicker Chat (WhatsApp API) ya contratado y sin uso: canal de '
     u'seguimiento para quien no contestó.</li>',
     u'<li>Callpicker Chat (WhatsApp API) ya contratado y <b>sin mensajes '
     u'medidos</b>: canal de seguimiento para quien no contestó.'
     + inline(u'<b>Matizado.</b> «Sin uso» no está medido: esta cuenta <b>no tiene '
              u'ni una fila</b> en la fuente de Callpicker Chat, así que no hay '
              u'lectura — ni buena ni mala. Y en octubre el cliente abrió <b>dos '
              u'tickets de Chat</b> (APIs/Webhooks y Plantillas Verificadas): '
              u'estaba montándolo con soporte. La conversación no es venderlo, es '
              u'terminar de prenderlo. Un hueco de medición no se publica como '
              u'desuso.')
     + u'</li>',
     u'«sin uso» cuando lo que hay es falta de medición'),

    # 5 · la IA de voz
    (u'<li>IA de Voz para precalificar o atender a quien regresa la llamada: hoy '
     u'0 módulos de IA activados.</li>',
     u'<li>IA de Voz para precalificar o atender a quien regresa la llamada: hoy '
     u'0 módulos de IA activados.'
     + inline(u'<b>Añadido.</b> No es una idea nuestra: en octubre el cliente abrió '
              u'un ticket de <b>Agente Virtual (voz)</b> en la mesa de ayuda. Y las '
              u'devoluciones ya están entrando — nuestra fuente de llamadas registra '
              u'<b>26 entrantes y 20 sin contestar</b> entre el 17 de julio y el 7 '
              u'de octubre, que este reporte no mide porque sólo cubre salientes. '
              u'Son pocas: se dicen en número, no como tendencia.')
     + u'</li>',
     u'la IA de voz presentada como idea nuestra'),

    # 6 · los dos superlativos del hallazgo 10
    (u'Mejores horas: 10:00 (63.7%) y 16:00 (65.0%). Peor: 12:00 (51.5%). '
     u'El miércoles es el día más bajo (53.2%).',
     u'Mejores horas: 10:00 (63.7%) y 16:00 (65.0%). De las horas en que de verdad '
     u'se marca, la peor es 12:00 (51.5%) —en la serie completa las 18:00 caen '
     u'a 29.2%, pero sobre 24 llamadas—. Y de lunes a viernes el día más bajo '
     u'es el miércoles (53.2%): el sábado está en 4.3%, y el hallazgo 7 lo explica '
     u'aparte.',
     u'«la peor hora» y «el día más bajo», que la serie completa contradice'),

    # 7 · la gráfica de cortes no arranca donde arranca el dato
    (u'<h2>Uso por semana</h2>',
     nota(u'<b>De dónde arranca la gráfica de cortes.</b> El primer corte empieza el '
          u'27 de mayo y el dato arranca el <b>13 de mayo</b>, así que <b>42 '
          u'minutos</b> de los 118,924 quedan antes del primer corte: los seis '
          u'cortes suman 118,882. No mueve nada, pero un recorte que no se declara '
          u'se lee como cobertura completa.')
     + u'\n\n<h2>Uso por semana</h2>',
     u'los 42 minutos del 13 de mayo, fuera de todo corte'),

    # 8 · la tabla de canal no cierra
    (u'<h2>Desempeño por posición (agente)',
     nota(u'<b>Lo que la tabla de canal no cubre.</b> Los cinco orígenes suman '
          u'<b>181,810</b> de las 181,816 llamadas y 118,922 de los 118,924 '
          u'minutos: <b>6 llamadas</b> (0.003%) no traen canal de origen. La tabla '
          u'de posiciones de abajo, en cambio, cierra al récord gracias a su cubo '
          u'«Otros / campañas».')
     + u'\n\n<h2>Desempeño por posición (agente)',
     u'las 6 llamadas sin canal'),

    # 9 · el histograma de duración no cubre todas las conectadas
    (u'<h2>Hallazgos</h2>',
     nota(u'<b>Lo que el histograma de duración no cubre.</b> Sus seis cubos suman '
          u'<b>109,467</b> de las <b>109,680</b> llamadas conectadas: <b>213</b> '
          u'(0.19%) quedan fuera, lo más probable sin duración registrada. Por eso '
          u'el «92.9% dura 1 min o menos» del tablero no sale exacto de los cubos '
          u'—dan 92.8% sobre las conectadas y 93.0% sobre el histograma—: se mide '
          u'sobre los segundos reales, no sobre las fronteras de los cubos.')
     + u'\n\n<h2>Hallazgos</h2>',
     u'las 213 conectadas fuera del histograma'),

    # 10 · el importe de la cuenta
    (u'<h2>Lo que falta confirmar</h2>',
     nota(u'<b>El importe de esta cuenta no es el de la ficha.</b> La metodología de '
          u'abajo dice que los datos de cuenta «vienen de la ficha del tablero SAC», '
          u'y la ficha guarda <b>$13,802</b>. En el corte vivo de Gross Revenue '
          u'Facturación esta cuenta factura <b>$37,222</b> (AAA, 6 meses): los '
          u'$13,802 son el <code>mrrIni</code> de ese mismo corte, es decir el '
          u'importe del mes anterior. El alza de <b>$23,420</b> la marca el propio '
          u'GRC como «Upsell por confirmar (corte de datos)» — se facturó, porque el '
          u'acumulado creció exactamente eso en el sexto mes, pero el GRC no da por '
          u'confirmado que sea durable. Y este importe ya se había movido antes: el '
          u'corte del 2 de octubre registró un <b>Downgrade</b> de $23,420 a '
          u'$13,802. Hay que decirlo junto: con el plan al 98.7% y al 93.5% en dos '
          u'cortes, la amenaza que el FODA pone a futuro —«rebasar el plan genera '
          u'cobros que el cliente no espera»— ya está en una factura, y el último '
          u'contacto que llegó al cliente es del 8 de septiembre.')
     + u'\n\n<h2>Lo que falta confirmar</h2>',
     u'el MRR de la ficha contra el institucional'),
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
            duros.append(u'edición %d (%s): el texto buscado aparece %d veces, '
                         u'no 1' % (i, para, veces))
            print(u'   [FALLA] %2d · %s  — aparece %d veces' % (i, para, veces))
            continue
        h = h.replace(buscar, reemplazar, 1)
        print(u'   [ OK ] %2d · %s' % (i, para))

    if duros:
        print(u'\n   *** No se escribe nada. Una sustitución que no se aplica se lee')
        print(u'       igual que una corrección hecha:')
        for d in duros:
            print(u'         · ' + d)
        return 1

    # la declaración de los desfases que NO se pueden cerrar
    marca = u'<!-- CONCILIACION:MARCADOS %s -->' % u', '.join(MARCADOS)
    if u'</body>' not in h:
        print(u'   [FALLA] el documento no tiene </body>: no sé dónde poner MARCADOS')
        return 1
    h = h.replace(u'</body>', marca + u'\n</body>', 1)

    # El encabezado avisa de que hay correcciones, y el conteo se MIDE, no se
    # teclea: son las ediciones menos la de la hoja de estilo, que no corrige
    # nada. Dos de ellas —el asesor del plan y los dos superlativos— se aplican
    # sobre el texto y no llevan nota propia, así que este encabezado es su
    # único registro visible: corregir en silencio es otro error.
    n_notas = h.count(u'<!--NOTA:INICIO-->') + 1
    n_corr = len(EDICIONES) - 1
    cabecera = nota(
        u'<b>%d correcciones y aclaraciones aplicadas a este documento antes de '
        u'publicarlo</b>, %d de ellas señaladas en su sitio con este mismo fondo. '
        u'Afectan: el responsable del plan (la cuenta es de <b>Erick Sánchez</b> '
        u'desde el 15 de octubre de 2026, no de Claudia), el score de pago, los días '
        u'de silencio, el estado real de Callpicker Chat y de la IA de voz, el '
        u'importe institucional de la cuenta, tres repartos que no cierran, y dos '
        u'superlativos —«la peor hora» y «el día más bajo»— que sólo son ciertos '
        u'entre las horas y los días con volumen. Esas dos últimas y el nombre del '
        u'responsable se corrigieron <b>sobre el texto</b>, y este aviso es su '
        u'registro. <b>Ninguna cambia la tesis del reporte:</b> esta cuenta marca lo '
        u'mismo y conecta menos.'
        % (n_corr, n_notas - 1), estilo=u'margin-top:14px')
    if u'</header>' not in h:
        print(u'   [FALLA] el documento no tiene </header>')
        return 1
    h = h.replace(u'</header>', u'</header>\n\n' + cabecera, 1)

    d = os.path.dirname(DESTINO)
    if not os.path.isdir(d):
        os.makedirs(d)
    with io.open(DESTINO, 'w', encoding='utf-8', newline='\n') as f:
        f.write(h)

    print(u'\n   %d corrección(es) · %d nota(s) visibles · %d desfase(s) declarados '
          u'por clave' % (n_corr, n_notas, len(MARCADOS)))
    print(u'   escrito: %s (%s bytes)' % (os.path.relpath(DESTINO, RAIZ), len(h)))
    print(u'\n   Ahora: python -I scripts/concilia-auditoria-lineacel.py')
    return 0


if __name__ == '__main__':
    sys.exit(main())
