# -*- coding: utf-8 -*-
u"""CONCILIA LA AUDITORIA v3.0 DE GRUPO FRISA CONTRA LAS FUENTES VIVAS.

   Toda cifra del expediente se mide aqui contra su fuente, Y SE COMPRUEBA QUE
   ESTE ESCRITA EN EL ARCHIVO. Son dos fallos distintos: medir bien y publicar
   otra cosa es tan malo como medir mal, y solo el segundo se ve en pantalla.

   Trae CONTROL NEGATIVO: antes de dar verde, le exige a los asertos que
   rechacen un valor falso. Un verificador que concluye exito por defecto es
   peor que no tenerlo. [[feedback-verificar-antes-asegurar]]

   Las credenciales salen de `.env.local` y NO se imprimen.

   USO
       python scripts/concilia-auditoria-frisa.py
"""
import io
import os
import re
import sys
import json
import collections
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CID = '168973'
CONS = 'F16'
EXP = os.path.join(RAIZ, 'app', 'auditoria', 'grupofrisa-data.ts')

fallos = []
_n_ok = [0]


def exige(cond, que, prueba=u''):
    if cond:
        _n_ok[0] += 1
        print(u'  ok   %s%s' % (que, u'   [%s]' % prueba if prueba else u''))
    else:
        fallos.append(que)
        print(u'  ***  %s%s' % (que, u'   [%s]' % prueba if prueba else u''))


def env(c):
    for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')


def trae(ruta):
    r = urllib.request.Request(URL + '/rest/v1/' + ruta,
                               headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
    return json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))


TXT = io.open(EXP, encoding='utf-8').read()


def escrito(aguja, que):
    u"""La cifra tiene que estar EN EL ARCHIVO, no solo salir bien del calculo."""
    exige(aguja in TXT, u'el expediente dice «%s» (%s)' % (aguja, que))


# ── CONTROL NEGATIVO ───────────────────────────────────────────────────────
print(u'\n  ══ CONTROL NEGATIVO ════════════════════════════════════════')
print(u'  Si estos tres NO fallan, los asertos de abajo no valen nada.')
_guardados = list(fallos)
exige(1 == 2, u'(control) 1 == 2 debe FALLAR')
exige('$99,999 al mes' in TXT, u'(control) una cifra inventada NO esta en el expediente')
exige(abs(17909.12 - 13955.0) < 0.01, u'(control) el MRR viejo NO es el nuevo')
nuevos = len(fallos) - len(_guardados)
if nuevos != 3:
    print(u'\n  *** EL CONTROL NEGATIVO NO CAZA LO QUE DEBE (%d de 3).' % nuevos)
    print(u'      `exige` esta roto; nada de lo que siga significa nada.')
    sys.exit(1)
print(u'  control ok · los asertos saben fallar. Se descartan esos 3.')
fallos = list(_guardados)
_n_ok[0] = 0

# ── 1 · IMPORTE ────────────────────────────────────────────────────────────
print(u'\n  ══ IMPORTE · Gross Revenue Facturacion ═════════════════════')
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
mias = [x for x in G['filas'] if str(x.get('cid') or '').strip() == CID]
exige(len(mias) == 2, u'el CID %s tiene DOS lineas en el GRC' % CID, u'%d' % len(mias))
mrr = sum(float(x.get('mrrFin') or 0) for x in mias)
exige(abs(mrr - 17909.12) < 0.01, u'el MRR suma $17,909.12', u'$%.2f' % mrr)
acisa = [x for x in mias if 'ACISA' in (x.get('cliente') or '')]
menor = [x for x in mias if 'ACISA' not in (x.get('cliente') or '')]
exige(len(acisa) == 1 and abs(float(acisa[0]['mrrFin']) - 16009.0) < 0.01,
      u'la linea ACISA son $16,009')
exige(len(menor) == 1 and abs(float(menor[0]['mrrFin']) - 1900.12) < 0.01,
      u'la linea menor son $1,900.12')
exige(all(x.get('clasif') == 'AAA' for x in mias), u'las DOS lineas son AAA')
exige(all(x.get('movimiento') == 'MRR estable' for x in mias),
      u'las DOS son «MRR estable»')
exige(all(float(x.get('perdida') or 0) == 0 for x in mias),
      u'ninguna de las dos declara perdida')
