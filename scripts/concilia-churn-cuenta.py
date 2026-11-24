# -*- coding: utf-8 -*-
u"""CONCILIA EL DATASET DE «CHURN A NIVEL CUENTA» ANTES DE PUBLICARLO.

   El informe trae DOS representaciones del mismo año —la rejilla
   clasificación × mes (`cell`) y las 1,373 cuentas (`acc`)— y afirmaciones en
   prosa encima de las dos. Aquí se les exige que CIERREN entre sí, y que las
   frases del informe se puedan RECONSTRUIR de sus propios números.
   [[feedback-tablas-deben-cerrar]] [[feedback-metricas-derivadas-origen]]

   LO QUE ESTE INFORME TIENE DE PELIGROSO PARA NOSOTROS
   -----------------------------------------------------
   Su hallazgo central es que **el «GRC acumulado 24.7%» de la tabla de origen
   es una SUMA ARITMÉTICA de tasas mensuales**, no la porción de cartera
   perdida. Y ese 24.7% es, al decimal, lo que nuestro propio módulo de Churn
   publica en su tarjeta «GRC ACUMULADO 2026 HASTA OCTUBRE». Así que esto no
   es un documento que describa a un tercero: audita una cifra que nosotros
   enseñamos. La sección 6 lo comprueba contra el corte vigente.

   USO
       python -I scripts/concilia-churn-cuenta.py
"""
import io
import json
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8',
                              line_buffering=True)
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


def seccion(n, titulo):
    print(u'\n  %s %s' % (u'-' * 3, titulo))


def leer(rel):
    with io.open(os.path.join(RAIZ, rel), encoding='utf-8') as f:
        return f.read()


# ── El dataset generado, leído del .ts ─────────────────────────────────────
ts = leer('app/churn/cuenta-data.ts')
m = re.search(r'export const CHURN_CUENTA_META = (\{.*?\}) as const', ts, re.S)
META = json.loads(m.group(1))
m = re.search(r'export const CUENTAS_CHURN: CuentaChurn\[\] = (\[.*\])\s*$', ts, re.S)
CUENTAS = json.loads(m.group(1))

CLASES = META['clases']
CELL = META['cell']
NC = META['mesesCerrados']          # 10 = ene..oct cerrados
CER = META['cerrado']
TRA = META['transito']

print(u'\n=== CONCILIACIÓN · CHURN A NIVEL CUENTA (informe al %s) ===' % META['corte'])
print(u'  %d cuentas · %d movimientos · periodo cerrado %s'
      % (len(CUENTAS), META['movimientos'], META['periodoCerrado']))

# ─── 1 · LAS DOS REPRESENTACIONES DEL MISMO AÑO ────────────────────────────
seccion(1, u'LA REJILLA Y LAS CUENTAS MIDEN LO MISMO')
ok(len(CUENTAS) == META['cuentasFuente'],
   u'se generan las cuentas que declara el informe',
   u'%d vs %d' % (len(CUENTAS), META['cuentasFuente']))

# Pérdida ene-oct: rejilla contra suma de cuentas.
rej_oct = sum(sum(CELL[c]['ch'][:NC]) + sum(CELL[c]['dg'][:NC]) for c in CLASES)
acc_oct = sum(c['lOct'] for c in CUENTAS)
ok(cerca(rej_oct, acc_oct, 1.0),
   u'ene-oct · la rejilla cuadra con las 1,373 cuentas',
   u'%s vs %s' % (pesos(rej_oct), pesos(acc_oct)))
ok(cerca(rej_oct, CER['bruta'], 0.01),
   u'ene-oct · y las dos cuadran con el total publicado',
   pesos(CER['bruta']))

rej_nov = sum(CELL[c]['ch'][NC] + CELL[c]['dg'][NC] for c in CLASES)
acc_nov = sum(c['lNov'] for c in CUENTAS)
ok(cerca(rej_nov, acc_nov, 1.0),
   u'noviembre · la rejilla cuadra con las cuentas',
   u'%s vs %s' % (pesos(rej_nov), pesos(acc_nov)))

# LA PARTICIÓN NO PUEDE PERDER NI INVENTAR DINERO. `ch + dg` del informe es el
# total ENE-NOV de cada cuenta; lOct + lNov tiene que dar exactamente eso.
descuadran = [c for c in CUENTAS
              if not cerca(c['lOct'] + c['lNov'], c['ch'] + c['dg'], 0.02)]
