"""Genera app/cuentas/llamadas-data.ts desde TODOS los archivos de llamadas.

   Dos entregas con criterio distinto, que NO se solapan (verificado: 0 CIDs en
   común) y que juntas cubren 148 de las 219 cuentas con asesor y CID:

     · corte «0-40»  — clientes con consumo de 0 a 40% de su plan.  86 CIDs.
     · corte «40+»   — el resto de la cartera medida.               62 CIDs.

   ── LAS COLUMNAS NO SON IGUALES ENTRE ARCHIVOS ─────────────────────────────
   Por eso todo se resuelve POR NOMBRE DE COLUMNA y nunca por posición:
     · la empresa viene como `empresa`, `Nombre Empresa` o `Nombre de Empresa`
     · «Entrantes Mayor consumo 40 Parte 1» NO trae `destination_data_1`: trae
       `src`. Son 799,999 filas del 20 may al 14 sep —el 45% de las entrantes
       del corte 40+— sin destino. Esas filas van a un bucket propio,
       «(destino no venía en el archivo)», y NO al de «(sin destino
       registrado)»: una cosa es que la llamada no llegara a ninguna extensión
       y otra que la columna no se haya exportado. Confundirlas inventaría un
       hallazgo de configuración que nadie midió.

   ── LO QUE NO SE USA ───────────────────────────────────────────────────────
   «Salientes Mayor consumo 40 Parte 2» es copia byte a byte de la Parte 1
   (mismas 900,000 filas, mismos 54 CIDs, mismo hash, filas idénticas a toda
   profundidad; ambas traen la hoja `xaa`, que es lo que deja `split`). Se lee
   UNA sola vez: sumarlas duplicaría cada llamada saliente de 54 cuentas.

   ── VENTANAS DISTINTAS POR FUENTE ──────────────────────────────────────────
   Las entrantes del corte 40+ cubren del 1 ene al 14 sep, pero sus salientes
   arrancan el 9 de abril: al archivo le falta el tramo anterior. Cada cuenta
   guarda la ventana real de cada dirección para que la pantalla pueda decirlo
   en vez de dar por hecho que ausencia es cero.
"""
import sys, io, os, re, json, unicodedata, datetime, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl
# Los nombres llegan con la codificación rota desde el origen («Bit√°cora»).
# El mismo helper lo usa gen-analisis-llamadas.py: los dos paneles tienen que
# decir lo mismo del mismo destino.
from _texto_roto import arregla, reporte as reporteTexto
# `ruta()` ABORTA si falta la fuente. Ver scripts/_fuentes.py.
from _fuentes import ruta

ARCH = r"D:\Archivos"
SALIDA = r"D:\Windows\Projects\callpicker-cs\app\cuentas\llamadas-data.ts"

# ── FUSIONA, NO REEMPLAZA ─────────────────────────────────────────────────
#
# Con `FUSIONA`, los CID que YA estan en `llamadas-data.ts` y que esta corrida
# no vuelve a ver se CONSERVAN tal cual.
#
# No es una comodidad: es lo unico correcto aqui. Medido el 12 oct 2026 con
# `scripts/mide-cobertura-llamadas-nueva.py`, la entrega nueva trae 67 CIDs y
# la base tiene 162. Correr el generador como siempre —reescribiendo todo—
# dejaria la cobertura en 42 cuentas y **143 cuentas perderian su lectura,
# $1,202,271 al mes**. Fusionando sube de 147 a 185.
#
# Y los archivos viejos YA NO ESTAN en disco, asi que no hay forma de
# recalcularlos: conservarlos es la unica via.
#
# Instruccion de direccion, 12 oct 2026: «si hay alguna que ya existe solo
# omite y continua».
#
# Se cumple en lo que esa frase protege —no duplicar, no romper lo que ya
# funciona— pero con UNA desviacion, dicha en voz alta: los 4 CID que vienen
# en las dos entregas se reescriben con la NUEVA, no se omiten. La razon es
# que la ventana nueva es un superconjunto estricto de la vieja: las dos
# arrancan el 1 ene 2026 y la nueva llega al 12 oct en vez de al 14 sep.
# Omitirlos dejaria a esas cuatro cuentas un mes atrasadas teniendo el dato
# en la mano, que es la unica forma de que esta carga empeore algo.
FUSIONA = True

