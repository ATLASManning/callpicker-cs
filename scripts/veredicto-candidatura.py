# -*- coding: utf-8 -*-
"""EL VEREDICTO: a qué es candidato cada cuenta, o por qué no lo es.

   Instruccion de direccion (21 sep 2026): «el resultado debe ser a que es
   candidato cada uno, o no». Ninguna cuenta de la cartera se queda sin
   respuesta — hoy son 222, y el cierre se mide contra ese total, no contra un
   numero escrito a mano.

   COMO SE DECIDE, EN ESTE ORDEN
   -----------------------------
   1. LA AUDITORIA MANDA. Si la cuenta tiene una de las 33 auditorias, el
      producto lo decidio un analista leyendo el caso completo, y eso pesa mas
      que cualquier regla. Se filtra lo que ya tiene: una auditoria que pide
      Chat para quien ya usa Chat no se repite.
   2. LA ESCALERA. Tiene CE -> Visibilidad y Control. Tiene VyC y visito la
      seccion Desarrolladores -> Integracion API. Tiene VyC y 60%+ de llamadas
      entrantes -> Asistente Virtual.
   3. CHAT POR EVIDENCIA. Dos o mas senales registradas y sin Chat.
   4. MAS CAPACIDAD. Consume 85% o mas de su bolsa: ya paga lo que usa.
   5. NO CANDIDATO. Y se dice EXACTAMENTE que falta para que deje de serlo.

   Un bloqueo NO borra la candidatura: dice que hoy no se puede abordar. Por
   eso el veredicto separa «a que es candidato» de «se puede hoy», en vez de
   fundir las dos cosas en un NO que esconde la oportunidad.
"""
import io
import json
import os
import re
import sys
import unicodedata
from collections import Counter, defaultdict

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESC = json.load(io.open(os.path.join(RAIZ, 'data', 'crecimiento-escalera.json'), encoding='utf-8'))['cuentas']
AUD = json.load(io.open(os.path.join(RAIZ, 'data', 'auditorias-candidatura.json'), encoding='utf-8'))['casos']
SALIDA = os.path.join(RAIZ, 'data', 'veredicto-candidatura.json')

# ══════════════════════════════════════════════════════════════════════════
#  ANALISIS DE LLAMADAS — la señal dura del Asistente Virtual
# ══════════════════════════════════════════════════════════════════════════
# Antes el Asistente Virtual se decidía con el «% de llamadas entrantes» del
# corte, y ese dato se equivoca EN LAS DOS DIRECCIONES: no veía a Alianza
# Multimarca, con 40,935 llamadas sin contestar y un corte que decía 0% de
# entrantes; y señalaba a Gruas el Toques, que contesta el 96%. De 113 cuentas
# con ambas cifras, 42 estaban mal clasificadas.
#
# Lo que decide ahora es lo que de verdad importa: cuántas llamadas ENTRAN y
# NO se contestan. Reglas del módulo que se respetan (lib/llamadas-cuenta.ts):
#   · entrante «Lost» y saliente «Lost» NO son lo mismo y no se suman
#   · `Self_service` NO es falla: el menú SÍ resolvió la llamada
#   · el denominador es siempre el total de entrantes
_LL = json.load(io.open(os.path.join(RAIZ, 'data', 'analisis-llamadas.json'), encoding='utf-8'))
LLAM = _LL['cuentas']
LLAM_META = _LL['meta']
VOLUMEN_MINIMO = 30          # U.VOLUMEN_MINIMO: menos que esto no se interpreta
UMBRAL_SIN_CONTESTAR = 20    # % de entrantes perdidas que abre el caso de AV
UMBRAL_MENU = 50             # % resuelto por menú: ya automatiza


def llamadas_de(cid):
    """Lectura de llamadas de una cuenta, o None si no hay con qué medir."""
    c = LLAM.get(str(cid or ''))
    if not c:
        return None
    ent = c.get('ent') or {}
    tot = ent.get('total') or 0
    if tot < VOLUMEN_MINIMO:
        return None
    tp = ent.get('tipos') or {}
    perdidas = tp.get('Lost', 0)
    menu = tp.get('Self_service', 0)
    sal = c.get('sal') or {}
    return {
        'entrantes': tot,
        'sin_contestar': perdidas,
        'pct_sin_contestar': 100.0 * perdidas / tot,
        'menu': menu,
        'pct_menu': 100.0 * menu / tot,
        'buzon': tp.get('Voicemail', 0),
        'salientes': sal.get('total') or 0,
        'ventana': '%s a %s' % (ent.get('desde') or '?', ent.get('hasta') or '?'),
        'corte_origen': c.get('corte'),
    }


