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


def rota(f):
    u"""Una lectura esta rota si el origen lo dice de CUALQUIERA de sus dos
       formas, y hay que mirar las dos.

       MEDIDO EN EL LIBRO DEL 17 NOV 2026: de 717 filas, 92 lo dicen por las
       dos vias a la vez, 0 solo por `status`... y DOCE solo por la columna
       `operational_error`, con `status = 'usage_alert'` y `messages_total`
       en cero.

       Mirar solo `status` -que es lo que se hacia- mandaba esas doce a
       `sin_uso`, o sea «cero mensajes en el periodo completo». Eso convierte
       «no pudimos leerla» en «el cliente dejo de usarlo»: un cero fabricado
       que ademas dispara trabajo de SAC contra un cliente que puede estar
       perfectamente. [[feedback-cero-sin-medicion]]
    """
    return (f.get('status') == 'operational_error'
            or bool((f.get('operational_error') or '').strip()))


# ── EL RESCATE: cuando falla la llamada de CUENTA, las de BANDEJA contestan ──
# POR QUE EXISTE (23 nov 2026). Jose Manuel: «Medicall Care esta en cero y si
# tiene movimiento». Lo tenia. El corte de octubre de Medicall Expert publica
# `messages_total = 0` porque `account_summary` devolvio HTTP 500 — pero la hoja
# de bandejas, EN LA MISMA CORRIDA, trae 6,118 mensajes en 4 bandejas con
# nombre y apellido (Gisel 3,047 · Karla 2,875 · C12 190 · C11 6).
#
# Hasta hoy `rota()` detectaba bien la condicion y el rescate que hacia era
# apuntar al MES ANTERIOR (`respaldoPeriodo`). Teniendo el dato del mismo
# periodo medido a un lado, mandar al asesor a un corte de agosto es peor que
# no decir nada: parece informacion y esta vencida.
#
# BARRIDO DEL LIBRO COMPLETO: 28 cortes · 18 cuentas · 18 clientes · 105,255
# mensajes medidos que se publicaban como cero. En el ULTIMO corte de cada
# cliente son 17 clientes y 42,094 mensajes.
#
# LA LLAVE ES (chatwoot_account_id, period_start, generated_at). No el nombre de
# cuenta —viene inconsistente y a veces vacio— y no (cid, periodo): un CID puede
# tener muchas cuentas de Chatwoot y Ancona Autopartes tiene QUINCE sucursales,
# cada una con su propia lectura. Contarlas juntas da un numero que no se puede
# reproducir; yo lo hice mal dos veces antes de acertar.
#
# Y `generated_at` NO sobra: las dos hojas no siempre vienen de la misma
# corrida. El agosto de Medicall tiene el resumen de la re-corrida del 24 sep
# (59,400, ok) y el detalle de la corrida fallida del 2 sep (4,112). Sin esa
# tercera parte de la llave, el rescate cruzaria fotos de dias distintos.
# [[callpicker-chat-fuente]] · [[feedback-cero-sin-medicion]]

# `measurement_scope` decide QUE es lo rescatado, y se midio sobre las 229
# llaves del libro donde se puede comparar detalle contra total de cuenta:
#   · `contracted_inboxes`                 -> cuadra 33 de 33 (100%). ES el total.
#   · `account_fallback_with_inbox_detail` -> cuadra 78 de 191 (41%). Es un PISO.
# Publicar un piso como si fuera el total es la misma falta que publicar un cero
# como si fuera desuso, solo que al reves. Por eso va separado y con palabras.
ALCANCE_EXACTO = 'contracted_inboxes'


