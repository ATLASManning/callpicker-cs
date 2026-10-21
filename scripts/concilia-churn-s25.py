# -*- coding: utf-8 -*-
u"""CONCILIA EL CORTE DE ANALISIS DATA · Semana 25, al 21 oct 2026.

   Antes de publicar un corte hay que exigirle que CIERRE: que las filas sumen
   su total y que un top-N diga cuanto deja fuera. Y hay que compararlo con el
   corte ANTERIOR, porque lo que mas dice de un corte es lo que cambio de golpe.
   [[churn-analisis-data]] [[feedback-tablas-deben-cerrar]]

   Las cifras estan TECLEADAS del correo de Valeria Zepeda. Si una no cuadra,
   el fallo puede ser del correo o de la transcripcion: las dos hay que
   mirarlas antes de publicar nada.

   USO
       python scripts/concilia-churn-s25.py
"""
import io
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

fallos = []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


def dinero(x):
    return u'$' + format(round(x, 2), ',.2f')


print(u'\n  ANALISIS DATA · SEMANA 25 (21 oct 2026) — conciliacion')
print(u'  ' + u'=' * 70)

# ── 1. CANCELACIONES ───────────────────────────────────────────────────────
CANCELACIONES = [
    (u'Grupo Turístico Rumbo S de RL de CV', 4349.00, 6, u'Comenta que no lo usaba'),
    (u'PSI Division Latinoamérica', 2359.50, 21, u'Cierre de proyecto'),
]
TOTAL_CANCEL = 6708.50
print(u'\n  (1) CANCELACIONES DE OCTUBRE')
s = sum(c[1] for c in CANCELACIONES)
exige(len(CANCELACIONES) == 2, u'son los 2 clientes que anuncia el correo')
exige(abs(s - TOTAL_CANCEL) < 0.01, u'las filas suman el total',
      u'filas %s · total %s' % (dinero(s), dinero(TOTAL_CANCEL)))

# ── 2. SOFT / HARD SUSPEND ─────────────────────────────────────────────────
SUSPEND = [(u'Soft Suspend', 4, 13.0, 10638.00),
           (u'Hard Suspend', 12, 17.6, 16311.28)]
TOTAL_SUSP, TOTAL_SUSP_N = 26949.28, 16
print(u'\n  (2) SOFT / HARD SUSPEND')
exige(abs(sum(x[3] for x in SUSPEND) - TOTAL_SUSP) < 0.01,
      u'los dos estatus suman el total',
      u'%s contra %s' % (dinero(sum(x[3] for x in SUSPEND)), dinero(TOTAL_SUSP)))
exige(sum(x[1] for x in SUSPEND) == TOTAL_SUSP_N,
      u'los clientes por estatus suman los 16')

# ── 3. CARTERA POR COBRAR ──────────────────────────────────────────────────
# OJO: este corte NO trae tramo «Por vencer». El anterior lo traia en cero.
TRAMOS = [(u'1 - 7 días', 177513.29, 107),
          (u'8 - 15 días', 74008.03, 51),
          (u'16 - 30 días', 20798.28, 15),
          (u'+30 días', 0.00, 0)]
TOTAL_CART, TOTAL_CART_N = 272319.60, 173
print(u'\n  (3) CARTERA POR COBRAR')
exige(abs(sum(t[1] for t in TRAMOS) - TOTAL_CART) < 0.01,
      u'los tramos suman el total',
      u'%s contra %s' % (dinero(sum(t[1] for t in TRAMOS)), dinero(TOTAL_CART)))
exige(sum(t[2] for t in TRAMOS) == TOTAL_CART_N,
      u'los clientes por tramo suman los 173')
print(u'      NO hay tramo «Por vencer»: el corte anterior lo traia en CERO y')
print(u'      este no lo reporta. O sea que TODO lo de esta tabla esta vencido.')

# ── 4. DOWNGRADES ──────────────────────────────────────────────────────────
DOWN = [(u'Proseso Consultores', 2210.00, 81),
        (u'Sparkgam', 539.00, 52),
        (u'Hotel Real de Minas San Miguel de Allende', 2490.00, 48),
        (u'Huellitas Resort GDL', 799.00, 33)]
