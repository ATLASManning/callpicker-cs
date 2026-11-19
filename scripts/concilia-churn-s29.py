# -*- coding: utf-8 -*-
u"""CONCILIA EL CORTE S29 DE ANÁLISIS DATA ANTES DE PUBLICARLO.

   Mismo patrón que `concilia-churn-s28.py`: transcribe las cifras del correo y
   les exige que CIERREN; reconstruye los porcentajes DIVIDIENDO o RESTANDO en
   vez de espejearlos; y mira HACIA ATRÁS, contra los cortes ya archivados del
   mismo mes, que es lo único que destapa una rebanada rotulada «el mes».
   [[churn-analisis-data]] [[feedback-tablas-deben-cerrar]]

   LO QUE ESTE CORTE TIENE DE RARO:

     · VUELVEN LAS CANCELACIONES, Y CON OTRA FORMA. La S28 no las traía. Ésta
       declara 43 clientes y $76,762.84 en octubre, pero publica SÓLO EL TOP 10
       ($53,204.84). Y añade un bloque que nunca había venido: el CONTEO DE
       MOTIVOS, que sí cubre los 43.
     · LA S27 DECLARÓ 20 CLIENTES Y $75,295.50 DEL MISMO OCTUBRE. Ahora son 43
       por $76,762.84: +23 clientes por sólo +$1,467.34. La sección 7 mira si
       eso cuadra nombre por nombre o si una de las dos lecturas es parcial.
     · SU PROPIA ENTRADA ANUNCIA «cartera por cobrar» Y EL CUERPO NO LA TRAE.
       Un bloque ausente no es un cero, y menos cuando el correo dice que
       viene. Se publica «no reportado» y se pregunta.
     · LOS DOWNGRADES VUELVEN A SER UN JUICIO SIN CIFRA («no hay downgrades
       significativos»), igual que en la S26. [[feedback-cero-sin-medicion]]

   USO
       python -I scripts/concilia-churn-s29.py
"""
import io
import json
import os
import re
import sys
import unicodedata

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

fallos = []
avisos = []


def ok(cond, etiqueta, detalle=u''):
    print(u'  %-58s %s%s' % (etiqueta, u'OK' if cond else u'*** NO CIERRA',
                             (u'  ' + detalle) if detalle else u''))
    if not cond:
        fallos.append(etiqueta)
    return cond


def pesos(x):
    return u'$' + format(x, ',.2f')


def cerca(a, b, tol=0.01):
    return abs(a - b) <= tol


def norm(s):
    s = unicodedata.normalize('NFKD', str(s))
    s = u''.join(c for c in s if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '', s.lower())


def seccion(n, titulo):
    print(u'\n  %s %s' % (u'-' * 3, titulo))


# ════════════════════════════════════════════════════════════════════════════
# LO QUE DICE EL CORREO, transcrito. Nada aquí se calcula: se copia.
# «Análisis Seguimiento - Gross Revenue Churn · Semana 29», Valeria Zepeda
# Hernández (equipo Data). Cuerpo «Al 19 de noviembre del 2026».
# ════════════════════════════════════════════════════════════════════════════
PCT = {
    'octubre':        (6.5, 6.1),    # (anterior, nuevo)
    'acumulado_oct': (25.9, 25.4),
}
# Septiembre y agosto NO vienen en este corte: se conservan de la serie.
SEP_VIGENTE = 2.4
AGO_VIGENTE = 2.1

# ── Cancelados de OCTUBRE ──────────────────────────────────────────────────
CANC_OCT_TOTAL_DECL    = 76762.84
CANC_OCT_CLIENTES_DECL = 43
CANC_OCT_TOP_DECL      = 53204.84     # «$53,204.84 de $76,762.84»
TOP10_OCT = [
    # (cliente, importe, meses activo)
    (u'Jason de Mexico',                      17225.00, 43),
    (u'KOMBITEC',                              8539.00, 73),
    (u'SOBERANI',                              5235.00,  8),
    (u'GRUPO TURISTICO RUMBO S DE RL DE CV',   4349.00,  6),
    (u'UAXI Tecnologia',                       4041.00,  8),
    (u'WhatsHome',                             3250.00, 71),
    (u'Inversionistas LR',                     3119.00, 14),
    (u'GRUPO 2711 (BATERIAS SENDERO)',         2732.34, 77),
    (u'PSI Division Latinoamerica',            2359.50, 21),
    (u'ZD - Grupo Gira',                       2355.00,  5),
]

# ── Conteo de motivos (sobre los 43) ───────────────────────────────────────
MOTIVOS_DECL_CON = 17     # «17 de 43 cancelados tienen motivo registrado»
MOTIVOS_DECL_SIN = 26
MOTIVOS = [
    # (motivo, clientes, importe)
    (u'No lo usa / no lo necesita',              4,  7597.00),
    (u'Reestructuracion / cierre de proyecto',   3,  7964.50),
    (u'Cierre de operaciones / empresa',         3,  1147.00),
    (u'Cambio de proveedor',                     2, 25764.00),
    (u'Servicio contratado para un tercero',     2,  1599.00),
    (u'Limitaciones del servicio',               1,  4041.00),
    (u'Cambio a otra herramienta (CRM)',         1,   489.00),
    (u'Situacion economica',                     1,   489.00),
    (u'Sin motivo registrado',                  26, 27672.34),
]
MOTIVOS_TOTAL_DECL = 76762.84
MOTIVOS_CLIENTES_DECL = 43