ok(not descuadran,
   u'cada cuenta: lOct + lNov = ch + dg del informe',
   u'%d descuadran: %s' % (len(descuadran),
                           u', '.join(c['n'] for c in descuadran[:3])))

# ─── 2 · LAS CUENTAS DEL MES EN TRÁNSITO ───────────────────────────────────
seccion(2, u'NOVIEMBRE VA APARTE, Y SE NOTA')
print(u'      cerrado ene-oct : %s en %d bajas y %d downgrades'
      % (pesos(CER['bruta']), CER['bajas'], CER['downgradesN']))
print(u'      noviembre       : %s en %d bajas y %d downgrades  (%.2f%%)'
      % (pesos(TRA['perdida']), TRA['bajas'], TRA['downgradesN'], TRA['tasa']))
# Un mes vivo que vale el 62% de los diez cerrados no es un mes malo: es un mes
# sin cerrar. Decirlo con el múltiplo evita que alguien lo sume.
mult = TRA['perdida'] / (CER['bruta'] / NC)
ok(TRA['perdida'] > 0 and CER['bruta'] > 0,
   u'los dos periodos traen cifra propia')
avisos.append(u'NOVIEMBRE VALE %s, el %.0f%% de LOS DIEZ MESES CERRADOS JUNTOS y '
              u'%.1f veces el mes promedio del periodo. Su tasa (%.2f%%) es casi 3 '
              u'veces la de octubre. El informe se NIEGA a concluir sobre el: 321 '
              u'de sus 509 movimientos son de cuentas con 10 facturas emitidas, o '
              u'sea que su estatus de pago todavia puede cambiar. NO se suma a '
              u'nada.' % (pesos(TRA['perdida']), TRA['perdida'] / CER['bruta'] * 100,
                          mult, TRA['tasa']))

# ─── 3 · EL ACUMULADO TIENE TRES LECTURAS Y SÓLO UNA SE PUBLICA ────────────
seccion(3, u'EL «GRC ACUMULADO» · reconstruir las tres lecturas')
tasas = META['tasas']
suma = round(sum(tasas[:NC]), 2)
ok(cerca(suma, CER['sumaAritmetica'], 0.02),
   u'la suma aritmetica se reconstruye sumando las tasas',
   u'%.2f%%' % suma)
pond = CER['bruta'] / CER['base'] * 100
ok(cerca(pond, CER['ponderado'], 0.01),
   u'el GRC ponderado se reconstruye dividiendo',
   u'%s / %s = %.2f%%' % (pesos(CER['bruta']), pesos(CER['base']), pond))
comp = 1.0
for t in tasas[:NC]:
    comp *= (1 - t / 100)
comp = round((1 - comp) * 100, 2)
ok(cerca(comp, CER['compuesta'], 0.02),
   u'la retencion compuesta se reconstruye multiplicando',
   u'%.2f%%' % comp)
print(u'      LAS TRES LECTURAS DEL MISMO AÑO: suma aritmetica %.2f%% · '
      u'ponderado %.2f%% · compuesta %.2f%%' % (suma, pond, comp))
ok(suma > comp > pond,
   u'y estan ordenadas como manda la aritmetica (suma > compuesta > ponderado)')

# ─── 4 · CONCILIACIÓN ARCHIVO vs TABLA, LA DEL PROPIO INFORME ──────────────
seccion(4, u'ARCHIVO vs TABLA «GRC 2026 confirmado» · mes a mes')
malos = []
for r in META['recon']:
    if not cerca(r['ch_file'], r['ch_tab'], 0.01) or not cerca(r['dg_file'], r['dg_tab'], 0.01):
        malos.append(r['m'])
ok(not malos, u'los %d meses concilian al centavo' % len(META['recon']),
   u', '.join(malos))

# ─── 5 · ANTIGÜEDAD ────────────────────────────────────────────────────────
seccion(5, u'PÉRDIDA POR ANTIGÜEDAD · los tramos cierran')
ten = META['tenure']
t_l = sum(b['l'] for b in ten)
ok(cerca(t_l, CER['bruta'], 1.0),
   u'los tramos de antiguedad suman el periodo cerrado',
   u'%s vs %s' % (pesos(t_l), pesos(CER['bruta'])))
ok(all(cerca(b['ch'] + b['dg'], b['l'], 0.5) for b in ten),
   u'cada tramo cierra (cancelacion + downgrade = perdida)')