def indiza_rescate(inb):
    """(acct, periodo, corrida) -> lo que midieron las bandejas de esa corrida.

       Devuelve ademas, por cuenta, la ultima fraccion CONOCIDA que capto el
       detalle frente al total de cuenta. Sin eso, un piso de 6,118 se lee como
       el dato; con eso se puede decir «en septiembre esta misma cuenta solo
       capto el 13%», que es lo que convierte un numero en una cota.
    """
    agg = collections.defaultdict(lambda: {
        'mensajes': 0, 'conversaciones': 0, 'cliente': 0, 'salida': 0,
        'bandejas': 0, 'conTrafico': 0, 'alcances': set(), 'total': None})
    for f in inb:
        acct = f.get('chatwoot_account_id')
        if not acct:
            continue
        # los renglones de relleno (inbox_id = 0, sin nombre) NO son bandejas:
        # marcan que la medicion se hizo por respaldo de cuenta. Si entraran,
        # el rescate contaria como bandeja medida justo lo que dice que no se
        # midio bandeja por bandeja.
        if f.get('inbox_id') in (None, '0') or not f.get('inbox_name'):
            continue
        k = (acct, f.get('period_start'), f.get('generated_at'))
        a = agg[k]
        m = num(f.get('messages_count')) or 0
        a['mensajes'] += m
        a['conversaciones'] += num(f.get('conversations_count')) or 0
        a['cliente'] += num(f.get('customer_messages_count')) or 0
        a['salida'] += num(f.get('outgoing_messages_count')) or 0
        a['bandejas'] += 1
        if m > 0:
            a['conTrafico'] += 1
        a['alcances'].add(f.get('measurement_scope'))
        t = num(f.get('account_messages_total'))
        if t is not None:
            a['total'] = t

    # historial de cobertura por cuenta, de lo mas viejo a lo mas nuevo
    ref = {}
    for (acct, per, _gen), a in sorted(agg.items(), key=lambda x: x[0][1] or ''):
        if a['total'] and a['total'] > 0:
            ref[acct] = (per, round(100.0 * a['mensajes'] / a['total'], 1))
    return agg, ref


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
    if c['lecturaRota']:
        m = ['La llamada de resumen de cuenta falló (operational_error): el '
             'cero de origen es de la lectura, no del cliente.']

        # PRIMERO el dato del MISMO periodo, si las bandejas sí contestaron.
        # Antes se saltaba directo al mes anterior teniendo esto al lado.
        # UNA SOLA REDACCION. La pantalla pinta estas mismas frases dentro del
        # bloque del rescate; cuando el bloque traia su propio texto, la ficha
        # decia dos veces lo mismo y ademas con dos redondeos distintos (13% en
        # la viñeta, 12.6% en el bloque). Van aqui, y la pantalla las SACA de la
        # lista de viñetas por identidad —no por patron— para pintarlas una vez.
        # No se recortan: Atlas sigue recibiendo `motivos` entero.
        # [[feedback-fuente-unica-cuentas]] · [[feedback-contexto-ia-sin-huecos]]
        resc = []
        if c['rescateExacto']:
            # `contracted_inboxes`: el detalle ES la medición, no una parte.
            resc.append('Medido bandeja por bandeja en este mismo periodo: '
                        '%s mensajes en %d de %d bandejas.'
                        % (format(c['rescateMensajes'], ','), c['rescateBandejas'],
                           c['rescateBandejasTotal']))
            m.extend(resc)
            c['motivosRescate'] = resc
            # y sigue al semaforo normal, con la cifra rescatada
        elif c['rescateMensajes']:
            resc.append('AL MENOS %s mensajes en este periodo, medidos en %d de %d '
                        'bandejas. No es el total: la suma de cuenta no se pudo '
                        'leer y el desglose por bandeja suele quedarse corto.'
                        % (format(c['rescateMensajes'], ','), c['rescateBandejas'],
                           c['rescateBandejasTotal']))
            if c['rescateRefPct'] is not None:
                resc.append('De qué tamaño puede ser el hueco: en el corte del %s '
                            'esta misma cuenta explicó por bandeja el %.1f%% de su '
                            'total.' % (c['rescateRefPeriodo'][:10], c['rescateRefPct']))
            if c['respaldoPeriodo']:
                resc.append('Referencia anterior completa: %s mensajes en el corte del %s.'
                            % (format(c['respaldoMensajes'] or 0, ','),
                               c['respaldoPeriodo'][:10]))
            m.extend(resc)
            c['motivosRescate'] = resc
            return 'sin_medicion', m
        else:
            # Sin rescate: el ultimo corte BUENO del mismo libro, cuando existe.
            if c['respaldoPeriodo']:
                m.append('Ninguna bandeja respondió en este corte. Último dato '
                         'fiable: %s mensajes en el corte del %s.'
                         % (format(c['respaldoMensajes'] or 0, ','),
                            c['respaldoPeriodo'][:10]))
            else:
                m.append('No hay ningún corte con lectura buena en todo el libro: '
                         'de esta cuenta no se sabe nada, que no es lo mismo que cero.')
            return 'sin_medicion', m

    msgs = c.get('mensajesEfectivos')
    if msgs is None:
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


# ── indicadores SAC / UX ─────────────────────────────────────────────────────
# Solo se calculan sobre cuentas MEDIBLES (lectura buena y con trafico). Cualquier
# agregado que meta las 28 cuentas con operational_error o las que tuvieron cero
# mensajes estaria mintiendo, asi que se excluyen y se reporta cuantas quedaron
# fuera. Ver [[feedback_contexto_ia_sin_huecos]].

def medible(c):
    # Desde el 23 nov 2026 una cuenta con RESCATE EXACTO tambien es medible: la
    # llamada de cuenta fallo pero el alcance declarado es `contracted_inboxes`,
    # donde el detalle ES la medicion (cuadra 33 de 33 en el libro). Las de
    # rescate PISO siguen fuera: con una cota no se calculan ratios.
    return ((not c['lecturaRota'] or c.get('rescateExacto'))
            and c['estado'] != 'suspended'
            and (c.get('mensajesEfectivos') or 0) > 0)


def ef(c, campo):
    """El valor utilizable del campo: el del origen si la lectura fue buena, el
       rescatado si no. Nunca mezcla: o toda la fila viene del resumen, o toda
       viene del detalle de bandejas de esa misma corrida."""
    if not c['lecturaRota']:
        return c[campo]
    return {'mensajes':        c.get('rescateMensajes'),
            'conversaciones':  c.get('rescateConversaciones'),
            'mensajesCliente': c.get('rescateCliente'),
            'mensajesSalida':  c.get('rescateSalida')}.get(campo, c[campo])