# ── Cancelados de NOVIEMBRE ────────────────────────────────────────────────
CANC_NOV_TOTAL_DECL    = 7818.00
CANC_NOV_CLIENTES_DECL = 8
NOV = [
    # (cliente, importe, meses activo, motivo)
    (u'DESARROLLADORA ROAI', 3349.00,  1,
     u'Las necesidades de la empresa han cambiado y el volumen de llamadas que '
     u'manejan no hace viable mantener la herramienta activa por ahora'),
    (u'VERITest',            1596.00, 33, u'Cierre de empresa'),
    (u'VRE Mexico',           979.00, 88,
     u'Ya no necesitan el servicio por ahorro; su servicio es excelente y nunca '
     u'ha fallado, pero ya no lo requieren mas'),
    (u'Rodcal Group Bienes Raices', 733.00, 9, u'Cierre de empresa'),
    (u'Vonda',                588.00, 22, u'No estan utilizando el servicio'),
    (u'Ingeniera Mantenimiento y Desarrollo Informatico', 209.00, 0,
     u'La comunicacion en su mayoria es por correo y no por llamadas'),
    (u'Krezekapital',         195.00,  1, u'Ahorro economico'),
    (u'GANA A.C.',            169.00, 31, u'Cambios en proyectos empresariales'),
]

# ── Resumen: clientes con 3 meses activos o menos (octubre y noviembre) ─────
TRES_MESES_TOTAL_DECL    = 8326.00
TRES_MESES_CLIENTES_DECL = 10
TRES_MESES = [
    # (cliente, mes, importe, meses activo)
    (u'DESARROLLADORA ROAI',        u'Noviembre', 3349.00, 1),
    (u'KARTODROMO OSCAR CASILLAS',  u'Octubre',   1029.00, 2),
    (u'Recarga Y Gana',             u'Octubre',    979.00, 3),
    (u'FOBE',                       u'Octubre',    519.00, 1),
    (u'SOLUCIONES QC',              u'Octubre',    519.00, 0),
    (u'CRISTAL SERVICIOS',          u'Octubre',    519.00, 0),
    (u'ferreclimas',                u'Octubre',    519.00, 0),
    (u'Grupo NIID AIR SA',          u'Octubre',    489.00, 3),
    (u'Ingeniera Mantenimiento y Desarrollo Informatico', u'Noviembre', 209.00, 0),
    (u'Krezekapital',               u'Noviembre',  195.00, 1),
]

# ── Bloques que este corte NO publica ──────────────────────────────────────
BLOQUES_AUSENTES = [
    u'cartera por cobrar (¡LA ANUNCIA SU PROPIA ENTRADA!)',
    u'soft / hard suspend',
    u'top de clientes activos',
    u'downgrades cuantificados («no hay downgrades significativos»)',
]

print(u'\n  CONCILIACION · GROSS REVENUE CHURN · SEMANA 29')
print(u'  Corte al 19 nov 2026 · Valeria Zepeda Hernandez (equipo Data)')
print(u'  ' + u'=' * 72)

# ─── 1 · CANCELADOS DE OCTUBRE · el top contra el total ────────────────────
seccion(1, u'CANCELADOS DE OCTUBRE · el top 10 contra el total declarado')
suma_top = sum(x[1] for x in TOP10_OCT)
for cli, imp, mes in TOP10_OCT:
    print(u'      %-38s %12s  %3d mes(es)  %5.1f%% del mes'
          % (cli[:38], pesos(imp), mes, imp / CANC_OCT_TOTAL_DECL * 100))
ok(cerca(suma_top, CANC_OCT_TOP_DECL), u'el top 10 suma lo que el corte declara del top',
   u'%s vs %s' % (pesos(suma_top), pesos(CANC_OCT_TOP_DECL)))
ok(len(TOP10_OCT) == 10, u'el top trae diez filas', u'%d' % len(TOP10_OCT))
ok(suma_top < CANC_OCT_TOTAL_DECL, u'el top es MENOR que el mes (es un top, no el mes)')

# EL CUBO DE CIERRE. Sin él, la tarjeta publicaría el top como si fuera el mes:
# es el bug de nueve cortes que midió `mide-total-downgrades.py`, aplicado aquí
# a cancelaciones. [[feedback-tablas-deben-cerrar]]
resto_din = round(CANC_OCT_TOTAL_DECL - suma_top, 2)
resto_cli = CANC_OCT_CLIENTES_DECL - len(TOP10_OCT)
print(u'      cubo de cierre: + %d clientes por %s (%.1f%% del mes)'
      % (resto_cli, pesos(resto_din), resto_din / CANC_OCT_TOTAL_DECL * 100))
ok(resto_cli == 33 and cerca(resto_din, 23558.00),
   u'el cubo «resto» cierra contra el total',
   u'%d clientes / %s' % (resto_cli, pesos(resto_din)))

