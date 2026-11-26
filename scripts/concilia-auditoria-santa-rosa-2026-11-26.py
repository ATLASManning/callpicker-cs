# -*- coding: utf-8 -*-
u"""
CONCILIA LA AUDITORÍA FORENSE DE HOSPITAL SANTA ROSA · CORTE DEL 26 NOV 2026
============================================================================

    python scripts/concilia-auditoria-santa-rosa-2026-11-26.py [ruta.html]

Hermano de `concilia-auditoria-santa-rosa.py`, que concilia el corte del 12 nov.
Son DOS guiones y no uno porque son DOS formas distintas de documento: el del
12 nov embebe `const D = {...}` con llaves `kpis`, `hourly`, `ext_ranking_*`;
el del 26 nov embebe `const DATA = {...}` con llaves `totales`, `clasificacion`,
`ent_mensual`, `tabla_destino`. Un guion que intentara adivinar cuál le toca es
el mismo heurístico que ya costó una conciliación falsa.

POR QUÉ SE ESCRIBIÓ ESTE, Y QUÉ ENCONTRÓ
----------------------------------------
Al pasarle el corte del 26 nov al conciliador del 12 nov, aquél **ignoró el
argumento** —tenía la ruta clavada en una constante— y concilió el documento
VIEJO, imprimiendo «ok» siete veces. Un verificador que da por verificado un
archivo que nadie le pidió mirar es peor que no tenerlo.
[[feedback-verificar-antes-asegurar]]

Con el documento correcto, el resumen ejecutivo NO cierra, y de tres maneras:

  · «el 38.2% corresponde a comunicación interna entre extensiones». La
    comunicación interna real es 73.98% de las 89,238 llamadas (32,653
    entrantes internas + 33,364 salientes internas). El 38.2% es la cuota de
    las SALIENTES internas más las inválidas: la mitad del fenómeno, rotulada
    como el fenómeno completo. El hallazgo central del documento vale el DOBLE
    de lo que el documento dice.
  · «el 15.9% a llamadas salientes hacia teléfonos externos». Las salientes
    externas son 7,079: el 7.93%. El 15.9% no se reconstruye desde la propia
    clasificación del documento.
  · Las tres cuotas suman 108.0% porque los cubos SE SOLAPAN: el 53.9% de
    entrantes ya incluye las entrantes internas, que también están dentro del
    «38.2% de comunicación interna». [[feedback-tablas-deben-cerrar]]

Y dos más, menores pero de la misma clase:

  · El KPI «24.7% · pérdida en comunicación interna (promedio entrante+saliente)»
    no es un promedio de esas dos tasas (que da 23.9%): sale de meter los 689
    marcados inválidos en el numerador y el denominador. Las dos lecturas son
    defendibles; la etiqueta describe una y publica la otra.
    [[feedback-metricas-derivadas-origen]]
  · El KPI «93,036 minutos reales conectados» no cuadra con sus dos sumandos
    del propio objeto: 55,613 + 36,736 = 92,349. Difieren 687.

LO QUE SE COMPRUEBA
-------------------
1. Entrantes y salientes contra sus tres categorías, y el gran total.
2. El desenlace de las entrantes (contestadas + perdidas + autoservicio + buzón).
3. Las perdidas de cada lado contra la suma de las perdidas por categoría.
4. Las dos series mensuales contra los totales por categoría.
5. Los repartos de perdidas externas por hora y de perdidas internas por día.
6. Las tasas mensuales recalculadas desde sus partes.
7. Las tasas de las tablas de extensión destino y departamento origen.
8. Las cuatro cuotas del resumen ejecutivo y su suma.
9. Los KPIs declarados en el HTML contra lo que sale de `DATA`.
10. Los rangos que el texto afirma contra las series reales.

Sale con 1 si algo no cierra, y DICE CUÁNTO falta. No impide publicar: impide
publicar ESA cifra sin marcarla con palabras dentro del documento.
[[feedback-contexto-ia-sin-huecos]]
"""
from __future__ import print_function
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC_POR_OMISION = os.path.join(RAIZ, 'public', 'auditorias',
                               'Hospital-Santa-Rosa-Auditoria-Forense-2026-11-26.html')
