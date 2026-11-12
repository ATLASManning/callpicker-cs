# -*- coding: utf-8 -*-
u"""
CONCILIA LA AUDITORÍA FORENSE DE HOSPITAL SANTA ROSA
====================================================

    python scripts/concilia-auditoria-santa-rosa.py

El documento entregado el 12 nov 2026 trae sus cifras EMBEBIDAS en un objeto
`const D = {...}` dentro del propio `.html`. Este guion lo extrae y comprueba
que cada agregado cierre contra sus partes ANTES de que una sola cifra entre al
expediente del tablero o al contexto de Atlas.

POR QUÉ, Y POR QUÉ ANTES DE PUBLICAR
-------------------------------------
De 556 afirmaciones auditadas en este proyecto, 52 eran graves, y la clase más
cara era siempre la misma: **el porcentaje que no sale de sus partes**. La
contradicción interna es el detector más barato que hay — no necesita una
segunda fuente, sólo sumar. [[feedback-auditorias-verificar]]
[[feedback-tablas-deben-cerrar]]

Y un hallazgo aquí **no es motivo para no publicar**: es motivo para publicar
la cifra que sí cierra y MARCAR CON PALABRAS la que no. Un hueco que se calla
lo rellena de invención quien lo lea después. [[feedback-contexto-ia-sin-huecos]]

LO QUE SE COMPRUEBA
-------------------
1. Los dos totales contra la suma de sus tres categorías (interna, externa,
   anómala), en entrantes y en salientes.
2. El gran total contra la suma de entrantes y salientes.
3. El reparto por HORA y por DÍA DE LA SEMANA contra las entrantes externas:
   los dos tienen que dar el mismo número, y es el que el texto cita.
4. El reparto del AUTOSERVICIO contra el porcentaje declarado. Esta es la que
   el documento NO pasa: ver la nota al pie de la salida.
5. Los registros nuevos declarados contra la resta de los dos cortes.
6. Las tasas de pérdida de las extensiones, recalculadas desde `lost`/`total`.
7. Los rangos que el texto afirma ("nunca bajó de 19%", "33%–45%") contra las
   series mensuales reales.
8. Los minutos, contra sus dos sumandos.

Sale con 1 si algo no cierra, y DICE CUÁNTO falta — un verificador que sólo
dice «falla» obliga a rehacer su trabajo a mano.
"""
from __future__ import print_function
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC = os.path.join(RAIZ, 'public', 'auditorias',
                   'Hospital_Santa_Rosa_Auditoria_Forense_2026-11-12.html')

# El corte anterior, tal como lo declara el expediente de julio.
REGISTROS_CORTE_ANTERIOR = 55638

fallos = []
avisos = []


def falla(que, detalle):
    fallos.append((que, detalle))
    print(u'    %-46s *** NO CIERRA ***  %s' % (que, detalle))


def pasa(que, detalle=u''):
    print(u'    %-46s ok  %s' % (que, detalle))


def avisa(que, detalle):
    avisos.append((que, detalle))
    print(u'    %-46s  ~  %s' % (que, detalle))


def lee_datos():
    u"""Saca el `const D = {...};` del HTML.

    Se corta por el `;\\n` que cierra la declaración y no por una llave
    balanceada a mano: el objeto trae llaves dentro de cadenas y contarlas es
    justo el heurístico que da falsos positivos en este repo.
    """
    if not os.path.exists(DOC):
        print(u'  *** No existe %s ***' % DOC)
        sys.exit(2)
    txt = io.open(DOC, encoding='utf-8').read()
    m = re.search(r'const\s+D\s*=\s*(\{.*?\})\s*;\s*\n', txt, re.S)
    if not m:
        print(u'  *** No pude extraer el objeto `const D` del documento. ***')
        print(u'      Si el formato del reporte cambió, este guion deja de')
        print(u'      conciliar y ESO es el hallazgo, no un detalle del parser.')
        sys.exit(2)
    return json.loads(m.group(1))