# ─── 2 · CONTEO DE MOTIVOS · bloque NUEVO ──────────────────────────────────
seccion(2, u'CONTEO DE MOTIVOS · bloque nuevo, y cubre los 43')
suma_mot = sum(x[2] for x in MOTIVOS)
suma_cli_mot = sum(x[1] for x in MOTIVOS)
for mot, n, imp in MOTIVOS:
    print(u'      %-42s %2d cliente(s)  %12s' % (mot[:42], n, pesos(imp)))
ok(cerca(suma_mot, MOTIVOS_TOTAL_DECL), u'los motivos suman el total declarado',
   u'%s vs %s' % (pesos(suma_mot), pesos(MOTIVOS_TOTAL_DECL)))
ok(suma_cli_mot == MOTIVOS_CLIENTES_DECL, u'los motivos suman los 43 clientes',
   u'%d vs %d' % (suma_cli_mot, MOTIVOS_CLIENTES_DECL))
ok(cerca(suma_mot, CANC_OCT_TOTAL_DECL),
   u'motivos y cancelados hablan del MISMO total',
   u'%s = %s' % (pesos(suma_mot), pesos(CANC_OCT_TOTAL_DECL)))

# «17 de 43 tienen motivo» tiene que ser lo que queda al quitar «sin motivo».
sin_motivo = [m for m in MOTIVOS if norm(m[0]).startswith(u'sinmotivo')]
con_motivo_n = suma_cli_mot - sum(m[1] for m in sin_motivo)
ok(con_motivo_n == MOTIVOS_DECL_CON,
   u'los que SI tienen motivo cuadran con lo declarado',
   u'%d vs %d' % (con_motivo_n, MOTIVOS_DECL_CON))
ok(sum(m[1] for m in sin_motivo) == MOTIVOS_DECL_SIN,
   u'los que NO tienen motivo cuadran con lo declarado',
   u'%d vs %d' % (sum(m[1] for m in sin_motivo), MOTIVOS_DECL_SIN))

sin_mot_din = sum(m[2] for m in sin_motivo)
print(u'      sin motivo registrado: %d de %d clientes (%.0f%%) y %s (%.1f%% del dinero)'
      % (MOTIVOS_DECL_SIN, CANC_OCT_CLIENTES_DECL,
         MOTIVOS_DECL_SIN * 100.0 / CANC_OCT_CLIENTES_DECL,
         pesos(sin_mot_din), sin_mot_din / CANC_OCT_TOTAL_DECL * 100))
if MOTIVOS_DECL_SIN * 2 > CANC_OCT_CLIENTES_DECL:
    avisos.append(u'EL MOTIVO ES LA MINORIA: %d de %d bajas de octubre (%.0f%%) no tienen '
                  u'motivo registrado, y son %s, el %.1f%% del dinero perdido. El bloque de '
                  u'motivos es nuevo y util, pero describe MENOS DE LA MITAD de los casos.'
                  % (MOTIVOS_DECL_SIN, CANC_OCT_CLIENTES_DECL,
                     MOTIVOS_DECL_SIN * 100.0 / CANC_OCT_CLIENTES_DECL,
                     pesos(sin_mot_din), sin_mot_din / CANC_OCT_TOTAL_DECL * 100))

# EL CRUCE QUE EL CORREO NO HACE: «Cambio de proveedor · 2 clientes ·
# $25,764.00» coincide al centavo con Jason de Mexico + KOMBITEC, los dos
# mayores del mes. Es indicio fuerte, no prueba: el correo no nombra a los
# clientes de cada motivo. [[feedback-metricas-derivadas-origen]]
cambio_prov = [m for m in MOTIVOS if norm(m[0]) == norm(u'Cambio de proveedor')]
if cambio_prov:
    _mot, n_cp, imp_cp = cambio_prov[0]
    dos_mayores = sum(x[1] for x in TOP10_OCT[:2])
    if n_cp == 2 and cerca(imp_cp, dos_mayores):
        print(u'      ! «Cambio de proveedor» (%s, %d clientes) = %s + %s al centavo'
              % (pesos(imp_cp), n_cp, TOP10_OCT[0][0], TOP10_OCT[1][0]))
        avisos.append(u'«Cambio de proveedor» son 2 clientes por %s, que es EXACTAMENTE '
                      u'%s (%s) + %s (%s). El correo no nombra a los clientes de cada '
                      u'motivo, asi que es indicio fuerte y no prueba — pero si es eso, '
                      u'el 33.6%% de la perdida de octubre se fue A UN COMPETIDOR, no por '
                      u'desuso ni por cierre.'
                      % (pesos(imp_cp), TOP10_OCT[0][0], pesos(TOP10_OCT[0][1]),
                         TOP10_OCT[1][0], pesos(TOP10_OCT[1][1])))

# ─── 3 · CANCELADOS DE NOVIEMBRE ───────────────────────────────────────────
seccion(3, u'CANCELADOS DE NOVIEMBRE · lista completa, con motivo')
suma_nov = sum(x[1] for x in NOV)
for cli, imp, mes, _m in NOV:
    print(u'      %-46s %10s  %3d mes(es)' % (cli[:46], pesos(imp), mes))
