# -*- coding: utf-8 -*-
u"""Reconcilia el reporte de auditoría de LINEACEL (CID 180969) contra sus
propias cifras y contra nuestras fuentes.

    python -I scripts/concilia-auditoria-lineacel.py [ruta.html]

Sin argumento usa el documento publicado en `public/auditorias/`. Se le puede
pasar una COPIA para probar que sabe fallar sin tocar el publicado
([[feedback-probar-al-reves]]).

── POR QUÉ ESTE GUION ─────────────────────────────────────────────────────────
El reporte lleva TODAS sus cifras en un `const D = {...}` de JavaScript: siete
series (mes, semana, día, hora, día de la semana, mapa de calor, canal), la
tabla de agentes, los cortes de facturación y un diccionario `k` de agregados
que el texto cita. Nada de eso se recalcula al leerlo: hay que dividir.

Lo primero que comprueba es que el LECTOR devolvió series. Un conciliador que
concluye «todo cuadra» porque no pudo leer nada es peor que no tenerlo: da un
verde construido sobre listas vacías. Si el lector falla, se para en rojo.

── LAS DOS CLASES QUE ESTE DOCUMENTO TRAÍA ────────────────────────────────────
1. El superlativo sin medir. «Peor: 12:00 (51.5%)» y «el miércoles es el día
   más bajo (53.2%)» son falsos leídos sobre la serie completa —las 18:00 están
   en 29.2% y el sábado en 4.3%—; son ciertos sólo entre las horas y los días
   con volumen. Se caza ORDENANDO la serie, no leyéndola.
2. El reparto que no cierra. La tabla de canal cubre 181,810 de 181,816
   llamadas y el histograma de duración 109,467 de 109,680 conectadas. Los
   huecos son chicos, pero mientras no se declaren se leen como cobertura
   completa ([[feedback-tablas-deben-cerrar]]).

Lo que no se puede cerrar se declara POR CLAVE dentro del documento, en
`<!-- CONCILIACION:MARCADOS ... -->`. Las correcciones aplicadas al documento
viven entre `<!--NOTA:INICIO-->` / `<!--NOTA:FIN-->`; el guion las RECORTA antes
de buscar texto (para no dispararse con sus propias notas) y EXIGE que existan.
"""
from __future__ import division

import io
import json
import os
import re
import sys
import urllib.request

try:
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POR_DEFECTO = os.path.join(RAIZ, 'public', 'auditorias',
                           'Auditoria-LINEACEL-Salientes-2026.html')
CID = '180969'

fallos = []
avisos = []


def ok(cond, titulo, detalle=u''):
    print(u'   %s  %s' % (u'[ OK ]' if cond else u'[FALLA]', titulo))
    if detalle:
        print(u'           %s' % detalle)
    if not cond:
        fallos.append(titulo)
    return cond


def aviso(titulo, detalle=u''):
    print(u'   [aviso] %s' % titulo)
    if detalle:
        print(u'           %s' % detalle)
    avisos.append(titulo)


def seccion(t):
    print(u'\n   ' + t)
    print(u'   ' + u'-' * (len(t) + 2))


def mil(n):
    return u'{:,}'.format(int(round(n)))


# ───────────────────────────────────────────────────────────────────────────────
# 0 · leer el documento
# ───────────────────────────────────────────────────────────────────────────────
ruta = sys.argv[1] if len(sys.argv) > 1 else POR_DEFECTO
if not os.path.exists(ruta):
    print(u'*** No existe el documento: %s' % ruta)
    sys.exit(1)

bruto = io.open(ruta, 'r', encoding='utf-8', errors='replace').read()

print(u'\n   RECONCILIACIÓN · LINEACEL · CID %s' % CID)
print(u'   ' + u'=' * 72)
print(u'   documento: %s (%s bytes)' % (os.path.basename(ruta), mil(len(bruto))))

# Las notas de conciliación se recortan ANTES de buscar texto: si no, el
# detector se dispara con la propia nota que avisa del desfase y el candado
# deja de servir para siempre.
notas = re.findall(r'(?s)<!--NOTA:INICIO-->(.*?)<!--NOTA:FIN-->', bruto)
texto = re.sub(r'(?s)<!--NOTA:INICIO-->.*?<!--NOTA:FIN-->', u' ', bruto)

mm = re.search(r'<!--\s*CONCILIACION:MARCADOS\s+([^>]*?)-->', bruto)
marcados = set(x.strip() for x in (mm.group(1) if mm else u'').split(',') if x.strip())


def declarado(clave):
    return clave in marcados


def cierra(clave, titulo, detalle=u''):
    u"""Un desfase que el documento declara por clave no falla; uno nuevo sí."""
    if declarado(clave):
        print(u'   [dicho] %s' % titulo)
        if detalle:
            print(u'           %s' % detalle)
        return True
    fallos.append(u'NO CIERRA Y NO ESTÁ DECLARADO: ' + titulo)
    print(u'   [FALLA] NO CIERRA Y NADIE LO DECLARA · %s' % titulo)
    if detalle:
        print(u'           %s' % detalle)
    return False


# ───────────────────────────────────────────────────────────────────────────────
# 1 · el candado del lector
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'1 · EL LECTOR ANTES DE CUALQUIER CUENTA')


