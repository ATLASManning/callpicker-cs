"""Genera app/callpicker-chat/chat-data.ts a partir de las dos hojas del Sheet
   "CallPickerChat Usage - Customer Health".

   ENTRADA  scripts/data/chat-resumen.psv   <- hoja "Chat Usage Monthly"      (gid 441360398)
            scripts/data/chat-inbox.psv     <- hoja "Chat Inbox Usage Monthly"(gid 378704305)
   SALIDA   app/callpicker-chat/chat-data.ts

   Refresco semanal (viernes por la tarde):
     1. Volver a exportar las dos hojas a esos dos .psv (separador "|", vacio = "~").
     2. python scripts/gen-chat-data.py
     3. commit + push.

   POR QUE NO SE USA `uso_rango` DE LA HOJA COMO SEMAFORO
   -----------------------------------------------------
   En la hoja, `pct_uso` se calcula sobre `contracted_agents` cuando
   base_medicion = "agentes" (83 de 130 clientes). Eso NO es consumo de plan:
   es mensajes por agente. Produce valores como 433,369% (PVnube) o 51,602%
   (HomiRent), y deja 70 de 130 cuentas en el rango "100+" como si rebasaran su
   plan. Solo ~12 cuentas tienen bolsa de mensajes real
   (`contracted_messages_monthly` > 0), que es el unico caso donde un porcentaje
   de plan significa algo — ese se conserva aparte como `pctBolsa`.

   El semaforo que se construye aqui responde otra pregunta, la que si le sirve
   a Customer Success: **esta cuenta le esta sacando valor al chat?**
"""
import sys, io, os, re, json, collections

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, 'scripts', 'data')
SALIDA = os.path.join(RAIZ, 'app', 'callpicker-chat', 'chat-data.ts')

FUENTE = 'https://docs.google.com/spreadsheets/d/1qW_eY7m_kevph9bEiZtaN8vX7fee_PQzjTlc8Mlp2-g/edit'


# ── lectura ──────────────────────────────────────────────────────────────────
def leer(nombre):
    ruta = os.path.join(DATOS, nombre)
    lineas = io.open(ruta, encoding='utf-8').read().strip().split('\n')
    cab = lineas[0].split('|')
    filas = []
    for i, l in enumerate(lineas[1:], 2):
        p = l.split('|')
        if len(p) != len(cab):
            raise SystemExit('%s linea %d: %d columnas, se esperaban %d' % (nombre, i, len(p), len(cab)))
        filas.append({c: (None if v == '~' else v) for c, v in zip(cab, p)})
    return filas


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
UMBRAL_SANO = 300
COBERTURA_MALA = 0.25     # inboxes contratados activos / contratados


def semaforo(c):
    """Devuelve (clave, motivos[]). Los motivos se muestran en la ficha para que
       el asesor sepa POR QUE la cuenta esta en ese color."""
    m = []
    if c['estado'] == 'suspended':
        return 'suspendida', ['Cuenta suspendida en el periodo — no se mide consumo.']
    if c['estado'] == 'operational_error':
        return 'sin_medicion', ['La recoleccion del periodo fallo (operational_error): '
                                'la cifra de este corte no es confiable.']

    msgs = c['mensajes'] or 0
    if msgs == 0:
        m.append('Cero mensajes en el periodo completo.')
        if c['inboxesContratados']:
            m.append('%d inbox(es) contratado(s) sin un solo mensaje.' % c['inboxesContratados'])
        return 'sin_uso', m

    # a partir de aqui hay actividad real
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
            m.append('Sin bolsa contratada — candidato a revision comercial.')
        return 'intenso', m

    señales_malas = []
    if msgs < UMBRAL_SANO:
        señales_malas.append('Actividad baja: %s mensajes en el periodo.' % format(msgs, ','))
    if cobertura is not None and cobertura < COBERTURA_MALA:
        señales_malas.append('Solo %d de %d inboxes contratados tuvieron actividad.'
                             % (c['inboxesActivos'], c['inboxesContratados']))
    if c['tendencia'] == 'baja':
        señales_malas.append('Tendencia a la baja%s.'
                             % ('' if c['crecimientoPct'] is None else ' (%.0f%%)' % c['crecimientoPct']))

    if señales_malas:
        return 'bajo', señales_malas

    m.append('Actividad sostenida: %s mensajes en el periodo.' % format(msgs, ','))
    if c['tendencia'] == 'sube':
        m.append('Tendencia al alza%s.' % ('' if c['crecimientoPct'] is None else ' (+%.0f%%)' % c['crecimientoPct']))
    if cobertura is not None:
        m.append('%d de %d inboxes contratados activos.' % (c['inboxesActivos'], c['inboxesContratados']))
    return 'saludable', m