ok(cerca(suma_nov, CANC_NOV_TOTAL_DECL), u'noviembre suma su total declarado',
   u'%s vs %s' % (pesos(suma_nov), pesos(CANC_NOV_TOTAL_DECL)))
ok(len(NOV) == CANC_NOV_CLIENTES_DECL, u'noviembre trae los 8 clientes declarados',
   u'%d vs %d' % (len(NOV), CANC_NOV_CLIENTES_DECL))
con_motivo_nov = len([x for x in NOV if x[3].strip()])
ok(con_motivo_nov == len(NOV), u'los 8 de noviembre traen motivo',
   u'%d de %d' % (con_motivo_nov, len(NOV)))

# NOVIEMBRE ES EL MES VIVO. No es comparable con octubre: mide lo que va del
# mes, no el mes. [[regla-churn-mes-vencido]]
print(u'      OJO: noviembre es el MES VIVO. %s no es «noviembre»: es lo que va '
      u'de noviembre.' % pesos(suma_nov))

# ─── 4 · CLIENTES DE 3 MESES O MENOS ───────────────────────────────────────
seccion(4, u'CLIENTES CON 3 MESES O MENOS · octubre + noviembre')
suma_3m = sum(x[2] for x in TRES_MESES)
for cli, mes, imp, act in TRES_MESES:
    print(u'      %-46s %-10s %10s  %d mes(es)' % (cli[:46], mes, pesos(imp), act))
ok(cerca(suma_3m, TRES_MESES_TOTAL_DECL), u'los de 3 meses o menos suman su total',
   u'%s vs %s' % (pesos(suma_3m), pesos(TRES_MESES_TOTAL_DECL)))
ok(len(TRES_MESES) == TRES_MESES_CLIENTES_DECL, u'son los 10 declarados',
   u'%d vs %d' % (len(TRES_MESES), TRES_MESES_CLIENTES_DECL))
ok(all(x[3] <= 3 for x in TRES_MESES), u'ninguno pasa de 3 meses activo')

# Los de NOVIEMBRE de esta tabla tienen que aparecer en la tabla de noviembre,
# con el mismo importe y los mismos meses. Es la unica comprobacion cruzada
# que el correo permite hacer consigo mismo.
nov_por_nombre = {norm(c): (i, m) for c, i, m, _x in NOV}
cruzan, descuadran = 0, []
for cli, mes, imp, act in TRES_MESES:
    if mes.lower() != u'noviembre':
        continue
    k = norm(cli)
    if k not in nov_por_nombre:
        descuadran.append(u'%s no esta en la tabla de noviembre' % cli)
        continue
    i2, m2 = nov_por_nombre[k]
    if not cerca(i2, imp) or m2 != act:
        descuadran.append(u'%s: %s/%dm aqui contra %s/%dm en noviembre'
                          % (cli, pesos(imp), act, pesos(i2), m2))
    else:
        cruzan += 1
ok(not descuadran, u'los de noviembre casan con la tabla de noviembre',
   u'%d cruzados' % cruzan)
for d in descuadran:
    fallos.append(d)

# Los de OCTUBRE de esta tabla NO estan en el top 10 (son chicos): entonces
# tienen que caber dentro del cubo «resto». Si no cupieran, una de las dos
# tablas estaria contando otra cosa.
oct_3m = [x for x in TRES_MESES if x[1].lower() == u'octubre']
suma_oct_3m = sum(x[2] for x in oct_3m)
en_top = [x[0] for x in oct_3m
          if any(norm(x[0]) == norm(t[0]) for t in TOP10_OCT)]
print(u'      de octubre: %d clientes por %s · en el top 10: %s'
      % (len(oct_3m), pesos(suma_oct_3m), u', '.join(en_top) or u'ninguno'))
ok(suma_oct_3m <= resto_din + 0.01,
   u'los de octubre caben dentro del cubo «resto»',
   u'%s <= %s' % (pesos(suma_oct_3m), pesos(resto_din)))

cero_meses = [x for x in TRES_MESES if x[3] == 0]
print(u'      clientes que se van con CERO meses activos: %d (%s)'
      % (len(cero_meses), pesos(sum(x[2] for x in cero_meses))))
if cero_meses:
    avisos.append(u'%d de los 10 clientes de 3 meses o menos se van con CERO meses '
                  u'activos (%s): %s. No es churn de relacion, es una venta que nunca '
                  u'arranco.'
                  % (len(cero_meses), pesos(sum(x[2] for x in cero_meses)),
                     u', '.join(x[0] for x in cero_meses)))

# ─── 5 · LOS PORCENTAJES DE CHURN ──────────────────────────────────────────
seccion(5, u'CHURN % · el acumulado se reconstruye RESTANDO la base')
oct_ant, oct_new = PCT['octubre']
acu_ant, acu_new = PCT['acumulado_oct']
base_ant = round(acu_ant - oct_ant, 1)
base_new = round(acu_new - oct_new, 1)
print(u'      octubre %.1f%% -> %.1f%%   acumulado %.1f%% -> %.1f%%'
      % (oct_ant, oct_new, acu_ant, acu_new))
print(u'      base implicita de meses anteriores: %.1f%% (antes) y %.1f%% (ahora)'
      % (base_ant, base_new))
