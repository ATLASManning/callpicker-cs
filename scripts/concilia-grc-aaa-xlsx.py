# -*- coding: utf-8 -*-
u"""Corrobora que un export «GRC - AAA» cuadre con lo YA PUBLICADO en el modulo.

   POR QUE EXISTE
   --------------
   El modulo Churn · GRC AAA se regenera desde el export INSTITUCIONAL
   (`Gross_Revenue_Facturación.xlsx`), por instruccion de direccion: una sola
   fuente para los dos modulos, «no puede haber dos cifras».

   Cuando llega aparte un export del tablero AAA, lo que toca NO es regenerar
   —eso crearia la segunda cifra que la instruccion prohibe— sino COMPROBAR que
   dice lo mismo. Si cuadra, no hay nada que hacer. Si no cuadra, la diferencia
   se reporta; no se elige un archivo a dedo.

   Es de SOLO LECTURA. No escribe nada.

   COMO COMPARA
   ------------
   El `.ts` publicado lleva TODAS las clasificaciones (AAA · AA · A · B · C) y
   solo las filas de PERDIDA. El export AAA puede traer un subconjunto. Asi que
   el filtro no se supone: se LEE del propio xlsx —que clasificaciones y que
   meses trae— y el `.ts` se recorta a ese mismo universo antes de comparar.
   Comparar un subconjunto contra un total da una diferencia que no es un
   error, y eso ya costo una conclusion falsa en este proyecto.

   USO
   ---
       python scripts/concilia-grc-aaa-xlsx.py "C:/ruta/GRC_-_AAA_-_2026.xlsx"
"""
import collections
import io
import os
import re
import sys
import unicodedata

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from openpyxl import load_workbook

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS = os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts')
CENT = 0.01

if len(sys.argv) < 2:
    print(u'  uso: python scripts/concilia-grc-aaa-xlsx.py "<ruta del xlsx>"')
    sys.exit(2)
XLSX = sys.argv[1]


def norma(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'\s+', ' ', s).strip()


def num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(re.sub(r'[$,\s]', '', str(v or '')))
    except ValueError:
        return 0.0


