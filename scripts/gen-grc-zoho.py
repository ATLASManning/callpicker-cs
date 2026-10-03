"""Construye data/grc-zoho.json — la fuente del apartado Gross Revenue Churn.

   SUSTITUYE AL MODULO LTV. Direccion: «elimina la informacion de LTV y
   construye lo nuevo». Lo que se publica ahora es lo que presenta el tablero
   «DASHBOARD GROSS REVENUE CHURN (%) - 2025 Y 2026», alimentado por el export
   del detalle que se comparte cada semana.

   Origen del export: en el tablero, cruce del mes con la columna «MRR inicio»
   -> clic derecho -> «Ver datos subyacentes» -> Mas -> «Exportar Vista».

   ── POR QUE LA HISTORIA VIENE CONGELADA Y EL MES VIVO CALCULADO ────────────
   El export trae UN solo mes. Los meses ya cerrados no se pueden recalcular
   porque su detalle no esta en el archivo: se guardan tal como Zoho los
   publico, marcados como cerrados. El mes del export se calcula fila por fila
   y sustituye a su gemelo en la serie. Cuando llegue el export de octubre, el
   script agrega octubre y deja septiembre con lo ultimo que se calculo.

   ── LAS TRES CANASTAS DE LA PERDIDA, Y POR QUE SON TRES Y NO UNA ───────────
   El corte se toma con el mes EN CURSO y Zoho marca «Churn confirmado» a todo
   contrato que todavia no se factura. En septiembre 2026 son 1,086 filas.
   Todas comparten la misma firma: MRR Fin en cero y perdida exactamente igual
   al MRR inicio, sin una sola parcial.

   Solo 64 de esas 1,086 son cuentas de la cartera — las unicas cuyo estado se
   puede consultar. De esas 64, SESENTA Y UNA siguen ACTIVAS o EN RIESGO en la
   base. Es decir: en la unica muestra verificable, el 95% de lo marcado como
   baja NO es baja. Y de las 1,022 filas que no se pueden verificar, 1,021
   traen exactamente la misma firma que las que ya se probaron falsas.

   Por eso la perdida se parte en TRES y nunca se publica junta:

     · baja           — la cuenta figura de baja en la base. Es perdida real.
     · sigue_viva     — marcada como baja y la base dice que sigue activa o en
                        riesgo. Esta desmentida.
     · sin_verificar  — no esta en la cartera, no hay contra que cotejarla.
                        Ausencia de medicion, que no es lo mismo que cero.

   Publicar las tres juntas da un GRC de 35.6% contra un promedio de 2.1% en
   los ocho meses previos: media hora de alarma y una decision equivocada.
   Publicar solo la verificada da 1.4% y esconde el problema. Se publican las
   tres, cada una con su nombre, y el lector decide con el dato completo.

   Uso:  python scripts/gen-grc-zoho.py "C:/ruta/Septiembre.xlsx"
"""
import sys, io, os, re, json, unicodedata, collections, urllib.request
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
import openpyxl

RAIZ = r'D:\Windows\Projects\callpicker-cs'
SALIDA = os.path.join(RAIZ, 'data', 'grc-zoho.json')

COLS = {
    'mes': 'Mes Nombre', 'cliente': 'Cliente', 'clasif': 'clasificacion_cliente',
    'facturas': 'Facturas_2026', 'meses': 'Meses Activo',
    'acumulado': 'Importe Acumulado Recurrente',
    'mrrIni': 'MRR Inicio Contrato (BCY)', 'mrrFin': 'MRR Fin Contrato (BCY)',
    'ganado': 'Ingreso Ganado Contrato (BCY)', 'movimiento': 'Movimiento MRR',
    'perdida': 'Ingreso Perdido Contrato (BCY) Real',
    'fraude': 'Ingreso Perdido Contrato (BCY) Fraude-Reestructura',
    'rango': 'Rango MRR Fin Contrato',
}

MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

# ── LO QUE EL MODULO VENIA PUBLICANDO, para contrastar ───────────────────────
# Era la FUENTE de los meses cerrados cuando el export traia un solo mes. Desde
# el 2 oct 2026 el export trae los nueve, asi que la serie se CALCULA y esta
# tabla se queda solo como contraste: si un mes cerrado se mueve, el generador
# lo grita. No borrarla — es la unica memoria de lo que direccion ya vio.
# La tercera columna es SOLO «Churn confirmado»; la quinta es la perdida
# «global», que incluye ademas churn mensual y financiero.
HISTORIA_PUBLICADA = [
    ('Enero',      4650020.89,    74083.11,    20848.01,   121979.12),
    ('Febrero',    4696696.10,    65589.19,    34216.37,   148357.44),
    ('Marzo',      4776920.30,    82546.00,    25734.97,   132272.97),
    ('Abril',      4857171.51,    58214.06,    26413.59,   139818.05),
    ('Mayo',       5074882.09,    32586.00,    42283.26,   107312.57),
    ('Junio',      5103295.12,    87260.00,    81522.81,   209500.81),
    ('Julio',      4943564.29,    74017.46,    25576.75,   124690.21),
    ('Agosto',     5006567.60,    68784.18,    49977.17,   None),  # no esta en «global»
]