ok(cerca(base_ant, 19.4, 0.05), u'la lectura anterior tenia la base en 19.4%')

# EL HALLAZGO ABIERTO DE LA S28, CERRADO. La S28 bajo septiembre de 2.5% a 2.4%
# y dejo la base clavada en 19.4%; nosotros calculamos que propagando esa
# revision el acumulado tendria que ser 25.8% y no 25.9%, y lo preguntamos.
# Esta semana la base aparece en 19.3%: exactamente los 0.1 pp que faltaban.
# No se puede afirmar que sea POR nuestra observacion — se afirma lo medido.
if cerca(base_new, 19.3, 0.05):
    print(u'      ! la base BAJA de 19.4% a 19.3%: son los 0.1 pp que la S28 no propago')
    avisos.append(u'LA BASE DE MESES ANTERIORES SE MOVIO: 19.4% -> 19.3%. Es exactamente '
                  u'el descuadre de 0.1 pp que levantamos en la observacion ④ de la S28 '
                  u'(septiembre bajo a 2.4% y el acumulado no lo propagaba). Ahora el '
                  u'acumulado SI incorpora la revision. Se dice lo medido: la base cambio '
                  u'al valor que habiamos calculado; no se afirma la causa.')
else:
    avisos.append(u'la base de meses anteriores queda en %.1f%% y no en el 19.3%% que '
                  u'esperabamos tras la revision de septiembre: preguntar.' % base_new)

delta_oct = round(oct_new - oct_ant, 2)
delta_acu = round(acu_new - acu_ant, 2)
print(u'      octubre cae %.1f pp y el acumulado cae %.1f pp' % (abs(delta_oct), abs(delta_acu)))
ok(abs(delta_acu) >= abs(delta_oct) - 0.051,
   u'el acumulado cae al menos lo que cae el mes')
print(u'      (no se puede verificar dividiendo: el correo no publica la base de MRR '
      u'mensual) [[feedback-metricas-derivadas-origen]]')

# OCTUBRE YA ES MES VENCIDO: el correo se titula «Seguimiento Cierre de Octubre»
# y NO marca octubre como «mes corriendo», al contrario que la S28.
print(u'      este corte NO marca octubre «mes corriendo»: la S28 si lo hacia')

# ─── 6 · BLOQUES AUSENTES: NO SON CEROS ────────────────────────────────────
seccion(6, u'BLOQUES QUE ESTE CORTE NO PUBLICA')
for b in BLOQUES_AUSENTES:
    print(u'      · %-52s -> «no reportado», NUNCA $0' % b[:52])
avisos.append(u'EL CORREO ANUNCIA UN BLOQUE QUE NO TRAE. Su entrada dice «desglose de '
              u'cancelados de octubre con conteo de motivos, cancelados de noviembre, '
              u'CARTERA POR COBRAR y comentarios sobre downgrades», y el cuerpo no trae '
              u'ninguna tabla de cartera. La ultima lectura es la de la S28: $208,994.05 '
              u'en 172 clientes, con el 94.3% parado a un tramo de la suspension. Se '
              u'publica «no reportado» y se pregunta si se cayo del correo. '
              u'[[feedback-cero-sin-medicion]]')
avisos.append(u'LOS DOWNGRADES VUELVEN A SER UN JUICIO SIN CIFRA: «no hay downgrades '
              u'significativos». Es lo mismo que hizo la S26, y la S28 si los cuantifico '
              u'($8,330.00 en 3 clientes). Ademas el corte avisa de que «la siguiente '
              u'semana se evaluaran»: o sea que el bloque esta PENDIENTE, no en cero.')

# ─── 7 · HACIA ATRÁS · LAS CANCELACIONES DE OCTUBRE, NOMBRE POR NOMBRE ─────
seccion(7, u'HACIA ATRAS · ¿43 clientes nuevos o la S27 ya los tenia?')
page = io.open(os.path.join(RAIZ, 'app', 'churn', 'page.tsx'), encoding='utf-8').read()
actual = io.open(os.path.join(RAIZ, 'app', 'churn', 'reporte-actual.ts'), encoding='utf-8').read()

# El campo del importe se llama `mrr` en los bloques archivados, no `monto`.
# Tecleé `monto` de memoria y el lector devolvió CERO filas en los cinco cortes;
# la seccion 7 concluyo entonces que los diez nombres eran nuevos — una
# afirmacion fabricada por una lectura fallida, que es justo lo que un
# verificador no debe poder hacer. [[feedback-verificar-antes-asegurar]]
FILA = re.compile(u"cliente:\\s*'((?:[^'\\\\]|\\\\.)*)'\\s*,\\s*(?:mrr|monto):\\s*([0-9.]+)")

# El `cliente` de un bloque archivado NO es un nombre: es el nombre mas la nota
# que le escribimos ese dia. El nombre es lo que va antes del primer guion largo.
CORTA_NOMBRE = re.compile(u'\\s+[\u2014\u2013-]\\s+')


def nombre_de(prosa):
    return CORTA_NOMBRE.split(prosa.strip(), 1)[0].strip()