print('Cuentas: %d · Auditorias: %d · Lecturas de llamadas: %d'
      % (len(ESC), len(AUD), len(LLAM)))


# ══════════════════════════════════════════════════════════════════════════
#  CRUCE POR NOMBRE — la parte fragil, asi que se reporta lo que no case
# ══════════════════════════════════════════════════════════════════════════
def clave(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    s = re.sub(r'\b(s\.?a\.?\s*de\s*c\.?v\.?|s\.?a\.?p\.?i\.?|s\.?\s*de\s*r\.?l\.?|'
               r'sa\s*de\s*cv|sapi|srl|s\.?c\.?|inc|llc|group|grupo)\b', ' ', s)
    return re.sub(r'[^a-z0-9]+', '', s)


# Alias verificados a mano: la auditoria y la cuenta se llaman distinto y el
# emparejador automatico no puede saberlo. Se comprobo uno por uno.
ALIAS = {
    'FINSUS – Economía Móvil Inteligente S.A. de C.V.': 'Finsus Growth',
    'LABSUS Centro Diagnóstico': 'labsus lab',
}
# Auditorias de cuentas que NO estan en la cartera. Se declaran para que no
# parezcan un fallo del cruce: no hay a quien ofrecerle nada porque la cuenta
# no existe en `cuentas`.
FUERA_DE_CARTERA = {
    'Brand-Kern-Liebers México, S.A. de C.V.',
    'RDS / Invest Vacay Group',
}

por_clave = defaultdict(list)
for c in ESC:
    por_clave[clave(c['empresa'])].append(c)

emparejadas = {}
sin_pareja = []
fuera = []
for a in AUD:
    if a['nombre'] in FUERA_DE_CARTERA:
        fuera.append(a['nombre'])
        continue
    k = clave(ALIAS.get(a['nombre'], a['nombre']))
    hit = por_clave.get(k)
    if not hit:
        # segunda pasada: prefijo de al menos 8 caracteres, sin ambiguedad
        cands = [c for kk, v in por_clave.items() for c in v
                 if len(k) >= 8 and (kk.startswith(k[:10]) or k.startswith(kk[:10]))]
        hit = cands if len(cands) == 1 else None
    if hit:
        emparejadas[hit[0]['empresa']] = a
    else:
        sin_pareja.append(a['nombre'])

print('\n=== CRUCE AUDITORIA -> CUENTA ===')
print('  emparejadas:            %2d de %d' % (len(emparejadas), len(AUD)))
print('  fuera de la cartera:    %2d  (la cuenta no existe en `cuentas`)' % len(fuera))
for n in fuera:
    print('     %s' % n)
if sin_pareja:
    print('  SIN PAREJA (%d) — su candidatura NO entra al veredicto:' % len(sin_pareja))
    for n in sin_pareja:
        print('     %s' % n)
assert len(emparejadas) + len(sin_pareja) + len(fuera) == len(AUD), 'se perdio una auditoria'

# ══════════════════════════════════════════════════════════════════════════
#  EL VEREDICTO
# ══════════════════════════════════════════════════════════════════════════
UMBRAL_ENTRANTES = 60
UMBRAL_TECHO = 85
UMBRAL_PISO = 10


def ya_lo_tiene(f, producto):
    return {
        'Callpicker Chat': f['tiene_Chat'],
        'Integración API': f['tiene_API'],
        'Asistente Virtual': f['tiene_AV'],
        'Visibilidad y Control': f['tiene_VyC'],
        'Más capacidad': False,
    }.get(producto, False)


filas = []
for f in ESC:
    aud = emparejadas.get(f['empresa'])
    LL = llamadas_de(f['cid'])
    producto, fuente, porque = None, None, None

    # ── 1 · La auditoria manda, con UN limite ─────────────────────────────
    # La doctrina de direccion vence a la auditoria en un solo punto: no se le
    # vende MAS CAPACIDAD a quien no usa la que ya paga. El V4 lo dejo escrito
    # —«ampliarla acelera la baja en lugar de crecerla»—. Cuando la auditoria
    # pide capacidad y el consumo la desmiente, se pasa al siguiente producto
    # que nombre y se registra la contradiccion en vez de callarla.
    contradiccion = None
    if aud:
        pendientes = [p for p in aud['productos_que_nombra'] if not ya_lo_tiene(f, p)]
        if ('Más capacidad' in pendientes
                and f['pct_consumo'] is not None and f['pct_consumo'] < UMBRAL_TECHO):
            pendientes = [p for p in pendientes if p != 'Más capacidad']
            contradiccion = ('La auditoría pide más capacidad, pero usa el %.0f%% de la que ya paga. '
                             'Se descarta ese producto: ampliarla aceleraría la baja'
                             % f['pct_consumo'])
        if pendientes:
            producto = pendientes[0]
            fuente = 'Auditoría de cuenta (%s)' % (aud['fecha_auditoria'] or 's/f')
            corto = aud['potencial_corto'][0] if aud['potencial_corto'] else ''
            porque = 'El analista lo escribió en la auditoría: «%s»' % corto[:150]
            if len(pendientes) > 1:
                porque += ' · también nombra: %s' % ', '.join(pendientes[1:])
            # Si se le va a proponer capacidad y NO hay consumo medido, se dice.
            # No medir no es medir poco —por eso no se descarta—, pero nadie
            # debe entrar a esa llamada creyendo que el dato existe.
            if producto == 'Más capacidad' and f['pct_consumo'] is None:
                porque += ('. OJO: su consumo no se pudo verificar —su plan no declara bolsa de '
                           'minutos—, así que la ampliación va sobre el criterio del analista y '
                           'no sobre una medición')

    # ── 2 · La escalera ───────────────────────────────────────────────────
    if not producto:
        if f['peldano'] == '1 · CE':
            producto = 'Visibilidad y Control'
            fuente = 'Escalera de producto'
            porque = 'Está en Comunicación Empresarial: el siguiente escalón es VyC'
            # Si además pierde llamadas, ese es EL argumento: VyC es justo lo
            # que le enseña cuáles se le están cayendo y por dónde.
            if LL and LL['pct_sin_contestar'] >= UMBRAL_SIN_CONTESTAR:
                fuente = 'Escalera + Análisis de Llamadas'
                porque += ('. Y el argumento está medido: %s de sus %s llamadas entrantes se '
                           'quedaron sin contestar (%.0f%%) — VyC es lo que le muestra cuáles y '
                           'por dónde se le caen'
                           % (format(LL['sin_contestar'], ','), format(LL['entrantes'], ','),
                              LL['pct_sin_contestar']))
        elif f['peldano'] == '2 · VyC':
            # El Asistente Virtual va PRIMERO cuando las llamadas lo gritan:
            # miles de llamadas sin contestar pesan más que una visita al panel.
            if (not f['tiene_AV'] and LL
                    and LL['pct_sin_contestar'] >= UMBRAL_SIN_CONTESTAR):
                producto = 'Asistente Virtual'
                fuente = 'Análisis de Llamadas · medido'
                porque = ('%s de %s llamadas entrantes se quedaron sin contestar (%.0f%%) entre %s. '
                          'Eso es negocio que llegó y nadie atendió'
                          % (format(LL['sin_contestar'], ','), format(LL['entrantes'], ','),
                             LL['pct_sin_contestar'], LL['ventana']))
                if LL['pct_menu'] >= UMBRAL_MENU:
                    porque += (' · Ya resuelve el %.0f%% por menú: la conversación es ampliar lo que '
                               'ya automatiza, no empezar de cero' % LL['pct_menu'])
            elif not f['tiene_API'] and f['visitas_desarrolladores'] > 0:
                producto = 'Integración API'
                fuente = 'Escalera · señal registrada'
                porque = ('Visitó la sección Desarrolladores del panel %d vez(ces): hay interés '
                          'técnico registrado, no inferido' % f['visitas_desarrolladores'])
            elif (not f['tiene_AV'] and LL is None and f['pct_entrantes'] is not None
                  and f['pct_entrantes'] >= UMBRAL_ENTRANTES):
                # Solo cuando NO hay lectura de llamadas se cae al dato grueso
                # del corte, y se dice que es el de respaldo.
                producto = 'Asistente Virtual'
                fuente = 'Corte de facturación · señal de respaldo'
                porque = ('Sin lectura de llamadas. El corte dice que el %.0f%% de su tráfico es '
                          'entrante; confirmar en llamada antes de proponer' % f['pct_entrantes'])

    # ── 3 · Chat por evidencia ────────────────────────────────────────────
    if not producto and f['chat_candidata']:
        producto = 'Callpicker Chat'
        fuente = 'Evidencia en sus propios números'
        porque = '; '.join(f['chat_senales'])

    # ── 4 · Mas capacidad: ya paga lo que usa ─────────────────────────────
    if not producto and f['pct_consumo'] is not None and f['pct_consumo'] >= UMBRAL_TECHO:
        producto = 'Más capacidad'
        fuente = 'Consumo contra su bolsa'
        porque = ('Consume el %.0f%% de sus minutos: está en el techo de lo que paga'
                  % f['pct_consumo'])

    # ── 4b · Plan de adopcion ─────────────────────────────────────────────
    # Quien usa menos del 40% de lo que paga NO es candidato a comprar mas: el
    # V4 lo dejo dicho —«ampliarla acelera la baja en lugar de crecerla»—. Pero
    # tampoco es un «no candidato»: es candidato a que use lo que ya tiene, que
    # es una accion concreta con dueno y fecha. Se nombra como lo que es.
    if (not producto and f['peldano'] == '2 · VyC'
            and f['pct_consumo'] is not None and f['pct_consumo'] < 40):
        producto = 'Plan de adopción'
        fuente = 'Consumo contra su bolsa'
        porque = ('Usa el %.0f%% de lo que paga. Venderle más capacidad aceleraría la baja; '
                  'lo que toca es que use la que ya tiene' % f['pct_consumo'])

    # ── 5 · No candidato, y se dice QUE FALTA ─────────────────────────────
    if not producto:
        if f['peldano'] == 'sin dato de producto':
            falta = 'No se sabe qué tiene contratado: falta registrar su servicio en la ficha'
        elif f['peldano'] == 'otro producto':
            falta = ('Su producto (calltracking, conmutador o números sueltos) está fuera de la '
                     'escalera: no hay escalón siguiente definido')
        elif not f['plan_ultimo_corte']:
            falta = 'No tiene corte de facturación: sin plan ni consumo no se puede dimensionar nada'
        elif f['pct_consumo'] is None:
            falta = ('Su plan no declara bolsa de minutos, así que no hay consumo contra el cual '
                     'medir. No medir no es medir cero: falta la medición, no el interés')
        elif f['tiene_API'] and f['tiene_AV']:
            falta = 'Ya tiene API y Asistente Virtual: no hay escalón siguiente en la escalera'
        else:
            falta = ('Usa el %.0f%% de su bolsa —ni desaprovechada ni en el techo— y no visitó '
                     'Desarrolladores ni tiene volumen de entrantes. Falta el dato que hoy no '
                     'existe en ninguna fuente: para qué usa el teléfono. Se resuelve en una '
                     'llamada de cualificación, no con más análisis'
                     % (f['pct_consumo'] or 0))
        producto, fuente, porque = None, None, falta

    # ══════════════════════════════════════════════════════════════════════
    #  DIMENSIONAMIENTO — de qué tamaño es, en las unidades del cliente
    # ══════════════════════════════════════════════════════════════════════
    # Sin esto el reporte dice «candidato a X» y el asesor entra a la llamada
    # sin saber si son dos extensiones o veinte. Cada pieza solo se escribe si
    # su dato existe: un hueco se calla, no se rellena con un cero.
    dim = []
    if f.get('extensiones'):
        dim.append('%d extensiones' % f['extensiones'])
    if f.get('min_por_extension') is not None and f.get('extensiones'):
        d = f['min_por_extension']
        comp = ('%.0f%% de la referencia de 1,500 min/ext' % (100.0 * d / 1500))
        dim.append('%s min/ext (%s)' % (format(int(d), ','), comp))
    if f.get('llamadas_total'):
        dim.append('%s llamadas medidas' % format(f['llamadas_total'], ','))
    if f.get('minutos_consumidos'):
        dim.append('%s min consumidos en el último corte' % format(int(f['minutos_consumidos']), ','))
    if f['dids']:
        pieza = '%d números' % f['dids']
        if f.get('dids_libres'):
            pieza += ' (%d sin asignar)' % f['dids_libres']
        dim.append(pieza)
    if f['tickets']:
        pieza = '%d tickets' % f['tickets']
        if f['fallas']:
            pieza += ', %d con falla' % f['fallas']
        if f.get('tickets_horas_mediana') is not None:
            _h = f['tickets_horas_mediana']
            # Por debajo de una hora, «0 h» se lee como dato faltante y no lo es:
            # son tickets que se cierran en minutos.
            pieza += ', mediana de resolución %s' % (
                'menos de 1 h' if _h < 1 else '%s h' % format(int(_h), ','))
        dim.append(pieza)
    dimension = ' · '.join(dim) if dim else 'Sin datos para dimensionar'

    # ── Avisos que no bloquean pero cambian la conversación ───────────────
    avisos = []
    # Densidad por encima de la referencia: está exprimiendo sus extensiones.
    if f.get('min_por_extension') is not None and f['min_por_extension'] > 1500:
        avisos.append('Exprime sus extensiones: %s min/ext contra una referencia de 1,500. '
                      'Rebasar no corta el servicio, se cobra'
                      % format(int(f['min_por_extension']), ','))
    # Números pagados y sin asignar: dinero visible en la primera llamada.
    if f.get('dids_libres') and f['dids']:
        pl = 100.0 * f['dids_libres'] / f['dids']
        # Piso absoluto de 3: con 2 números, uno sin asignar da el 50% y no
        # dice nada. El aviso tiene que aguantar una llamada al cliente.
        if f['dids_libres'] >= 3 and (pl >= 50 or f['dids_libres'] >= 5):
            avisos.append('Paga %d de sus %d números sin asignar (%.0f%%). Es un indicio, no una '
                          'prueba: la etiqueta dice que nadie lo nombró en el panel, no que no timbre'
                          % (f['dids_libres'], f['dids'], pl))
    # Carga de soporte alta: se atiende antes de ofrecer.
    if f.get('tickets_por_extension') is not None and f['tickets_por_extension'] >= 3:
        avisos.append('Carga de soporte alta: %.1f tickets por extensión. Conviene entender qué le '
                      'cuesta trabajo antes de ofrecerle algo nuevo' % f['tickets_por_extension'])
    # Resolución lenta contra la cartera (mediana general 29 h).
    if f.get('tickets_horas_mediana') is not None and f['tickets_horas_mediana'] >= 339:
        avisos.append('Sus tickets tardan una mediana de %s h en cerrarse, contra 29 h de la '
                      'cartera: está en el 10%% más lento'
                      % format(int(f['tickets_horas_mediana']), ','))

    # ── Se puede HOY, o no ────────────────────────────────────────────────
    bloqueado = not f['accionable']
    if producto and not bloqueado:
        veredicto = 'CANDIDATO A %s' % producto.upper()
    elif producto and bloqueado:
        veredicto = 'CANDIDATO A %s — no hoy' % producto.upper()
    else:
        veredicto = 'NO CANDIDATO'

    filas.append(dict(f, **{
        'candidato_a': producto or '—',
        'fuente_veredicto': fuente or 'Sin señal suficiente',
        'porque': porque,
        'veredicto': veredicto,
        'bloqueado': bloqueado,
        # ── Análisis de Llamadas ──────────────────────────────────────────
        'll_entrantes': LL['entrantes'] if LL else None,
        'll_sin_contestar': LL['sin_contestar'] if LL else None,
        'll_pct_sin_contestar': round(LL['pct_sin_contestar'], 1) if LL else None,
        'll_pct_menu': round(LL['pct_menu'], 1) if LL else None,
        'll_salientes': LL['salientes'] if LL else None,
        'll_ventana': LL['ventana'] if LL else None,
        # El corte decía una cosa y las llamadas dicen otra. Se marca para que
        # nadie use el dato viejo sin saber que está desmentido.
        'll_desmiente_al_corte': bool(
            LL and f['pct_entrantes'] is not None
            and ((LL['pct_sin_contestar'] >= UMBRAL_SIN_CONTESTAR and f['pct_entrantes'] < UMBRAL_ENTRANTES)
                 or (LL['pct_sin_contestar'] < 10 and f['pct_entrantes'] >= UMBRAL_ENTRANTES))),
        'dimension': dimension,
        'avisos': avisos,
        'contradiccion': contradiccion,
        'tiene_auditoria': bool(aud),
        'auditoria_estado': aud['estado'] if aud else None,
        'auditoria_alarma': aud['senal_alarma'][:200] if aud and aud['senal_alarma'] else None,
        'auditoria_productos': aud['productos_que_nombra'] if aud else [],
    }))

# ══════════════════════════════════════════════════════════════════════════
#  CIERRE
# ══════════════════════════════════════════════════════════════════════════
assert len(filas) == len(ESC), 'se perdieron cuentas'
sin_veredicto = [f for f in filas if not f['veredicto']]
assert not sin_veredicto, '%d cuentas sin veredicto' % len(sin_veredicto)

print('\n' + '=' * 70)
print('A QUE ES CANDIDATO CADA CUENTA')
print('=' * 70)
cc = Counter(f['candidato_a'] for f in filas)
for p, n in cc.most_common():
    hoy = sum(1 for f in filas if f['candidato_a'] == p and not f['bloqueado'])
    print('  %-24s %3d   (abordables hoy: %3d)' % (p, n, hoy))
print('  %-24s %3d   (cierra)' % ('TOTAL', sum(cc.values())))
# Contra el numero REAL de cuentas, no contra un literal: la cartera crece
# (CBS Compresores entro el 22 sep) y un 221 escrito a mano convierte un alta
# legitima en un falso error.
assert sum(cc.values()) == len(filas), 'no cierra: %d veredictos de %d cuentas' % (
    sum(cc.values()), len(filas))

print('\n=== DE DONDE SALE CADA VEREDICTO ===')
for s, n in Counter(f['fuente_veredicto'] for f in filas).most_common():
    print('  %-42s %3d' % (s[:42], n))

print('\n=== LOS «NO CANDIDATO», POR QUE ===')
no = [f for f in filas if f['candidato_a'] == '—']
for m, n in Counter(f['porque'][:64] for f in no).most_common():
    print('  %3d  %s…' % (n, m))

print('\n=== LO QUE APORTO ANALISIS DE LLAMADAS ===')
con_ll = [f for f in filas if f['ll_entrantes']]
print('  cuentas con lectura util:                 %3d de %d' % (len(con_ll), len(filas)))
print('  sin lectura (ahi no se afirma nada):      %3d' % (len(filas) - len(con_ll)))
por_ll = [f for f in filas if f['fuente_veredicto'].startswith('Análisis de Llamadas')]
print('  veredictos que decide la lectura:         %3d' % len(por_ll))
desm = [f for f in filas if f['ll_desmiente_al_corte']]
print('  cuentas donde DESMIENTE al corte:         %3d' % len(desm))
print('  (el %% de entrantes del corte las clasificaba al reves)')
perdidas = sum(f['ll_sin_contestar'] or 0 for f in con_ll)
print('\n  llamadas entrantes sin contestar en la cartera medida: %s' % format(perdidas, ','))
print('  las 10 que mas pierden:')
print('  %-30s %10s %10s %7s  %s' % ('cuenta', 'entrantes', 'sin cont.', '%', 'candidato a'))
for f in sorted(con_ll, key=lambda x: -(x['ll_sin_contestar'] or 0))[:10]:
    print('  %-30s %10s %10s %6.1f%%  %s'
          % (str(f['empresa'])[:30], format(f['ll_entrantes'], ','),
             format(f['ll_sin_contestar'], ','), f['ll_pct_sin_contestar'],
             f['candidato_a'][:24]))

print('\n=== LAS 33 CON AUDITORIA ===')
ca = [f for f in filas if f['tiene_auditoria']]
print('  cuentas con auditoria cruzada: %d' % len(ca))
print('  de ellas, candidatas a algo:   %d' % sum(1 for f in ca if f['candidato_a'] != '—'))
print('  abordables hoy:                %d' % sum(1 for f in ca if f['candidato_a'] != '—' and not f['bloqueado']))
print()
for f in sorted(ca, key=lambda x: -(x['monto_ultimo_corte'] or 0)):
    print('  %-30s %-26s %s' % (str(f['empresa'])[:30], f['candidato_a'][:26],
                                'HOY' if not f['bloqueado'] else 'bloqueada'))

io.open(SALIDA, 'w', encoding='utf-8').write(
    json.dumps({'generado': '2026-09-21', 'sin_pareja': sin_pareja, 'cuentas': filas},
               ensure_ascii=False, indent=1))
print('\n  detalle en %s' % os.path.relpath(SALIDA, RAIZ))
