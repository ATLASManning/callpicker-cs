# -*- coding: utf-8 -*-
"""Replica lib/focos-riesgo.ts y dice QUE sale el lunes, cuenta por cuenta.

   POR QUE EXISTE
   --------------
   Sin Node no hay forma de ejecutar el TypeScript, y esta regla toca la carga de
   trabajo de tres personas y tiene un candado que no se puede equivocar: **churn
   confirmado NO genera actividad SAC** (instruccion expresa de direccion, 25 sep
   2026). Estas actividades se saltan `evaluarElegibilidad` a proposito, asi que
   si el candado falla, se le manda trabajo de retencion a cuentas ya perdidas.

   QUE COMPRUEBA
   -------------
     1. Que ninguna cuenta en churn confirmado o cancelacion entre.
     2. Que el lote sea de DIEZ por asesor y por semana.
     3. Que la escalera CRUCE: si `cuenta_id` del JSON no coincide con
        `cuentas.id`, cada trabajo sale con la redaccion de «no hay dato» y la
        tarea llega vacia. Es el fallo silencioso mas probable de todo esto.
     4. Que la rotacion de trabajos avance de verdad y no se agote: se simulan
        varias semanas seguidas y se ve que cada cuenta cambie de trabajo.
     5. Que el arranque coincida con la linea base medida — Dan 27 de 54 cuentas
        sin un solo seguimiento, Fatima 10 de 45, Claudia 9 de 36.

   Es de SOLO LECTURA. No escribe en Supabase ni genera actividades.

   USO
   ---
       python scripts/simula-focos.py
       python scripts/simula-focos.py --semanas 6
"""
import glob
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Las mismas constantes que el TS. Si alla cambian, aqui tambien — y el numero
# que imprime este script es el que hay que creer, no el del comentario.
SEGUIMIENTOS_POR_SEMANA = 10      # SEGUIMIENTOS_POR_SEMANA
DIAS_SIN_CONTACTO_LIMITE = 60     # DIAS_SIN_CONTACTO_LIMITE
UMBRAL_USO_BAJO = 40              # el `u < 40` de la clase uso_bajo
TRABAJOS = ['relacion', 'decisores', 'tickets', 'factura', 'datos', 'crecimiento']
ORDEN_FOCO = ['nunca_tocada', 'sin_contacto', 'uso_bajo', 'auditoria',
              'soporte', 'sin_corte', 'rotacion']

SEMANAS = 4
if '--semanas' in sys.argv:
    SEMANAS = int(sys.argv[sys.argv.index('--semanas') + 1])

HOY = datetime(2026, 9, 28)   # el lunes que se simula


# ── plan-minutos.ts ──────────────────────────────────────────────────
RX_EXT = re.compile(r'(\d+)\s*(?:extensi[oó]n(?:es)?|ext\b)', re.I)
RX_EXT_ABR = re.compile(r'^(\d+)\s+\S.*\bIL\b', re.I)
RX_SIN_VOZ = re.compile(r'\bchat\b|\bagentes?\s+cp\b|sin\s+saldo|n[uú]meros?\s+virtuales?|whatsapp', re.I)


def base_minutos(plan, incl):
    n = str(plan or '')
    m = RX_EXT.search(n) or RX_EXT_ABR.search(n)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(n) and not ext and incl < 3:
        return None
    if ext and ext > 0:
        return incl if (incl > 0 and incl / ext >= 50) else ext * 1500
    return incl if incl >= 3 else None


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s or '')
                if unicodedata.category(c) != 'Mn').lower()
    return re.sub(r'[^a-z0-9]', '', s)


def num(v):
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(str(v).replace(',', '').strip())
    except (TypeError, ValueError):
        return 0.0


def mes_de(v):
    if isinstance(v, datetime):
        return v.strftime('%Y-%m')
    if isinstance(v, (int, float)):
        return (datetime(1899, 12, 30) + timedelta(days=float(v))).strftime('%Y-%m')
    return str(v or '')[:7]