def bloque(texto, simbolo):
    u"""El bloque de un corte archivado, cortado en el siguiente `const REPORTE_`.

       Una ventana fija de N caracteres recorta en silencio y publica un «no
       reportado» que es en realidad un dato que no se leyo.
       [[feedback-verificar-antes-asegurar]]"""
    i = texto.find(u'const %s' % simbolo)
    if i < 0:
        return None
    sig = re.search(r'\n(?:export )?const REPORTE_', texto[i + 10:])
    fin = (i + 10 + sig.start()) if sig else len(texto)
    return texto[i:fin]


def campo(b, nombre):
    if not b:
        return None
    m = re.search(nombre + r'\s*:\s*([0-9.]+)', b)
    return float(m.group(1)) if m else None


def cancelados_de(b):
    if not b:
        return []
    m = re.search(r'\n  cancelados:\s*\[(.*?)\n  \]', b, re.S)
    if not m:
        return []
    return [(nombre_de(g.group(1)), float(g.group(2))) for g in FILA.finditer(m.group(1))]


CORTES = [(u'S24', page, u'REPORTE_S24_OCT_2026'),
          (u'S25', page, u'REPORTE_S25_OCT_2026'),
          (u'S26', page, u'REPORTE_S26_OCT_2026'),
          (u'S27', page, u'REPORTE_S27_OCT_2026'),
          (u'S28', actual, u'REPORTE_S28_OCT_2026')]

vistos = {}          # nombre normalizado -> (nombre, importe, corte donde salio)
leidos = 0
for etq, txt, sim in CORTES:
    b = bloque(txt, sim)
    filas = cancelados_de(b)
    casos = campo(b, 'canceladosCasosReal')
    # Las filas de cubo («+ N cuentas…») no son clientes. [[churn-analisis-data]]
    reales = [(c, m) for c, m in filas if not c.strip().startswith(u'+')]
    cubos = len(filas) - len(reales)
    if b:
        leidos += 1
    print(u'      %-4s %2d fila(s) con nombre · %d cubo(s) · casos declarados %s · suma %s'
          % (etq, len(reales), cubos,
             (u'%d' % casos) if casos else u'n/d',
             pesos(sum(m for _c, m in reales))))
    for c, m in reales:
        k = norm(c)
        if k not in vistos:
            vistos[k] = (c, m, etq)

ok(leidos == len(CORTES), u'se leyeron los cinco cortes anteriores de octubre',
   u'%d de %d' % (leidos, len(CORTES)))

print(u'      union de nombres distintos publicados antes: %d' % len(vistos))

# CANDADO CONTRA EL VERIFICADOR QUE CONCLUYE POR DEFECTO. Si el lector falla
# —un campo renombrado, un bloque movido— la comparacion de abajo saldria
# «ninguno estaba antes» y eso se leeria como un hallazgo. Un cero de lectura
# no es un cero de dato. [[feedback-cero-sin-medicion]]
ok(len(vistos) >= 20, u'el lector de bloques archivados SI devolvio nombres',
   u'%d nombres' % len(vistos))

# ¿Cuantos del top 10 de ahora ya estaban publicados, y al mismo importe?
repiten, reexpresados, nuevos = [], [], []
for cli, imp, _m in TOP10_OCT:
    k = norm(cli)
    hit = None
    for vk, (vc, vm, vetq) in vistos.items():
        if vk == k or vk in k or k in vk:
            hit = (vc, vm, vetq)
            break
    if not hit:
        nuevos.append((cli, imp))
    elif cerca(hit[1], imp):
        repiten.append((cli, imp, hit[2]))
    else:
        reexpresados.append((cli, imp, hit[0], hit[1], hit[2]))

print(u'\n      el top 10 de la S29 contra lo ya publicado:')
for cli, imp, etq in repiten:
    print(u'        = %-38s %11s  ya estaba en %s, al centavo' % (cli[:38], pesos(imp), etq))
for cli, imp, vc, vm, etq in reexpresados:
    print(u'        ~ %-38s %11s  %s publico %s' % (cli[:38], pesos(imp), etq, pesos(vm)))
for cli, imp in nuevos:
    print(u'        + %-38s %11s  NUEVO: no aparece en ningun corte anterior'
          % (cli[:38], pesos(imp)))

for cli, imp, vc, vm, etq in reexpresados:
    avisos.append(u'%s esta REEXPRESADO: %s publico %s y la S29 publica %s. No se '
                  u'comparan dos cortes sin decirlo.' % (cli, etq, pesos(vm), pesos(imp)))

# EL CONTRASTE QUE DECIDE SI UNA LECTURA FUE PARCIAL. La S27 declaro 20
# clientes y $75,295.50 del mismo octubre; la S29 declara 43 y $76,762.84.
# +23 clientes por +$1,467.34 son $63.80 de media: o esos 23 son minusculos,
# o una de las dos cuenta otra cosa. [[churn-analisis-data]]
# LA COMPROBACION INVERSA, Y ES LA QUE MUERDE. Un nombre que un corte anterior
# publico por ENCIMA del piso del top 10 de ahora tiene que seguir en ese top:
# si no esta, o salio de la lectura de octubre o el top no esta ordenado por
# importe. Las dos cosas hay que preguntarlas. [[churn-analisis-data]]
piso = min(x[1] for x in TOP10_OCT)
en_top_ahora = set()
for cli, _i, _m in TOP10_OCT:
    en_top_ahora.add(norm(cli))