# Base minima para que un ratio signifique algo. Sin esto, una cuenta con 3
# mensajes entrantes y 0 salientes aparece como "desatencion total".
BASE_MINIMA = 200


def indicadores_cuenta(c):
    """Senales de servicio y experiencia, a nivel cuenta Chatwoot."""
    if not medible(c):
        return None
    ent, sal = ef(c, 'mensajesCliente') or 0, ef(c, 'mensajesSalida') or 0
    msgs = ef(c, 'mensajes') or 0
    conv = ef(c, 'conversaciones') or 0
    ind = {
        # BALANCE DE LA CONVERSACION — NO es "mensajes sin responder".
        # El dato es un conteo agregado por direccion: no existe mapeo
        # mensaje->respuesta, ni tiempos, ni identidad. En WhatsApp el cliente
        # final escribe en rafaga (5 lineas = 5 mensajes) y UNA respuesta las
        # atiende todas, asi que un ratio bajo puede ser operacion normal.
        # Se publica como pregunta a investigar, jamas como acusacion, y solo
        # cuando hay base suficiente.
        'balance': round(sal / ent, 2) if ent >= BASE_MINIMA else None,
        'baseBalance': ent,
        # el promedio del origen no existe cuando la lectura fallo: se
        # reconstruye del rescate en vez de quedarse mudo.
        'msjPorConv': (c['promedioPorConv'] if not c['lecturaRota']
                       else (round(msgs / conv, 1) if conv > 0 else None)),
        'cargaAgente': round(msgs / c['agentes']) if c['agentes'] else None,
        'crecimiento': c['crecimientoPct'],
    }
    # Un volumen enorme con 1-2 agentes no es sobrecarga humana: es automatizacion.
    # Marcarlo como "sobrecarga" mandaria al asesor a una conversacion equivocada.
    ind['probablementeBot'] = bool(
        ind['cargaAgente'] and ind['cargaAgente'] > 20000 and (c['agentes'] or 0) <= 2)
    return ind