meses_menor = int(float(menor[0].get('meses') or 0))
exige(meses_menor == 152, u'la linea menor acumula 152 meses', u'%d' % meses_menor)
exige(int(float(acisa[0].get('meses') or 0)) == 21, u'la linea ACISA acumula 21 meses')
escrito(u'$17,909', u'el MRR en el expediente')
escrito(u'152 meses', u'la antiguedad real')
escrito(u'12.7 a', u'los 12.7 anos')

# El 12.7: 152/12 = 12.67. Se comprueba el redondeo, no se confia en el texto.
exige(abs(meses_menor / 12.0 - 12.7) < 0.05,
      u'152 meses son 12.7 anos', u'%.2f' % (meses_menor / 12.0))

# ── 2 · LA FICHA Y EL SALTO DE RANGO ───────────────────────────────────────
print(u'\n  ══ FICHA vs GRC, y el lugar en la cartera ══════════════════')
f = trae('cuentas?select=*&consecutivo=eq.' + CONS)[0]
exige(abs(float(f.get('facturacion') or 0) - 1622.0) < 0.01,
      u'`cuentas.facturacion` sigue en $1,622', u'$%s' % f.get('facturacion'))
escrito(u'$1,622', u'la cifra que traia la ficha')
exige(f.get('health_score') == 53, u'Health Score 53', u'%s' % f.get('health_score'))
escrito(u'Health Score 53', u'el HS')
# El rango, con la MISMA regla del tablero (lib/facturacion-cuenta.ts)
por_cid = collections.defaultdict(float)
for x in G['filas']:
    c = str(x.get('cid') or '').strip()
    if c:
        por_cid[c] += float(x.get('mrrFin') or 0)
todas = trae('cuentas?select=consecutivo,cid,facturacion&estado=in.(activo,en_riesgo)')


def imp(c):
    g = por_cid.get(str(c.get('cid') or '').strip(), 0)
    return g if g > 0 else float(c.get('facturacion') or 0)


orden = sorted(todas, key=lambda c: -imp(c))
pos = [i for i, c in enumerate(orden, 1)
       if (c.get('consecutivo') or '').upper() == CONS][0]
exige(pos == 22, u'la cuenta es la #22 por importe', u'#%d de %d' % (pos, len(orden)))
exige(len(orden) == 193, u'el universo son 193 cuentas activo/en_riesgo',
      u'%d' % len(orden))
exige(pos <= 25, u'esta DENTRO del TOP 25')
escrito(u'#22 de 193', u'el lugar')
# Y el lugar que ocuparia con la cifra vieja: es la medida de lo que escondia.
orden_f = sorted(todas, key=lambda c: -float(c.get('facturacion') or 0))
pos_f = [i for i, c in enumerate(orden_f, 1)
         if (c.get('consecutivo') or '').upper() == CONS][0]
exige(pos_f == 139, u'con la cifra de la ficha seria la #139', u'#%d' % pos_f)
exige(abs(pos_f - pos) == 117, u'son 117 lugares de diferencia',
      u'%d' % abs(pos_f - pos))
escrito(u'#139', u'el lugar con la cifra vieja')
escrito(u'117 lugares', u'la diferencia')

# ── 3 · LA RENOVACION ──────────────────────────────────────────────────────
print(u'\n  ══ RENOVACION 2027 ════════════════════════════════════════')
anual = mrr * 12
exige(abs(anual - 214909.44) < 0.5, u'el anualizado son $214,909', u'$%.2f' % anual)
exige(abs(13955.0 * 12 - 167460.0) < 0.5,
      u'los $167,460 del plan viejo son $13,955 x 12')
exige(abs((anual - 167460.0) - 47449.44) < 0.5,
      u'la diferencia son $47,449 al ano', u'$%.2f' % (anual - 167460.0))
escrito(u'$214,909', u'la cifra correcta de la renovacion')
escrito(u'$47,449', u'lo que se regalaba')

# ── 4 · LAS HORAS ──────────────────────────────────────────────────────────
#
# El 390 y el 45 NO salen de una fuente estructurada: los declaro el PM en la
# reunion del 28 oct. Asi que lo que se puede comprobar es (a) que la reunion
# existe y lo dice, y (b) que la aritmetica del expediente cierra.
print(u'\n  ══ HORAS ═══════════════════════════════════════════════════')
reu = trae('reuniones?select=*&cuenta_id=eq.' + f['id'] + '&order=fecha.desc')
exige(len(reu) == 1, u'hay UNA reunion registrada', u'%d' % len(reu))
acta = u' '.join((reu[0].get(k) or u'') for k in
                 ('resumen', 'acuerdos', 'proximos_pasos')) if reu else u''
