# -*- coding: utf-8 -*-
u"""GRC_RESUMEN_CERRADOS esta escrito A MANO. Que coincida con los datos.

   POR QUE EXISTE
   --------------
   El renglon «Meses cerrados (Ene–X)» de Churn · GRC AAA es la cifra
   COMPARABLE contra el historico: la que se lee cuando el mes vivo esta
   inflado por cobranza pendiente. Y no se calcula — es una constante tecleada
   en `app/churn/grc-reporte.ts`.

   Ya se quedo vieja una vez: el 11 oct 2026 seguia diciendo «hasta Agosto»
   con septiembre cerrado. Nadie lo nota, porque un numero plausible en una
   tabla no se audita. Esto lo audita en cada carga.

   COMO
   ----
   Recalcula el resumen desde `aaa-grc-data.ts` + `GRC_BASE_MRR` y lo compara
   contra la constante. Las reglas de clasificacion NO se teclean aqui: se
   LEEN de `components/GrcAaaSection.tsx`, que es quien pinta la tabla, y el
   guion se cae si no las encuentra. Un espejo tecleado a mano deja de ser
   espejo en cuanto alguien cambia el original.

   CONTROL NEGATIVO (`--autoprueba`): se arma un resumen de referencia con lo
   CALCULADO —que por construccion coincide—, se comprueba que coincide, y
   entonces se le mueve un peso y se comprueba que la comparacion FALLA. Las
   dos mitades hacen falta: si solo se comprobara que algo falla, un
   verificador roto que falla siempre pasaria el control. Y no se puede montar
   sobre la constante publicada, porque si esa ya esta desfasada el «fallo» no
   prueba que el peso se haya detectado.

   `--datos <ruta>` mide contra OTRO aaa-grc-data.ts —el respaldo anterior,
   por ejemplo— para separar lo que descuadra desde antes de lo que mueve una
   carga nueva.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/verifica-resumen-cerrados.py
       python scripts/verifica-resumen-cerrados.py --autoprueba
       python scripts/verifica-resumen-cerrados.py --datos "<ruta>/anterior.ts"
"""
import io
import os
import re
import sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS_DATA = os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts')
TS_REP = os.path.join(RAIZ, 'app', 'churn', 'grc-reporte.ts')
TSX = os.path.join(RAIZ, 'components', 'GrcAaaSection.tsx')
CENT = 0.01

MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']


def lee(ruta):
    return io.open(ruta, encoding='utf-8').read()


# ── Las reglas, leidas de quien pinta la tabla ──────────────────────────────
tsx = lee(TSX)
m = re.search(r"esChurnGrc\s*=\s*\(m: string\)\s*=>\s*m\.startsWith\('([^']+)'\)", tsx)
if not m:
    sys.exit(u'  *** no encontre `esChurnGrc` en GrcAaaSection.tsx. '
             u'Si cambio de forma, este guion esta midiendo otra cosa: no sigo.')
PREFIJO_CHURN = m.group(1)

m = re.search(r"r\.movimiento\.startsWith\('([^']+)'\)\)\.reduce\(\(s, r\) => s \+ r\.perdido, 0\)",
              tsx)
if not m:
    sys.exit(u'  *** no encontre la regla de downgrade en GrcAaaSection.tsx. No sigo.')
PREFIJO_DOWN = m.group(1)

print(u'  reglas leidas de GrcAaaSection.tsx:')
print(u'    churn     = movimiento empieza por «%s»' % PREFIJO_CHURN)
print(u'    downgrade = movimiento empieza por «%s»' % PREFIJO_DOWN)
if PREFIJO_CHURN == PREFIJO_DOWN:
    sys.exit(u'  *** las dos reglas son la misma: la lectura esta rota.')

# ── Las constantes ──────────────────────────────────────────────────────────
rep = lee(TS_REP)
i = rep.find('GRC_BASE_MRR: Record<string, number> = {')
if i < 0:
    sys.exit(u'  *** no encontre GRC_BASE_MRR.')
BASE = {k: float(v) for k, v in
        re.findall(r'(\w+):\s*([\d.]+)', rep[i:rep.find('}', i)])}
if not BASE:
    sys.exit(u'  *** GRC_BASE_MRR salio vacio.')

m = re.search(r"GRC_MES_EN_CURSO: string \| null = (?:'([^']+)'|null)", rep)
if not m:
    sys.exit(u'  *** no encontre GRC_MES_EN_CURSO.')
EN_CURSO = m.group(1)

i = rep.find('GRC_RESUMEN_CERRADOS = {')
if i < 0:
    sys.exit(u'  *** no encontre GRC_RESUMEN_CERRADOS.')
blo = rep[i:rep.find('}', i)]
mh = re.search(r"hasta:\s*'([^']+)'", blo)
PUB = {k: float(v) for k, v in re.findall(r'(base|churn|downgrade|perdida|pct):\s*([\d.]+)', blo)}
if not mh or len(PUB) != 5:
    sys.exit(u'  *** GRC_RESUMEN_CERRADOS no tiene los seis campos esperados.')
PUB['hasta'] = mh.group(1)

# ── Los datos ───────────────────────────────────────────────────────────────
if '--datos' in sys.argv:
    TS_DATA = sys.argv[sys.argv.index('--datos') + 1]
    print(u'  midiendo contra OTRO archivo: %s' % TS_DATA)