# (archivo, direccion, corte)
#
# Entrega de octubre 2026. Las anteriores —«Clientes AAA Poco Consumo» y
# «Mayor consumo 40»— ya no estan en disco; sus cuentas sobreviven por
# `FUSIONA`.
#
# «Llamadas Salientes 3ra Parte (1).xlsx» NO entra: es copia byte a byte de
# la «3ra Parte» —mismo sha1 `02d03a625c0b2bef`, mismas 840,939 filas, mismos
# 5 CIDs—. El «(1)» es el sufijo que pone Windows al descargar dos veces.
# Sumarla habria duplicado cada llamada saliente de esos 5 CIDs, que es
# exactamente lo que ya paso con la «Parte 2» de la entrega anterior.
FUENTES = [
    ('Llamadas Entrantes CIDs particulares.xlsx', 'ent', 'oct-2026'),
    ('Llamadas Salientes 1ra Parte.xlsx',         'sal', 'oct-2026'),
    ('Llamadas Salientes 2da Parte.xlsx',         'sal', 'oct-2026'),
    ('Llamadas Salientes 3ra Parte.xlsx',         'sal', 'oct-2026'),
    ('Llamadas Salientes 4ta Parte.xlsx',         'sal', 'oct-2026'),
]

SIN_DESTINO = '(sin destino registrado)'
NO_EXPORTADO = '(destino no venía en el archivo)'
TOP_DESTINOS = 8
RAZON = r'\b(s\.?a\.?p\.?i\.?|s\.?a\.?|s\.?\s?de\s?r\.?l\.?|c\.?v\.?|de\s?c\.?v\.?|sc|sofom|e\.?n\.?r\.?|spr|rl)\b'

ALIAS = {
    'tipo':    ['destination_type'],
    'fecha':   ['date'],
    'cid':     ['customer_id'],
    'empresa': ['empresa', 'Nombre Empresa', 'Nombre de Empresa'],
    'destino': ['destination_data_1'],
    'caller':  ['caller_id'],
    'minutos': ['total_minutes'],
}


