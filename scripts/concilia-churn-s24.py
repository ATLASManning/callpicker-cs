# -*- coding: utf-8 -*-
u"""CONCILIA EL CORTE DE ANALISIS DATA · Semana 24, al 16 oct 2026.

   Antes de publicar un corte hay que exigirle que CIERRE: que las filas sumen
   su total, que los porcentajes salgan de dividir y no de copiarlos, y que un
   top-N diga cuanto deja fuera. Es el patron de `concilia-churn-t3.py`.
   [[churn-analisis-data]] [[feedback-tablas-deben-cerrar]]

   Las cifras de aqui estan TECLEADAS del correo de Valeria Zepeda. Si una no
   cuadra, el fallo puede ser del correo o de la transcripcion: las dos cosas
   hay que mirarlas antes de publicar nada.

   USO
       python scripts/concilia-churn-s24.py
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


print(u'\n  ANALISIS DATA · SEMANA 24 — conciliacion')
print(u'  ' + u'=' * 68)

# ── 1. CANCELACIONES DE OCTUBRE ────────────────────────────────────────────
CANCELACIONES = [
    (u'Jason de Mexico', 17225.00, 43, u'Migración a otro proveedor'),
    (u'KOMBITEC', 8539.00, 73, u'Migración a otro proveedor'),
    (u'WhatsHome', 3250.00, 71, u'Restructuración'),
    (u'ENCAMINO Chat', 1750.00, 11, u'Poco uso'),
    (u'TP DIGITAL', 1300.00, 105, u'Cambios organizacionales internos'),
    (u'LUNAH ECO-RESORTS', 588.00, 51, u'Sin comentarios'),
    (u'FOBE', 519.00, 1, u'Cambios organizacionales internos'),
    (u'Avezado Abogados Penales', 489.00, 8, u'Cambios organizacionales internos'),
    (u'Schimer', 489.00, 18, u'Poco uso'),
    (u'Cole Majzner arquitectos', 489.00, 40, u'Precio'),
    (u'Annova Logistics', 489.00, 29, u'Migración a otro proveedor'),
]
TOTAL_CANCEL = 35127.00
suma = sum(c[1] for c in CANCELACIONES)
print(u'\n  (1) CANCELACIONES DE OCTUBRE')
exige(len(CANCELACIONES) == 11, u'son las 11 que anuncia el correo',
      u'hay %d' % len(CANCELACIONES))
exige(abs(suma - TOTAL_CANCEL) < 0.01, u'las filas suman el total',
      u'filas %s · total %s · dif %s' % (dinero(suma), dinero(TOTAL_CANCEL),
                                         dinero(suma - TOTAL_CANCEL)))

# ── 2. CARTERA POR COBRAR ──────────────────────────────────────────────────
TRAMOS = [
    (u'Por vencer', 0.00, 0),
    (u'1 - 7 días', 0.00, 0),
    (u'8 - 15 días', 38671.30, 27),
    (u'16 - 30 días', 8866.00, 15),
    (u'+30 días', 3505.00, 3),
]
TOTAL_CARTERA, TOTAL_CLIENTES = 51042.30, 45
print(u'\n  (2) CARTERA POR COBRAR')
exige(abs(sum(t[1] for t in TRAMOS) - TOTAL_CARTERA) < 0.01,
      u'los tramos suman el total',
      u'%s contra %s' % (dinero(sum(t[1] for t in TRAMOS)), dinero(TOTAL_CARTERA)))
exige(sum(t[2] for t in TRAMOS) == TOTAL_CLIENTES,
      u'los clientes por tramo suman los 45',
      u'%d contra %d' % (sum(t[2] for t in TRAMOS), TOTAL_CLIENTES))

# ── 3. CIERRE DE SEPTIEMBRE · HARD SUSPEND ─────────────────────────────────
HARD = [
    (u'Hoteles y Servicios', 10946.98, 2, u'29 ago 2026', 48),
    (u'Skyhous', 2497.00, 65, u'05 sep 2026', 41),
    (u'Uno Suministros', 1759.00, 70, u'18 sep 2026', 28),
    (u'Epinova Bio Labs', 1177.00, 9, u'26 sep 2026', 20),
]
TOTAL_HARD = 12371.00
s_hard = sum(h[1] for h in HARD)
print(u'\n  (3) SEPTIEMBRE · HARD SUSPEND')
exige(abs(s_hard - TOTAL_HARD) < 0.01, u'las cuatro filas suman el total',
      u'filas %s · total declarado %s · dif %s'
      % (dinero(s_hard), dinero(TOTAL_HARD), dinero(s_hard - TOTAL_HARD)))
# Si no cierra, ¿cierra sin el caso en disputa?
sin_hoteles = s_hard - HARD[0][1]
print(u'      sin «Hoteles y Servicios» (el caso en duda): %s' % dinero(sin_hoteles))
if abs(sin_hoteles - TOTAL_HARD) < 0.01:
    print(u'      -> el total declarado YA lo excluye')

# ── 4. DOWNGRADES ──────────────────────────────────────────────────────────
POR_PRODUCTO = [
    (u'paquete Min VyC', 17326.00, 7),
    (u'Extension VyC', 10161.97, 2),
    (u'DiD Nacional', 1671.00, 4),
    (u'paquete Min Voicebot', 2000.00, 1),
    (u'paquete Min CE', 1029.00, 1),
]
TOP_DOWN = [
    (u'Portalia', 9754.97),
    (u'TUNALI TEC', 5404.00),
    (u'Corporativo grupo funerario San Javier', 1959.00),
    (u'Grupo Guía', 1600.00),
]
DETALLE = 18717.97
TOTAL_DOWN = 31620.33
print(u'\n  (4) DOWNGRADES')
exige(abs(sum(t[1] for t in TOP_DOWN) - DETALLE) < 0.01,
      u'el Top 4 suma la «sumatoria a detalle»',
      u'%s contra %s' % (dinero(sum(t[1] for t in TOP_DOWN)), dinero(DETALLE)))
bruto = sum(p[1] for p in POR_PRODUCTO)
print(u'      impacto BRUTO por producto: %s' % dinero(bruto))
print(u'      total de downgrades (neto): %s' % dinero(TOTAL_DOWN))
print(u'      diferencia: %s' % dinero(bruto - TOTAL_DOWN))
print(u'      El correo AVISA que no coinciden 1:1 — la tabla de productos es')
print(u'      bruta y no netea el upsell de la misma cuenta (TUNALI añade Chat).')
print(u'      NO se suman las dos tablas. [[churn-analisis-data]]')
print(u'      el Top 4 deja fuera %s del total neto (%.1f%%)'
      % (dinero(TOTAL_DOWN - DETALLE), 100.0 * (TOTAL_DOWN - DETALLE) / TOTAL_DOWN))

# ── 5. EL TOP 5 DE ACTIVOS, Y CUANTO DEJA FUERA ────────────────────────────
TOP_ACTIVOS = [
    (u'Blueservices', 24616.03, 43),
    (u'Azyco Guadalajara', 22984.00, 25),
    (u'Gas Economico Metropolitano', 18659.00, 43),
    (u'VAEO', 15995.52, 5),
    (u'FabricAir Latin America', 15186.41, 68),
]
CARTERA_ACTIVA = 408857.69
s_top = sum(t[1] for t in TOP_ACTIVOS)
print(u'\n  (5) TOP 5 DE ACTIVOS')
print(u'      el top suma %s de %s (%.1f%%)'
      % (dinero(s_top), dinero(CARTERA_ACTIVA), 100.0 * s_top / CARTERA_ACTIVA))
print(u'      DEJA FUERA %s, el %.1f%% de la cartera activa.'
      % (dinero(CARTERA_ACTIVA - s_top), 100.0 * (CARTERA_ACTIVA - s_top) / CARTERA_ACTIVA))
print(u'      Se publica con cubo «otros» explicito o el lector lo lee como')
print(u'      si el top fuera la cartera. [[feedback-tablas-deben-cerrar]]')

# ── 6. LOS PORCENTAJES, RECONSTRUIDOS ──────────────────────────────────────
print(u'\n  (6) CHURN Q3 — lo que publica el correo')
print(u'      julio ....... 1.9%')
print(u'      agosto ...... 2.3%  ->  2.1%   (reexpresado)')
print(u'      septiembre .. 6.9%  ->  2.6%   (reexpresado · NO DEFINITIVO)')
print(u'      acumulado ... 23.7% -> 19.5%   (NO DEFINITIVO)')
print(u'      Los meses cerrados SE REEXPRESAN conforme entran pagos tardios:')
print(u'      que una cifra ya reportada cambie no es un error. [[regla-churn-mes-vencido]]')
print(u'      El correo NO trae la base de MRR de cada mes, asi que estos')
print(u'      porcentajes NO se pueden reconstruir dividiendo. Se publican como')
print(u'      vienen y se dice que son del reporte. [[feedback-metricas-derivadas-origen]]')

print(u'\n  ' + u'=' * 68)
if fallos:
    print(u'  *** %d COMPROBACION(ES) NO CIERRAN: %s' % (len(fallos), u' · '.join(fallos)))
    print(u'      Preguntar a Data antes de publicar.')
    sys.exit(1)
print(u'  Todo lo que puede cerrarse, cierra.')
print(u'')