def ts_strings(ruta, patron):
    try:
        s = io.open(os.path.join(RAIZ, ruta), encoding='utf-8').read()
    except OSError:
        return set()
    return {norm(x) for x in re.findall(patron, s)}


# ── cartera y seguimientos ───────────────────────────────────────────
E = {}
for ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    if '=' in ln and not ln.strip().startswith('#'):
        k, v = ln.split('=', 1)
        E[k.strip()] = v.strip().strip('"').strip("'")
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY']}
B = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def sb(t, p):
    """Paginado. PostgREST corta en mil filas sin avisar."""
    f, o = [], 0
    while True:
        d = json.load(urllib.request.urlopen(
            urllib.request.Request(B + t + '?' + p + '&offset=%d&limit=1000' % o,
                                   headers=H), timeout=60))
        f += d
        if len(d) < 1000:
            return f
        o += 1000


CU = sb('cuentas', 'select=id,consecutivo,empresa,cid,asesor,estado,health_score,'
                   'facturacion,tiene_chat_activo')
SEG = sb('seguimientos', 'select=cuenta_id,fecha')

ultimo_seg = {}
for s in SEG:
    f = str(s.get('fecha') or '')[:10]
    cid_ = s.get('cuenta_id')
    if not f or not cid_:
        continue
    if cid_ not in ultimo_seg or f > ultimo_seg[cid_]:
        ultimo_seg[cid_] = f