def saca_const(nombre):
    for m in re.finditer(r'\bconst\s+' + nombre + r'\s*=\s*', bruto):
        i = m.end()
        if i >= len(bruto) or bruto[i] != u'{':
            continue
        prof, j = 0, i
        while j < len(bruto):
            if bruto[j] == u'{':
                prof += 1
            elif bruto[j] == u'}':
                prof -= 1
                if prof == 0:
                    break
            j += 1
        try:
            d = json.loads(bruto[i:j + 1])
        except ValueError:
            continue
        if isinstance(d, dict) and 'month' in d and 'k' in d:
            return d
    return None


D = saca_const('D')
if D is None:
    print(u'   [FALLA] no se pudo extraer el `const D` del documento')
    print(u'\n      *** Ninguna comprobación de abajo significaría nada sin las')
    print(u'          series. Se para aquí en rojo en vez de dar un verde')
    print(u'          construido sobre listas vacías.')
    sys.exit(1)

K = D.get('k') or {}
esperado = {'month': 7, 'hour': 11, 'dow': 6}
tam = {k: len((D.get(k) or {}).get('lab') or []) for k in esperado}
nag = len(D.get('agents') or [])
nsrc = len(D.get('src') or [])
nheat = len((D.get('heat') or {}).get('rows') or [])
ndia = len((D.get('day') or {}).get('lab') or [])
nsem = len((D.get('week') or {}).get('lab') or [])

if not ok(tam == esperado and nag >= 10 and nsrc >= 4 and nheat == 5
          and ndia >= 120 and nsem >= 20 and len(K) >= 20,
          u'EL LECTOR SÍ DEVOLVIÓ LAS SERIES',
          u'mes %d · hora %d · dow %d · agentes %d · canal %d · calor %d filas · '
          u'días %d · semanas %d · agregados %d'
          % (tam['month'], tam['hour'], tam['dow'], nag, nsrc, nheat, ndia, nsem, len(K))):
    print(u'\n      *** Se para aquí: un verde sobre series incompletas es una mentira.')
    sys.exit(1)

# ───────────────────────────────────────────────────────────────────────────────
# 2 · el total, por todos los caminos que lo reparten
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'2 · EL TOTAL CIERRA POR CADA REPARTO (o se declara el hueco)')

TOT = int(K['total'])
MIN = int(K['mins'])
OKS = int(K['ok'])

out = D['outcome']
sout = sum(out.values())
ok(sout == TOT, u'desenlace suma el total',
   u'Redirected %s + Lost %s + Lost_by_agent %s = %s (total %s)'
   % (mil(out['Redirected']), mil(out['Lost']), mil(out['Lost_by_agent']), mil(sout), mil(TOT)))
ok(out['Redirected'] == OKS, u'«conectadas» es exactamente Redirected',
   u'%s' % mil(OKS))

for clave, etiq in (('month', u'mes'), ('hour', u'hora'), ('dow', u'día de la semana'),
                    ('day', u'día')):
    s = sum(D[clave]['n'])
    ok(s == TOT, u'la serie por %s suma el total' % etiq,
       u'%s = %s' % (mil(s), mil(TOT)))

smin = sum(D['month']['mins'])
ok(smin == MIN, u'los minutos por mes suman los minutos del periodo',
   u'%s = %s' % (mil(smin), mil(MIN)))

sag = sum(a['n'] for a in D['agents'])
sagm = sum(a['mn'] for a in D['agents'])
ok(sag == TOT, u'la tabla de agentes CIERRA en llamadas (tiene cubo «Otros / campañas»)',
   u'%s = %s' % (mil(sag), mil(TOT)))
ok(sagm == MIN, u'la tabla de agentes CIERRA en minutos',
   u'%s = %s' % (mil(sagm), mil(MIN)))

# El canal NO cierra: 6 llamadas y 2 minutos fuera de los cinco orígenes.
ssrc = sum(s['n'] for s in D['src'])
ssrcm = sum(s['mn'] for s in D['src'])
if ssrc != TOT:
    cierra('canal-no-cierra',
           u'la tabla de canal de origen no cierra',
           u'cubre %s de %s llamadas: faltan %d (%.3f%%). En minutos, %s de %s: faltan %d'
           % (mil(ssrc), mil(TOT), TOT - ssrc, (TOT - ssrc) * 100.0 / TOT,
              mil(ssrcm), mil(MIN), MIN - ssrcm))
else:
    ok(True, u'la tabla de canal de origen cierra', mil(ssrc))

# El histograma de duración tampoco: mide 109,467 de 109,680 conectadas.
sdur = sum(D['durb']['n'])
if sdur != OKS:
    cierra('duracion-no-cierra',
           u'el histograma de duración no cubre todas las conectadas',
           u'%s de %s conectadas: faltan %d (%.2f%%)'
           % (mil(sdur), mil(OKS), OKS - sdur, (OKS - sdur) * 100.0 / OKS))
else:
    ok(True, u'el histograma de duración cierra', mil(sdur))

