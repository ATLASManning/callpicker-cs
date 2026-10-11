# -*- coding: utf-8 -*-
u"""Que lo publicado coincida con el TABLERO OFICIAL de Zoho, celda por celda.

   POR QUE EXISTE
   --------------
   `verifica-grc.py` comprueba que el archivo generado sea coherente CONSIGO
   MISMO: que las canastas agoten la perdida, que el acumulado sea la suma de
   los mensuales, que ninguna desmentida se cuele. Todo eso puede cuadrar
   perfectamente y aun asi no ser lo que el tablero institucional publica.

   Esto es lo otro: el contraste contra la FUENTE OFICIAL. Las cifras de abajo
   estan transcritas del tablero «DASHBOARD GROSS REVENUE CHURN (%) - 2025 Y
   2026», pestaña «GRC 2026», tabla «Gross Revenue Churn - 2026 confirmado»,
   compartido por direccion el 11 oct 2026.

   LAS CIFRAS SE TRANSCRIBEN, NO SE CALCULAN
   -----------------------------------------
   Es a proposito: si se derivaran del mismo archivo que se quiere comprobar,
   la prueba cerraria por construccion y no probaria nada. Ver
   [[feedback-metricas-derivadas-origen]].

   Lo que SI se recalcula aqui es el «Resumen amplio», porque el tablero lo
   publica y eso permite comprobar que la transcripcion de las diez filas es
   correcta: si al sumarlas no da el resumen que el propio tablero imprime, es
   que me equivoque copiando.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/verifica-contra-tablero.py
"""
import io
import json
import os
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENT = 0.005

# ── TRANSCRIPCION DEL TABLERO (11 oct 2026) ─────────────────────────────────
#   mes: (MRR inicio, Churn, Downgrade, Perdida, GRC mensual %, GRC acum %)
TABLERO = [
    (u'Enero',      4650270.89,   74083.11, 20848.01,   94931.12,  2.0,  2.0),
    (u'Febrero',    4696946.10,   65589.19, 34216.37,   99805.56,  2.1,  4.2),
    (u'Marzo',      4777170.30,   82546.00, 25734.97,  108280.97,  2.3,  6.4),
    (u'Abril',      4857421.51,   58214.06, 26413.59,   84627.65,  1.7,  8.2),
    (u'Mayo',       5076566.09,   32586.00, 42283.26,   74869.26,  1.5,  9.6),
    (u'Junio',      5103995.12,   87260.00, 81522.81,  168782.81,  3.3, 13.0),
    (u'Julio',      4944264.29,   69086.46, 25576.75,   94663.21,  1.9, 14.9),
    (u'Agosto',     5013922.60,   56212.78, 49851.84,  106064.62,  2.1, 17.0),
    (u'Septiembre', 4950369.50,   79483.96, 55273.67,  134757.63,  2.7, 19.7),
    (u'Octubre',    4886742.85, 2528125.71, 22307.46, 2550433.17, 52.2, 71.9),
]
# La fila «Resumen amplio» que el propio tablero imprime al pie.
RESUMEN = {'mrr': 48957669.25, 'churn': 3133187.27,
           'down': 384028.73, 'perdida': 3517216.00, 'grc': 7.2}

fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


def mx(n):
    return u'$%s' % format(round(n, 2), ',.2f')


# ── 1 · ¿Copié bien? El resumen del tablero valida mi transcripción ─────────
print(u'\n  1 · LA TRANSCRIPCIÓN, contra el «Resumen amplio» del propio tablero\n')
for k, i in ((u'mrr', 1), (u'churn', 2), (u'down', 3), (u'perdida', 4)):
    s = sum(f[i] for f in TABLERO)
    exige(abs(s - RESUMEN[k]) < CENT,
          u'las 10 filas suman el resumen en «%s»' % k,
          u'%s contra %s que imprime el tablero' % (mx(s), mx(RESUMEN[k])))

# El % del resumen se RECONSTRUYE, no se espeja.
g = 100.0 * RESUMEN['perdida'] / RESUMEN['mrr']
exige(abs(g - RESUMEN['grc']) < 0.05,
      u'el GRC del resumen se reconstruye (%.2f%%)' % g,
      u'el tablero publica %.1f%%' % RESUMEN['grc'])