exige(u'trescientas noventa horas' in acta,
      u'el acta del 28 oct dice «trescientas noventa horas»')
exige(u'ciento sesenta horas' in acta,
      u'el acta dice «ciento sesenta horas» de estimacion')
exige(u'cuarenta y cinco horas' in acta,
      u'el acta dice «cuarenta y cinco horas» del proactivo')
exige(390 - (160 + 65) == 165,
      u'160 estimadas + 65 de saldo = 225; 390 - 225 = 165 fuera de presupuesto')
escrito(u'390', u'las horas trabajadas')
escrito(u'165 HORAS FUERA DE TODO PRESUPUESTO', u'el exceso, en mayusculas')
# La tarifa es una DEDUCCION y el expediente tiene que decirlo con esa palabra.
exige(abs(65800.0 / 65 - 1012.3) < 0.1, u'$65,800 / 65 h = $1,012/h')
exige(u'ES UNA DEDUCCI' in TXT,
      u'el expediente marca la tarifa como DEDUCCION, no como dato')
# Y el ultimo status que vio el cliente, que esta en los seguimientos.
seg = trae('seguimientos?select=fecha,descripcion&cuenta_id=eq.' + f['id'])
h159 = [s for s in seg if '159/160' in (s.get('descripcion') or '')]
exige(len(h159) == 1 and str(h159[0]['fecha'])[:10] == '2026-06-02',
      u'el ultimo reporte con 159/160 esta en el seguimiento del 2026-06-02',
      u'%s' % (str(h159[0]['fecha'])[:10] if h159 else u'no esta'))
# `fecha` viene con marca de tiempo («2026-06-02T00:00:00»), asi que comparar
# la cadena entera contra '2026-06-02' da True para el propio 2 de junio y la
# comprobacion se acusaba a si misma. Se recorta a 10 antes de comparar — es el
# mismo recorte que usa el resto del guion.
posteriores = [s for s in seg
               if '/160' in (s.get('descripcion') or '')
               and str(s['fecha'])[:10] > '2026-06-02']
exige(not posteriores,
      u'NO hay ningun reporte de horas posterior al 2 de junio',
      u'%d posterior(es)' % len(posteriores))
exige(len([s for s in seg if '/160' in (s.get('descripcion') or '')]) == 4,
      u'los reportes con /160 son CUATRO: 150, 155, 157 y 159')

# ── 5 · LLAMADAS ───────────────────────────────────────────────────────────
print(u'\n  ══ LLAMADAS ════════════════════════════════════════════════')
d = None
for linea in io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'),
                     encoding='utf-8'):
    m = re.match(r'\s*"' + CID + r'":\s*(\{.*\}),\s*$', linea)
    if m:
        d = json.loads(m.group(1)); break
exige(d is not None, u'hay lectura de llamadas para el CID')
e, s = d['ent'], d['sal']
exige(e['total'] == 1827, u'1,827 entrantes', u'%d' % e['total'])
exige(e['lost'] == 161, u'161 sin contestar', u'%d' % e['lost'])
exige(abs(100.0 * e['lost'] / e['total'] - 8.81) < 0.01, u'8.81% de perdida')
exige(s['total'] == 6803, u'6,803 salientes', u'%d' % s['total'])
exige(s['noCon'] == 3267, u'3,267 que no conectaron', u'%d' % s['noCon'])
exige(abs(100.0 * s['noCon'] / s['total'] - 48.02) < 0.01, u'48.02% no conecta')
exige(abs(6803 / 1872.0 - 3.63) < 0.02,
      u'el volumen saliente se multiplico por 3.6 desde la v2.0 (1,872)')