TOTAL_DOWN, TOTAL_DOWN_N = 6038.00, 4
print(u'\n  (4) DOWNGRADES')
sd = sum(d[1] for d in DOWN)
exige(abs(sd - TOTAL_DOWN) < 0.01, u'las filas suman el total',
      u'%s contra %s' % (dinero(sd), dinero(TOTAL_DOWN)))
exige(len(DOWN) == TOTAL_DOWN_N,
      u'la lista esta COMPLETA: son los 4 que declara, no un top')
mayor_pct = max(DOWN, key=lambda d: d[2])
mayor_mxn = max(DOWN, key=lambda d: d[1])
print(u'      el marcado «top» es el de mayor %, no el de mayor importe:')
print(u'        por %%      -> %s (%d%%, %s)' % (mayor_pct[0], mayor_pct[2], dinero(mayor_pct[1])))
print(u'        por dinero -> %s (%d%%, %s)' % (mayor_mxn[0], mayor_mxn[2], dinero(mayor_mxn[1])))

# ── 5. TOP 5 DE ACTIVOS, Y CUANTO DEJA FUERA ───────────────────────────────
TOP = [(u'HomiRent', 11998.00, 52), (u'MKG', 11283.03, 157),
       (u'CS7', 11073.00, 33), (u'LI FINANCIERA', 9104.00, 11),
       (u'SIMAGASMEX', 8272.00, 9)]
CARTERA_ACT, CARTERA_ACT_N = 128640.37, 26
st = sum(t[1] for t in TOP)
print(u'\n  (5) TOP 5 DE ACTIVOS')
print(u'      el top suma %s de %s (%.1f%%) sobre %d clientes'
      % (dinero(st), dinero(CARTERA_ACT), 100.0 * st / CARTERA_ACT, CARTERA_ACT_N))
print(u'      DEJA FUERA %s en 21 clientes, el %.1f%%.'
      % (dinero(CARTERA_ACT - st), 100.0 * (CARTERA_ACT - st) / CARTERA_ACT))
print(u'      MKG lleva 157 MESES = 13 años y un mes.')

# ── 6. CONTRA EL CORTE ANTERIOR — lo que cambio de golpe ───────────────────
print(u'\n  (6) CONTRA LA SEMANA 24 (16 oct, cinco dias antes)')
S24 = {u'cartera activa': (408857.69, CARTERA_ACT),
       u'cartera por cobrar': (51042.30, TOTAL_CART),
       u'cancelaciones': (35127.00, TOTAL_CANCEL),
       u'downgrades': (31620.33, TOTAL_DOWN)}
for k, (antes, ahora) in S24.items():
    d = ahora - antes
    print(u'      %-20s %14s -> %14s  %+.1f%%'
          % (k, dinero(antes), dinero(ahora), 100.0 * d / antes))
print(u'      clientes en cartera por cobrar: 45 -> 173')
print(u'      LOS CINCO DEL TOP DE ACTIVOS CAMBIAN ENTEROS: ninguno se repite.')

# ── 7. LOS PORCENTAJES ─────────────────────────────────────────────────────
print(u'\n  (7) CHURN — lo que publica el correo')
print(u'      agosto ...... 2.1%')
print(u'      septiembre .. 2.6%  ->  2.5%   (reexpresado)')
print(u'      octubre ..... 22.1%            MES CORRIENDO · NO DEFINITIVO')
print(u'      acumulado ... 41.6%            NO DEFINITIVO')
suma = 19.5 + 22.1
print(u'      EL ACUMULADO SALE DE SUMAR: 19.5% (hasta sept, semana 24)')
print(u'      + 22.1%% (octubre) = %.1f%%, que es el 41.6%% declarado.' % suma)
print(u'      No es un ponderado: hereda ENTERO el 22.1% no definitivo.')
print(u'      Y septiembre bajo de 2.6 a 2.5, asi que la base deberia ser 19.4.')

print(u'\n  ' + u'=' * 70)
if fallos:
    print(u'  *** %d COMPROBACION(ES) NO CIERRAN: %s' % (len(fallos), u' · '.join(fallos)))
    sys.exit(1)
print(u'  Todo lo que puede cerrarse, cierra. Lo que no cuadra es la')
print(u'  COMPARACION con el corte anterior, y eso se pregunta, no se arregla.')
print(u'')
