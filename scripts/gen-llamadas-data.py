"""Genera app/cuentas/llamadas-data.ts desde los dos archivos de llamadas.

   Mismo patron que gen-chat-data.py: una pasada por archivo, se agrega por CID
   y se vuelca a un .ts estatico. En runtime no se lee un solo renglon de las
   1,541,124 llamadas.

   ── POR QUE NO SE REUSA analiza-llamadas.py ────────────────────────────────
   Aquel script fue de reconocimiento y tiene dos defectos que aqui NO se
   repiten, ambos detectados al revisar el diseno contra los datos:
     · truncaba los destinos con .most_common(15), asi que restar el top-15 del
       total daba 44.8% de «sin destino» en vez del 41.5% real. Aqui el bucket
       «(sin destino registrado)» tiene su propio contador y hay un bucket
       explicito «otros destinos» que cierra la suma.
     · guardaba solo los marginales de dia y hora, sin las CONTESTADAS ni los
       MINUTOS por destino — que es justo lo que sostiene la compuerta del
       destino por confirmar.

   ── LA COMPUERTA DEL DESTINO POR CONFIRMAR ─────────────────────────────────
   D2 «Grupo System ooapas» marca 99.7% sin contestar y las 2,625 van al destino
   llamado «Agente Virtual OOAPAS». Publicarlo como falla seria una falsa alarma.
   La forma de detectarlo NO es leer el nombre: un filtro de palabras clave marco
   «CLAUDIA ROMAN» como agente virtual porque contiene la subcadena "ia ".
   Lo que si distingue es la estructura: un destino que nunca sostuvo una
   conversacion. Medido sobre el archivo completo:
       solo concentracion (>=50% de lo no contestado, >=200) -> 25 destinos, 24 falsos positivos
       + contestadas == 0 y minutos == 0                     ->  1 destino,   0 falsos positivos
   Por eso este generador emite `cont` y `min` por destino. La regla vive en
   lib/llamadas-cuenta.ts; aqui solo se emiten los hechos.

   ── CONCILIACION ───────────────────────────────────────────────────────────
   Por instruccion de direccion, el modulo se detona por CID O por nombre de
   cliente. Se emite `empresa` tal como viene en el archivo y su forma
   normalizada `norm`, para que lib pueda cruzar por cualquiera de las dos.
   Hoy las dos rutas dan las mismas 86 cuentas; el nombre existe para cuando un
   CID se capture mal. Unica discrepancia viva: C9, «Neruc Sede Central» en la
   cartera contra «Grupo Neruc» en el archivo, mismo CID 73660.
"""
import sys, io, os, re, json, unicodedata, datetime, collections
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

ENT = r"C:\Users\manni\OneDrive\Escritorio\Llamadas_entrantes_Clientes_AAA_Poco_Consumo_Actualizado.xlsx"
SAL = r"C:\Users\manni\OneDrive\Escritorio\Llamadas Salientes Clientes AAA Poco Consumo.xlsx"
SALIDA = r"D:\Windows\Projects\callpicker-cs\app\cuentas\llamadas-data.ts"

SIN_DESTINO = '(sin destino registrado)'
TOP_DESTINOS = 8
RAZON = r'\b(s\.?a\.?p\.?i\.?|s\.?a\.?|s\.?\s?de\s?r\.?l\.?|c\.?v\.?|de\s?c\.?v\.?|sc|sofom|e\.?n\.?r\.?|spr|rl)\b'


def norma(s):
    """Forma normalizada para conciliar por nombre. Conservadora: solo quita
       acentos, puntuacion y sufijos de razon social."""
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


# ── ENTRANTES ───────────────────────────────────────────────────────────────
def nueva_ent():
    return {
        'empresa': collections.Counter(),
        'meses': collections.defaultdict(collections.Counter),
        'dow': collections.Counter(), 'dowL': collections.Counter(),
        'hora': collections.Counter(), 'horaL': collections.Counter(),
        'dest': collections.defaultdict(lambda: {'l': 0, 'c': 0, 'm': 0.0, 'n': set()}),
        'primera': None, 'ultima': None,
        'lostSinNum': 0, 'lost': 0, 'total': 0,
    }


