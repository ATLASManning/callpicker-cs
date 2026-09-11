"""Genera app/callpicker-chat/chat-data.ts leyendo DIRECTO el libro de Excel
   exportado del Sheet «CallPickerChat Usage - Customer Health».

   ── REFRESCO SEMANAL (viernes por la tarde) ──────────────────────────────
     1. En el Sheet: Archivo > Descargar > Microsoft Excel (.xlsx).
     2. python scripts/gen-chat-data.py
     3. commit + push.

   El paso 2 hace todo lo demas: si el libro sigue en la carpeta de Descargas
   lo mueve solo a D:\\Proyectos\\CP\\CallpickerChat\\ (la unidad de trabajo),
   toma el mas reciente, regenera el modulo y reporta que cambio contra la
   semana pasada.

   No hay transcripcion manual en ninguna parte del proceso: se leen las
   celdas del .xlsx tal cual.

   ── POR QUE NO SE USA `uso_rango` DE LA HOJA COMO SEMAFORO ───────────────
   En el origen, `pct_uso` se calcula sobre `contracted_agents` cuando
   base_medicion = "agentes" (83 de 130 clientes). Eso NO es consumo de plan:
   es mensajes por agente. Produce valores como 433,369% (PVnube) o 51,602%
   (HomiRent), y deja 70 de 130 cuentas en el rango "100+" como si rebasaran
   su plan. Solo 13 de 159 cuentas tienen bolsa de mensajes real
   (`contracted_messages_monthly` > 0), unico caso donde un porcentaje de plan
   significa algo — ese se conserva aparte como `pctBolsa`.

   El semaforo que se construye aqui responde la pregunta que si le sirve a
   Customer Success: **esta cuenta le esta sacando valor al chat?**
"""
import sys, io, os, re, json, glob, shutil, time, datetime, collections

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
RAIZ   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, 'app', 'callpicker-chat', 'chat-data.ts')

ACERVO    = r"D:\Proyectos\CP\CallpickerChat"          # donde viven los libros semanales
DESCARGAS = os.path.join(os.path.expanduser('~'), 'Downloads')
PATRON    = 'CallPickerChat'                            # como empieza el nombre del export

HOJA_RESUMEN = 'Chat Usage Monthly'
HOJA_INBOX   = 'Chat Inbox Usage Monthly'
FUENTE = 'https://docs.google.com/spreadsheets/d/1qW_eY7m_kevph9bEiZtaN8vX7fee_PQzjTlc8Mlp2-g/edit'


# ── localizar el libro ───────────────────────────────────────────────────────
def localizar_libro():
    """Devuelve la ruta del libro mas reciente. Si aparece uno en Descargas lo
       archiva primero en la unidad de trabajo — la regla es que nada se queda
       en C:\\Users\\...\\Downloads."""
    os.makedirs(ACERVO, exist_ok=True)
    movidos = []
    if os.path.isdir(DESCARGAS):
        for f in glob.glob(os.path.join(DESCARGAS, '*.xlsx')):
            if PATRON.lower() in os.path.basename(f).lower():
                stamp = time.strftime('%Y-%m-%d', time.localtime(os.path.getmtime(f)))
                destino = os.path.join(ACERVO, 'CallPickerChat_Usage_%s.xlsx' % stamp)
                n = 1
                while os.path.exists(destino):
                    destino = os.path.join(ACERVO, 'CallPickerChat_Usage_%s_%d.xlsx' % (stamp, n)); n += 1
                shutil.move(f, destino)
                movidos.append(destino)
    libros = sorted(glob.glob(os.path.join(ACERVO, '*.xlsx')), key=os.path.getmtime, reverse=True)
    if not libros:
        raise SystemExit(
            'No hay ningun libro en %s ni en Descargas.\n'
            'Descarga el Sheet como .xlsx (Archivo > Descargar > Microsoft Excel) y vuelve a correr.'
            % ACERVO)
    return libros[0], movidos