def norma(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    s = s.replace('&', ' y ')
    s = re.sub(r'[.,()\-_/]', ' ', s)
    s = re.sub(RAZON, ' ', s)
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def cid_de(v):
    if v is None:
        return ''
    if isinstance(v, float) and float(v).is_integer():
        return str(int(v))
    s = str(v).strip()
    return '' if s.upper() == 'NULL' else s


def mins(v):
    if v is None:
        return 0.0
    s = str(v).strip()
    if s == '' or s.upper() == 'NULL':
        return 0.0
    try:
        return float(s)
    except Exception:
        return 0.0


def texto(v):
    s = str(v or '').strip()
    return '' if s.upper() == 'NULL' else s


def nueva():
    return {
        'empresa': collections.Counter(), 'cortes': set(),
        'ent': {'total': 0, 'lost': 0, 'lostSinNum': 0,
                'meses': collections.defaultdict(collections.Counter),
                'dow': collections.Counter(), 'dowL': collections.Counter(),
                'hora': collections.Counter(), 'horaL': collections.Counter(),
                'dest': collections.defaultdict(lambda: {'l': 0, 'c': 0, 'm': 0.0, 'n': set(),
                                                           'redir': 0, 'ivr': 0, 'buzon': 0}),
                'desde': None, 'hasta': None, 'sinCol': 0},
        'sal': {'total': 0, 'noCon': 0, 'meses': collections.defaultdict(collections.Counter),
                'desde': None, 'hasta': None},
    }


DATOS = collections.defaultdict(nueva)

for arch, dire, corte in FUENTES:
    # `ruta()` ABORTA si falta. Ver el motivo en gen-analisis-llamadas.py: un
    # `continue` silencioso aqui produce una salida completa y vacia.
    camino = ruta(arch)
    wb = openpyxl.load_workbook(camino, data_only=True, read_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    cab = [str(c).strip() if c is not None else '' for c in next(it)]
    ix = {}
    for k, nombres in ALIAS.items():
        ix[k] = next((cab.index(n) for n in nombres if n in cab), None)
    falta = [k for k in ('tipo', 'fecha', 'cid') if ix[k] is None]
    if falta:
        raise SystemExit('%s: faltan columnas obligatorias %s' % (arch, falta))
    print('%-46s %s · %s · destino=%s' % (arch[:46], dire, corte,
                                          'si' if ix['destino'] is not None else 'NO'))
    n = 0
    for r in it:
        n += 1
        if n % 400000 == 0:
            print('    ... %s' % format(n, ','))
        cid = cid_de(r[ix['cid']])
        if not cid:
            continue
        v = DATOS[cid]
        v['cortes'].add(corte)
        if ix['empresa'] is not None:
            e = arregla(texto(r[ix['empresa']]))
            if e:
                v['empresa'][e] += 1
        t = texto(r[ix['tipo']]) or 'Desconocido'
        f = r[ix['fecha']]
        iso = f.strftime('%Y-%m-%d') if isinstance(f, datetime.datetime) else str(f)[:10]
        mes = iso[:7] if len(iso) >= 7 else ''

        if dire == 'ent':
            d = v['ent']
            d['total'] += 1
            if ix['destino'] is not None:
                # Se repara ANTES de usarlo como llave, para que «Bit√°cora 1»
                # y «Bitácora 1» dejen de ser dos destinos distintos.
                dest = arregla(texto(r[ix['destino']])) or SIN_DESTINO
            else:
                dest = NO_EXPORTADO
                d['sinCol'] += 1
            dd = d['dest'][dest]
            dd['m'] += mins(r[ix['minutos']]) if ix['minutos'] is not None else 0.0
            if t == 'Lost':
                d['lost'] += 1
                dd['l'] += 1
                num = texto(r[ix['caller']]) if ix['caller'] is not None else ''
                if num:
                    dd['n'].add(num)
                else:
                    d['lostSinNum'] += 1
            else:
                dd['c'] += 1
                # Mismo desglose que en gen-analisis-llamadas.py, y por el mismo
                # motivo: `c` es «todo lo que no fue Lost» y mete el buzón dentro
                # de lo que la ficha rotulaba «Contestadas». Ver ahí el detalle.
                if t == 'Voicemail':
                    dd['buzon'] += 1
                elif t == 'Self_service':
                    dd['ivr'] += 1
                else:
                    dd['redir'] += 1
            if mes:
                d['meses'][mes][t] += 1
                d['meses'][mes]['total'] += 1
            if isinstance(f, datetime.datetime):
                d['dow'][f.weekday()] += 1
                d['hora'][f.hour] += 1
                if t == 'Lost':
                    d['dowL'][f.weekday()] += 1
                    d['horaL'][f.hour] += 1
            if iso and iso != 'None':
                if d['desde'] is None or iso < d['desde']:
                    d['desde'] = iso
                if d['hasta'] is None or iso > d['hasta']:
                    d['hasta'] = iso
        else:
            d = v['sal']
            d['total'] += 1
            # Lost_by_agent se suma a «no conecto»: el archivo no define que la
            # distingue de Lost y no se le inventa un significado propio.
            noCon = t in ('Lost', 'Lost_by_agent')
            if noCon:
                d['noCon'] += 1
            if mes:
                d['meses'][mes]['total'] += 1
                if noCon:
                    d['meses'][mes]['noCon'] += 1
            if iso and iso != 'None':
                if d['desde'] is None or iso < d['desde']:
                    d['desde'] = iso
                if d['hasta'] is None or iso > d['hasta']:
                    d['hasta'] = iso
    wb.close()
    print('    %s filas' % format(n, ','))

# ── Armado ──────────────────────────────────────────────────────────────────
todas = [x for v in DATOS.values() for x in (v['ent']['hasta'], v['sal']['hasta']) if x]
CORTE = max(todas)
MESES = sorted({m for v in DATOS.values() for m in list(v['ent']['meses']) + list(v['sal']['meses']) if m})

MES_CERRADO = None
for m in reversed(MESES):
    y, mm = int(m[:4]), int(m[5:7])
    ultimoDia = (datetime.date(y + (mm == 12), (mm % 12) + 1, 1) - datetime.timedelta(days=1)).isoformat()
    if CORTE >= ultimoDia:
        MES_CERRADO = m
        break
BASE_FIN = MESES[MESES.index(MES_CERRADO) - 1] if MES_CERRADO and MESES.index(MES_CERRADO) > 0 else None
print()
print('corte del archivo : %s' % CORTE)
print('meses             : %s → %s' % (MESES[0], MESES[-1]))
print('ultimo mes CERRADO: %s · base hasta: %s' % (MES_CERRADO, BASE_FIN))

salida = {}
for cid in sorted(DATOS):
    v = DATOS[cid]
    e, s = v['ent'], v['sal']
    emp = v['empresa'].most_common(1)[0][0] if v['empresa'] else ''

    dest = []
    if e['total']:
        ordenados = sorted(e['dest'].items(), key=lambda x: -x[1]['l'])
        for especial in (SIN_DESTINO, NO_EXPORTADO):
            x = e['dest'].get(especial)
            if x and x['l'] > 0:
                dest.append({'d': especial, 'l': x['l'], 'c': x['c'], 'min': round(x['m']),
                             'n': len(x['n']), 'redir': x['redir'], 'ivr': x['ivr'], 'buzon': x['buzon']})
        conNombre = [(d, x) for d, x in ordenados if d not in (SIN_DESTINO, NO_EXPORTADO) and x['l'] > 0]
        for d, x in conNombre[:TOP_DESTINOS]:
            dest.append({'d': d, 'l': x['l'], 'c': x['c'], 'min': round(x['m']),
                         'n': len(x['n']), 'redir': x['redir'], 'ivr': x['ivr'], 'buzon': x['buzon']})
        resto = conNombre[TOP_DESTINOS:]
        if resto:
            dest.append({'d': 'otros destinos', 'l': sum(x['l'] for _, x in resto),
                         'c': sum(x['c'] for _, x in resto),
                         'min': round(sum(x['m'] for _, x in resto)), 'n': -1,
                         'redir': sum(x['redir'] for _, x in resto), 'ivr': sum(x['ivr'] for _, x in resto), 'buzon': sum(x['buzon'] for _, x in resto), 'otros': len(resto)})

        # ── EL CUBO QUE FALTABA, Y POR QUÉ NO ES UN DETALLE ──────────────────
        #
        # Todo lo de arriba filtra `x['l'] > 0`: un destino que nunca perdió una
        # llamada no sale, porque la tabla responde «a dónde se fueron las no
        # contestadas». Correcto para la tabla y FALSO para la aritmética, y el
        # viejo assert no lo veía porque sólo comprobaba `l`: a los renglones
        # tirados les sobra justo l=0, así que cerraba trivialmente.
        #
        # Medido el 7 oct 2026 sobre la cartera, sumando destinos contra la
        # verdad de los contadores mensuales:
        #
        #     redir   1,652,004 de 1,683,879    falta  1.89%
        #     ivr       359,617 de   367,365    falta  2.11%
        #     buzon      16,167 de    25,429    falta 36.42%   ← aquí
        #
        # El desvío NO es proporcional, y esa es la trampa: un destino que sólo
        # buzonea rara vez registra un Lost, así que el filtro se come más de un
        # tercio del buzón. Quien revisara esto «a ojo» con el 2% de las otras
        # dos columnas se equivocaría 18 veces. Y `buzon` es justo el campo que
        # se agregó para medir lo que señaló Daniel.
        #
        # Así que el complemento entra como un renglón más. No se esconde en un
        # campo aparte: la tabla tiene que CERRAR, y de paso dice algo que vale
        # leer — estos destinos contestaron todo lo que les entró.
        # Ver [[feedback-tablas-deben-cerrar]].
        sinPerdida = [(d, x) for d, x in ordenados if x['l'] == 0]
        if sinPerdida:
            # `n` es 0 y NO -1. En los otros buckets el -1 significa «no se
            # puede saber», porque unir conjuntos de numeros distintos sumando
            # inventaria un conteo. Aqui si se sabe: `n` cuenta los numeros que
            # quedaron SIN CONTESTAR y estos destinos no perdieron ninguna, asi
            # que son cero medidos. Poner -1 diria «no se sabe» de algo que se
            # sabe, que es el error simetrico al de colapsar a cero lo no
            # medido. Ver [[feedback-cero-sin-medicion]].
            dest.append({'d': 'destinos sin ninguna perdida', 'l': 0,
                         'c': sum(x['c'] for _, x in sinPerdida),
                         'min': round(sum(x['m'] for _, x in sinPerdida)), 'n': 0,
                         'redir': sum(x['redir'] for _, x in sinPerdida),
                         'ivr': sum(x['ivr'] for _, x in sinPerdida),
                         'buzon': sum(x['buzon'] for _, x in sinPerdida),
                         'otros': len(sinPerdida)})

        # El cierre, en los CUATRO cortes y no sólo en `l`. Un assert que no
        # puede fallar es peor que ninguno: da luz verde.
        tot = collections.Counter()
        for mv in e['meses'].values():
            tot.update(mv)
        for campo, verdad in (('l', e['lost']),
                              ('c', e['total'] - e['lost']),
                              ('redir', tot.get('Redirected', 0)),
                              ('ivr', tot.get('Self_service', 0)),
                              ('buzon', tot.get('Voicemail', 0))):
            suma = sum(x[campo] for x in dest)
            assert suma == verdad, ('destinos no cierran en CID %s: %s suma %d y '
                                    'deberia ser %d' % (cid, campo, suma, verdad))

    me = {m: {'t': mv['total'], 'l': mv.get('Lost', 0), 'r': mv.get('Redirected', 0),
              's': mv.get('Self_service', 0), 'v': mv.get('Voicemail', 0)}
          for m, mv in sorted(e['meses'].items())}
    ms = {m: {'t': mv['total'], 'n': mv.get('noCon', 0)} for m, mv in sorted(s['meses'].items())}

    cerrado = me.get(MES_CERRADO) if MES_CERRADO else None
    prevs = [x for m, x in me.items() if BASE_FIN and m <= BASE_FIN]

    salida[cid] = {
        'cid': cid, 'empresa': emp, 'norm': norma(emp),
        'corte': sorted(v['cortes'])[0] if v['cortes'] else '',
        # HASTA CUANDO SE MIRO ESTA CUENTA, y cual es su ultimo mes COMPLETO.
        # Van por cuenta y no solo en `meta` porque desde el 12 oct 2026
        # conviven dos añadas: la vieja corta el 14 sep y esta el 12 oct. Con
        # un corte global unico, las 143 cuentas conservadas aparecerian con
        # hasta 28 dias de silencio inventado y varias cruzarian el umbral de
        # 30 que las declara «en silencio». Ver `LlamadasCuenta.hasta`.
        'hasta': CORTE, 'mesCerrado': MES_CERRADO,
        'ent': ({'total': e['total'], 'lost': e['lost'], 'meses': me,
                 'dow':  [e['dow'].get(i, 0) for i in range(7)],
                 'dowL': [e['dowL'].get(i, 0) for i in range(7)],
                 'hora':  [e['hora'].get(h, 0) for h in range(24)],
                 'horaL': [e['horaL'].get(h, 0) for h in range(24)],
                 'dest': dest, 'primera': e['desde'], 'ultima': e['hasta'],
                 'lostSinNum': e['lostSinNum'], 'sinCol': e['sinCol']} if e['total'] else None),
        'sal': ({'total': s['total'], 'noCon': s['noCon'], 'meses': ms,
                 'desde': s['desde'], 'ultima': s['hasta']} if s['total'] else None),
        'cerrado': ({'t': cerrado['t'], 'l': cerrado['l']} if cerrado else None),
        'base': {'t': sum(x['t'] for x in prevs), 'l': sum(x['l'] for x in prevs)},
        'ultima': max([x for x in (e['hasta'], s['hasta']) if x], default=None),
    }

# ── LA FUSION ─────────────────────────────────────────────────────────────
#
# Lo que esta corrida NO vio se conserva. Ver `FUSIONA` arriba para por que es
# lo unico correcto: los archivos de las entregas anteriores ya no estan en
# disco, asi que reescribir la salida borraria 143 cuentas sin forma de
# recuperarlas.
#
# A los registros conservados se les PONE `hasta` y `mesCerrado` con los
# valores de la meta vieja. Dejarlos sin el campo los haria caer al corte
# global —que ahora es octubre— y eso es justo el silencio inventado que este
# campo existe para evitar.
conservados = 0
if FUSIONA and os.path.exists(SALIDA):
    viejo = io.open(SALIDA, encoding='utf-8').read()
    mm = re.search(r'export const LLAMADAS_META: LlamadasMeta = (\{.*?\})\n', viejo)
    metaVieja = json.loads(mm.group(1)) if mm else {}
    corteViejo = metaVieja.get('corte')
    mesViejo = metaVieja.get('mesCerrado')
    # El objeto va con UNA CUENTA POR LINEA, asi que se lee linea a linea en
    # vez de parsear 300 KB de TypeScript.
    for linea in viejo.split('\n'):
        m = re.match(r'\s*"([^"]+)":\s*(\{.*\}),\s*$', linea)
        if not m:
            continue
        cid, cuerpo = m.group(1), m.group(2)
        if cid in salida:
            continue           # la entrega nueva manda: ventana superconjunto
        try:
            reg = json.loads(cuerpo)
        except ValueError:
            print('  !! no pude leer el registro conservado %s' % cid)
            continue
        reg.setdefault('hasta', corteViejo)
        reg.setdefault('mesCerrado', mesViejo)
        salida[cid] = reg
        conservados += 1
    print('\nfusion: %d registro(s) conservados de la entrega anterior '
          '(corte %s)' % (conservados, corteViejo))

    # Y los que vienen en las DOS: direccion dijo «si hay alguna que ya existe
    # solo omite y continua», asi que se queda la lectura vieja. Se nombran
    # para que la decision se vea, en vez de desaparecer dentro del conteo.
    repetidos = sorted(set(re.findall(r'\s*"([^"]+)":\s*\{', viejo)) & set(DATOS))
    if repetidos:
        print('       %d CID(s) venian en las dos entregas y se '
              'REESCRIBIERON con la nueva: %s' % (len(repetidos), ', '.join(repetidos)))

META = {
    'corte': CORTE, 'mesCerrado': MES_CERRADO, 'baseFin': BASE_FIN, 'meses': MESES,
    'cuentas': len(salida),
    # El rótulo se DERIVA de los cortes que de verdad hay. Estaba escrito a
    # mano —«dos entregas: clientes con consumo de 0 a 40%…»— y dejó de ser
    # verdad en cuanto entró la tercera. Un pie de método que miente es peor
    # que ninguno: es lo que alguien lee justo cuando duda de la cifra.
    'fuente': 'Llamadas entrantes y salientes de Callpicker · %d entrega(s): %s'
              % (len(set(v['corte'] for v in salida.values())),
                 ', '.join(sorted(set(v['corte'] for v in salida.values() if v['corte'])))),
    'entTotal': sum(v['ent']['total'] for v in salida.values() if v['ent']),
    'entLost':  sum(v['ent']['lost']  for v in salida.values() if v['ent']),
    'salTotal': sum(v['sal']['total'] for v in salida.values() if v['sal']),
    'salNoCon': sum(v['sal']['noCon'] for v in salida.values() if v['sal']),
}
META['baseEnt'] = round(100 * META['entLost'] / max(META['entTotal'], 1), 1)
META['baseSalCon'] = round(100 * (META['salTotal'] - META['salNoCon']) / max(META['salTotal'], 1), 1)

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
with io.open(SALIDA, 'w', encoding='utf-8', newline='\n') as f:
    f.write('/* GENERADO por scripts/gen-llamadas-data.py — NO editar a mano.\n')
    f.write(' * %s\n' % META['fuente'])
    f.write(' * Corte: %s · ultimo mes cerrado: %s · %d cuentas.\n' % (CORTE, MES_CERRADO, len(salida)))
    f.write(' * %s entrantes / %s salientes.\n'
            % (format(META['entTotal'], ','), format(META['salTotal'], ',')))
    f.write(' */\n')
    f.write("import type { LlamadasCuenta, LlamadasMeta } from '@/lib/llamadas-cuenta'\n\n")
    f.write('export const LLAMADAS_META: LlamadasMeta = %s\n\n' % json.dumps(META, ensure_ascii=False))
    f.write('export const LLAMADAS: Record<string, LlamadasCuenta> = {\n')
    for cid, v in salida.items():
        f.write('  %s: %s,\n' % (json.dumps(cid), json.dumps(v, ensure_ascii=False, separators=(',', ':'))))
    f.write('}\n')

print()
print('escrito %s (%.0f KB)' % (SALIDA, os.path.getsize(SALIDA) / 1024))
print('  cuentas   : %d' % len(salida))
print('  entrantes : %s · no contestadas %s (%.1f%%)'
      % (format(META['entTotal'], ','), format(META['entLost'], ','), META['baseEnt']))
print('  salientes : %s · conectaron %.1f%%' % (format(META['salTotal'], ','), META['baseSalCon']))
sc = sum(v['ent']['sinCol'] for v in salida.values() if v['ent'])
print('  filas entrantes sin columna de destino: %s (%.1f%%)' % (format(sc, ','), 100 * sc / max(META['entTotal'], 1)))
por = collections.Counter(v['corte'] for v in salida.values())
print('  por corte de consumo: %s' % dict(por))
reporteTexto('nombres con codificación reparada')