print('=== ENTRANTES ===')
wb = openpyxl.load_workbook(ENT, data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() for c in next(it)]
ix = {c: k for k, c in enumerate(cab)}
ENTR = collections.defaultdict(nueva_ent)
n = 0
for r in it:
    n += 1
    if n % 250000 == 0:
        print('  ... %s' % format(n, ','))
    cid = cid_de(r[ix['customer_id']])
    if not cid:
        continue
    v = ENTR[cid]
    t = texto(r[ix['destination_type']]) or 'Desconocido'
    d = texto(r[ix['destination_data_1']]) or SIN_DESTINO
    e = texto(r[ix['empresa']])
    if e:
        v['empresa'][e] += 1
    dd = v['dest'][d]
    dd['m'] += mins(r[ix['total_minutes']])
    v['total'] += 1
    if t == 'Lost':
        v['lost'] += 1
        dd['l'] += 1
        num = texto(r[ix['caller_id']])
        if num:
            dd['n'].add(num)
        else:
            v['lostSinNum'] += 1
    else:
        dd['c'] += 1
    f = r[ix['date']]
    if isinstance(f, datetime.datetime):
        mes = f.strftime('%Y-%m')
        v['meses'][mes][t] += 1
        v['meses'][mes]['total'] += 1
        v['dow'][f.weekday()] += 1
        v['hora'][f.hour] += 1
        if t == 'Lost':
            v['dowL'][f.weekday()] += 1
            v['horaL'][f.hour] += 1
        iso = f.strftime('%Y-%m-%d')
        if v['primera'] is None or iso < v['primera']:
            v['primera'] = iso
        if v['ultima'] is None or iso > v['ultima']:
            v['ultima'] = iso
wb.close()
print('  %s filas · %d CIDs' % (format(n, ','), len(ENTR)))