# ── lectura ──────────────────────────────────────────────────────────────────
def celda(v):
    """Normaliza cualquier celda a str o None, para que el resto del script
       trabaje sobre un solo tipo."""
    if v is None:
        return None
    if isinstance(v, bool):
        return 'S' if v else 'N'
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    # openpyxl entrega las celdas numericas como int/float. Sin esto, un CID
    # sale como "125600.0" y deja de casar con nada — ni con el reporte de
    # cambios, ni con la ficha de la cuenta, ni con `cuentas` en Supabase.
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    s = str(v).strip()
    if s in ('', '✔'):
        return 'S' if s == '✔' else None
    if s == '✗':
        return 'N'
    # fechas ISO con hora -> solo la fecha
    if re.match(r'^\d{4}-\d{2}-\d{2}T', s):
        return s[:10]
    return s


def leer_hoja(wb, nombre):
    if nombre not in wb.sheetnames:
        raise SystemExit('El libro no trae la hoja %r. Hojas: %s' % (nombre, wb.sheetnames))
    filas = list(wb[nombre].iter_rows(values_only=True))
    if not filas:
        raise SystemExit('La hoja %r vino vacia.' % nombre)
    cab = [str(c).strip() if c is not None else '' for c in filas[0]]
    out = []
    for f in filas[1:]:
        if not any(c is not None and str(c).strip() != '' for c in f):
            continue
        out.append({c: celda(v) for c, v in zip(cab, f) if c})
    return cab, out


def num(v, dec=False):
    if v is None or v == '':
        return None
    try:
        return float(v) if dec else int(float(v))
    except ValueError:
        return None


# ── semaforo de salud de uso ─────────────────────────────────────────────────
# Seis estados. El orden de evaluacion importa: los estados "no juzgables"
# (sin medicion / suspendida) ganan a todo, porque colorear una cuenta cuya
# lectura fallo seria inventar una conclusion.
UMBRAL_INTENSO = 3000     # mensajes en el periodo
UMBRAL_SANO    = 300
COBERTURA_MALA = 0.25     # inboxes contratados activos / contratados


def semaforo(c):
    """Devuelve (clave, motivos[]). Los motivos se muestran en la ficha para que
       el asesor sepa POR QUE la cuenta esta en ese color."""
    m = []
    if c['estado'] == 'suspended':
        return 'suspendida', ['Cuenta suspendida en el periodo — no se mide consumo.']
    if c['estado'] == 'operational_error':
        return 'sin_medicion', ['La recolección del periodo falló (operational_error): '
                                'la cifra de este corte no es confiable.']

    msgs = c['mensajes'] or 0
    if msgs == 0:
        m.append('Cero mensajes en el periodo completo.')
        if c['inboxesContratados']:
            m.append('%d inbox(es) contratado(s) sin un solo mensaje.' % c['inboxesContratados'])
        return 'sin_uso', m

    cobertura = None
    if c['inboxesContratados'] and c['inboxesActivos'] is not None:
        cobertura = c['inboxesActivos'] / c['inboxesContratados']

    # excedente de bolsa: solo cuando existe bolsa contratada de verdad
    if c['pctBolsa'] is not None and c['pctBolsa'] > 100:
        m.append('Rebasa la bolsa contratada: %.0f%% de %s mensajes.'
                 % (c['pctBolsa'], format(c['bolsaMensajes'], ',')))
        return 'intenso', m

    if msgs >= UMBRAL_INTENSO:
        m.append('Volumen alto: %s mensajes en el periodo.' % format(msgs, ','))
        if c['bolsaMensajes']:
            m.append('Revisar dimensionamiento del plan.')
        else:
            m.append('Sin bolsa contratada — candidato a revisión comercial.')
        return 'intenso', m

    malas = []
    if msgs < UMBRAL_SANO:
        malas.append('Actividad baja: %s mensajes en el periodo.' % format(msgs, ','))
    if cobertura is not None and cobertura < COBERTURA_MALA:
        malas.append('Solo %d de %d inboxes contratados tuvieron actividad.'
                     % (c['inboxesActivos'], c['inboxesContratados']))
    if c['tendencia'] == 'baja':
        malas.append('Tendencia a la baja%s.'
                     % ('' if c['crecimientoPct'] is None else ' (%.0f%%)' % c['crecimientoPct']))
    if malas:
        return 'bajo', malas

    m.append('Actividad sostenida: %s mensajes en el periodo.' % format(msgs, ','))
    if c['tendencia'] == 'sube':
        m.append('Tendencia al alza%s.' % ('' if c['crecimientoPct'] is None else ' (+%.0f%%)' % c['crecimientoPct']))
    if cobertura is not None:
        m.append('%d de %d inboxes contratados activos.' % (c['inboxesActivos'], c['inboxesContratados']))
    return 'saludable', m