# «Detalle de perdida», por mes y movimiento. El tablero solo llega a junio.
DETALLE_PUBLICADO = {
    'Enero':   [('Churn mensual', 20587.00, 0.0), ('Churn financiero', 6461.00, 0.0),
                ('Churn confirmado', 74083.11, 0.0), ('Downgrade', 20848.01, 0.0),
                ('Downgrade + Fraude', 0.0, 2245.00)],
    'Febrero': [('Churn mensual', 42002.88, 0.0), ('Churn financiero', 6549.00, 0.0),
                ('Churn confirmado', 65589.19, 0.0), ('Downgrade', 34216.37, 0.0),
                ('Churn confirmado + Fraude', 0.0, 8212.00),
                ('Churn confirmado + Reestructura en facturacion', 0.0, 189440.00)],
    'Marzo':   [('Churn mensual', 21081.00, 0.0), ('Churn financiero', 2911.00, 0.0),
                ('Churn confirmado', 82546.00, 0.0), ('Downgrade', 25734.97, 0.0),
                ('Churn confirmado + Fraude', 0.0, 195.00)],
    'Abril':   [('Churn mensual', 54222.40, 0.0), ('Churn financiero', 968.00, 0.0),
                ('Churn confirmado', 58214.06, 0.0), ('Downgrade', 26413.59, 0.0),
                ('Churn confirmado + Fraude', 0.0, 489.00)],
    'Mayo':    [('Churn mensual', 21375.31, 0.0), ('Churn financiero', 11068.00, 0.0),
                ('Churn confirmado', 32586.00, 0.0), ('Downgrade', 42283.26, 2696.25),
                ('Churn confirmado + Fraude', 9974.00, 0.0)],
    'Junio':   [('Churn mensual', 37286.00, 0.0), ('Churn financiero', 3432.00, 0.0),
                ('Churn confirmado', 87260.00, 0.0), ('Downgrade', 81522.81, 122401.85),
                ('Churn confirmado + Fraude', 60517.14, 0.0)],
}

# «Detalle de Reactivaciones 2026». El export no trae columna de reactivacion:
# esto no se puede recalcular ni continuar. Se publica lo que hay, diciendo
# hasta donde llega, en vez de dejar los meses siguientes en cero — un cero sin
# medicion se lee como «no hubo», y aqui significa «no se midio».
REACTIVACIONES = [('Enero', 58241.78), ('Febrero', 26121.00), ('Marzo', 89071.84),
                  ('Abril', 31783.00), ('Mayo', 60054.50), ('Junio', 30010.31)]

# Objetivo trimestral de GRC por banda de MRR, de la pestana «GRC por rango».
# OJO: el tablero los PINTA redondeados (11.3%, 8.8%, 3.8%) pero los calcula con
# el valor exacto. Verificado contra «Monto maximo de perdida trimestral» en las
# diez bandas de T1 y T2: con estos cuadra al centavo, con los redondeados no.
OBJETIVO_RANGO = [
    ('$1 - $300', 0.1125), ('$301 - $500', 0.1125), ('$501 - $1,000', 0.0875),
    ('$1,001 - $3,000', 0.0750), ('$3,001 - $5,000', 0.0375),
    ('$5,001 - $10,000', 0.0300), ('$10,001 - $20,000', 0.0200),
    ('$20,001 - $40,000', 0.0200), ('$40,001 - $80,000', 0.0200),
    ('$80,001 en adelante', 0.0200),
]
ORDEN_RANGO = [r for r, _ in OBJETIVO_RANGO]
VIVO = ('activo', 'en_riesgo')