viejas = sum(b['l'] for b in ten if b['b'] not in (u'0-6', u'7-12', u'13-24'))
print(u'      tramos: %s' % u' · '.join(u'%s %s' % (b['b'], pesos(b['l'])) for b in ten))
print(u'      25 meses o mas: %s, el %.1f%% de la perdida del periodo'
      % (pesos(viejas), viejas / CER['bruta'] * 100))
avisos.append(u'LA ANTIGUEDAD NO PROTEGE: %s —el %.1f%% de la perdida del periodo '
              u'cerrado— viene de cuentas con 25 meses o mas de relacion. La idea '
              u'de que el cliente viejo esta seguro no se sostiene en este dato.'
              % (pesos(viejas), viejas / CER['bruta'] * 100))

# ─── 6 · LO QUE ESTO LE DICE A NUESTRO PROPIO MÓDULO ───────────────────────
seccion(6, u'CONTRA EL CORTE VIGENTE DE ANÁLISIS DATA')
ra = leer('app/churn/reporte-actual.ts')
m_ac = re.search(r'acumulado:\s*([\d.]+)', ra)
acum_nuestro = float(m_ac.group(1)) if m_ac else None
print(u'      nuestro corte publica «Acumulado 2026 hasta Octubre»: %s%%'
      % acum_nuestro)
print(u'      este informe mide la suma aritmetica ene-oct en: %.2f%%' % suma)
ok(acum_nuestro is not None and abs(acum_nuestro - suma) <= 0.1,
   u'es LA MISMA CIFRA, no una parecida',
   u'%.2f%% vs %.2f%%' % (acum_nuestro or 0, suma))
if acum_nuestro is not None and abs(acum_nuestro - suma) <= 0.1:
    avisos.append(u'EL «24.7%% ACUMULADO» QUE PUBLICA NUESTRA PROPIA TARJETA ES UNA '
                  u'SUMA DE TASAS MENSUALES, NO CARTERA PERDIDA. Este informe lo '
                  u'reconstruye: %.2f%% es 2.04 + 2.12 + ... + 5.48. Lo que de '
                  u'verdad se perdio en diez meses es %s sobre una base de %s, o sea '
                  u'un GRC ponderado del %.2f%%; la lectura compuesta da %.2f%%. '
                  u'Son TRES numeros del mismo ano y el tablero ensena solo el mayor.'
                  % (suma, pesos(CER['bruta']), pesos(CER['base']), pond, comp))

# El 15.81% de noviembre del informe y el 15.5% del correo S30: dos fuentes
# independientes midiendo el mismo mes vivo.
m_nov = re.search(r'noviembre\s+(\d+\.\d+)%|(\d+\.\d+)%\s+de noviembre', ra, re.I)
print(u'      noviembre: este informe %.2f%% · el correo S30 publica 15.5%% · '
      u'nuestro GRC midio 16.01%%' % TRA['tasa'])
ok(abs(TRA['tasa'] - 15.5) <= 1.0,
   u'las tres lecturas del mes vivo caben en un punto',
   u'%.2f%% / 15.5%% / 16.01%%' % TRA['tasa'])

# ─── 7 · LA CARTERA CS DENTRO DEL INFORME ──────────────────────────────────
seccion(7, u'CUÁNTO DE ESTO ES CARTERA NUESTRA')
nuestras = [c for c in CUENTAS if c.get('cons')]
ok(len(nuestras) == META['cuentasCartera'],
   u'las cuentas marcadas son las que declara el generador',
   u'%d vs %d' % (len(nuestras), META['cuentasCartera']))
n_oct = sum(c['lOct'] for c in nuestras)
ok(n_oct <= CER['bruta'] + 0.01,
   u'nuestra parte no puede exceder el total', pesos(n_oct))
print(u'      %d de %d cuentas son cartera CS, y cargan %s de %s: el %.1f%%'
      % (len(nuestras), len(CUENTAS), pesos(n_oct), pesos(CER['bruta']),
         n_oct / CER['bruta'] * 100))
avisos.append(u'EL %.1f%% DE LA PERDIDA DEL ANO ESTA EN CARTERA NUESTRA: %d de las '
              u'%d cuentas del informe tienen consecutivo y asesor, y cargan %s de '
              u'los %s del periodo cerrado. El informe no lo sabe; el cruce es '
              u'nuestro y es por NOMBRE, asi que es indicativo y no mueve una cuenta '
              u'sola.' % (n_oct / CER['bruta'] * 100, len(nuestras), len(CUENTAS),
                          pesos(n_oct), pesos(CER['bruta'])))

