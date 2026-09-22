# -*- coding: utf-8 -*-
"""Escalera de producto por cuenta — la capa de datos del reporte V5.

   LA ESCALERA (instruccion de direccion, 21 sep 2026)
   ---------------------------------------------------
     1. Tiene COMUNICACION EMPRESARIAL (CE)  -> subirlo a VISIBILIDAD Y CONTROL
     2. Ya tiene VyC                         -> INTEGRACION CRM CON API
                                                o ASISTENTE VIRTUAL, segun analisis
     3. Varios numeros + WhatsApp/redes/sector -> CALLPICKER CHAT

   DE DONDE SALE CADA COSA, Y EN QUE ORDEN SE CREE
   -----------------------------------------------
   El peldano NO se adivina del nombre del plan. Se leen TRES fuentes y se dice
   cuando discrepan, porque discrepan de verdad:

     1a. `adopcion_producto`  — la tabla que el tablero ya mantiene, con un
         nivel por producto y por cuenta («Voz CE», «Voz VyC», …). Es la fuente
         PRIMARIA: la alimenta el propio equipo.
     1b. `cuentas.servicio` + `servicios_json` — lo que la ficha declara. Texto
         libre: 180 valores distintos para 179 cuentas.
     1c. El ultimo plan FACTURADO de data/cortes-facturacion.xlsx.

   Lo que NO se hace, y esta escrito aqui para que no se vuelva a intentar: el
   propio reporte V4 concluyo, cuenta por cuenta, que «WhatsApp y las
   integraciones se estan deduciendo del sector y no del registro». Por eso el
   giro NO decide nada por si solo — es un modulador, nunca el disparador. Y
   `giro` ademas no agrupa: 189 cuentas con valor en 183 formas distintas.

   LO QUE BLOQUEA
   --------------
   La doctrina de direccion ya implementada en lib/candidato-a.ts: no se
   propone crecimiento sobre un problema sin resolver. Cancelado o en
   hibernacion · ticket abierto · dos o mas fallas con Health Score < 60 ·
   consumo por debajo del 10% de la bolsa. Y la falta de MEDICION no bloquea:
   no medir no es medir cero.

   USO
   ---
       python scripts/crecimiento-escalera.py
       python scripts/crecimiento-escalera.py --json  (vuelca el detalle)
"""
import io
import json
import os
import re
import sys
import urllib.request
from collections import Counter, defaultdict

import openpyxl

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALIDA = os.path.join(RAIZ, 'data', 'crecimiento-escalera.json')

# ── Credenciales, sin imprimirlas nunca ───────────────────────────────────
_env = {}
for _ln in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    _ln = _ln.strip()
    if _ln and not _ln.startswith('#') and '=' in _ln:
        _k, _v = _ln.split('=', 1)
        _env[_k.strip()] = _v.strip().strip('"').strip("'")
SB_URL = _env['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/')
SB_KEY = _env['SUPABASE_SERVICE_ROLE_KEY']