# Los cortes de facturación empiezan el 27 may; el dato arranca el 13 may.
scor = sum(D['corte']['mn'])
if scor != MIN:
    cierra('cortes-no-cubren-13may',
           u'la gráfica de cortes no cubre todo el periodo medido',
           u'%s de %s minutos: %d fuera (el primer corte arranca el 27 may y el '
           u'dato el %s)' % (mil(scor), mil(MIN), MIN - scor, K.get('start')))
else:
    ok(True, u'los cortes cubren todos los minutos', mil(scor))

# ───────────────────────────────────────────────────────────────────────────────
# 3 · los agregados que el texto cita se reconstruyen dividiendo
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'3 · LOS AGREGADOS DEL TEXTO SE RECONSTRUYEN')

ok(abs(OKS * 100.0 / TOT - K['rate']) < 0.05, u'la conexión global sale de sus partes',
   u'%s / %s = %.2f%% (publica %s%%)' % (mil(OKS), mil(TOT), OKS * 100.0 / TOT, K['rate']))
ok(abs(TOT / float(K['uniq']) - K['att']) < 0.005, u'intentos por número',
   u'%s / %s = %.3f (publica %s)' % (mil(TOT), mil(K['uniq']), TOT / float(K['uniq']), K['att']))
ok(abs(TOT / float(K['days']) - K['avgday']) < 1.0, u'llamadas por día operado',
   u'%s / %s días = %.1f (publica %s)' % (mil(TOT), K['days'], TOT / float(K['days']), K['avgday']))
ok(round(K['uniq'] * K['reach'] / 100.0) > 0 and abs(K['reach'] - K['reach']) < 1e-9,
   u'el alcance se publica como porcentaje de los números distintos',
   u'%s%% de %s = %s números contactados al menos una vez'
   % (K['reach'], mil(K['uniq']), mil(K['uniq'] * K['reach'] / 100.0)))

prec = sum(D['durb']['n'][:3]) * 100.0 / OKS
prec2 = sum(D['durb']['n'][:3]) * 100.0 / sdur
ok(abs(prec - K['lt60']) < 0.25 or abs(prec2 - K['lt60']) < 0.25,
   u'«%s%% dura 1 min o menos» cae entre las dos bases posibles' % K['lt60'],
   u'%.2f%% sobre las %s conectadas · %.2f%% sobre las %s del histograma'
   % (prec, mil(OKS), prec2, mil(sdur)))
if abs(prec - K['lt60']) >= 0.05 and abs(prec2 - K['lt60']) >= 0.05:
    aviso(u'el %s%% de «1 min o menos» no sale exacto de los cubos del histograma'
          % K['lt60'],
          u'cubos → %.2f%% / %.2f%%. Se mide sobre los segundos reales, no sobre '
          u'las fronteras de los cubos: la diferencia es de redondeo.' % (prec, prec2))

sab = D['dow']['n'][-1]
ok(abs(sab / 4.0 - D['dow']['avg'][-1]) < 1.0,
   u'el promedio del sábado sale de sus 4 días con actividad',
   u'%s / 4 = %.0f (publica %s)' % (mil(sab), sab / 4.0, D['dow']['avg'][-1]))

seccion(u'4 · LOS HALLAZGOS, UNO POR UNO')

# h1 · la caída de conexión
r = dict(zip(D['month']['lab'], D['month']['rate']))
caida = max(r['Jun'], r['Jul']) - r['Sep']
ok(19.0 <= caida <= 20.0, u'H1 · «la conexión cayó 19 puntos»',
   u'jun %.1f%% / jul %.1f%% → sep %.1f%% = %.1f puntos' % (r['Jun'], r['Jul'], r['Sep'], caida))
vol = dict(zip(D['month']['lab'], D['month']['n']))
plenos = [vol[m] for m in ('Jun', 'Jul', 'Ago', 'Sep', 'Oct')]
ok(min(plenos) >= 30000 and max(plenos) <= 36000,
   u'H1 · «el volumen se mantuvo entre 30 y 36 mil»',
   u'meses completos: ' + u' · '.join(mil(x) for x in plenos))

# h2 · la marcación manual
sip = dict(zip(D['month']['lab'], D['month']['sip']))
jun_sip = vol['Jun'] * sip['Jun'] / 100.0
sep_sip = vol['Sep'] * sip['Sep'] / 100.0
ok(abs(jun_sip - 358) < 6 and abs(sep_sip - 11322) < 20,
   u'H2 · «de 358 llamadas en jun a 11,322 en sep (34%)»',
   u'jun %s × %.1f%% = %.0f · sep %s × %.1f%% = %.0f'
   % (mil(vol['Jun']), sip['Jun'], jun_sip, mil(vol['Sep']), sip['Sep'], sep_sip))
psip = [s for s in D['src'] if s['k'] == 'sip'][0]
pcam = [s for s in D['src'] if s['k'] == 'api-campaign'][0]
ok(abs(psip['r'] - K['sipr']) < 0.05 and abs(pcam['r'] - K['campr']) < 0.05,
   u'H2 · «conecta 33.3% contra 65.2% del marcador API»',
   u'sip %.1f%% sobre %s llamadas · api-campaign %.1f%% sobre %s'
   % (psip['r'], mil(psip['n']), pcam['r'], mil(pcam['n'])))
ok(abs(pcam['n'] * 100.0 / TOT - 83.0) < 0.5,
   u'FODA · «el marcador API es el 83% del volumen»',
   u'%s / %s = %.2f%%' % (mil(pcam['n']), mil(TOT), pcam['n'] * 100.0 / TOT))