def semaforo_cliente(cuentas):
    """Semaforo a nivel CID cuando el cliente tiene varias cuentas Chatwoot.

       NO se toma "el peor manda". Esa regla producia lecturas falsas: HomiRent
       tiene la cuenta "Homi Rent" con 163,063 mensajes y una "BOT-TEST" con
       cero, y el cliente entero salia "Sin uso". Un cliente con 163 mil
       mensajes no esta sin uso — su cuenta de pruebas si.

       Se evalua la MISMA regla sobre el agregado del cliente. El detalle por
       cuenta conserva su propio color, que es donde vive ese matiz."""
    vivas = [c for c in cuentas if c['semaforo'] not in ('sin_medicion', 'suspendida')]
    if not vivas:
        return ('suspendida', ['Todas las cuentas del cliente están suspendidas.']) \
            if all(c['semaforo'] == 'suspendida' for c in cuentas) \
            else ('sin_medicion', ['La recolección falló en todas las cuentas del cliente.'])

    if len(vivas) == 1:
        return vivas[0]['semaforo'], list(vivas[0]['motivos'])

    principal = max(vivas, key=lambda c: c['mensajes'])
    con_bolsa = [c for c in vivas if c['bolsaMensajes']]
    bolsa = sum(c['bolsaMensajes'] for c in con_bolsa) or None
    pct = (sum(c['mensajes'] for c in con_bolsa) / bolsa * 100) if bolsa else None
    agg = {
        'estado': 'ok',
        'mensajes': sum(c['mensajes'] for c in vivas),
        'inboxesContratados': sum(c['inboxesContratados'] or 0 for c in vivas) or None,
        'inboxesActivos': sum(c['inboxesActivos'] or 0 for c in vivas),
        'bolsaMensajes': bolsa,
        'pctBolsa': pct,
        'tendencia': principal['tendencia'],
        'crecimientoPct': principal['crecimientoPct'],
    }
    clave, motivos = semaforo(agg)
    motivos.append('Agregado de %d cuentas Chatwoot; cada una conserva su propio semáforo abajo.' % len(vivas))
    aparte = [c for c in cuentas if c['semaforo'] in ('sin_medicion', 'suspendida')]
    if aparte:
        motivos.append('%d cuenta(s) quedaron fuera del cálculo por falta de medición: %s.'
                       % (len(aparte), ', '.join(c['cuenta'] for c in aparte)))
    return clave, motivos


# ── lo que habia antes, para el reporte de cambios del viernes ───────────────
def semaforos_previos():
    if not os.path.exists(SALIDA):
        return {}
    s = io.open(SALIDA, encoding='utf-8').read()
    m = re.search(r'export const CHAT_CLIENTES: ChatCliente\[\] = \[\n(.*?)\n\]\n', s, re.S)
    if not m:
        return {}
    prev = {}
    for l in m.group(1).split('\n'):
        l = l.strip().rstrip(',')
        if not l:
            continue
        try:
            o = json.loads(l)
        except Exception:
            continue
        prev[o['cid']] = (o['semaforo'], o['nombre'], o['mensajes'])
    return prev


