# -*- coding: utf-8 -*-
u"""RECALCULA LAS CIFRAS DEL REPORTE DE CARGO LIFT ANTES DE PUBLICARLO.

   Mismo oficio que `...-casa-galvan.py` y `...-salud-y-hogar.py`, con una
   diferencia de forma que importa: este reporte NO trae un `const D={...}`.
   Sus cifras viven en los `<title>` de los SVG (uno por barra, por punto y por
   celda) y en las tablas de HTML. Así que se leen de ahí y se recalculan.

   Que la cifra esté dentro de un `<title>` que nadie ve salvo al pasar el ratón
   no la vuelve menos publicada: el documento la afirma igual.

   Y SE COMPRUEBA CONTRA NUESTRAS FUENTES, no sólo contra sí mismo: el MRR
   institucional es el del GRC y nada más, el Health Score sale de `cuentas`, y
   las alertas abiertas de la cuenta son parte del expediente aunque el reporte
   no las mencione. [[grc-fuente-zoho]] [[alertas-cliente]]

   USO
       python -I scripts/concilia-auditoria-cargo-lift.py [ruta.html]

   La ruta es opcional para poder PROBAR QUE SABE FALLAR sobre una copia rota
   sin tocar el documento publicado. [[feedback-probar-al-reves]]
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFECTO = os.path.join(RAIZ, 'public', 'auditorias', 'Auditoria-Cargo-Lift-2026.html')
RUTA = sys.argv[1] if len(sys.argv) > 1 else DEFECTO

CID = '439'
fallos = []
avisos = []


def ok(cond, etiqueta, detalle=u''):
    print(u'  %-58s %s%s' % (etiqueta, u'OK' if cond else u'*** NO CIERRA',
                             (u'  ' + detalle) if detalle else u''))
    if not cond:
        fallos.append(etiqueta)
    return cond


def cerca(a, b, tol=0.051):
    return abs(a - b) <= tol


def miles(n):
    return format(int(round(n)), ',')


def num(x):
    return int(str(x).replace(',', ''))


if not os.path.exists(RUTA):
    print(u'  no existe: %s' % RUTA)
    sys.exit(1)

html = io.open(RUTA, encoding='utf-8').read()

# ── LAS NOTAS QUE NOSOTROS AÑADIMOS SE RECORTAN ANTES DE BUSCAR ────────────
# Si no, el guion se delata a sí mismo: una nota que dice «el documento decía
# 62.1%» contiene la cifra, el detector la encuentra para siempre y el candado
# deja de servir. Y se EXIGE que las marcas existan: borrarlas tiene que poner
# esto en rojo. [[auditoria-modulo]]
NOTA = re.compile(r'<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', re.S)
notas = NOTA.findall(html)
texto = NOTA.sub(u' ', html)

print(u'\n  CONCILIACIÓN · AUDITORÍA DE LLAMADAS · CARGO LIFT (CID %s)' % CID)
print(u'  ' + u'=' * 72)
print(u'  documento: %s' % RUTA)
print(u'  notas nuestras marcadas en el documento: %d' % len(notas))

# ─── 0 · LO QUE SE LEE DE LOS SVG Y DE LAS TABLAS ──────────────────────────
# Barras del primer gráfico: llamadas por día hábil.  «Ene: 28.0 ... (589 en 21 días)»
BARRA = re.compile(u'<title>(\\w{3}): ([\\d.]+) llamadas por día hábil '
                   u'\\((\\d+) en (\\d+) días\\)</title>')
# Puntos del mismo gráfico: % sin contestar.  «Ene: 12.3% (75 de 610)»
PUNTO = re.compile(u'<title>(\\w{3}): ([\\d.]+)% \\((\\d+) de (\\d+)\\)</title>')
# Puntos semanales.  «Semana del 5 ene: 9.6% (12 de 125)»
SEMANA = re.compile(u'<title>Semana del ([^:]+): ([\\d.]+)% \\((\\d+) de (\\d+)\\)</title>')
# Celdas del mapa de calor.  «Lun 8:00: 5.3% (2 de 38)»
CELDA = re.compile(u'<title>(Lun|Mar|Mié|Jue|Vie) (\\d{1,2}):00: ([\\d.]+)% '
                   u'\\((\\d+) de (\\d+)\\)</title>')
# Destinos: dos títulos por destino.
DEST_N = re.compile(u'<title>([^<:]+): (\\d+) recibidas</title>')
DEST_P = re.compile(u'<title>([^<:]+): (\\d+) sin contestar \\(([\\d.]+)%\\)</title>')

barras = BARRA.findall(texto)
puntos = PUNTO.findall(texto)
semanas = SEMANA.findall(texto)
celdas = CELDA.findall(texto)
dest_n = dict((n.strip(), int(v)) for n, v in DEST_N.findall(texto))
dest_p = dict((n.strip(), (int(v), float(p))) for n, v, p in DEST_P.findall(texto))

print(u'\n  --- 0 · LO QUE SE PUDO LEER DEL DOCUMENTO')
print(u'      %2d barra(s) mensual(es) · %2d punto(s) mensual(es) · %2d semana(s)'
      % (len(barras), len(puntos), len(semanas)))
print(u'      %2d celda(s) del mapa de calor · %2d destino(s)'
      % (len(celdas), len(dest_n)))

# CANDADO CONTRA EL VERIFICADOR QUE CONCLUYE POR DEFECTO.
# Si los patrones dejan de encajar —porque alguien reescribe el SVG, o porque
# este guion se apunta a un documento distinto—, todas las sumas de abajo darían
# cero y cada comprobación «cerraría» contra cero. Un verificador que concluye
# éxito cuando no pudo leer nada es peor que no tenerlo.
# [[feedback-verificar-antes-asegurar]]
if not ok(len(barras) == 11 and len(puntos) == 11 and len(celdas) == 55
          and len(semanas) >= 40 and len(dest_n) >= 20,
          u'EL LECTOR DE SVG SÍ DEVOLVIÓ SERIES',
          u'11/11/55/%d/%d esperados; leídos %d/%d/%d/%d/%d'
          % (len(semanas), len(dest_n), len(barras), len(puntos),
             len(celdas), len(semanas), len(dest_n))):
    print(u'\n      *** No se pudo leer el documento: ninguna comprobación de abajo')
    print(u'          significaría nada. Se para aquí en rojo en vez de dar un verde')
    print(u'          construido sobre series vacías.')
    sys.exit(1)

# ─── 1 · LA TABLA DE ALCANCE: EXTERNAS + INTERNAS = TOTAL ──────────────────
print(u'\n  --- 1 · ALCANCE · EXTERNAS + INTERNAS = TOTAL DEL REGISTRO')
alc = re.findall(r'<tr><td>(Entrantes|Salientes)</td><td class="num">([\d,]+)</td>'
                 r'<td class="num">([\d,]+)</td><td class="num">([\d,]+)</td></tr>', texto)
ok(len(alc) == 2, u'la tabla de alcance trae sus dos registros', u'%d' % len(alc))
ALC = {}
for etq, tt, ex, inn in alc:
    tt, ex, inn = num(tt), num(ex), num(inn)
    ALC[etq] = {'total': tt, 'ext': ex, 'int': inn}
    ok(ex + inn == tt, u'%s: externas + internas = total' % etq,
       u'%s + %s = %s' % (miles(ex), miles(inn), miles(tt)))
ENTRANTES = ALC['Entrantes']['ext']
SALIENTES = ALC['Salientes']['ext']
ok(ENTRANTES == 5319, u'las entrantes externas son las 5,319 del resumen', miles(ENTRANTES))
ok(SALIENTES == 1000, u'las salientes externas son las 1,000 del texto', miles(SALIENTES))

# ─── 2 · LA SERIE MENSUAL DE PÉRDIDA TIENE QUE DAR EL TOTAL ────────────────
print(u'\n  --- 2 · SERIE MENSUAL · % SIN CONTESTAR')
mesesP = [p[0] for p in puntos]
perdM = dict((p[0], int(p[2])) for p in puntos)
totM = dict((p[0], int(p[3])) for p in puntos)
pubM = dict((p[0], float(p[1])) for p in puntos)
malos = [(m, pubM[m], perdM[m] / float(totM[m]) * 100) for m in mesesP
         if not cerca(pubM[m], perdM[m] / float(totM[m]) * 100, 0.06)]
ok(not malos, u'el % de cada mes se reconstruye dividiendo',
   u'' if not malos else u'; '.join(u'%s pub %.1f calc %.1f' % x for x in malos))
PERDIDAS = sum(perdM.values())
ok(sum(totM.values()) == ENTRANTES,
   u'los 11 meses suman las entrantes externas del alcance',
   u'%s vs %s' % (miles(sum(totM.values())), miles(ENTRANTES)))
ok(PERDIDAS == 486, u'los 11 meses suman las 486 perdidas que cita el resumen',
   miles(PERDIDAS))
tasa = PERDIDAS / float(ENTRANTES) * 100
ok(cerca(tasa, 9.1, 0.06), u'9.1% de pérdida anual',
   u'%s/%s = %.2f%%' % (miles(PERDIDAS), miles(ENTRANTES), tasa))

# Los dos semestres del titular, reconstruidos y además cerrando entre sí.
PRIM = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
SEG = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov']
p1 = sum(perdM[m] for m in PRIM); t1 = sum(totM[m] for m in PRIM)
p2 = sum(perdM[m] for m in SEG); t2 = sum(totM[m] for m in SEG)
ok(cerca(p1 / float(t1) * 100, 10.4, 0.06), u'enero–junio: 10.4% sin contestar',
   u'%s/%s = %.2f%%' % (miles(p1), miles(t1), p1 / float(t1) * 100))
ok(cerca(p2 / float(t2) * 100, 6.5, 0.06), u'julio–noviembre: 6.5% sin contestar',
   u'%s/%s = %.2f%%' % (miles(p2), miles(t2), p2 / float(t2) * 100))
ok(p1 + p2 == PERDIDAS and t1 + t2 == ENTRANTES,
   u'los dos tramos del titular cubren el periodo entero, sin hueco',
   u'%s+%s=%s perdidas · %s+%s=%s entrantes'
   % (miles(p1), miles(p2), miles(PERDIDAS), miles(t1), miles(t2), miles(ENTRANTES)))

# ─── 3 · LA CAÍDA DE DEMANDA, QUE ES EL TITULAR ────────────────────────────
print(u'\n  --- 3 · LA CAÍDA DE DEMANDA · LLAMADAS POR DÍA HÁBIL')
nB = dict((b[0], int(b[2])) for b in barras)
dB = dict((b[0], int(b[3])) for b in barras)
pubB = dict((b[0], float(b[1])) for b in barras)
malos = [(m, pubB[m], nB[m] / float(dB[m])) for m in nB
         if not cerca(pubB[m], nB[m] / float(dB[m]), 0.06)]
ok(not malos, u'llamadas por día hábil = llamadas / días hábiles, mes a mes',
   u'' if not malos else u'; '.join(u'%s pub %.1f calc %.1f' % x for x in malos))
Q1 = ['Ene', 'Feb', 'Mar']
q1 = sum(nB[m] for m in Q1) / float(sum(dB[m] for m in Q1))
ok(cerca(q1, 31.6, 0.06), u'promedio del 1er trimestre: 31.6 por día hábil',
   u'%s / %d días = %.2f' % (miles(sum(nB[m] for m in Q1)), sum(dB[m] for m in Q1), q1))
AN = ['Ago', 'Sep', 'Oct', 'Nov']
an = sum(nB[m] for m in AN) / float(sum(dB[m] for m in AN))
ok(cerca(an, 14.9, 0.06), u'promedio de agosto a noviembre: 14.9 por día hábil',
   u'%s / %d días = %.2f' % (miles(sum(nB[m] for m in AN)), sum(dB[m] for m in AN), an))
caida = (an / q1 - 1) * 100
ok(abs(caida + 53) < 0.6, u'la caída publicada −53% sale de esos dos promedios',
   u'%.2f / %.2f − 1 = %.1f%%' % (an, q1, caida))

# El gráfico de barras es SÓLO de lunes a viernes y el de puntos es de todos los
# días: sus totales NO tienen por qué coincidir, y confundirlos sería acusar un
# error que no existe. Lo que sí tiene que pasar es que el de barras sea MENOR
# y que la diferencia la expliquen el sábado y el domingo.
LV = sum(nB.values())
print(u'      barras (L–V, todas las horas): %s · puntos (todos los días): %s'
      % (miles(LV), miles(ENTRANTES)))
ok(LV < ENTRANTES, u'la serie L–V es menor que la de todos los días',
   u'%s de %s' % (miles(LV), miles(ENTRANTES)))

# ─── 4 · SEMANAS ───────────────────────────────────────────────────────────
print(u'\n  --- 4 · SEMANAS')
malos = [(s[0], float(s[1]), int(s[2]) / float(s[3]) * 100) for s in semanas
         if not cerca(float(s[1]), int(s[2]) / float(s[3]) * 100, 0.06)]
ok(not malos, u'el % de cada semana se reconstruye dividiendo',
   u'' if not malos else u'; '.join(u'%s pub %.1f calc %.1f' % x for x in malos))
sp = sum(int(s[2]) for s in semanas)
st = sum(int(s[3]) for s in semanas)
# Son SEMANAS COMPLETAS del 5 ene al 15 nov: tienen que quedar por debajo del
# total del periodo (2 ene – 17 nov), no darlo.
ok(sp <= PERDIDAS and st <= ENTRANTES,
   u'las semanas completas no pasan del total del periodo',
   u'%s de %s perdidas · %s de %s entrantes'
   % (miles(sp), miles(PERDIDAS), miles(st), miles(ENTRANTES)))
print(u'      las semanas completas cubren %s de %s entrantes: quedan %s fuera '
      u'(2–4 ene y 16–17 nov)' % (miles(st), miles(ENTRANTES), miles(ENTRANTES - st)))
peor = max(semanas, key=lambda s: float(s[1]))
ok(peor[0].strip() == u'9 feb' and int(peor[2]) == 37 and int(peor[3]) == 208,
   u'la peor semana del año es la del 9 de febrero (37 de 208)',
   u'%s: %s de %s' % (peor[0].strip(), peor[2], peor[3]))
# EL SUPERLATIVO SIN COMPROBAR, que es la clase de error más barata de cazar y
# la que más veces ha aparecido. El texto afirma que la del 9 de febrero es «la
# semana de más volumen del año»: eso se mide, no se cree.
# [[feedback-auditorias-verificar]]
porVol = sorted(semanas, key=lambda s: -int(s[3]))
masVol = porVol[0]
print(u'      por volumen: ' + u' · '.join(u'%s %s' % (s[0].strip(), s[3]) for s in porVol[:4]))
if re.search(r'en la semana de más volumen del año', texto):
    puesto = [s[0].strip() for s in porVol].index(u'9 feb') + 1
    if masVol[0].strip() != u'9 feb':
        fallos.append(
            u'SUPERLATIVO FALSO: el texto dice que la semana del 9 de febrero es «la semana de '
            u'más volumen del año» y es la %dª: la de más volumen es la del %s con %s llamadas '
            u'(la del 9 feb tuvo %s). Sí es la semana con MÁS PERDIDAS (%s) y la de peor tasa '
            u'(%s%%), que es lo que el reporte quiere decir.'
            % (puesto, masVol[0].strip(), masVol[3], peor[3], peor[2], peor[1]))
masPerd = max(semanas, key=lambda s: int(s[2]))
ok(masPerd[0].strip() == u'9 feb',
   u'y sí es la semana con más llamadas sin contestar del año',
   u'%s con %s perdidas' % (masPerd[0].strip(), masPerd[2]))
# Y LA FRASE CORREGIDA TIENE QUE SEGUIR AHÍ, fuera de la nota. Si alguien
# devuelve el texto al superlativo falso, esto se pone en rojo; si sólo se
# vigilara la frase mala, revertir a mano quedaría en verde.
ok(re.search(u'semana con más llamadas sin contestar del año', texto) is not None,
   u'la afirmación corregida sigue en el cuerpo del reporte')
# Y la tesis «cuando el volumen sube, la pérdida se dispara»: se mide sobre
# TODAS las semanas de más de 200 llamadas, no sobre las tres que convienen.
grandes = [s for s in semanas if int(s[3]) > 200]
gp = sum(int(s[2]) for s in grandes); gt = sum(int(s[3]) for s in grandes)
print(u'      las %d semanas de más de 200 llamadas pierden %s de %s = %.1f%% '
      u'(el año: %.1f%%)' % (len(grandes), gp, gt, gp / float(gt) * 100, tasa))
ok(gp / float(gt) * 100 > tasa,
   u'las semanas de más de 200 llamadas pierden más que el año',
   u'%.1f%% vs %.1f%%' % (gp / float(gt) * 100, tasa))
citadas = re.search(r'las del 9 y 16 de febrero y la del 6 de abril pasaron de 200', texto)
if citadas and len(grandes) > 3:
    omitidas = [s for s in grandes if s[0].strip() not in (u'9 feb', u'16 feb', u'6 abr')]
    avisos.append(u'LA LISTA DE SEMANAS GRANDES ESTÁ INCOMPLETA, Y LA QUE FALTA ES LA QUE '
                  u'CONTRADICE: el texto dice que «las del 9 y 16 de febrero y la del 6 de '
                  u'abril pasaron de 200 llamadas», pero hay %d semanas por encima de 200 y la '
                  u'que falta es %s —la de MÁS volumen del año (%s llamadas)— que perdió sólo '
                  u'%s%%, por debajo del %.1f%% anual. En conjunto las cuatro pierden %.1f%%, '
                  u'así que la tesis «cuando el volumen sube la pérdida se dispara» se sostiene '
                  u'en promedio, pero NO semana por semana, y el lector que mire el gráfico lo '
                  u've. [[feedback-auditorias-verificar]]'
                  % (len(grandes), u' y '.join(s[0].strip() for s in omitidas),
                     omitidas[0][3], omitidas[0][1], tasa, gp / float(gt) * 100))

# ─── 5 · MAPA DE CALOR · DÍA Y HORA ────────────────────────────────────────
print(u'\n  --- 5 · DÍAS Y HORAS')
malos = [(u'%s %s' % (c[0], c[1]), float(c[2]), int(c[3]) / float(c[4]) * 100)
         for c in celdas if not cerca(float(c[2]), int(c[3]) / float(c[4]) * 100, 0.06)]
ok(not malos, u'el % de cada celda se reconstruye dividiendo',
   u'' if not malos else u'; '.join(u'%s pub %.1f calc %.1f' % x for x in malos))
HM_P = sum(int(c[3]) for c in celdas)
HM_T = sum(int(c[4]) for c in celdas)
print(u'      el mapa (L–V, 8:00–18:59) cubre %s entrantes y %s perdidas'
      % (miles(HM_T), miles(HM_P)))

# EL CIERRE QUE IMPORTA: mapa + sábado + fuera de horario = el total.
SAB_N = num(re.search(r'Sábado funciona:</b> ([\d,]+) llamadas', texto).group(1))
SAB_PCT = float(re.search(r'([\d.]+)% de pérdida', texto).group(1))
FH_N = num(re.search(r'entraron ([\d,]+) llamadas; solo (\d+) se perdieron', texto).group(1))
FH_P = num(re.search(r'entraron [\d,]+ llamadas; solo (\d+) se perdieron', texto).group(1))
SAB_P = int(round(SAB_N * SAB_PCT / 100.0))
ok(HM_P + SAB_P + FH_P == PERDIDAS,
   u'mapa + sábado + fuera de horario = las 486 perdidas',
   u'%s + %s + %s = %s' % (HM_P, SAB_P, FH_P, HM_P + SAB_P + FH_P))

# Las entrantes NO cierran igual, y la diferencia tiene explicación: el sábado
# tiene llamadas que además son «fuera de horario», así que están en los dos
# conjuntos. Se mide el solape en vez de redondearlo a «cuadra».
solape = (HM_T + SAB_N + FH_N) - ENTRANTES
hueco_lv = LV - HM_T                       # L–V fuera de la ventana 8–18:59
domingos = ENTRANTES - LV - SAB_N
print(u'      descomposición: L–V fuera de 8–18:59 = %s · domingos = %s · '
      u'sábado fuera de horario = %s' % (miles(hueco_lv), miles(domingos), miles(solape)))
ok(hueco_lv + domingos + solape == FH_N,
   u'el «fuera de horario» se descompone exactamente',
   u'%s + %s + %s = %s' % (hueco_lv, domingos, solape, FH_N))
ok(0 <= solape <= 5, u'el solape sábado/fuera-de-horario es de pocas llamadas',
   u'%s llamada(s), %.2f%% del total' % (solape, solape / float(ENTRANTES) * 100))
if solape:
    avisos.append(u'SOLAPE DECLARABLE: «sábado» (%s llamadas) y «fuera de horario» (%s) '
                  u'comparten %s llamada(s) —las de sábado antes de las 8:00 o después de '
                  u'las 19:00—, así que sumar mapa + sábado + fuera de horario da %s y las '
                  u'externas son %s. No mueve ningún porcentaje (%.2f%%) y las PERDIDAS sí '
                  u'cierran exactas, pero un lector que sume se queda con la duda.'
                  % (miles(SAB_N), miles(FH_N), solape, miles(HM_T + SAB_N + FH_N),
                     miles(ENTRANTES), solape / float(ENTRANTES) * 100))

# Las 15:00, que el texto llama «la peor hora del año».
q15 = [c for c in celdas if c[1] == '15']
p15 = sum(int(c[3]) for c in q15)
t15 = sum(int(c[4]) for c in q15)
mTexto = re.search(r'15:00 es la peor hora del año:</b> ([\d.]+)% \((\d+) de (\d+)\)', texto)
ok(mTexto is not None, u'el texto declara las 15:00 con su fracción')
if mTexto:
    pubP, pubT = int(mTexto.group(2)), int(mTexto.group(3))
    ok(p15 == pubP, u'las perdidas de las 15:00 coinciden con el mapa',
       u'mapa %s vs texto %s' % (p15, pubP))
    ok(cerca(float(mTexto.group(1)), pubP / float(pubT) * 100, 0.06),
       u'el 13.6% de las 15:00 sale de su propia fracción',
       u'%s/%s = %.2f%%' % (pubP, pubT, pubP / float(pubT) * 100))
    if pubT != t15:
        avisos.append(u'LAS 15:00 SE MIDEN SOBRE DOS POBLACIONES: el texto dice «%.1f%% (%s de '
                      u'%s)» y el mapa de calor —que es sólo de lunes a viernes— da %s de %s = '
                      u'%.1f%%. La diferencia son %s llamadas de sábado a las 15:00, todas '
                      u'atendidas. No es un error, pero un lector que recalcule desde el '
                      u'gráfico obtiene %.1f%% y no %.1f%%: hay que decir que la hora se mide '
                      u'con sábado incluido.'
                      % (float(mTexto.group(1)), pubP, pubT, p15, t15,
                         p15 / float(t15) * 100, pubT - t15,
                         p15 / float(t15) * 100, float(mTexto.group(1))))

# Lunes de 9 a 12:59, que el texto cuantifica.
lun = sum(int(c[3]) for c in celdas if c[0] == 'Lun' and c[1] in ('9', '10', '11', '12'))
mLun = re.search(r'Lunes de 9:00 a 12:59:</b> (\d+) llamadas perdidas, (\d+)%', texto)
ok(mLun is not None and int(mLun.group(1)) == lun,
   u'las 65 perdidas del lunes por la mañana salen del mapa',
   u'mapa %s vs texto %s' % (lun, mLun.group(1) if mLun else u'—'))
ok(mLun is not None and abs(lun / float(PERDIDAS) * 100 - int(mLun.group(2))) < 0.6,
   u'y son el 13% de las perdidas del año',
   u'%s/%s = %.1f%%' % (lun, miles(PERDIDAS), lun / float(PERDIDAS) * 100))

# La peor celda del mapa con volumen, contra lo que el titular del gráfico dice.
conVol = [c for c in celdas if int(c[4]) >= 50]
peorC = max(conVol, key=lambda c: int(c[3]) / float(c[4]))
ok(peorC[0] == 'Vie' and peorC[1] == '15',
   u'la peor celda con 50+ llamadas es viernes a las 15:00',
   u'%s %s:00 = %.1f%%' % (peorC[0], peorC[1], int(peorC[3]) / float(peorC[4]) * 100))

# ─── 6 · DESTINOS ──────────────────────────────────────────────────────────
print(u'\n  --- 6 · DESTINOS')
ok(set(dest_n) == set(dest_p), u'cada destino trae recibidas Y sin contestar',
   u'%d / %d' % (len(dest_n), len(dest_p)))
malos = []
for n, tt in dest_n.items():
    pp, pub = dest_p[n]
    if pp > tt:
        fallos.append(u'%s: %s sin contestar de %s recibidas' % (n, pp, tt))
    if not cerca(pub, pp / float(tt) * 100, 0.06):
        malos.append((n, pub, pp / float(tt) * 100))
ok(not malos, u'el % de cada destino se reconstruye dividiendo',
   u'' if not malos else u'; '.join(u'%s pub %.1f calc %.1f' % x for x in malos))
DES_T = sum(dest_n.values())
DES_P = sum(p for p, _ in dest_p.values())
ok(DES_T <= ENTRANTES, u'los destinos listados no pasan del total de entrantes',
   u'%s de %s' % (miles(DES_T), miles(ENTRANTES)))
ok(DES_P <= PERDIDAS, u'ni sus perdidas pasan de las 486',
   u'%s de %s' % (miles(DES_P), miles(PERDIDAS)))
# EL CUBO DE CIERRE QUE EL GRÁFICO NO TRAE. El filtro («40+ llamadas, más
# Antolín») está declarado, pero no cuántas llamadas ni cuántas PERDIDAS quedan
# fuera — y el plan de acción pide «sacar del ruteo los destinos que no
# contestan». [[feedback-tablas-deben-cerrar]]
fueraT, fueraP = ENTRANTES - DES_T, PERDIDAS - DES_P
print(u'      los %d destinos dibujados cubren %s entrantes (%.1f%%) y %s perdidas (%.1f%%)'
      % (len(dest_n), miles(DES_T), DES_T / float(ENTRANTES) * 100,
         miles(DES_P), DES_P / float(PERDIDAS) * 100))
avisos.append(u'EL GRÁFICO DE DESTINOS NO TIENE CUBO DE CIERRE: dibuja %d destinos que suman '
              u'%s de las %s entrantes y %s de las %s perdidas, así que quedan FUERA %s '
              u'llamadas y %s perdidas (%.1f%% de la pérdida del año) repartidas entre los '
              u'destinos de menos de 40 llamadas y el menú. El documento declara el filtro '
              u'pero no lo que el filtro deja fuera, y la recomendación 3 pide «sacar del '
              u'ruteo los destinos que no contestan»: una quinta parte de la pérdida está en '
              u'destinos que nadie ve.'
              % (len(dest_n), miles(DES_T), miles(ENTRANTES), miles(DES_P), miles(PERDIDAS),
                 miles(fueraT), miles(fueraP), fueraP / float(PERDIDAS) * 100))

# Los destinos que el texto acusa tienen que estar en el gráfico con esas cifras.
ACUSADOS = {u'Antolin Salvador Morales Lemus': (29, 29),
            u'Andrea Salazar': (20, 41),
            u'Lic Raúl Natera Tovar': (30, 73),
            u'Jesus Davila': (16, 41),
            u'Oscar Godínez Herrera': (17, 46)}
for nom, (pp, tt) in ACUSADOS.items():
    if nom not in dest_n:
        fallos.append(u'«%s» se acusa en el texto y NO está en el gráfico' % nom)
        continue
    ok(dest_n[nom] == tt and dest_p[nom][0] == pp,
       u'%s: %s de %s sin contestar' % (nom.split()[0], pp, tt),
       u'gráfico: %s de %s' % (dest_p[nom][0], dest_n[nom]))
# El agente virtual, que es el único resultado bueno de la sección.
for nom in (u'AV Atención a clientes', u'Agente Virtual'):
    if nom in dest_p:
        print(u'      %-26s %s de %s sin contestar (%.1f%%)'
              % (nom, dest_p[nom][0], miles(dest_n[nom]), dest_p[nom][1]))
ok(u'Agente Virtual' in dest_p and dest_p[u'Agente Virtual'][0] == 0,
   u'«el agente virtual no pierde» es literal: 0 perdidas')

# La concentración de dos personas, que es la decisión 2.
mConc = re.findall(r'Verónica Pérez atendió ([\d.]+)% y María del Pilar Pérez ([\d.]+)%', texto)
mSuma = re.search(r'atendieron (\d+)% de las llamadas contestadas', texto)
if mConc and mSuma:
    suma = float(mConc[0][0]) + float(mConc[0][1])
    ok(abs(suma - int(mSuma.group(1))) < 0.6,
       u'el 58% de concentración es la suma de sus dos partes',
       u'%.1f + %.1f = %.1f' % (float(mConc[0][0]), float(mConc[0][1]), suma))

# El número de entrada peor atendido, contra los dos destinos a los que llega.
mNum = re.search(r'pierde 25% \((\d+) de (\d+)\)', texto)
if mNum:
    pn, tn = int(mNum.group(1)), int(mNum.group(2))
    ok(abs(pn / float(tn) * 100 - 25) < 0.6, u'el número de Querétaro pierde el 25% que dice',
       u'%s/%s = %.1f%%' % (pn, tn, pn / float(tn) * 100))
    dosT = dest_n.get(u'Ventas Qro 2', 0) + dest_n.get(u'Luis Fernando Barroso Combe', 0)
    dosP = dest_p.get(u'Ventas Qro 2', (0, 0))[0] + dest_p.get(u'Luis Fernando Barroso Combe', (0, 0))[0]
    ok(tn <= dosT and pn <= dosP,
       u'ese número cabe dentro de los dos destinos a los que llega',
       u'%s de %s llamadas · %s de %s perdidas' % (tn, dosT, pn, dosP))

# El menú sin transferencia.
mMenu = re.search(r'Menú sin transferencia:</b> ([\d,]+) llamadas \((\d+)%\)', texto)
if mMenu:
    mn = num(mMenu.group(1))
    ok(abs(mn / float(ENTRANTES) * 100 - int(mMenu.group(2))) < 0.6,
       u'las 850 del menú son el 16% de las entrantes',
       u'%s/%s = %.1f%%' % (miles(mn), miles(ENTRANTES), mn / float(ENTRANTES) * 100))

# ─── 7 · RECUPERACIÓN · LA TABLA QUE DECIDE LA REUNIÓN ─────────────────────
print(u'\n  --- 7 · RECUPERACIÓN DE PERDIDAS')
# Se busca DENTRO de su sección: el mismo patrón de fila lo cumple también la
# tabla de periodos de salientes, y mezclarlas daba ocho filas donde hay seis.
mSec = re.search(r'<h2>Recuperación de llamadas perdidas</h2>(.*?)</section>', texto, re.S)
ok(mSec is not None, u'se localiza la sección de recuperación')
secRec = mSec.group(1) if mSec else u''
rec = re.findall(r'<tr><td>(?:<b>)?([^<]+?)(?:</b>)?</td><td class="num">(?:<b>)?([\d,]+)'
                 r'(?:</b>)?</td><td class="num">(?:<b>)?([\d.]+)%(?:</b>)?</td></tr>', secRec)
R = dict((e.strip(), (num(v), float(p))) for e, v, p in rec)
print(u'      %d fila(s): %s' % (len(R), u' · '.join(u'%s %s' % (k, miles(v))
                                                     for k, (v, _) in R.items())))
ok(len(R) == 6, u'la tabla de recuperación trae sus seis filas', u'%d' % len(R))
for etq, (v, p) in R.items():
    if not cerca(p, v / float(PERDIDAS) * 100, 0.06):
        fallos.append(u'recuperación «%s»: %% publicado %.1f y calculado %.1f'
                      % (etq, p, v / float(PERDIDAS) * 100))
ok(not [f for f in fallos if f.startswith(u'recuperación')],
   u'cada % de la tabla se reconstruye sobre las 486')
REC = R[u'Recuperada por cualquiera de las dos vías'][0]
NUNCA = R[u'Nunca recuperada'][0]
ok(REC + NUNCA == PERDIDAS, u'recuperadas + nunca recuperadas = las 486',
   u'%s + %s = %s' % (REC, NUNCA, REC + NUNCA))
# EL SOLAPE QUE LA TABLA NO DECLARA: las dos vías suman más que el total de
# recuperadas, porque hay llamadas donde pasaron las dos cosas.
viaCliente = R[u'… y esta vez lo atendieron'][0]
viaCargo = R[u'… y conectó'][0]
dobles = viaCliente + viaCargo - REC
print(u'      las dos vías con éxito suman %s y la tabla declara %s recuperadas'
      % (viaCliente + viaCargo, REC))
ok(dobles >= 0, u'las dos vías no suman menos que el total recuperado')
if dobles:
    avisos.append(u'LA TABLA DE RECUPERACIÓN NO DECLARA SU SOLAPE: «el cliente volvió a marcar '
                  u'y lo atendieron» (%s) más «Cargo Lift le marcó y conectó» (%s) suman %s, y '
                  u'la fila de total dice %s recuperadas. La diferencia son %s llamadas donde '
                  u'pasaron LAS DOS COSAS. Un lector que sume las dos vías obtiene %s y cree '
                  u'que la tabla está mal: hay que decir que se solapan.'
                  % (viaCliente, viaCargo, viaCliente + viaCargo, REC, dobles,
                     viaCliente + viaCargo))
# Los primeros contactos que no volvieron: el dato que vuelve esto una venta perdida.
mPrim = re.search(r'(\d+) de ellas eran de números sin ninguna llamada previa', texto)
ok(mPrim is not None and int(mPrim.group(1)) <= NUNCA,
   u'los primeros contactos perdidos caben dentro de las nunca recuperadas',
   u'%s de %s' % (mPrim.group(1) if mPrim else u'—', NUNCA))
mDev = re.search(r'Cargo Lift devolvió (\d+) llamadas \(([\d.]+)%\)', texto)
ok(mDev is not None and cerca(float(mDev.group(2)),
                              int(mDev.group(1)) / float(PERDIDAS) * 100, 0.06),
   u'el 6.8% de devoluciones sale de 33 sobre 486',
   u'%s/%s = %.2f%%' % (mDev.group(1) if mDev else u'—', miles(PERDIDAS),
                        int(mDev.group(1)) / float(PERDIDAS) * 100 if mDev else 0))

# ─── 8 · SALIENTES ─────────────────────────────────────────────────────────
print(u'\n  --- 8 · SALIENTES')
mCon = re.search(r'De 1,000 llamadas externas conectó ([\d.]+)%', texto)
mNoCon = re.search(r'de las (\d+) salientes que no conectaron', texto)
ok(mCon is not None and mNoCon is not None,
   u'el documento declara conexión y no-conexión de salientes')
if mCon and mNoCon:
    pubCon = float(mCon.group(1))
    noCon = int(mNoCon.group(1))
    calcCon = (SALIENTES - noCon) / float(SALIENTES) * 100
    if not cerca(pubCon, calcCon, 0.06):
        avisos.append(u'CONTRADICCIÓN DE UNA LLAMADA EN LAS SALIENTES: el documento publica '
                      u'%.1f%% de conexión (y lo repite en la tabla de metas), pero también '
                      u'dice que %s de las %s no conectaron, lo que deja %s conectadas = '
                      u'%.1f%%. Son %s llamada(s) de diferencia. Probablemente una saliente '
                      u'sin tiempo de timbrado medido, pero el documento no lo dice y las dos '
                      u'cifras conviven en la misma página.'
                      % (pubCon, noCon, miles(SALIENTES), miles(SALIENTES - noCon), calcCon,
                         abs(int(round(SALIENTES * pubCon / 100)) - (SALIENTES - noCon))))
    print(u'      publicado %.1f%% · reconstruido %.1f%% (%s de %s)'
          % (pubCon, calcCon, miles(SALIENTES - noCon), miles(SALIENTES)))
    ok(abs(pubCon - calcCon) <= 0.2, u'la conexión publicada y la reconstruida no se separan',
       u'%.1f%% vs %.1f%%' % (pubCon, calcCon))
    # Los cortes de timbrado, que son el argumento de la recomendación 6.
    m30 = re.search(r'(\d+) se cortaron antes de 30 segundos y (\d+) antes de 10', texto)
    if m30:
        ok(int(m30.group(1)) <= noCon and int(m30.group(2)) <= int(m30.group(1)),
           u'los cortes de timbrado se anidan: <10 s ⊂ <30 s ⊂ no conectaron',
           u'%s ⊂ %s ⊂ %s' % (m30.group(2), m30.group(1), noCon))
mAlf = re.search(r'Alfredo Basurto hizo (\d+) de las 1,000 salientes \(([\d.]+)%\)', texto)
if mAlf:
    ok(cerca(float(mAlf.group(2)), int(mAlf.group(1)) / float(SALIENTES) * 100, 0.06),
       u'el 51.6% de Alfredo Basurto sale de 516 sobre 1,000',
       u'%s/%s = %.1f%%' % (mAlf.group(1), miles(SALIENTES),
                            int(mAlf.group(1)) / float(SALIENTES) * 100))
# La tabla de periodos no cubre noviembre, y eso se dice.
per = re.findall(r'<tr><td>(Enero–junio|Julio–octubre)</td><td class="num">(\d+)</td>'
                 r'<td class="num">([\d.]+)%</td></tr>', texto)
if len(per) == 2:
    cubre = int(per[0][1]) * 6 + int(per[1][1]) * 4
    print(u'      la tabla de periodos cubre ~%s salientes de %s: noviembre no entra'
          % (miles(cubre), miles(SALIENTES)))
    ok(cubre <= SALIENTES, u'los dos periodos no pasan del total de salientes',
       u'~%s de %s' % (miles(cubre), miles(SALIENTES)))
# El lunes vacío: el rango del texto tiene que poder dar 1,000.
mLunS = re.search(r'el lunes salen (\d+) llamadas contra (\d+)–(\d+) del resto', texto)
if mLunS:
    lo = int(mLunS.group(1)) + 4 * int(mLunS.group(2))
    hi = int(mLunS.group(1)) + 4 * int(mLunS.group(3))
    ok(lo <= SALIENTES <= hi, u'el reparto por día del texto puede dar las 1,000',
       u'%s ≤ %s ≤ %s' % (miles(lo), miles(SALIENTES), miles(hi)))

# ─── 9 · INTERNAS ──────────────────────────────────────────────────────────
print(u'\n  --- 9 · COMUNICACIÓN INTERNA')
mInt = re.search(r'(\d+) de (\d+) en el registro de salientes \((\d+)%\) y (\d+) de (\d+) '
                 r'en el de entrantes \((\d+)%\)', texto)
ok(mInt is not None, u'el documento declara las internas con sus dos fracciones')
if mInt:
    ps, ts, pcs, pe, te, pce = [int(x) for x in mInt.groups()]
    ok(ts == ALC['Salientes']['int'] and te == ALC['Entrantes']['int'],
       u'las internas del texto son las de la tabla de alcance',
       u'%s/%s vs %s/%s' % (ts, te, ALC['Salientes']['int'], ALC['Entrantes']['int']))
    ok(abs(ps / float(ts) * 100 - pcs) < 0.6 and abs(pe / float(te) * 100 - pce) < 0.6,
       u'los dos porcentajes de internas se reconstruyen',
       u'%.1f%% y %.1f%%' % (ps / float(ts) * 100, pe / float(te) * 100))
    unaDeTres = (ps + pe) / float(ts + te) * 100
    ok(28 <= unaDeTres <= 39, u'«una de cada tres» describe el conjunto de internas',
       u'%s/%s = %.1f%%' % (ps + pe, ts + te, unaDeTres))

# ─── 10 · LA TABLA DE METAS NO PUEDE INVENTAR UN «HOY» ─────────────────────
print(u'\n  --- 10 · INDICADORES Y METAS')
metas = re.findall(r'<tr><td>([^<]+)</td><td class="num">([^<]+)</td>'
                   r'<td class="num">([^<]+)</td></tr>', texto)
metas = [m for m in metas if u'%' in m[1] or u'devueltas' in m[1]]
print(u'      %d indicador(es) con su «hoy» declarado' % len(metas))
ok(len(metas) >= 6, u'los seis indicadores traen su línea base', u'%d' % len(metas))
# El «hoy» de las horas pico es de AGO–NOV, no del año, y la columna dice
# «Hoy (2026)». El propio documento publica 13.6% para las 15:00 del año.
if re.search(r'<td>Entrantes sin contestar a las 15:00 y a las 17:00</td>', texto):
    avisos.append(u'LA TABLA DE METAS NO DICE DE QUÉ PERIODO ES SU «HOY»: la fila de las 15:00 '
                  u'y las 17:00 pone «12.9% y 12.3%», que son las cifras de agosto–noviembre '
                  u'(así lo declara la recomendación 4), mientras el cuerpo del reporte dice '
                  u'que las 15:00 pierden 13.6% en el año. La columna se titula «Hoy (2026)». '
                  u'Dos cifras distintas para la misma hora, sin que la tabla diga cuál '
                  u'periodo mide. [[feedback-contexto-ia-sin-huecos]]')

# ─── 11 · CONTRA LAS FUENTES DE LA CASA ────────────────────────────────────
print(u'\n  --- 11 · CONTRA LAS FUENTES DE LA CASA')
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
filasG = [f for f in G['filas'] if str(f.get('cid') or '') == CID]
ok(len(filasG) > 0, u'Cargo Lift (cid %s) aparece en el GRC' % CID, u'%d fila(s)' % len(filasG))
MRR_PRINCIPAL = MRR_CID = 0.0
for f in filasG:
    print(u'      GRC: %-18s banda %-3s MRR %-10s %s meses · %s%s'
          % (f.get('cliente'), f.get('clasif'), miles(float(f.get('mrrFin') or 0)),
             f.get('meses'), f.get('movimiento'),
             u'  [agrupada]' if f.get('agrupada') else u''))
    MRR_CID += float(f.get('mrrFin') or 0)
    if not f.get('agrupada'):
        MRR_PRINCIPAL = float(f.get('mrrFin') or 0)
print(u'      MRR del CID: $%s (fila principal $%s + agrupadas $%s)'
      % (miles(MRR_CID), miles(MRR_PRINCIPAL), miles(MRR_CID - MRR_PRINCIPAL)))
# EL REPORTE NO CITA MRR, y eso está bien: no es su tema. Lo que NO puede pasar
# es que cite uno distinto al del GRC.
citado = re.search(r'MRR \$?([\d,]+)', texto)
if citado:
    ok(num(citado.group(1)) in (int(MRR_PRINCIPAL), int(MRR_CID)),
       u'si el documento cita MRR, es el del GRC',
       u'documento $%s vs GRC $%s / $%s'
       % (citado.group(1), miles(MRR_PRINCIPAL), miles(MRR_CID)))
else:
    print(u'      el documento no cita MRR: nada que contrastar ahí '
          u'(el expediente sí lo lleva, y sale del GRC)')
if re.search(r'\bClaudia\b', texto):
    fallos.append(u'el documento nombra a «Claudia», que ya no es asesora de cartera')

# `cuentas` y las alertas: se leen por REST porque `lib/supabase` crea el
# cliente al importar y revienta fuera de Next. Credenciales de `.env.local`,
# dentro del guion, sin imprimir.
env = {}
pEnv = os.path.join(RAIZ, '.env.local')
if os.path.exists(pEnv):
    for ln in io.open(pEnv, encoding='utf-8'):
        if '=' in ln and not ln.strip().startswith('#'):
            k, v = ln.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
base = env.get('NEXT_PUBLIC_SUPABASE_URL')
key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')


def rest(ruta):
    import urllib.request
    req = urllib.request.Request(u'%s/rest/v1/%s' % (base.rstrip('/'), ruta),
                                 headers={'apikey': key, 'Authorization': 'Bearer %s' % key})
    return json.loads(urllib.request.urlopen(req, timeout=25).read().decode('utf-8'))


cuenta, alertas = None, None
if base and key:
    try:
        cuenta = (rest(u'cuentas?select=empresa,consecutivo,asesor,health_score,estado,'
                       u'facturacion,activo_desde&cid=eq.%s' % CID) or [None])[0]
        alertas = rest(u'alertas_episodios?select=condicion,tipo,estado,severidad_actual,'
                       u'abierto_en,evidencia_actual&consecutivo=eq.D5')
    except Exception as e:                                    # noqa: BLE001
        print(u'      *** NO SE PUDO LEER SUPABASE: %s' % e)
        avisos.append(u'NO se pudo leer `cuentas` ni `alertas_episodios`: el Health Score y las '
                      u'alertas abiertas quedan SIN comprobar. Eso no es «coinciden»: es que no '
                      u'se midieron. [[feedback-verificar-antes-asegurar]]')
if cuenta:
    print(u'      cuentas: %s %s · asesor %s · Health Score %s · estado %s · facturacion %s'
          % (cuenta.get('consecutivo'), cuenta.get('empresa'), cuenta.get('asesor'),
             cuenta.get('health_score'), cuenta.get('estado'),
             miles(float(cuenta.get('facturacion') or 0))))
    # `cuentas.facturacion` NO es el MRR institucional, y la diferencia aquí es
    # de miles de pesos. Si alguien la copia al expediente, el reporte habla de
    # una cuenta más pequeña de lo que es. [[grc-fuente-zoho]]
    fact = float(cuenta.get('facturacion') or 0)
    if abs(fact - MRR_PRINCIPAL) > 1:
        print(u'      OJO: `cuentas.facturacion` = $%s y el GRC = $%s. La del expediente '
              u'es la del GRC.' % (miles(fact), miles(MRR_PRINCIPAL)))
    citHS = re.search(r'Health Score (\d+)', texto)
    if citHS:
        ok(int(citHS.group(1)) == int(cuenta.get('health_score') or -1),
           u'el Health Score del documento es el de `cuentas`',
           u'documento %s vs cuentas %s' % (citHS.group(1), cuenta.get('health_score')))
    else:
        print(u'      el documento no cita Health Score: el expediente lo toma de `cuentas` (%s)'
              % cuenta.get('health_score'))
if alertas is not None:
    abiertas = [a for a in alertas if a.get('estado') == 'abierta']
    print(u'      alertas_episodios: %d en total · %d ABIERTA(S)' % (len(alertas), len(abiertas)))
    for a in alertas:
        print(u'        %-13s %-20s %-8s %-8s desde %s'
              % (a.get('condicion'), a.get('tipo'), a.get('estado'),
                 a.get('severidad_actual'), a.get('abierto_en')))
    ok(len(alertas) > 0, u'la cuenta tiene episodios de alerta registrados')
    # LO QUE EL REPORTE NO MIRA. No es un error del reporte —su tema es el
    # tráfico telefónico—, pero el expediente lo leen Atlas y el asesor, y una
    # alerta crítica abierta no puede quedarse fuera de él. [[alertas-cliente]]
    criticas = [a for a in abiertas if a.get('severidad_actual') == 'critica']
    if criticas:
        avisos.append(u'EL REPORTE NO MENCIONA LA ALERTA MÁS GRAVE DE LA CUENTA: hay %d alerta(s) '
                      u'CRÍTICA(S) ABIERTA(S) (%s) que el documento no toca. El expediente sí '
                      u'tiene que llevarlas: el asesor entra a hablar de llamadas perdidas '
                      u'mientras la cuenta lleva meses bajando de plan.'
                      % (len(criticas), u', '.join(a.get('tipo') or u'?' for a in criticas)))

# Los DIDs: el texto dice «seis números dejaron de recibir llamadas» además del
# principal. Nuestra fuente tiene que poder sostener ese conteo.
try:
    DD = json.load(io.open(os.path.join(RAIZ, 'data', 'dids.json'), encoding='utf-8'))
    dids = DD.get('porCid', {}).get(CID) or []
    mSeis = re.search(r'(\w+) números dejaron de recibir llamadas', texto)
    print(u'      dids.json: %d número(s) para el CID' % len(dids))
    if mSeis and dids:
        ok(len(dids) >= 7, u'la fuente de DIDs sostiene «el principal + seis en desuso»',
           u'%d número(s) en dids.json' % len(dids))
except Exception as e:                                        # noqa: BLE001
    print(u'      *** no se pudo leer dids.json: %s' % e)
    avisos.append(u'NO se pudo leer `dids.json`: el conteo de números del documento queda sin '
                  u'contrastar.')

# ─── 12 · LAS MARCAS DE LA CONCILIACIÓN ────────────────────────────────────
marcados = re.findall(r'<!--\s*CONCILIACION:MARCADOS\s+([^>]+?)\s*-->', html)
claves = [k.strip() for g in marcados for k in g.split(',') if k.strip()]
print(u'\n  --- 12 · DESFASES DECLARADOS DENTRO DEL DOCUMENTO')
print(u'      %s' % (u', '.join(claves) if claves else u'ninguno'))
# BORRAR LAS NOTAS TIENE QUE PONER ESTO EN ROJO. Son las correcciones y los
# límites que el lector ve; si alguien las quita, el documento vuelve a afirmar
# lo que no puede sostener y el guion seguiría en verde porque las cifras
# siguen cuadrando entre sí. [[auditoria-modulo]] [[feedback-probar-al-reves]]
ok(len(notas) >= 3, u'las notas de conciliación siguen DENTRO del documento',
   u'%d bloque(s) NOTA' % len(notas))
ok(len(claves) >= 5, u'los desfases que no cierran siguen DECLARADOS por clave',
   u'%d clave(s)' % len(claves))

print(u'\n  ' + u'=' * 72)
if avisos:
    print(u'  %d AVISO(S) — hay que dejarlos escritos DENTRO del documento:' % len(avisos))
    for i, a in enumerate(avisos, 1):
        print(u'    %d) %s' % (i, a))
print(u'')
if fallos:
    print(u'  *** %d COMPROBACIÓN(ES) NO CIERRAN:' % len(fallos))
    for f in fallos:
        print(u'      - %s' % f)
    sys.exit(1)
print(u'  TODO LO RECALCULABLE CIERRA.')
sys.exit(0)