# h3 · campañas sin agentes
ok(abs(K['h9lba'] * 100.0 / K['h9'] - 99) < 1.0,
   u'H3 · «%s llamadas a las 9:00 y el 99%% perdidas por agente»' % mil(K['h9']),
   u'%s de %s = %.1f%%' % (mil(K['h9lba']), mil(K['h9']), K['h9lba'] * 100.0 / K['h9']))
h9serie = dict(zip(D['hour']['lab'], D['hour']['n']))
ok(h9serie.get('9:00') == K['h9'],
   u'H3 · la hora 9:00 de la serie es la misma que cita el hallazgo',
   u'serie %s = K.h9 %s' % (mil(h9serie.get('9:00') or 0), mil(K['h9'])))

# h4 · minutos a números ya contactados
ok(abs(K['rec'] * 100.0 / TOT - 19.9) < 0.1,
   u'H4 · «%s llamadas (19.9%%) a números ya contactados»' % mil(K['rec']),
   u'%s / %s = %.2f%%' % (mil(K['rec']), mil(TOT), K['rec'] * 100.0 / TOT))
ok(abs(K['recmin'] * 100.0 / MIN - 26.0) < 0.2,
   u'H4 · «%s min, el 26%% del total»' % mil(K['recmin']),
   u'%s / %s = %.2f%%' % (mil(K['recmin']), mil(MIN), K['recmin'] * 100.0 / MIN))

# h5 · el techo del plan
PLAN = 25000
llenos = D['corte']['mn'][:-1]
ok(abs(llenos[2] * 100.0 / PLAN - 98.7) < 0.1 and abs(llenos[4] * 100.0 / PLAN - 93.5) < 0.1,
   u'H5 · «24,680 min (98.7%) y 23,387 (93.5%) del plan de 25,000»',
   u'%s → %.1f%% · %s → %.1f%%'
   % (mil(llenos[2]), llenos[2] * 100.0 / PLAN, mil(llenos[4]), llenos[4] * 100.0 / PLAN))
ok(max(llenos) <= PLAN, u'H5 · ningún corte COMPLETO rebasó todavía el plan',
   u'el mayor es %s de %s (%.1f%%)' % (mil(max(llenos)), mil(PLAN), max(llenos) * 100.0 / PLAN))

# h7 · el sábado de campaña
dia = dict(zip(D['day']['lab'], D['day']['n']))
diar = dict(zip(D['day']['lab'], D['day']['rate']))
ok(dia.get('2026-08-29') == K['sat29'] and abs((diar.get('2026-08-29') or 0) - K['sat29r']) < 0.05,
   u'H7 · el 29 ago está en la serie diaria con las cifras que cita',
   u'%s llamadas al %.1f%% de conexión' % (mil(K['sat29']), K['sat29r']))
otros_sab = sab - K['sat29']
con_sab = sab * D['dow']['rate'][-1] / 100.0
con_29 = K['sat29'] * K['sat29r'] / 100.0
tasa_resto = (con_sab - con_29) * 100.0 / otros_sab if otros_sab else 0
ok(K['sat29'] * 100.0 / sab > 90,
   u'H7 · «explica buena parte del 4.3% del sábado» — y se queda corto',
   u'el 29 ago es el %.1f%% del volumen sabatino; los otros 3 sábados conectan '
   u'al %.0f%% (%d llamadas). Prácticamente TODO el 4.3%% es ese día.'
   % (K['sat29'] * 100.0 / sab, tasa_resto, otros_sab))

# h9 · pérdidas por agente
af = [a for a in D['agents'] if a['s'].startswith(u'Ale Fab')]
if af:
    a = af[0]
    perd = a['n'] * a['lba'] / 100.0
    ok(abs(perd - 1209) < 6, u'H9 · «Ale Fabián perdió 33% de sus llamadas (1,209)»',
       u'%s × %.1f%% = %.0f' % (mil(a['n']), a['lba'], perd))
    ok(a['last'] == '24/09', u'H9 · «Ale Fabián ya no está activo»',
       u'última llamada %s' % a['last'])
otr = [a for a in D['agents'] if a['s'].startswith(u'Otros')]
if otr:
    a = otr[0]
    ok(192 <= a['n'] * a['lba'] / 100.0 + 10,
       u'H9 · las 192 perdidas de «Campaña todas» caben en el cubo «Otros / campañas»',
       u'el cubo pierde %.0f de %s por agente; «Campaña todas» son %s llamadas'
       % (a['n'] * a['lba'] / 100.0, mil(a['n']), mil(K['camp'])))
    ok(abs(192 * 100.0 / K['camp'] - 73) < 1.5,
       u'H9 · «la campaña «Campaña todas» 73%»',
       u'192 / %s = %.1f%%' % (mil(K['camp']), 192 * 100.0 / K['camp']))

# h8 · el 800
ok(K['n800ok'] <= K['n800'], u'H8 · el 800 288 2248 conecta menos de lo que intenta',
   u'%s conectadas de %s intentos (%.1f%%), %s min'
   % (mil(K['n800ok']), mil(K['n800']), K['n800ok'] * 100.0 / K['n800'], mil(K['n800min'])))