# Tipo de bandeja. Se usa `inbox_type`, NO `inbox_channel_type`: esa segunda es
# la clase interna de Chatwoot y mete WhatsApp API y WhatsApp QR en el mismo
# `Channel::Api`, que es justo la distincion que pidio Daniel (10 sep 2026).
# `inbox_type` si las separa, y `inbox_api_type` da el proveedor.
TIPO = {
    'whatsapp_api':      'WhatsApp API',
    'whatsapp_qr':       'WhatsApp QR',
    'facebook':          'Facebook',
    'facebook_comments': 'Comentarios de Facebook',
    'marketplace':       'Marketplace',
    'email':             'Correo',
    'web':               'Web',
    'api_other':         'API (otro)',
    'other':             'Otro',
}
PROVEEDOR = {
    'gupshup':          'Gupshup',
    'whatsbail':        'Whatsbail',
    'marcatel':         'Marcatel',
    'mercadolibre':     'MercadoLibre',
    'facebookcomments': 'Facebook',
    'whatsapp_qr':      'WhatsApp QR',
}
RECON = {'match': 'OK', 'partial_operational_error': 'ERR',
         'skipped_inbox_limit': 'LIM', 'suspended_skipped': 'SUSP'}


def error_inbox(v):
    """`inbox_operational_error` trae JSON como
       {"kind":"inbox_summary","inbox_id":97,"status":500}.
       Se reduce a algo legible para el asesor, conservando el codigo."""
    if not v:
        return None
    try:
        o = json.loads(v)
        st = o.get('status')
        if st:
            return 'HTTP %s al pedir el resumen de la bandeja' % st
        return str(o.get('kind') or v)[:80]
    except Exception:
        return str(v)[:80]