cer, base = d['cerrado'], d['base']
pc, pb = 100.0 * cer['l'] / cer['t'], 100.0 * base['l'] / base['t']
exige(abs(pc - 4.78) < 0.01, u'el mes cerrado (ago) pierde 4.78%', u'%.4f%%' % pc)
exige(abs(pb - 9.30) < 0.01, u'su base propia es 9.30%', u'%.4f%%' % pb)
exige(pc < pb, u'el mes cerrado esta MEJOR que su base')
exige(abs((pc - pb) + 4.52) < 0.01, u'la mejora son 4.52 puntos',
      u'%.2f' % (pc - pb))
escrito(u'4.78%', u'el mes cerrado')
escrito(u'9.30%', u'la base propia')
# Destinos que contestan el 0%
ceros = [x for x in e['dest'] if x['c'] == 0 and x['l'] > 0]
perd0 = sum(x['l'] for x in ceros)
exige(perd0 == 41, u'41 perdidas en destinos que contestan el 0%%', u'%d' % perd0)
exige(abs(100.0 * perd0 / e['lost'] - 25.5) < 0.1,
      u'son el 25.5%% de las perdidas', u'%.1f%%' % (100.0 * perd0 / e['lost']))
exige(len(ceros) == 3, u'son TRES destinos', u'%d' % len(ceros))
escrito(u'25.5%', u'la proporcion de perdidas en destinos ciegos')
# Los destinos del AV
av = [x for x in e['dest'] if 'AV Frisa' in x['d'] or x['d'] == 'Agente Virtual']
exige(len(av) == 2, u'hay DOS destinos de AV')
av_ll = sum(x['l'] + x['c'] for x in av)
av_min = sum(x.get('min', 0) for x in av)
exige(av_ll == 451, u'451 llamadas al AV', u'%d' % av_ll)
exige(av_min == 664, u'664 minutos al AV', u'%d' % av_min)
escrito(u'451 llamadas y 664 minutos', u'el trafico del AV')
# Fin de semana
dow = e['dow']
fds = dow[5] + dow[6]
exige(fds == 279, u'279 llamadas en sabado y domingo', u'%d' % fds)
exige(abs(100.0 * fds / e['total'] - 15.3) < 0.1, u'el 15.3%% del trafico')
exige(abs(100.0 * e['dowL'][6] / dow[6] - 13.1) < 0.1,
      u'el domingo pierde 13.1%%')

# ── 6 · CORTES DE FACTURACION ──────────────────────────────────────────────
print(u'\n  ══ CORTES · la contradiccion del consumo ═══════════════════')
from openpyxl import load_workbook
wb = load_workbook(os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
                   data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(x or u'').strip() for x in next(it)]
ix = {c: i for i, c in enumerate(cab)}
cortes = [r for r in it if str(r[ix['CID']] or '').strip() == CID]
exige(len(cortes) == 10, u'el corte trae DIEZ filas del CID', u'%d' % len(cortes))
exige(all('AV 1,000 min' in str(r[ix['Nombre del Plan']] or '') for r in cortes),
      u'las diez son del plan «AV 1,000 min Agente Virtual»')
exige(all(float(r[ix['Minutos Incluidos']] or 0) == 1 for r in cortes),
      u'las diez traen «Minutos Incluidos» = 1')
exige(all(float(r[ix['Minutos Consumidos']] or 0) == 0 for r in cortes),
      u'las diez traen CERO minutos consumidos')
exige(av_min > 0,
      u'y el archivo de llamadas si registra minutos: LA CONTRADICCION EXISTE',
      u'%d min' % av_min)
escrito(u'0 minutos consumidos', u'el cero del corte')


def mes_de(v):
    import datetime
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m')
    if isinstance(v, (int, float)):
        return (datetime.date(1899, 12, 30)
                + datetime.timedelta(days=int(v))).strftime('%Y-%m')
    return str(v or u'')[:7]


meses = sorted(mes_de(r[ix['Fecha de corte']]) for r in cortes)
exige('2026-06' not in meses, u'junio 2026 NO esta en la serie de cortes')
escrito(u'falta junio', u'el hueco de la serie')
PANEL = ['Menú Configuracion', 'Reportes', 'Call History',
         'Visit Inbound', 'Visit Outbound', 'My extension']


def visitas(r):
    return sum(float(r[ix[c]] or 0) for c in PANEL if c in ix)


porm = {mes_de(r[ix['Fecha de corte']]): visitas(r) for r in cortes}
exige(porm.get('2026-05') == 84, u'mayo tuvo 84 visitas al panel (el pico)',
      u'%s' % porm.get('2026-05'))