# ── churn confirmado y cancelados ────────────────────────────────────
#
# SE REPLICA LA REGLA EXACTA de `NOMBRES_CHURN_GRC` en lib/elegibilidad.ts, y no
# una aproximacion. Antes este script tomaba TODA fila del GRC «por el lado
# seguro», y el resultado era peor que inexacto: excluia 112 cuentas en vez de
# las que de verdad se excluyen, dejaba la cartera viva en 100 y con eso la tabla
# de clases quedaba incomparable con la linea base medida (Dan 27 de 54). Un
# verificador que no reproduce la regla no verifica nada.
#
# Tres cosas que la regla SI hace y hay que copiar:
#   · solo las filas cuyo `movimiento` contiene «Churn confirmado» — un Downgrade
#     sigue siendo cartera viva, y es de las que mas seguimiento necesitan;
#   · el MES EN CURSO no cuenta (regla del 20 sep 2026: el mes vivo son clientes
#     que tardan en pagar, no bajas);
#   · las REACTIVADAS se sacan del churn (TATSA, por instruccion del 9 sep 2026).
_src = io.open(os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts'), encoding='utf-8').read()
# `GRC_MES_EN_CURSO` NO vive en el archivo de datos sino en app/churn/grc-reporte.ts,
# y buscarlo en el equivocado devolvia vacio: el mes vivo dejaba de excluirse sin que
# nada lo dijera. Si el nombre se mueve otra vez, esto revienta a proposito en vez de
# seguir simulando una regla que no es la que corre.
_rep = io.open(os.path.join(RAIZ, 'app', 'churn', 'grc-reporte.ts'), encoding='utf-8').read()
_m = re.search(r"GRC_MES_EN_CURSO\s*(?::[^=]*)?=\s*(?:'([^']*)'|null)", _rep)
if not _m:
    sys.exit('*** No se encontro GRC_MES_EN_CURSO en app/churn/grc-reporte.ts. '
             'La simulacion no puede replicar la regla del mes vivo.')
MES_VIVO = (_m.group(1) or '').lower()

_reac = io.open(os.path.join(RAIZ, 'lib', 'elegibilidad.ts'), encoding='utf-8').read()
_bloque = re.search(r'REACTIVADAS_FUERA_DEL_CHURN[^=]*=\s*new Map\(\[(.*?)\]\)', _reac, re.S)
REACTIVADAS = {norm(x) for x in re.findall(r"\['([^']+)'", _bloque.group(1))} if _bloque else set()

CHURN = set()
for bloque in re.finditer(r"mes:\s*'([^']+)'([\s\S]*?)(?=\n\s*\{\s*mes:|\Z)", _src):
    if MES_VIVO and bloque.group(1).lower() == MES_VIVO:
        continue
    for m in re.finditer(r"cliente:\s*'([^']+)'[^}]*?movimiento:\s*'([^']*)'", bloque.group(2)):
        if 'Churn confirmado' not in m.group(2):
            continue
        n_ = norm(m.group(1))
        if n_ in REACTIVADAS:
            continue
        CHURN.add(n_)
CHURN.discard('')
CANCEL = ts_strings('lib/churn-cancelados-data.ts', r"cliente:\s*'([^']+)'")
print('mes vivo del GRC (no cuenta): %s · nombres en churn confirmado: %d · '
      'reactivadas: %d · cancelados: %d'
      % (MES_VIVO or '[ninguno]', len(CHURN), len(REACTIVADAS), len(CANCEL)))
print()

# ── auditadas en riesgo ──────────────────────────────────────────────
AUD = set()
for f in glob.glob(os.path.join(RAIZ, 'app', 'auditoria', '*-data.ts')):
    s = io.open(f, encoding='utf-8').read()
    e = re.search(r"^  estado:\s+'([^']+)'", s, re.M)
    n_ = re.search(r"^  nombre:\s+'([^']+)'", s, re.M)
    if e and n_ and e.group(1) in ('en_riesgo', 'rescatable', 'en_recuperacion'):
        AUD.add(norm(n_.group(1)))

# ── cortes ───────────────────────────────────────────────────────────
wb = openpyxl.load_workbook(os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
                            data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
idx = {c: i for i, c in enumerate(cab)}
por_cid = defaultdict(list)
for r in it:
    f = {c: (r[i] if i < len(r) else None) for c, i in idx.items()}
    cid = str(f.get('CID') or '').strip()
    if not cid:
        continue
    por_cid[cid].append({
        'mes': mes_de(f.get('Fecha de corte')),
        'cons': num(f.get('Minutos Consumidos')),
        'base': base_minutos(f.get('Nombre del Plan'), num(f.get('Minutos Incluidos'))),
    })
wb.close()
for v in por_cid.values():
    v.sort(key=lambda x: x['mes'])
ULTIMO = max((c['mes'] for v in por_cid.values() for c in v), default='')

# ── tickets por cuenta (mismo cruce que ticketStatsCuenta: por CID) ──
TK = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
tk_por_cid = defaultdict(lambda: {'total': 0, 'fallas': 0})
for t in TK:
    c = str(t.get('cid') or '').strip()
    if not c:
        continue
    tk_por_cid[c]['total'] += 1
    if t.get('es_falla') == 'Si':
        tk_por_cid[c]['fallas'] += 1

# ── la escalera ──────────────────────────────────────────────────────
ESC_POR_ID, ESC_POR_CID = {}, {}
try:
    d = json.load(io.open(os.path.join(RAIZ, 'data', 'crecimiento-escalera.json'),
                          encoding='utf-8'))
    for f in d.get('cuentas', []):
        if f.get('cuenta_id'):
            ESC_POR_ID[str(f['cuenta_id'])] = f
        if f.get('cid'):
            ESC_POR_CID.setdefault(str(f['cid']).strip(), f)
except OSError:
    print('*** data/crecimiento-escalera.json NO EXISTE: los trabajos saldrian vacios.')


# ── la regla ─────────────────────────────────────────────────────────
def clasifica(c):
    """Devuelve (clase, titulo, dias, cruzo_escalera) o None si esta excluida."""
    nm = norm(c['empresa'])
    if nm in CHURN:
        return ('EXCL:churn_grc', None, None, None)
    if nm in CANCEL:
        return ('EXCL:cancelacion', None, None, None)
    est = str(c.get('estado') or '').strip()
    if est not in ('activo', 'en_riesgo'):
        return ('EXCL:estado_' + (est or 'vacio'), None, None, None)

    cid = str(c.get('cid') or '').strip()
    cortes = por_cid.get(cid, [])
    ult_corte = cortes[-1] if cortes else None
    u = None
    if ult_corte and ult_corte['base']:
        u = 100.0 * ult_corte['cons'] / ult_corte['base']

    ult = ultimo_seg.get(c['id'], '')
    dias = None
    if ult:
        dias = (HOY - datetime.strptime(ult, '%Y-%m-%d')).days

    tk = tk_por_cid.get(cid, {'total': 0, 'fallas': 0})

    if not ult:
        clase = 'nunca_tocada'
    elif dias is not None and dias > DIAS_SIN_CONTACTO_LIMITE:
        clase = 'sin_contacto'
    elif u is not None and u < UMBRAL_USO_BAJO:
        clase = 'uso_bajo'
    elif nm in AUD:
        clase = 'auditoria'
    elif tk['total'] >= 15 or tk['fallas'] >= 2:
        clase = 'soporte'
    elif ult_corte and ULTIMO and ult_corte['mes'] < ULTIMO:
        clase = 'sin_corte'
    else:
        clase = 'rotacion'

    cruzo = 'cuenta_id' if c['id'] in ESC_POR_ID else ('cid' if cid in ESC_POR_CID else 'NO')
    return (clase, None, dias, cruzo)


vivas, excluidas = [], Counter()
for c in CU:
    clase, _, dias, cruzo = clasifica(c)
    if clase.startswith('EXCL:'):
        excluidas[clase[5:]] += 1
        continue
    vivas.append({'c': c, 'clase': clase, 'dias': dias, 'cruzo': cruzo,
                  'peso': float(c.get('facturacion') or 0)})

print('=== 1. CANDADO: cuentas EXCLUIDAS antes de cualquier foco ===')
for k, v in excluidas.most_common():
    print('  %-18s %3d' % (k, v))
print('  total excluidas    %3d de %d · quedan vivas %d'
      % (sum(excluidas.values()), len(CU), len(vivas)))
colision = [v for v in vivas if norm(v['c']['empresa']) in CHURN
            or norm(v['c']['empresa']) in CANCEL]
print('  cuentas en churn/cancelacion que SE COLARON: %d  %s'
      % (len(colision), 'OK' if not colision else [v['c']['empresa'] for v in colision]))
print()

# ── 3. ¿cruza la escalera? ───────────────────────────────────────────
print('=== 2. ¿CRUZA LA ESCALERA? (si no, la tarea llega sin numeros) ===')
cr = Counter(v['cruzo'] for v in vivas)
for k in ('cuenta_id', 'cid', 'NO'):
    if cr.get(k):
        print('  %-10s %3d de %d' % (k, cr[k], len(vivas)))
sin_esc = [v['c']['empresa'] for v in vivas if v['cruzo'] == 'NO']
if sin_esc:
    print('  sin fila en la escalera: %s' % (' · '.join(sin_esc[:12])))
    print('  (esas reciben el texto de «no hay dato», no cifras inventadas)')
print()

# ── 4. clases y linea base ───────────────────────────────────────────
print('=== 3. CLASES POR ASESOR (lo que decide el turno) ===')
por_asesor = defaultdict(Counter)
for v in vivas:
    por_asesor[v['c'].get('asesor') or '[sin asesor]'][v['clase']] += 1
enc = '  %-12s' + ' %11s' * len(ORDEN_FOCO) + ' %7s'
print(enc % tuple(['ASESOR'] + [x[:11] for x in ORDEN_FOCO] + ['TOTAL']))
for a in sorted(por_asesor):
    d = por_asesor[a]
    print(enc % tuple([a] + [d.get(k, 0) for k in ORDEN_FOCO] + [sum(d.values())]))
print()
print('  Linea base medida el 25 sep: Dan 27 de 54 sin un solo seguimiento,')
print('  Fatima 10 de 45, Claudia 9 de 36. La columna nunca_tocada debe coincidir.')
print()

# ── 5. la rotacion, semana por semana ────────────────────────────────
print('=== 4. LA ROTACION: %d semanas seguidas, %d por asesor ===' % (SEMANAS, SEGUIMIENTOS_POR_SEMANA))
print('  Se simula el dedup real: la cuenta que sale queda con su actividad')
print('  ABIERTA y no vuelve a salir; al cerrarla, su seguimiento la manda al')
print('  final de la fila. Aqui se asume que SI la cierran (el caso bueno).')
print()

faltas = []
for asesor in sorted(por_asesor):
    mias = [v for v in vivas if (v['c'].get('asesor') or '[sin asesor]') == asesor]
    vueltas = Counter()
    ult_local = dict(ultimo_seg)
    print('  --- %s · %d cuentas vivas ---' % (asesor, len(mias)))
    for semana in range(SEMANAS):
        dia = HOY + timedelta(days=7 * semana)
        # reclasificar con los seguimientos que se fueron registrando
        fila = []
        for v in mias:
            ult = ult_local.get(v['c']['id'], '')
            dias = (dia - datetime.strptime(ult, '%Y-%m-%d')).days if ult else None
            clase = v['clase']
            # la clase de contacto se recalcula; las demas no cambian en 4 semanas
            if not ult:
                clase = 'nunca_tocada'
            elif dias is not None and dias > DIAS_SIN_CONTACTO_LIMITE:
                clase = 'sin_contacto'
            elif v['clase'] in ('nunca_tocada', 'sin_contacto'):
                clase = 'rotacion'   # ya se le hablo: pasa a la cola normal
            fila.append((clase, dias, v))
        fila.sort(key=lambda t: (ORDEN_FOCO.index(t[0]),
                                 -(t[1] if t[1] is not None else 99999),
                                 -t[2]['peso']))
        lote = fila[:SEGUIMIENTOS_POR_SEMANA]
        trabajos = Counter()
        for clase, _, v in lote:
            k = v['c']['id']
            trab = 'relacion' if clase in ('nunca_tocada', 'sin_contacto') \
                else TRABAJOS[vueltas[k] % len(TRABAJOS)]
            trabajos[trab] += 1
            vueltas[k] += 1
            ult_local[k] = dia.strftime('%Y-%m-%d')   # la cerro
        corto = ''
        if len(lote) < SEGUIMIENTOS_POR_SEMANA:
            corto = '  *** SE AGOTO: solo %d de %d' % (len(lote), SEGUIMIENTOS_POR_SEMANA)
            faltas.append(semana + 1)
        print('    semana %d (%s): %2d tareas · %s%s'
              % (semana + 1, dia.strftime('%d %b'), len(lote),
                 ' · '.join('%s %d' % (t, n) for t, n in trabajos.most_common()), corto))
    tocadas = len([k for k in vueltas if vueltas[k] > 0])
    print('    en %d semanas: %d cuentas distintas de %d · %d recibieron mas de un trabajo'
          % (SEMANAS, tocadas, len(mias), sum(1 for k in vueltas if vueltas[k] > 1)))
    print()

print('=== VEREDICTO ===')
if faltas:
    print('  *** La regla SE AGOTA. Semanas con menos de %d tareas: %s'
          % (SEGUIMIENTOS_POR_SEMANA, faltas))
    print('  Eso es precisamente lo que no debe pasar: una cuenta atendida la')
    print('  semana pasada no se queda sin trabajo, le toca OTRO.')
else:
    print('  Las %d semanas salen completas, %d tareas por asesor, sin agotarse.'
          % (SEMANAS, SEGUIMIENTOS_POR_SEMANA))
    print('  Lo que rota no es la lista de cuentas: es el trabajo sobre cada una.')