def main():
    try:
        import openpyxl
    except ImportError:
        raise SystemExit('Falta openpyxl:  python -m pip install openpyxl')

    libro, movidos = localizar_libro()
    print('=== FUENTE ===')
    for f in movidos:
        print('  archivado desde Descargas -> %s' % f)
    print('  libro: %s' % libro)
    print('  fecha: %s · %d B' % (time.strftime('%Y-%m-%d %H:%M', time.localtime(os.path.getmtime(libro))),
                                  os.path.getsize(libro)))

    wb = openpyxl.load_workbook(libro, data_only=True)
    cab_r, res = leer_hoja(wb, HOJA_RESUMEN)
    cab_i, inb = leer_hoja(wb, HOJA_INBOX)
    wb.close()
    print('  %-28s %5d filas x %2d columnas' % (HOJA_RESUMEN, len(res), len(cab_r)))
    print('  %-28s %5d filas x %2d columnas' % (HOJA_INBOX, len(inb), len(cab_i)))

    previos = semaforos_previos()

    # 1. rellenar CIDs perdidos en el origen, cruzando por client_name
    por_nombre = {}
    for f in res:
        if f.get('cid'):
            por_nombre.setdefault(f.get('client_name'), f['cid'])
    rellenados = 0
    for f in res + inb:
        if not f.get('cid') and f.get('client_name') in por_nombre:
            f['cid'] = por_nombre[f['client_name']]
            rellenados += 1

    # 2. periodo vigente de cada cuenta Chatwoot (+ el anterior como respaldo)
    porCuenta = collections.defaultdict(list)
    for f in res:
        if f.get('cid') and f.get('chatwoot_account_name'):
            porCuenta[(f['cid'], f['chatwoot_account_name'])].append(f)

    cuentas = []
    for (cid, nombreCuenta), filas in porCuenta.items():
        filas.sort(key=lambda x: x.get('period_start') or '', reverse=True)
        v, ant = filas[0], (filas[1] if len(filas) > 1 else None)
        c = {
            'cid': cid,
            'cliente': v.get('client_name'),
            'cuenta': nombreCuenta,
            # Daniel (10 sep 2026): "ya que le das click que muestre el nombre y
            # ID de la cuenta de CP chat... vale la pena tener la relacion
            # completa". El CID ya salia; faltaba el id de la cuenta Chatwoot.
            'cuentaId': num(v.get('chatwoot_account_id')),
            'periodo': v.get('period_start'),
            'corte': num(v.get('cutoff_day')),
            'estado': v.get('status'),
            'conversaciones':   num(v.get('conversations_total')) or 0,
            'mensajes':         num(v.get('messages_total')) or 0,
            'mensajesCliente':  num(v.get('customer_messages_total')) or 0,
            'mensajesSalida':   num(v.get('outgoing_messages_total')) or 0,
            'promedioPorConv':  num(v.get('avg_messages_per_conversation'), True),
            'inboxesContratados': num(v.get('contracted_inboxes_count')),
            'inboxesObservados':  num(v.get('observed_inboxes_count')),
            'inboxesActivos':     num(v.get('active_inboxes_count')),
            'inboxesInactivos':   num(v.get('inactive_inboxes_count')),
            'bolsaMensajes':    num(v.get('contracted_messages_monthly')) or None,
            'agentes':          num(v.get('contracted_agents')),
            'pctBolsa':         num(v.get('pct_uso_bolsa'), True),
            'mensajesPrevios':  num(v.get('prev_messages_total')),
            'crecimientoPct':   num(v.get('crecimiento_pct'), True),
            'tendencia':        v.get('tendencia'),
            'tier':             v.get('tier') or (ant.get('tier') if ant else None),
            'respaldoPeriodo':  ant.get('period_start') if ant else None,
            'respaldoMensajes': num(ant.get('messages_total')) if ant else None,
        }
        if c['bolsaMensajes'] == 0:
            c['bolsaMensajes'] = None
        if c['bolsaMensajes'] is None:
            c['pctBolsa'] = None
        c['semaforo'], c['motivos'] = semaforo(c)
        cuentas.append(c)

    # 3. inboxes del periodo vigente de cada cliente. Se descartan los renglones
    #    de relleno (inbox_id = 0 o sin nombre): no son inboxes, son el marcador
    #    de que la medicion se hizo por respaldo de cuenta.
    #    El periodo vigente se calcula por (CID, inbox), que es la unidad real.
    #    Agrupar por CID tiraba los inboxes de las cuentas con corte mas
    #    atrasado —Grupo SERVEX corta el 12 en una cuenta y el 25 en otra—, y
    #    agrupar por (CID, cuenta Chatwoot) duplicaba: el nombre de cuenta
    #    viene inconsistente en algunas filas y generaba dos claves para la
    #    misma cuenta, con lo que Akun reportaba 58 inboxes muertos de 31.
    #    Por (CID, inbox) queda exactamente una observacion por inbox: la mas
    #    reciente. Ni se pierde ni se duplica.
    def clave_inb(f):
        return (f.get('cid') or ('N:' + str(f.get('client_name'))), f.get('inbox_id'))

    ult_inb = {}
    for f in inb:
        k = clave_inb(f)
        p = f.get('period_start') or ''
        if k not in ult_inb or p > ult_inb[k]:
            ult_inb[k] = p

    porCliente  = collections.defaultdict(list)
    relleno     = collections.Counter()
    descartados = 0
    vistos      = set()
    for f in inb:
        k = clave_inb(f)
        if (f.get('period_start') or '') != ult_inb[k]:
            continue
        if k in vistos:          # misma observacion repetida en el origen
            continue
        vistos.add(k)
        if f.get('inbox_id') in (None, '0') or not f.get('inbox_name'):
            relleno[f.get('cid')] += 1
            continue
        # Se listan TODAS las bandejas reales del periodo, incluidas las que no
        # estan contratadas ni tuvieron actividad. Antes se descartaban 736 de
        # 1,068 y 43 clientes se quedaban sin ninguna — Daniel lo reporto el
        # 10 sep 2026: "veo importante enlistar las bandejas asi como aparecen
        # pero no identifique por que no en todos salen". Era un filtro mio, no
        # del origen. La UI las agrupa para que la lista siga siendo legible.
        tipo = f.get('inbox_type')
        prov = f.get('inbox_api_type')
        porCliente[f.get('cid')].append({
            'id':     num(f.get('inbox_id')),
            'nombre': f.get('inbox_name'),
            'tipo':      TIPO.get(tipo or '', tipo),          # null si el origen no lo trae
            'proveedor': PROVEEDOR.get(prov or '', prov),
            'contratado': f.get('is_contracted') == 'S',
            'activo':     f.get('is_active_in_period') == 'S',
            'observado':  f.get('is_observed_in_chatwoot') == 'S',
            'conversaciones': num(f.get('conversations_count')) or 0,
            'mensajes': num(f.get('messages_count')) or 0,
            'mensajesCliente': num(f.get('customer_messages_count')),
            'mensajesSalida':  num(f.get('outgoing_messages_count')),
            'pctCuenta': num(f.get('pct_account_messages'), True),
            'reconciliacion': RECON.get(f.get('reconciliation_status') or '', None),
            'error': error_inbox(f.get('inbox_operational_error')),
        })
    # orden: primero las que trabajan, luego contratadas ociosas, luego el resto
    def rango(i):
        if i['mensajes'] > 0: return 0
        if i['contratado']:   return 1
        return 2
    for lista in porCliente.values():
        lista.sort(key=lambda x: (rango(x), -x['mensajes'], x['nombre'] or ''))

    # 4. agrupar por CID
    porCid = collections.defaultdict(list)
    for c in cuentas:
        porCid[c['cid']].append(c)

    clientes = []
    for cid, cs in porCid.items():
        cs.sort(key=lambda x: (-x['mensajes'], x['cuenta']))
        inboxes = porCliente.get(cid, [])
        tiers = [c['tier'] for c in cs if c['tier']]
        sem, motivos = semaforo_cliente(cs)
        clientes.append({
            'cid': cid,
            'nombre': cs[0]['cliente'],
            'tier': tiers[0] if tiers else None,
            'semaforo': sem,
            'motivos': motivos,
            'cuentas': cs,
            'inboxes': inboxes,
            'inboxesRelleno': relleno.get(cid, 0),
            'mensajes':       sum(c['mensajes'] for c in cs),
            'conversaciones': sum(c['conversaciones'] for c in cs),
            'inboxesContratados': sum(c['inboxesContratados'] or 0 for c in cs),
            'inboxesObservados':  sum(c['inboxesObservados'] or 0 for c in cs),
            'contratadosMuertos':     sum(1 for i in inboxes if i['contratado'] and i['mensajes'] == 0),
            'sinContratoConTrafico':  sum(1 for i in inboxes if not i['contratado'] and i['mensajes'] > 0),
            'inboxesConTrafico':      sum(1 for i in inboxes if i['mensajes'] > 0),
            'inboxesSinClasificar':   sum(1 for i in inboxes if not i['tipo']),
            'inboxesConError':        sum(1 for i in inboxes if i['error']),
            'periodo': max(c['periodo'] or '' for c in cs),
            'conError': sum(1 for c in cs if c['semaforo'] == 'sin_medicion'),
        })
    clientes.sort(key=lambda c: (-c['mensajes'], c['nombre'] or ''))

    dist = collections.Counter(c['semaforo'] for c in clientes)
    resumen = {
        'clientes': len(clientes),
        'cuentas': len(cuentas),
        'inboxes': sum(len(v) for v in porCliente.values()),
        'mensajes': sum(c['mensajes'] for c in clientes),
        'conversaciones': sum(c['conversaciones'] for c in clientes),
        'distribucion': dict(dist),
        'contratadosMuertos':    sum(c['contratadosMuertos'] for c in clientes),
        'sinContratoConTrafico': sum(c['sinContratoConTrafico'] for c in clientes),
        'inboxesConTrafico':     sum(c['inboxesConTrafico'] for c in clientes),
        'inboxesSinClasificar':  sum(c['inboxesSinClasificar'] for c in clientes),
        'inboxesConError':       sum(c['inboxesConError'] for c in clientes),
        'clientesSinDesglose':   sum(1 for c in clientes if not c['inboxes']),
        'clientesSinUso':   dist.get('sin_uso', 0),
        'clientesConError': sum(1 for c in clientes if c['conError']),
        'cuentasConError':  sum(1 for c in cuentas if c['semaforo'] == 'sin_medicion'),
        'conBolsa': sum(1 for c in cuentas if c['bolsaMensajes']),
        'periodoMin': min(c['periodo'] for c in clientes if c['periodo']),
        'periodoMax': max(c['periodo'] for c in clientes if c['periodo']),
        'cidsRellenados': rellenados,
        'fuente': FUENTE,
        'libro': os.path.basename(libro),
        'generado': time.strftime('%Y-%m-%d', time.localtime(os.path.getmtime(libro))),
    }

    # ── emitir TypeScript ────────────────────────────────────────────────────
    def ts(v):
        return json.dumps(v, ensure_ascii=False)

    out, w = [], None
    out = []
    w = out.append
    w('/* ARCHIVO GENERADO — no editar a mano.')
    w(' * Lo produce scripts/gen-chat-data.py leyendo directo el .xlsx exportado de:')
    w(' *   %s' % FUENTE)
    w(' * Libro usado: %s' % os.path.basename(libro))
    w(' *')
    w(' * El semaforo NO replica `uso_rango` de la hoja: ese campo divide mensajes')
    w(' * entre agentes contratados y produce porcentajes sin sentido de plan')
    w(' * (hasta 433,369%). Aqui se mide SALUD DE USO. Ver el .py para la regla.')
    w(' */')
    w('')
    w("export type SemaforoChat = 'saludable' | 'intenso' | 'bajo' | 'sin_uso' | 'sin_medicion' | 'suspendida'")
    w('')
    w('export interface ChatInbox {')
    for l in ['id: number | null', 'nombre: string',
              'tipo: string | null', 'proveedor: string | null',
              'contratado: boolean', 'activo: boolean', 'observado: boolean',
              'conversaciones: number', 'mensajes: number',
              'mensajesCliente: number | null', 'mensajesSalida: number | null',
              'pctCuenta: number | null', 'reconciliacion: string | null',
              'error: string | null']:
        w('  ' + l)
    w('}')
    w('')
    w('export interface ChatCuenta {')
    for l in ['cid: string', 'cliente: string', 'cuenta: string', 'cuentaId: number | null',
              'periodo: string',
              'corte: number | null', 'estado: string', 'semaforo: SemaforoChat', 'motivos: string[]',
              'conversaciones: number', 'mensajes: number', 'mensajesCliente: number',
              'mensajesSalida: number', 'promedioPorConv: number | null',
              'inboxesContratados: number | null', 'inboxesObservados: number | null',
              'inboxesActivos: number | null', 'inboxesInactivos: number | null',
              'bolsaMensajes: number | null', 'agentes: number | null', 'pctBolsa: number | null',
              'mensajesPrevios: number | null', 'crecimientoPct: number | null',
              'tendencia: string | null', 'tier: string | null',
              'respaldoPeriodo: string | null', 'respaldoMensajes: number | null']:
        w('  ' + l)
    w('}')
    w('')
    w('export interface ChatCliente {')
    for l in ['cid: string', 'nombre: string', 'tier: string | null', 'semaforo: SemaforoChat',
              'motivos: string[]', 'cuentas: ChatCuenta[]', 'inboxes: ChatInbox[]',
              'inboxesRelleno: number', 'mensajes: number', 'conversaciones: number',
              'inboxesContratados: number', 'inboxesObservados: number',
              'contratadosMuertos: number', 'sinContratoConTrafico: number',
              'inboxesConTrafico: number', 'inboxesSinClasificar: number',
              'inboxesConError: number',
              'periodo: string', 'conError: number']:
        w('  ' + l)
    w('}')
    w('')
    w('export const CHAT_CLIENTES: ChatCliente[] = [')
    for c in clientes:
        w('  ' + ts(c) + ',')
    w(']')
    w('')
    w('export const CHAT_RESUMEN = ' + ts(resumen) + ' as const')
    w('')

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    io.open(SALIDA, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))

    # ── reporte ──────────────────────────────────────────────────────────────
    print()
    print('=== GENERADO ===')
    print('  %s' % os.path.relpath(SALIDA, RAIZ))
    print('  clientes %d · cuentas chatwoot %d · inboxes %d · mensajes %s'
          % (resumen['clientes'], resumen['cuentas'], resumen['inboxes'],
             format(resumen['mensajes'], ',')))
    print('  CIDs rellenados por nombre: %d · inboxes sin contrato ni actividad descartados: %d'
          % (rellenados, descartados))

    etq = {'saludable': 'Saludable', 'intenso': 'Uso intenso', 'bajo': 'Uso bajo',
           'sin_uso': 'Sin uso', 'sin_medicion': 'Sin medicion', 'suspendida': 'Suspendida'}
    print()
    print('=== SEMAFORO (por cliente) ===')
    for k in ['saludable', 'intenso', 'bajo', 'sin_uso', 'sin_medicion', 'suspendida']:
        print('  %-14s %3d  %s' % (etq[k], dist.get(k, 0), '#' * dist.get(k, 0)))

    print()
    print('=== SEÑALES COMERCIALES ===')
    print('  inboxes contratados sin un solo mensaje : %d' % resumen['contratadosMuertos'])
    print('  inboxes con trafico y SIN contratar     : %d' % resumen['sinContratoConTrafico'])
    print('  clientes con lectura rota este corte    : %d' % resumen['clientesConError'])
    print('  cuentas con bolsa de mensajes real      : %d de %d' % (resumen['conBolsa'], resumen['cuentas']))

    # que cambio desde la corrida anterior
    if previos:
        ahora = {c['cid']: (c['semaforo'], c['nombre'], c['mensajes']) for c in clientes}
        movidos_sem = [(cid, previos[cid], ahora[cid]) for cid in ahora
                       if cid in previos and previos[cid][0] != ahora[cid][0]]
        nuevos = [cid for cid in ahora if cid not in previos]
        idos   = [cid for cid in previos if cid not in ahora]
        print()
        print('=== CAMBIOS CONTRA LA CORRIDA ANTERIOR ===')
        if not movidos_sem and not nuevos and not idos:
            print('  ninguno — mismo semaforo para los %d clientes.' % len(ahora))
        for cid, (sa, nom, ma), (sn, _, mn) in sorted(movidos_sem, key=lambda x: -x[2][2]):
            print('  %-8s %-32s %-13s -> %-13s  (%s -> %s msj)'
                  % (cid, (nom or '')[:31], etq.get(sa, sa), etq.get(sn, sn),
                     format(ma, ','), format(mn, ',')))
        if nuevos:
            print('  clientes nuevos : %s' % ', '.join('%s (%s)' % (c, ahora[c][1]) for c in nuevos))
        if idos:
            print('  ya no aparecen  : %s' % ', '.join('%s (%s)' % (c, previos[c][1]) for c in idos))


if __name__ == '__main__':
    main()
