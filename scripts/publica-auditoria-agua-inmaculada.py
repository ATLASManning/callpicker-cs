# -*- coding: utf-8 -*-
u"""Genera el documento PUBLICADO de la auditoría de AGUA INMACULADA a partir
del reporte entregado, con las correcciones de conciliación visibles dentro.

    python -I scripts/publica-auditoria-agua-inmaculada.py <reporte-entregado.html>

Escribe `public/auditorias/Auditoria-Agua-Inmaculada-2026.html`.

Cada sustitución se verifica: si una no aparece exactamente una vez, no se
escribe nada. Una corrección que no se aplica se lee igual que una hecha.

Aquí hay DOS clases de edición y conviene no confundirlas:

  · las que sólo AÑADEN una nota al lado de la cifra, para lo que no se puede
    decidir con lo que hay (la base del plan, los minutos sin fuente propia);
  · las que CORRIGEN el texto, para lo que es falso contra nuestra propia
    fuente. La frase «más de la mitad de las llamadas entrantes no fueron
    atendidas» es de esta segunda clase: el documento llama «no atendidas» a
    todo lo que no fue `Redirected`, y ahí dentro va el autoservicio y el
    buzón. Una nota al pie no basta cuando la frase que se corrige está en una
    tarjeta que el cliente lee sola.

Las notas van entre `<!--NOTA:INICIO-->` / `<!--NOTA:FIN-->`; el conciliador
las recorta antes de buscar texto y EXIGE que sigan ahí.
"""
from __future__ import division

import io
import os
import sys

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:                                                  # noqa: BLE001
    pass

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESTINO = os.path.join(RAIZ, 'public', 'auditorias',
                       'Auditoria-Agua-Inmaculada-2026.html')

CSS = (u'\n  .corr{border:1px solid #e9d9b0;border-left:4px solid #c08a00;'
       u'background:#fdf8ec;color:#52421c;border-radius:0 6px 6px 0;'
       u'padding:13px 16px;margin:14px 0;font-size:12px;line-height:1.6;'
       u'text-align:left}'
       u'\n  .corr b{color:#3d3014}'
       u'\n  .corr code{background:rgba(0,0,0,.05);padding:1px 4px;border-radius:3px;'
       u'font-family:Consolas,monospace;font-size:11px}'
       u'\n  .corr-t{display:block;font-size:10px;font-weight:700;letter-spacing:1.2px;'
       u'text-transform:uppercase;color:#8a6d1f;margin-bottom:5px}\n')

# Los desfases que NO se pueden cerrar se declaran POR CLAVE dentro del
# documento. Un desfase nuevo que nadie declare deja el conciliador en rojo;
# sin esto el candado estaría rojo siempre, y un candado siempre rojo se ignora.
MARCADOS = [
    'no-atendidas-incluye-autoservicio-y-buzon',
    'salientes-por-tipo-faltan-322-min',
    'serie-por-hora-incluye-mayo-parcial',
    'holgura-con-dos-denominadores',
    'base-del-plan-10500-vs-grc-12500',
    'minutos-sin-fuente-propia',
    'repartos-por-llamada-sin-tabla',
    'acciones-ya-aplicadas-en-junio',
]


def nota(titulo, cuerpo):
    return (u'<!--NOTA:INICIO--><div class="corr"><span class="corr-t">%s</span>%s'
            u'</div><!--NOTA:FIN-->' % (titulo, cuerpo))