# Y cada fila: perdida = churn + downgrade, y el % contra su propia base.
print(u'')
for mes, mrr, ch, dw, pe, pct, acum in TABLERO:
    exige(abs((ch + dw) - pe) < CENT, u'%-11s churn + downgrade = pérdida' % mes,
          u'%s + %s = %s' % (mx(ch), mx(dw), mx(pe)))
print(u'')
for mes, mrr, ch, dw, pe, pct, acum in TABLERO:
    c = 100.0 * pe / mrr
    exige(abs(c - pct) < 0.05, u'%-11s el %% mensual se reconstruye (%.2f%%)' % (mes, c),
          u'el tablero publica %.1f%%' % pct)

# El acumulado es la suma corrida de los mensuales — verificado en el pivote.
#
# SE SUMAN LOS EXACTOS, NO LOS REDONDEADOS. Sumar los porcentajes ya
# redondeados que el tablero imprime (2.0 + 2.1 + …) arrastra una décima de
# error y da falsos fallos en seis de diez meses. El tablero suma los exactos
# y redondea al final; esta prueba hace lo mismo.
print(u'')
a = 0.0
for mes, mrr, ch, dw, pe, pct, acum in TABLERO:
    a += 100.0 * pe / mrr
    exige(abs(a - acum) < 0.06, u'%-11s el acumulado es la suma corrida (%.2f%%)' % (mes, a),
          u'el tablero publica %.1f%%' % acum)

# ── 2 · Contra lo que PUBLICAMOS ────────────────────────────────────────────
print(u'\n  2 · CONTRA `data/grc-zoho.json`, que es lo que sirve la pantalla\n')
d = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
serie = {m['mes']: m for m in (d.get('serie') or [])}
exige(len(serie) == len(TABLERO),
      u'publicamos los %d meses del tablero' % len(TABLERO),
      u'hay %d: %s' % (len(serie), u', '.join(serie)))

for mes, mrr, ch, dw, pe, pct, acum in TABLERO:
    m = serie.get(mes)
    if not m:
        exige(False, u'%-11s está publicado' % mes)
        continue
    exige(abs(m['mrrInicio'] - mrr) < 1, u'%-11s MRR inicio' % mes,
          u'publicado %s · tablero %s' % (mx(m['mrrInicio']), mx(mrr)))
    exige(abs(m['churn'] - ch) < 1, u'%-11s churn' % mes,
          u'publicado %s · tablero %s' % (mx(m['churn']), mx(ch)))
    exige(abs(m['downgrade'] - dw) < 1, u'%-11s downgrade' % mes,
          u'publicado %s · tablero %s' % (mx(m['downgrade']), mx(dw)))

# ── 3 · Contra `GRC_BASE_MRR`, el denominador que usa el módulo Churn ───────
print(u'\n  3 · CONTRA `GRC_BASE_MRR` de app/churn/grc-reporte.ts\n')
import re
txt = io.open(os.path.join(RAIZ, 'app', 'churn', 'grc-reporte.ts'), encoding='utf-8').read()
m = re.search(r'export const GRC_BASE_MRR[^=]*=\s*\{([^}]*)\}', txt)
base = {}
if m:
    for k, v in re.findall(r'(\w+)\s*:\s*([0-9.]+)', m.group(1)):
        base[k] = float(v)
for mes, mrr, ch, dw, pe, pct, acum in TABLERO:
    b = base.get(mes)
    if b is None:
        exige(False, u'%-11s está en GRC_BASE_MRR' % mes)
        continue
    # AL CENTAVO, no «aproximadamente». Un denominador redondeado da un
    # porcentaje que no es el del tablero.
    exige(abs(b - mrr) < CENT, u'%-11s la base coincide AL CENTAVO' % mes,
          u'repo %s · tablero %s' % (mx(b), mx(mrr)))

print(u'\n  ═══════════════════════════════════════════════════════════')
if fallos:
    print(u'  *** %d comprobación(es) fallan contra el tablero oficial.' % len(fallos))
    sys.exit(1)
print(u'  LO PUBLICADO ES LO QUE DICE EL TABLERO OFICIAL, celda por celda.')