print(u'\n      piso del top 10 de la S29: %s' % pesos(piso))
desaparecidos = []
for vk, (vc, vm, vetq) in sorted(vistos.items(), key=lambda kv: -kv[1][1]):
    if vm <= piso:
        continue
    if any(vk == t or vk in t or t in vk for t in en_top_ahora):
        continue
    desaparecidos.append((vc, vm, vetq))
    print(u'        ? %-34s %11s  %s lo publicaba y la S29 NO lo nombra'
          % (vc[:34], pesos(vm), vetq))
if desaparecidos:
    avisos.append(u'%d NOMBRE(S) QUE YA SE PUBLICARON POR ENCIMA DEL PISO DEL TOP 10 Y QUE LA '
                  u'S29 NO NOMBRA: %s. El top de la S29 corta en %s, asi que cualquiera de '
                  u'estos tendria que estar dentro. O salieron de la lectura de octubre, o el '
                  u'top no esta ordenado por importe sobre los 43. Se pregunta: no se borran '
                  u'ni se dan por buenos.'
                  % (len(desaparecidos),
                     u', '.join(u'%s (%s, %s)' % (c, pesos(m), e) for c, m, e in desaparecidos),
                     pesos(piso)))
else:
    print(u'        (ninguno: todo lo publicado por encima del piso sigue en el top)')

s27b = bloque(page, u'REPORTE_S27_OCT_2026')
s27_casos = campo(s27b, 'canceladosCasosReal')
s27_filas = [(c, m) for c, m in cancelados_de(s27b) if not c.strip().startswith(u'+')]
s27_suma_filas = sum(m for _c, m in s27_filas)
print(u'\n      S27: %s casos declarados · %d filas con nombre por %s'
      % ((u'%d' % s27_casos) if s27_casos else u'n/d', len(s27_filas), pesos(s27_suma_filas)))
print(u'      S29: %d casos declarados · %s' % (CANC_OCT_CLIENTES_DECL, pesos(CANC_OCT_TOTAL_DECL)))
if s27_casos:
    d_cli = CANC_OCT_CLIENTES_DECL - int(s27_casos)
    d_din = round(CANC_OCT_TOTAL_DECL - 75295.50, 2)
    media = (d_din / d_cli) if d_cli else 0
    print(u'      delta: %+d clientes por %s -> %s de media' % (d_cli, pesos(d_din), pesos(media)))
    avisos.append(u'OCTUBRE PASA DE 20 CLIENTES / $75,295.50 (S27) A %d / %s (S29): '
                  u'%+d clientes por solo %s, o sea %s de media cada uno. El dinero '
                  u'apenas se mueve (+%.1f%%) y el conteo se duplica, asi que la S27 '
                  u'media el DINERO del mes casi entero y le faltaban nombres chicos, '
                  u'no al reves. Es la lectura mas completa de octubre hasta ahora.'
                  % (CANC_OCT_CLIENTES_DECL, pesos(CANC_OCT_TOTAL_DECL), d_cli,
                     pesos(d_din), pesos(media),
                     d_din / 75295.50 * 100))

# ─── 8 · ¿TOCAN LA CARTERA CS? ─────────────────────────────────────────────
seccion(8, u'CONTROL · ¿alguna de estas bajas esta en la cartera de CS?')
grc_path = os.path.join(RAIZ, 'data', 'grc-zoho.json')
G = json.load(io.open(grc_path, encoding='utf-8'))
FILAS_GRC = G['filas']
MES_VIVO_GRC = (G.get('meta') or {}).get('mesVivo')
print(u'      GRC: %d filas · mes vivo del export: %s' % (len(FILAS_GRC), MES_VIVO_GRC))


def fila_grc(nombre):
    u"""La fila del GRC de un nombre, EXACTA antes que parecida.

       Cruzar por subcadena agarraba «GRUPO 2711» (AAA, MRR estable, $10,048)
       cuando el corte cancela «GRUPO 2711 (BATERIAS SENDERO)» (A, Desactivado):
       dos filas distintas BAJO EL MISMO CID 12283, una viva y otra muerta. Con
       la fila equivocada el detector de contradicciones inventaba una. Un
       parecido no es una identidad. [[dids-fuente]]"""
    c = norm(nombre)
    cands = [(norm(f.get('cliente') or ''), f) for f in FILAS_GRC]
    for n, f in cands:
        if n and n == c:
            return f
    parciales = [f for n, f in cands if n and (n in c or c in n)]
    return parciales[0] if len(parciales) == 1 else None


TODOS = [(c, i, u'octubre') for c, i, _m in TOP10_OCT] + \
        [(c, i, u'noviembre') for c, i, _m, _x in NOV]
en_cartera, sin_fila = [], []
for cli, imp, mes in TODOS:
    f = fila_grc(cli)
    if not f:
        sin_fila.append(cli)
        continue
    if f.get('enCartera'):
        en_cartera.append((cli, imp, mes, f.get('cid'), f.get('movimiento')))