# ── Filas del export que son la MISMA empresa que una cuenta de la cartera ───
# El export trae catorce filas cuyo nombre empieza igual que el de una cuenta
# pero llega SIN CID. El parecido del nombre no basta para decidir —«Odontoprev
# ATC» factura $20,018 contra los $3,505 de «Odontoprev», y fundirlas a ciegas
# habria inventado la facturacion de esa ficha—, asi que la lista se llena a
# mano y la confirma quien atiende las cuentas.
#
# Direccion confirmo el 17 sep 2026: todas son la misma empresa MENOS «Justo
# Etiquetas», que es otra. Esa es la unica de las catorce que no esta aqui, y
# por eso se queda visible aparte en la ficha de Justo.
#
# Al agregar una nueva: va el nombre EXACTO como viene en el export.
MISMA_CUENTA = {
    'Baterias LTH Chat':                 '24520',   # Baterias LTH
    'Cargo lift USA':                    '439',     # Cargo Lift
    'GRUPO 2711 (BATERIAS SENDERO)':     '12283',   # GRUPO 2711
    'Gas Economico Metropolitano Chat':  '134571',  # Gas Economico Metropolitano
    'Grupo Frisa - ACISA':               '168973',  # Grupo Frisa
    'lunasoft.net':                      '47100',   # LUNA SOFT
    'Lunasoft - Advans':                 '47100',   # LUNA SOFT
    'Odontoprev ATC':                    '162545',  # Odontoprev
    'Pastelería Antares Chat':           '35312',   # Pastelería Antares
    'Remax Homelife One':                '1743',    # Remax Homelife
    'Salud y Hogar - USA':               '946',     # Salud y Hogar
    'Taquería El Pariente Puebla':       '23381',   # TAQUERIA EL PARIENTE
    'Tech People Soluciones':            '2094',    # Tech People
    # 'Justo Etiquetas': NO — direccion confirmo que es otra empresa.
}


def num(v):
    if isinstance(v, (int, float)):
        return float(v)
    s = re.sub(r'[^0-9.\-]', '', str(v or ''))
    try:
        return float(s) if s not in ('', '-', '.') else 0.0
    except ValueError:
        return 0.0


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or '')).lower()
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'[^a-z0-9]', '', s)


es_churn = lambda m: m.startswith('Churn')
es_downgrade = lambda m: m.startswith('Downgrade')
pct = lambda a, b: round(100.0 * a / b, 4) if b else 0.0

# ── El export ────────────────────────────────────────────────────────────────
if len(sys.argv) < 2:
    print(__doc__)
    raise SystemExit('Falta la ruta del export.')
ORIGEN = sys.argv[1]
if not os.path.exists(ORIGEN):
    raise SystemExit('No existe: %s' % ORIGEN)