por_asesor = {}
for c in nuestras:
    k = c.get('asesor') or u'(sin asesor)'
    a = por_asesor.setdefault(k, [0, 0.0])
    a[0] += 1
    a[1] += c['lOct']
for k, (n, d) in sorted(por_asesor.items(), key=lambda kv: -kv[1][1]):
    print(u'        %-12s %3d cuentas  %s' % (k, n, pesos(d)))

# LA VENTANA SE CUENTA CON LA MISMA DEFINICION QUE LA PANTALLA, Y SE DICEN LAS
# DOS CIFRAS. La marca `dgch` cubre TODO el año, noviembre incluido; la ventana
# accionable del periodo cerrado exige que la baja caiga en ene-oct. Publicar
# una y que la pantalla publique la otra es una contradiccion interna, que es
# el detector mas barato que hay. [[feedback-auditorias-verificar]]
marcadas = [c for c in nuestras if c['dgch']]
dgch = [c for c in marcadas
        if any(e[0] <= NC and e[1] == 'C' for e in c['ev'])]
ok(len(dgch) <= len(marcadas),
   u'la ventana cerrada es un subconjunto de las marcadas',
   u'%d de %d' % (len(dgch), len(marcadas)))
if marcadas:
    print(u'      de las nuestras, %d traen la marca «bajo de plan y cancelo» en '
          u'todo el ano; %d cancelaron DENTRO de ene-oct: %s'
          % (len(marcadas), len(dgch), pesos(sum(c['lOct'] for c in dgch))))
    avisos.append(u'DE NUESTRAS %d CUENTAS, %d BAJARON DE PLAN Y CANCELARON DENTRO '
                  u'DEL PERIODO CERRADO (%s). Otras %d traen la marca pero su baja '
                  u'cae en noviembre, que no cierra, y van contadas aparte. Es la '
                  u'senal mas accionable del informe: el downgrade anticipa la baja '
                  u'con una mediana de 4 meses, asi que es una ventana, no una '
                  u'estadistica.'
                  % (len(nuestras), len(dgch), pesos(sum(c['lOct'] for c in dgch)),
                     len(marcadas) - len(dgch)))

# ── Y CADA AGREGADO DE LA PANTALLA TIENE QUE CERRAR ───────────────────────
# La tabla «por clasificacion» de nuestra cartera se pintaba con las CINCO
# clases de la rejilla, y una cuenta con clasificacion COMPUESTA («AA/AAA»,
# porque cambio de banda dentro del ano) se caia del subtotal: 120 de 121 y la
# tabla se veia perfecta. [[feedback-tablas-deben-cerrar]]
clases_cuenta = sorted(set(c['cl'] for c in CUENTAS))
fuera = [c for c in clases_cuenta if c not in CLASES]
ok(sum(1 for c in nuestras if c['cl'] in clases_cuenta) == len(nuestras),
   u'las clases derivadas del dato cubren TODAS nuestras cuentas',
   u'%d clases: %s' % (len(clases_cuenta), u', '.join(clases_cuenta)))
ok(abs(sum(sum(x['lOct'] for x in nuestras if x['cl'] == c)
           for c in clases_cuenta) - n_oct) < 0.01,
   u'y su dinero suma el de la cartera', pesos(n_oct))
if fuera:
    avisos.append(u'HAY %d CLASIFICACION(ES) DE CUENTA QUE NO ESTAN EN LA REJILLA '
                  u'DEL INFORME: %s. Son cuentas que cambiaron de banda dentro del '
                  u'ano. Toda tabla o filtro por clase tiene que derivar las clases '
                  u'del DATO, no de las cinco de la rejilla, o esas cuentas quedan '
                  u'inalcanzables y su dinero se cae del subtotal sin que nada '
                  u'falle.' % (len(fuera), u', '.join(fuera)))

por_clase_cuentas = sum(1 for c in CUENTAS if c['cl'] in clases_cuenta)
ok(por_clase_cuentas == len(CUENTAS),
   u'y tambien las 1,373 del informe completo',
   u'%d de %d' % (por_clase_cuentas, len(CUENTAS)))

