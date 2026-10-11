# -*- coding: utf-8 -*-
u"""Concilia el corte de Gross Revenue Churn · Semana 23 (cierre de T3) ANTES de publicarlo.

   POR QUE EXISTE
   --------------
   El corte de la semana 22 se publico despues de conciliarlo contra sus
   propias tablas, y ahi salieron cinco observaciones que el equipo Data no
   habia visto. Esto hace lo mismo con el de la semana 23: se transcriben las
   cifras del correo tal cual y se les exige que CIERREN.

   Un total que no se comprueba se publica igual de bonito que uno que si, y
   nadie se entera hasta que alguien lo cita en una junta.

   QUE SE COMPRUEBA
   ----------------
   1. Que las tres filas mensuales sumen el TOTAL T3 en las cuatro columnas.
   2. Que en CADA mes, Downgrade + Churn Confirmado = Baja Total.
   3. Que el % de GRC de cada mes se reconstruya desde sus dos cifras — no se
      espeja el porcentaje del origen sin rehacer la division.
      Ver [[feedback-metricas-derivadas-origen]].
   4. Que las listas de detalle sumen su total declarado (salidas tempranas,
      downgrades >60%, articulos de CP Chat).
   5. Que el Top 5 de CP Voz NO cierra, y CUANTO deja fuera. Un top-N que tira
      la cola miente sin decirlo. Ver [[feedback-tablas-deben-cerrar]].
   6. Que la base de MRR del correo coincida con `GRC_BASE_MRR` del repo, que
      sale del export institucional. Son dos fuentes independientes.
   7. Que clientes del corte estan en NUESTRA cartera viva.

   El cruce con la cartera es POR NOMBRE porque el correo no trae CIDs, asi que
   es INDICATIVO y no prueba: cruzar por nombre mezcla cuentas
   ([[dids-fuente]]). Se marca para revisar, nunca para mover una cuenta sola.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/concilia-churn-t3.py
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CENT = 0.005          # tolerancia: un centavo

# ── TRANSCRIPCION DEL CORREO (Valeria Zepeda, 7 oct 2026) ───────────────────
MESES = [
    # mes,          MRR inicial,  downgrade,  churn conf.,  baja total,  pct
    (u'Julio',      4943564.29,   25576.75,   69086.46,     94663.21,    1.91),
    (u'Agosto',     5013222.60,   49977.17,   56212.78,     106189.95,   2.12),
    (u'Septiembre', 4949144.17,   55073.67,   100567.96,    155641.63,   3.14),
]
TOTAL_T3 = {'mrr': 14905931.06, 'down': 130627.59, 'churn': 225867.20, 'baja': 356494.79}

TOP5_CANCELACIONES = [
    (u'Bliss crédito libre', 16799.97, 24, u'Julio'),
    (u'TATSA',               11086.00,  4, u'Agosto'),
    (u'Hoteles y Servicios', 10946.98,  2, u'Septiembre'),
    (u'Mas Suites',           7372.98, 70, u'Septiembre'),
    (u'VEMEPE',               6890.00,  1, u'Septiembre'),
]

CP_CHAT_TOTAL = 45452.51
CP_CHAT = [            # el correo dice «los 4 articulos de la categoria»
    (u'Agente CP Chat',            34079.14),
    (u'Agente CP Chat Callcenter', 10313.37),
    (u'paquete Chatbot',            1000.00),
    (u'paquete Whatsapp API',          60.00),
]

CP_VOZ_TOTAL = 437546.55
CP_VOZ_TOP5 = [        # el correo dice «Top 5»: NO es la categoria completa
    (u'paquete Min VyC',      118684.52),
    (u'Extension Callcenter',  78481.64),
    (u'paquete Min CE',        63561.10),
    (u'Extension VyC',         48689.44),
    (u'DiD Nacional',          28487.57),
]

AMPLIO = {'mrr': 14282606.76, 'perdida': 482999.06}

TEMPRANAS_TOTAL = 26808.00
TEMPRANAS = [
    (u'VEMEPE', 6890.00, 1, u'Septiembre'),
    (u'GRUPO GEVHE', 3817.00, 1, u'Julio'),
    (u'RDS ELITE CONDOS PDC SA DE CV', 2387.00, 0, u'Agosto'),
    (u'Delta Capital & Holding Street', 2377.00, 0, u'Julio'),
    (u'Alamo Seguros', 1959.00, 0, u'Julio'),
    (u'syndeX', 1318.00, 1, u'Agosto'),
    (u'IMAGINA SER', 1080.00, 0, u'Septiembre'),
    (u'BLACKNET', 668.00, 0, u'Septiembre'),
    (u'INTERHOME GJ', 519.00, 0, u'Septiembre'),
    (u'Grupo Altiora', 519.00, 0, u'Septiembre'),
    (u'Dios Del Aire CLN', 489.00, 0, u'Julio'),
    (u'Torre Himalaya 24', 489.00, 1, u'Julio'),
    (u'MA-AR TRANSPORTE LOGISTICO', 489.00, 0, u'Julio'),
    (u'DISENSA FC', 489.00, 0, u'Agosto'),
    (u'Sistemas Secuencia', 489.00, 0, u'Agosto'),
    (u'Sport and Therapy', 489.00, 0, u'Agosto'),
    (u'cp188899', 489.00, 0, u'Agosto'),
    (u'COMERCIALIZADORA SIN FRONTERAS', 489.00, 0, u'Agosto'),
    (u'cp189204', 359.00, 1, u'Septiembre'),
    (u'SMUM México', 209.00, 0, u'Septiembre'),
    (u'Rentería Flow& Axis Consulting', 209.00, 0, u'Septiembre'),
    (u'Inmobiliaria Gess 2.17', 195.00, 1, u'Agosto'),
    (u'SGI MEXICO', 195.00, 0, u'Agosto'),
    (u'Denver Medical', 195.00, 0, u'Agosto'),
]

DOWN60_TOTAL = 22399.83
DOWN60 = [
    (u'MEGAVIAL ABOGADOS', 1407.00, 93.43, u'Septiembre'),
    (u'CiberZion', 421.87, 86.27, u'Julio'),
    (u'MIRA DIAMANTE SOLUCLOUD', 1122.00, 82.26, u'Julio'),
    (u'DUNA', 784.00, 80.08, u'Agosto'),
    (u'Artesanal.com.mx', 784.00, 80.08, u'Septiembre'),
    (u'DATA SMART INFORMATIC', 604.00, 75.59, u'Septiembre'),
    (u'INBROTEK SERVICIOS', 6915.96, 71.17, u'Agosto'),
    (u'Zuhma', 340.00, 69.53, u'Agosto'),
    (u'Soluciones Textiles del Norte', 1350.00, 68.91, u'Julio'),
    (u'BAKELGROUP', 320.00, 65.44, u'Julio'),
    (u'Hound Express', 4481.00, 64.01, u'Septiembre'),
    (u'Embler Autopartes', 3281.00, 61.44, u'Agosto'),
    (u'Visualizza', 295.00, 60.20, u'Julio'),
    (u'CASBA Consultoría, Seguridad e Higiene Laboral y Salud Ocupacional', 294.00, 60.12, u'Julio'),
]

fallos, avisos = [], []


def exige(ok, que, detalle=u''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


def nota(txt):
    avisos.append(txt)
    print(u'  ••    %s' % txt)


def mx(n):
    return u'$%s' % format(round(n, 2), ',.2f')


# ── 1 · El resumen trimestral ───────────────────────────────────────────────
print(u'\n  1 · RESUMEN T3 — las tres filas contra el total\n')
for i, nombre in enumerate(('mrr', 'down', 'churn', 'baja')):
    s = sum(m[i + 1] for m in MESES)
    exige(abs(s - TOTAL_T3[nombre]) < CENT,
          u'la columna %-6s suma el TOTAL T3' % nombre,
          u'%s contra %s declarado' % (mx(s), mx(TOTAL_T3[nombre])))

print(u'')
for nom, mrr, down, churn, baja, pct in MESES:
    exige(abs((down + churn) - baja) < CENT,
          u'%-11s Downgrade + Churn = Baja Total' % nom,
          u'%s + %s = %s' % (mx(down), mx(churn), mx(baja)))

# El porcentaje se REHACE, no se espeja.
print(u'')
for nom, mrr, down, churn, baja, pct in MESES:
    calc = 100.0 * baja / mrr
    exige(abs(calc - pct) < 0.01,
          u'%-11s el %% de GRC se reconstruye (%.2f%%)' % (nom, calc),
          u'el corte publica %.2f%%' % pct)

pct_t3 = 100.0 * TOTAL_T3['baja'] / TOTAL_T3['mrr']
nota(u'EL CORTE DEJA EL %% DEL TRIMESTRE EN BLANCO. Reconstruido da %.2f%%, '
     u'que es el promedio PONDERADO de los tres meses (%s / %s), no un '
     u'«churn trimestral» aparte.' % (pct_t3, mx(TOTAL_T3['baja']), mx(TOTAL_T3['mrr'])))

# ── 2 · Las listas de detalle ───────────────────────────────────────────────
print(u'\n  2 · LAS LISTAS DE DETALLE — ¿suman su total?\n')
s = sum(x[1] for x in TEMPRANAS)
exige(abs(s - TEMPRANAS_TOTAL) < CENT,
      u'salidas tempranas: las %d suman el total' % len(TEMPRANAS),
      u'%s contra %s declarado' % (mx(s), mx(TEMPRANAS_TOTAL)))

s = sum(x[1] for x in DOWN60)
exige(abs(s - DOWN60_TOTAL) < CENT,
      u'downgrades >60%%: los %d suman el total' % len(DOWN60),
      u'%s contra %s declarado' % (mx(s), mx(DOWN60_TOTAL)))

# Los conteos que van al texto publicado se CUENTAN, no se estiman a ojo. Iba a
# escribir «catorce con cero meses» contando a mano y son dieciocho.
cero = [x for x in TEMPRANAS if x[2] == 0]
uno = [x for x in TEMPRANAS if x[2] == 1]
exige(len(cero) + len(uno) == len(TEMPRANAS),
      u'las salidas tempranas son solo de 0 y 1 mes',
      u'%d con cero · %d con uno · %d en total' % (len(cero), len(uno), len(TEMPRANAS)))
print(u'          de ellas %d con CERO meses (%s) y %d con uno (%s)'
      % (len(cero), mx(sum(x[1] for x in cero)), len(uno), mx(sum(x[1] for x in uno))))
sin_nombre = [x for x in TEMPRANAS if re.match(r'^cp\d+$', x[0])]
if sin_nombre:
    nota(u'%d de las salidas tempranas no tienen nombre en el sistema (%s): '
         u'entraron y se fueron sin que nadie las bautizara.'
         % (len(sin_nombre), u', '.join(x[0] for x in sin_nombre)))

s = sum(x[1] for x in CP_CHAT)
exige(abs(s - CP_CHAT_TOTAL) < CENT,
      u'CP Chat: los 4 artículos CIERRAN la categoría',
      u'%s contra %s declarado' % (mx(s), mx(CP_CHAT_TOTAL)))

# ── 3 · El top-N que NO cierra ──────────────────────────────────────────────
print(u'\n  3 · EL TOP 5 DE CP VOZ — lo que deja fuera\n')
s = sum(x[1] for x in CP_VOZ_TOP5)
resto = CP_VOZ_TOTAL - s
print(u'        top 5 ...... %s' % mx(s))
print(u'        categoría .. %s' % mx(CP_VOZ_TOTAL))
print(u'        FUERA ...... %s  (%.1f%% de la categoría)'
      % (mx(resto), 100.0 * resto / CP_VOZ_TOTAL))
nota(u'EL TOP 5 DE CP VOZ DEJA FUERA %s, el %.1f%% de su categoría. Publicarlo '
     u'sin el cubo «otros» haría leer %s como si fuera toda la pérdida de voz.'
     % (mx(resto), 100.0 * resto / CP_VOZ_TOTAL, mx(s)))

# ── 4 · Las dos cifras de pérdida que no son la misma ───────────────────────
print(u'\n  4 · LAS DOS CIFRAS DE PÉRDIDA\n')
suma_cat = CP_CHAT_TOTAL + CP_VOZ_TOTAL
exige(abs(suma_cat - AMPLIO['perdida']) < CENT,
      u'CP Chat + CP Voz = la «pérdida total» del resumen amplio',
      u'%s + %s = %s' % (mx(CP_CHAT_TOTAL), mx(CP_VOZ_TOTAL), mx(AMPLIO['perdida'])))

dif = AMPLIO['perdida'] - TOTAL_T3['baja']
nota(u'LA PÉRDIDA POR PRODUCTO (%s) SUPERA A LA BAJA TOTAL (%s) EN %s. No es un '
     u'descuadre: el corte anterior ya lo explicó — la tabla de productos es '
     u'impacto BRUTO, sin netear contra los upsells dentro de la misma cuenta. '
     u'NO sumar las dos tablas.' % (mx(AMPLIO['perdida']), mx(TOTAL_T3['baja']), mx(dif)))

difm = TOTAL_T3['mrr'] - AMPLIO['mrr']
nota(u'LAS DOS BASES DE MRR NO COINCIDEN: el resumen trimestral usa %s y el '
     u'resumen amplio %s, %s de diferencia. El correo NO explica por qué. '
     u'Preguntarlo antes de citar cualquiera de los dos como «el MRR del T3».'
     % (mx(TOTAL_T3['mrr']), mx(AMPLIO['mrr']), mx(difm)))

# ── 5 · Contra la base de MRR que ya vive en el repo ────────────────────────
print(u'\n  5 · LA BASE DE MRR CONTRA `GRC_BASE_MRR` DEL REPO\n')
txt = io.open(os.path.join(RAIZ, 'app', 'churn', 'grc-reporte.ts'), encoding='utf-8').read()
m = re.search(r'GRC_BASE_MRR[^=]*=\s*\{([^}]*)\}', txt)
base_repo = {}
if m:
    for k, v in re.findall(r'(\w+)\s*:\s*([0-9.]+)', m.group(1)):
        base_repo[k] = float(v)
for nom, mrr, _d, _c, _b, _p in MESES:
    r = base_repo.get(nom)
    if r is None:
        exige(False, u'%s está en GRC_BASE_MRR' % nom)
        continue
    exige(abs(r - mrr) < CENT,
          u'%-11s la base del repo = la del correo' % nom,
          u'repo %s · correo %s' % (mx(r), mx(mrr)))

# ── 6 · Qué clientes del corte están en NUESTRA cartera ─────────────────────
print(u'\n  6 · CRUCE CON LA CARTERA VIVA (por NOMBRE — indicativo)\n')


def norma(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


E = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        E[k.strip()] = v.strip().strip('"')
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'], 'Accept': 'application/json'}
q = urllib.parse.urlencode({'select': 'empresa,consecutivo,asesor,estado,cid,facturacion',
                            'limit': 1000})
req = urllib.request.Request(E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?' + q, headers=H)
cuentas = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
porn = {}
for c in cuentas:
    porn.setdefault(norma(c.get('empresa')), c)

TODOS = ([(n, i, u'cancelación T3') for n, i, _m, _mes in TOP5_CANCELACIONES]
         + [(n, i, u'salida temprana') for n, i, _m, _mes in TEMPRANAS]
         + [(n, i, u'downgrade >60%%') for n, i, _p, _mes in DOWN60])

hallados = []
for nombre, imp, clase in TODOS:
    k = norma(nombre)
    c = porn.get(k)
    if not c:
        # segundo intento: la primera palabra significativa, solo para AVISAR
        continue
    hallados.append((nombre, imp, clase, c))

if not hallados:
    print(u'        ninguno de los %d clientes del corte cruza por nombre exacto.' % len(TODOS))
else:
    print(u'        %d de %d cruzan por nombre EXACTO:' % (len(hallados), len(TODOS)))
    for nombre, imp, clase, c in sorted(hallados, key=lambda x: -x[1]):
        print(u'          %-34s %-10s %-16s %-6s %-11s %s'
              % (nombre[:34], mx(imp), clase, c.get('consecutivo') or '',
                 c.get('estado'), c.get('asesor')))
    nota(u'%d cliente(s) del corte cruzan por nombre con la cartera. El cruce es '
         u'INDICATIVO —el correo no trae CIDs y cruzar por nombre mezcla '
         u'cuentas—: se señala para revisión, no para mover nada solo.'
         % len(hallados))

# ── Veredicto ───────────────────────────────────────────────────────────────
print(u'\n  ═══════════════════════════════════════════════════════════')
print(u'  %d comprobación(es) fallidas · %d observación(es)' % (len(fallos), len(avisos)))
if fallos:
    for f in fallos:
        print(u'     FALLA  %s' % f)
    sys.exit(1)
print(u'  el corte CIERRA en todo lo verificable.')