print(u'      de %d nombres (top de octubre + los 8 de noviembre): %d en el GRC, '
      u'%d en la cartera CS' % (len(TODOS), len(TODOS) - len(sin_fila), len(en_cartera)))

# UN CID COMPARTIDO ES OTRA COSA QUE UNA BAJA. Si la cuenta de cartera sigue
# facturando bajo el mismo CID, lo que murio es una linea agrupada, no el
# cliente: pasarla a Dormidas seria apagar una cuenta viva.
for cli, imp, mes, cid, mov in list(en_cartera):
    hermanas = [f for f in FILAS_GRC
                if str(f.get('cid') or '') == str(cid) and norm(f.get('cliente') or '') != norm(cli)]
    vivas = [f for f in hermanas
             if any(v in (f.get('movimiento') or u'').lower()
                    for v in (u'mrr estable', u'upgrade', u'nuevo', u'reactiv'))]
    for f in vivas:
        print(u'        ~~ cid %s lo comparte con «%s» (%s, MRR %s): LA CUENTA SIGUE VIVA'
              % (cid, f.get('cliente'), f.get('movimiento'), pesos(float(f.get('mrrFin') or 0))))
    if vivas:
        avisos.append(u'%s (%s) NO ES UNA BAJA DE CUENTA: el cid %s lo comparte con «%s», que '
                      u'el GRC trae como «%s» con %s de MRR. Lo que se cancela es una linea '
                      u'AGRUPADA bajo el mismo CID, y la cuenta de cartera sigue facturando. '
                      u'Pasarla a Dormidas apagaria una cuenta viva. '
                      u'[[polak-grupo-no-es-churn]] [[dids-fuente]]'
                      % (cli, pesos(imp), cid, vivas[0].get('cliente'),
                         vivas[0].get('movimiento'),
                         pesos(float(vivas[0].get('mrrFin') or 0))))
for cli, imp, mes, cid, mov in en_cartera:
    print(u'        ! %-34s %11s  %-10s cid=%s  %s'
          % (cli[:34], pesos(imp), mes, cid or u'—', (mov or u'')[:28]))
# LA CONTRADICCION MAS BARATA DE DETECTAR: el corte dice que la cuenta cancelo
# y el GRC dice que su MRR esta ESTABLE. Es el patron de Polak Grupo, que cinco
# sitios daban por perdida mientras facturaba mas. [[polak-grupo-no-es-churn]]
VIVOS = (u'mrr estable', u'upgrade', u'nuevo', u'reactiv')
contradicen = []
for cli, imp, mes, cid, mov in en_cartera:
    m = (mov or u'').strip().lower()
    if any(v in m for v in VIVOS):
        contradicen.append((cli, imp, cid, mov))
for cli, imp, cid, mov in contradicen:
    print(u'        !! %-30s el corte la cancela y el GRC dice «%s»' % (cli[:30], mov))
if contradicen:
    avisos.append(u'CONTRADICCION ENTRE DOS FUENTES NUESTRAS: %s. El corte de Data la pone '
                  u'entre los cancelados de octubre y el GRC la trae como «%s», y esta en '
                  u'cartera CS (cid %s). Antes de tocar nada hay que resolver cual de las dos '
                  u'tiene razon: es el patron de Polak Grupo. Ninguna baja sin autorizacion. '
                  u'[[polak-grupo-no-es-churn]]'
                  % (u'; '.join(u'%s (%s)' % (c, pesos(i)) for c, i, _cid, _mv in contradicen),
                     contradicen[0][3], contradicen[0][2]))

if en_cartera:
    avisos.append(u'%d de estas bajas SI estan marcadas en la cartera CS: %s. Hay que '
                  u'mirarlas una a una: una baja se autoriza y se registra pasando la '
                  u'cuenta a Dormida, nunca borrando. [[feedback-conciliacion-churn]]'
                  % (len(en_cartera), u', '.join(x[0] for x in en_cartera)))
else:
    avisos.append(u'NINGUNO de los %d nombres aparece marcado en la cartera CS, pero es un '
                  u'cero DEBIL: el cruce es por NOMBRE porque el correo no trae CIDs, y el '
                  u'94%% de las filas del GRC tampoco. No autoriza a decir «no nos afecta». '
                  u'[[dids-fuente]]' % len(TODOS))

# JASON DE MEXICO es cuenta TOP y lleva publicandose desde la S24: es el caso
# que decide si hay trabajo nuestro. Se nombra siempre, aunque el cruce falle.
print(u'      (Jason de Mexico, %s, 43 meses: cuenta TOP, publicada ya por la S24 '
      u'y la S27 al mismo importe)' % pesos(TOP10_OCT[0][1]))

# ════════════════════════════════════════════════════════════════════════════
print(u'\n  ' + u'=' * 72)
if avisos:
    print(u'  %d AVISO(S) PARA LA NOTA DEL CORTE:' % len(avisos))
    for i, a in enumerate(avisos, 1):
        print(u'    %d) %s' % (i, a))
print(u'')
if fallos:
    print(u'  *** %d COMPROBACION(ES) NO CIERRAN — NO PUBLICAR:' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    sys.exit(1)
print(u'  TODO LO INTERNO CIERRA. El corte se puede publicar con esos avisos en la nota.')
sys.exit(0)