# ── SALIENTES ───────────────────────────────────────────────────────────────
print('=== SALIENTES ===')
wb = openpyxl.load_workbook(SAL, data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab2 = [str(c).strip() for c in next(it)]
ix2 = {c: k for k, c in enumerate(cab2)}
SALI = collections.defaultdict(lambda: {'meses': collections.defaultdict(collections.Counter),
                                        'total': 0, 'noCon': 0, 'ultima': None})
n = 0
for r in it:
    n += 1
    if n % 250000 == 0:
        print('  ... %s' % format(n, ','))
    cid = cid_de(r[ix2['customer_id']])
    if not cid:
        continue
    v = SALI[cid]
    t = texto(r[ix2['destination_type']]) or 'Desconocido'
    # Lost_by_agent (3,138 · 0.4%) se suma a «no conecto». El archivo no define
    # que la distingue de Lost, asi que no se le inventa un significado propio.
    noCon = t in ('Lost', 'Lost_by_agent')
    v['total'] += 1
    if noCon:
        v['noCon'] += 1
    f = r[ix2['date']]
    if isinstance(f, datetime.datetime):
        mes = f.strftime('%Y-%m')
        v['meses'][mes]['total'] += 1
        if noCon:
            v['meses'][mes]['noCon'] += 1
        iso = f.strftime('%Y-%m-%d')
        if v['ultima'] is None or iso > v['ultima']:
            v['ultima'] = iso
wb.close()
print('  %s filas · %d CIDs' % (format(n, ','), len(SALI)))

# ── ARMADO ──────────────────────────────────────────────────────────────────
CORTE = max([v['ultima'] for v in ENTR.values() if v['ultima']] +
            [v['ultima'] for v in SALI.values() if v['ultima']])
MESES = sorted({m for v in ENTR.values() for m in v['meses']} |
               {m for v in SALI.values() for m in v['meses']})
MES_CERRADO = None
for m in reversed(MESES):
    # el mes del corte esta incompleto salvo que el corte caiga en su ultimo dia
    y, mm = int(m[:4]), int(m[5:7])
    ultimoDia = (datetime.date(y + (mm == 12), (mm % 12) + 1, 1) - datetime.timedelta(days=1)).isoformat()
    if CORTE >= ultimoDia:
        MES_CERRADO = m
        break
print()
print('corte del archivo : %s' % CORTE)
print('meses             : %s' % ', '.join(MESES))
print('ultimo mes CERRADO: %s' % MES_CERRADO)

BASE_FIN = MESES[MESES.index(MES_CERRADO) - 1] if MES_CERRADO and MESES.index(MES_CERRADO) > 0 else None

salida = {}
for cid in sorted(set(ENTR) | set(SALI)):
    e, s = ENTR.get(cid), SALI.get(cid)
    emp = e['empresa'].most_common(1)[0][0] if (e and e['empresa']) else ''

    dest = []
    if e:
        ordenados = sorted(e['dest'].items(), key=lambda x: -x[1]['l'])
        # el bucket sin destino va SIEMPRE y primero; nunca compite por el top
        sd = e['dest'].get(SIN_DESTINO)
        if sd and sd['l'] > 0:
            dest.append({'d': SIN_DESTINO, 'l': sd['l'], 'c': sd['c'], 'min': round(sd['m']), 'n': len(sd['n'])})
        conNombre = [(d, v) for d, v in ordenados if d != SIN_DESTINO and v['l'] > 0]
        for d, v in conNombre[:TOP_DESTINOS]:
            dest.append({'d': d, 'l': v['l'], 'c': v['c'], 'min': round(v['m']), 'n': len(v['n'])})
        resto = conNombre[TOP_DESTINOS:]
        if resto:
            dest.append({'d': 'otros destinos', 'l': sum(v['l'] for _, v in resto),
                         'c': sum(v['c'] for _, v in resto),
                         'min': round(sum(v['m'] for _, v in resto)), 'n': -1,
                         'otros': len(resto)})
        # cierre de la suma: lo listado debe igualar el total de no contestadas
        assert sum(x['l'] for x in dest) == e['lost'], 'destinos no cierran en CID %s' % cid

    def mesesEnt():
        out = {}
        for m in MESES:
            v = e['meses'].get(m) if e else None
            if not v:
                continue
            out[m] = {'t': v['total'], 'l': v.get('Lost', 0), 'r': v.get('Redirected', 0),
                      's': v.get('Self_service', 0), 'v': v.get('Voicemail', 0)}
        return out

    def mesesSal():
        out = {}
        for m in MESES:
            v = s['meses'].get(m) if s else None
            if not v:
                continue
            out[m] = {'t': v['total'], 'n': v.get('noCon', 0)}
        return out

    me = mesesEnt()
    cerrado = me.get(MES_CERRADO) if MES_CERRADO else None
    prevs = [v for m, v in me.items() if BASE_FIN and m <= BASE_FIN]
    baseT = sum(v['t'] for v in prevs)
    baseL = sum(v['l'] for v in prevs)

    salida[cid] = {
        'cid': cid,
        'empresa': emp,
        'norm': norma(emp),
        'ent': ({
            'total': e['total'], 'lost': e['lost'],
            'meses': me,
            'dow':  [e['dow'].get(i, 0) for i in range(7)],
            'dowL': [e['dowL'].get(i, 0) for i in range(7)],
            'hora':  [e['hora'].get(h, 0) for h in range(24)],
            'horaL': [e['horaL'].get(h, 0) for h in range(24)],
            'dest': dest,
            'primera': e['primera'], 'ultima': e['ultima'],
            'lostSinNum': e['lostSinNum'],
        } if e else None),
        'sal': ({'total': s['total'], 'noCon': s['noCon'], 'meses': mesesSal(), 'ultima': s['ultima']} if s else None),
        'cerrado': ({'t': cerrado['t'], 'l': cerrado['l']} if cerrado else None),
        'base': {'t': baseT, 'l': baseL},
        'ultima': max([x for x in [e['ultima'] if e else None, s['ultima'] if s else None] if x], default=None),
    }

META = {
    'corte': CORTE,
    'mesCerrado': MES_CERRADO,
    'baseFin': BASE_FIN,
    'meses': MESES,
    'cuentas': len(salida),
    'fuente': 'Clientes AAA Poco Consumo — llamadas entrantes y salientes',
    'entTotal': sum(v['ent']['total'] for v in salida.values() if v['ent']),
    'entLost': sum(v['ent']['lost'] for v in salida.values() if v['ent']),
    'salTotal': sum(v['sal']['total'] for v in salida.values() if v['sal']),
    'salNoCon': sum(v['sal']['noCon'] for v in salida.values() if v['sal']),
}
META['baseEnt'] = round(100 * META['entLost'] / max(META['entTotal'], 1), 1)
META['baseSalCon'] = round(100 * (META['salTotal'] - META['salNoCon']) / max(META['salTotal'], 1), 1)

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
with io.open(SALIDA, 'w', encoding='utf-8', newline='\n') as f:
    f.write('/* GENERADO por scripts/gen-llamadas-data.py — NO editar a mano.\n')
    f.write(' * Fuente: %s\n' % META['fuente'])
    f.write(' * Corte del archivo: %s · ultimo mes cerrado: %s\n' % (CORTE, MES_CERRADO))
    f.write(' * %s entrantes / %s salientes en %d cuentas.\n'
            % (format(META['entTotal'], ','), format(META['salTotal'], ','), len(salida)))
    f.write(' */\n')
    f.write('import type { LlamadasCuenta, LlamadasMeta } from '
            "'@/lib/llamadas-cuenta'\n\n")
    f.write('export const LLAMADAS_META: LlamadasMeta = %s\n\n'
            % json.dumps(META, ensure_ascii=False))
    f.write('export const LLAMADAS: Record<string, LlamadasCuenta> = {\n')
    for cid, v in salida.items():
        f.write('  %s: %s,\n' % (json.dumps(cid), json.dumps(v, ensure_ascii=False, separators=(',', ':'))))
    f.write('}\n')

print()
print('escrito %s (%.0f KB)' % (SALIDA, os.path.getsize(SALIDA) / 1024))
print('  entrantes %s · no contestadas %s (%.1f%%)'
      % (format(META['entTotal'], ','), format(META['entLost'], ','), META['baseEnt']))
print('  salientes %s · conectaron %.1f%%' % (format(META['salTotal'], ','), META['baseSalCon']))
print('  cuentas: %d' % len(salida))
sinDest = sum(x['l'] for v in salida.values() if v['ent'] for x in v['ent']['dest'] if x['d'] == SIN_DESTINO)
print('  sin destino registrado: %s de %s no contestadas (%.1f%%)'
      % (format(sinDest, ','), format(META['entLost'], ','), 100 * sinDest / max(META['entLost'], 1)))