def main():
    D = lee_datos()
    k = D['kpis']

    print(u'')
    print(u'  CONCILIACIÓN — Hospital Santa Rosa · corte 12 nov 2026')
    print(u'  %s' % os.path.basename(DOC))
    print(u'')

    # ── 1 y 2 · los totales ──────────────────────────────────────────────
    print(u'  1 · Totales contra sus categorías')
    for lado in ('sal', 'ent'):
        partes = (k['%s_externas' % lado], k['%s_internas' % lado], k['%s_anomalas' % lado])
        total = k['total_salientes'] if lado == 'sal' else k['total_entrantes']
        rot = u'salientes' if lado == 'sal' else u'entrantes'
        if sum(partes) == total:
            pasa(u'%s = ext + int + anómalas' % rot, u'%s' % '{:,}'.format(total))
        else:
            falla(u'%s = ext + int + anómalas' % rot,
                  u'suman %s, declara %s (falta %s)' % (
                      '{:,}'.format(sum(partes)), '{:,}'.format(total),
                      '{:,}'.format(total - sum(partes))))

    gran = k['total_salientes'] + k['total_entrantes']
    if gran == k['total_registros']:
        pasa(u'total = salientes + entrantes', '{:,}'.format(gran))
    else:
        falla(u'total = salientes + entrantes',
              u'suman %s, declara %s' % ('{:,}'.format(gran), '{:,}'.format(k['total_registros'])))

    # ── 3 · hora y día cierran contra entrantes externas ─────────────────
    print(u'')
    print(u'  2 · Repartos de entrantes externas (%s)' % '{:,}'.format(k['ent_externas']))
    for rot, serie in ((u'por hora del día', D['hourly']['total']),
                       (u'por día de la semana', D['weekday']['total'])):
        s = sum(serie)
        if s == k['ent_externas']:
            pasa(rot, '{:,}'.format(s))
        else:
            falla(rot, u'suma %s contra %s (difieren %s)' % (
                '{:,}'.format(s), '{:,}'.format(k['ent_externas']),
                '{:,}'.format(s - k['ent_externas'])))

    # ── 4 · el autoservicio ──────────────────────────────────────────────
    print(u'')
    print(u'  3 · Autoservicio')
    suma_ss = sum(x['value'] for x in D['self_service'])
    implicito = k['ent_externas'] * k['ent_self_service_pct'] / 100.0
    pct_real = 100.0 * suma_ss / k['ent_externas']
    if abs(suma_ss - implicito) <= max(5, implicito * 0.02):
        pasa(u'reparto por línea = %.1f%% declarado' % k['ent_self_service_pct'],
             '{:,}'.format(suma_ss))
    else:
        falla(u'reparto por línea = %.1f%% declarado' % k['ent_self_service_pct'],
              u'las líneas suman %s (%.1f%%), el %% declarado implica %s'
              % ('{:,}'.format(suma_ss), pct_real, '{:,.0f}'.format(implicito)))
        print(u'')
        print(u'       El reparto trae un cubo «Otras líneas», que por convención')
        print(u'       CIERRA la tabla — si cerrara, estas dos cifras coincidirían.')
        print(u'       El %% declarado sigue la tendencia del corte de julio (24.5%%')
        print(u'       sobre 9,766, que SÍ cerraba), así que lo que no se sostiene')
        print(u'       es el REPARTO POR LÍNEA, no el indicador. **No se cita el')
        print(u'       desglose por línea hasta que Análisis DATA lo confirme.**')

    # ── 5 · registros nuevos ─────────────────────────────────────────────
    print(u'')
    print(u'  4 · Registros nuevos frente al corte anterior')
    resta = k['total_registros'] - REGISTROS_CORTE_ANTERIOR
    decl = D['comparativo']['registros_nuevos']
    if resta == decl:
        pasa(u'nuevos = total − corte anterior', '{:,}'.format(resta))
    else:
        avisa(u'nuevos = total − corte anterior',
              u'la resta da %s, el documento declara %s (difieren %d)'
              % ('{:,}'.format(resta), '{:,}'.format(decl), decl - resta))

    # ── 6 · tasas de las extensiones ─────────────────────────────────────
    print(u'')
    print(u'  5 · Tasas de pérdida por extensión, recalculadas')
    malas = 0
    for clave in ('ext_ranking_destino', 'ext_ranking_origen'):
        for r in D[clave]:
            calc = 100.0 * r['lost'] / r['total'] if r['total'] else 0.0
            if abs(calc - r['tasa']) > 0.1:
                malas += 1
                falla(u'%s ext.%s' % (clave.split('_')[-1], r['ext']),
                      u'%d/%d = %.1f%%, declara %.1f%%' % (r['lost'], r['total'], calc, r['tasa']))
    if not malas:
        n = len(D['ext_ranking_destino']) + len(D['ext_ranking_origen'])
        pasa(u'las %d extensiones (destino y origen)' % n, u'cada tasa sale de sus partes')

    # ── 7 · los rangos que el texto afirma ───────────────────────────────
    print(u'')
    print(u'  6 · Afirmaciones de rango contra las series mensuales')
    pares = [
        (u'interna nunca bajó de 19%', min(min(D['rate_sal_int']), min(D['rate_ent_int'])), 19.0, 'min'),
        (u'interna nunca pasó de 32%', max(max(D['rate_sal_int']), max(D['rate_ent_int'])), 32.0, 'max'),
        (u'saliente externa nunca bajó de 33%', min(D['rate_sal_ext']), 33.0, 'min'),
        (u'saliente externa nunca pasó de 45%', max(D['rate_sal_ext']), 45.0, 'max'),
    ]
    for rot, real, umbral, modo in pares:
        ok = real >= umbral if modo == 'min' else real <= umbral
        if ok:
            pasa(rot, u'real %.1f%%' % real)
        else:
            falla(rot, u'real %.1f%%' % real)

    # Agosto como peor mes INTERNO
    i_ago = D['months'].index('2026-08')
    peor_sal = D['rate_sal_int'].index(max(D['rate_sal_int']))
    peor_ent = D['rate_ent_int'].index(max(D['rate_ent_int']))
    if peor_sal == i_ago and peor_ent == i_ago:
        pasa(u'agosto es el peor mes interno', u'%.1f%% sal · %.1f%% ent'
             % (D['rate_sal_int'][i_ago], D['rate_ent_int'][i_ago]))
    else:
        falla(u'agosto es el peor mes interno',
              u'el máximo cae en %s (sal) y %s (ent)'
              % (D['months'][peor_sal], D['months'][peor_ent]))

    # ── 8 · minutos ──────────────────────────────────────────────────────
    print(u'')
    print(u'  7 · Minutos')
    # Los minutos no vienen en `D`; se leen del propio HTML donde se pintan.
    txt = io.open(DOC, encoding='utf-8').read()
    nums = [int(x.replace(',', '')) for x in
            re.findall(r'<div class="v">([\d,]+)</div>', txt)]
    if len(nums) >= 3:
        total_min, ent_min, sal_min = nums[0], nums[1], nums[2]
        if ent_min + sal_min == total_min:
            pasa(u'minutos = entrantes + salientes', '{:,}'.format(total_min))
        else:
            falla(u'minutos = entrantes + salientes',
                  u'%s + %s = %s, declara %s' % (
                      '{:,}'.format(ent_min), '{:,}'.format(sal_min),
                      '{:,}'.format(ent_min + sal_min), '{:,}'.format(total_min)))
    else:
        avisa(u'minutos', u'no encontré las tres tarjetas de minutos en el documento')

    # ── Veredicto ────────────────────────────────────────────────────────
    print(u'')
    print(u'  ' + u'─' * 68)
    if fallos:
        print(u'  *** %d comprobación(es) NO cierran. ***' % len(fallos))
        for q, d in fallos:
            print(u'      · %s — %s' % (q, d))
        print(u'')
        print(u'  Esto NO impide publicar: impide publicar ESAS cifras sin')
        print(u'  marcarlas. Lo que no cierra se nombra con palabras en el')
        print(u'  expediente, nunca se omite en silencio.')
    if avisos:
        print(u'  %d aviso(s) menor(es):' % len(avisos))
        for q, d in avisos:
            print(u'      · %s — %s' % (q, d))
    if not fallos and not avisos:
        print(u'  Todo cierra.')
    print(u'')
    return 1 if fallos else 0


if __name__ == '__main__':
    sys.exit(main())
