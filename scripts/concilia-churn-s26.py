# -*- coding: utf-8 -*-
u"""CONCILIA EL CORTE DE ANALISIS DATA · Semana 26, al 27 oct 2026.

   Las cifras estan TECLEADAS del correo de Valeria Zepeda. Si una no cuadra,
   el fallo puede ser del correo o de la transcripcion: las dos hay que
   mirarlas antes de publicar nada. [[churn-analisis-data]]

   USO
       python scripts/concilia-churn-s26.py
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


def d(x):
    return u'$' + format(round(x, 2), ',.2f')


print(u'\n  ANALISIS DATA · SEMANA 26 (27 oct 2026) — conciliacion')
print(u'  ' + u'=' * 72)

# ── 1. CANCELACIONES — un TOP 5 sobre 11 clientes ──────────────────────────
TOP_CANCEL = [
    (u'Biolaboratorio Sadat', 7184.00, 56, u'Sin Respuesta'),
    (u'UAXI Tecnología', 4041.00, 8, u'Limitaciones del servicio'),
    (u'enMazatlan', 3480.00, 73, u'Sin Respuesta'),
    (u'ZD - Grupo Gira', 2355.00, 5, u'Finalización de contrato con el cliente'),
    (u'Quality Orbi', 979.00, 40, u'Sin Respuesta'),
]
TOTAL_CANCEL, N_CANCEL = 20234.00, 11
s = sum(c[1] for c in TOP_CANCEL)
print(u'\n  (1) CANCELACIONES — el corte detalla un TOP 5 de 11')
print(u'      el top 5 suma %s de %s' % (d(s), d(TOTAL_CANCEL)))
print(u'      DEJA FUERA %s en %d clientes, el %.1f%%'
      % (d(TOTAL_CANCEL - s), N_CANCEL - len(TOP_CANCEL),
         100.0 * (TOTAL_CANCEL - s) / TOTAL_CANCEL))
exige(s <= TOTAL_CANCEL, u'el top no supera al total declarado')
print(u'      -> necesita cubo «otros» o la tabla miente por omision.')
print(u'      [[feedback-tablas-deben-cerrar]]')

# ── 2. SOFT / HARD SUSPEND ─────────────────────────────────────────────────
SUSP = [(u'Soft Suspend', 35, 11.1, 36450.84), (u'Hard Suspend', 28, 21.0, 21671.00)]
T_SUSP, N_SUSP = 58121.84, 63
print(u'\n  (2) SOFT / HARD SUSPEND')
exige(abs(sum(x[3] for x in SUSP) - T_SUSP) < 0.01, u'los dos estatus suman el total',
      u'%s contra %s' % (d(sum(x[3] for x in SUSP)), d(T_SUSP)))
exige(sum(x[1] for x in SUSP) == N_SUSP, u'los clientes suman los 63')

# ── 3. CARTERA POR COBRAR ──────────────────────────────────────────────────
TRAMOS = [(u'Por vencer', 21138.41, 6), (u'1 - 7 días', 307946.40, 218),
          (u'8 - 15 días', 88958.84, 56), (u'16 - 30 días', 74798.35, 76),
          (u'+30 días', 5099.00, 7)]
T_CART, N_CART = 497941.00, 363
print(u'\n  (3) CARTERA POR COBRAR')
exige(abs(sum(t[1] for t in TRAMOS) - T_CART) < 0.01, u'los tramos suman el total',
      u'%s contra %s' % (d(sum(t[1] for t in TRAMOS)), d(T_CART)))
exige(sum(t[2] for t in TRAMOS) == N_CART, u'los clientes por tramo suman los 363')
print(u'      OJO CON «POR VENCER»: el propio corte aclara que agrupa a los')
print(u'      clientes «sin fecha de corte registrada aun». NO es deuda joven:')
print(u'      es un HUECO DE MEDICION con nombre de tramo. Son %s en %d'
      % (d(21138.41), 6))
print(u'      clientes, el %.1f%% del total. [[feedback-cero-sin-medicion]]'
      % (100.0 * 21138.41 / T_CART))

# ── 4. TOP 5 DE ACTIVOS ────────────────────────────────────────────────────
TOP_ACT = [(u'FabricAir Latin America', 15186.41, 68), (u'ATP Sofom', 14848.97, 27),
           (u'ABRL Sistemas & Proyectos', 14665.00, 83), (u'SW Sapien', 13668.02, 49),
           (u'Inverdental', 10186.00, 75)]
CART_ACT = 206983.42
st = sum(t[1] for t in TOP_ACT)
print(u'\n  (4) TOP 5 DE ACTIVOS')
print(u'      el top suma %s de %s (%.1f%%)' % (d(st), d(CART_ACT), 100.0 * st / CART_ACT))
print(u'      DEJA FUERA %s, el %.1f%%.' % (d(CART_ACT - st), 100.0 * (CART_ACT - st) / CART_ACT))
print(u'      Este corte NO dice cuantos clientes tiene la cartera activa;')
print(u'      el anterior decia 26. No se arrastra: se dice que no lo trae.')

# ── 5. DOWNGRADES — «no significativos» NO ES CERO ─────────────────────────
print(u'\n  (5) DOWNGRADES')
print(u'      el corte dice: «No hay downgrades significativos en la semana.»')
print(u'      ESO NO ES UN CERO MEDIDO. «No significativos» es un JUICIO, y')
print(u'      ademas habla de la SEMANA mientras el resto del corte habla del')
print(u'      MES. Publicar $0 afirmaria que en octubre no hubo ninguno, y el')
print(u'      corte anterior reportaba 4 por $6,038.00 EN EL MISMO MES.')
print(u'      Se publica NO REPORTADO. [[feedback-cero-sin-medicion]]')

# ── 6. LOS PORCENTAJES, Y EL ACUMULADO QUE AHORA SI SALE ───────────────────
print(u'\n  (6) CHURN — y una correccion del propio reporte')
print(u'      agosto ...... 2.1%')
print(u'      septiembre .. 2.5%')
print(u'      octubre ..... 22.1%% -> 12.4%  MES CORRIENDO · NO DEFINITIVO'.replace('%%', '%'))
print(u'      acumulado ... 31.8%                     NO DEFINITIVO')
base = 31.8 - 12.4
print(u'      EL ACUMULADO SIGUE SALIENDO DE SUMAR: %.1f%% + 12.4%% = 31.8%%'
      % base)
exige(abs(base - 19.4) < 0.05,
      u'la base del acumulado es ahora 19.4%, no 19.5%',
      u'31.8 - 12.4 = %.1f' % base)
print(u'      LA SEMANA 25 USABA 19.5% Y LO MARCAMOS: septiembre se habia')
print(u'      reexpresado a 2.5% y la base debia bajar a 19.4%. Este corte YA')
print(u'      USA 19.4%. Queda corregido en el origen.')

# ── 7. CONTRA LA SEMANA 25 ─────────────────────────────────────────────────
print(u'\n  (7) CONTRA LA SEMANA 25 (21 oct, seis dias antes)')
for k, antes, ahora in ((u'cartera activa', 128640.37, CART_ACT),
                        (u'cartera por cobrar', 272319.60, T_CART),
                        (u'cancelaciones', 6708.50, TOTAL_CANCEL),
                        (u'suspendidos', 26949.28, T_SUSP)):
    print(u'      %-20s %14s -> %14s  %+.1f%%'
          % (k, d(antes), d(ahora), 100.0 * (ahora - antes) / antes))
print(u'      clientes: cartera por cobrar 173 -> 363 · suspendidos 16 -> 63')
print(u'      octubre (mes vivo): 22.1%% -> 12.4%%, casi la mitad en seis dias.'.replace('%%', '%'))
print(u'      LOS CINCO DEL TOP DE ACTIVOS CAMBIAN ENTEROS OTRA VEZ: ninguno')
print(u'      de HomiRent, MKG, CS7, LI FINANCIERA ni SIMAGASMEX aparece. Es')
print(u'      el TERCER corte seguido en que el top se renueva al completo.')
print(u'\n      Y LAS DOS CANCELACIONES DE LA SEMANA 25 NO ESTAN EN ESTE TOP 5:')
print(u'      Grupo Turistico Rumbo ($4,349.00) seria la #2 y PSI Division')
print(u'      ($2,359.50) la #4 por importe. O se recuperaron, o se')
print(u'      reclasificaron. Hay que preguntarlo.')

print(u'\n  ' + u'=' * 72)
if fallos:
    print(u'  *** %d COMPROBACION(ES) NO CIERRAN: %s' % (len(fallos), u' · '.join(fallos)))
    sys.exit(1)
print(u'  Todo lo que puede cerrarse, cierra. Lo que no se puede medir va')
print(u'  dicho con palabras, no con un cero.')
print(u'')