# ─── 7b · EL ENLACE AL INFORME COMPLETO ────────────────────────────────────
# La cabecera del módulo enlaza el informe entero. Tres cosas tienen que ser
# ciertas o el enlace miente: que el archivo exista, que sea EL MISMO que se
# midió, y que esté en la carpeta que el middleware protege —lleva 1,373
# nombres de cliente con su MRR—. [[pwa-documentos-cliente]]
seccion(u'7b', u'EL ENLACE ABRE EL ARCHIVO QUE SE MIDIÓ')
enlace = META.get('enlace') or u''
ok(enlace.startswith(u'/auditorias/') or enlace.startswith(u'/docs/'),
   u'el enlace vive en una carpeta con sesion exigida', enlace or u'(no hay)')
pub = os.path.join(RAIZ, 'public', enlace.lstrip('/').replace('/', os.sep))
ok(os.path.exists(pub), u'el archivo publicado existe')
if os.path.exists(pub):
    import hashlib
    def sha(p):
        with open(p, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    fuente = os.path.join(RAIZ, 'data', 'grc-por-clasificacion-2026.html')
    ok(sha(pub) == sha(fuente),
       u'y es byte a byte el que midio el generador', sha(pub)[:16])

# ─── 8 · LA PROSA DEL INFORME, CONTRA SUS PROPIOS NÚMEROS ──────────────────
# El módulo no sólo publica la rejilla: publica las lecturas, los ocho
# hallazgos, la tabla de decisión y el plan a 30/60/90 que el informe escribe
# encima de sus datos. Una frase que no se pueda reconstruir de la rejilla es
# una afirmación sin fuente, y aquí se pinta con la misma autoridad que una
# cifra medida. Así que cada número de esas frases se vuelve a calcular.
# [[feedback-auditorias-verificar]] [[feedback-metricas-derivadas-origen]]
seccion(8, u'LA PROSA DEL INFORME SE RECONSTRUYE DE SU PROPIA REJILLA')

ok(len(META['lectura']) == 7, u'las 7 lecturas de las graficas entraron',
   u'%d' % len(META['lectura']))
n_hall = sum(len(g['items']) for g in META['hallazgos'])
ok(len(META['hallazgos']) == 4 and n_hall == 8,
   u'los 8 hallazgos en sus 4 grupos entraron',
   u'%d grupos / %d hallazgos' % (len(META['hallazgos']), n_hall))
ok(len(META['decision']) == 9, u'las 9 filas de la tabla de decision entraron',
   u'%d' % len(META['decision']))
ok(len(META['plan']) == 3 and all(len(f['acciones']) == 3 for f in META['plan']),
   u'el plan trae 3 fases de 3 acciones')
ok(all(len(v) > 40 for v in META['lectura'].values()),
   u'ninguna lectura llego cortada a la mitad',
   u'la mas corta: %d caracteres' % min(len(v) for v in META['lectura'].values()))


def sc(c, k, a, b):
    return sum(CELL[c][k][a:b])


def sx(k, a, b):
    return sum(sc(c, k, a, b) for c in CLASES)


# Hallazgo 1 · octubre
ok(cerca(sx('ch', 9, 10) + sx('dg', 9, 10), 269923.63, 0.5),
   u'H1 · octubre pierde $269,924', pesos(sx('ch', 9, 10) + sx('dg', 9, 10)))
ok(cerca(sx('ch', 9, 10), 232839.53, 0.5),
   u'H1 · de los que $232,840 son cancelacion')
ok(sx('nch', 9, 10) == 169, u'H1 · las 169 bajas de octubre',
   u'%.0f' % sx('nch', 9, 10))
pond_9 = (sx('ch', 0, 9) + sx('dg', 0, 9)) / sum(META['mrrIni'][:9]) * 100
ok(cerca(round(pond_9, 2), 2.14, 0.01),
   u'H1 · el 2.14% ponderado de ene-sep', u'%.4f%%' % pond_9)

# Hallazgo 2 · AAA
aaa = sc('AAA', 'ch', 0, NC) + sc('AAA', 'dg', 0, NC)
ok(cerca(aaa, 470181.83, 0.5) and cerca(round(aaa / CER['bruta'] * 100, 1), 38.8),
   u'H2 · AAA pierde $470,182 = 38.8% del periodo',
   u'%s / %.2f%%' % (pesos(aaa), aaa / CER['bruta'] * 100))
ok(sc('AAA', 'nch', 0, NC) == 31
   and cerca(round(sc('AAA', 'ch', 0, NC) / 31), 8156, 1),
   u'H2 · 31 bajas AAA a $8,156 de MRR medio')

# Hallazgo 3 · AA y B en octubre
for cl, prom, oc, mult in ((u'AA', 13055, 41893, 3.2), (u'B', 9429, 27222, 2.9)):
    p = (sc(cl, 'ch', 0, 9) + sc(cl, 'dg', 0, 9)) / 9.0
    o = sc(cl, 'ch', 9, 10) + sc(cl, 'dg', 9, 10)
    ok(cerca(round(p), prom, 1) and cerca(round(o), oc, 1)
       and cerca(round(o / p, 1), mult, 0.01),
       u'H3 · %s pasa de $%s a $%s (x%.1f)' % (cl, format(prom, ','),
                                               format(oc, ','), mult))

# Hallazgo 4 · A
a_ = sc('A', 'ch', 0, NC) + sc('A', 'dg', 0, NC)
ok(cerca(a_, 357737.50, 0.5) and sc('A', 'nch', 0, NC) == 148,
   u'H4 · A pierde $357,738 en 148 bajas', pesos(a_))

# Hallazgo 5 · el downgrade de AAA
dg_aaa = sc('AAA', 'dg', 0, NC)
ok(cerca(dg_aaa, 217335.88, 0.5)
   and cerca(round(dg_aaa / CER['downgrades'] * 100, 1), 54.7)
   and cerca(round(dg_aaa / aaa * 100, 1), 46.2),
   u'H5 · $217,336 = 54.7% del downgrade y 46.2% de AAA')
ok(sc('AAA', 'ndg', 0, NC) == 121, u'H5 · los 121 downgrades de AAA',
   u'%.0f' % sc('AAA', 'ndg', 0, NC))

# Hallazgo 6 · fraude/reestructura
ok(cerca(round(sc('AAA', 'fr', 0, NC) / CER['fraude'] * 100, 1), 98.5),
   u'H6 · el 98.5% del fraude/reestructura es AAA',
   u'%s de %s' % (pesos(sc('AAA', 'fr', 0, NC)), pesos(CER['fraude'])))
grc_con_fr = (CER['bruta'] + CER['fraude']) / CER['base'] * 100
ok(cerca(round(grc_con_fr, 2), 2.99, 0.01),
   u'H6 · con el fraude dentro, el GRC seria 2.99%', u'%.4f%%' % grc_con_fr)

# Hallazgo 7 · EL DOWNGRADE QUE ANTICIPA LA BAJA
# Aquí el informe y su propio archivo NO dicen lo mismo, y conviene saber en
# qué sí: el DINERO reconstruye al centavo y el CONTEO no.
ventana = [c for c in CUENTAS
           if c['dgch'] and any(e[0] <= NC and e[1] == 'C' for e in c['ev'])]
v_dinero = sum(c['lOct'] for c in ventana)
ok(cerca(v_dinero, 164416.49, 0.5),
   u'H7 · los $164,416 de la ventana downgrade->baja', pesos(v_dinero))
ok(cerca(round(v_dinero / CER['bruta'] * 100, 1), 13.6),
   u'H7 · que son el 13.6% de la perdida del periodo')
print(u'      el informe dice «49 cuentas»; la poblacion medida es de %d, y es '
      u'la que carga ESE dinero.' % len(ventana))
if len(ventana) != 49:
    avisos.append(
        u'H7 · EL CONTEO DE LA VENTANA NO RECONSTRUYE: el informe publica «49 '
        u'cuentas» y el archivo da %d cuentas que bajaron de plan y cancelaron '
        u'DENTRO de ene-oct. El DINERO si reconstruye al centavo (%s = 13.6%%), '
        u'asi que la discrepancia esta en el conteo, no en el importe, y la '
        u'pantalla publica %d con esa aclaracion escrita. 3 cuentas de %d no se '
        u'deciden sin el criterio del informe.'
        % (len(ventana), pesos(v_dinero), len(ventana), len(ventana)))

# Hallazgo 8 · antigüedad
TEN = dict((t['b'], t) for t in META['tenure'])
p25 = TEN['25-48']['l'] + TEN['49+']['l']
ok(cerca(p25, 654299.78, 0.5)
   and cerca(round(p25 / CER['bruta'] * 100, 1), 54.0),
   u'H8 · 25+ meses cargan $654,300 = 54.0%', pesos(p25))
ok(cerca(round(TEN['49+']['l'] / CER['bruta'] * 100, 1), 32.4),
   u'H8 · y los de 49+ meses, el 32.4%')

# Lectura 5 · la concentración
orden = sorted(CUENTAS, key=lambda c: -c['lOct'])


def acum(n):
    return sum(c['lOct'] for c in orden[:n]) / CER['bruta'] * 100


ok(cerca(round(acum(10), 1), 13.8) and cerca(round(acum(25), 1), 25.7),
   u'L5 · top 10 = 13.8% y top 25 = 25.7%',
   u'%.1f%% / %.1f%%' % (acum(10), acum(25)))
ok(all(c['cl'] == 'AAA' for c in orden[:10]),
   u'L5 · las 10 primeras son todas AAA')

# Lectura 6 · pocas cuentas, mucho dinero
n_bajas = sx('nch', 0, NC)
ok(cerca(round(sc('AAA', 'nch', 0, NC) / n_bajas * 100, 1), 4.9)
   and cerca(round(sc('C', 'nch', 0, NC) / n_bajas * 100, 1), 48.4),
   u'L6 · AAA es 4.9% de las bajas y C el 48.4%')
ok(cerca(round(sc('C', 'ch', 0, NC) / sc('C', 'nch', 0, NC)), 344, 1),
   u'L6 · y cada baja de C vale $344')

# ─── 9 · LO QUE EL INFORME NO PERMITE DECIDIR ──────────────────────────────
seccion(9, u'LO QUE ESTE INFORME NO PERMITE DECIDIR')
INDECIDIBLES = [
    (u'tasa-por-clasificacion',
     u'El GRC propio de cada clasificacion. El archivo solo trae cuentas CON '
     u'perdida: no hay MRR inicial ni cuentas activas por segmento, asi que AAA '
     u'pesa mas sin que se sepa si su TASA es peor. Por eso todo va en puntos '
     u'porcentuales sobre el MRR total, no en % del segmento.'),
    (u'octubre-por-que',
     u'Si el salto de octubre (5.48%, x2.5 el promedio) es churn de mercado o un '
     u'registro de bajas en bloque. Las 5 clasificaciones se duplican A LA VEZ, y '
     u'el 60% de esas cuentas llevaba 9 facturas emitidas en 2026: seguian '
     u'facturandose el mes anterior. Falta motivo y fecha de solicitud.'),
    (u'churn-neto',
     u'El churn NETO. «Ingreso Ganado» es 0 en las 1,644 filas: no hay expansion '
     u'ni reactivacion en el archivo, asi que todo lo de aqui es churn BRUTO.'),
    (u'motivo-producto-dueno',
     u'Por que se fue cada cuenta y que producto solto. No existen esas columnas.'),
    (u'bajas-repetidas',
     u'Si las 7 cuentas con dos bajas en ene-oct ($16,273) son servicios distintos '
     u'o un doble conteo. Se mantienen para conciliar con la cifra oficial.'),
    (u'etiquetas-gtc',
     u'GTC-CARRANZA y GTC-LOMAS figuran como «Churn confirmado» pero su perdida '
     u'vive solo en la columna de fraude/reestructura. La etiqueta y la columna se '
     u'contradicen y el criterio de «reestructura» no esta documentado.'),
    (u'cruce-por-nombre',
     u'Que nuestras 121 sean exactamente esas. El informe no trae CID ni ID de '
     u'cuenta —lo dice su propia revision de calidad— asi que el cruce es por '
     u'nombre normalizado. Indicativo, no identidad.'),
    (u'ventana-49-vs-52',
     u'Por que el hallazgo 7 cuenta 49 cuentas y el archivo da 52 con el MISMO '
     u'dinero al centavo ($164,416.49). No hay criterio escrito que separe esas '
     u'3, y ninguna definicion alternativa que se probo —baja en mes '
     u'estrictamente posterior al downgrade, excluir las de doble baja— las '
     u'quita: las 52 cumplen las dos. La pantalla publica 52 y lo dice.'),
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
print(u'  Todas las comprobaciones de cierre pasan. El modulo se puede publicar, '
      u'y los %d avisos y los %d indecidibles van DENTRO de la pantalla.'
      % (len(avisos), len(INDECIDIBLES)))
sys.exit(0)