def sb(tabla, select='*', limite=10000):
    req = urllib.request.Request(
        '%s/rest/v1/%s?select=%s&limit=%d' % (SB_URL, tabla, select, limite),
        headers={'apikey': SB_KEY, 'Authorization': 'Bearer %s' % SB_KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def norm_cid(v):
    s = str(v if v is not None else '').strip()
    if s.endswith('.0'):
        s = s[:-2]
    return '' if s in ('0', 'None', 'nan') else s


def num(v):
    try:
        return float(str(v).replace(',', '').replace('$', '').replace('%', '').strip())
    except Exception:
        return 0.0


# ══════════════════════════════════════════════════════════════════════════
#  FUENTE 1 · la cartera
# ══════════════════════════════════════════════════════════════════════════
cuentas = sb('cuentas')
print('Cuentas en la cartera: %d' % len(cuentas))

# ══════════════════════════════════════════════════════════════════════════
#  FUENTE 2 · adopcion_producto — la escalera que el tablero YA mantiene
# ══════════════════════════════════════════════════════════════════════════
adop = sb('adopcion_producto')
# Se colapsa al ultimo registro por (cuenta, producto): la tabla guarda
# historia y quedarse con varios duplicaria la cuenta en los conteos.
ultimo_adop = {}
for a in adop:
    k = (a.get('cuenta_id'), str(a.get('producto') or '').strip())
    orden = (str(a.get('fecha') or ''), str(a.get('created_at') or ''), str(a.get('id') or ''))
    if k not in ultimo_adop or orden > ultimo_adop[k][0]:
        ultimo_adop[k] = (orden, a)
adop_por_cuenta = defaultdict(dict)
for (cuenta_id, producto), (_, a) in ultimo_adop.items():
    adop_por_cuenta[cuenta_id][producto] = str(a.get('nivel') or '').strip()
print('adopcion_producto: %s filas -> %d pares (cuenta, producto) vigentes'
      % (format(len(adop), ','), len(ultimo_adop)))

NIVELES_TIENE = ('alto', 'medio', 'bajo')


def tiene_por_adopcion(cuenta_id, producto):
    """None = no hay registro. True/False = lo declara el equipo."""
    n = adop_por_cuenta.get(cuenta_id, {}).get(producto)
    if n is None or n == '':
        return None
    return n.lower() in NIVELES_TIENE


# ══════════════════════════════════════════════════════════════════════════
#  FUENTE 3 · el texto de servicio de la ficha
# ══════════════════════════════════════════════════════════════════════════
RX = {
    'CE':   re.compile(r'comunicaci[oó]n\s+empresarial', re.I),
    'CE_abrev': re.compile(r'(?<![A-Za-z])CE(?![A-Za-z])'),          # mayuscula
    'VyC':  re.compile(r'visibilidad\s*y\s*control|(?<![A-Za-z])VyC(?![A-Za-z])|\bV\s*y\s*C\b', re.I),
    'Chat': re.compile(r'cp\s*chat|callpicker\s+chat|agentes?\s+(?:de\s+)?chat|\bchat\b|whats', re.I),
    'AV':   re.compile(r'agentes?\s+virtual|asistente\s+virtual|(?<![A-Za-z])AV(?![A-Za-z])'),
    'API':  re.compile(r'(?<![A-Za-z])API(?![A-Za-z])|integraci[oó]n', re.I),
}


def texto_servicio(c):
    sj = c.get('servicios_json')
    if isinstance(sj, list) and sj:
        return ' | '.join('%s %s' % (s.get('nombre') or '', s.get('descripcion') or '')
                          for s in sj if isinstance(s, dict))
    return str(c.get('servicio') or '')


def familias_texto(t):
    f = set()
    if RX['CE'].search(t) or RX['CE_abrev'].search(t):
        f.add('CE')
    for k in ('VyC', 'Chat', 'AV', 'API'):
        if RX[k].search(t):
            f.add(k)
    return f


# ══════════════════════════════════════════════════════════════════════════
#  FUENTE 4 · los cortes de facturacion
# ══════════════════════════════════════════════════════════════════════════
sys.path.insert(0, os.path.join(RAIZ, 'scripts'))
wb = openpyxl.load_workbook(os.path.join(RAIZ, 'data', 'cortes-facturacion.xlsx'),
                            data_only=True, read_only=True)
ws = wb[wb.sheetnames[0]]
_it = ws.iter_rows(values_only=True)
_cab = [str(c).strip() if c is not None else '' for c in next(_it)]
CI = dict((c, i) for i, c in enumerate(_cab))
for _c in ('CID', 'Fecha de corte', 'Nombre del Plan', 'Monto del plan',
           'Minutos Incluidos', 'Minutos Consumidos', '% Llamadas entrantes',
           'Desarrolladores', 'Total de interacciones'):
    if _c not in CI:
        wb.close()
        raise SystemExit('El archivo de cortes no trae la columna «%s»' % _c)

cortes = defaultdict(list)
for r in _it:
    cid = norm_cid(r[CI['CID']])
    if not cid:
        continue
    cortes[cid].append({
        'fecha': r[CI['Fecha de corte']],
        'plan': str(r[CI['Nombre del Plan']] or '').strip(),
        'monto': num(r[CI['Monto del plan']]),
        'incl': num(r[CI['Minutos Incluidos']]),
        'cons': num(r[CI['Minutos Consumidos']]),
        'entr': num(r[CI['% Llamadas entrantes']]),
        'dev': num(r[CI['Desarrolladores']]),
        'inter': num(r[CI['Total de interacciones']]),
    })
wb.close()
for v in cortes.values():
    v.sort(key=lambda x: (x['fecha'] is None, x['fecha']))
print('Cortes de facturacion: %s CIDs' % format(len(cortes), ','))

# ── La regla de minutos, la misma de lib/plan-minutos.ts ─────────────────
MIN_POR_EXT = 1500
MIN_POR_EXT_PLAUSIBLE = 50
BOLSA_MINIMA = 3
RX_EXT = re.compile(r'(\d+)\s*(?:extensi[oó]n(?:es)?|ext\b)', re.I)
RX_EXT_ABREV = re.compile(r'^(\d+)\s+\S.*\bIL\b', re.I)
RX_SIN_VOZ = re.compile(r'\bchat\b|\bagentes?\s+cp\b|sin\s+saldo|n[uú]meros?\s+virtuales?|whatsapp', re.I)


def base_minutos(plan, incl):
    """Devuelve (base, origen). base None = no se puede medir."""
    nombre = str(plan or '')
    m = RX_EXT.search(nombre) or RX_EXT_ABREV.search(nombre)
    ext = int(m.group(1)) if m else None
    if RX_SIN_VOZ.search(nombre) and not ext and incl < BOLSA_MINIMA:
        return None, 'sin_medicion'
    if ext and ext > 0:
        por_ext = (incl / ext) if incl > 0 else 0
        if por_ext >= MIN_POR_EXT_PLAUSIBLE:
            return incl, 'bolsa'
        return ext * MIN_POR_EXT, 'extensiones'
    if incl >= BOLSA_MINIMA:
        return incl, 'bolsa'
    return None, 'sin_medicion'


# ══════════════════════════════════════════════════════════════════════════
#  FUENTE 5 · DIDs
# ══════════════════════════════════════════════════════════════════════════
dids = json.load(io.open(os.path.join(RAIZ, 'data', 'dids.json'), encoding='utf-8'))['porCid']
print('DIDs: %s CIDs con numero' % format(len(dids), ','))

# ══════════════════════════════════════════════════════════════════════════
#  FUENTE 5b · Analisis de Llamadas, solo para el VOLUMEN
# ══════════════════════════════════════════════════════════════════════════
# El detalle (sin contestar, menu) lo consume el veredicto; aqui solo se trae
# el conteo, que es una de las seis dimensiones que pidio direccion.
_p_ll = os.path.join(RAIZ, 'data', 'analisis-llamadas.json')
llamadas = json.load(io.open(_p_ll, encoding='utf-8'))['cuentas'] if os.path.exists(_p_ll) else {}
print('Analisis de Llamadas: %s cuentas con lectura' % format(len(llamadas), ','))

RX_DIGITAL = re.compile(
    r'whats\s*app|\bwa\b|facebook|\bfb\b|instagram|tiktok|linkedin|redes|'
    r'\bgoogle\b|\bads\b|adwords|campa[nñ]a|landing|marketing|\bmkt\b|publicidad', re.I)

# ══════════════════════════════════════════════════════════════════════════
#  FUENTE 6 · tickets (dataset vivo, no la tabla de Supabase que esta vacia)
# ══════════════════════════════════════════════════════════════════════════
tickets_por_cid = defaultdict(
    lambda: {'total': 0, 'abiertos': 0, 'fallas': 0, 'chat': 0, 'horas': [], 'cat': {}})
_tj = os.path.join(RAIZ, 'lib', 'tickets-data.json')
if not os.path.exists(_tj):
    raise SystemExit('No esta lib/tickets-data.json: sin el no se pueden evaluar los bloqueos')

_t = json.load(io.open(_tj, encoding='utf-8'))
_rows = _t if isinstance(_t, list) else (_t.get('rows') or _t.get('tickets') or [])


def _vacio(v):
    return v is None or str(v).strip() in ('', 'None', 'nan', '-')


for t in _rows:
    cid = norm_cid(t.get('cid'))
    if not cid:
        continue
    d = tickets_por_cid[cid]
    d['total'] += 1
    # Duracion de resolucion. El campo viene en HORAS —lo confirma el campo de
    # texto hermano, «28 horas 12 min» -> 28.2— pero NO es exactamente cierre
    # menos apertura: Zoho la calcula a su manera y difiere unos 20 minutos.
    # Sirve para comparar cuentas entre si, no como SLA al minuto.
    try:
        _h = float(t.get('duracion_hrs'))
        if _h >= 0:
            d['horas'].append(_h)
    except (TypeError, ValueError):
        pass
    _cat = str(t.get('categoria') or 'Sin categoría')
    d['cat'][_cat] = d['cat'].get(_cat, 0) + 1
    # El dataset NO trae campo `estado`: trae `apertura` y `cierre`. Un ticket
    # abierto es el que no tiene cierre. Buscar un `estado` inexistente daba
    # cero abiertos siempre y desactivaba el bloqueo sin que se notara.
    if _vacio(t.get('cierre')):
        d['abiertos'] += 1
    if str(t.get('es_falla') or '').strip().lower() in ('si', 'sí', 'yes', 'true'):
        d['fallas'] += 1
    # Un ticket de Chat es evidencia dura de que la cuenta YA usa Chat.
    if (str(t.get('producto') or '').strip().lower() == 'chat'
            or 'chat' in str(t.get('categoria') or '').lower()):
        d['chat'] += 1

_abiertos = sum(1 for v in tickets_por_cid.values() if v['abiertos'])
print('Tickets: %s filas · %s CIDs · %d CID(s) con ticket abierto · %d con ticket de Chat'
      % (format(len(_rows), ','), format(len(tickets_por_cid), ','), _abiertos,
         sum(1 for v in tickets_por_cid.values() if v['chat'])))
if _abiertos <= 2:
    print('  OJO: casi no hay tickets abiertos en el export, asi que ese bloqueo')
    print('  apenas discrimina. Es el dato, no un fallo del cruce.')

# ══════════════════════════════════════════════════════════════════════════
#  CONSTRUCCION POR CUENTA
# ══════════════════════════════════════════════════════════════════════════
VIVAS = ('activo', 'en_riesgo')
filas = []

for c in cuentas:
    cid = norm_cid(c.get('cid'))
    cuenta_id = c.get('id')
    txt = texto_servicio(c)
    fam_txt = familias_texto(txt)

    cs = cortes.get(cid, [])
    ultimo = cs[-1] if cs else None
    fam_plan = familias_texto(ultimo['plan']) if ultimo else set()

    # ── Que tiene, segun cada fuente ──────────────────────────────────────
    ce_adop = tiene_por_adopcion(cuenta_id, 'Voz CE')
    vyc_adop = tiene_por_adopcion(cuenta_id, 'Voz VyC')

    tiene_ce = bool(ce_adop) or ('CE' in fam_txt) or ('CE' in fam_plan)
    tiene_vyc = bool(vyc_adop) or ('VyC' in fam_txt) or ('VyC' in fam_plan)
    # Chat: la bandera de la cuenta manda, y se suma cualquier evidencia.
    tk_pre = tickets_por_cid.get(
        cid, {'total': 0, 'abiertos': 0, 'fallas': 0, 'chat': 0, 'horas': [], 'cat': {}})
    tiene_chat = (bool(c.get('tiene_chat_activo'))
                  or ('Chat' in fam_txt) or ('Chat' in fam_plan)
                  or bool(tiene_por_adopcion(cuenta_id, 'CP Chat'))
                  or tk_pre['chat'] > 0)
    tiene_av = (bool(c.get('tiene_ia_voz'))
                or ('AV' in fam_txt) or ('AV' in fam_plan)
                or bool(tiene_por_adopcion(cuenta_id, 'Agente Virtual')))
    tiene_api = (bool(c.get('tiene_integracion_api'))
                 or ('API' in fam_txt)
                 or bool(tiene_por_adopcion(cuenta_id, 'Integracion API')))

    # ¿Cuantas fuentes lo respaldan? Sirve para decir la confianza.
    fuentes_ce = sum([ce_adop is True, 'CE' in fam_txt, 'CE' in fam_plan])
    fuentes_vyc = sum([vyc_adop is True, 'VyC' in fam_txt, 'VyC' in fam_plan])
    sin_ninguna_fuente = not (fam_txt or fam_plan
                              or ce_adop is not None or vyc_adop is not None)

    # ── Consumo y uso ─────────────────────────────────────────────────────
    base, origen_base = (None, 'sin_corte')
    pct = None
    if ultimo:
        base, origen_base = base_minutos(ultimo['plan'], ultimo['incl'])
        if base and base > 0:
            pct = 100.0 * ultimo['cons'] / base
    dev_total = sum(x['dev'] for x in cs)
    entrantes = ultimo['entr'] if ultimo else None

    # ── DIDs ──────────────────────────────────────────────────────────────
    ds = dids.get(cid) or []
    etiquetas = [x.get('e', '') for x in ds]
    dids_digital = [e for e in etiquetas if RX_DIGITAL.search(e)]
    # «Available» es la etiqueta por defecto de Callpicker: el numero existe,
    # se factura y nadie lo asigno. No prueba que no timbre —eso necesitaria
    # el cruce con llamadas que hoy no se puede— pero es un indicio fuerte.
    dids_libres = sum(1 for e in etiquetas
                      if e.strip().lower() in ('available', 'disponible', ''))

    # ── Extensiones y densidad de uso ─────────────────────────────────────
    # Las extensiones solo se leen del NOMBRE del plan, asi que hay cobertura
    # parcial (70 de 221). Donde no hay, no se calcula densidad: se deja nulo.
    _m = RX_EXT.search(ultimo['plan']) if ultimo else None
    _m = _m or (RX_EXT_ABREV.search(ultimo['plan']) if ultimo else None)
    extensiones = int(_m.group(1)) if _m else None
    min_por_ext = (ultimo['cons'] / extensiones) if (ultimo and extensiones) else None
    dids_por_ext = (len(ds) / float(extensiones)) if extensiones else None

    # ── Volumen de llamadas, de Analisis de Llamadas ──────────────────────
    _ll = llamadas.get(cid)
    ll_ent = (_ll.get('ent') or {}).get('total') if _ll else None
    ll_sal = (_ll.get('sal') or {}).get('total') if _ll else None
    ll_total = (ll_ent or 0) + (ll_sal or 0) if _ll else None

    # ── Bloqueos, doctrina de lib/candidato-a.ts ──────────────────────────
    tk = tk_pre
    hs = c.get('health_score')
    bloqueos = []
    estado = str(c.get('estado') or '')
    if estado not in VIVAS:
        bloqueos.append('cuenta %s' % (estado or 'sin estado'))
    if tk['abiertos'] > 0:
        bloqueos.append('%d ticket(s) abierto(s)' % tk['abiertos'])
    if tk['fallas'] >= 2 and isinstance(hs, (int, float)) and hs < 60:
        bloqueos.append('%d fallas con Health Score %s' % (tk['fallas'], hs))
    if pct is not None and pct < 10:
        bloqueos.append('consume %.1f%% de su bolsa' % pct)
    if not cid:
        bloqueos.append('sin CID: no cruza con ninguna fuente')

    # ── El peldano ────────────────────────────────────────────────────────
    if sin_ninguna_fuente:
        peldano, oferta = 'sin dato de producto', None
    elif tiene_ce and not tiene_vyc:
        peldano, oferta = '1 · CE', 'Subir a Visibilidad y Control'
    elif tiene_vyc:
        peldano = '2 · VyC'
        # La rama la decide la EVIDENCIA, no el giro.
        if not tiene_api and dev_total > 0:
            oferta = 'Integracion CRM con API'
        elif not tiene_av and entrantes is not None and entrantes >= 60:
            oferta = 'Asistente Virtual'
        elif not tiene_api and not tiene_av:
            oferta = 'VyC sin senal: cualificar en llamada'
        else:
            oferta = 'Ya tiene el siguiente escalon'
    else:
        peldano, oferta = 'otro producto', None

    # ── Chat, que corre en paralelo a la escalera ─────────────────────────
    chat_senales = []
    if len(ds) >= 5:
        chat_senales.append('%d numeros' % len(ds))
    if dids_digital:
        chat_senales.append('etiquetas de canal digital (%s)' % ', '.join(sorted(set(dids_digital))[:3]))
    okam = str(c.get('observaciones_kam') or '')
    if RX['Chat'].search(okam):
        chat_senales.append('el KAM lo menciona en observaciones')
    nof = str(c.get('num_oficinas') or '')
    mof = re.search(r'\d[\d,]*', nof)
    if mof and int(mof.group(0).replace(',', '')) >= 3:
        chat_senales.append('%s sitios' % mof.group(0))

    filas.append({
        'cid': cid, 'cuenta_id': cuenta_id, 'empresa': c.get('empresa'),
        'asesor': c.get('asesor'), 'estado': estado,
        'clasificacion': c.get('clasificacion_cliente') or c.get('clasificacion'),
        'giro': c.get('giro'), 'health_score': hs,
        'facturacion_guardada': c.get('facturacion'),
        'monto_ultimo_corte': ultimo['monto'] if ultimo else None,
        'plan_ultimo_corte': ultimo['plan'] if ultimo else None,
        'servicio_ficha': txt,
        'nivel_adop_CE': adop_por_cuenta.get(cuenta_id, {}).get('Voz CE'),
        'nivel_adop_VyC': adop_por_cuenta.get(cuenta_id, {}).get('Voz VyC'),
        'tiene_CE': tiene_ce, 'tiene_VyC': tiene_vyc,
        'tiene_Chat': tiene_chat, 'tiene_AV': tiene_av, 'tiene_API': tiene_api,
        'fuentes_CE': fuentes_ce, 'fuentes_VyC': fuentes_vyc,
        'peldano': peldano, 'oferta': oferta,
        'base_minutos': base, 'origen_base': origen_base,
        'pct_consumo': pct, 'pct_entrantes': entrantes,
        'visitas_desarrolladores': dev_total,
        # ── Las seis dimensiones que pidio direccion (21 sep 2026) ────────
        'extensiones': extensiones,
        'minutos_consumidos': ultimo['cons'] if ultimo else None,
        'min_por_extension': round(min_por_ext, 1) if min_por_ext is not None else None,
        'dids_libres': dids_libres,
        'dids_por_extension': round(dids_por_ext, 2) if dids_por_ext is not None else None,
        'llamadas_entrantes': ll_ent, 'llamadas_salientes': ll_sal, 'llamadas_total': ll_total,
        'tickets_horas_mediana': (
            round(sorted(tk['horas'])[len(tk['horas']) // 2], 1) if tk['horas'] else None),
        'tickets_por_extension': (
            round(tk['total'] / float(extensiones), 1) if extensiones else None),
        'tickets_categoria_top': (
            max(tk['cat'].items(), key=lambda x: x[1])[0] if tk['cat'] else None),
        'dids': len(ds), 'dids_digital': len(dids_digital),
        'etiquetas_digital': sorted(set(dids_digital))[:6],
        'chat_senales': chat_senales,
        'chat_candidata': (not tiene_chat) and len(chat_senales) >= 2,
        'tickets': tk['total'], 'tickets_abiertos': tk['abiertos'],
        'fallas': tk['fallas'], 'tickets_chat': tk['chat'],
        'bloqueos': bloqueos,
        'accionable': not bloqueos,
    })

# ══════════════════════════════════════════════════════════════════════════
#  LAS TABLAS TIENEN QUE CERRAR
# ══════════════════════════════════════════════════════════════════════════
assert len(filas) == len(cuentas), 'se perdieron cuentas por el camino'
pel = Counter(f['peldano'] for f in filas)
assert sum(pel.values()) == len(cuentas), 'los peldanos no cierran'

print('\n' + '=' * 70)
print('DONDE ESTA CADA CUENTA DE LA ESCALERA')
print('=' * 70)
for p, n in pel.most_common():
    print('  %-24s %3d' % (p, n))
print('  %-24s %3d  (cierra)' % ('TOTAL', sum(pel.values())))

print('\n=== PELDANO 2: POR QUE RAMA ===')
r2 = Counter(f['oferta'] for f in filas if f['peldano'] == '2 · VyC')
for o, n in r2.most_common():
    print('  %-42s %3d' % (o, n))

print('\n=== ACCIONABLES CONTRA BLOQUEADAS ===')
acc = [f for f in filas if f['accionable']]
blo = [f for f in filas if not f['accionable']]
print('  accionables hoy: %3d' % len(acc))
print('  bloqueadas:      %3d' % len(blo))
assert len(acc) + len(blo) == len(cuentas), 'no cierra'
import re as _re
mot = Counter(_re.sub(r'\d+[\d.,]*', 'N', b).strip() for f in blo for b in f['bloqueos'])
for m, n in mot.most_common(8):
    print('      %-38s %3d' % (m[:38], n))

print('\n=== CHAT ===')
print('  ya tienen Chat:                    %3d' % sum(1 for f in filas if f['tiene_Chat']))
print('  candidatas (2+ senales, sin Chat): %3d' % sum(1 for f in filas if f['chat_candidata']))
print('  con etiquetas de canal digital:    %3d' % sum(1 for f in filas if f['dids_digital'] > 0))

print('\n=== CALIDAD DEL DATO ===')
print('  sin ninguna fuente de producto:    %3d' % pel.get('sin dato de producto', 0))
print('  sin corte de facturacion:          %3d' % sum(1 for f in filas if not f['plan_ultimo_corte']))
print('  consumo no medible:                %3d' % sum(1 for f in filas if f['pct_consumo'] is None))
print('  CE respaldado por 1 sola fuente:   %3d' % sum(1 for f in filas if f['tiene_CE'] and f['fuentes_CE'] == 1))
print('  VyC respaldado por 1 sola fuente:  %3d' % sum(1 for f in filas if f['tiene_VyC'] and f['fuentes_VyC'] == 1))

io.open(SALIDA, 'w', encoding='utf-8').write(
    json.dumps({'generado': '2026-09-21', 'cuentas': filas}, ensure_ascii=False, indent=1))
print('\n  detalle en %s' % os.path.relpath(SALIDA, RAIZ))

if '--json' in sys.argv:
    print('\n=== ACCIONABLES, POR OFERTA ===')
    for f in sorted(acc, key=lambda x: -(x['monto_ultimo_corte'] or 0)):
        print('  %-32s %-22s %-34s %s'
              % (str(f['empresa'])[:32], f['peldano'], str(f['oferta'])[:34], f['asesor']))