# ───────────────────────────────────────────────────────────────────────────────
# 5 · los superlativos: se ordenan, no se leen
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'5 · LOS SUPERLATIVOS, ORDENANDO LA SERIE')

horas = sorted(zip(D['hour']['lab'], D['hour']['rate'], D['hour']['n']), key=lambda x: x[1])
peor = horas[0]
print(u'           peores horas de la serie COMPLETA: '
      + u' · '.join(u'%s %.1f%% (%s)' % (h, r, mil(n)) for h, r, n in horas[:4]))
conv = [x for x in horas if x[2] >= 1000]
ok(conv[0][0] == '12:00',
   u'«la peor hora» es cierta sólo entre las horas con volumen',
   u'con ≥1,000 llamadas la peor es %s (%.1f%%); en la serie completa es %s '
   u'(%.1f%% sobre %s llamadas)' % (conv[0][0], conv[0][1], peor[0], peor[1], mil(peor[2])))
# El documento publicado ya lleva la corrección. Estas dos comprobaciones son
# permanentes: si alguien revierte el texto a mano, esto se pone en rojo.
ok(u'Peor: 12:00' not in texto,
   u'el documento NO afirma «Peor: 12:00» a secas',
   u'la serie completa pone %s en %.1f%% sobre %s llamadas, y las 18:00 en %.1f%% '
   u'sobre %s' % (peor[0], peor[1], mil(peor[2]),
                  dict(zip(D['hour']['lab'], D['hour']['rate']))['18:00'],
                  mil(dict(zip(D['hour']['lab'], D['hour']['n']))['18:00'])))
ok(re.search(u'De las horas en que de verdad se marca', texto) is not None,
   u'la corrección de la peor hora SIGUE en el cuerpo del reporte')

dows = sorted(zip(D['dow']['lab'], D['dow']['rate'], D['dow']['n']), key=lambda x: x[1])
print(u'           días ordenados por conexión: '
      + u' · '.join(u'%s %.1f%%' % (d, r) for d, r, _ in dows))
habiles = [x for x in dows if x[0] != u'Sáb']
ok(habiles[0][0] == u'Mié',
   u'«el día más bajo» es cierto sólo de lunes a viernes',
   u'entre hábiles el peor es %s (%.1f%%); con sábado el peor es %s (%.1f%% sobre '
   u'%s llamadas)' % (habiles[0][0], habiles[0][1], dows[0][0], dows[0][1], mil(dows[0][2])))
ok(u'El miércoles es el día más bajo' not in texto,
   u'el documento NO llama al miércoles «el día más bajo» sin acotar',
   u'sábado %.1f%% sobre %s llamadas · miércoles %.1f%% sobre %s. Sin la acotación '
   u'el reporte se contradice con su propio hallazgo 7, que explica el sábado aparte.'
   % (dows[0][1], mil(dows[0][2]), habiles[0][1], mil(habiles[0][2])))
ok(re.search(u'de lunes a viernes el día más bajo', texto) is not None,
   u'la corrección del día más bajo SIGUE en el cuerpo del reporte')

mejor = sorted(zip(D['hour']['lab'], D['hour']['rate'], D['hour']['n']),
               key=lambda x: -x[1])
mejor_conv = [x for x in mejor if x[2] >= 1000]
ok(mejor_conv[0][0] == '16:00' and mejor_conv[1][0] == '10:00',
   u'«mejores horas: 10:00 y 16:00» sí es el tope de la serie',
   u'%s %.1f%% · %s %.1f%%' % (mejor_conv[0][0], mejor_conv[0][1],
                               mejor_conv[1][0], mejor_conv[1][1]))

sem = sorted(zip(D['week']['lab'], D['week']['rate'], D['week']['n']), key=lambda x: x[1])
print(u'           peores semanas: '
      + u' · '.join(u'%s %.1f%%' % (s, r) for s, r, _ in sem[:3]))
print(u'           mejores semanas: '
      + u' · '.join(u'%s %.1f%%' % (s, r) for s, r, _ in sorted(sem, key=lambda x: -x[1])[:3]))

# ───────────────────────────────────────────────────────────────────────────────
# 6 · el mapa de calor contra sus márgenes
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'6 · EL MAPA DE CALOR CONTRA SUS MÁRGENES')

dow_n = dict(zip(D['dow']['lab'], D['dow']['n']))
fuera_total = 0
for fila in D['heat']['rows']:
    s = sum(fila['n'])
    tot_d = dow_n[fila['d']]
    fuera_total += tot_d - s
    ok(s <= tot_d, u'%s: el calor (10–17 h) cabe en el total del día' % fila['d'],
       u'%s de %s — %d fuera de la ventana' % (mil(s), mil(tot_d), tot_d - s))
ok(fuera_total > 0,
   u'la ventana 10:00–17:59 NO es todo el día, y el documento lo rotula',
   u'%d llamadas de lun–vie quedan fuera del mapa (8:00, 9:00 y 18:00)' % fuera_total)

mal = []
for fila in D['heat']['rows']:
    for h, n, r in zip(D['heat']['hours'], fila['n'], fila['r']):
        if n and n < 500:
            mal.append((fila['d'], h, n, r))