DOC = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else DOC_POR_OMISION

# Registros del corte anterior (12 nov 2026), tal como los declara el
# expediente v2.0. Sobrescribible con el segundo argumento.
REGISTROS_CORTE_ANTERIOR = int(sys.argv[2]) if len(sys.argv) > 2 else 85467

fallos = []
avisos = []


def mil(n):
    return '{:,}'.format(int(round(n)))


def falla(que, detalle):
    fallos.append((que, detalle))
    print(u'    %-50s *** NO CIERRA ***  %s' % (que, detalle))


def avisa(que, detalle):
    avisos.append((que, detalle))
    print(u'    %-50s  ~  %s' % (que, detalle))


def pasa(que, detalle=u''):
    print(u'    %-50s ok  %s' % (que, detalle))


def compara(que, suma, declarado):
    if suma == declarado:
        pasa(que, mil(declarado))
    else:
        falla(que, u'suman %s, declara %s (difieren %s)'
              % (mil(suma), mil(declarado), mil(suma - declarado)))


def lee():
    u"""Saca el `const DATA = {...};` del HTML.

    Se corta por el `;` que cierra la declaración y no contando llaves a mano:
    el objeto trae llaves dentro de cadenas.
    """
    if not os.path.exists(DOC):
        print(u'  *** No existe %s ***' % DOC)
        sys.exit(2)
    txt = io.open(DOC, encoding='utf-8').read()
    m = re.search(r'const\s+DATA\s*=\s*(\{.*?\})\s*;\s*\n', txt, re.S)
    if not m:
        print(u'  *** No pude extraer el objeto `const DATA` del documento. ***')
        print(u'      %s' % DOC)
        if re.search(r'const\s+D\s*=\s*\{', txt):
            print(u'')
            print(u'      Ese documento embebe `const D`, que es la forma del corte')
            print(u'      del 12 nov 2026. Conciliadlo con:')
            print(u'        python scripts/concilia-auditoria-santa-rosa.py <ruta>')
            print(u'      Este guion NO lo entiende y no va a fingir que sí.')
        else:
            print(u'      Si el formato del reporte cambió, este guion deja de')
            print(u'      conciliar y ESO es el hallazgo, no un detalle del parser.')
        sys.exit(2)
    return json.loads(m.group(1)), txt