exige(porm.get('2026-09') == 1, u'septiembre tuvo UNA visita',
      u'%s' % porm.get('2026-09'))
exige(porm.get('2026-10') == 0, u'octubre, cero')
exige(abs(100.0 * (84 - 1) / 84 - 98.8) < 0.1,
      u'la caida de mayo a septiembre es del 98.8%%')
exige(all(float(r[ix['Desarrolladores']] or 0) == 0 for r in cortes),
      u'cero visitas a la seccion Desarrolladores en los diez cortes')
escrito(u'98.8%', u'la caida del panel')
# Y el registro de adopcion, que dice lo contrario
ad = trae('adopcion_producto?select=producto,nivel,fecha&cuenta_id=eq.' + f['id'])
panel_alto = [x for x in ad if 'Panel' in (x.get('producto') or '')
              and x.get('nivel') == 'alto']
exige(len(panel_alto) == 1 and str(panel_alto[0]['fecha'])[:7] == '2026-09',
      u'la adopcion declara «Panel: alto» con fecha de SEPTIEMBRE')

# ── 7 · MESA DE AYUDA ──────────────────────────────────────────────────────
print(u'\n  ══ MESA DE AYUDA ══════════════════════════════════════════')
tix = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'),
                        encoding='utf-8'))
t = [x for x in tix if str(x.get('cid') or '').strip() == CID]
exige(len(t) == 41, u'41 tickets cerrados', u'%d' % len(t))
dur = sorted(float(x['duracion_hrs']) for x in t)
exige(abs(dur[len(dur) // 2] - 284.0) < 0.1, u'mediana 284 h',
      u'%.1f' % dur[len(dur) // 2])
exige(abs(284.0 / 24 - 11.8) < 0.05, u'284 h son 11.8 dias')
exige(abs(sum(dur) / len(dur) - 474.6) < 0.1, u'media 474.6 h')
exige(abs(dur[-1] - 2679.1) < 0.2, u'el peor, 2,679 h', u'%.1f' % dur[-1])
exige(abs(2679.1 / 24 - 111.6) < 0.5 and int(2679.1 / 24) == 111,
      u'2,679 h son ~112 dias', u'%.1f d' % (2679.1 / 24))
mas7 = sum(1 for x in dur if x > 168)
exige(mas7 == 26, u'26 tickets de mas de 7 dias', u'%d' % mas7)
exige(abs(100.0 * mas7 / len(t) - 63.4) < 0.1, u'el 63.4%% del total')
fal = [x for x in t if x['es_falla'] == 'Si']
exige(len(fal) == 6, u'SEIS fallas del servicio', u'%d' % len(fal))
exige(all(x['producto'] == 'Chat' for x in fal),
      u'las SEIS son de Chat — NINGUNA de voz')
exige(not any(x['producto'] == 'Voz' for x in fal), u'cero fallas de voz')
low = sum(1 for x in t if x.get('prioridad') == 'Low')
exige(low == 37, u'37 tickets en prioridad «Low»', u'%d' % low)
peor = [x for x in t if float(x['duracion_hrs']) == dur[-1]][0]
exige(peor.get('prioridad') == 'Low',
      u'el peor ticket (#%s, 112 dias) esta en «Low»' % peor['num'])
exige(peor['num'] == '105789', u'el peor es el #105789', peor['num'])
pao = sum(1 for x in t if x['propietario'] == 'Paola B.')
exige(pao == 22, u'Paola B. lleva 22 de los 41', u'%d' % pao)
exige(abs(100.0 * pao / len(t) - 53.7) < 0.1, u'el 53.7%%')
purga = [x for x in t if '2026-08-07' <= x['cierre'][:10] <= '2026-08-12']
exige(len(purga) == 8, u'8 tickets cerrados entre el 7 y el 12 de agosto',
      u'%d' % len(purga))
hp = sum(float(x['duracion_hrs']) for x in purga)
exige(abs(hp - 8601.0) < 1.5, u'arrastran 8,601 h de antiguedad', u'%.0f' % hp)
exige(sum(1 for x in purga if x['cierre'][:10] == '2026-08-07') == 6,
      u'SEIS de ellos el mismo 7 de agosto')
ag = sum(1 for x in t if x['cierre'][:7] == '2026-08')
exige(ag == 16, u'16 cierres en agosto', u'%d' % ag)
duda = sum(1 for x in t if x['subcategoria'] == 'Duda Operativa (chat)')
exige(duda == 8, u'8 tickets de «Duda Operativa (chat)»', u'%d' % duda)
exige(abs(100.0 * duda / len(t) - 19.5) < 0.1, u'el 19.5%%')
ups = [x for x in t if 'Upsale' in x['subcategoria']]
exige(len(ups) == 2, u'DOS tickets de Upsale')
peor_ups = max(ups, key=lambda x: float(x['duracion_hrs']))
exige(abs(float(peor_ups['duracion_hrs']) - 1225.0) < 1,
      u'el de voz duro 1,225 h', u'%s' % peor_ups['duracion_hrs'])
exige(int(1225 / 24) == 51, u'1,225 h son 51 dias')
exige(peor_ups['propietario'] == 'Fátima G.', u'y su dueno es Fátima G.')
chat = sum(1 for x in t if x['producto'] == 'Chat')
exige(chat == 26, u'26 de chat y 15 de voz', u'%d chat' % chat)
escrito(u'LAS SEIS FALLAS DE PLATAFORMA SON DE CHAT', u'el hallazgo de la mesa')
escrito(u'8,601 horas', u'la purga de agosto')
escrito(u'NO MEDIBLE', u'los tickets abiertos')

# ── 8 · ALERTAS ────────────────────────────────────────────────────────────
print(u'\n  ══ ALERTAS ════════════════════════════════════════════════')
ep = trae('alertas_episodios?select=condicion,tipo,severidad_actual,abierto_en'
          '&cuenta_id=eq.' + f['id'] + '&estado=eq.abierta')
exige(len(ep) == 2, u'DOS alertas abiertas', u'%d' % len(ep))
tipos = {x['tipo'] for x in ep}
exige(tipos == {'sin_consumo_medible', 'sac_fallas_recurrentes'},
      u'son `sin_consumo_medible` y `sac_fallas_recurrentes`',
      u', '.join(sorted(tipos)))
med = [x for x in ep if x['tipo'] == 'sin_consumo_medible'][0]
exige(med['severidad_actual'] == 'critica', u'la de medicion es CRITICA')
exige(str(med['abierto_en'])[:10] == '2026-10-06', u'abierta el 6 de octubre')
mesa = [x for x in ep if x['tipo'] == 'sac_fallas_recurrentes'][0]
exige(mesa['severidad_actual'] == 'alta', u'la de mesa es ALTA')
exige(str(mesa['abierto_en'])[:10] == '2026-10-12', u'abierta el 12 de octubre')
# La familia decide que el expediente NO pueda ir en verde.
cat = io.open(os.path.join(RAIZ, 'lib', 'alertas.ts'), encoding='utf-8').read()
blo = cat[cat.index('sac_fallas_recurrentes: {'):]
exige("familia: 'riesgo'" in blo[:300],
      u'`sac_fallas_recurrentes` es familia RIESGO en el catalogo')
exige(u"estado: 'en_riesgo'" in TXT,
      u'y por eso el expediente va en `en_riesgo`, no en `activo`')
exige(u'con fallas abiertas no se propone nada' in blo[:900],
      u'su accion dice «con fallas abiertas no se propone nada»')
exige(u'con fallas abiertas no se propone nada' in TXT,
      u'y el expediente la cita literal')

# ── 9 · DIDs, CONTACTO Y RELACION ──────────────────────────────────────────
print(u'\n  ══ DIDs, contacto y relacion ══════════════════════════════')
D = json.load(io.open(os.path.join(RAIZ, 'data', 'dids.json'), encoding='utf-8'))
p = D['porCid']
exige(len(p.get(CID, [])) == 1, u'el CID %s tiene UN solo numero' % CID,
      u'%d' % len(p.get(CID, [])))
exige(p[CID][0]['n'] == '525588544458', u'y es el 525588544458',
      p[CID][0]['n'])
exige(len(p.get('171', [])) == 5, u'el CID 171 tiene CINCO numeros')
etq = [x['e'] for x in p.get('171', [])]
exige(sum(1 for x in etq if 'FRISA' in x.upper()) == 2,
      u'dos de ellos etiquetados FRISA')
exige(not trae('cuentas?select=id&cid=eq.171'),
      u'el CID 171 NO existe en `cuentas`')
escrito(u'525588544458', u'el unico DID')
escrito(u'CID 171', u'el legacy')
exige((f.get('contacto_email') or '') == 'aromero@grupofrisa.com',
      u'la ficha trae `aromero@grupofrisa.com`')
corr = [s for s in seg if 'jaromero@grupofrisa.com' in (s.get('descripcion') or '')]
exige(len(corr) >= 3,
      u'y el cliente firma desde `jaromero@` en varios correos',
      u'%d seguimiento(s)' % len(corr))
escrito(u'jaromero@grupofrisa.com', u'el correo correcto')
exige(any(ord(ch) == 0x202c for ch in (f.get('contacto_tel') or '')),
      u'el telefono trae el caracter de control U+202C')
escrito(u'U+202C', u'el caracter invisible')
exige(len(seg) == 17, u'17 seguimientos', u'%d' % len(seg))
rad = trae('radar_respuestas?select=id&cuenta_id=eq.' + f['id'])
exige(len(rad) == 1, u'Radar: 1 de 12')
exige(reu[0].get('tipo') == 'cliente'
      and 'FRISA' not in (reu[0].get('participantes') or '').upper(),
      u'la unica reunion es tipo «cliente» y no tiene a nadie del cliente dentro')
act = trae('actividades?select=id&cuenta_id=eq.' + f['id'])
exige(len(act) == 1, u'UNA sola actividad en 20 meses')

# ── 10 · LO QUE EL EXPEDIENTE NO DEBE AFIRMAR ──────────────────────────────
print(u'\n  ══ LO QUE NO SE PUEDE AFIRMAR ══════════════════════════════')
for mal, por in [
    (u'tickets abiertos: 0', u'la fuente no mide abiertos'),
    (u'$167,460 MXN/año asegurado', u'esa cifra sale del MRR viejo'),
]:
    exige(mal not in TXT, u'NO dice «%s» (%s)' % (mal, por))

# LAS CIFRAS VIEJAS NO SE PROHIBEN, SE OBLIGAN A LLEVAR SU CORRECCION AL LADO.
#
# Dos intentos fallidos antes de este, y los dos enseñan algo:
#
#   1. Prohibir «$13,955» a secas. Fallo contra un texto CORRECTO: la cronologia
#      lo cita para decir que la v3.0 lo corrige. Borrar la cita habria
#      escondido el error anterior, que es justo lo que una auditoria no hace.
#   2. Exigir palabras de correccion («corrige», «viejo») en 200 caracteres.
#      Fallo contra «la cifra de $167,460 está 19% abajo», que lleva su
#      correccion pegada pero con otras palabras. Ampliar la ventana hasta que
#      pasara habria sido ajustar el umbral al resultado.
#
# La regla buena no depende de mi vocabulario: UNA CIFRA SUPERADA NUNCA APARECE
# SIN UNA DE LAS CIFRAS CORREGIDAS EN EL MISMO TEXTO. Y la unidad no es un
# numero de caracteres, es la frase — aqui, el literal de cadena que la
# contiene. [[feedback-probar-al-reves]]
CORREGIDAS = (u'$17,909', u'$214,909', u'$47,449')


def literal_que_contiene(texto, i):
    u"""El literal '...' de TypeScript donde cae la posicion i."""
    def suelta(pos):          # una comilla escapada no abre ni cierra
        return pos == 0 or texto[pos - 1] != '\\'
    a = i
    while a > 0:
        a -= 1
        if texto[a] == "'" and suelta(a):
            break
    b = i
    while b < len(texto) - 1:
        b += 1
        if texto[b] == "'" and suelta(b):
            break
    return texto[a + 1:b]


# Control: el recorte tiene que aislar de verdad una frase de la siguiente.
_demo = u"a: 'el MRR son $13,955 y nada mas', b: 'el bueno son $17,909'"
exige(u'$17,909' not in literal_que_contiene(_demo, _demo.index(u'$13,955')),
      u'(control) el recorte NO se lleva la frase vecina')
exige(not any(c in literal_que_contiene(_demo, _demo.index(u'$13,955'))
              for c in CORREGIDAS),
      u'(control) una cita suelta de la cifra vieja CAE')
_demo2 = u"a: 'publicaba $13,955 y el bueno son $17,909'"
exige(any(c in literal_que_contiene(_demo2, _demo2.index(u'$13,955'))
          for c in CORREGIDAS),
      u'(control) una cita con su correccion PASA')

for vieja, nombre in [(u'$13,955', u'el MRR de la v2.0'),
                      (u'$167,460', u'la renovacion mal calculada')]:
    malas, total = [], 0
    for m in re.finditer(re.escape(vieja), TXT):
        total += 1
        frase = literal_que_contiene(TXT, m.start())
        if not any(c in frase for c in CORREGIDAS):
            malas.append(frase[:90].replace('\n', ' '))
    exige(not malas,
          u'las %d citas de %s (%s) llevan su correccion en la misma frase'
          % (total, vieja, nombre),
          u'%d suelta(s)%s' % (len(malas), u': «%s…»' % malas[0] if malas else u''))
exige(u'ES UNA DEDUCCI' in TXT and u'$1,012' in TXT,
      u'la tarifa aparece siempre marcada como deduccion')
exige(u'NO MEDIBLE' in TXT, u'dice con palabras lo que no se puede medir')

# ── 11 · LAS TRES CIFRAS DE HORAS TIENEN QUE RECONCILIAR ───────────────────
#
# El expediente maneja tres excesos distintos y los tres son correctos:
#
#     230 = 390 - 160        exceso sobre la ESTIMACION
#     165 = 390 - (160 + 65) exceso sobre lo AUTORIZADO (estimacion + saldo)
#     231 = 390 - 159        horas trabajadas DESPUES del ultimo reporte
#
# Leidos en pantalla uno tras otro no se distinguen: la raiz decia «las 230
# horas de exceso» y el hallazgo de la mesa «las 165 horas», sin que nada
# dijera que miden cosas distintas. Eso es una contradiccion interna, que es
# el detector mas barato que hay. [[feedback-auditorias-verificar]]
#
# La regla: una cifra de exceso nunca aparece sola. Quien la cite tiene que
# traer en la MISMA frase la referencia contra la que se mide.
exige(390 - 160 == 230, u'390 - 160 = 230 (exceso sobre la estimacion)')
exige(390 - (160 + 65) == 165, u'390 - 225 = 165 (exceso sobre lo autorizado)')
exige(390 - 159 == 231, u'390 - 159 = 231 (trabajadas tras el ultimo reporte)')

# Control: una cita de 230 sin su referencia tiene que CAER, y con ella PASAR.
_d3 = u"a: 'las 230 horas de exceso se repiten', b: 'estimacion de 160'"
exige(u'160' not in literal_que_contiene(_d3, _d3.index(u'230')),
      u'(control) una cita suelta de 230 CAE')
_d4 = u"a: 'las 230 de exceso sobre la estimacion de 160, 165 sin autorizar'"
exige(all(x in literal_que_contiene(_d4, _d4.index(u'230')) for x in (u'160', u'165')),
      u'(control) una cita de 230 con sus dos referencias PASA')

for cifra, acompanan, por_que in [
        (u'230', (u'160', u'165'), u'contra que estima y como cierra con 165'),
        (u'231', (u'159',),        u'contra que reporte se mide')]:
    malas, total = [], 0
    for m in re.finditer(r'\b' + cifra + r'\b', TXT):
        frase = literal_que_contiene(TXT, m.start())
        if not frase.strip():
            continue          # no esta dentro de un literal: es codigo
        total += 1
        if not all(a in frase for a in acompanan):
            malas.append(frase[max(0, frase.index(cifra) - 60):][:110]
                         .replace('\n', ' '))
    exige(total > 0, u'el expediente cita %s en algun literal' % cifra)
    exige(not malas,
          u'las %d citas de %s dicen %s' % (total, cifra, por_que),
          u'%d suelta(s)%s' % (len(malas), u': «%s…»' % malas[0] if malas else u''))

# ── VEREDICTO ──────────────────────────────────────────────────────────────
print(u'\n  ' + u'=' * 64)
print(u'  %d comprobaciones en verde.' % _n_ok[0])
if fallos:
    print(u'\n  *** %d FALLO(S):' % len(fallos))
    for x in fallos:
        print(u'      · %s' % x)
    sys.exit(1)
print(u'  La auditoria v3.0 de GRUPO FRISA cierra contra sus fuentes.\n')