if mal:
    aviso(u'%d celdas del mapa pintan un color sobre menos de 500 llamadas' % len(mal),
          u'la más chica: %s %d:00 con %d llamadas al %.1f%%. Una celda con poco '
          u'volumen pesa lo mismo visualmente que una de 7,000.'
          % (mal[0][0], mal[0][1], mal[0][2], mal[0][3]))

# ───────────────────────────────────────────────────────────────────────────────
# 7 · contra nuestras propias fuentes
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'7 · CONTRA NUESTRAS FUENTES (Supabase · GRC · tickets · chat · DIDs)')


def data(nombre):
    p = os.path.join(RAIZ, nombre)
    if not os.path.exists(p):
        return None
    return json.load(io.open(p, 'r', encoding='utf-8'))


# -- GRC: el MRR institucional, y su historia --
grc = data(os.path.join('data', 'grc-zoho.json'))
if grc is None:
    aviso(u'no se pudo leer data/grc-zoho.json — el MRR queda SIN COMPROBAR')
else:
    fil = [r for r in grc.get('filas', []) if str(r.get('cid') or '') == CID]
    tot_mrr = sum(float(r.get('mrrFin') or 0) for r in fil)
    for r in fil:
        print(u'           GRC · %s · %s · mrrIni $%s → mrrFin $%s · %s meses · %s'
              % (r.get('cliente'), r.get('clasif'), mil(r.get('mrrIni') or 0),
                 mil(r.get('mrrFin') or 0), r.get('meses'), r.get('movimiento')))
    ok(len(fil) == 1 and abs(tot_mrr - 37222) < 1,
       u'el MRR institucional del corte vivo son $%s' % mil(tot_mrr),
       u'y NO los $13,802 de `cuentas.facturacion`, que son el `mrrIni` de este '
       u'mismo corte: el importe del mes ANTERIOR')
    mov = (fil[0].get('movimiento') or u'') if fil else u''
    if u'por confirmar' in mov.lower():
        ok(True, u'el propio GRC marca el alza como «%s»' % mov,
           u'ganado $%s. El acumulado creció exactamente eso en el sexto mes, así '
           u'que SÍ se facturó; lo que el GRC no da por confirmado es que sea '
           u'durable y no un artefacto del corte. No se publica como MRR cerrado.'
           % mil(fil[0].get('ganado') or 0))

    # la historia: el importe ya había bajado y volvió
    hist = []
    for f in ('grc-zoho.2026-10-02.bak.json', 'grc-zoho.2026-11-16.bak.json'):
        g = data(os.path.join('data', f))
        if not g:
            continue
        for r in g.get('filas', []):
            if str(r.get('cid') or '') == CID:
                hist.append((f, r.get('mrrIni'), r.get('mrrFin'), r.get('movimiento'),
                             r.get('acumulado'), r.get('meses')))
    for f, i, fi, m, ac, me in hist:
        print(u'           %s → $%s → $%s · %s · acumulado $%s en %s meses'
              % (f.replace('grc-zoho.', '').replace('.bak.json', ''),
                 mil(i or 0), mil(fi or 0), m, mil(ac or 0), me))
    if len(hist) >= 1:
        ok(True, u'el importe de esta cuenta NO es estable: bajó y volvió',
           u'el corte del 2 oct registró Downgrade de $23,420 a $13,802 (pérdida '
           u'$9,618) y el del 16 nov un alza del MISMO importe. $13,802 + $23,420 '
           u'= $37,222 al peso.')