def indicadores_cliente(cuentas, inboxes):
    """Senales que solo tienen sentido sumando las cuentas de un mismo CID."""
    vivas = [c for c in cuentas if medible(c)]
    if not vivas:
        return None
    ent = sum(ef(c, 'mensajesCliente') or 0 for c in vivas)
    sal = sum(ef(c, 'mensajesSalida') or 0 for c in vivas)
    conv = sum(ef(c, 'conversaciones') or 0 for c in vivas)
    msgs = sum(ef(c, 'mensajes') or 0 for c in vivas)
    agentes = sum(c['agentes'] or 0 for c in vivas)

    # 3. Mezcla de canal. El QR es conexion NO oficial de WhatsApp: se desconecta
    #    sola y Meta puede banear el numero. Volumen alto en QR sin API es riesgo
    #    de continuidad, no una preferencia tecnica.
    porTipo = collections.Counter()
    for i in inboxes:
        porTipo[i['tipo'] or 'Sin clasificar'] += i['mensajes']
    qr  = porTipo.get('WhatsApp QR', 0)
    api = porTipo.get('WhatsApp API', 0)

    # 4. Concentracion. El denominador son TODAS las bandejas del corte, no solo
    #    las que tuvieron trafico: con ese filtro una cuenta al 100% tiene UNA
    #    sola bandeja activa y quedaba excluida justo por ser el caso extremo
    #    —FINSUS Cobranza, 100% en 1 de 42, salia como None—.
    conTrafico = sorted([i['mensajes'] for i in inboxes if i['mensajes'] > 0], reverse=True)
    concentracion = None
    if conTrafico and len(inboxes) >= 3:
        concentracion = round(conTrafico[0] / sum(conTrafico), 3)

    # Cobertura del desglose: los mensajes que la hoja de bandejas explica contra
    # los que reporta la cuenta. En las cuentas medidas por respaldo esto es 0 —
    # cualquier lectura de canal debe declarar sobre que porcion se calcula.
    msgsInbox = sum(i['mensajes'] for i in inboxes)

    return {
        'balance':       round(sal / ent, 2) if ent >= BASE_MINIMA else None,
        'baseBalance':   ent,
        'msjPorConv':    round(msgs / conv, 1) if conv > 0 else None,
        'cargaAgente':   round(msgs / agentes) if agentes else None,
        'mensajesQR':    qr,
        'mensajesAPI':   api,
        'dependeDeQR':   bool(qr > 0 and api == 0),
        'pctQR':         round(100.0 * qr / (qr + api), 1) if (qr + api) > 0 else None,
        'concentracion': concentracion,
        'bandejasTotales':    len(inboxes),
        'bandejasConTrafico': len(conTrafico),
        'msgsExplicados':     msgsInbox,
        'coberturaDesglose':  round(100.0 * msgsInbox / msgs, 1) if msgs > 0 else None,
        'cuentasFueraDelCalculo': len(cuentas) - len(vivas),
        'mezclaCanal':   dict(porTipo),
    }


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
        if all(c['semaforo'] == 'suspendida' for c in cuentas):
            return 'suspendida', ['Todas las cuentas del cliente están suspendidas.']
        # «Falló la recolección» a secas ya no basta: puede haber rescate, y
        # decir solo que fallo esconde el volumen que SI se midio.
        m = ['La llamada de resumen falló en todas las cuentas del cliente.']
        resc = [c for c in cuentas if c['rescateMensajes']]
        if resc:
            m.append('Pero las bandejas sí respondieron: al menos %s mensajes '
                     'medidos en este mismo periodo, en %d de %d cuenta(s). '
                     'Un cero aquí sería falso.'
                     % (format(sum(c['rescateMensajes'] for c in resc), ','),
                        len(resc), len(cuentas)))
        else:
            m.append('Ninguna bandeja respondió tampoco, así que de este cliente '
                     'no se sabe nada en este corte — que no es lo mismo que cero.')
        return 'sin_medicion', m

    if len(vivas) == 1:
        return vivas[0]['semaforo'], list(vivas[0]['motivos'])

    # ef() y no c['mensajes']: desde el 23 nov `vivas` puede traer cuentas con
    # RESCATE EXACTO, cuyo `mensajes` de origen es 0 porque fallo la llamada de
    # cuenta. Sumar el crudo las metia en el agregado aportando cero y volvia a
    # fabricar la caida que el rescate vino a quitar.
    principal = max(vivas, key=lambda c: ef(c, 'mensajes') or 0)
    con_bolsa = [c for c in vivas if c['bolsaMensajes']]
    bolsa = sum(c['bolsaMensajes'] for c in con_bolsa) or None
    pct = (sum(ef(c, 'mensajes') or 0 for c in con_bolsa) / bolsa * 100) if bolsa else None
    agg = {
        'estado': 'ok',
        # El agregado se arma SOLO con `vivas`, de donde ya se excluyeron las
        # cuentas sin medicion y las suspendidas. Por construccion no puede
        # venir de una lectura rota, y las que si lo estan se nombran abajo en
        # vez de diluirse en la suma.
        'lecturaRota': False,
        'respaldoPeriodo': None,
        'respaldoMensajes': None,
        'mensajes': sum(ef(c, 'mensajes') or 0 for c in vivas),
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

    rescates, refCobertura = indiza_rescate(inb)

    cuentas = []
    for (cid, nombreCuenta), filas in porCuenta.items():
        filas.sort(key=lambda x: x.get('period_start') or '', reverse=True)
        v = filas[0]
        # EL RESPALDO ES EL ULTIMO CORTE CON LECTURA BUENA, no simplemente el
        # anterior. Cuando fallan dos cortes seguidos —y en el libro del 17 nov
        # 2026 pasa en varias cuentas— `filas[1]` es otra lectura rota, con lo
        # que el respaldo queda tan vacio como el vigente y la ficha no puede
        # decir nada de una cuenta de la que SI hay dato, un mes mas atras.
        #
        # El vigente NO se sustituye: lo que se publica como «el periodo» sigue
        # siendo el corte vigente. Fabricar un total mezclando el noviembre de
        # unas con el septiembre de otras seria otra mentira, solo que al reves.
        ant = next((f for f in filas[1:] if not rota(f)), None)
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
            'lecturaRota':      rota(v),
        }
        if c['bolsaMensajes'] == 0:
            c['bolsaMensajes'] = None
        if c['bolsaMensajes'] is None:
            c['pctBolsa'] = None

        # ── RESCATE con el detalle de bandejas de ESTA MISMA corrida ────────
        # `mensajes` NO se sobreescribe nunca: lo que el origen publico sigue
        # publicado, que es lo que hace auditable el rescate. Lo recuperado va
        # en campos propios y la pantalla lo nombra.
        r = rescates.get((v.get('chatwoot_account_id'), v.get('period_start'),
                          v.get('generated_at'))) if c['lecturaRota'] else None
        if r and r['mensajes'] > 0:
            alc = sorted(a for a in r['alcances'] if a)
            exacto = bool(alc) and all(a == ALCANCE_EXACTO for a in alc)
            refer = refCobertura.get(v.get('chatwoot_account_id'))
            c.update({
                'rescateMensajes':       r['mensajes'],
                'rescateConversaciones': r['conversaciones'],
                'rescateCliente':        r['cliente'],
                'rescateSalida':         r['salida'],
                'rescateBandejas':       r['conTrafico'],
                'rescateBandejasTotal':  r['bandejas'],
                'rescateExacto':         exacto,
                'rescateAlcance':        '/'.join(alc) or None,
                # de que tamano puede ser el hueco, medido en esta misma cuenta
                'rescateRefPeriodo': refer[0] if refer and not exacto else None,
                'rescateRefPct':     refer[1] if refer and not exacto else None,
            })
        else:
            c.update({k: None for k in (
                'rescateMensajes', 'rescateConversaciones', 'rescateCliente',
                'rescateSalida', 'rescateBandejas', 'rescateBandejasTotal',
                'rescateAlcance', 'rescateRefPeriodo', 'rescateRefPct')})
            c['rescateExacto'] = False

        # Lo que se puede afirmar del periodo: la cifra del origen cuando se
        # pudo leer, y el rescate cuando no. Es el campo que mira la pantalla.
        c['mensajesEfectivos'] = (c['mensajes'] if not c['lecturaRota']
                                  else (c['rescateMensajes'] or 0))

        # `semaforo()` la rellena cuando hay rescate; aqui queda el piso para
        # que el campo EXISTA siempre y la pantalla no tenga que preguntar.
        c['motivosRescate'] = []
        c['semaforo'], c['motivos'] = semaforo(c)
        c['sacux'] = indicadores_cuenta(c)
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
        sacux = indicadores_cliente(cs, inboxes)
        clientes.append({
            'sacux': sacux,
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
            # `mensajes` sigue siendo LO QUE PUBLICA EL ORIGEN, intacto. Esto
            # es lo que se puede afirmar del periodo sumando el rescate, y va
            # aparte para que nunca se confundan las dos bases de medicion.
            'mensajesEfectivos':  sum(c['mensajesEfectivos'] for c in cs),
            'mensajesRescatados': sum(c['rescateMensajes'] or 0 for c in cs),
            'rescateExacto':      sum(1 for c in cs if c['rescateExacto']),
            'rescatePiso':        sum(1 for c in cs
                                      if c['rescateMensajes'] and not c['rescateExacto']),
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
    # Por EFECTIVOS: un cliente rescatado tiene `mensajes` 0 y se hundia al
    # final de la lista justo cuando acabamos de demostrar que si tiene volumen.
    clientes.sort(key=lambda c: (-c['mensajesEfectivos'], c['nombre'] or ''))

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
        # ── DE QUE ESTA HECHO EL NUMERO GRANDE ──────────────────────────────
        # `mensajes` suma SOLO las cuentas cuyo corte vigente se pudo leer. Las
        # demas aportan cero, y hasta hoy eso no se decia en ninguna parte: la
        # tarjeta «Mensajes del periodo» cayo de 1,427,007 a 473,416 entre dos
        # cortes y se leia como un desplome del 67% del negocio, cuando lo que
        # se desplomo fue la LECTURA. Estos cuatro campos existen para que la
        # pantalla pueda decir sobre cuanto esta hablando.
        # [[feedback-cero-sin-medicion]] · [[feedback-contexto-ia-sin-huecos]]
        'cuentasMedidas':      sum(1 for c in cuentas if not c['lecturaRota']),
        'cuentasLecturaRota':  sum(1 for c in cuentas if c['lecturaRota']),
        'cuentasSinRespaldo':  sum(1 for c in cuentas
                                   if c['lecturaRota'] and not c['respaldoPeriodo']),
        # ── EL RESCATE (23 nov 2026) ────────────────────────────────────────
        # Lo que las bandejas SI midieron en los cortes cuya llamada de cuenta
        # fallo. No se suma a `mensajes` —son dos bases de medicion y mezclarlas
        # es justo lo que este modulo no hace—: va en su propio renglon, con el
        # reparto entre lo que es dato y lo que es cota.
        'mensajesRescatados':  sum(c['rescateMensajes'] or 0 for c in cuentas),
        'mensajesEfectivos':   sum(c['mensajesEfectivos'] for c in cuentas),
        'cuentasRescatadas':   sum(1 for c in cuentas if c['rescateMensajes']),
        'cuentasRescateExacto': sum(1 for c in cuentas if c['rescateExacto']),
        'cuentasRescatePiso':  sum(1 for c in cuentas
                                   if c['rescateMensajes'] and not c['rescateExacto']),
        'mensajesRescateExacto': sum(c['rescateMensajes'] or 0 for c in cuentas
                                     if c['rescateExacto']),
        'mensajesRescatePiso':   sum(c['rescateMensajes'] or 0 for c in cuentas
                                     if c['rescateMensajes'] and not c['rescateExacto']),
        # cuentas que siguen mudas: lectura rota y ninguna bandeja respondio
        'cuentasSinRescate':   sum(1 for c in cuentas
                                   if c['lecturaRota'] and not c['rescateMensajes']),
        # LO QUE EL RESCATE AÑADE DE VERDAD, y no es `mensajesRescatados`.
        # Hay cuentas con lectura rota que SI publicaron cifra —Travelling trae
        # 172 con un HTTP 429— y esos mensajes ya estaban dentro de `mensajes`.
        # Sumar los dos campos da 509,767 cuando el efectivo es 509,595: una
        # cuenta contada dos veces. Un numero que no se puede reproducir no se
        # publica, asi que el delta va calculado. [[feedback-tablas-deben-cerrar]]
        'mensajesRescateNeto': (sum(c['mensajesEfectivos'] for c in cuentas)
                                - sum(c['mensajes'] for c in cuentas)),
        # El respaldo que de verdad sigue siendo la unica referencia: el de las
        # cuentas MUDAS. `mensajesEnRespaldo` cuenta las 46 rotas, y atribuirselo
        # a las 28 que no se pudieron rescatar es inflar el hueco con volumen
        # que este corte ya midio. [[feedback-tablas-deben-cerrar]]
        'mensajesEnRespaldoMudas': sum(c['respaldoMensajes'] or 0 for c in cuentas
                                       if c['lecturaRota'] and not c['rescateMensajes']),
        # MISMA CORRECCION QUE ARRIBA, en el conteo. `cuentasSinRespaldo` son 9
        # sobre las 46 rotas, y una de ellas SI se rescato: decir «de las 28
        # mudas, 9 no tienen ningun corte bueno» mete una cuenta que este corte
        # ya midio en un subconjunto al que no pertenece, y la resta no cierra.
        # Son 8. [[feedback-tablas-deben-cerrar]] · [[feedback-cero-sin-medicion]]
        'cuentasSinRespaldoMudas': sum(1 for c in cuentas
                                       if c['lecturaRota']
                                       and not c['rescateMensajes']
                                       and not c['respaldoPeriodo']),
        'clientesRescatados':  sum(1 for c in clientes if c['mensajesRescatados']),
        # Volumen que esas cuentas tenian en su ULTIMO corte bueno. No entra en
        # `mensajes` —seria mezclar periodos— pero es la magnitud de lo que hoy
        # no se esta midiendo, y sin ella un 473,416 parece el total del chat.
        'mensajesEnRespaldo':  sum(c['respaldoMensajes'] or 0 for c in cuentas
                                   if c['lecturaRota']),
        'conBolsa': sum(1 for c in cuentas if c['bolsaMensajes']),
        'periodoMin': min(c['periodo'] for c in clientes if c['periodo']),
        'periodoMax': max(c['periodo'] for c in clientes if c['periodo']),
        'cidsRellenados': rellenados,
        'fuente': FUENTE,
        'libro': os.path.basename(libro),
        'generado': time.strftime('%Y-%m-%d', time.localtime(os.path.getmtime(libro))),
    }

    # ── diagnostico SAC / UX del portafolio ──────────────────────────────────
    # Reglas que se impusieron despues de que un panel de revision tumbara la
    # primera version (10 sep 2026):
    #  · Ningun agregado sin su denominador escrito.
    #  · El balance de conversacion NO se llama "mensajes sin responder": el dato
    #    no lo soporta. Se publica como pregunta, con base minima de BASE_MINIMA.
    #  · La lectura de canal declara que solo explica una fraccion del volumen.
    #  · Nada de score 0-100: promediar esconde justo el riesgo que mueve la junta.
    #  · La agenda se acota a la capacidad real (4 actividades por asesor/semana).
    medibles = [c for c in clientes if c.get('sacux')]
    sinUso   = [c for c in clientes if c['semaforo'] == 'sin_uso']
    sinMed   = [c for c in clientes if c['semaforo'] in ('sin_medicion', 'suspendida')]

    # EFECTIVOS, no crudos: el denominador del diagnostico tiene que ser el
    # mismo volumen que publica la tarjeta de arriba. Con el crudo, un cliente
    # rescatado pesaba CERO en la agenda justo despues de demostrar que tiene
    # volumen, y `pctExplicado` se calculaba contra un total mas chico de la
    # cuenta —inflandose—. [[feedback-metricas-derivadas-origen]]
    msgsTot   = sum(c['mensajesEfectivos'] for c in clientes)
    msgsInbox = sum(i['mensajes'] for c in clientes for i in c['inboxes'])
    msgsClasif = sum(i['mensajes'] for c in clientes for i in c['inboxes'] if i['tipo'])

    # EL EJEMPLO DE LA BRECHA, MEDIDO. La frase del apartado decia «PVnube, por
    # ejemplo, tiene 342,362 mensajes en su cuenta y cero en el desglose» con el
    # 342,362 TECLEADO A MANO. En el corte del 23 nov 2026 PVnube ya no cumple
    # nada de eso: su lectura esta rota, publica CERO, y 342,362 no coincide ni
    # con su respaldo (244,057). Un ejemplo escrito a mano deja de ser ejemplo en
    # cuanto cambia el corte, y entonces ilustra con un dato falso justo la
    # tarjeta que explica por que no hay que confiar en los totales.
    # [[feedback-verificar-antes-asegurar]] · [[feedback-fuente-unica-cuentas]]
    brecha = sorted(
        [{'nombre': c['nombre'], 'mensajes': c['mensajesEfectivos']}
         for c in clientes
         if c['mensajesEfectivos'] > 0
         and sum(i['mensajes'] for i in c['inboxes']) == 0],
        key=lambda x: -x['mensajes'])
    ejemploBrecha = dict(brecha[0], clientes=len(brecha)) if brecha else None

    riesgoQR = sorted(
        [{'cid': c['cid'], 'nombre': c['nombre'], 'tier': c['tier'],
          'qr': c['sacux']['mensajesQR'], 'api': c['sacux']['mensajesAPI']}
         for c in medibles if c['sacux']['dependeDeQR']],
        key=lambda x: -x['qr'])

    balance = sorted(
        [{'cid': c['cid'], 'nombre': c['nombre'], 'valor': c['sacux']['balance'],
          'base': c['sacux']['baseBalance'], 'mensajes': c['mensajes']}
         for c in medibles if c['sacux']['balance'] is not None],
        key=lambda x: x['valor'])

    concentradas = sorted(
        [{'cid': c['cid'], 'nombre': c['nombre'], 'pct': c['sacux']['concentracion'],
          'bandejas': c['sacux']['bandejasTotales'], 'activas': c['sacux']['bandejasConTrafico']}
         for c in medibles
         if c['sacux']['concentracion'] is not None and c['sacux']['concentracion'] >= 0.9],
        key=lambda x: -x['bandejas'])

    # conversaciones que no se cierran: solo el extremo, no un cuartil del propio
    # portafolio. 100 msj/conv no es "arriba del promedio", es un proceso roto.
    noCierran = sorted(
        [{'cid': c['cid'], 'nombre': c['nombre'], 'valor': c['sacux']['msjPorConv'],
          'conversaciones': c['conversaciones'], 'mensajes': c['mensajes']}
         for c in medibles if (c['sacux']['msjPorConv'] or 0) >= 100],
        key=lambda x: -x['valor'])

    automatizadas = [{'cid': c['cid'], 'nombre': c['nombre'],
                      'carga': c['sacux']['cargaAgente'], 'mensajes': c['mensajes']}
                     for c in medibles if any(
                         x.get('sacux', {}) and x['sacux'].get('probablementeBot') for x in c['cuentas'])]

    ociosas = sorted([{'cid': c['cid'], 'nombre': c['nombre'],
                       'muertas': c['contratadosMuertos'], 'total': len(c['inboxes'])}
                      for c in clientes if c['contratadosMuertos'] >= 3],
                     key=lambda x: -x['muertas'])

    fueraContrato = sorted([{'cid': c['cid'], 'nombre': c['nombre'],
                             'bandejas': c['sinContratoConTrafico'], 'mensajes': c['mensajes']}
                            for c in clientes if c['sinContratoConTrafico'] >= 5],
                           key=lambda x: -x['bandejas'])

    # ── agenda: una sola lista priorizada, no 70 banderas ────────────────────
    # Peso por severidad del hallazgo x tamano de la cuenta. Un cliente aparece
    # UNA vez, con su motivo principal — no una llamada por cada indicador.
    agenda = {}
    def proponer(c, motivo, guion, peso):
        prev = agenda.get(c['cid'])
        score = peso * (1 + (c['mensajes'] / max(1, msgsTot)) * 100)
        if not prev or score > prev['score']:
            agenda[c['cid']] = {'cid': c['cid'], 'nombre': c['nombre'], 'tier': c['tier'],
                                'mensajes': c['mensajes'], 'motivo': motivo,
                                'guion': guion, 'score': round(score, 2)}
    porCidObj = {c['cid']: c for c in clientes}
    for r in riesgoQR:
        proponer(porCidObj[r['cid']], 'Depende solo de WhatsApp QR',
                 'El número que usa para atender vive colgado de un celular enlazado. '
                 'Si Meta lo tumba se va el número y el historial. Proponer migración a API oficial.', 100)
    for r in noCierran:
        proponer(porCidObj[r['cid']], 'Conversaciones que no se cierran',
                 'Promedia %s mensajes por conversación. Revisar si los agentes están cerrando '
                 'las conversaciones al resolver; si no, las métricas de su operación no son fiables.'
                 % r['valor'], 60)
    for r in concentradas:
        proponer(porCidObj[r['cid']], 'Enrutamiento concentrado',
                 'El %.0f%% del tráfico cae en 1 de %d bandejas. Las demás confunden al cliente '
                 'final o están mal publicadas.' % (r['pct'] * 100, r['bandejas']), 50)
    for r in ociosas:
        proponer(porCidObj[r['cid']], 'Capacidad contratada sin usar',
                 '%d bandejas contratadas no registraron un solo mensaje. O se activan o se '
                 'ajusta el plan.' % r['muertas'], 45)
    for r in fueraContrato:
        proponer(porCidObj[r['cid']], 'Uso fuera del contrato',
                 '%d bandejas con tráfico no están contratadas. Revisar alcance comercial.'
                 % r['bandejas'], 40)
    for r in balance:
        if r['valor'] < 0.5:
            proponer(porCidObj[r['cid']], 'Balance de conversación bajo',
                     'Por cada 10 mensajes que entran salen %d. NO es prueba de falta de respuesta '
                     '—en WhatsApp se escribe en ráfaga— pero sí amerita abrir su bandeja y ver '
                     'qué está pasando.' % round(r['valor'] * 10), 35)

    agendaOrd = sorted(agenda.values(), key=lambda x: -x['score'])
    CAPACIDAD = 12   # 3 asesores x 4 actividades por semana

    sacux = {
        'cobertura': {
            'clientes': len(clientes),
            'medibles': len(medibles),
            'sinUso':   len(sinUso),
            'sinMedicion': len(sinMed),
            # de que esta hecho el denominador, con palabras y no por deduccion
            'rescatados':      resumen['cuentasRescatadas'],
            'rescateExacto':   resumen['cuentasRescateExacto'],
            'rescatePiso':     resumen['cuentasRescatePiso'],
            'cuentasMudas':    resumen['cuentasSinRescate'],
        },
        'volumen': {
            'total': msgsTot,
            'publicadoPorElOrigen': resumen['mensajes'],
            'rescatadoDeBandejas':  resumen['mensajesRescateNeto'],
            'explicadoPorBandeja': msgsInbox,
            'pctExplicado': round(100.0 * msgsInbox / msgsTot, 1) if msgsTot else None,
            'clasificadoPorTipo': msgsClasif,
            'pctClasificado': round(100.0 * msgsClasif / msgsTot, 1) if msgsTot else None,
            'ejemploBrecha': ejemploBrecha,
        },
        'mezclaCanal': dict(collections.Counter(
            {t: sum(i['mensajes'] for c in clientes for i in c['inboxes'] if (i['tipo'] or 'Sin clasificar') == t)
             for t in set((i['tipo'] or 'Sin clasificar') for c in clientes for i in c['inboxes'])})),
        'riesgoQR': riesgoQR,
        'balance': balance,
        'concentradas': concentradas,
        'noCierran': noCierran,
        'automatizadas': automatizadas,
        'ociosas': ociosas,
        'fueraContrato': fueraContrato,
        'agenda': agendaOrd[:CAPACIDAD],
        'agendaTotal': len(agendaOrd),
        'capacidad': CAPACIDAD,
        'baseMinimaBalance': BASE_MINIMA,
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
              'motivosRescate: string[]',
              'conversaciones: number', 'mensajes: number', 'mensajesCliente: number',
              'mensajesSalida: number', 'promedioPorConv: number | null',
              'inboxesContratados: number | null', 'inboxesObservados: number | null',
              'inboxesActivos: number | null', 'inboxesInactivos: number | null',
              'bolsaMensajes: number | null', 'agentes: number | null', 'pctBolsa: number | null',
              'mensajesPrevios: number | null', 'crecimientoPct: number | null',
              'tendencia: string | null', 'tier: string | null',
              'respaldoPeriodo: string | null', 'respaldoMensajes: number | null',
              'lecturaRota: boolean',
              '/** Lo que midieron las bandejas en ESTA misma corrida cuando la',
              ' *  llamada de cuenta falló. `mensajes` conserva el cero del',
              ' *  origen: esto va aparte para que el rescate sea auditable. */',
              'rescateMensajes: number | null', 'rescateConversaciones: number | null',
              'rescateCliente: number | null', 'rescateSalida: number | null',
              'rescateBandejas: number | null', 'rescateBandejasTotal: number | null',
              '/** true = el detalle ES el total (`contracted_inboxes`).',
              ' *  false = es un PISO: «al menos N». */',
              'rescateExacto: boolean', 'rescateAlcance: string | null',
              'rescateRefPeriodo: string | null', 'rescateRefPct: number | null',
              '/** `mensajes` si la lectura fue buena, el rescate si no. */',
              'mensajesEfectivos: number',
              'sacux: Record<string, any> | null']:
        w('  ' + l)
    w('}')
    w('')
    w('export interface ChatCliente {')
    for l in ['cid: string', 'nombre: string', 'tier: string | null', 'semaforo: SemaforoChat',
              'motivos: string[]', 'cuentas: ChatCuenta[]', 'inboxes: ChatInbox[]',
              'inboxesRelleno: number', 'mensajes: number', 'conversaciones: number',
              'mensajesEfectivos: number', 'mensajesRescatados: number',
              'rescateExacto: number', 'rescatePiso: number',
              'inboxesContratados: number', 'inboxesObservados: number',
              'contratadosMuertos: number', 'sinContratoConTrafico: number',
              'inboxesConTrafico: number', 'inboxesSinClasificar: number',
              'inboxesConError: number',
              'periodo: string', 'conError: number',
              'sacux: Record<string, any> | null']:
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
    w('/** Diagnostico SAC/UX del portafolio. Cada bloque trae su denominador. */')
    w('export const CHAT_SACUX = ' + ts(sacux) + ' as const')
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
    print('=== RESCATE CON EL DETALLE DE BANDEJAS ===')
    print('  cuentas con lectura de cuenta rota      : %d' % resumen['cuentasLecturaRota'])
    print('    de ellas, rescatadas del mismo periodo: %d  (%s mensajes)'
          % (resumen['cuentasRescatadas'], format(resumen['mensajesRescatados'], ',')))
    print('      · dato exacto (contracted_inboxes)  : %d  (%s mensajes)'
          % (resumen['cuentasRescateExacto'], format(resumen['mensajesRescateExacto'], ',')))
    print('      · piso «al menos N» (fallback)      : %d  (%s mensajes)'
          % (resumen['cuentasRescatePiso'], format(resumen['mensajesRescatePiso'], ',')))
    print('    siguen mudas (ninguna bandeja contesto): %d' % resumen['cuentasSinRescate'])
    print('  mensajes publicados por el origen       : %s' % format(resumen['mensajes'], ','))
    print('  mensajes que se pueden afirmar          : %s' % format(resumen['mensajesEfectivos'], ','))
    if resumen['cuentasRescatadas']:
        print()
        print('  los rescates, uno por uno:')
        for c in sorted((x for x in cuentas if x['rescateMensajes']),
                        key=lambda x: -x['rescateMensajes']):
            print('    %-8s %-26s %-24s %9s  %s'
                  % (c['cid'], (c['cliente'] or '')[:26], (c['cuenta'] or '')[:24],
                     format(c['rescateMensajes'], ','),
                     'DATO' if c['rescateExacto'] else 'piso'))

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