EDICIONES = [

    # 0 · la hoja de estilo de las notas
    (u'  .sep { height:1px; background:var(--borde); margin:28px 0; }',
     u'  .sep { height:1px; background:var(--borde); margin:28px 0; }' + CSS,
     u'clase .corr para que las notas se vean'),

    # 1 · LA CIFRA TITULAR · se CORRIGE, no se anota
    #     La tarjeta KPI se lee sola y afirmaba como «no atendidas» 2,923
    #     llamadas que el autoservicio o el buzón sí resolvieron.
    (u'''      <div class="kpi-card rojo">
        <div class="kpi-etiqueta">Llamadas no atendidas</div>
        <div class="kpi-valor">7,895</div>
        <div class="kpi-sub">Acumuladas en 4 meses (ene–abr)</div>
        <span class="kpi-badge badge-rojo">Tasa promedio: 51.3%</span>
      </div>''',
     u'''      <div class="kpi-card rojo">
        <div class="kpi-etiqueta">Llamadas perdidas</div>
        <div class="kpi-valor">4,972</div>
        <div class="kpi-sub">De 15,384 entrantes (ene–abr). Otras 2,923 no llegaron a un
          agente pero sí las resolvió el autoservicio (2,359) o quedaron en buzón (564).</div>
        <span class="kpi-badge badge-rojo">Tasa real de pérdida: 32.3%</span>
      </div>''',
     u'LA CIFRA TITULAR: 7,895 «no atendidas» → 4,972 perdidas reales'),

    # 2 · el aviso de cabecera, con el conteo CALCULADO
    (u'    <div class="seccion-titulo">01 · Indicadores Clave</div>',
     u'    <div class="seccion-titulo">01 · Indicadores Clave</div>\n%%CABECERA%%',
     u'ancla del aviso de cabecera'),

    # 3 · la definición, donde se usa cuatro veces seguidas
    (u'    <div class="seccion-titulo">04 · Llamadas No Atendidas — Análisis de Impacto</div>',
     u'    <div class="seccion-titulo">04 · Llamadas No Atendidas — Análisis de Impacto</div>\n'
     + nota(u'Corrección · qué cuenta este apartado',
            u'<b>«No atendida» aquí significa «no la tomó un agente», no «nadie la '
            u'atendió».</b> Las cuatro tarjetas de abajo y la gráfica de tendencia '
            u'suman, en el mismo número, tres desenlaces distintos de nuestra '
            u'plataforma: <b>perdidas</b> de verdad, llamadas que <b>resolvió el '
            u'autoservicio</b> y llamadas que <b>dejaron recado en buzón</b>. Sobre '
            u'ene–abr son 4,972 + 2,359 + 564 = 7,895.'
            u'<br><br>Las tasas reales de <b>pérdida</b>, mes a mes, son '
            u'<b>29.5% · 32.7% · 33.3% · 33.4%</b> (y no 46.0 · 49.6 · 53.5 · 55.2). '
            u'La tendencia que señala el apartado <b>es real y sigue en pie</b> —sube '
            u'casi 4 puntos de enero a abril—, pero su nivel es de una llamada perdida '
            u'de cada tres, no de una de cada dos. Nuestra alerta interna de la cuenta '
            u'mide el <b>32.1%</b> sobre el periodo ene–14 sep, que es la misma lectura.'),
     u'la definición de «no atendida» en el apartado 04'),

    # 4 · el hallazgo 2, que es la frase que el cliente lee sola
    (u'        <div class="hallazgo-num">55.2%</div>\n'
     u'        <div class="hallazgo-titulo">Tasa de pérdida creciente</div>\n'
     u'        <div class="hallazgo-desc">En abril, más de la mitad de las llamadas '
     u'entrantes no fueron atendidas. Esta cifra creció 9 puntos porcentuales desde '
     u'enero (46%). La operación de ventas y atención al cliente de Agua Inmaculada '
     u'está absorbiendo el impacto directamente.</div>',
     u'        <div class="hallazgo-num">33.4%</div>\n'
     u'        <div class="hallazgo-titulo">Tasa de pérdida creciente</div>\n'
     u'        <div class="hallazgo-desc">En abril se perdió una de cada tres llamadas '
     u'entrantes: 1,385 de 4,151. La tasa subió 3.9 puntos desde enero (29.5%) sin '
     u'señal de estabilización. Si se cuentan también las que resolvió el autoservicio '
     u'y las que quedaron en buzón, la cifra sube al 55.2%, pero ésas sí recibieron '
     u'una respuesta. La operación de ventas y atención al cliente de Agua Inmaculada '
     u'está absorbiendo el impacto de las 1,385.</div>',
     u'el hallazgo «más de la mitad no fueron atendidas»'),

    # 5 · el pie del gráfico por hora, que se contradice en su propia etiqueta
    (u'      <div class="grafica-sub">Total acumulado ene–abr · 9,486 llamadas no '
     u'contestadas (incluye mayo parcial)</div>',
     u'      <div class="grafica-sub">9,486 llamadas que no tomó un agente · '
     u'ene–abr <b>más mayo parcial</b> (el periodo ene–abr son 7,895: esta serie lleva '
     u'1,591 llamadas de mayo) · incluye autoservicio y buzón</div>',
     u'el pie del gráfico por hora: «ene–abr» y «mayo parcial» a la vez'),

    # 6 · y el 55% de la franja, cuyo denominador son esas 9,486
    (u'    <div class="franja-info">🔴 Horas críticas: 09:00–13:00 concentran el 55% '
     u'de todas las llamadas no atendidas. Hora pico: 09:00 h con 1,101 llamadas en el '
     u'período.</div>',
     u'    <div class="franja-info">🔴 Horas críticas: 09:00–13:00 concentran el 55% '
     u'(5,241 de 9,486) de las llamadas que no tomó un agente. Hora pico: 09:00 h con '
     u'1,101 llamadas. El denominador de este 55% es la serie por hora, que cubre '
     u'ene–abr más mayo parcial, no los 7,895 del periodo.</div>',
     u'el denominador del 55% de la franja 09:00–13:00'),

    # 7 · el reparto de salientes que no cierra, y los dos repartos sin tabla
    (u'    <div class="seccion-titulo">03 · Desglose por Tipo de Destino</div>',
     u'    <div class="seccion-titulo">03 · Desglose por Tipo de Destino</div>\n'
     + nota(u'Límites de este apartado',
            u'<b>El reparto de minutos SALIENTES es un techo del 98.9%, no el total.</b> '
            u'Los tres tipos suman <b>28,064</b> minutos y la tabla del apartado 02 '
            u'declara <b>28,386</b> salientes: faltan <b>322</b> minutos '
            u'(Ene 47 · Feb 42 · Mar 80 · Abr 153). La tabla de abajo cierra sobre sí '
            u'misma y rotula su total como «100%», así que la misma cifra aparece con '
            u'dos valores en el documento. El de arriba —28,386— es el que cuenta para '
            u'el consumo del plan. El de entrantes, en cambio, <b>cierra exacto</b> los '
            u'cuatro meses.'
            u'<br><br><b>Y dos porcentajes de este apartado son de LLAMADAS, no de '
            u'minutos, y no hay ninguna tabla que los sostenga:</b> «el celular es solo '
            u'el 30-35% de las llamadas» y «el 28% de sus llamadas salientes» van a fijo '
            u'o extensión. Todo el desglose publicado está en minutos —ahí fijo más '
            u'extensión son el <b>25.7%</b>—, así que esos dos no se pueden recalcular '
            u'desde el documento y quedan marcados como no verificables.'),
     u'los 322 minutos y los dos repartos por llamada sin tabla'),

    # 8 · la base de los incrementos y el origen de los minutos
    (u'    <div class="seccion-titulo">06 · Propuestas de Ajuste de Plan</div>',
     u'    <div class="seccion-titulo">06 · Propuestas de Ajuste de Plan</div>\n'
     + nota(u'Antes de leer los precios y los márgenes',
            u'<b>1 · La base de los incrementos no es el importe institucional.</b> Las '
            u'dos opciones parten de «Plan actual $10,500/mes» y de ahí salen «+$4,000» '
            u'y «+$8,000». El importe que esta cuenta tiene en Gross Revenue Facturación '
            u'es de <b>$12,500/mes</b> (banda AAA, estable). Contra esa base los '
            u'incrementos serían <b>+$2,000</b> y <b>+$6,000</b>. O el $10,500 es sólo el '
            u'componente de la bolsa de minutos —y entonces no es «el plan actual»—, o '
            u'los incrementos están sobredimensionados. <b>Con lo que hay no se puede '
            u'decidir, así que ninguna de las dos cifras se presenta como «lo que subiría '
            u'su factura»</b> hasta cuadrarlo con facturación.'
            u'<br><br><b>2 · Los minutos de este documento no salen de una fuente '
            u'nuestra.</b> El plan de 10,000 y los consumos de 9,150 y 9,910 vienen de la '
            u'exportación de la plataforma que acompaña al reporte. Este CID no tiene '
            u'filas en nuestro archivo de cortes de facturación y la cuenta lleva abierta '
            u'una alerta crítica por eso mismo. La aritmética interna cierra —el 91.5% y '
            u'el 99.1% salen de las series—, pero el origen del dato es el cliente.'
            u'<br><br><b>3 · La misma holgura se publica con dos valores.</b> La tarjeta '
            u'de la Opción A dice «21% sobre el pico histórico (9,910)» —que es '
            u'2,090/9,910 = <b>21.1%</b>— y la tabla comparativa dice «Margen real sobre '
            u'pico · 20.9%», que es 2,090/10,000, o sea sobre el plan <b>viejo</b>. Igual '
            u'en la Opción B: 51.4% contra 50.9%. Las cifras de «sobre pico» correctas '
            u'son <b>21.1%</b> y <b>51.4%</b>.'
            u'<br><br><b>4 · Más minutos no recuperan llamadas perdidas.</b> Las dos '
            u'cosas van en el mismo documento y se leen como una sola: ampliar la bolsa '
            u'resuelve el <b>riesgo de excedente</b> de abril al 99.1%, y no toca la tasa '
            u'de pérdida, que es un problema de <b>capacidad de atención</b>. Son dos '
            u'decisiones distintas con dos justificaciones distintas.'),
     u'la base del plan, el origen de los minutos y la holgura'),

    # 9 · el hallazgo técnico, que propone algo ya aplicado
    (u'        Una parte de las llamadas clasificadas como "No atendidas" corresponden '
     u'a situaciones donde la extensión de destino ya se encontraba en otra llamada '
     u'activa. El sistema las marca como perdidas aunque el agente esté disponible '
     u'para otras comunicaciones. Este comportamiento se puede corregir mediante '
     u'reconfiguración del enrutamiento en la plataforma Callpicker, sin costo '
     u'adicional de plan.',
     u'        Una parte de las llamadas clasificadas como "No atendidas" corresponden '
     u'a situaciones donde la extensión de destino ya se encontraba en otra llamada '
     u'activa. El sistema las marca como perdidas aunque el agente esté disponible '
     u'para otras comunicaciones. <b>Este ajuste ya se aplicó:</b> el ticket #107776 '
     u'del 23 de junio de 2026 configuró todas las extensiones activas de la cuenta '
     u'para atender una sola llamada a la vez, sin costo adicional de plan.',
     u'el hallazgo técnico: el ajuste ya se aplicó en junio'),

    # 10 · y lo que pasó DESPUÉS, que el documento no puede saber
    (u'    <div class="seccion-titulo">07 · Acciones Acordadas</div>',
     u'    <div class="seccion-titulo">07 · Acciones Acordadas</div>\n'
     + nota(u'Estado real de estas acciones al 23 de noviembre de 2026',
            u'<b>Este análisis es de los datos de enero a abril de 2026 y las acciones '
            u'de abajo se acordaron en la reunión del 2 de junio de 2026.</b> Lo que ha '
            u'pasado desde entonces, medido:'
            u'<br><br>· <b>La reconfiguración de enrutamiento está hecha</b> (ticket '
            u'#107776, 23 jun 2026). Y <b>se puede medir</b>: la tasa de pérdida pasó del '
            u'<b>32.6%</b> (ene–may) al <b>30.7%</b> (jul al 14 sep). Bajó 1.8 puntos y '
            u'sigue en 30.7%. <b>El ajuste de configuración no bastó</b>, y ése es el dato '
            u'que falta en el documento: se corta en abril.'
            u'<br><br>· <b>El incremento a 12,000 minutos —la Opción A— ya se aprobó '
            u'evaluarlo</b> en esa misma reunión del 2 de junio. No es una propuesta '
            u'nueva: lleva abierta desde entonces.'
            u'<br><br>· El cliente, en el ticket <b>#107227</b> del 23 de junio, pidió un '
            u'ajuste de plan porque consideraba que usaba <b>menos</b> de lo contratado. '
            u'La propuesta de este documento va en dirección contraria, y eso hay que '
            u'plantearlo de frente.'
            u'<br><br>· <b>El último contacto que llegó al cliente es del 23 de junio de '
            u'2026</b>, hace 153 días. La cuenta tiene abierta una alerta crítica de '
            u'silencio por eso. Ninguna de estas acciones puede presentarse como «en '
            u'curso».'),
     u'el estado real de las acciones acordadas'),

    # 11 · la portada: el periodo y la fecha no son el mismo momento
    (u'    <div class="portada-meta-item">Fecha del reporte<strong>Noviembre 2026</strong></div>',
     u'    <div class="portada-meta-item">Datos analizados<strong>Ene – Abr 2026</strong></div>\n'
     u'    <div class="portada-meta-item">Conciliado<strong>23 Nov 2026</strong></div>',
     u'la portada: separar el periodo del dato de la fecha de revisión'),

    # 12 · el pie, para que el recorte no se lea como cobertura completa
    (u'  Período analizado: Enero – Abril 2026 · Preparado por: José Manuel López Delgadillo',
     u'  Período analizado: Enero – Abril 2026 · Preparado por: José Manuel López Delgadillo'
     u'<br>Documento conciliado el 23 de noviembre de 2026 contra Gross Revenue '
     u'Facturación y la fuente de llamadas de la plataforma (corte al 14 de septiembre '
     u'de 2026). Las aclaraciones sobre fondo ocre son nuestras.',
     u'el pie con la fecha y el alcance de la conciliación'),
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
    for i, (buscar, reemplazar, para) in enumerate(EDICIONES):
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

    # El aviso de cabecera va al final porque su conteo se MIDE sobre las notas
    # ya puestas. Teclear «9 notas» donde hay 8 es el mismo error que publicar
    # una cifra sin medirla.
    n_notas = h.count(u'<!--NOTA:INICIO-->')
    n_corr = len(EDICIONES) - 2          # fuera la hoja de estilo y el ancla
    n_texto = n_corr - n_notas           # las que corrigen texto sin nota propia
    cabecera = nota(
        u'Antes de leer: %d aclaraciones de conciliación' % n_corr,
        u'<b>Este documento se revisó cifra por cifra antes de publicarse y lleva %d '
        u'aclaraciones</b>, %d de ellas señaladas en su sitio con este mismo fondo y %d '
        u'aplicadas directamente sobre el texto. Casi toda su aritmética <b>cierra</b>: '
        u'los totales entrantes, el promedio de 9,150 minutos, el 91.5%%, el 99.1%% de '
        u'abril y el +17.8%% de crecimiento se reconstruyen desde sus propias series, y '
        u'los totales y las atendidas coinciden <b>al récord</b> con nuestra fuente de '
        u'llamadas.'
        u'<br><br>Lo que se corrige es una cosa grande y cuatro chicas. La grande: '
        u'<b>«no atendida» en este reporte quiere decir «no la tomó un agente»</b>, y en '
        u'ese número van 2,359 llamadas que resolvió el autoservicio y 564 que dejaron '
        u'recado. Las perdidas de verdad son <b>4,972 de 15,384 — el 32.3%%, una de cada '
        u'tres</b>, no más de la mitad. Las chicas: 322 minutos salientes que el reparto '
        u'por tipo no alcanza, la serie por hora que incluye mayo parcial, la holgura '
        u'publicada con dos denominadores y dos porcentajes de llamadas que ninguna tabla '
        u'sostiene.'
        u'<br><br><b>Y una advertencia de fecha:</b> los datos son de enero a abril de '
        u'2026 y las acciones del apartado 07 se acordaron el 2 de junio de 2026. La '
        u'principal ya está aplicada desde el 23 de junio, su efecto se midió —la tasa '
        u'de pérdida bajó del 32.6%% al 30.7%%, no bastó— y el último contacto que llegó '
        u'al cliente es de ese mismo día. Nada de esto está en el cuerpo del reporte '
        u'porque su ventana termina en abril.'
        % (n_corr, n_notas, n_texto))

    if u'%%CABECERA%%' not in h:
        print(u'   [FALLA] se perdió el ancla %%CABECERA%% del aviso de cabecera')
        return 1
    h = h.replace(u'%%CABECERA%%', cabecera, 1)

    marca = u'<!-- CONCILIACION:MARCADOS %s -->' % u', '.join(MARCADOS)
    if u'</body>' not in h:
        print(u'   [FALLA] el documento no tiene </body>')
        return 1
    h = h.replace(u'</body>', marca + u'\n</body>', 1)

    d = os.path.dirname(DESTINO)
    if not os.path.isdir(d):
        os.makedirs(d)
    with io.open(DESTINO, 'w', encoding='utf-8', newline='\n') as f:
        f.write(h)

    print(u'\n   %d aclaración(es) · %d nota(s) visibles · %d corrección(es) de texto'
          u' · %d desfase(s) por clave'
          % (n_corr, h.count(u'<!--NOTA:INICIO-->'), n_texto, len(MARCADOS)))
    print(u'   escrito: %s (%s bytes)' % (os.path.relpath(DESTINO, RAIZ), len(h)))
    print(u'\n   Ahora: python -I scripts/concilia-auditoria-agua-inmaculada.py')
    return 0


if __name__ == '__main__':
    sys.exit(main())