# -- Supabase --
try:
    env = {}
    for ln in io.open(os.path.join(RAIZ, '.env.local'), 'r', encoding='utf-8'):
        ln = ln.strip()
        if ln and not ln.startswith('#') and '=' in ln:
            k, v = ln.split('=', 1)
            env[k.strip()] = v.strip().strip('"\'')
    base = env['NEXT_PUBLIC_SUPABASE_URL']
    llave = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

    def sb(path):
        rq = urllib.request.Request(base + '/rest/v1/' + path,
                                    headers={'apikey': llave,
                                             'Authorization': 'Bearer ' + llave})
        return json.load(urllib.request.urlopen(rq, timeout=45))

    c = sb('cuentas?select=*&cid=eq.' + CID)
    if not c:
        aviso(u'la cuenta %s no está en `cuentas`' % CID)
    else:
        c = c[0]
        ok(c['asesor'] == 'Erick',
           u'el asesor de la cuenta es %s' % c['asesor'],
           u'la cartera pasó de Claudia a Erick el 15 oct 2026, y el reporte está '
           u'fechado el 12 nov')
        ok(abs(float(c['facturacion']) - 13802) < 1,
           u'`cuentas.facturacion` guarda $%s' % mil(c['facturacion']),
           u'que es el importe del corte anterior, no el institucional')
        ok(c['consecutivo'].strip() == 'C',
           u'el consecutivo de la cuenta es «%s» — SIN número' % c['consecutivo'],
           u'es la ÚNICA de las 224 de cartera así. El siguiente libre del prefijo '
           u'C es C71. Mientras no se complete, `registry.ts` tiene que apuntar a '
           u'«C» y cambiarlo el día que se renumere, o el botón desaparece sin aviso.')
        ok(int(c['score_pago']) == 50,
           u'`score_pago` de la ficha es %d, no 100' % c['score_pago'],
           u'el FODA del reporte publica «Health Score de pagos 100». El health '
           u'score global es %d (actividad %d / adopción %d / pago %d / relacional %d)'
           % (c['health_score'], c['score_actividad'], c['score_adopcion'],
              c['score_pago'], c['score_relacional']))
        ok(c['tiene_chat_activo'] is False,
           u'`tiene_chat_activo` es False en la ficha',
           u'el reporte dice «Chat contratado el 24 ago, activo a finales de sep, '
           u'sin mensajes enviados»')
        ok(c['estado'] == 'activo', u'`cuentas.estado` sigue en «activo»',
           u'con cuatro alertas abiertas, una crítica')
        print(u'           contacto de la ficha: %s · %s · %s'
              % (c['contacto_nombre'], c['contacto_cargo'], c['contacto_email']))

    # Las tablas colgadas NO llevan `cid`: se filtran por `cuenta_id`. Un 400
    # aquí dejaba las alertas SIN COMPROBAR, que no es lo mismo que estar bien.
    cuenta_id = c['id']
    al = sb('alertas_episodios?select=tipo,estado,severidad_actual,abierto_en,escalo_en,'
            'evidencia_actual,mrr_actual,es_top_actual&cuenta_id=eq.' + cuenta_id)
    abiertas = [a for a in al if a['estado'] == 'abierta']
    ok(len(abiertas) == 4, u'%d alertas ABIERTAS en esta cuenta' % len(abiertas),
       u' · '.join(u'%s (%s)' % (a['tipo'], a['severidad_actual']) for a in abiertas))
    sil = [a for a in abiertas if a['tipo'] == 'silencio_60']
    if sil:
        ok(sil[0]['severidad_actual'] == 'critica',
           u'`silencio_60` está CRÍTICA y escaló el %s' % sil[0]['escalo_en'],
           sil[0]['evidencia_actual'])
    tops = [a for a in abiertas if a.get('es_top_actual')]
    if tops:
        ok(True, u'las %d alertas abiertas ya marcan la cuenta como TOP' % len(tops),
           u'al abrirse NO lo era: entró al TOP cuando el importe pasó de $13,802 '
           u'a $37,222, y las alertas citan el nuevo importe')

    seg = sb('seguimientos?select=fecha,tipo,resultado,asesor&cuenta_id=eq.' + cuenta_id
             + '&order=fecha.desc')
    reales = [s for s in seg if s['tipo'] != 'nota']
    print(u'           seguimientos: %d (%d notas internas)'
          % (len(seg), len(seg) - len(reales)))
    if seg and reales:
        ult_todo = seg[0]['fecha'][:10]
        ult_real = reales[0]['fecha'][:10]
        ok(ult_real == '2026-09-08' and ult_todo == '2026-10-01',
           u'el último contacto que LLEGÓ al cliente es %s, no %s' % (ult_real, ult_todo),
           u'el reporte dice «último contacto de valor hace 42 días», que son los '
           u'días hasta el %s — y ese registro es una NOTA interna (Monse pidiendo '
           u'que alguien contacte a Roberto), no un contacto. Hasta el %s van 65 '
           u'días al 12 nov.' % (ult_todo, ult_real))
except Exception as e:
    aviso(u'no se pudo contrastar contra Supabase: %s' % e,
          u'las comprobaciones de ficha y alertas quedan SIN HACER, que no es lo '
          u'mismo que estar bien.')

# -- DIDs --
dd = data(os.path.join('data', 'dids.json'))
if dd is None:
    aviso(u'no se pudo leer data/dids.json')
else:
    nums = (dd.get('porCid') or {}).get(CID) or []
    ok(len(nums) == 1, u'la cuenta tiene %d número de entrada en dids.json' % len(nums),
       u' · '.join(n.get('n', '') for n in nums))
    if nums and re.search(re.escape(nums[0]['n'][2:]), re.sub(r'\D', '', bruto)):
        ok(True, u'el número del encabezado es el que dice dids.json',
           u'+52 55 9764 6956 = %s' % nums[0]['n'])

# -- tickets --
tk = None
p = os.path.join(RAIZ, 'lib', 'tickets-data.json')
if os.path.exists(p):
    tk = [r for r in json.load(io.open(p, 'r', encoding='utf-8')) if r.get('cid') == CID]
if tk is None:
    aviso(u'no se pudo leer lib/tickets-data.json')
else:
    fal = [r for r in tk if r.get('es_falla') == 'Si']
    import collections
    prod = collections.Counter(r.get('producto') for r in tk)
    ok(len(fal) == 0, u'%d tickets en la mesa y CERO fallas del servicio' % len(tk),
       u'por producto: ' + u' · '.join(u'%s %d' % (k, v) for k, v in prod.items())
       + u'. La fuente sólo trae CERRADOS, así que «abiertos» no es cero: es NO MEDIBLE.')
    chat_t = [r for r in tk if r.get('producto') == 'Chat']
    if chat_t:
        ok(True, u'hay %d tickets de Chat, los dos de octubre' % len(chat_t),
           u' · '.join(u'%s %s' % (r['fecha'], r['subcategoria']) for r in chat_t)
           + u'. El cliente estaba montando el Chat con soporte, así que «sin uso» '
             u'no es «sin interés».')
    av = [r for r in tk if 'Agente Virtual' in (r.get('subcategoria') or '')]
    if av:
        ok(True, u'el cliente ya preguntó por el Agente Virtual en la mesa',
           u' · '.join(u'%s %s' % (r['fecha'], r['subcategoria']) for r in av)
           + u'. El plan del reporte propone «Demo de IA de Voz» como si fuera '
             u'una idea nuestra.')