def main():
    D, txt = lee()
    T = D['totales']
    C = D['clasificacion']

    print(u'')
    print(u'  CONCILIACIÓN — Hospital Santa Rosa · forma `const DATA` (corte 26 nov 2026)')
    print(u'  archivo leído: %s' % DOC)
    print(u'')

    # ── 1 · totales contra categorías ────────────────────────────────────────
    print(u'  1 · Totales contra sus tres categorías')
    ent_cat = C['ent_interna']['tot'] + C['ent_externa']['tot'] + C['ent_anomala']['tot']
    sal_cat = C['sal_interna']['tot'] + C['sal_externa']['tot'] + C['sal_anomala']['tot']
    compara(u'entrantes = interna + externa + anómala', ent_cat, T['entrantes'])
    compara(u'salientes = interna + externa + inválidas', sal_cat, T['salientes'])
    gran = T['entrantes'] + T['salientes']
    print(u'    %-50s ok  %s' % (u'gran total = entrantes + salientes', mil(gran)))

    # ── 2 · desenlace de las entrantes ───────────────────────────────────────
    print(u'')
    print(u'  2 · Desenlace de las entrantes')
    desen = (T['ent_contestadas'] + T['ent_perdidas']
             + T['ent_autoservicio'] + T['ent_buzon'])
    compara(u'contestadas + perdidas + autoservicio + buzón', desen, T['entrantes'])
    compara(u'salientes = contestadas + perdidas',
            T['sal_contestadas'] + T['sal_perdidas'], T['salientes'])

    # ── 3 · perdidas por categoría ───────────────────────────────────────────
    print(u'')
    print(u'  3 · Perdidas contra la suma de sus categorías')
    compara(u'perdidas entrantes',
            C['ent_interna']['perdidas'] + C['ent_externa']['perdidas']
            + C['ent_anomala']['perdidas'], T['ent_perdidas'])
    compara(u'perdidas salientes',
            C['sal_interna']['perdidas'] + C['sal_externa']['perdidas']
            + C['sal_anomala']['perdidas'], T['sal_perdidas'])

    # ── 4 · series mensuales contra las categorías ───────────────────────────
    print(u'')
    print(u'  4 · Series mensuales contra los totales por categoría')
    for serie, lado in (('ent_mensual', 'ent'), ('sal_mensual', 'sal')):
        for campo, cat in (('int_tot', '%s_interna' % lado), ('ext_tot', '%s_externa' % lado)):
            compara(u'%s · %s' % (serie, campo),
                    sum(r[campo] for r in D[serie]), C[cat]['tot'])
        for campo, cat in (('int_lost', '%s_interna' % lado), ('ext_lost', '%s_externa' % lado)):
            compara(u'%s · %s' % (serie, campo),
                    sum(r[campo] for r in D[serie]), C[cat]['perdidas'])

    # ── 5 · repartos por hora y por día ──────────────────────────────────────
    print(u'')
    print(u'  5 · Repartos de perdidas')
    compara(u'externas entrantes por hora del día',
            sum(D['ext_lost_by_hour']), C['ent_externa']['perdidas'])
    compara(u'internas entrantes por día de la semana',
            sum(D['int_lost_by_dow']), C['ent_interna']['perdidas'])

    # ── 6 · tasas mensuales recalculadas ─────────────────────────────────────
    print(u'')
    print(u'  6 · Tasas mensuales recalculadas desde sus partes')
    malas = 0
    for serie, lado in (('ent_mensual', 'ent'), ('sal_mensual', 'sal')):
        for suf, tot, lost in (('int', 'int_tot', 'int_lost'), ('ext', 'ext_tot', 'ext_lost')):
            decl = D['%s_%s_tasa' % (lado, suf)]
            for i, r in enumerate(D[serie]):
                calc = 100.0 * r[lost] / r[tot] if r[tot] else 0.0
                if abs(calc - decl[i]) > 0.1:
                    malas += 1
                    falla(u'%s_%s_tasa[%s]' % (lado, suf, r['mes']),
                          u'%d/%d = %.1f%%, declara %.1f%%' % (r[lost], r[tot], calc, decl[i]))
    if not malas:
        pasa(u'las 44 tasas mensuales (2 lados × 2 clases × 11 meses)',
             u'cada una sale de sus partes')

    # ── 7 · tasas de las tablas ──────────────────────────────────────────────
    print(u'')
    print(u'  7 · Tasas de las tablas de extensión y departamento')
    malas = 0
    n = 0
    for clave in ('tabla_destino', 'tabla_origen'):
        for etiqueta, r in D[clave].items():
            n += 1
            calc = 100.0 * r['lost'] / r['tot'] if r['tot'] else 0.0
            if abs(calc - r['tasa']) > 0.1:
                malas += 1
                falla(u'%s · %s' % (clave, etiqueta),
                      u'%d/%d = %.1f%%, declara %.1f%%' % (r['lost'], r['tot'], calc, r['tasa']))
    if not malas:
        pasa(u'las %d filas de las dos tablas' % n, u'cada tasa sale de sus partes')

    # ── 8 · las cuotas del resumen ejecutivo ─────────────────────────────────
    print(u'')
    print(u'  8 · Las cuotas que afirma el resumen ejecutivo')
    interna_real = 100.0 * (C['ent_interna']['tot'] + C['sal_interna']['tot']) / gran
    sal_ext_real = 100.0 * C['sal_externa']['tot'] / gran
    ent_real = 100.0 * T['entrantes'] / gran

    for rot, declarado, real in ((u'«38.2% comunicación interna»', 38.2, interna_real),
                                 (u'«15.9% salientes externas»', 15.9, sal_ext_real),
                                 (u'«53.9% entrantes»', 53.9, ent_real)):
        if abs(declarado - real) <= 0.15:
            pasa(rot, u'real %.2f%%' % real)
        else:
            falla(rot, u'real %.2f%% (declara %.1f%%, difieren %.1f pp)'
                  % (real, declarado, declarado - real))

    suma_cuotas = 38.2 + 15.9 + 53.9
    if abs(suma_cuotas - 100.0) <= 0.5:
        pasa(u'las tres cuotas suman 100%', u'%.1f%%' % suma_cuotas)
    else:
        falla(u'las tres cuotas suman 100%',
              u'suman %.1f%% — los cubos SE SOLAPAN: las entrantes internas '
              u'están contadas en «entrantes» y en «comunicación interna»' % suma_cuotas)

    # El reparto que SÍ cierra, para que el expediente lo cite en su lugar.
    print(u'')
    print(u'    Reparto sin solape, que sí cierra al 100.00%:')
    for rot, clave in ((u'entrantes internas', 'ent_interna'),
                       (u'entrantes externas', 'ent_externa'),
                       (u'entrantes anómalas', 'ent_anomala'),
                       (u'salientes internas', 'sal_interna'),
                       (u'salientes externas', 'sal_externa'),
                       (u'salientes inválidas', 'sal_anomala')):
        print(u'      %-22s %8s   %6.2f%%'
              % (rot, mil(C[clave]['tot']), 100.0 * C[clave]['tot'] / gran))
    print(u'      %-22s %8s   %6.2f%%'
          % (u'TOTAL', mil(gran), 100.0 * sum(C[k]['tot'] for k in C) / gran))

    # ── 9 · los KPIs declarados en el HTML ───────────────────────────────────
    print(u'')
    print(u'  9 · Los KPIs del encabezado contra lo que sale de DATA')

    # 24.7% interna: sólo cuadra metiendo las 689 inválidas.
    int_sin = 100.0 * (C['ent_interna']['perdidas'] + C['sal_interna']['perdidas']) \
        / (C['ent_interna']['tot'] + C['sal_interna']['tot'])
    int_con = 100.0 * (C['ent_interna']['perdidas'] + C['sal_interna']['perdidas']
                       + C['sal_anomala']['perdidas']) \
        / (C['ent_interna']['tot'] + C['sal_interna']['tot'] + C['sal_anomala']['tot'])
    if abs(24.7 - int_sin) <= 0.1:
        pasa(u'«24.7% pérdida interna (promedio ent+sal)»', u'real %.2f%%' % int_sin)
    else:
        avisa(u'«24.7% pérdida interna (promedio ent+sal)»',
              u'extensión a extensión da %.2f%%; el 24.7%% sale de incluir los '
              u'%s marcados inválidos (%.2f%%). La etiqueta describe una y publica la otra'
              % (int_sin, mil(C['sal_anomala']['tot']), int_con))

    ext_real = 100.0 * C['ent_externa']['perdidas'] / C['ent_externa']['tot']
    if abs(5.3 - ext_real) <= 0.1:
        pasa(u'«5.3% pérdida entrantes externas»', u'real %.2f%%' % ext_real)
    else:
        falla(u'«5.3% pérdida entrantes externas»', u'real %.2f%%' % ext_real)

    dev = 100.0 * D['devolucion']['exitosas'] / D['devolucion']['perdidas_ent']
    if abs(0.9 - dev) <= 0.1:
        pasa(u'«0.9% perdidas recuperadas por devolución»', u'real %.2f%%' % dev)
    else:
        falla(u'«0.9% perdidas recuperadas por devolución»', u'real %.2f%%' % dev)

    ss = 100.0 * T['ent_autoservicio'] / T['entrantes']
    if abs(7.5 - ss) <= 0.1:
        pasa(u'«7.5% entrantes resueltas en autoservicio»', u'real %.2f%%' % ss)
    else:
        falla(u'«7.5% entrantes resueltas en autoservicio»', u'real %.2f%%' % ss)

    minutos = T['min_entrantes_reales'] + T['min_salientes_reales']
    m = re.search(r'<div class="n">([\d,]+)</div><div class="l">Minutos reales', txt)
    decl_min = int(m.group(1).replace(',', '')) if m else None
    if decl_min is None:
        avisa(u'minutos declarados en el encabezado', u'no los encontré en el HTML')
    elif decl_min == minutos:
        pasa(u'minutos = entrantes + salientes', mil(minutos))
    else:
        falla(u'minutos = entrantes + salientes',
              u'%s + %s = %s, el encabezado declara %s (difieren %s)'
              % (mil(T['min_entrantes_reales']), mil(T['min_salientes_reales']),
                 mil(minutos), mil(decl_min), mil(decl_min - minutos)))

    # Evaluación: las cuatro clases cierran contra las contestadas.
    compara(u'evaluación = las cuatro clases',
            sum(D['evaluacion'].values()), T['ent_contestadas'])

    # ── 10 · rangos que el texto afirma ──────────────────────────────────────
    print(u'')
    print(u'  10 · Afirmaciones de rango contra las series reales')
    # Sólo meses CERRADOS: noviembre es mes en tránsito y el propio documento
    # dice que no se compara. Un rango que mete el mes vivo compara peras.
    cerr_ent = D['ent_int_tasa'][:-1]
    cerr_sal = D['sal_int_tasa'][:-1]
    piso = min(min(cerr_ent), min(cerr_sal))
    techo = max(max(cerr_ent), max(cerr_sal))
    if abs(piso - 22.0) <= 0.3:
        pasa(u'«la interna se mantiene en 22%–32%» · piso', u'real %.1f%%' % piso)
    else:
        falla(u'«la interna se mantiene en 22%–32%» · piso',
              u'el piso real de los meses cerrados es %.1f%% (%s), no 22%%'
              % (piso, D['meses_lbl'][cerr_ent.index(min(cerr_ent))]
                 if min(cerr_ent) == piso else D['meses_lbl'][cerr_sal.index(min(cerr_sal))]))
    if techo <= 32.0:
        pasa(u'«la interna se mantiene en 22%–32%» · techo', u'real %.1f%%' % techo)
    else:
        falla(u'«la interna se mantiene en 22%–32%» · techo', u'real %.1f%%' % techo)

    i_ago = D['meses_lbl'].index('Ago')
    if (D['ent_int_tasa'].index(max(cerr_ent)) == i_ago
            and D['sal_int_tasa'].index(max(cerr_sal)) == i_ago):
        pasa(u'agosto es el peor mes interno', u'%.1f%% ent · %.1f%% sal'
             % (D['ent_int_tasa'][i_ago], D['sal_int_tasa'][i_ago]))
    else:
        falla(u'agosto es el peor mes interno', u'el máximo cae en otro mes')

    # ¿Hay o no «mejora observable»? El documento dice que no. Se mide.
    i_oct = D['meses_lbl'].index('Oct')
    mejor_ent = min(cerr_ent) == D['ent_int_tasa'][i_oct]
    mejor_sal = min(cerr_sal) == D['sal_int_tasa'][i_oct]
    if mejor_ent and mejor_sal:
        avisa(u'«sin mejora observable» en la interna',
              u'octubre es el MEJOR mes cerrado del año en AMBAS direcciones '
              u'(%.1f%% ent · %.1f%% sal, contra %.1f%% y %.1f%% en enero). '
              u'Decir que no hay mejora observable con el último mes cerrado en '
              u'su mínimo anual es una lectura que el dato no sostiene'
              % (D['ent_int_tasa'][i_oct], D['sal_int_tasa'][i_oct],
                 D['ent_int_tasa'][0], D['sal_int_tasa'][0]))
    else:
        pasa(u'«sin mejora observable» en la interna',
             u'octubre no es el mínimo en ambas direcciones')

    # ── cierre ───────────────────────────────────────────────────────────────
    print(u'')
    print(u'  ' + u'─' * 68)
    if fallos:
        print(u'  *** %d comprobación(es) NO cierran. ***' % len(fallos))
        for que, det in fallos:
            print(u'      · %s — %s' % (que, det))
        print(u'')
        print(u'  Esto NO impide publicar: impide publicar ESAS cifras sin')
        print(u'  marcarlas. Lo que no cierra se nombra con palabras dentro del')
        print(u'  documento y en el expediente, nunca se omite en silencio.')
    else:
        print(u'  Todo cierra. Ninguna cifra agregada contradice a sus partes.')
    if avisos:
        print(u'  %d aviso(s): lectura que el dato no sostiene, no aritmética rota.' % len(avisos))
        for que, det in avisos:
            print(u'      · %s — %s' % (que, det))
    print(u'')
    sys.exit(1 if fallos else 0)


if __name__ == '__main__':
    main()