# el peor semaforo manda cuando un CID tiene varias cuentas Chatwoot
PEOR = ['sin_uso', 'bajo', 'sin_medicion', 'suspendida', 'saludable', 'intenso']


def peor(claves):
    for k in PEOR:
        if k in claves:
            return k
    return 'sin_medicion'


# ── armado ───────────────────────────────────────────────────────────────────
def main():
    res = leer('chat-resumen.psv')
    inb = leer('chat-inbox.psv')

    # 1. rellenar CIDs perdidos en el origen, cruzando por client_name
    por_nombre = {}
    for f in res:
        if f['cid']:
            por_nombre.setdefault(f['client_name'], f['cid'])
    rellenados = 0
    for f in res + inb:
        if not f['cid'] and f['client_name'] in por_nombre:
            f['cid'] = por_nombre[f['client_name']]
            rellenados += 1

    # 2. quedarnos con el periodo vigente de cada cuenta Chatwoot, guardando el
    #    anterior como respaldo (sirve cuando el vigente trae operational_error)
    porCuenta = collections.defaultdict(list)
    for f in res:
        porCuenta[(f['cid'], f['chatwoot_account_name'])].append(f)

    cuentas = []
    for (cid, nombreCuenta), filas in porCuenta.items():
        filas.sort(key=lambda x: x['period_start'], reverse=True)
        v, ant = filas[0], (filas[1] if len(filas) > 1 else None)
        c = {
            'cid': cid,
            'cliente': v['client_name'],
            'cuenta': nombreCuenta,
            'periodo': v['period_start'],
            'corte': num(v['cutoff_day']),
            'estado': v['status'],
            'conversaciones': num(v['conversations_total']) or 0,
            'mensajes': num(v['messages_total']) or 0,
            'mensajesCliente': num(v['customer_messages_total']) or 0,
            'mensajesSalida': num(v['outgoing_messages_total']) or 0,
            'promedioPorConv': num(v['avg_messages_per_conversation'], True),
            'inboxesContratados': num(v['contracted_inboxes_count']),
            'inboxesObservados': num(v['observed_inboxes_count']),
            'inboxesActivos': num(v['active_inboxes_count']),
            'inboxesInactivos': num(v['inactive_inboxes_count']),
            'bolsaMensajes': num(v['contracted_messages_monthly']) or None,
            'agentes': num(v['contracted_agents']),
            'pctBolsa': num(v['pct_uso_bolsa'], True),
            'mensajesPrevios': num(v['prev_messages_total']),
            'crecimientoPct': num(v['crecimiento_pct'], True),
            'tendencia': v['tendencia'],
            'tier': v['tier'] or (ant['tier'] if ant else None),
            'respaldoPeriodo': ant['period_start'] if ant else None,
            'respaldoMensajes': num(ant['messages_total']) if ant else None,
        }
        # `contracted_messages_monthly` viene en 0 cuando no hay bolsa: 0 no es bolsa
        if c['bolsaMensajes'] == 0:
            c['bolsaMensajes'] = None
        if c['bolsaMensajes'] is None:
            c['pctBolsa'] = None
        c['semaforo'], c['motivos'] = semaforo(c)
        cuentas.append(c)

    # 3. inboxes: se descartan los renglones de relleno (inbox_id = 0), que no son
    #    inboxes reales sino el marcador del metodo de medicion por respaldo
    porCliente = collections.defaultdict(list)
    placeholders = collections.Counter()
    for f in inb:
        if f['inbox_id'] == '0' or not f['inbox_name']:
            placeholders[f['cid']] += 1
            continue
        porCliente[f['cid']].append({
            'id': num(f['inbox_id']),
            'nombre': f['inbox_name'],
            'canal': f['inbox_channel_type'],
            'contratado': f['is_contracted'] == 'S',
            'activo': f['is_active_in_period'] == 'S',
            'conversaciones': num(f['conversations_count']) or 0,
            'mensajes': num(f['messages_count']) or 0,
            'mensajesCliente': num(f['customer_messages_count']),
            'mensajesSalida': num(f['outgoing_messages_count']),
            'pctCuenta': num(f['pct_account_messages'], True),
            'reconciliacion': f['reconciliation_status'],
        })
    for lista in porCliente.values():
        lista.sort(key=lambda x: (-x['mensajes'], x['nombre']))

    # 4. agrupar por CID
    porCid = collections.defaultdict(list)
    for c in cuentas:
        porCid[c['cid']].append(c)

    clientes = []
    for cid, cs in porCid.items():
        cs.sort(key=lambda x: (-x['mensajes'], x['cuenta']))
        inboxes = porCliente.get(cid, [])
        tiers = [c['tier'] for c in cs if c['tier']]
        clientes.append({
            'cid': cid,
            'nombre': cs[0]['cliente'],
            'tier': tiers[0] if tiers else None,
            'semaforo': peor([c['semaforo'] for c in cs]),
            'cuentas': cs,
            'inboxes': inboxes,
            'inboxesRelleno': placeholders.get(cid, 0),
            'mensajes': sum(c['mensajes'] for c in cs),
            'conversaciones': sum(c['conversaciones'] for c in cs),
            'inboxesContratados': sum(c['inboxesContratados'] or 0 for c in cs),
            'inboxesObservados': sum(c['inboxesObservados'] or 0 for c in cs),
            'contratadosMuertos': sum(1 for i in inboxes if i['contratado'] and i['mensajes'] == 0),
            'sinContratoConTrafico': sum(1 for i in inboxes if not i['contratado'] and i['mensajes'] > 0),
            'periodo': max(c['periodo'] for c in cs),
            'conError': sum(1 for c in cs if c['semaforo'] == 'sin_medicion'),
        })
    clientes.sort(key=lambda c: (-c['mensajes'], c['nombre']))

    # 5. totales de portafolio
    dist = collections.Counter(c['semaforo'] for c in clientes)
    resumen = {
        'clientes': len(clientes),
        'cuentas': len(cuentas),
        'inboxes': sum(len(v) for v in porCliente.values()),
        'mensajes': sum(c['mensajes'] for c in clientes),
        'conversaciones': sum(c['conversaciones'] for c in clientes),
        'distribucion': dict(dist),
        'contratadosMuertos': sum(c['contratadosMuertos'] for c in clientes),
        'sinContratoConTrafico': sum(c['sinContratoConTrafico'] for c in clientes),
        'clientesSinUso': dist.get('sin_uso', 0),
        'clientesConError': sum(1 for c in clientes if c['conError']),
        'conBolsa': sum(1 for c in cuentas if c['bolsaMensajes']),
        'periodoMin': min(c['periodo'] for c in clientes),
        'periodoMax': max(c['periodo'] for c in clientes),
        'cidsRellenados': rellenados,
        'fuente': FUENTE,
    }

    # ── emitir TypeScript ────────────────────────────────────────────────────
    def ts(v):
        return json.dumps(v, ensure_ascii=False)

    out = []
    w = out.append
    w('/* ARCHIVO GENERADO — no editar a mano.')
    w(' * Lo produce scripts/gen-chat-data.py desde scripts/data/chat-*.psv,')
    w(' * que salen de las hojas "Chat Usage Monthly" y "Chat Inbox Usage Monthly" de:')
    w(' *   %s' % FUENTE)
    w(' *')
    w(' * El semaforo NO replica `uso_rango` de la hoja: ese campo divide mensajes')
    w(' * entre agentes contratados y produce porcentajes sin sentido de plan')
    w(' * (hasta 433,369%%). Aqui se mide SALUD DE USO. Ver el .py para la regla.')
    w(' */')
    w('')
    w("export type SemaforoChat = 'saludable' | 'intenso' | 'bajo' | 'sin_uso' | 'sin_medicion' | 'suspendida'")
    w('')
    w('export interface ChatInbox {')
    w('  id: number | null')
    w('  nombre: string')
    w('  canal: string | null')
    w('  contratado: boolean')
    w('  activo: boolean')
    w('  conversaciones: number')
    w('  mensajes: number')
    w('  mensajesCliente: number | null')
    w('  mensajesSalida: number | null')
    w('  pctCuenta: number | null')
    w('  reconciliacion: string | null')
    w('}')
    w('')
    w('export interface ChatCuenta {')
    w('  cid: string')
    w('  cliente: string')
    w('  cuenta: string')
    w('  periodo: string')
    w('  corte: number | null')
    w('  estado: string')
    w('  semaforo: SemaforoChat')
    w('  motivos: string[]')
    w('  conversaciones: number')
    w('  mensajes: number')
    w('  mensajesCliente: number')
    w('  mensajesSalida: number')
    w('  promedioPorConv: number | null')
    w('  inboxesContratados: number | null')
    w('  inboxesObservados: number | null')
    w('  inboxesActivos: number | null')
    w('  inboxesInactivos: number | null')
    w('  bolsaMensajes: number | null')
    w('  agentes: number | null')
    w('  pctBolsa: number | null')
    w('  mensajesPrevios: number | null')
    w('  crecimientoPct: number | null')
    w('  tendencia: string | null')
    w('  tier: string | null')
    w('  respaldoPeriodo: string | null')
    w('  respaldoMensajes: number | null')
    w('}')
    w('')
    w('export interface ChatCliente {')
    w('  cid: string')
    w('  nombre: string')
    w('  tier: string | null')
    w('  semaforo: SemaforoChat')
    w('  cuentas: ChatCuenta[]')
    w('  inboxes: ChatInbox[]')
    w('  inboxesRelleno: number')
    w('  mensajes: number')
    w('  conversaciones: number')
    w('  inboxesContratados: number')
    w('  inboxesObservados: number')
    w('  contratadosMuertos: number')
    w('  sinContratoConTrafico: number')
    w('  periodo: string')
    w('  conError: number')
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

    print('=== GENERADO ===')
    print('  %s' % os.path.relpath(SALIDA, RAIZ))
    print('  clientes %d · cuentas chatwoot %d · inboxes %d'
          % (resumen['clientes'], resumen['cuentas'], resumen['inboxes']))
    print('  CIDs rellenados por nombre: %d' % rellenados)
    print()
    print('=== SEMAFORO (por cliente) ===')
    etq = {'saludable': 'Saludable', 'intenso': 'Uso intenso', 'bajo': 'Uso bajo',
           'sin_uso': 'Sin uso', 'sin_medicion': 'Sin medicion', 'suspendida': 'Suspendida'}
    for k in ['saludable', 'intenso', 'bajo', 'sin_uso', 'sin_medicion', 'suspendida']:
        n = dist.get(k, 0)
        print('  %-14s %3d  %s' % (etq[k], n, '#' * n))
    print()
    print('=== SEÑALES COMERCIALES ===')
    print('  inboxes contratados sin un solo mensaje : %d' % resumen['contratadosMuertos'])
    print('  inboxes con trafico y SIN contratar     : %d' % resumen['sinContratoConTrafico'])
    print('  clientes con lectura rota este corte    : %d' % resumen['clientesConError'])
    print('  cuentas con bolsa de mensajes real      : %d de %d' % (resumen['conBolsa'], resumen['cuentas']))


if __name__ == '__main__':
    main()