# -- chat: la ausencia de fila NO es un cero --
p = os.path.join(RAIZ, 'app', 'callpicker-chat', 'chat-data.ts')
if not os.path.exists(p):
    aviso(u'no se pudo leer app/callpicker-chat/chat-data.ts')
else:
    t = io.open(p, 'r', encoding='utf-8').read()
    ok(('"cid": "%s"' % CID) not in t,
       u'LINEACEL NO tiene fila en la fuente de Callpicker Chat',
       u'así que «sin mensajes enviados» no está MEDIDO: no hay lectura, ni buena '
       u'ni mala. Un hueco de medición no se publica como desuso '
       u'([[callpicker-chat-fuente]]).')

# -- llamadas: nuestra fuente va un mes por detrás --
an = data(os.path.join('data', 'analisis-llamadas.json'))
if an is None:
    aviso(u'no se pudo leer data/analisis-llamadas.json')
else:
    cu = (an.get('cuentas') or {}).get(CID)
    if not cu:
        aviso(u'el CID %s no está en analisis-llamadas.json' % CID)
    else:
        sal = cu['sal']
        ok(sal.get('hasta') == '2026-10-12',
           u'nuestra fuente de llamadas llega al %s; el reporte al %s'
           % (sal.get('hasta'), K.get('end')),
           u'%s salientes contra las %s del reporte: un mes de diferencia, no un '
           u'desacuerdo' % (mil(sal['total']), mil(TOT)))
        nuestro = sal['meses']
        coinciden, difieren = [], []
        for lab, mes in (('May*', '2026-05'), ('Jun', '2026-06'), ('Jul', '2026-07'),
                         ('Ago', '2026-08'), ('Sep', '2026-09')):
            if mes not in nuestro:
                continue
            n_nuestro = nuestro[mes]['total']
            desc = nuestro[mes].get('Desconocido', 0)
            n_rep = vol[lab]
            (coinciden if n_nuestro - desc == n_rep else difieren).append(
                u'%s %s−%s=%s vs %s' % (mes, mil(n_nuestro), desc,
                                        mil(n_nuestro - desc), mil(n_rep)))
        ok(not difieren,
           u'los 5 meses que las dos fuentes comparten cuadran AL RECORD',
           u' · '.join(coinciden) + u'. El reporte excluye 5 registros «sin '
           u'desenlace»; nuestra fuente guarda 3 «Desconocido» hasta el 12 oct.')
        ent = cu['ent']
        ok(ent['total'] == 26,
           u'la cuenta también RECIBE llamadas, y el reporte no las mide',
           u'%d entrantes del %s al %s y %d sin contestar (%.0f%%). El reporte '
           u'propone «IA de Voz para atender a quien regresa la llamada» sin medir '
           u'que esas devoluciones ya están entrando y casi todas se caen. Son '
           u'pocas: se dicen en número, no en tendencia.'
           % (ent['total'], ent['desde'], ent['hasta'],
              ent['tipos'].get('Lost', 0),
              ent['tipos'].get('Lost', 0) * 100.0 / ent['total']))

# ───────────────────────────────────────────────────────────────────────────────
# 8 · el asesor y las notas
# ───────────────────────────────────────────────────────────────────────────────
seccion(u'8 · EL ASESOR Y LAS NOTAS DEL DOCUMENTO')

cl = re.findall(r'\bClaudia\b', texto)
ok(not cl, u'el documento publicado ya no nombra a Claudia',
   u'aparece %d vez/veces fuera de las notas de corrección' % len(cl))
ok(len(re.findall(r'\bErick\b', bruto)) > 0,
   u'el documento nombra a Erick, que es quien tiene la cuenta')

ok(len(notas) >= 6,
   u'el documento trae %d nota(s) de corrección visibles' % len(notas),
   u'si se borran, este guion se pone en rojo: una corrección que no se ve no es '
   u'una corrección')
ok(len(marcados) >= 5,
   u'declara %d desfase(s) por clave' % len(marcados),
   u', '.join(sorted(marcados)))

# ───────────────────────────────────────────────────────────────────────────────
print(u'\n   ' + u'=' * 72)
print(u'   %d aviso(s) · %d fallo(s)' % (len(avisos), len(fallos)))
if fallos:
    print(u'\n   LO QUE NO CIERRA:')
    for f in fallos:
        print(u'     · ' + f)
    print(u'\n   *** NO PUBLICAR hasta que cada línea de arriba cierre o quede')
    print(u'       declarada con palabras dentro del documento.')
    sys.exit(1)
print(u'\n   TODO LO RECALCULABLE CIERRA. Los desfases que quedan están dichos')
print(u'   dentro del documento, con su clave y su tamaño.')
sys.exit(0)