wb = openpyxl.load_workbook(ORIGEN, data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
it = ws.iter_rows(values_only=True)
cab = [str(c).strip() if c is not None else '' for c in next(it)]
ix = {k: (cab.index(v) if v in cab else None) for k, v in COLS.items()}
faltan = [COLS[k] for k, v in ix.items() if v is None]
if faltan:
    raise SystemExit('Al export le faltan columnas obligatorias: %s' % faltan)
todas = [r for r in it]
wb.close()
g = lambda r, k: r[ix[k]]

# ── EL EXPORT YA TRAE TODOS LOS MESES (2 oct 2026) ───────────────────────────
#
# Hasta hoy el archivo traia UN mes y los ocho cerrados vivian en la tabla
# `HISTORIA`, escrita a mano, con esta nota: «su detalle NO viene en el export,
# asi que no hay forma de recalcularlos». Direccion compartio el export
# completo —32,310 filas, 9 meses, 3,590 por mes— y eso deja de ser cierto.
#
# El trabajo por fila (verificacion contra la cartera, canastas, cortes) sigue
# siendo del MES VIVO: es el unico que se puede cotejar contra el estado de hoy.
# Lo que cambia es que la serie de los cerrados ya no se transcribe: se calcula.
MESES_EN_ARCHIVO = []
for r in todas:
    m = str(g(r, 'mes') or '').strip()
    if m and m not in MESES_EN_ARCHIVO:
        MESES_EN_ARCHIVO.append(m)
desconocidos = [m for m in MESES_EN_ARCHIVO if m not in MESES]
if desconocidos:
    raise SystemExit('El export trae meses que no reconozco: %s' % desconocidos)
MESES_EN_ARCHIVO.sort(key=MESES.index)

# El mes vivo es el ULTIMO del calendario, no el primero del archivo: el export
# no viene ordenado y tomar `crudas[0]` daria «Abril» en un archivo de 9 meses.
MES_VIVO = MESES_EN_ARCHIVO[-1]
crudas = [r for r in todas if str(g(r, 'mes') or '').strip() == MES_VIVO]
print('  meses en el export: %s   ·   mes vivo: %s'
      % (', '.join(MESES_EN_ARCHIVO), MES_VIVO))

# ── La cartera: lo unico contra lo que se puede cotejar una baja ─────────────
env = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
K = env['SUPABASE_SERVICE_ROLE_KEY']
rq = urllib.request.Request(
    env['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?select=empresa,cid,consecutivo,asesor,estado',
    headers={'apikey': K, 'Authorization': 'Bearer ' + K})
CART = {norm(c['empresa']): c for c in json.loads(urllib.request.urlopen(rq, timeout=60).read().decode())}

filas = []
for r in crudas:
    nom = str(g(r, 'cliente') or '').strip()
    if not nom:
        continue
    m = str(g(r, 'movimiento') or '').strip()
    c = CART.get(norm(nom))

    # Fila sin cuenta propia que direccion confirmo como la MISMA empresa: se
    # cuelga de su cuenta. `agrupada` la deja marcada para que la ficha pueda
    # decir de donde sale cada peso en vez de solo mostrar un total mas grande.
    agrupada = False
    if c is None and nom in MISMA_CUENTA:
        cid_padre = MISMA_CUENTA[nom]
        c = next((x for x in CART.values() if x['cid'] == cid_padre), None)
        agrupada = c is not None

    ini, fin, per = num(g(r, 'mrrIni')), num(g(r, 'mrrFin')), num(g(r, 'perdida'))

    # La firma del contrato que aun no se factura: fin en cero y perdida
    # exactamente igual al inicio. Sin parciales. No prueba nada por si sola,
    # pero es lo que comparten las 61 que SI se pudieron desmentir.
    firma = es_churn(m) and fin == 0 and abs(per - ini) < 0.01

    if not es_churn(m) or per <= 0:
        verif = 'na'                       # no es una baja: no hay nada que verificar
    elif not c:
        verif = 'sin_verificar'            # no esta en la cartera: no hay contra que cotejar
    elif c['estado'] in VIVO and firma:
        verif = 'sigue_viva'               # marcada de baja y la base dice que vive
    else:
        verif = 'baja'                     # la base la da de baja: perdida real

    filas.append({
        'cliente': nom,
        'clasif': str(g(r, 'clasif') or '').strip() or None,
        'facturas': int(num(g(r, 'facturas'))),
        'meses': int(num(g(r, 'meses'))),
        'acumulado': num(g(r, 'acumulado')),
        'mrrIni': ini, 'mrrFin': fin,
        'ganado': num(g(r, 'ganado')),
        'movimiento': m or None,
        'perdida': per,
        'fraude': num(g(r, 'fraude')),
        'rango': str(g(r, 'rango') or '').strip() or None,
        'consecutivo': c['consecutivo'] if c else None,
        'asesor': c['asesor'] if c else None,
        'cid': c['cid'] if c else None,
        'estadoBase': c['estado'] if c else None,
        'enCartera': bool(c),
        'agrupada': agrupada,
        'firma': firma,
        'verificacion': verif,
    })

nombres = {f['cliente'] for f in filas}
huerfanos = [k for k in MISMA_CUENTA if k not in nombres]
if huerfanos:
    print('AVISO: estos nombres de MISMA_CUENTA ya no vienen en el export: %s' % huerfanos)
sin_padre = [k for k, v in MISMA_CUENTA.items()
             if k in nombres and not any(f['cliente'] == k and f['cid'] for f in filas)]
if sin_padre:
    raise SystemExit('MISMA_CUENTA apunta a un CID que no existe en la cartera: %s' % sin_padre)

MES = MES_VIVO

# ── LOS MESES CERRADOS, CALCULADOS DEL ARCHIVO ───────────────────────────────
#
# `HISTORIA_PUBLICADA` deja de ser la FUENTE y pasa a ser el CONTRASTE: lo que
# el modulo venia publicando. Si un mes cerrado se mueve, se dice en voz alta
# en vez de cambiarlo en silencio — que es exactamente la trampa que ya mordio
# en el otro dataset (mayo-agosto se movieron -$70,150 contra lo reportado a
# direccion, y solo se vio porque alguien concilio antes de publicar).
#
# La columna `churn` de la tabla vieja es SOLO «Churn confirmado»; el churn
# real del mes suma ademas «Churn mensual» y «Churn financiero». Por eso se
# contrasta contra el desglose, no contra ese numero suelto.
cerradosArchivo, detalleArchivo = [], {}
for m in MESES_EN_ARCHIVO:
    rs = [r for r in todas if str(g(r, 'mes') or '').strip() == m]
    porMov = {}
    for r in rs:
        mv = str(g(r, 'movimiento') or '').strip() or '(sin movimiento)'
        p, fr = porMov.get(mv, (0.0, 0.0))
        porMov[mv] = (p + num(g(r, 'perdida')), fr + num(g(r, 'fraude')))
    ch = sum(p for mv, (p, _) in porMov.items() if es_churn(mv))
    dg = sum(p for mv, (p, _) in porMov.items() if es_downgrade(mv))
    per = sum(p for p, _ in porMov.values())
    # Nadie mas puede aportar perdida: si aparece un movimiento nuevo que si la
    # aporta, se planta en vez de dejarlo fuera de la serie sin avisar.
    assert abs((ch + dg) - per) < 0.01, (
        '%s: churn+downgrade suman %.2f y la perdida es %.2f. Hay un movimiento '
        'con perdida que no es Churn ni Downgrade: %s'
        % (m, ch + dg, per,
           {mv: round(p, 2) for mv, (p, _) in porMov.items()
            if p > 0 and not es_churn(mv) and not es_downgrade(mv)}))
    cerradosArchivo.append((m, sum(num(g(r, 'mrrIni')) for r in rs), ch, dg, per))
    detalleArchivo[m] = sorted(((mv, round(p, 2), round(fr, 2))
                                for mv, (p, fr) in porMov.items() if p > 0 or fr > 0),
                               key=lambda x: -x[1])

PREV = {h[0]: h for h in HISTORIA_PUBLICADA}
movidos = []
for m, mi, ch, dg, per in cerradosArchivo:
    p = PREV.get(m)
    if not p or m == MES:
        continue
    dMrr, dDg = mi - p[1], dg - p[3]
    dPer = (per - p[4]) if p[4] is not None else 0.0
    if max(abs(dMrr), abs(dDg), abs(dPer)) >= 1.0:
        movidos.append((m, dMrr, dDg, dPer))
if movidos:
    print('\n  *** MESES CERRADOS QUE SE MOVIERON contra lo ya publicado ***')
    print('  %-12s %14s %14s %16s' % ('MES', 'MRR INICIO', 'DOWNGRADE', 'PERDIDA'))
    for m, a, b, c in movidos:
        # El `%` de Python no admite el separador de miles: va con format().
        d_ = lambda v: (('+' if v > 0 else '-') + '$' + format(abs(v), ',.2f')) if v else '='
        print('  %-12s %14s %14s %16s' % (m, d_(a), d_(b), d_(c)))
    print('  El export REESCRIBE meses cerrados. Conciliar antes de publicar:')
    print('  python scripts/concilia-grc-zoho.py <respaldo>\n')

HISTORIA = [(m, mi, ch, dg, per) for m, mi, ch, dg, per in cerradosArchivo if m != MES]
DETALLE_HISTORICO = {m: v for m, v in detalleArchivo.items() if m != MES}

# ── El mes vivo ──────────────────────────────────────────────────────────────
S = lambda sel: sum(f['perdida'] for f in sel)
por = lambda v: [f for f in filas if f['verificacion'] == v]
churnBaja, churnViva, churnSinVer = S(por('baja')), S(por('sigue_viva')), S(por('sin_verificar'))
downg = S([f for f in filas if es_downgrade(f['movimiento'] or '')])
churn = churnBaja + churnViva + churnSinVer
mrrIni = sum(f['mrrIni'] for f in filas)
mrrFin = sum(f['mrrFin'] for f in filas)
ganado = sum(f['ganado'] for f in filas)
fraude = sum(f['fraude'] for f in filas)
perdida = sum(f['perdida'] for f in filas)

# La aritmetica del mes tiene que cerrar o el archivo no sirve de nada.
desc = (mrrIni - perdida - fraude + ganado) - mrrFin
assert abs(desc) < 1.0, 'el mes no cierra: descuadre de %.2f' % desc
# Y las tres canastas mas el downgrade tienen que agotar la perdida, o hay
# filas que ninguna tabla esta mostrando.
assert abs((churn + downg) - perdida) < 0.01, (
    'las canastas suman %.2f y la perdida es %.2f: hay filas sin clasificar'
    % (churn + downg, perdida))

vivo = {
    'mes': MES, 'cerrado': False, 'origen': os.path.basename(ORIGEN),
    'mrrInicio': round(mrrIni, 2), 'mrrFin': round(mrrFin, 2),
    'churn': round(churn, 2), 'downgrade': round(downg, 2),
    'perdida': round(churn + downg, 2), 'perdidaGlobal': round(churn + downg, 2),
    'fraude': round(fraude, 2), 'ganado': round(ganado, 2),
    'churnBaja': round(churnBaja, 2), 'churnViva': round(churnViva, 2),
    'churnSinVerificar': round(churnSinVer, 2),
    'cuentasBaja': len(por('baja')), 'cuentasViva': len(por('sigue_viva')),
    'cuentasSinVerificar': len(por('sin_verificar')),
    # Las tres lecturas. Publicada = como la calcula Zoho. Piso = solo lo
    # verificado. Sin desmentidas = quitando lo que se probo falso.
    'grcMensual': pct(churn + downg, mrrIni),
    'grcSinDesmentidas': pct(churn + downg - churnViva, mrrIni),
    'grcVerificado': pct(churnBaja + downg, mrrIni),
}

# ── La serie ─────────────────────────────────────────────────────────────────
serie = []
for mes, ini_, ch, dw, glob in HISTORIA:
    serie.append({
        'mes': mes, 'cerrado': True, 'origen': 'Zoho (mes cerrado)',
        'mrrInicio': ini_, 'mrrFin': None,
        'churn': ch, 'downgrade': dw, 'perdida': round(ch + dw, 2),
        'perdidaGlobal': glob, 'fraude': None, 'ganado': None,
        # Un mes cerrado NO se cotejo contra la base: su detalle no viene en el
        # export, asi que no hay filas que revisar. Va en None, no en cero y no
        # igualado al mensual. Declararlo «100% verificado» solo por estar
        # cerrado seria una afirmacion sin medicion, y ademas haria ver al mes
        # vivo artificialmente peor por comparacion: la columna se leeria como
        # «septiembre es el mes con menos churn verificado del ano», que es
        # exactamente al reves de lo que dice el dato.
        'churnBaja': None, 'churnViva': None, 'churnSinVerificar': None,
        'cuentasBaja': None, 'cuentasViva': None, 'cuentasSinVerificar': None,
        'grcMensual': pct(ch + dw, ini_),
        'grcSinDesmentidas': pct(ch + dw, ini_),
        'grcVerificado': None,
    })
serie = [m for m in serie if m['mes'] != MES] + [vivo]
serie.sort(key=lambda m: MESES.index(m['mes']))

# El GRC acumulado de Zoho es un TOTAL ACUMULADO de la columna mensual — asi
# esta definido el pivote: «GRC (%) esp · Total acumulado». No es perdida
# acumulada sobre MRR acumulado; por eso 17.3 + 35.2 = 52.5.
a1 = a2 = 0.0
for m in serie:
    a1 += m['grcMensual']; a2 += m['grcSinDesmentidas']
    m['grcAcumulado'] = round(a1, 4)
    m['grcAcumSinDesmentidas'] = round(a2, 4)
    # No hay acumulado de lo verificado: solo un mes de la serie se cotejo,
    # asi que sumar esa columna daria un acumulado de un solo dato disfrazado
    # de serie.
    m['grcAcumVerificado'] = None

# ── Cortes del mes vivo ──────────────────────────────────────────────────────
def corta(campo, orden=None):
    ag = collections.defaultdict(lambda: collections.defaultdict(float))
    cnt = collections.Counter()
    for f in filas:
        k = f[campo] or '(sin dato)'
        e = ag[k]; cnt[k] += 1
        e['mrrInicio'] += f['mrrIni']; e['ganado'] += f['ganado']
        e['acumulado'] += f['acumulado']
        mov = f['movimiento'] or ''
        if es_downgrade(mov):
            e['downgrade'] += f['perdida']
        elif es_churn(mov):
            e['churn'] += f['perdida']
            e[{'baja': 'churnBaja', 'sigue_viva': 'churnViva',
               'sin_verificar': 'churnSinVerificar'}.get(f['verificacion'], 'churnBaja')] += f['perdida']
    out = []
    for k, e in ag.items():
        per = e['churn'] + e['downgrade']
        out.append({
            'clave': k, 'n': cnt[k],
            'mrrInicio': round(e['mrrInicio'], 2), 'ganado': round(e['ganado'], 2),
            'acumulado': round(e['acumulado'], 2),
            'churn': round(e['churn'], 2), 'downgrade': round(e['downgrade'], 2),
            'perdida': round(per, 2),
            'churnBaja': round(e['churnBaja'], 2), 'churnViva': round(e['churnViva'], 2),
            'churnSinVerificar': round(e['churnSinVerificar'], 2),
            'grc': pct(per, e['mrrInicio']),
            'grcVerificado': pct(e['churnBaja'] + e['downgrade'], e['mrrInicio']),
        })
    out.sort(key=(lambda x: orden.index(x['clave']) if x['clave'] in orden else 999)
             if orden else (lambda x: -x['perdida']))
    return out


porRango = corta('rango', ORDEN_RANGO)
porClasif = corta('clasif')
porMovimiento = corta('movimiento')
# El corte por asesor NO tira el bucket sin dato: lo renombra. Son 3,371 filas
# por $1,141,203 —el 65% de la perdida— de clientes que no estan en la cartera
# gestionada. Tirarlas dejaba una fila «Total» que se leia como el total del mes
# y era el 35%: una tabla que no cierra miente sin decirlo.
porAsesor = corta('asesor')
for x in porAsesor:
    if x['clave'] == '(sin dato)':
        x['clave'] = '(fuera de la cartera gestionada)'
        x['fueraDeCartera'] = True

# Cada corte tiene que sumar lo mismo que el mes, o esta escondiendo filas.
for etq, corte in (('rango', porRango), ('clasificacion', porClasif),
                   ('movimiento', porMovimiento), ('asesor', porAsesor)):
    s = sum(x['perdida'] for x in corte)
    assert abs(s - (churn + downg)) < 0.01, (
        'el corte por %s suma %.2f y el mes %.2f: se pierden filas' % (etq, s, churn + downg))

OBJ = dict(OBJETIVO_RANGO)
for r in porRango:
    o = OBJ.get(r['clave'])
    r['objetivo'] = round(100.0 * o, 2) if o else None
    if not o:
        r['montoMaximo'] = r['objetivoVsReal'] = r['cumple'] = None
        continue
    # Monto maximo de perdida = MRR x objetivo; «Objetivo vs Real» es la holgura.
    # El semaforo se evalua sobre la perdida VERIFICADA porque es lo unico que
    # se sabe cierto. La holgura contra lo sin verificar va aparte: si esa masa
    # resultara real, la banda se pasa — y eso tambien hay que poder verlo.
    tope = r['mrrInicio'] * o
    verif = r['churnBaja'] + r['downgrade']
    r['montoMaximo'] = round(tope, 2)
    r['objetivoVsReal'] = round(tope - verif, 2)
    r['cumple'] = tope - verif >= 0
    r['cumpleSiTodoFueraReal'] = tope - (verif + r['churnSinVerificar']) >= 0

detalle = dict(DETALLE_HISTORICO)
detalle[MES] = [(m['clave'], m['perdida'], 0.0) for m in porMovimiento if m['perdida'] > 0]
detalleSerie = [{'mes': k, 'filas': [{'movimiento': a, 'perdida': round(b, 2), 'fraude': round(c, 2)}
                                     for a, b, c in v]}
                for k, v in sorted(detalle.items(), key=lambda x: MESES.index(x[0]))]

META = {
    'origen': os.path.basename(ORIGEN), 'mesVivo': MES,
    'filas': len(filas), 'clientes': len({norm(f['cliente']) for f in filas}),
    'enCartera': sum(1 for f in filas if f['enCartera']),
    'descuadre': round(desc, 2),
    'churnBaja': round(churnBaja, 2), 'churnViva': round(churnViva, 2),
    'churnSinVerificar': round(churnSinVer, 2),
    'cuentasBaja': len(por('baja')), 'cuentasViva': len(por('sigue_viva')),
    'cuentasSinVerificar': len(por('sin_verificar')),
    'mesesCerrados': [m for m, _, _, _, _ in HISTORIA],
    'reactivacionesHasta': REACTIVACIONES[-1][0],
    'mesesConDetalle': sorted(detalle.keys(), key=lambda x: MESES.index(x)),
    # ── LA NOTA DEL CAMBIO ───────────────────────────────────────────────
    # Direccion, 2 oct 2026: «esta es la ultima informacion de la herramienta
    # institucional, no puede haber dos cifras; si cambio simplemente cambio».
    # Las cifras de los meses cerrados se movieron y eso NO se esconde: se
    # declara aqui, con la razon, para que quien recuerde el numero anterior
    # sepa por que ya no es ese. Se calcula, no se escribe a mano.
    'notaCambio': (
        'Las cifras de los meses cerrados cambiaron el 2 de octubre de 2026. Hasta esa fecha el '
        'export traía un solo mes y los cerrados se transcribían de la tabla que Zoho publicaba, '
        'que sólo contaba «Churn confirmado». El export institucional ahora trae los %d meses '
        'completos, así que la serie se calcula del archivo y cuenta los TRES tipos de churn '
        '—confirmado, mensual y financiero— igual que el mes en curso, que siempre se midió así. '
        'Por eso cada mes cerrado subió y el acumulado a %s pasó de 17.3%% a %s. '
        'No es que el negocio empeorara: antes se publicaba una parte del churn y ahora se publica '
        'todo. Las únicas bajas son reclasificaciones a fraude, que el GRC excluye por definición.'
        % (len(MESES_EN_ARCHIVO), HISTORIA[-1][0],
           ('%.1f%%' % sum(100.0 * h[4] / h[1] for h in HISTORIA)))
    ),
    'sinFuente': [
        'La columna «GRC verificado» solo existe para %s: es el único mes que se puede cotejar '
        'contra el estado de hoy de la cartera. Los meses cerrados van sin cotejar, no en 100%%.' % MES,
        'Categoría de producto (CP Chat vs CP Voz): el export no trae esa columna.',
        'Reactivaciones: no hay columna en el export; se publica hasta %s, que es lo que Zoho alcanzó a publicar.' % REACTIVACIONES[-1][0],
        'Pagos recuperados y CSAT: son otros datasets, no salen de este export.',
    ],
    'advertencia': (
        'El corte se tomó con el mes en curso. De las cuentas que el corte marca como baja, solo '
        '%d están en la cartera y se pueden cotejar contra la base: %d de ellas siguen activas o en '
        'riesgo. Las otras %d no se pueden verificar y %d de ellas traen exactamente la misma firma '
        '—MRR fin en cero y pérdida igual al MRR inicio— que las que sí se desmintieron. Por eso la '
        'pérdida se publica en tres canastas y nunca junta.'
        % (len(por('baja')) + len(por('sigue_viva')), len(por('sigue_viva')),
           len(por('sin_verificar')), sum(1 for f in por('sin_verificar') if f['firma']))
    ),
}

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
with io.open(SALIDA, 'w', encoding='utf-8') as fh:
    json.dump({'meta': META, 'serie': serie, 'detallePerdida': detalleSerie,
               'reactivaciones': [{'mes': m, 'monto': v} for m, v in REACTIVACIONES],
               'porRango': porRango, 'porClasif': porClasif,
               'porMovimiento': porMovimiento, 'porAsesor': porAsesor,
               'filas': filas}, fh, ensure_ascii=False, separators=(',', ':'))

# ── Lo que hay que poder leer sin abrir el JSON ──────────────────────────────
f_ = lambda n: '$' + format(round(n), ',')
print('=== %s · %s ===' % (MES, META['origen']))
print('  filas %s · clientes %s · de la cartera %d'
      % (format(META['filas'], ','), format(META['clientes'], ','), META['enCartera']))
print()
print('  MRR inicio            %14s' % f_(mrrIni))
print('  Downgrade             %14s   (perdida parcial sobre cuenta viva: siempre real)' % f_(downg))
print('  Churn marcado         %14s   en %d filas' % (f_(churn), len(por('baja')) + len(por('sigue_viva')) + len(por('sin_verificar'))))
print('    · baja verificada   %14s   %4d cuentas — la base las da de baja' % (f_(churnBaja), META['cuentasBaja']))
print('    · DESMENTIDA        %14s   %4d cuentas — la base dice que siguen vivas' % (f_(churnViva), META['cuentasViva']))
print('    · sin verificar     %14s   %4d filas  — fuera de la cartera, nada contra que cotejar' % (f_(churnSinVer), META['cuentasSinVerificar']))
print()
print('  GRC publicado (todo)      %6.1f%%' % vivo['grcMensual'])
print('  GRC sin las desmentidas   %6.1f%%' % vivo['grcSinDesmentidas'])
print('  GRC verificado (piso)     %6.1f%%' % vivo['grcVerificado'])
print('  MRR fin %26s   descuadre %.2f' % (f_(mrrFin), desc))
print()
print('=== LA SERIE ===')
print('  %-12s %14s %14s %8s %9s %9s' % ('mes', 'MRR inicio', 'perdida', 'GRC', 'verific.', 'acum.'))
for m in serie:
    print('  %-12s %14s %14s %7.1f%% %9s %8.1f%%  %s'
          % (m['mes'], f_(m['mrrInicio']), f_(m['perdida']), m['grcMensual'],
             ('%.1f%%' % m['grcVerificado']) if m['grcVerificado'] is not None else 'sin cotejar',
             m['grcAcumulado'], 'cerrado' if m['cerrado'] else '<- mes vivo'))
print()
print('=== POR RANGO, CONTRA SU OBJETIVO (semaforo sobre lo verificado) ===')
print('  %-22s %6s %14s %13s %13s %12s %s'
      % ('rango', 'objet.', 'MRR inicio', 'verificada', 'sin verificar', 'holgura', ''))
for r in porRango:
    if r['objetivo'] is None:
        continue
    print('  %-22s %5.2f%% %14s %13s %13s %12s %s'
          % (r['clave'], r['objetivo'], f_(r['mrrInicio']),
             f_(r['churnBaja'] + r['downgrade']), f_(r['churnSinVerificar']),
             f_(r['objetivoVsReal']),
             'OK' if r['cumple'] else 'SE PASA') + ('' if r['cumpleSiTodoFueraReal'] else '  (se pasaria si lo sin verificar fuera real)'))
print()
print('escrito %s (%.0f KB)' % (SALIDA, os.path.getsize(SALIDA) / 1024))
