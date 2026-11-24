# -*- coding: utf-8 -*-
u"""CONCILIA EL CORTE S30 DE ANÁLISIS DATA ANTES DE PUBLICARLO.

   Mismo patrón que `concilia-churn-s29.py`: transcribe las cifras del correo y
   les exige que CIERREN; reconstruye los porcentajes DIVIDIENDO o RESTANDO en
   vez de espejearlos; y mira HACIA ATRÁS contra los cortes ya archivados, que
   es lo único que destapa una rebanada rotulada «el mes».
   [[churn-analisis-data]] [[feedback-tablas-deben-cerrar]]

   LO QUE MIRA HACIA ATRÁS NO SE TECLEA AQUÍ, SE EXTRAE:
     · la tabla de noviembre de la S29, del `NOV` de `concilia-churn-s29.py`;
     · la cartera y los downgrades de la S28, del bloque archivado en
       `app/churn/page.tsx`.
   Un espejo tecleado a mano deja de ser espejo: si el corte anterior se
   corrige, este guión tiene que enterarse solo.
   [[feedback-verificar-antes-asegurar]]

   LO QUE ESTE CORTE TIENE DE RARO:

     · LA S29 PROMETIÓ DOS BLOQUES Y ÉSTE LOS PAGA. La S29 anunciaba cartera y
       decía que los downgrades «se evaluarán la siguiente semana». Aquí vienen
       los dos. La sección 7 comprueba que no sean la lectura vieja repintada.
     · DOS DOWNGRADES TRAEN LOS MISMOS CENTAVOS Y EL MISMO % QUE LA S28, bajo
       rótulo «Noviembre». O es un registro que corre o es octubre reetiquetado,
       y eso NO se decide contando: se declara. [[churn-analisis-data]]
     · NOVIEMBRE ES EL MES VIVO. Sus $27,104.00 no son «noviembre»: son lo que
       va de noviembre, y el 15.5% es cartera por cobrar, no churn consumado.
       [[regla-churn-mes-vencido]]
     · LA DOCUMENTACIÓN DE MOTIVOS SE DEGRADA. La S29 presumía que «los OCHO
       traen motivo»; aquí 9 de 20 van sin motivo, y son los dos mayores.
     · EL 15.5% NO SE PUEDE RECONSTRUIR: el correo no publica denominador
       ninguno. Se dice con palabras, no se inventa una base.
       [[feedback-metricas-derivadas-origen]] [[feedback-cero-sin-medicion]]

   USO
       python -I scripts/concilia-churn-s30.py
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


def leer(rel):
    with io.open(os.path.join(RAIZ, rel), encoding='utf-8') as f:
        return f.read()


# ════════════════════════════════════════════════════════════════════════════
# EL CORREO, TRANSCRITO. Semana 30, «Churn · Seguimiento Noviembre, al 24 de
# noviembre del 2026», de Valeria Zepeda Hernández (equipo Data).
# ════════════════════════════════════════════════════════════════════════════

# ── Vista general ──────────────────────────────────────────────────────────
PCT_OCT_ANT,  PCT_OCT  = 6.1, 5.5
PCT_NOV_VIVO            = 15.5          # MES CORRIENDO · NO DEFINITIVO
PCT_ACUM_ANT, PCT_ACUM = 25.4, 24.7     # acumulado hasta OCTUBRE

# ── Top 5 de clientes ACTIVOS (no es churn: es cartera activa) ─────────────
TOP_ACTIVOS = [
    (u'Alianza Multimarca',          26594.00, 35),
    (u'Azyco Guadalajara',           22984.00, 26),
    (u'Gas Economico Metropolitano', 18659.00, 44),
    (u'Hospital Santa Rosa',         18345.00, 61),
    (u'FabricAir Latin America',     15186.41, 69),
]

# ── Cancelados de NOVIEMBRE (mes vivo) ─────────────────────────────────────
CANC_NOV_TOTAL_DECL    = 27104.00
CANC_NOV_CLIENTES_DECL = 20
SIN_MOTIVO = u'—'                   # el correo pone una raya
NOV = [
    (u'Grupo DC Mexico',                                   8390.00,  7, SIN_MOTIVO),
    (u'CH Desarrollos',                                    6342.00, 73, SIN_MOTIVO),
    (u'DESARROLLADORA ROAI',                               3349.00,  1, u'Bajo uso'),
    (u'VERITest',                                          1596.00, 33, u'Cierre de empresa'),
    (u'Novahogar',                                         1278.00, 98, SIN_MOTIVO),
    (u'VEV Travels',                                       1029.00,  1, u'Cuenta de prueba'),
    (u'VRE Mexico',                                         979.00, 88, u'Ahorro / ya no lo necesita'),
    (u'Rodcal Group Bienes Raices',                         733.00,  9, u'Cierre de empresa'),
    (u'Vonda',                                              588.00, 22, u'Bajo uso'),
    (u'ALFAPROM',                                           489.00, 94, u'Cambio a conmutadores fisicos'),
    (u'Alux Capital',                                       489.00, 52, SIN_MOTIVO),
    (u'Track One',                                          384.00, 49, SIN_MOTIVO),
    (u'Ingeniera Mantenimiento y Desarrollo Informatico',   209.00,  0, u'Bajo uso'),
    (u'SMUM Mexico',                                        209.00,  2, SIN_MOTIVO),
    (u'Krezekapital',                                       195.00,  1, u'Ahorro / ya no lo necesita'),
    (u'GANA A.C.',                                          169.00, 34, u'Cambio de proyectos'),
    (u'Arlow Vertical',                                     169.00, 49, SIN_MOTIVO),
    (u'youpro',                                             169.00, 52, SIN_MOTIVO),
    (u'Espacio Mexico',                                     169.00, 51, SIN_MOTIVO),
    (u'BLACKTELECOM',                                       169.00, 34, u'Problema de metodo de pago'),
]

# ── Soft / Hard suspend ────────────────────────────────────────────────────
SUSPEND = [
    # (estatus, clientes, prom. dias, importe, clientes CON fecha de corte)
    (u'Soft Suspend', 41, 45.0, 38283.50, 34),
    (u'Hard Suspend', 21, 51.2, 24306.50, 18),
]
SUSPEND_TOTAL_DECL    = 62590.00
SUSPEND_CLIENTES_DECL = 62

# ── Cartera vencida por días ───────────────────────────────────────────────
CARTERA_TOTAL_DECL    = 709965.95
CARTERA_CLIENTES_DECL = 474
CARTERA = [
    (u'Por vencer',  46431.61,  25),
    (u'1 - 7 dias',      0.00,   0),
    (u'8 - 15 dias',     0.00,   0),
    (u'16 - 30 dias', 270504.47, 190),
    (u'+30 dias',    393029.87, 259),
]

# ── Downgrades ─────────────────────────────────────────────────────────────
DOWN_TOTAL_DECL = 39814.00
DOWN = [
    (u'Blueservices',      75, 18399.03),
    (u'Ancona Autopartes', 29,  7610.00),
    (u'CASTDIM',           46,  4500.00),
    (u'Grupo Guia',        30,  2400.00),
    (u'Grupo SPH',         71,  2392.00),
    (u'DO ALL MEXICANA',   22,  2391.97),
    (u'Noktos',            70,  1221.00),
    (u'Ferreteria Osito',  31,   900.00),
]
# Productos que redujeron o cancelaron
PROD = [
    (u'Agente CP Chat',       1, 2, 3),
    (u'Extension VyC',        1, 0, 1),
    (u'Extension VyC min IP', 1, 0, 1),
    (u'DiD Nacional',         1, 0, 1),
    (u'DiD Internacional',    1, 0, 1),
    (u'paquete Min VyC',      1, 0, 1),
    (u'paquete Min CE',       1, 0, 1),
    (u'Extension Callcenter', 1, 0, 1),
    (u'Extension CE',         0, 1, 1),
]
PROD_RED_DECL, PROD_CAN_DECL, PROD_CLI_DECL = 8, 3, 11


print(u'\n=== CONCILIACIÓN · CORTE S30 DE ANÁLISIS DATA (al 24 nov 2026) ===')

# EL GRC SE CARGA ARRIBA porque hace falta en tres secciones, no sólo en el
# cruce final: sin él el 15.5% de noviembre se quedaría en «no reconstruible»
# cuando sí se puede medir.
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
FILAS_GRC = G['filas']
META_GRC = G.get('meta') or {}
MES_VIVO_GRC = META_GRC.get('mesVivo')


def es_churn_grc(f):
    return u'churn' in (f.get('movimiento') or u'').lower()

# ─── 1 · TOP DE CLIENTES ACTIVOS ───────────────────────────────────────────
seccion(1, u'TOP 5 · CLIENTES ACTIVOS · esto NO es churn')
suma_act = sum(i for _c, i, _m in TOP_ACTIVOS)
print(u'      %d clientes activos, %s de MRR' % (len(TOP_ACTIVOS), pesos(suma_act)))
print(u'      El correo NO declara total para este bloque: la suma es NUESTRA, '
      u'no suya.')
# POR QUÉ NO VA EN `pendientes`: ese slot es CARTERA POR COBRAR. Meter aquí el
# top de activos publicaría cartera sana como «MRR en riesgo».
# [[churn-analisis-data]] — el rótulo manda, no la costumbre.
avisos.append(u'El TOP DE ACTIVOS (%s en %d) NO entra en ningun slot del corte: '
              u'va en la nota. Es cartera SANA; en `pendientes` se leeria como '
              u'MRR en riesgo.' % (pesos(suma_act), len(TOP_ACTIVOS)))

# ─── 2 · CANCELADOS DE NOVIEMBRE ───────────────────────────────────────────
seccion(2, u'CANCELADOS DE NOVIEMBRE · lista completa')
suma_nov = sum(i for _c, i, _m, _x in NOV)
ok(cerca(suma_nov, CANC_NOV_TOTAL_DECL), u'noviembre suma su total declarado',
   u'%s vs %s' % (pesos(suma_nov), pesos(CANC_NOV_TOTAL_DECL)))
ok(len(NOV) == CANC_NOV_CLIENTES_DECL, u'noviembre trae los 20 clientes declarados',
   u'%d vs %d' % (len(NOV), CANC_NOV_CLIENTES_DECL))

sin_motivo = [(c, i) for c, i, _m, x in NOV if x == SIN_MOTIVO]
din_sin = sum(i for _c, i in sin_motivo)
print(u'      SIN MOTIVO: %d de %d clientes, %s (%.1f%% del dinero)'
      % (len(sin_motivo), len(NOV), pesos(din_sin), din_sin / suma_nov * 100))
for c, i in sin_motivo[:3]:
    print(u'        · %-24s %s' % (c, pesos(i)))
# LOS DOS MAYORES SIN MOTIVO: eso no es un hueco cualquiera.
dos_mayores = sorted(NOV, key=lambda r: -r[1])[:2]
if all(r[3] == SIN_MOTIVO for r in dos_mayores):
    d2 = sum(r[1] for r in dos_mayores)
    avisos.append(u'LAS DOS BAJAS MAYORES VAN SIN MOTIVO: %s y %s, %s juntas, el '
                  u'%.1f%% de lo cancelado. El bloque documenta lo barato.'
                  % (dos_mayores[0][0], dos_mayores[1][0], pesos(d2),
                     d2 / suma_nov * 100))

# CLIENTES DE ≤3 MESES: venta que nunca arrancó, no churn de relación.
jovenes = [(c, i, m) for c, i, m, _x in NOV if m <= 3]
print(u'      ≤3 meses de vida: %d clientes, %s'
      % (len(jovenes), pesos(sum(i for _c, i, _m in jovenes))))

# NOVIEMBRE ES EL MES VIVO.
print(u'      OJO: noviembre es el MES VIVO. %s no es «noviembre»: es lo que va '
      u'de noviembre.' % pesos(suma_nov))

# ─── 3 · SOFT / HARD SUSPEND ───────────────────────────────────────────────
seccion(3, u'SOFT / HARD SUSPEND')
s_tot = sum(r[3] for r in SUSPEND)
s_cli = sum(r[1] for r in SUSPEND)
ok(cerca(s_tot, SUSPEND_TOTAL_DECL), u'suspend suma su total declarado',
   u'%s vs %s' % (pesos(s_tot), pesos(SUSPEND_TOTAL_DECL)))
ok(s_cli == SUSPEND_CLIENTES_DECL, u'suspend suma sus clientes declarados',
   u'%d vs %d' % (s_cli, SUSPEND_CLIENTES_DECL))

# EL PROMEDIO DE DÍAS NO CUBRE A TODOS, Y EL PROPIO CORREO LO DICE. Publicar
# «45.0 días» sin ese pie lo convierte en un promedio de los 41.
# [[feedback-cero-sin-medicion]]
sin_fecha = sum(r[1] - r[4] for r in SUSPEND)
for est, cli, dias, imp, con in SUSPEND:
    print(u'      %-14s %2d clientes · %s · prom. %.1f dias sobre %d de %d'
          % (est, cli, pesos(imp), dias, con, cli))
avisos.append(u'EL PROMEDIO DE DIAS SOLO MIDE A %d DE %d: %d clientes suspendidos no '
              u'tienen fecha de corte registrada (Soft 34/41, Hard 18/21). El pie '
              u'del correo lo declara y hay que arrastrarlo: sin el, «45.0 dias» se '
              u'lee como el promedio de los 41.' % (s_cli - sin_fecha, s_cli, sin_fecha))

# ─── 4 · CARTERA VENCIDA ───────────────────────────────────────────────────
seccion(4, u'CARTERA VENCIDA POR DIAS')
c_tot = sum(r[1] for r in CARTERA)
c_cli = sum(r[2] for r in CARTERA)
ok(cerca(c_tot, CARTERA_TOTAL_DECL), u'cartera suma su total declarado',
   u'%s vs %s' % (pesos(c_tot), pesos(CARTERA_TOTAL_DECL)))
ok(c_cli == CARTERA_CLIENTES_DECL, u'cartera suma sus clientes declarados',
   u'%d vs %d' % (c_cli, CARTERA_CLIENTES_DECL))
for r, i, n in CARTERA:
    print(u'      %-14s %14s  %3d clientes  %5.1f%%'
          % (r, pesos(i), n, i / c_tot * 100))

vieja = sum(i for r, i, _n in CARTERA if r in (u'16 - 30 dias', u'+30 dias'))
print(u'      a 16 dias o mas: %s, el %.1f%% de la cartera'
      % (pesos(vieja), vieja / c_tot * 100))

# DOS TRAMOS EXACTAMENTE EN CERO. Son CEROS MEDIDOS —hay tramo, importe y
# conteo— y además tienen explicación estructural: con corte mensual y el
# reporte al día 24, lo facturado el día 1 cae ya en 16-30 y nada se emitió
# entre el 9 y el 23. Se dice, no se calla. [[feedback-cero-sin-medicion]]
ceros = [r for r, i, n in CARTERA if i == 0 and n == 0]
print(u'      tramos en cero MEDIDO (tramo + importe + conteo): %s'
      % (u', '.join(ceros) if ceros else u'ninguno'))

# «POR VENCER» NO ES DEUDA JOVEN: el correo aclara que son los clientes SIN
# FECHA DE CORTE REGISTRADA. Es el MISMO hueco de registro que el de suspend.
pv = [r for r in CARTERA if r[0] == u'Por vencer'][0]
avisos.append(u'«POR VENCER» (%s en %d) ES UN HUECO DE REGISTRO, no deuda joven: el '
              u'correo dice que agrupa a los clientes SIN FECHA DE CORTE REGISTRADA. '
              u'Es la misma carencia que deja al promedio de dias de suspend midiendo '
              u'%d de %d.' % (pesos(pv[1]), pv[2], s_cli - sin_fecha, s_cli))

# ─── 5 · DOWNGRADES ────────────────────────────────────────────────────────
seccion(5, u'DOWNGRADES')
d_tot = sum(p for _c, _pc, p in DOWN)
ok(cerca(d_tot, DOWN_TOTAL_DECL), u'downgrades suman su total declarado',
   u'%s vs %s' % (pesos(d_tot), pesos(DOWN_TOTAL_DECL)))

p_red = sum(r[1] for r in PROD)
p_can = sum(r[2] for r in PROD)
p_cli = sum(r[3] for r in PROD)
ok(p_red == PROD_RED_DECL, u'productos · «redujeron» suma lo declarado',
   u'%d vs %d' % (p_red, PROD_RED_DECL))
ok(p_can == PROD_CAN_DECL, u'productos · «cancelaron» suma lo declarado',
   u'%d vs %d' % (p_can, PROD_CAN_DECL))
ok(p_cli == PROD_CLI_DECL, u'productos · «total clientes» suma lo declarado',
   u'%d vs %d' % (p_cli, PROD_CLI_DECL))
ok(all(r[1] + r[2] == r[3] for r in PROD),
   u'productos · cada fila cierra (red+can = clientes)')

# LAS DOS TABLAS NO MIDEN LO MISMO Y NO TIENEN QUE CUADRAR ENTRE SÍ: 8 clientes
# con downgrade contra 11 pares cliente-producto. Un cliente que toca dos
# artículos cuenta dos veces. Decirlo evita leer «11» como once clientes.
print(u'      %d clientes con downgrade contra %d pares cliente-producto: un '
      u'cliente que toca dos articulos cuenta dos veces.' % (len(DOWN), p_cli))
# Y LA TABLA DE PRODUCTOS ES BRUTA: el propio correo dice que «no incluye
# productos que aumentaron», así que no netea upsell. La S27 sí neteaba.
avisos.append(u'LA TABLA DE PRODUCTOS ES BRUTA: el correo declara que «no incluye '
              u'productos que aumentaron», asi que %s NO esta neteado de upsell. '
              u'La S27 publicaba bruto y neto distintos ($38,225.97 contra '
              u'$31,187.97) y ahi la diferencia importaba.' % pesos(d_tot))

# ─── 6 · LOS PORCENTAJES ───────────────────────────────────────────────────
seccion(6, u'PORCENTAJES · reconstruir, no espejear')
# El acumulado hasta octubre menos octubre deja la base de enero-septiembre.
base_ene_sep = PCT_ACUM - PCT_OCT
base_ant     = PCT_ACUM_ANT - PCT_OCT_ANT
# TOLERANCIA 0.2, NO 0.05. El correo publica cada % con UN decimal, así que cada
# uno arrastra ±0.05 de redondeo; una resta de dos acumula ±0.1, y comparar dos
# restas acumula ±0.2. Con 0.05 esto fallaba por 19.2 contra 19.3 y el fallo era
# del umbral, no del corte. Misma clase que la tarjeta de Agua Inmaculada: la
# precisión de lo PUBLICADO manda sobre la del cálculo.
# [[feedback-verificar-antes-asegurar]]
ok(cerca(base_ene_sep, base_ant, 0.2),
   u'la base ene-sep NO se mueve al reexpresar octubre',
   u'%.1f%% ahora vs %.1f%% antes (±0.2 por redondeo a un decimal)'
   % (base_ene_sep, base_ant))
print(u'      octubre %.1f%% -> %.1f%% (%.1f pts) · acumulado %.1f%% -> %.1f%% '
      u'(%.1f pts): se mueve LO MISMO, luego la reexpresion es solo de octubre.'
      % (PCT_OCT_ANT, PCT_OCT, PCT_OCT - PCT_OCT_ANT,
         PCT_ACUM_ANT, PCT_ACUM, PCT_ACUM - PCT_ACUM_ANT))

# EL 15.5% DE NOVIEMBRE SÍ SE RECONSTRUYE, Y NO CONTRA EL CORREO: contra el
# GRC. El correo no publica denominador, pero la cifra no es un misterio —es la
# canasta «Churn confirmado» del mes vivo del GRC sobre la base de MRR—. Que se
# pueda MEDIR es lo que convierte «15.5% de churn» en «15.5% de cartera por
# cobrar», y la diferencia entre las dos frases es toda la conversación.
# [[regla-churn-mes-vencido]] [[feedback-metricas-derivadas-origen]]
base_grc = sum(float(f.get('mrrIni') or 0) for f in FILAS_GRC)
churn_grc = sum(float(f.get('mrrIni') or 0) for f in FILAS_GRC if es_churn_grc(f))
pct_grc = churn_grc / base_grc * 100
print(u'      noviembre %.1f%% declarado · nuestro GRC mide %.2f%% (%s de «Churn '
      u'confirmado» sobre %s de base, mes vivo %s)'
      % (PCT_NOV_VIVO, pct_grc, pesos(churn_grc), pesos(base_grc), MES_VIVO_GRC))
# No se exige igualdad: son dos snapshots de distinto día. Se exige que sea la
# MISMA magnitud, y medio punto sobre quince lo es.
ok(abs(pct_grc - PCT_NOV_VIVO) <= 1.5,
   u'el 15.5% de noviembre es la canasta de churn del GRC',
   u'%.2f%% medido vs %.1f%% declarado (%.2f pts)'
   % (pct_grc, PCT_NOV_VIVO, pct_grc - PCT_NOV_VIVO))
avisos.append(u'EL %.1f%% DE NOVIEMBRE ES CARTERA POR COBRAR, Y ESTA MEDIDO: nuestro '
              u'GRC da %.2f%% (%s sobre %s de base) en el mes vivo %s. En Zoho «churn '
              u'confirmado» marca todo contrato que aun no factura, asi que ese '
              u'porcentaje NO es baja consumada. El churn de verdad es el del mes '
              u'VENCIDO: octubre, %.1f%%.'
              % (PCT_NOV_VIVO, pct_grc, pesos(churn_grc), pesos(base_grc),
                 MES_VIVO_GRC, PCT_OCT))

# ════════════════════════════════════════════════════════════════════════════
# 7 · HACIA ATRÁS. Lo único que destapa una rebanada rotulada «el mes».
# ════════════════════════════════════════════════════════════════════════════
seccion(7, u'HACIA ATRAS · contra la S29 y la S28 archivadas')

# ── 7a · la tabla de noviembre de la S29, EXTRAÍDA de su conciliador ───────
s29 = leer('scripts/concilia-churn-s29.py')
m = re.search(r'^NOV = \[(.*?)^\]', s29, re.S | re.M)
if not m:
    fallos.append(u'no se pudo extraer el NOV de concilia-churn-s29.py')
    NOV29 = []
else:
    NOV29 = [(c, float(i), int(mm)) for c, i, mm in
             re.findall(r"\(u'((?:[^']|\\')*?)',\s*([\d.]+),\s*(\d+),", m.group(1))]
ok(len(NOV29) == 8, u'S29 · se extraen sus 8 clientes de noviembre',
   u'%d extraidos' % len(NOV29))
suma29 = sum(i for _c, i, _m in NOV29)
ok(cerca(suma29, 7818.00), u'S29 · su noviembre sumaba $7,818.00',
   pesos(suma29))

idx30 = dict((norm(c), (i, m)) for c, i, m, _x in NOV)
faltan, cambian_importe, cambian_meses = [], [], []
for c, i, mm in NOV29:
    k = norm(c)
    if k not in idx30:
        faltan.append(c)
        continue
    i30, m30 = idx30[k]
    if not cerca(i, i30):
        cambian_importe.append((c, i, i30))
    if mm != m30:
        cambian_meses.append((c, mm, m30))
ok(not faltan, u'S29 ⊂ S30 · los 8 de la S29 siguen en la lista',
   u'faltan: %s' % u', '.join(faltan) if faltan else u'')
ok(not cambian_importe, u'S29 ⊂ S30 · ninguno cambia de importe',
   u'; '.join(u'%s %s→%s' % (c, pesos(a), pesos(b)) for c, a, b in cambian_importe))

# LOS MESES SÍ PUEDEN MOVERSE, pero no tres en cinco días: eso es un cambio de
# dato, no el paso del tiempo. No falla el corte; se pregunta.
for c, a, b in cambian_meses:
    print(u'      ~~ %s: %d meses en la S29 y %d en la S30 (%+d en cinco dias)'
          % (c, a, b, b - a))
if cambian_meses:
    avisos.append(u'MESES ACTIVO QUE SE MUEVEN ENTRE CORTES: %s. Los otros %d de la '
                  u'S29 repiten mes por mes, asi que no es un redatado global: es '
                  u'una fila. PREGUNTA ABIERTA, no se corrige a ojo.'
                  % (u'; '.join(u'%s %d→%d' % (c, a, b) for c, a, b in cambian_meses),
                     len(NOV29) - len(cambian_meses)))

nuevos = [(c, i) for c, i, _m, _x in NOV if norm(c) not in
          set(norm(x[0]) for x in NOV29)]
print(u'      +%d nombres nuevos desde la S29, %s (la S29 media %s en 8)'
      % (len(nuevos), pesos(sum(i for _c, i in nuevos)), pesos(suma29)))

# LA DOCUMENTACIÓN DE MOTIVOS SE DEGRADA, y la S29 presumía de lo contrario.
pct29 = 100.0
pct30 = (len(NOV) - len(sin_motivo)) * 100.0 / len(NOV)
print(u'      motivos: S29 %.0f%% de los clientes · S30 %.0f%%' % (pct29, pct30))
avisos.append(u'LA DOCUMENTACION DE MOTIVOS RETROCEDE: la S29 publicaba los 8 CON '
              u'motivo (100%%) y lo decia como merito; la S30 trae %d de %d (%.0f%%) '
              u'y lo que queda sin motivo es el %.1f%% del dinero.'
              % (len(NOV) - len(sin_motivo), len(NOV), pct30,
                 din_sin / suma_nov * 100))

# ── 7b · la S28 archivada, EXTRAÍDA de page.tsx ────────────────────────────
pg = leer('app/churn/page.tsx')
m28 = re.search(r'^const REPORTE_S28_OCT_2026: ChurnReporte = \{(.*?)^\}', pg, re.S | re.M)
ok(bool(m28), u'S28 · se localiza su bloque archivado en page.tsx')
b28 = m28.group(1) if m28 else u''

ma = re.search(r'antiguedadSaldos: \[(.*?)\]', b28, re.S)
BANDAS28 = re.findall(r"rango: '([^']+)',\s*monto:\s*([\d.]+)", ma.group(1)) if ma else []
ok(len(BANDAS28) == 5, u'S28 · se extraen sus 5 tramos de cartera',
   u'%d extraidos' % len(BANDAS28))
tot28 = sum(float(x) for _r, x in BANDAS28)
cli28 = re.search(r'pendientesCuentasReal:\s*(\d+)', b28)
cli28 = int(cli28.group(1)) if cli28 else 0
print(u'      cartera S28 %s en %d  ->  S30 %s en %d  (x%.1f dinero, x%.1f clientes)'
      % (pesos(tot28), cli28, pesos(c_tot), c_cli,
         c_tot / tot28, float(c_cli) / cli28))

# EL TRAMO QUE LA S28 AVISÓ. Su propia nota decía que si la ola de 16-30 días
# envejecía sin cobrarse, «se multiplica por veinte». Se multiplicó por más.
mas30_28 = [float(x) for r, x in BANDAS28 if u'30' in r and u'16' not in r]
mas30_28 = mas30_28[0] if mas30_28 else 0.0
mas30_30 = [i for r, i, _n in CARTERA if r == u'+30 dias'][0]
if mas30_28:
    print(u'      +30 dias: %s -> %s  (x%.1f)'
          % (pesos(mas30_28), pesos(mas30_30), mas30_30 / mas30_28))
    avisos.append(u'EL AVISO DE LA S28 SE CUMPLIO Y SE QUEDO CORTO: decia que si la '
                  u'ola de 16-30 dias envejecia sin cobrarse «se multiplica por '
                  u'veinte». El tramo de +30 dias pasa de %s a %s: x%.1f, y de 16 a '
                  u'%d clientes. Y 16-30 NO se vacio (%s en %d), asi que los dos '
                  u'tramos estan cargados a la vez: envejecio una ola y entro otra.'
                  % (pesos(mas30_28), pesos(mas30_30), mas30_30 / mas30_28,
                     [n for r, _i, n in CARTERA if r == u'+30 dias'][0],
                     pesos([i for r, i, _n in CARTERA if r == u'16 - 30 dias'][0]),
                     [n for r, _i, n in CARTERA if r == u'16 - 30 dias'][0]))

# ── 7c · los downgrades de la S28, EXTRAÍDOS ───────────────────────────────
DOWN28 = [(c, float(p)) for c, p in
          re.findall(r"\{ cliente: '([^']+)', perdida: ([\d.]+),", b28)]
ok(len(DOWN28) == 3, u'S28 · se extraen sus 3 downgrades',
   u'%d extraidos' % len(DOWN28))
idx28 = dict((norm(c), p) for c, p in DOWN28)
repetidos = []
for c, pc, p in DOWN:
    k = norm(c)
    if k in idx28 and cerca(idx28[k], p):
        repetidos.append((c, p))
din_rep = sum(p for _c, p in repetidos)
if repetidos:
    print(u'      REPITEN LA S28 AL CENTAVO: %s  (%s, el %.1f%% del bloque)'
          % (u', '.join(u'%s %s' % (c, pesos(p)) for c, p in repetidos),
             pesos(din_rep), din_rep / d_tot * 100))
    avisos.append(u'%d DE LOS %d DOWNGRADES REPITEN LA S28 AL CENTAVO Y AL PUNTO '
                  u'PORCENTUAL (%s, el %.1f%% del bloque), bajo rotulo «Noviembre». '
                  u'Hay DOS lecturas y el correo no distingue: o es un registro que '
                  u'corre arrastrando casos vivos, o es octubre reetiquetado. NO se '
                  u'decide contando. Se publica el total como viene y se dice que %s '
                  u'de el ya estaba publicado en octubre.'
                  % (len(repetidos), len(DOWN), pesos(din_rep),
                     din_rep / d_tot * 100, pesos(din_rep)))
nuevos_dg = [c for c, _pc, _p in DOWN if norm(c) not in idx28]
print(u'      nombres de downgrade que NO venian en la S28: %d de %d'
      % (len(nuevos_dg), len(DOWN)))

# ── 7c-bis · ¿ALGUNA DE ESTAS BAJAS YA SE PUBLICÓ ANTES? ───────────────────
# Es la misma clase que los downgrades repetidos, pero en las cancelaciones, y
# no se puede ver mirando el correo: hace falta la lista acumulada. Se lee de
# `lib/churn-cancelados-data.ts`, que es GENERADA desde los cortes y trae el
# periodo de la PRIMERA aparición de cada nombre. [[churn-analisis-data]]
cc = leer('lib/churn-cancelados-data.ts')
YA_PUBLICADAS = dict((norm(c), p) for c, p in
                     re.findall(r"\{ cliente: '([^']+)', periodo: '([^']+)' \}", cc))
ok(len(YA_PUBLICADAS) > 100, u'se lee la lista acumulada de cancelaciones',
   u'%d nombres' % len(YA_PUBLICADAS))
repes_canc = [(c, i, YA_PUBLICADAS[norm(c)]) for c, i, _m, _x in NOV
              if YA_PUBLICADAS.get(norm(c))
              and u'Semana 30' not in YA_PUBLICADAS[norm(c)]]
if repes_canc:
    for c, i, per in repes_canc:
        print(u'      ~~ %s (%s) YA se publico como cancelada en «%s»' % (c, pesos(i), per))
    avisos.append(u'%d DE LAS 20 CANCELACIONES DE NOVIEMBRE YA SE HABIAN PUBLICADO EN '
                  u'UN CORTE ANTERIOR: %s. Asi que esta lista NO es solo noviembre, y '
                  u'el total del mes arrastra bajas viejas. Mismo patron que los '
                  u'downgrades repetidos.'
                  % (len(repes_canc),
                     u'; '.join(u'%s (%s, publicada en %s)' % (c, pesos(i), p)
                                for c, i, p in repes_canc)))
else:
    print(u'      ninguna de las 20 se habia publicado en un corte anterior.')

# ── 7d · promesas de la S29 ────────────────────────────────────────────────
# EL S29 YA NO ESTÁ EN `reporte-actual.ts`: al publicar el S30 se archivó
# dentro de `page.tsx`. Leerlo del archivo vigente hacía que esta comprobación
# fallara en cuanto el guión cumplía su propósito — un verificador que sólo
# pasa ANTES de publicar no verifica nada. [[feedback-verificar-antes-asegurar]]
m29 = re.search(r'^const REPORTE_S29_OCT_2026: ChurnReporte = \{(.*?)^\}',
                pg, re.S | re.M)
ok(bool(m29), u'S29 · se localiza su bloque archivado en page.tsx')
b29 = m29.group(1) if m29 else u''
prometio_cartera   = u'NO REPORTADA' in b29 and u'cartera por' in b29.lower()
prometio_downgrade = u'se evaluar' in b29
ok(prometio_cartera, u'S29 · anunciaba cartera y no la traia')
ok(prometio_downgrade, u'S29 · avisaba de que los downgrades se evaluarian')
print(u'      la S30 PAGA las dos: cartera %s en %d y downgrades %s en %d.'
      % (pesos(c_tot), c_cli, pesos(d_tot), len(DOWN)))

# ════════════════════════════════════════════════════════════════════════════
# 8 · CRUCE CON FUENTE PROPIA. El correo no se audita solo.
# ════════════════════════════════════════════════════════════════════════════
seccion(8, u'CRUCE CON EL GRC Y CON LA CARTERA CS')
print(u'      GRC: %d filas · mes vivo del export: %s' % (len(FILAS_GRC), MES_VIVO_GRC))

# 8·0 · LOS 474 DEL CORREO Y LOS 474 DEL GRC
# ------------------------------------------
# El correo cuenta 474 clientes de cartera vencida. El GRC cuenta 474 filas de
# churn confirmado `sin_verificar`. El conteo coincide EXACTO y el dinero no
# ($709,965.95 contra $480,485.47), así que no es la misma cifra — pero puede
# ser la misma POBLACIÓN medida de dos maneras: el GRC mide MRR de un mes, la
# cartera mide saldo acumulado. Si lo son, la razón entre los dos dineros tiene
# que parecerse a los meses de saldo que implica el reparto por antigüedad.
# NO SE PUEDE PROBAR POR NOMBRE —el correo no publica los 474—, así que esto se
# declara como hipótesis MEDIDA, no como hecho. [[feedback-cero-sin-medicion]]
sinver = [f for f in FILAS_GRC
          if es_churn_grc(f) and (f.get('verificacion') or u'') == u'sin_verificar']
din_sinver = sum(float(f.get('mrrIni') or 0) for f in sinver)
print(u'      cartera del correo: %d clientes, %s' % (c_cli, pesos(c_tot)))
print(u'      GRC «sin_verificar»: %d filas, %s' % (len(sinver), pesos(din_sinver)))
if len(sinver) == c_cli and din_sinver > 0:
    razon = c_tot / din_sinver
    # Meses de saldo implícitos en el reparto: +30 dias cuenta 2, el resto 1.
    meses_impl = sum(n * (2 if r == u'+30 dias' else 1) for r, _i, n in CARTERA) \
        / float(c_cli)
    print(u'      razon dinero %.3f contra %.3f meses de saldo implicitos en el '
          u'reparto por antiguedad' % (razon, meses_impl))
    ok(abs(razon - meses_impl) <= 0.25,
       u'474 y 474 · el dinero cuadra con los meses de saldo',
       u'%.3f vs %.3f' % (razon, meses_impl))
    avisos.append(u'EL «474» DEL CORREO Y EL «474» DEL GRC SON, CASI SEGURO, LA MISMA '
                  u'POBLACION: el correo cuenta 474 clientes de cartera vencida (%s) y '
                  u'el GRC 474 filas de churn confirmado SIN VERIFICAR (%s de MRR). El '
                  u'conteo casa exacto y la razon de dinero (%.2f) cuadra con los %.2f '
                  u'meses de saldo que implica el reparto por antiguedad. NO ESTA '
                  u'PROBADO POR NOMBRE —el correo no publica los 474—, pero si lo son, '
                  u'la cartera vencida y el churn de noviembre son EL MISMO HECHO '
                  u'contado dos veces.'
                  % (pesos(c_tot), pesos(din_sinver), razon, meses_impl))
else:
    print(u'      los conteos NO coinciden: no hay hipotesis que medir.')


def fila_grc(nombre):
    u"""La fila del GRC de un nombre, EXACTA antes que parecida. Un parecido no
       es una identidad: dos filas pueden compartir CID y una estar viva."""
    c = norm(nombre)
    cands = [(norm(f.get('cliente') or ''), f) for f in FILAS_GRC]
    for n, f in cands:
        if n and n == c:
            return f
    parciales = [f for n, f in cands if n and (n in c or c in n)]
    return parciales[0] if len(parciales) == 1 else None


# 8a · EL TOP DE ACTIVOS CONTRA EL GRC. Aquí es donde un «cliente activo» puede
# aparecer como churn confirmado: es la regla del mes vencido, vista de frente.
print(u'      -- top de ACTIVOS contra el GRC --')
activos_en_cero = []
for c, i, mm in TOP_ACTIVOS:
    f = fila_grc(c)
    if not f:
        print(u'        %-30s sin fila en el GRC' % c)
        continue
    mrr_i = float(f.get('mrrIni') or 0)
    mrr_f = float(f.get('mrrFin') or 0)
    mov   = f.get('movimiento') or u'—'
    ver = f.get('verificacion') or u'—'
    print(u'        %-30s GRC %10s -> %-9s %-18s verif=%-13s %s/%s'
          % (c, pesos(mrr_i), pesos(mrr_f), mov, ver,
             f.get('consecutivo') or u'—', f.get('estadoBase') or u'—'))
    activos_en_cero.append((c, i, mm, mrr_i, mrr_f, mov, ver, f))

# NO ES AZYCO: SON LOS CINCO. Que los cinco mayores «clientes activos» del mes
# salgan en el GRC como «Churn confirmado» con MRR en cero Y AL MISMO PESO no es
# una contradicción entre fuentes: es la regla del mes vencido vista de frente.
# Lo que lo DEMUESTRA es el campo `verificacion`: nuestra propia escalera ya los
# marcó `sigue_viva`, así que el GRC y el correo dicen lo mismo y el «churn» de
# esas cinco filas es que todavía no han facturado noviembre.
# [[regla-churn-mes-vencido]] [[grc-fuente-zoho]]
cinco_en_cero = [r for r in activos_en_cero if cerca(r[3], r[1], 1.0) and r[4] == 0]
ok(len(cinco_en_cero) == len(TOP_ACTIVOS),
   u'top activos · los 5 salen en el GRC al mismo peso',
   u'%d de %d' % (len(cinco_en_cero), len(TOP_ACTIVOS)))
ok(all(r[6] == u'sigue_viva' for r in cinco_en_cero),
   u'top activos · nuestra escalera los da SIGUE_VIVA',
   u', '.join(sorted(set(r[6] for r in cinco_en_cero))))
if cinco_en_cero and all(r[6] == u'sigue_viva' for r in cinco_en_cero):
    avisos.append(u'LOS CINCO «CLIENTES ACTIVOS» DEL TOP SALEN EN EL GRC COMO «CHURN '
                  u'CONFIRMADO» CON MRR EN CERO, AL MISMO PESO (%s). NO es una '
                  u'contradiccion: nuestra escalera de verificacion ya los marca '
                  u'SIGUE_VIVA y el correo no los cancela. Es la regla del mes vencido '
                  u'de frente —el mes vivo marca como perdido lo que aun no factura—. '
                  u'Quien leyera el GRC de noviembre a la letra pasaria a Dormidas a '
                  u'las cinco cuentas mayores del mes, Hospital Santa Rosa (61 meses) '
                  u'entre ellas. NINGUNA se mueve.' % pesos(suma_act))
# Y DOS DE LAS CINCO YA ESTÁN EN RIESGO EN NUESTRA BASE mientras Data las
# publica como el techo de la cartera activa. Eso no lo dice el correo.
riesgo = [(r[0], r[1], r[7].get('consecutivo'), r[7].get('asesor'))
          for r in cinco_en_cero if r[7].get('estadoBase') == u'en_riesgo']
if riesgo:
    avisos.append(u'%d DE LAS 5 DEL TOP DE ACTIVOS ESTAN «en_riesgo» EN NUESTRA BASE: '
                  u'%s. El correo las publica como el techo de la cartera activa y no '
                  u'lo sabe; nosotros si.'
                  % (len(riesgo), u'; '.join(u'%s (%s, %s, %s)'
                                             % (c, pesos(i), cons or u'—', ase or u'—')
                                             for c, i, cons, ase in riesgo)))

# 8b · ¿CUÁLES DE ESTAS BAJAS Y DOWNGRADES SON CARTERA NUESTRA?
print(u'      -- cancelados y downgrades en la cartera CS --')
TODOS = [(c, i, u'baja') for c, i, _m, _x in NOV] + \
        [(c, p, u'downgrade') for c, _pc, p in DOWN]
en_cartera, sin_fila = [], []
for cli, imp, tipo in TODOS:
    f = fila_grc(cli)
    if not f:
        sin_fila.append(cli)
        continue
    if f.get('enCartera'):
        en_cartera.append((cli, imp, tipo, f.get('cid'), f.get('consecutivo'),
                           f.get('asesor'), f.get('movimiento')))
print(u'      de %d nombres: %d con fila en el GRC, %d en la cartera CS'
      % (len(TODOS), len(TODOS) - len(sin_fila), len(en_cartera)))
for cli, imp, tipo, cid, cons, ase, mov in en_cartera:
    print(u'        %-34s %-10s %10s  cid %-8s %-5s %-10s %s'
          % (cli, tipo, pesos(imp), cid, cons or u'—', ase or u'—', mov))

# UN CID COMPARTIDO NO ES UNA BAJA DE CUENTA: si otra fila del mismo CID sigue
# viva, lo que muere es una línea agrupada. Pasarla a Dormidas apagaría una
# cuenta que factura. [[churn-confirmado-direccion]]
for cli, imp, tipo, cid, _cons, _ase, _mov in list(en_cartera):
    hermanas = [f for f in FILAS_GRC
                if str(f.get('cid') or '') == str(cid)
                and norm(f.get('cliente') or '') != norm(cli)]
    vivas = [f for f in hermanas
             if any(v in (f.get('movimiento') or u'').lower()
                    for v in (u'mrr estable', u'upgrade', u'nuevo', u'reactiv'))]
    for f in vivas:
        print(u'        ~~ cid %s lo comparte con «%s» (%s, MRR %s): LA CUENTA SIGUE VIVA'
              % (cid, f.get('cliente'), f.get('movimiento'),
                 pesos(float(f.get('mrrFin') or 0))))
    if vivas:
        avisos.append(u'%s NO ES UNA BAJA DE CUENTA: el cid %s lo comparte con «%s», '
                      u'que sigue facturando. Lo que muere es una linea agrupada.'
                      % (cli, cid, vivas[0].get('cliente')))

# 8c · EL CORREO LAS CANCELA Y NUESTRA BASE LAS DA POR VIVAS
# ----------------------------------------------------------
# Éste es el cruce que importa de todo el corte. `verificacion = sigue_viva`
# significa, en la escalera de `gen-grc-zoho.py`, que la fila viene marcada como
# churn y nuestra base la contradice. Para una fila que el CORREO además publica
# como CANCELADA, eso es una baja que nadie ha ejecutado todavía.
#
# Y HAY QUE DECIR DE QUÉ VALE ESE VEREDICTO: con `verificadoPor = 'cartera'' la
# prueba es `cuentas.estado`, que es NUESTRO registro — está vivo porque nadie
# la ha pasado a Dormidas, que es precisamente la acción que este corte dispara.
# Es circular y se declara circular. Sólo `verificadoPor = 'facturacion'` es
# prueba independiente: ahí la cuenta FACTURÓ después.
# [[churn-confirmado-direccion]] [[feedback-conciliacion-churn]]
print(u'      -- cancelados que nuestra base NO da de baja --')
vivas_canceladas = []
for cli, imp, _m, mot in NOV:
    f = fila_grc(cli)
    if not f or (f.get('verificacion') or u'') != u'sigue_viva':
        continue
    vivas_canceladas.append((cli, imp, mot, f))
    print(u'        %-24s %10s  verificadoPor=%-12s %s/%s/%s  motivo=%s'
          % (cli, pesos(imp), f.get('verificadoPor'), f.get('consecutivo') or u'—',
             f.get('asesor') or u'—', f.get('estadoBase') or u'—',
             u'SIN MOTIVO' if mot == SIN_MOTIVO else mot))
if vivas_canceladas:
    din_vc = sum(i for _c, i, _m, _f in vivas_canceladas)
    por_cartera = [r for r in vivas_canceladas if r[3].get('verificadoPor') == u'cartera']
    sin_mot_vc = [r for r in vivas_canceladas if r[2] == SIN_MOTIVO]
    avisos.append(u'%d DE LAS %d CANCELACIONES DE NOVIEMBRE SON CUENTAS QUE NUESTRA '
                  u'BASE DA POR VIVAS: %s. Son %s, el %.1f%% de lo cancelado en el '
                  u'mes, y %d de ellas van SIN MOTIVO en el correo. ES EL HALLAZGO '
                  u'DEL CORTE: el correo las cancela, nuestro registro las tiene '
                  u'activas y nadie ha ejecutado nada.'
                  % (len(vivas_canceladas), len(NOV),
                     u'; '.join(u'%s (%s, %s, %s)'
                                % (c, pesos(i), f.get('consecutivo') or u'—',
                                   f.get('asesor') or u'—')
                                for c, i, _m, f in vivas_canceladas),
                     pesos(din_vc), din_vc / suma_nov * 100, len(sin_mot_vc)))
    if por_cartera:
        avisos.append(u'Y EL VEREDICTO «SIGUE VIVA» DE ESAS %d ES CIRCULAR, hay que '
                      u'decirlo: viene de `verificadoPor = cartera`, o sea de '
                      u'`cuentas.estado`, que esta activo PORQUE NADIE LAS HA PASADO A '
                      u'DORMIDAS —que es la accion que este corte dispara—. No es '
                      u'prueba de vida: solo `verificadoPor = facturacion` lo seria. '
                      u'Van al corte TOP de churn confirmado como CANDIDATAS, y no se '
                      u'mueve ninguna sin autorizacion de direccion.' % len(por_cartera))
else:
    print(u'        ninguna: las 20 bajas del correo las corrobora nuestra base.')

# ─── 9 · LO QUE NO SE PUEDE DECIDIR, DECLARADO ─────────────────────────────
seccion(9, u'LO QUE ESTE CORTE NO PERMITE DECIDIR')
INDECIDIBLES = [
    # OJO: el 15.5% YA NO ESTÁ AQUÍ. Estaba, con el texto «sin denominador
    # publicado no se reconstruye», y la sección 6 lo reconstruyó contra el GRC
    # en la misma corrida: el guión se contradecía a sí mismo. Dejar un
    # indecidible que otra sección ya decidió es el error más barato de cazar y
    # el más fácil de dejar puesto. [[feedback-auditorias-verificar]]
    (u'pct-noviembre-base-exacta',
     u'El 15.5% SI se reconstruye como la canasta de churn del GRC (medimos '
     u'16.01%), pero el correo no publica SU base, asi que el medio punto de '
     u'diferencia no se puede atribuir: o es otro dia de corte o es otra base.'),
    (u'downgrades-repetidos',
     u'Si los %d downgrades que repiten la S28 son registro corriente u octubre '
     u'reetiquetado.' % len(repetidos)),
    (u'meses-gana',
     u'Por que %d fila(s) cambian de meses activo entre cortes de cinco dias.'
     % len(cambian_meses)),
    (u'los-474',
     u'Si los 474 clientes de cartera vencida del correo son los MISMOS 474 que '
     u'el GRC trae como churn confirmado sin verificar. El conteo casa exacto y '
     u'el dinero cuadra con los meses de saldo, pero el correo no publica los '
     u'nombres: no se puede probar por nombre y no se afirma.'),
    (u'top-activos-sin-total',
     u'El correo no declara total del top de activos: la suma es nuestra.'),
    (u'sadat-enmazatlan-palms',
     u'Sigue ABIERTA la pregunta de la S29: Biolaboratorio Sadat, enMazatlan y '
     u'ZD · The Palms valian mas que el piso del top de octubre y no aparecian. '
     u'Este corte es de noviembre y no la responde.'),
]
for k, t in INDECIDIBLES:
    print(u'      · [%s] %s' % (k, t))

# ════════════════════════════════════════════════════════════════════════════
print(u'\n  === AVISOS (%d) ===' % len(avisos))
for a in avisos:
    print(u'   !! %s' % a)

print(u'\n  === RESULTADO ===')
if fallos:
    print(u'  *** %d COMPROBACIONES NO CIERRAN:' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    sys.exit(1)
print(u'  Todas las comprobaciones de cierre pasan. El corte se puede publicar, y '
      u'los %d avisos de arriba van DENTRO de la nota: un aviso que se queda en la '
      u'consola es un aviso que nadie leyó.' % len(avisos))
sys.exit(0)