src = lee(TS_DATA)
filas, mes = [], None
for m in re.finditer(r"mes:\s*'([^']+)'|\{\s*cliente:\s*'(?:[^'\\]|\\.)*'(.*?)\}", src, re.S):
    if m.group(1):
        mes = m.group(1)
        continue
    cuerpo = m.group(2) or ''
    mov = re.search(r"movimiento:\s*'([^']*)'", cuerpo)
    per = re.search(r"\bperdido:\s*(-?[\d.]+)", cuerpo)
    fra = re.search(r"\bperdido2:\s*(-?[\d.]+)", cuerpo)
    filas.append((mes, mov.group(1) if mov else '', float(per.group(1)) if per else 0.0,
                  float(fra.group(1)) if fra else 0.0))
if not filas:
    sys.exit(u'  *** no lei ni una fila de aaa-grc-data.ts.')
if sum(f[2] for f in filas) <= 0:
    sys.exit(u'  *** lei %d filas y TODAS con perdido 0: el patron esta roto, '
             u'no concluyo nada.' % len(filas))
print(u'  %d filas leidas de aaa-grc-data.ts' % len(filas))


def resumen(fs, hasta):
    tope = MESES.index(hasta)
    sel = [f for f in fs if f[0] in MESES and MESES.index(f[0]) <= tope]
    ch = sum(p for _, mv, p, _f in sel if mv.startswith(PREFIJO_CHURN))
    dg = sum(p for _, mv, p, _f in sel if mv.startswith(PREFIJO_DOWN))
    ba = sum(BASE.get(m, 0.0) for m in MESES[:tope + 1])
    return {'base': ba, 'churn': ch, 'downgrade': dg, 'perdida': ch + dg,
            'pct': round(100.0 * (ch + dg) / ba, 2) if ba else 0.0}


def para_la_nota(fs, hasta):
    u"""Las dos cifras que la nota de GRC_EXCLUYE_FRAUDE cita a mano."""
    tope = MESES.index(hasta)
    sel = [f for f in fs if f[0] in MESES and MESES.index(f[0]) <= tope]
    return sum(p for _, _m, p, _f in sel), sum(f for _, _m, _p, f in sel)


def compara(fs, etiqueta, contra=None):
    ref = contra if contra is not None else PUB
    calc = resumen(fs, PUB['hasta'])
    print(u'\n  %s — Ene a %s' % (etiqueta, PUB['hasta']))
    print(u'  %-11s %18s %18s %14s' % ('', 'publicado', 'calculado', 'delta'))
    mal = []
    for k in ('base', 'churn', 'downgrade', 'perdida'):
        d = calc[k] - ref[k]
        if abs(d) >= CENT:
            mal.append(k)
        print(u'  %-11s %18s %18s %14s%s' % (
            k, format(ref[k], ',.2f'), format(calc[k], ',.2f'), format(d, ',.2f'),
            u'  <<<' if abs(d) >= CENT else u''))
    dp = calc['pct'] - ref['pct']
    if abs(dp) >= 0.005:
        mal.append('pct')
    print(u'  %-11s %18s %18s %14s%s' % (
        'pct', '%.2f%%' % ref['pct'], '%.2f%%' % calc['pct'], '%.2f' % dp,
        u'  <<<' if abs(dp) >= 0.005 else u''))
    return mal


# El mes en curso NO puede estar dentro del resumen: ese es justo el punto.
if EN_CURSO and MESES.index(PUB['hasta']) >= MESES.index(EN_CURSO):
    print(u'\n  *** «hasta: %s» ALCANZA al mes en curso (%s). El renglon de meses'
          % (PUB['hasta'], EN_CURSO))
    print(u'      cerrados estaria incluyendo cartera por cobrar.')
    sys.exit(1)

malos = compara(filas, u'PUBLICADO contra DATOS')

_real, _fra = para_la_nota(filas, PUB['hasta'])
print(u'\n  para la nota de GRC_EXCLUYE_FRAUDE (Ene a %s):' % PUB['hasta'])
print(u'    perdida real TOTAL (los tres churns + downgrade)  $%s' % format(_real, ',.2f'))
print(u'    fraude / reestructura                             $%s' % format(_fra, ',.2f'))

if '--autoprueba' in sys.argv:
    print(u'\n  === AUTOPRUEBA — las DOS mitades ===')
    print(u'  se arma una referencia con lo calculado. Primero tiene que')
    print(u'  COINCIDIR; despues, movido un peso, tiene que FALLAR.')
    ref = resumen(filas, PUB['hasta'])
    if compara(filas, u'1/2 · referencia intacta (debe coincidir)', ref):
        sys.exit(u'\n  *** la referencia no coincide consigo misma: el '
                 u'calculo no es reproducible. No sigo.')
    tocadas, hecho = [], False
    for f in filas:
        if not hecho and f[1].startswith(PREFIJO_CHURN) and f[0] != EN_CURSO:
            tocadas.append((f[0], f[1], f[2] + 1.0, f[3])); hecho = True
        else:
            tocadas.append(f)
    if not hecho:
        sys.exit(u'  *** no encontre ni una fila de churn en un mes cerrado: '
                 u'el control negativo no se pudo montar.')
    if not compara(tocadas, u'2/2 · con $1 de mas (debe fallar)', ref):
        sys.exit(u'\n  *** el control negativo PASO: la comparacion no detecta '
                 u'un peso de diferencia y por tanto no prueba nada.')
    print(u'\n  autoprueba completa: coincide cuando debe y falla cuando debe.')

if malos:
    print(u'\n  *** GRC_RESUMEN_CERRADOS no coincide con los datos: %s'
          % u', '.join(malos))
    print(u'      Actualizar la constante en app/churn/grc-reporte.ts.')
    sys.exit(1)
print(u'\n  GRC_RESUMEN_CERRADOS coincide con los datos, al centavo.')