# ── 1 · El xlsx, tal como viene ─────────────────────────────────────────────
wb = load_workbook(XLSX, data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
ix = {c: i for i, c in enumerate(cab)}


def col(*cand):
    for c in cab:
        for k in cand:
            if k in norma(c):
                return c
    return None


K_MES = col('mes nombre', 'mes')
K_CLI = col('cliente')
K_CLA = col('clasificacion')
K_MOV = col('movimiento')
K_PER = col('ingreso perdido contrato (bcy) real', 'perdido contrato (bcy) real')
K_PE2 = col('fraude')

print(u'  === EL EXPORT ===')
print(u'  %s' % os.path.basename(XLSX))
print(u'  hoja «%s» · %d columnas' % (wb.sheetnames[0], len(cab)))
for etq, k in ((u'mes', K_MES), (u'cliente', K_CLI), (u'clasificacion', K_CLA),
               (u'movimiento', K_MOV), (u'perdido real', K_PER), (u'fraude/reestr.', K_PE2)):
    print(u'     %-16s %s' % (etq, k if k else u'*** NO SE ENCUENTRA'))
if not all((K_MES, K_CLI, K_MOV, K_PER)):
    print(u'\n  *** faltan columnas imprescindibles: no se puede comparar.')
    sys.exit(1)

filas = []
for r in it:
    if all(v is None or str(v).strip() == '' for v in r):
        continue
    filas.append({
        'mes':  str(r[ix[K_MES]] or '').strip(),
        'cli':  str(r[ix[K_CLI]] or '').strip(),
        'clas': str(r[ix[K_CLA]] or '').strip() if K_CLA else '',
        'mov':  str(r[ix[K_MOV]] or '').strip(),
        'per':  num(r[ix[K_PER]]),
        'per2': num(r[ix[K_PE2]]) if K_PE2 else 0.0,
    })
wb.close()

meses_x = collections.Counter(f['mes'] for f in filas)
clas_x = collections.Counter(f['clas'] for f in filas)
print(u'\n  filas: %s' % format(len(filas), ',d'))
print(u'  meses: %s' % u' · '.join(u'%s %d' % (k, v) for k, v in sorted(meses_x.items())))
print(u'  clasificaciones: %s'
      % u' · '.join(u'%s %d' % (k or u'(vacía)', v) for k, v in clas_x.most_common()))

# El modulo guarda SOLO filas de perdida. Si el xlsx trae de todo, se recorta.
con_perdida = [f for f in filas if abs(f['per']) > CENT or abs(f['per2']) > CENT]
print(u'  de ellas con pérdida (real o fraude): %s' % format(len(con_perdida), ',d'))

# ── 2 · Lo publicado ────────────────────────────────────────────────────────
FILA = re.compile(
    r"\{ cliente: '(.*?)', clas: '([^']*)',.*?"
    r"movimiento: '([^']*)', perdido: ([-\d.]+), perdido2: ([-\d.]+)")
txt = io.open(TS, encoding='utf-8').read()
pub = collections.defaultdict(list)
for b in re.split(r"\n  \{\n    mes: '", txt)[1:]:
    mes = b.split("'")[0]
    for cli, clas, mov, per, per2 in FILA.findall(b):
        pub[mes].append({'cli': cli, 'clas': clas, 'mov': mov,
                         'per': float(per), 'per2': float(per2)})

print(u'\n  === LO PUBLICADO (app/churn/aaa-grc-data.ts) ===')
print(u'  %s filas en %d meses: %s'
      % (format(sum(len(v) for v in pub.values()), ',d'), len(pub),
         u', '.join(pub.keys())))

# ── 3 · El universo COMUN, que es lo unico comparable ────────────────────────
meses_com = [m for m in pub if m in meses_x]
clas_com = {c for c in clas_x if c}
# EL UNIVERSO NO ES SOLO DE MESES Y CLASIFICACIONES: TAMBIEN DE MOVIMIENTOS.
#
# El export del tablero AAA viene FILTRADO a los movimientos que el GRC cuenta
# —Churn confirmado y Downgrade, con sus variantes de fraude— y NO trae «Churn
# mensual» ni «Churn financiero», que son perdida real que el modulo publica
# en la canasta `otros` y que `gen-grc-data.py --conserva` protege.
#
# Sin recortar por movimiento, esas filas se contaban como diferencia y el
# guion decia «NO CUADRA» en los DIEZ meses, siempre. Una alarma que hay que
# ignorar para poder trabajar deja de ser una alarma — es el mismo vicio que
# ya se corrigio en `diff-cortes.py` con los duplicados.
#
# El universo se LEE del xlsx, no se teclea: si manana el export deja de
# filtrar, la bandera degrada sola. [[feedback-verificar-antes-asegurar]]
movs_x = collections.Counter(f['mov'] for f in filas)
movs_com = {norma(m) for m in movs_x if m}
print(u'\n  === EL UNIVERSO COMPARABLE ===')
print(u'  meses en los DOS: %s' % (u', '.join(meses_com) or u'ninguno'))
solo_x = sorted(set(meses_x) - set(pub))
solo_p = sorted(set(pub) - set(meses_x))
if solo_x:
    print(u'  meses SOLO en el export : %s' % u', '.join(solo_x))
if solo_p:
    print(u'  meses SOLO en lo publicado: %s' % u', '.join(solo_p))
if clas_com:
    print(u'  el export trae estas clasificaciones: %s' % u', '.join(sorted(clas_com)))
    print(u'  -> lo publicado se RECORTA a ellas antes de comparar.')
print(u'  el export trae estos movimientos: %s'
      % u' · '.join(u'%s %d' % (k, v) for k, v in movs_x.most_common()))
print(u'  -> lo publicado se RECORTA a ellos tambien.')

# Lo que queda FUERA del universo de movimientos no es una diferencia: es lo
# que el export no puede traer y `--conserva` tiene que proteger. Se dice con
# su dinero, para que nadie lo confunda con una perdida que se evaporo.
fuera = [(m, f) for m in meses_com for f in pub[m] if norma(f['mov']) not in movs_com]
if fuera:
    porm = collections.Counter(f['mov'] for _, f in fuera)
    print(u'\n  FUERA DEL UNIVERSO DEL EXPORT — lo que `--conserva` protege')
    print(u'  %d fila(s) publicadas en %d mes(es), $%s de perdida:'
          % (len(fuera), len({m for m, _ in fuera}),
             format(sum(f['per'] for _, f in fuera), ',.2f')))
    for mov, n in porm.most_common():
        tot = sum(f['per'] for _, f in fuera if f['mov'] == mov)
        print(u'     %-24s %4d fila(s)   $%s' % (mov, n, format(tot, ',.2f')))
    print(u'  NO son una diferencia: el export viene filtrado y no las trae.')
    print(u'  Regenerar SIN --conserva las borraria en silencio.')

fallos = []
print(u'\n  === MES A MES ===')
print(u'  %-12s %10s %10s %16s %16s %12s'
      % (u'MES', u'filas xls', u'filas pub', u'perdida xls', u'perdida pub', u'delta'))
for m in meses_com:
    fx = [f for f in con_perdida if f['mes'] == m
          and (not clas_com or f['clas'] in clas_com)]
    fp = [f for f in pub[m] if (not clas_com or f['clas'] in clas_com)
          and norma(f['mov']) in movs_com]
    px = sum(f['per'] for f in fx)
    pp = sum(f['per'] for f in fp)
    d = pp - px
    ok = abs(d) < CENT
    if not ok:
        fallos.append(m)
    print(u'  %-12s %10d %10d %16s %16s %12s %s'
          % (m, len(fx), len(fp), format(px, ',.2f'), format(pp, ',.2f'),
             format(d, ',.2f'), u'' if ok else u'  <<<'))

    if not ok or len(fx) != len(fp):
        # Quien difiere, por cliente+movimiento. Sin esto solo se sabe QUE no
        # cuadra, que no sirve para resolverlo.
        ax = collections.defaultdict(float)
        ap = collections.defaultdict(float)
        for f in fx:
            ax[(norma(f['cli']), f['mov'])] += f['per']
        for f in fp:
            ap[(norma(f['cli']), f['mov'])] += f['per']
        difs = []
        for k in set(ax) | set(ap):
            if abs(ap[k] - ax[k]) > CENT:
                difs.append((ap[k] - ax[k], k, ax[k], ap[k]))
        for d2, k, vx, vp in sorted(difs, key=lambda x: -abs(x[0]))[:10]:
            print(u'        %-34s %-20s xls %12s  pub %12s  %s'
                  % (k[0][:34], k[1][:20], format(vx, ',.2f'),
                     format(vp, ',.2f'), format(d2, ',.2f')))

# ── 4 · UNA FILA QUE FALTA, ¿SE MOVIO DE MES O SE PERDIO? ───────────────────
#
# No es lo mismo, y el conteo por mes no los distingue. Si el export trae la
# MISMA fila —mismo cliente, mismo movimiento, mismo importe— en otro mes, es
# un corrimiento y el dinero sigue ahi. Si no la trae en ninguno, esa perdida
# ya publicada DESAPARECE al regenerar.
#
# El empate se exige por cliente + movimiento + importe, no por nombre a secas.
# Con el nombre solo, «MY NEXT STEP» de octubre (Churn confirmado, $7,293)
# empataba con una fila de abril (Downgrade, $33.34) que es otro evento del
# mismo cliente, y el guion habria dicho «se movio» sobre una perdida que de
# verdad se cae. Es la trampa de cruzar por nombre. [[dids-fuente]]
if fallos:
    idx_x = collections.defaultdict(list)
    for f in con_perdida:
        idx_x[(norma(f['cli']), norma(f['mov']), round(f['per'], 2))].append(f['mes'])
    presentes = {(m, norma(f['cli']), norma(f['mov'])) for m in meses_com
                 for f in con_perdida if f['mes'] == m}
    movidas, perdidas = [], []
    for m in meses_com:
        for f in pub[m]:
            if norma(f['mov']) not in movs_com:
                continue
            if clas_com and f['clas'] not in clas_com:
                continue
            if (m, norma(f['cli']), norma(f['mov'])) in presentes:
                continue
            otros = [x for x in idx_x.get(
                (norma(f['cli']), norma(f['mov']), round(f['per'], 2)), []) if x != m]
            (movidas if otros else perdidas).append((m, f, otros))

    print(u'\n  ¿LAS FILAS QUE FALTAN SE MOVIERON DE MES O SE PERDIERON?')
    print(u'  (el empate exige cliente + movimiento + IMPORTE: con el nombre')
    print(u'   solo, otro evento del mismo cliente se lee como corrimiento)')
    if movidas:
        print(u'  %d se MUEVEN a otro mes — el dinero sigue en el archivo:'
              % len(movidas))
        for m, f, otros in movidas[:10]:
            print(u'     %-11s %-32s $%10s  ->  %s'
                  % (m, f['cli'][:32], format(f['per'], ',.2f'), u', '.join(otros)))
    if perdidas:
        tot = sum(f['per'] for _, f, _ in perdidas)
        print(u'  %d NO aparecen en NINGUN mes del export: $%s ya publicados'
              % (len(perdidas), format(tot, ',.2f')))
        print(u'')
        print(u'  ESO TIENE DOS LECTURAS Y NO SON LO MISMO. No las decide el')
        print(u'  conteo, las decide si el corte viene COMPLETO para ese mes:')
        print(u'')
        print(u'   (a) MADURACION — la cuenta salio del churn porque pago. Es lo')
        print(u'       normal en esta fuente y la regla de negocio lo predice:')
        print(u'       el churn del mes vivo es cartera por cobrar, y septiembre')
        print(u'       2026 tuvo TRES lecturas a la baja. Aqui el export nuevo')
        print(u'       MANDA y regenerar es lo correcto. [[regla-churn-mes-vencido]]')
        print(u'   (b) CORTE TRUNCADO — al export le falta parte del mes. Aqui')
        print(u'       regenerar BORRA perdida real.')
        print(u'')
        # ── EL DISCRIMINADOR ────────────────────────────────────────────────
        #
        # Mirar movimiento por movimiento dentro del mes no sirve: si la
        # cobranza entro en los dos movimientos, ninguno queda identico y un
        # mes perfectamente sano se lee como «truncado». Lo que SI separa las
        # dos lecturas son tres rasgos del corte COMPLETO:
        #
        #   1. que algun mes cuadre AL CENTAVO. Un corte truncado no reproduce
        #      meses enteros exactos; el filtro que lo trunca no respeta la
        #      frontera del mes.
        #   2. que ningun mes GANE filas. La cobranza solo saca del churn. Si
        #      un mes cerrado gana filas, hay reclasificacion en los dos
        #      sentidos y esto no es solo maduracion.
        #   3. que la perdida DECAIGA hacia los meses viejos. Los pagos tardios
        #      llegan por el mes reciente; una perdida repartida a lo tonto, o
        #      mayor en un mes viejo que en el nuevo, no es cobranza.
        porm = collections.Counter(m for m, _, _ in perdidas)
        exactos = [m for m in meses_com if m not in porm]
        ganan = []
        for m in meses_com:
            prs = {(norma(f['cli']), norma(f['mov'])) for f in pub[m]}
            g = [f for f in con_perdida if f['mes'] == m
                 and (norma(f['cli']), norma(f['mov'])) not in prs]
            if g:
                ganan.append((m, len(g), sum(x['per'] + x['per2'] for x in g)))
        # Decaimiento: el mes mas reciente concentra la perdida. `meses_com`
        # sale del .ts, que escribe los meses en orden cronologico.
        recientes = [m for m in meses_com if m in porm]
        decae = bool(recientes) and porm[recientes[-1]] == max(porm.values())

        print(u'  1. meses que cuadran AL CENTAVO: %s'
              % (u', '.join(exactos) if exactos else u'NINGUNO'))
        if ganan:
            print(u'  2. meses que GANAN filas respecto a lo publicado:')
            for m, n, t in ganan:
                print(u'        %-11s +%d fila(s)  $%s' % (m, n, format(t, ',.2f')))
        else:
            print(u'  2. ningun mes gana filas: el corte solo SACA del churn.')
        print(u'  3. perdida por mes (de mas reciente a mas viejo):')
        for m in reversed(recientes):
            t = sum(f['per'] for mm, f, _ in perdidas if mm == m)
            print(u'        %-11s %3d fila(s)   $%s'
                  % (m, porm[m], format(t, ',.2f')))
        print(u'     decae hacia atras: %s' % (u'SI' if decae else u'NO'))
        print(u'')
        if exactos and not ganan and decae:
            print(u'  LOS TRES RASGOS SE CUMPLEN -> lectura (a), MADURACION.')
            print(u'  El export manda y toca regenerar con --conserva.')
        else:
            print(u'  ALGUN RASGO FALLA -> no se puede descartar (b). Pedir un')
            print(u'  corte que traiga los meses completos antes de regenerar.')
        for m, f, _ in sorted(perdidas, key=lambda x: -x[1]['per'])[:8]:
            print(u'        %-11s %-34s %-18s $%s'
                  % (m, f['cli'][:34], f['mov'][:18], format(f['per'], ',.2f')))

print(u'\n  ═══════════════════════════════════════════════════════════')
if fallos:
    print(u'  *** NO CUADRA en: %s' % u', '.join(fallos))
    print(u'  Sale con 1 para que esto SE MIRE, no para prohibir la carga: si')
    print(u'  el bloque de arriba concluye (a) maduracion en cada mes que no')
    print(u'  cuadra, el export manda y toca regenerar con --conserva. Lo que')
    print(u'  no se hace es elegir archivo a dedo sin medir cual de las dos es.')
    sys.exit(1)
print(u'  CUADRA en los %d meses comparables.' % len(meses_com))
if solo_x or solo_p:
    print(u'  (los meses que solo estan en uno de los dos no se comparan,')
    print(u'   y eso se dice arriba en vez de contarse como diferencia)')
