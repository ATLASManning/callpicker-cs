# -*- coding: utf-8 -*-
u"""CONSUMO VS PLAN CONTRATADO — reporte corporativo autocontenido.

   QUE ES, Y QUE NO ES
   Una UTILIDAD aparte. No agrega rutas, menus, widgets ni componentes a la
   aplicacion, no escribe en `data/` ni en `public/`, y el `.html` que produce
   vive FUERA del repositorio (por omision `D:\\Archivos\\Reportes`), asi que no
   entra en un commit ni se despliega. Es de SOLO LECTURA sobre las fuentes.

   El archivo que emite es un CORTE ESTATICO: los filtros actuan sobre la copia
   incrustada. Para datos nuevos se genera otro archivo.

   ── EL RECURSO MEDIBLE ES UNO, Y ESO SE DICE ──────────────────────────────
   De todo lo que la cuenta contrata, lo UNICO con limite contratado y consumo
   medido por ciclo de facturacion son los MINUTOS DE VOZ. Lo demas se declara
   como exclusion en el propio reporte, con su razon medida:

     · Extensiones — el plan declara cuantas se contratan (en su nombre), pero
       ninguna fuente mide cuantas se usan. Sin consumo no hay utilizacion.
     · Chat — `app/callpicker-chat/chat-data.ts` SI trae bolsa y mensajes, pero
       sobre 159 cuentas solo 13 declaran bolsa, cada una con UN periodo
       distinto (2026-06-02 a 2026-10-21) y 46 con la lectura rota. Un punto
       suelto no sostiene una serie por ciclo. Se excluye y se dice el numero.
     · DIDs — `data/dids.json` es inventario, no consumo.
     · Llamadas — unidad distinta (llamadas, no minutos de bolsa). No se mezcla.

   ── LAS CINCO REGLAS QUE DECIDEN SI UN CICLO SE PUEDE COMPARAR ────────────
   Medido sobre `data/cortes-facturacion.xlsx` (25,310 filas, 2,762 CIDs):

   1. BASE MEDIBLE. La columna «% Consumo» del archivo NO SE USA NUNCA: en los
      planes de extensiones ilimitadas «Minutos Incluidos» trae 1 y el archivo
      publica cosas como 3,417,300%. La base la calcula `base_minutos`, el
      unico espejo en Python de `lib/plan-minutos.ts`. Sin base -> no evaluable.

   2. DURACION DEL PERIODO. Hay ciclos de 411, 446, 455 y 477 dias en la
      cartera. Compararlos contra un limite mensual infla la utilizacion ~15x
      —Centinela Property sale al 741.5%— y eso NO es un excedente, es un
      artefacto de la ventana. Comparable solo entre 25 y 35 dias.

   3. EL ULTIMO CIERRE ES POR CUENTA. El ciclo de cada cliente cierra en SU
      dia de facturacion, asi que al exportar el corte (2026-11-21) unas
      cuentas ya tenian noviembre cerrado y otras no. Medido: 103 cierran en
      noviembre, 33 en octubre y 5 arrastran un ultimo ciclo de meses atras.
      Un «ultimo cierre» global mandaria 38 cuentas a un mes que no es el suyo.
      Misma leccion que `hasta`/`mesCerrado` en el modulo de llamadas.

   4. LA VARIACION pp SOLO VALE CON EL MISMO PLAN. Si cambio el nombre del plan
      o la base, el punto porcentual mezcla un cambio de plan con un cambio de
      comportamiento. Se marca «no comparable» y se dice por que. No hay regla
      de prorrateo validada por el negocio, asi que no se prorratea nada.

   5. UN CERO MEDIDO NO ES UN HUECO. Consumo 0 con base es un cero verificado
      (9 cuentas). Un mes sin fila es ausencia y se dibuja como ausencia, nunca
      como cero.

   ── LO QUE NO SE INVENTA ──────────────────────────────────────────────────
   El corte NO trae tarifa de excedente. El excedente se publica en MINUTOS y
   no se estima ningun cargo. Y los umbrales son los PROPUESTOS en la peticion,
   no una politica confirmada de Callpicker: el reporte lo dice en pantalla.

   ── CONFIDENCIALIDAD ──────────────────────────────────────────────────────
   `--asesor NOMBRE` filtra en el GENERADOR, antes de incrustar: el archivo
   individual no lleva cuentas ajenas ni sus totales ni en los datos ni en los
   metadatos. Un filtro visual no seria control de acceso.

   USO
       python -I scripts/gen-consumo-vs-plan.py
       python -I scripts/gen-consumo-vs-plan.py --asesor "Fátima"
       python -I scripts/gen-consumo-vs-plan.py --salida D:\\otra\\carpeta
       python -I scripts/gen-consumo-vs-plan.py --autoprueba

   Las credenciales se leen de `.env.local` y NO se imprimen.
"""
import argparse
import collections
import datetime
import io
import json
import os
import re
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_minutos_py import (RAIZ, abre_corte, base_minutos, celda, num,  # noqa: E402
                             MINUTOS_POR_EXTENSION)

SALIDA_DEF = os.path.join('D:' + os.sep, 'Archivos', 'Reportes')

# ── Umbrales: UN solo sitio, y son PROPUESTOS ──────────────────────────────
# El orden de la lista ES la cadena de clasificacion: se recorre de arriba
# abajo y gana el primero que casa, igual que el detector de alertas. Un
# segundo orden en otro sitio dejaria de ser el mismo reporte.
#   clave, etiqueta, severidad (1 = mas grave), accion
NIVELES = [
    ('sobre_critico', u'Sobreconsumo crítico', 1,
     u'Revisar plan y cobros: el excedente ya está en la factura.'),
    ('sobre', u'Sobreconsumo', 2,
     u'Revisar plan y cobros: cerró por encima de su límite.'),
    ('limite', u'Límite alcanzado', 3,
     u'Anticipar saturación: cerró exactamente en su límite, sin excedente.'),
    ('cerca', u'Cerca del límite', 4,
     u'Anticipar saturación antes del siguiente corte.'),
    ('rango', u'En rango', 7,
     u'Sin acción: el plan está bien dimensionado.'),
    ('subutil', u'Subutilización', 6,
     u'Revisar adopción: usa entre una cuarta parte y la mitad de su plan.'),
    ('bajo_critico', u'Bajo uso crítico', 5,
     u'Revisar adopción: indicio de downgrade.'),
]
ETIQUETA = {k: e for k, e, _s, _a in NIVELES}
SEVERIDAD = {k: s for k, _e, s, _a in NIVELES}
ACCION = {k: a for k, _e, _s, a in NIVELES}
ETIQUETA['no_evaluable'] = u'No evaluable'
SEVERIDAD['no_evaluable'] = 8
ACCION['no_evaluable'] = u'Completar datos: sin ciclo comparable que medir.'

# Que cuenta como ALERTA. «En rango» no, y «no evaluable» tampoco: ese es un
# hueco de dato, no un estado del cliente.
ALERTA = ('sobre_critico', 'sobre', 'limite', 'cerca', 'subutil', 'bajo_critico')
BAJO_USO = ('subutil', 'bajo_critico')

DIAS_MIN, DIAS_MAX = 25, 35   # un ciclo mensual comparable
VIVOS = ('activo', 'en_riesgo')
CICLOS_GRAFICA = 12           # se incrustan 12; la pantalla abre en 6


def clasifica(u_):
    u"""Nivel de un ciclo por su utilizacion SIN REDONDEAR."""
    if u_ >= 110:
        return 'sobre_critico'
    if u_ > 100:
        return 'sobre'
    if u_ == 100:
        return 'limite'
    if u_ >= 90:
        return 'cerca'
    if u_ >= 50:
        return 'rango'
    if u_ >= 25:
        return 'subutil'
    return 'bajo_critico'


# ── La paleta se LEE de lib/paleta-cs.ts ───────────────────────────────────
def paleta():
    t = io.open(os.path.join(RAIZ, 'lib', 'paleta-cs.ts'), encoding='utf-8').read()
    p = {}
    for k in ('MARINO', 'AZUL', 'LINEA', 'LAVADO', 'TX_ALTO', 'TX_MED',
              'TX_BAJO', 'ROJO_TX', 'AMBAR_TX', 'ZEBRA'):
        m = re.search(r'\b' + k + r'\s*=\s*\'(#[0-9A-Fa-f]{6})\'', t)
        if not m:
            raise RuntimeError(u'lib/paleta-cs.ts ya no define «%s». '
                               u'No se teclea un color a mano.' % k)
        p[k] = m.group(1)
    return p


def _lum(hex_):
    def c(v):
        v /= 255.0
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (int(hex_[i:i + 2], 16) for i in (1, 3, 5))
    return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b)


def contraste(a, b):
    la, lb = _lum(a), _lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


# ── Fuentes ────────────────────────────────────────────────────────────────
def lee_env():
    env = {}
    for line in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"')
    return env


def cartera():
    env = lee_env()
    url = env['NEXT_PUBLIC_SUPABASE_URL']
    key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
    r = urllib.request.Request(
        url + '/rest/v1/cuentas?select=consecutivo,empresa,asesor,estado,cid,'
              'facturacion&limit=2000',
        headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    with urllib.request.urlopen(r, timeout=180) as x:
        return json.loads(x.read().decode('utf-8', 'replace'))


def mrr_grc():
    u"""MRR por CID con la MISMA cascada que `importeDeCuenta`: GRC, luego la
       ficha, luego sin dato. El GRC es el MRR institucional."""
    g = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'),
                          encoding='utf-8'))
    filas = g.get('filas') if isinstance(g, dict) else g
    por_cid, banda = {}, {}
    for f in filas:
        cid = str(f.get('cid') or '').strip()
        if not cid:
            continue
        por_cid[cid] = por_cid.get(cid, 0.0) + float(f.get('mrrFin') or 0)
        banda.setdefault(cid, f.get('clasif'))
    meta = g.get('meta') if isinstance(g, dict) else None
    return por_cid, banda, (meta or {})


def fecha_de(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def dias_periodo(per):
    if ' - ' not in per:
        return None
    try:
        a, b = per.split(' - ')
        return (datetime.date(*map(int, b.split('-')))
                - datetime.date(*map(int, a.split('-')))).days + 1
    except Exception:
        return None


# ── Construccion ───────────────────────────────────────────────────────────
def construye(filtro_asesor=None):
    filas, ix, ruta = abre_corte()
    cuentas = cartera()
    por_cid_mrr, banda, grc_meta = mrr_grc()

    vivas = [c for c in cuentas if (c.get('estado') or '') in VIVOS]
    if filtro_asesor:
        vivas = [c for c in vivas if (c.get('asesor') or '') == filtro_asesor]
    por_cid = {}
    for c in vivas:
        cid = str(c.get('cid') or '').strip()
        if cid:
            por_cid.setdefault(cid, c)

    # ── ciclos, deduplicando filas identicas ──────────────────────────────
    # Medido: en la cartera hay 6 pares (CID, fecha de corte) repetidos y los
    # 6 son IDENTICOS en plan, incluidos, consumidos y periodo. Son la misma
    # fila dos veces. Si alguno difiriera habria que decidir cual vale, asi
    # que se cuenta y se reporta en vez de deduplicar en silencio.
    vistos, dup_identicos, dup_conflicto = {}, 0, []
    corte_max = None
    for f in filas:
        cid = str(celda(f, ix, 'CID') or u'').strip()
        if cid not in por_cid:
            continue
        fc = fecha_de(celda(f, ix, 'Fecha de corte'))
        if not fc:
            continue
        corte_max = fc if corte_max is None or fc > corte_max else corte_max
        plan = str(celda(f, ix, 'Nombre del Plan') or u'').strip()
        incl = num(celda(f, ix, 'Minutos Incluidos'))
        cons = num(celda(f, ix, 'Minutos Consumidos'))
        per = str(celda(f, ix, 'Periodo') or u'')
        llave = (cid, fc)
        huella = (plan, incl, cons, per)
        if llave in vistos:
            if vistos[llave]['huella'] == huella:
                dup_identicos += 1
            else:
                dup_conflicto.append((cid, fc.isoformat()))
            continue
        base, origen = base_minutos(plan, incl)
        dias = dias_periodo(per)
        comparable = bool(base) and dias is not None and DIAS_MIN <= dias <= DIAS_MAX
        motivo = None
        if not base:
            motivo = u'el plan no declara minutos medibles'
        elif dias is None:
            motivo = u'el periodo del archivo no se puede leer'
        elif dias < DIAS_MIN:
            motivo = u'periodo de %d días: más corto que un ciclo mensual' % dias
        elif dias > DIAS_MAX:
            motivo = u'periodo de %d días: acumula más de un ciclo' % dias
        vistos[llave] = {
            'huella': huella, 'cid': cid, 'fc': fc, 'mes': fc.strftime('%Y-%m'),
            'plan': plan, 'incl': incl, 'cons': cons, 'base': base,
            'origen': origen, 'per': per, 'dias': dias,
            'monto': num(celda(f, ix, 'Monto del plan')),
            'comparable': comparable, 'motivo': motivo,
        }

    serie = collections.defaultdict(list)
    for v in vistos.values():
        serie[v['cid']].append(v)
    for cid in serie:
        serie[cid].sort(key=lambda x: x['fc'])

    # Un mes con DOS ciclos comparables no se suma contra UN limite: se queda
    # el ultimo del mes y se cuenta el caso. Medido hoy: 0 en la cartera.
    dos_en_mes = 0
    for cid, v in serie.items():
        por_mes = collections.defaultdict(list)
        for x in v:
            if x['comparable']:
                por_mes[x['mes']].append(x)
        for m, g in por_mes.items():
            if len(g) > 1:
                dos_en_mes += 1
                for x in g[:-1]:
                    x['comparable'] = False
                    x['motivo'] = u'segundo ciclo cerrado en el mismo mes'

    meses = sorted({v['mes'] for v in vistos.values()})
    meses_graf = meses[-CICLOS_GRAFICA:] if meses else []
    # Los dos ultimos meses del corte son los que pueden tener el ciclo
    # abierto todavia; un ultimo cierre mas viejo es una lectura detenida.
    meses_frescos = set(meses[-2:]) if meses else set()

    filas_out, excl_cuentas = [], []
    for c in vivas:
        cid = str(c.get('cid') or '').strip()
        v = serie.get(cid, [])
        comp = [x for x in v if x['comparable']]
        mrr = por_cid_mrr.get(cid, 0.0)
        origen_mrr = 'grc'
        if mrr <= 0:
            mrr = float(c.get('facturacion') or 0)
            origen_mrr = 'ficha' if mrr > 0 else 'sin_dato'

        puntos = []
        for x in v:
            if x['mes'] not in meses_graf:
                continue
            puntos.append({
                'm': x['mes'], 'f': x['fc'].isoformat(), 'per': x['per'],
                'd': x['dias'], 'pl': x['plan'],
                'b': x['base'] if x['base'] else None, 'c': x['cons'],
                'u': round(100.0 * x['cons'] / x['base'], 2) if x['base'] else None,
                'sem': clasifica(100.0 * x['cons'] / x['base']) if x['comparable'] else None,
                'ok': 1 if x['comparable'] else 0, 'mot': x['motivo'],
                'org': x['origen'],
            })

        base_fila = {
            'cid': cid, 'cons': c.get('consecutivo') or u'',
            'emp': c.get('empresa') or u'(sin nombre)',
            'ase': c.get('asesor') or u'(sin asesor)',
            'est': c.get('estado') or u'',
            'cl': banda.get(cid) or None,
            'mrr': round(mrr, 2), 'omrr': origen_mrr,
            'pts': puntos,
        }

        if not comp:
            razon = (u'no aparece en el corte de facturación'
                     if not v else (v[-1]['motivo'] or u'sin ciclo comparable'))
            base_fila.update({'sem': 'no_evaluable', 'u': None, 'b': None,
                              'c': None, 'pl': None, 'mes': None, 'per': None,
                              'exc': None, 'var': None, 'varmot': razon,
                              'desv': 0, 'antiguo': 0, 'caidas': 0,
                              'org': None, 'ciclos': len(v)})
            filas_out.append(base_fila)
            excl_cuentas.append((base_fila['emp'], razon))
            continue

        u_ = 100.0 * comp[-1]['cons'] / comp[-1]['base']
        sem = clasifica(u_)
        exc = max(0.0, comp[-1]['cons'] - comp[-1]['base'])
        # Variacion pp: solo contra el ciclo cerrado anterior COMPARABLE y solo
        # si no cambio ni el plan ni la base.
        var, varmot = None, None
        if len(comp) < 2:
            varmot = u'no hay un ciclo cerrado anterior comparable'
        else:
            a, b = comp[-2], comp[-1]
            if a['plan'] != b['plan']:
                varmot = u'cambió el plan («%s» → «%s»): no comparable' % (a['plan'], b['plan'])
            elif a['base'] != b['base']:
                varmot = (u'cambió el límite (%s → %s min): no comparable'
                          % ('{:,.0f}'.format(a['base']), '{:,.0f}'.format(b['base'])))
            else:
                var = round(u_ - 100.0 * a['cons'] / a['base'], 2)
        # Caidas consecutivas: señal SECUNDARIA de adopcion, no de churn.
        caidas, us = 0, [100.0 * x['cons'] / x['base'] for x in comp]
        i = len(us) - 1
        while i >= 1 and us[i] < us[i - 1]:
            caidas += 1
            i -= 1
        desv = (comp[-1]['cons'] - comp[-1]['base']) if u_ > 100 else (
            comp[-1]['base'] - comp[-1]['cons'] if u_ < 50 else 0)
        base_fila.update({
            'sem': sem, 'u': round(u_, 2), 'b': comp[-1]['base'],
            'c': comp[-1]['cons'], 'pl': comp[-1]['plan'],
            'mes': comp[-1]['mes'], 'per': comp[-1]['per'],
            'exc': round(exc, 0), 'var': var, 'varmot': varmot,
            'desv': round(abs(desv), 0),
            'antiguo': 0 if comp[-1]['mes'] in meses_frescos else
                       (corte_max - comp[-1]['fc']).days,
            'caidas': caidas if caidas >= 2 else 0,
            'org': comp[-1]['origen'], 'ciclos': len(comp),
        })
        filas_out.append(base_fila)

    # ── ASERTOS DE CIERRE ─────────────────────────────────────────────────
    assert len(filas_out) == len(vivas), \
        u'las filas (%d) no cierran contra la cartera (%d)' % (len(filas_out), len(vivas))
    cubos = collections.Counter(f['sem'] for f in filas_out)
    assert sum(cubos.values()) == len(vivas), u'el semáforo no cierra'
    evaluables = sum(1 for f in filas_out if f['sem'] != 'no_evaluable')
    assert evaluables == len(vivas) - cubos['no_evaluable'], u'evaluables no cierra'
    for f in filas_out:
        if f['sem'] == 'no_evaluable':
            continue
        assert f['b'] and f['b'] > 0, u'%s evaluable sin base' % f['emp']
        assert f['sem'] == clasifica(f['u']), u'%s: el nivel no casa con su %%' % f['emp']
        assert (f['exc'] > 0) == (f['u'] > 100), \
            u'%s: excedente y utilización se contradicen' % f['emp']

    # ── serie agregada por mes, con su COBERTURA ──────────────────────────
    agg = []
    for m in meses_graf:
        cb = sum(1 for f in filas_out for p in f['pts'] if p['m'] == m and p['ok'])
        c_ = sum(p['c'] for f in filas_out for p in f['pts'] if p['m'] == m and p['ok'])
        b_ = sum(p['b'] for f in filas_out for p in f['pts'] if p['m'] == m and p['ok'])
        agg.append({'m': m, 'c': round(c_, 0), 'b': round(b_, 0), 'n': cb})

    return {
        'filas': filas_out, 'meses': meses_graf, 'agg': agg,
        'cubos': dict(cubos), 'evaluables': evaluables,
        'asignadas': len(vivas), 'corte_max': corte_max,
        'ruta_corte': os.path.relpath(ruta, RAIZ).replace('\\', '/'),
        'dup_identicos': dup_identicos, 'dup_conflicto': dup_conflicto,
        'dos_en_mes': dos_en_mes, 'excl_cuentas': excl_cuentas,
        'grc_meta': grc_meta, 'meses_todos': meses,
        'asesores': sorted({f['ase'] for f in filas_out}),
    }


# ── Los tres hallazgos: se CALCULAN ────────────────────────────────────────
def hallazgos(d):
    f = d['filas']
    ev = [x for x in f if x['sem'] != 'no_evaluable']
    out = []

    sobre = sorted([x for x in ev if x['sem'] in ('sobre_critico', 'sobre')],
                   key=lambda x: -x['exc'])
    if sobre:
        t = sobre[0]
        out.append((u'Principal alerta',
                    u'%d cuentas cerraron su último ciclo por encima del límite, '
                    u'con %s minutos de excedente en total. La mayor es %s: '
                    u'%s minutos contratados contra %s consumidos, el %s%%.'
                    % (len(sobre), u'{:,.0f}'.format(sum(x['exc'] for x in sobre)),
                       t['emp'], u'{:,.0f}'.format(t['b']),
                       u'{:,.0f}'.format(t['c']), u'{:,.1f}'.format(t['u']))))
    else:
        out.append((u'Principal alerta',
                    u'Ninguna cuenta evaluable cerró su último ciclo por encima '
                    u'del límite contratado.'))

    caidas = sorted([x for x in ev if x['var'] is not None], key=lambda x: x['var'])
    nocomp = sum(1 for x in ev if x['var'] is None)
    if caidas:
        t = caidas[0]
        out.append((u'Cambio relevante',
                    u'La mayor caída contra el ciclo cerrado anterior es %s: '
                    u'%s puntos porcentuales (%s%% → %s%%). '
                    u'%d cuentas no admiten comparación porque cambió su plan o '
                    u'su límite, o no tienen ciclo anterior.'
                    % (t['emp'], u'{:+,.1f}'.format(t['var']),
                       u'{:,.1f}'.format(t['u'] - t['var']), u'{:,.1f}'.format(t['u']),
                       nocomp)))

    bajo = [x for x in ev if x['sem'] in BAJO_USO]
    mrr_bajo = sum(x['mrr'] for x in bajo)
    sin_mrr = sum(1 for x in bajo if x['omrr'] == 'sin_dato')
    out.append((u'Acción prioritaria',
                u'%d de %d cuentas evaluables (%s%%) cerraron por debajo de la '
                u'mitad de su plan. MRR asociado: %s, contando cada cuenta una '
                u'vez%s. No es una pérdida prevista: es el dinero que está en '
                u'esas cuentas, no el que se perdería.'
                % (len(bajo), len(ev),
                   u'{:,.0f}'.format(100.0 * len(bajo) / len(ev)) if ev else u'0',
                   u'${:,.0f}'.format(mrr_bajo),
                   u' (%d sin MRR en ninguna fuente)' % sin_mrr if sin_mrr else u'')))
    return out


# ── HTML ───────────────────────────────────────────────────────────────────
def html(d, P, filtro_asesor, generado):
    j = json.dumps
    alcance = (u'Cartera de %s' % filtro_asesor) if filtro_asesor \
        else u'Cartera completa de Customer Success (Dirección)'
    ev = d['evaluables']
    asig = d['asignadas']
    f = d['filas']
    n_alerta = sum(1 for x in f if x['sem'] in ALERTA)
    n_exc = sum(1 for x in f if x['sem'] != 'no_evaluable' and x['exc'] > 0)
    n_bajo = sum(1 for x in f if x['sem'] in BAJO_USO)
    hall = hallazgos(d)
    antiguos = [x for x in f if x.get('antiguo')]

    datos = {
        'filas': f, 'meses': d['meses'], 'agg': d['agg'],
        'niveles': [{'k': k, 'e': e, 's': s, 'a': a} for k, e, s, a in NIVELES]
                   + [{'k': 'no_evaluable', 'e': ETIQUETA['no_evaluable'],
                       's': 8, 'a': ACCION['no_evaluable']}],
        'alerta': list(ALERTA), 'bajoUso': list(BAJO_USO),
        'asesores': d['asesores'], 'asignadas': asig,
        'soloAsesor': filtro_asesor or None,
    }

    # Cada par (texto, fondo) que el documento usa, comprobado antes de escribir.
    pares = [(P['TX_ALTO'], '#FFFFFF'), (P['TX_MED'], '#FFFFFF'),
             (P['TX_BAJO'], '#FFFFFF'), (P['AZUL'], '#FFFFFF'),
             (P['ROJO_TX'], '#FFFFFF'), (P['AMBAR_TX'], '#FFFFFF'),
             (P['TX_ALTO'], P['ZEBRA']), (P['TX_MED'], P['ZEBRA']),
             (P['TX_BAJO'], P['ZEBRA']), (P['ROJO_TX'], P['ZEBRA']),
             (P['AMBAR_TX'], P['ZEBRA']), (P['AZUL'], P['ZEBRA']),
             (P['TX_ALTO'], P['LAVADO']), (P['TX_MED'], P['LAVADO']),
             (P['TX_BAJO'], P['LAVADO']), (P['AZUL'], P['LAVADO']),
             (P['ROJO_TX'], P['LAVADO']), (P['AMBAR_TX'], P['LAVADO']),
             ('#FFFFFF', P['MARINO'])]
    # Y el texto que va DENTRO de las barras. Faltaba, y es el unico sitio del
    # documento donde se escribe en blanco sobre un color de dato: si uno de
    # esos tonos no aguantara, el numero de la barra seria ilegible y nada
    # mas lo habria dicho. «No evaluable» se pinta hueco (letra del propio
    # color sobre blanco), asi que se comprueba al reves.
    for c in (P['ROJO_TX'], P['AMBAR_TX'], P['MARINO'], P['AZUL'], P['TX_MED']):
        pares.append(('#FFFFFF', c))
    pares.append((P['TX_BAJO'], '#FFFFFF'))
    malos = [(a, b, contraste(a, b)) for a, b in pares if contraste(a, b) < 4.5]
    if malos:
        raise RuntimeError(u'contraste insuficiente: %s'
                           % u'; '.join(u'%s sobre %s = %.2f:1' % m for m in malos))

    css = u"""
:root{--marino:%(MARINO)s;--azul:%(AZUL)s;--linea:%(LINEA)s;--lavado:%(LAVADO)s;
--alto:%(TX_ALTO)s;--med:%(TX_MED)s;--bajo:%(TX_BAJO)s;--rojo:%(ROJO_TX)s;
--ambar:%(AMBAR_TX)s;--zebra:%(ZEBRA)s}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%%}
body{margin:0;background:#fff;color:var(--alto);
font:15px/1.55 "Segoe UI",system-ui,-apple-system,Arial,sans-serif}
.wrap{max-width:1280px;margin:0 auto;padding:0 16px 56px}
header{background:var(--marino);color:#fff;padding:26px 0 22px;margin-bottom:26px}
header .wrap{padding-bottom:0}
h1{margin:0 0 4px;font-size:27px;letter-spacing:-.2px}
.sub{color:#D7E7F2;font-size:14px;margin:0 0 14px}
.meta{display:flex;flex-wrap:wrap;gap:10px 26px;font-size:12.5px;color:#D7E7F2}
.meta b{color:#fff;font-weight:600}
.badge{display:inline-block;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.4);
border-radius:3px;padding:2px 8px;font-size:11.5px;color:#fff;letter-spacing:.3px}
h2{font-size:17px;margin:34px 0 12px;padding-bottom:7px;border-bottom:2px solid var(--linea)}
h3{font-size:14px;margin:0 0 8px;color:var(--med)}
.nota{font-size:12.5px;color:var(--bajo);margin:6px 0 0}
.hall{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}
.hall div{background:var(--lavado);border:1px solid var(--linea);border-left:3px solid var(--azul);
border-radius:4px;padding:13px 15px}
.hall h3{font-size:11.5px;text-transform:uppercase;letter-spacing:.7px;color:var(--azul);margin-bottom:5px}
.hall p{margin:0;font-size:13.5px;color:var(--med)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.kpi{border:1px solid var(--linea);border-radius:4px;padding:14px 16px;background:#fff}
.kpi .n{font-size:30px;font-weight:650;letter-spacing:-.5px;line-height:1.1}
.kpi .l{font-size:12.5px;color:var(--med);margin-top:3px}
.kpi .d{font-size:11.5px;color:var(--bajo);margin-top:6px;line-height:1.4}
.filtros{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end;background:var(--lavado);
border:1px solid var(--linea);border-radius:4px;padding:13px 15px}
.filtros label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.6px;
color:var(--med);margin-bottom:4px;font-weight:600}
.filtros select,.filtros input{font:14px inherit;padding:6px 8px;border:1px solid #B9C7D4;
border-radius:3px;background:#fff;color:var(--alto);min-width:150px}
.filtros button{font:13px inherit;padding:7px 13px;border:1px solid var(--azul);border-radius:3px;
background:#fff;color:var(--azul);cursor:pointer;font-weight:600}
.filtros button:hover{background:var(--azul);color:#fff}
.cob{font-size:12.5px;color:var(--med);margin:10px 0 0}
table{width:100%%;border-collapse:collapse;font-size:13px}
th,td{padding:7px 9px;text-align:left;border-bottom:1px solid var(--linea);vertical-align:top}
th{background:var(--lavado);font-size:11px;text-transform:uppercase;letter-spacing:.5px;
color:var(--med);font-weight:600;white-space:nowrap}
tbody tr:nth-child(even){background:var(--zebra)}
tbody tr.sel{background:#E8F2FA}
td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pill{display:inline-block;border-radius:3px;padding:1px 7px;font-size:11.5px;font-weight:600;
white-space:nowrap;border:1px solid}
.sw{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.tag{display:inline-block;font-size:10.5px;border:1px solid var(--linea);background:var(--lavado);
color:var(--med);border-radius:2px;padding:0 5px;margin-left:5px;white-space:nowrap}
.sinmed{color:var(--bajo);font-style:italic}
.leyenda{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12px;color:var(--med);margin:10px 0 0}
.det{border:1px solid var(--linea);border-radius:4px;padding:14px 16px;background:var(--lavado);margin-top:14px}
.det table{font-size:12.5px;background:#fff}
.caja{border:1px solid var(--linea);border-radius:4px;padding:14px 16px;background:#fff}
.caja ul{margin:7px 0 0;padding-left:20px;font-size:13px;color:var(--med)}
.caja li{margin-bottom:5px}
.caja p{font-size:13px;color:var(--med);margin:0 0 7px}
code{background:var(--lavado);border:1px solid var(--linea);border-radius:2px;padding:1px 5px;
font:12.5px ui-monospace,Consolas,monospace;color:var(--alto)}
svg{display:block;max-width:100%%;height:auto}
.vacio{padding:24px;text-align:center;color:var(--bajo);font-style:italic;
border:1px dashed var(--linea);border-radius:4px}
@media print{
 header{background:#fff!important;color:var(--alto)!important;border-bottom:3px solid var(--marino)}
 .sub,.meta{color:var(--med)!important}.meta b,.badge{color:var(--alto)!important}
 .badge{border-color:var(--med)}
 .filtros{display:none}
 body{font-size:11px}h1{font-size:20px}h2{font-size:14px;margin-top:18px}
 .kpi .n{font-size:22px}
 table{font-size:9.5px}th,td{padding:3px 5px}
 .hall div,.kpi,.caja,.det{break-inside:avoid}
 tr{break-inside:avoid}
 @page{size:A4 landscape;margin:11mm}
}
""" % P

    # El bloque JS NO se formatea con `%`: lleva por dentro porcentajes de
    # verdad —`width:100%`, `n1.format(u)+'%'`— y uno solo de ellos rompe el
    # formateo o, peor, se escapa a `%%` y se publica un «110%%» en pantalla.
    # Se sustituyen marcas que no pueden aparecer por accidente.
    js = u"""
const D = @@DATOS@@;
const NIV = {}; D.niveles.forEach(n => NIV[n.k] = n);
/* El color va por SEVERIDAD, no por gusto: rojo lo que ya está en la factura,
   ámbar lo que va a estarlo, y una rampa marino→azul→gris para el uso que se
   queda corto. «En rango» es el gris más neutro a propósito —es el estado que
   no pide nada y no debe llevarse la vista—, y «no evaluable» no es un estado
   del cliente sino un hueco de dato, así que se pinta como hueco: relleno
   blanco con filete. Eso además separa los dos grises que antes quedaban
   pegados en la misma barra. */
const COL = {sobre_critico:'@@ROJO@@',sobre:'@@ROJO@@',limite:'@@AMBAR@@',
 cerca:'@@AMBAR@@',rango:'@@MED@@',subutil:'@@AZUL@@',bajo_critico:'@@MARINO@@',
 no_evaluable:'@@BAJO@@'};
const HUECO = 'no_evaluable';   // se dibuja vacío, no relleno
const BG = {sobre_critico:'#FBECEC',sobre:'#FBECEC',limite:'#FDF4E3',cerca:'#FDF4E3',
 rango:'#EAF3FA',subutil:'#F0F3F6',bajo_critico:'#E9EEF4',no_evaluable:'#F5F8FB'};
const nf = new Intl.NumberFormat('es-MX');
const n1 = new Intl.NumberFormat('es-MX',{minimumFractionDigits:1,maximumFractionDigits:1});
const mx = new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0});
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = id => document.getElementById(id);
let SEL = null, VENT = 6;

/* El ciclo seleccionado de una fila. 'ultimo' = el ultimo cierre DE ESA
   CUENTA, que no es el mismo mes para todas. Un mes concreto solo devuelve
   algo si esa cuenta tiene un ciclo COMPARABLE en ese mes. */
function cicloDe(r, ciclo){
  if (ciclo === 'ultimo')
    return r.sem === 'no_evaluable' ? null
      : {u:r.u,b:r.b,c:r.c,pl:r.pl,sem:r.sem,m:r.mes,per:r.per,exc:r.exc,
         var:r.var,varmot:r.varmot,desv:r.desv,org:r.org};
  const p = r.pts.filter(p => p.m === ciclo && p.ok);
  if (!p.length) return null;
  const x = p[p.length-1];
  const i = r.pts.indexOf(x);
  let prev = null;
  for (let k = i-1; k >= 0; k--) if (r.pts[k].ok) { prev = r.pts[k]; break; }
  let v = null, vm = null;
  if (!prev) vm = 'no hay un ciclo cerrado anterior comparable';
  else if (prev.pl !== x.pl) vm = 'cambió el plan: no comparable';
  else if (prev.b !== x.b) vm = 'cambió el límite: no comparable';
  else v = Math.round((x.u - prev.u)*100)/100;
  const exc = Math.max(0, x.c - x.b);
  const desv = x.u > 100 ? x.c - x.b : (x.u < 50 ? x.b - x.c : 0);
  return {u:x.u,b:x.b,c:x.c,pl:x.pl,sem:x.sem,m:x.m,per:x.per,exc:exc,
          var:v,varmot:vm,desv:Math.abs(desv),org:x.org};
}

function filtros(){
  return {ciclo:$('fCiclo').value, ase:$('fAsesor') ? $('fAsesor').value : '',
          q:$('fCuenta').value.trim().toLowerCase(), niv:$('fNivel').value};
}

function datosFiltrados(){
  const F = filtros();
  return D.filas.map(r => {
    const c = cicloDe(r, F.ciclo);
    return {r, c, sem: c ? c.sem : 'no_evaluable'};
  }).filter(x => {
    const r = x.r;
    if (F.ase && r.ase !== F.ase) return false;
    if (F.q && !(r.emp.toLowerCase().includes(F.q) || r.cid.includes(F.q)
        || String(r.cons).toLowerCase().includes(F.q))) return false;
    if (F.niv === 'alerta' && !D.alerta.includes(x.sem)) return false;
    else if (F.niv === 'bajo' && !D.bajoUso.includes(x.sem)) return false;
    else if (F.niv && F.niv !== 'alerta' && F.niv !== 'bajo' && x.sem !== F.niv) return false;
    return true;
  });
}

function pintaKPIs(V){
  const ev = V.filter(x => x.sem !== 'no_evaluable');
  const asig = V.length;
  const alerta = V.filter(x => D.alerta.includes(x.sem));
  const exc = ev.filter(x => x.c.exc > 0);
  const bajo = V.filter(x => D.bajoUso.includes(x.sem));
  const uniq = a => new Set(a.map(x => x.r.cid)).size;
  const mrrBajo = bajo.reduce((s,x) => s + x.r.mrr, 0);
  const sinMrr = bajo.filter(x => x.r.omrr === 'sin_dato').length;
  $('kpis').innerHTML = [
    ['k1', nf.format(uniq(ev)) + ' <span style="font-size:18px;color:var(--bajo)">/ '
      + nf.format(asig) + '</span>', 'Cuentas evaluables / asignadas',
      'CID únicos con un ciclo comparable en el filtro, sobre la cartera viva del alcance.'],
    ['k2', nf.format(uniq(alerta)), 'Cuentas con alerta',
      'Todo nivel salvo «En rango». «No evaluable» no cuenta: es hueco de dato, no un estado del cliente.'],
    ['k3', nf.format(uniq(exc)), 'Cuentas con excedente',
      'Cerraron por encima del límite. El excedente se publica en minutos: el corte no trae tarifa.'],
    ['k4', nf.format(uniq(bajo)), 'Cuentas con bajo uso',
      'Por debajo del 50% de su plan. MRR asociado ' + mx.format(mrrBajo)
      + (sinMrr ? ' (' + sinMrr + ' sin MRR en ninguna fuente)' : '')
      + '. No es pérdida prevista.']
  ].map(k => '<div class="kpi"><div class="n">' + k[1] + '</div><div class="l">'
    + esc(k[2]) + '</div><div class="d">' + esc(k[3]) + '</div></div>').join('');
  const nd = V.length - ev.length;
  $('cobertura').innerHTML = 'Cobertura del filtro: <b>' + nf.format(ev.length)
    + '</b> de <b>' + nf.format(asig) + '</b> cuentas con ciclo comparable ('
    + n1.format(asig ? 100*ev.length/asig : 0) + '%). '
    + (nd ? '<b>' + nf.format(nd) + '</b> no evaluables, listadas al final de la tabla con su razón. '
          : 'Ninguna cuenta queda sin evaluar. ')
    + 'Una cuenta aparece en más de un indicador si su nivel lo implica; '
    + 'los conteos son de CID únicos.';
}

/* ─── Grafica principal: consumo vs limite, MISMA unidad (minutos) ─────── */
function grafica(V){
  const F = filtros();
  const una = V.length === 1 ? V[0].r : null;
  /* La ventana TERMINA en el ciclo elegido. Si no se movía, al pedir octubre
     la gráfica seguía dibujando noviembre: la tabla hablaba de un ciclo y el
     trazo de otro, que es la contradicción interna más barata de evitar. */
  let fin = D.meses.length;
  if (F.ciclo !== 'ultimo'){
    const i = D.meses.indexOf(F.ciclo);
    if (i >= 0) fin = i + 1;
  }
  const meses = D.meses.slice(Math.max(0, fin - VENT), fin);
  let serie;
  if (una){
    serie = meses.map(m => {
      const p = una.pts.filter(p => p.m === m);
      const ok = p.filter(p => p.ok);
      if (ok.length) { const x = ok[ok.length-1];
        return {m, c:x.c, b:x.b, n:1, pl:x.pl, per:x.per, hueco:false, nocomp:false}; }
      if (p.length) return {m, c:null, b:null, n:0, hueco:false, nocomp:true,
                            mot:p[p.length-1].mot, per:p[p.length-1].per};
      return {m, c:null, b:null, n:0, hueco:true, nocomp:false};
    });
  } else {
    const ids = new Set(V.map(x => x.r.cid));
    serie = meses.map(m => {
      let c = 0, b = 0, n = 0;
      D.filas.forEach(r => { if (!ids.has(r.cid)) return;
        const p = r.pts.filter(p => p.m === m && p.ok);
        if (p.length) { const x = p[p.length-1]; c += x.c; b += x.b; n++; } });
      return n ? {m, c, b, n, hueco:false, nocomp:false}
               : {m, c:null, b:null, n:0, hueco:true, nocomp:false};
    });
  }
  const conDato = serie.filter(s => s.c !== null);
  if (!conDato.length){
    $('g1').innerHTML = '<div class="vacio">Sin ciclos comparables en la ventana seleccionada.</div>';
    $('g1pie').textContent = ''; return;
  }
  const nmax = Math.max(...conDato.map(s => s.n));
  /* T deja sitio al rótulo de la unidad: con T=18 «MINUTOS» se montaba encima
     del valor más alto del eje y se leían los dos a medias. */
  const W = 1000, H = 344, L = 86, R = 150, T = 32, B = 62;
  const max = Math.max(...conDato.flatMap(s => [s.c, s.b])) * 1.14 || 1;
  const x = i => L + (meses.length > 1 ? i*(W-L-R)/(meses.length-1) : (W-L-R)/2);
  const y = v => T + (H-T-B)*(1 - v/max);
  const O = [];
  /* rejilla y eje */
  for (let k = 0; k <= 4; k++){
    const v = max*k/4;
    O.push('<line x1="'+L+'" y1="'+y(v).toFixed(1)+'" x2="'+(W-R)+'" y2="'+y(v).toFixed(1)
      +'" stroke="var(--linea)" stroke-width="1"/>');
    O.push('<text x="'+(L-9)+'" y="'+(y(v)+4).toFixed(1)+'" text-anchor="end" font-size="11" '
      +'fill="var(--bajo)">'+nf.format(Math.round(v))+'</text>');
  }
  O.push('<text x="14" y="14" font-size="10.5" fill="var(--med)" '
    +'font-weight="600">MINUTOS</text>');
  /* segmentos: solo entre puntos CONSECUTIVOS con dato — un hueco es ausencia */
  const seg = (campo, dash) => {
    let d = '', abierto = false;
    serie.forEach((s,i) => {
      if (s[campo] === null){ abierto = false; return; }
      d += (abierto ? ' L ' : ' M ') + x(i).toFixed(1) + ' ' + y(s[campo]).toFixed(1);
      abierto = true;
    });
    return '<path d="'+d.trim()+'" fill="none" stroke="'+(campo==='c'?'var(--azul)':'var(--marino)')
      +'" stroke-width="'+(campo==='c'?2.4:1.8)+'"'+(dash?' stroke-dasharray="7 5"':'')+'/>';
  };
  O.push(seg('b', true));
  O.push(seg('c', false));
  serie.forEach((s,i) => {
    const ultimo = i === serie.length-1;
    /* cobertura parcial: menos cuentas que el mes con mas cobertura de la ventana */
    const parcial = !una && s.n > 0 && s.n < nmax;
    if (s.c === null){
      O.push('<text x="'+x(i).toFixed(1)+'" y="'+(y(0)-6).toFixed(1)+'" text-anchor="middle" '
        +'font-size="10.5" fill="var(--bajo)" font-style="italic">'
        +(s.nocomp?'no comparable':'sin dato')+'</text>');
      return;
    }
    O.push('<circle cx="'+x(i).toFixed(1)+'" cy="'+y(s.b).toFixed(1)+'" r="3.4" fill="#fff" '
      +'stroke="var(--marino)" stroke-width="1.8"/>');
    O.push('<circle cx="'+x(i).toFixed(1)+'" cy="'+y(s.c).toFixed(1)+'" r="'+(parcial?3.6:4.6)+'" '
      +'fill="'+(parcial?'#fff':'var(--azul)')+'" stroke="var(--azul)" stroke-width="2"/>');
    O.push('<title>'+esc(s.m+' · '+nf.format(s.c)+' de '+nf.format(s.b)+' min · '
      +(una?'':s.n+' cuentas'))+'</title>');
    if (ultimo || parcial || meses.length <= 7)
      O.push('<text x="'+x(i).toFixed(1)+'" y="'+(y(s.c)-11).toFixed(1)+'" text-anchor="middle" '
        +'font-size="10.5" fill="var(--azul)" font-weight="600">'+nf.format(s.c)+'</text>');
  });
  serie.forEach((s,i) => {
    O.push('<text x="'+x(i).toFixed(1)+'" y="'+(H-B+20)+'" text-anchor="middle" font-size="11" '
      +'fill="var(--med)">'+s.m+'</text>');
    if (!una) O.push('<text x="'+x(i).toFixed(1)+'" y="'+(H-B+35)+'" text-anchor="middle" '
      +'font-size="10" fill="var(--bajo)">'+(s.n?'n='+s.n:'—')+'</text>');
  });
  /* leyenda dentro del lienzo, a la derecha */
  const lx = W-R+16;
  O.push('<line x1="'+lx+'" y1="'+(T+22)+'" x2="'+(lx+26)+'" y2="'+(T+22)
    +'" stroke="var(--azul)" stroke-width="2.4"/>');
  O.push('<text x="'+(lx+32)+'" y="'+(T+26)+'" font-size="11.5" fill="var(--alto)">Consumo real</text>');
  O.push('<line x1="'+lx+'" y1="'+(T+44)+'" x2="'+(lx+26)+'" y2="'+(T+44)
    +'" stroke="var(--marino)" stroke-width="1.8" stroke-dasharray="7 5"/>');
  O.push('<text x="'+(lx+32)+'" y="'+(T+48)+'" font-size="11.5" fill="var(--alto)">Límite contratado</text>');
  O.push('<circle cx="'+(lx+13)+'" cy="'+(T+66)+'" r="3.6" fill="#fff" stroke="var(--azul)" stroke-width="2"/>');
  O.push('<text x="'+(lx+32)+'" y="'+(T+70)+'" font-size="11.5" fill="var(--med)">Cobertura parcial</text>');
  $('g1').innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'
    + esc('Consumo real contra límite contratado, en minutos, por ciclo') + '">'
    + O.join('') + '</svg>';

  const faltan = serie.filter(s => s.hueco).map(s => s.m);
  const nocomp = serie.filter(s => s.nocomp);
  const parciales = serie.filter(s => !una && s.n > 0 && s.n < nmax);
  let pie = una
    ? 'Serie de <b>' + esc(una.emp) + '</b>. Plan vigente en cada ciclo: '
      + esc(conDato.map(s => s.pl).filter((v,i,a) => a.indexOf(v) === i).join(' → '))
      + '.'
    : 'Suma de minutos consumidos contra suma de límites comparables de las '
      + 'cuentas del filtro. No es un promedio de porcentajes. '
      + '<code>n</code> es cuántas cuentas aportan a cada ciclo.';
  /* Las dos cobertura parciales NO tienen la misma causa y decirlo con una
     sola frase publica una razón falsa en los ciclos antiguos:
       · el ÚLTIMO ciclo del corte está parcial porque las demás cuentas no
         habían cerrado su ciclo cuando se exportó el archivo;
       · un ciclo ANTERIOR parcial es un hueco del origen: esas cuentas no
         tienen fila para ese mes. */
  const ultimo = parciales.find(s => s.m === D.meses[D.meses.length-1]);
  const viejos = parciales.filter(s => s !== ultimo);
  if (ultimo) pie += ' <b>Cobertura parcial en el ciclo más reciente</b> (' + ultimo.m
    + ', n=' + ultimo.n + ' de ' + nmax + '): las demás cuentas no habían cerrado su ciclo '
    + 'cuando se exportó el corte, así que la bajada del trazo es cobertura, no consumo.';
  if (viejos.length) pie += ' <b>Cobertura parcial</b> también en '
    + viejos.map(s => s.m+' (n='+s.n+')').join(', ')
    + ', por una razón distinta: esas cuentas no tienen fila en el archivo para ese ciclo. '
    + 'Es ausencia en el origen, no consumo menor.';
  if (faltan.length) pie += ' Sin dato en ' + faltan.join(', ') + ': ausencia, no cero.';
  if (nocomp.length) pie += ' No comparable en ' + nocomp.map(s => s.m+' ('+esc(s.mot||'')+')').join(', ') + '.';
  $('g1pie').innerHTML = pie;
}

/* ─── Grafica secundaria: barras horizontales por asesor ──────────────── */
function barras(V){
  const porAse = {};
  V.forEach(x => { (porAse[x.r.ase] = porAse[x.r.ase] || {})[x.sem]
    = ((porAse[x.r.ase] || {})[x.sem] || 0) + 1; });
  const ases = Object.keys(porAse).sort();
  const orden = D.niveles.slice().sort((a,b) => a.s - b.s).map(n => n.k);
  if (!ases.length){ $('g2').innerHTML = '<div class="vacio">Sin cuentas en el filtro.</div>'; return; }
  const indiv = ases.length === 1;
  const W = 1000, fila = 40, L = indiv ? 150 : 108, R = 60, T = 12;
  const H = T + ases.length*fila + 16;
  const max = Math.max(...ases.map(a => orden.reduce((s,k) => s + (porAse[a][k]||0), 0)), 1);
  const O = [];
  ases.forEach((a,i) => {
    const y = T + i*fila + 7, tot = orden.reduce((s,k) => s + (porAse[a][k]||0), 0);
    O.push('<text x="'+(L-10)+'" y="'+(y+16)+'" text-anchor="end" font-size="12.5" '
      +'fill="var(--alto)" font-weight="600">'+esc(a)+'</text>');
    let cx = L;
    orden.forEach(k => {
      const n = porAse[a][k] || 0; if (!n) return;
      const w = n*(W-L-R)/max, hueco = k === HUECO;
      O.push('<rect x="'+cx.toFixed(1)+'" y="'+y+'" width="'+Math.max(w-2,1).toFixed(1)
        +'" height="23" fill="'+(hueco?'#fff':COL[k])+'" rx="1"'
        +(hueco?' stroke="'+COL[k]+'" stroke-width="1"':'')+'><title>'
        +esc(a+' · '+NIV[k].e+': '+n+' cuentas')+'</title></rect>');
      if (w > 26) O.push('<text x="'+(cx+w/2-1).toFixed(1)+'" y="'+(y+16)
        +'" text-anchor="middle" font-size="11" fill="'+(hueco?COL[k]:'#fff')
        +'" font-weight="600">'+n+'</text>');
      cx += w;
    });
    O.push('<text x="'+(cx+8).toFixed(1)+'" y="'+(y+16)+'" font-size="12" fill="var(--med)" '
      +'font-weight="600">'+tot+'</text>');
  });
  $('g2').innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'
    + esc('Cuentas por nivel de alerta' + (indiv ? '' : ', por asesor')) + '">'
    + O.join('') + '</svg>';
  $('g2leyenda').innerHTML = orden.map(k => '<span><span class="sw" style="background:'
    + (k === HUECO ? '#fff;border:1px solid ' + COL[k] : COL[k]) + '"></span>'
    + esc(NIV[k].e) + '</span>').join('');
  $('g2pie').innerHTML = indiv
    ? 'Distribución de la cartera de <b>' + esc(ases[0]) + '</b>. Un estado por cuenta.'
    : 'Un solo estado por cuenta: el del recurso con la severidad más alta. Hoy el reporte '
      + 'mide un único recurso (minutos de voz), así que la regla no desempata nada todavía; '
      + 'queda escrita para cuando entre un segundo recurso.';
}

/* ─── Tabla priorizada ────────────────────────────────────────────────── */
function tabla(V){
  const orden = V.slice().sort((a,b) =>
    (NIV[a.sem].s - NIV[b.sem].s) || ((b.c ? b.c.desv : 0) - (a.c ? a.c.desv : 0))
    || a.r.emp.localeCompare(b.r.emp,'es'));
  if (!orden.length){ $('tbody').innerHTML =
    '<tr><td colspan="9"><div class="vacio">Ninguna cuenta cumple el filtro.</div></td></tr>';
    $('tpie').textContent = ''; return; }
  $('tbody').innerHTML = orden.map(x => {
    const r = x.r, c = x.c, k = x.sem;
    const nm = NIV[k];
    const pill = '<span class="pill" style="color:'+COL[k]+';background:'+BG[k]
      +';border-color:'+COL[k]+'44">'+esc(nm.e)+'</span>';
    const varTxt = !c ? '<span class="sinmed">—</span>'
      : (c.var === null
          ? '<span class="sinmed" title="'+esc(c.varmot||'')+'">no comparable</span>'
          : '<b style="color:'+(c.var < 0 ? 'var(--rojo)' : 'var(--med)')+'">'
            + (c.var > 0 ? '+' : '') + n1.format(c.var) + ' pp</b>');
    const tags = [];
    if (r.antiguo) tags.push('<span class="tag" title="Su último ciclo comparable cerró hace '
      + r.antiguo + ' días">lectura detenida</span>');
    if (c && c.org === 'extensiones') tags.push('<span class="tag" title="El límite no viene '
      + 'declarado en el archivo: se deriva del nombre del plan a @@MPE@@ min por extensión">'
      + 'límite derivado</span>');
    if (r.caidas >= 2) tags.push('<span class="tag" title="'+r.caidas+' ciclos consecutivos a la baja. '
      + 'Señal secundaria de adopción, no confirmación de churn ni de downgrade">'
      + r.caidas + ' caídas</span>');
    if (c && c.exc > 0) tags.push('<span class="tag" title="Excedente en minutos. El corte no trae '
      + 'tarifa, así que no se estima cargo">+' + nf.format(c.exc) + ' min</span>');
    return '<tr data-cid="'+esc(r.cid)+'"'+(SEL===r.cid?' class="sel"':'')+'>'
      + '<td><b>'+esc(r.emp)+'</b>'+tags.join('')
      + '<div style="font-size:11px;color:var(--bajo)">'
      + esc((r.cons?r.cons+' · ':'')+'CID '+r.cid+(r.cl?' · '+r.cl:'')
            +(r.est==='en_riesgo'?' · en riesgo':''))+'</div></td>'
      + '<td>'+esc(r.ase)+'</td>'
      + '<td style="font-size:12px">'+(c?esc(c.pl):'<span class="sinmed">—</span>')
      + '<div style="font-size:11px;color:var(--bajo)">Minutos de voz'
      + (c&&c.m?' · ciclo '+esc(c.m):'')+'</div></td>'
      + '<td class="n">'+(c?nf.format(c.b):'<span class="sinmed">—</span>')+'</td>'
      + '<td class="n">'+(c?nf.format(c.c):'<span class="sinmed">—</span>')+'</td>'
      + '<td class="n">'+(c?'<b>'+n1.format(c.u)+'%</b>':'<span class="sinmed">—</span>')+'</td>'
      + '<td class="n">'+varTxt+'</td>'
      + '<td>'+pill+'</td>'
      + '<td style="font-size:12px;color:var(--med)">'
      + esc(k==='no_evaluable' ? 'Completar datos: '+(r.varmot||'sin ciclo comparable')+'.' : nm.a)
      + '</td></tr>';
  }).join('');
  $('tpie').innerHTML = 'Ordenada por severidad y, dentro de cada nivel, por la magnitud de la '
    + 'desviación en minutos (excedente si rebasa, minutos sin usar si queda por debajo del 50%). '
    + 'Clic en una fila para ver su historial. <b>' + orden.length + '</b> filas, ninguna recortada.';
  [...$('tbody').querySelectorAll('tr[data-cid]')].forEach(tr =>
    tr.onclick = () => { SEL = SEL === tr.dataset.cid ? null : tr.dataset.cid; pinta(); });
}

function detalle(){
  if (!SEL){ $('det').innerHTML = ''; return; }
  const r = D.filas.find(x => x.cid === SEL);
  if (!r){ $('det').innerHTML = ''; return; }
  const ps = r.pts.slice().reverse();
  $('det').innerHTML = '<div class="det"><h3>Historial de ' + esc(r.emp)
    + ' <span style="font-weight:400;color:var(--bajo)">· CID ' + esc(r.cid)
    + ' · ' + esc(r.ase) + ' · MRR ' + (r.omrr === 'sin_dato' ? 'sin dato en ninguna fuente'
      : mx.format(r.mrr) + ' (' + (r.omrr === 'grc' ? 'GRC' : 'ficha de cuenta') + ')')
    + '</span></h3>'
    + (ps.length ? '<table><thead><tr><th>Ciclo</th><th>Periodo del archivo</th><th>Días</th>'
      + '<th>Plan</th><th class="n">Contratado</th><th class="n">Consumido</th>'
      + '<th class="n">Utilización</th><th>Estado</th></tr></thead><tbody>'
      + ps.map(p => '<tr><td>' + esc(p.m) + '</td><td style="font-size:11.5px">' + esc(p.per)
        + '</td><td class="n">' + (p.d == null ? '—' : p.d) + '</td>'
        + '<td style="font-size:11.5px">' + esc(p.pl) + '</td>'
        + '<td class="n">' + (p.b == null ? '<span class="sinmed">sin límite medible</span>' : nf.format(p.b)) + '</td>'
        + '<td class="n">' + nf.format(p.c) + '</td>'
        + '<td class="n">' + (p.ok ? '<b>' + n1.format(p.u) + '%</b>'
          : '<span class="sinmed">no comparable</span>') + '</td>'
        + '<td style="font-size:11.5px">' + (p.ok
          ? '<span class="pill" style="color:' + COL[p.sem] + ';background:' + BG[p.sem]
            + ';border-color:' + COL[p.sem] + '44">' + esc(NIV[p.sem].e) + '</span>'
          : '<span class="sinmed">' + esc(p.mot || '') + '</span>') + '</td></tr>').join('')
      + '</tbody></table>'
      : '<p class="nota">Esta cuenta no tiene ninguna fila en el corte de facturación: '
        + 'no hay historial que mostrar. No es consumo cero.</p>')
    + '<p class="nota">Los meses que no aparecen en esta tabla no tienen ciclo en el archivo. '
    + 'Es ausencia de dato, no consumo cero. Clic de nuevo en la fila para cerrar.</p></div>';
}

function pinta(){
  const V = datosFiltrados();
  pintaKPIs(V); grafica(V); barras(V); tabla(V); detalle();
}

window.addEventListener('DOMContentLoaded', () => {
  const sel = $('fCiclo');
  sel.innerHTML = '<option value="ultimo">Último cierre de cada cuenta</option>'
    + D.meses.slice().reverse().map(m => '<option value="' + m + '">' + m + '</option>').join('');
  if ($('fAsesor')) $('fAsesor').innerHTML = '<option value="">Todos</option>'
    + D.asesores.map(a => '<option>' + esc(a) + '</option>').join('');
  $('fNivel').innerHTML = '<option value="">Todos los niveles</option>'
    + '<option value="alerta">Solo con alerta</option>'
    + '<option value="bajo">Solo bajo uso</option>'
    + D.niveles.slice().sort((a,b) => a.s-b.s).map(n =>
        '<option value="' + n.k + '">' + esc(n.e) + '</option>').join('');
  ['fCiclo','fAsesor','fNivel'].forEach(id => { if ($(id)) $(id).onchange = () => { SEL=null; pinta(); }; });
  $('fCuenta').oninput = () => { SEL = null; pinta(); };
  $('reset').onclick = () => {
    $('fCiclo').value = 'ultimo'; if ($('fAsesor')) $('fAsesor').value = '';
    $('fCuenta').value = ''; $('fNivel').value = ''; SEL = null; VENT = 6;
    $('vent').textContent = 'Ver 12 ciclos'; pinta();
  };
  $('vent').onclick = () => {
    VENT = VENT === 6 ? Math.min(12, D.meses.length) : 6;
    $('vent').textContent = VENT === 6 ? 'Ver 12 ciclos' : 'Ver 6 ciclos';
    pinta();
  };
  $('vent').textContent = 'Ver ' + Math.min(12, D.meses.length) + ' ciclos';
  pinta();
});
"""
    for marca, valor in (('@@ROJO@@', P['ROJO_TX']), ('@@AMBAR@@', P['AMBAR_TX']),
                         ('@@AZUL@@', P['AZUL']), ('@@MARINO@@', P['MARINO']),
                         ('@@MED@@', P['TX_MED']), ('@@BAJO@@', P['TX_BAJO']),
                         ('@@MPE@@', str(MINUTOS_POR_EXTENSION)),
                         ('@@DATOS@@', j(datos, ensure_ascii=False))):
        js = js.replace(marca, valor)
    # Ninguna marca puede quedar viva: una marca sin sustituir sale al archivo
    # como texto y el JavaScript revienta sin decir por qué.
    sobran = re.findall(r'@@[A-Z_]+@@', js)
    if sobran:
        raise RuntimeError(u'marcas sin sustituir en el JS: %s' % sorted(set(sobran)))

    niv_txt = u''.join(
        u'<li><b>%s</b> — %s. %s</li>' % (e, lim, ACCION[k])
        for (k, e, _s, _a), lim in zip(NIVELES, [
            u'utilización ≥ 110%', u'> 100% y < 110%',
            u'exactamente 100%: límite alcanzado, sin excedente',
            u'≥ 90% y < 100%', u'≥ 50% y < 90%', u'≥ 25% y < 50%',
            u'< 25%']))

    excl = collections.Counter(r for _e, r in d['excl_cuentas'])

    return (u'''<!DOCTYPE html>
<html lang="es-MX"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Consumo vs Plan Contratado — %(alcance_t)s</title>
<style>%(css)s</style></head><body>
<header><div class="wrap">
<span class="badge">CORTE ESTÁTICO · USO INTERNO DE CALLPICKER</span>
<h1>Consumo vs Plan Contratado</h1>
<p class="sub">%(alcance)s · recurso medido: minutos de voz</p>
<div class="meta">
<span>Periodo analizado <b>%(per_ini)s a %(per_fin)s</b></span>
<span>Fecha de corte <b>%(corte)s</b></span>
<span>Generado <b>%(generado)s</b></span>
<span>Cobertura <b>%(ev)s de %(asig)s cuentas asignadas</b></span>
</div>
<div class="meta" style="margin-top:8px">
<span>Fuentes: <b>%(ruta)s</b> (plan, límite y consumo por ciclo) ·
<b>cuentas</b> de Supabase (asignación vigente de cartera) ·
<b>data/grc-zoho.json</b> (MRR institucional)</span>
</div>
</div></header>

<div class="wrap">

<h2>Resumen</h2>
<div class="hall">%(hall)s</div>

<h2>Indicadores</h2>
<div class="kpis" id="kpis"></div>
<p class="cob" id="cobertura"></p>

<h2>Filtros</h2>
<div class="filtros">
<div><label for="fCiclo">Ciclo</label><select id="fCiclo"></select></div>
%(filtro_ase)s
<div><label for="fCuenta">Cuenta / CID / consecutivo</label>
<input id="fCuenta" type="search" placeholder="Buscar…" autocomplete="off"></div>
<div><label for="fRecurso">Recurso</label><select id="fRecurso" disabled>
<option>Minutos de voz</option></select></div>
<div><label for="fNivel">Nivel de alerta</label><select id="fNivel"></select></div>
<div><button id="reset" type="button">Restablecer filtros</button></div>
<div><button id="vent" type="button">Ver 12 ciclos</button></div>
</div>
<p class="nota">El recurso no se puede cambiar: hoy sólo los minutos de voz tienen
límite contratado y consumo medido por ciclo. Las demás líneas del contrato están
listadas en «Qué queda fuera», con la razón medida de por qué no se pueden comparar.</p>

<h2>Consumo real contra límite contratado</h2>
<div id="g1"></div>
<p class="nota" id="g1pie"></p>

<h2>Cuentas por nivel de alerta</h2>
<div id="g2"></div>
<div class="leyenda" id="g2leyenda"></div>
<p class="nota" id="g2pie"></p>

<h2>Cuentas priorizadas</h2>
<div style="overflow-x:auto">
<table><thead><tr>
<th>Cuenta / CID</th><th>Asesor</th><th>Plan y recurso</th>
<th class="n">Contratado</th><th class="n">Consumido</th><th class="n">Utilización</th>
<th class="n">Variación</th><th>Alerta</th><th>Siguiente acción</th>
</tr></thead><tbody id="tbody"></tbody></table></div>
<p class="nota" id="tpie"></p>
<div id="det"></div>

<h2>Cómo se calculó</h2>
<div class="caja">
<p><b>Utilización</b> = minutos consumidos ÷ minutos contratados × 100, por cuenta,
recurso y ciclo, con las condiciones vigentes en cada ciclo. El plan de hoy nunca
reescribe el historial. El nivel se asigna con el valor <b>sin redondear</b>.</p>
<p><b>Al consolidar</b> se usa suma de consumo ÷ suma de límites comparables, nunca
un promedio de porcentajes. Las unidades no se mezclan: la serie está en minutos.</p>
<p><b>La columna «%% Consumo» del archivo no se usa nunca.</b> En los planes de
extensiones ilimitadas «Minutos Incluidos» trae 1 y el archivo publica porcentajes
de hasta 3,417,300%%. El límite se calcula con la regla de negocio
(%(mpe)s minutos por extensión, dirección 14 sep 2026) y las cuentas donde el
límite se deriva del nombre del plan llevan la marca <span class="tag">límite derivado</span>.</p>
<p><b>Umbrales propuestos, no política confirmada de Callpicker.</b> Son los de la
petición y viven en un solo sitio del generador:</p>
<ul>%(niveles)s</ul>
<p><b>Orden de severidad</b> para la tabla y las barras: sobreconsumo crítico,
sobreconsumo, límite alcanzado, cerca del límite, bajo uso crítico, subutilización,
en rango, no evaluable. El bajo uso va por delante de la subutilización porque
dirección lo reclasificó como indicio de downgrade el 20 nov 2026.</p>
<p><b>Excedente</b> = máximo entre cero y consumo menos límite, <b>en minutos</b>.
El corte no trae tarifa de excedente, así que no se estima ningún cargo: un importe
inventado se leería como valor de upsell confirmado.</p>
<p><b>MRR</b>: el del GRC por CID; si no lo trae, el de la ficha de cuenta; si
ninguno, se dice «sin dato». El importe de las cuentas con bajo uso cuenta cada CID
una vez y <b>no es una pérdida prevista</b>.</p>
<p><b>Variación</b> en puntos porcentuales contra el ciclo cerrado anterior
comparable, y sólo si no cambió el plan ni el límite. Si cambió, el punto porcentual
mezclaría un cambio de plan con un cambio de comportamiento: se marca «no comparable»
con la razón. No existe una regla de prorrateo validada por el negocio, así que no se
prorratea nada. Las caídas consecutivas se publican como <b>señal secundaria de
adopción</b>, nunca como confirmación de churn o de downgrade.</p>
<p><b>Un cero medido no es un hueco.</b> Consumo 0 con límite medible es un cero
verificado y se publica como 0%%. Un ciclo que no existe en el archivo se dibuja
como ausencia: la línea se corta, no baja a cero.</p>
</div>

<h2>Qué queda fuera, y por qué</h2>
<div class="caja">
<p>El reporte mide <b>un</b> recurso. Lo demás que la cuenta contrata no tiene, hoy,
las dos mitades que hacen falta —un límite contratado y un consumo medido en la misma
unidad y por el mismo ciclo—:</p>
<ul>
<li><b>Extensiones.</b> El plan declara cuántas se contratan, en su propio nombre.
Ninguna fuente mide cuántas se usan, así que no hay numerador.</li>
<li><b>Chat de Callpicker.</b> Es el que más cerca está: <code>chat-data.ts</code>
trae bolsa de mensajes y mensajes consumidos. Pero de 159 cuentas sólo <b>13</b>
declaran bolsa, cada una con <b>un</b> periodo distinto (del 2026-06-02 al
2026-10-21) y <b>46</b> con la lectura rota. Un punto suelto por cuenta no sostiene
una serie por ciclo, y un cero de lectura rota no es desuso. Para incorporarlo hace
falta la bolsa contratada por cuenta y el consumo por ciclo de facturación.</li>
<li><b>DIDs.</b> <code>data/dids.json</code> es inventario de números, no consumo.</li>
<li><b>Llamadas.</b> Unidad distinta —llamadas, no minutos de bolsa— y cadencia
semestral. No se mezcla en la misma serie.</li>
</ul>
<p>Dentro de los minutos de voz, estas cuentas del alcance <b>no son evaluables</b>:</p>
<ul>%(excl)s</ul>
<p>Y estos ciclos del archivo se descartaron por no ser comparables con un ciclo
mensual: duración fuera de %(dmin)s–%(dmax)s días. Hay periodos de 411, 446, 455 y
477 días en la cartera; medir uno de ésos contra un límite mensual produce
utilizaciones de cientos por ciento que no son excedente sino artefacto de la
ventana. %(antiguos)s</p>
<p><b>Control de duplicados:</b> %(dups)s %(dupconf)s %(dosmes)s</p>
</div>

<h2>Confidencialidad y reparto</h2>
<div class="caja">
<p>%(conf)s</p>
<p>Un filtro visual no es control de acceso: el reparto se hace filtrando en el
generador, antes de incrustar los datos. Este archivo no lleva telemetría, no hace
ninguna llamada de red, no contiene claves ni vínculos de acceso privado, y no
incluye llamadas individuales, grabaciones, teléfonos ni contactos. Los nombres de
cuenta se escapan como texto, nunca como marcado ejecutable.</p>
<p>No se envía ningún mensaje ni se registra ningún seguimiento desde aquí: es un
reporte de lectura.</p>
</div>

<h2>Cómo regenerarlo con el siguiente corte</h2>
<div class="caja">
<ul>
<li>Sustituir <code>data/cortes-facturacion.xlsx</code> por el corte nuevo, con la
carga semanal de siempre.</li>
<li><code>python -I scripts/gen-consumo-vs-plan.py</code> — consolidado de Dirección.</li>
<li><code>python -I scripts/gen-consumo-vs-plan.py --asesor "NOMBRE"</code> — un
archivo por asesor, ya filtrado en los datos incrustados.</li>
<li><code>python -I scripts/gen-consumo-vs-plan.py --autoprueba</code> — las
comprobaciones de los límites del semáforo y de los casos borde.</li>
</ul>
<p>El generador es de sólo lectura sobre las fuentes: no escribe en
<code>data/</code> ni en <code>public/</code>, no agrega rutas ni componentes a la
aplicación, y el <code>.html</code> se guarda fuera del repositorio.</p>
</div>

<p class="nota" style="margin-top:28px;border-top:1px solid var(--linea);padding-top:12px">
<b>Consumo vs Plan Contratado</b> · %(alcance)s · corte %(corte)s ·
generado %(generado)s · uso interno de Callpicker. Los filtros actúan sobre esta
copia: para datos nuevos se genera otro archivo.</p>

</div>
<script>%(js)s</script></body></html>
''' % {
        'css': css, 'js': js,
        'alcance': alcance,
        'alcance_t': (filtro_asesor or u'Dirección'),
        'per_ini': d['meses_todos'][0] if d['meses_todos'] else u'—',
        'per_fin': d['meses_todos'][-1] if d['meses_todos'] else u'—',
        'corte': d['corte_max'].isoformat() if d['corte_max'] else u'—',
        'generado': generado,
        'ev': u'{:,}'.format(ev), 'asig': u'{:,}'.format(asig),
        'ruta': d['ruta_corte'],
        'hall': u''.join(u'<div><h3>%s</h3><p>%s</p></div>' % (t, c) for t, c in hall),
        'niveles': niv_txt,
        'mpe': u'{:,}'.format(MINUTOS_POR_EXTENSION),
        'filtro_ase': u'' if filtro_asesor else
            u'<div><label for="fAsesor">Asesor</label><select id="fAsesor"></select></div>',
        'excl': (u''.join(u'<li>%d cuenta%s: %s</li>'
                          % (n, u's' if n != 1 else u'', r)
                          for r, n in excl.most_common())
                 or u'<li>Ninguna: todas las cuentas del alcance tienen un ciclo comparable.</li>'),
        'dmin': DIAS_MIN, 'dmax': DIAS_MAX,
        'antiguos': (u'Además, %d cuenta%s arrastra%s un último ciclo comparable de '
                     u'meses atrás y lleva la marca «lectura detenida» en la tabla: su '
                     u'cierre no es comparable con el del resto del corte.'
                     % (len(antiguos), u's' if len(antiguos) != 1 else u'',
                        u'n' if len(antiguos) != 1 else u'')) if antiguos else
                    u'Ninguna cuenta del alcance arrastra una lectura detenida.',
        'dups': (u'%d fila%s repetida%s (mismo CID y misma fecha de corte) con plan, '
                 u'límite, consumo y periodo <b>idénticos</b>: es la misma fila dos '
                 u'veces y se contó una.'
                 % (d['dup_identicos'], u's' if d['dup_identicos'] != 1 else u'',
                    u's' if d['dup_identicos'] != 1 else u'')) if d['dup_identicos']
                else u'Ninguna fila repetida en el alcance.',
        'dupconf': (u'<b>%d par%s con el mismo CID y la misma fecha pero datos '
                    u'distintos</b>, que no se puede deducir cuál vale: %s.'
                    % (len(d['dup_conflicto']), u'es' if len(d['dup_conflicto']) != 1 else u'',
                       u', '.join(u'%s (%s)' % t for t in d['dup_conflicto'][:6])))
                   if d['dup_conflicto'] else
                   u'Ningún par repetido con datos contradictorios.',
        'dosmes': (u'%d cuenta-mes con dos ciclos cerrados: se conserva el último del '
                   u'mes, porque sumar dos ciclos contra un solo límite inflaría la '
                   u'utilización.' % d['dos_en_mes']) if d['dos_en_mes'] else
                  u'Ninguna cuenta cerró dos ciclos en el mismo mes.',
        'conf': (u'Este archivo contiene <b>únicamente</b> la cartera de '
                 u'<b>%s</b>: %d cuentas. Los datos incrustados, los totales, los '
                 u'indicadores y las gráficas se construyeron después de filtrar, '
                 u'así que no hay ninguna cuenta de otro asesor dentro del archivo '
                 u'ni forma de revelarla desde la pantalla.' % (filtro_asesor, asig))
                if filtro_asesor else
                (u'Consolidado para <b>Dirección</b>: contiene las %d cuentas vivas '
                 u'de las tres carteras de Customer Success. Ese alcance es el de la '
                 u'petición y el mismo que la aplicación concede al rol de '
                 u'administración, que tiene que poder mirar la cartera entera. Para '
                 u'reparto a asesores se genera un archivo por asesor con '
                 u'<code>--asesor</code>, ya filtrado en los datos.' % asig)})


# ── Autoprueba ─────────────────────────────────────────────────────────────
def autoprueba():
    fallos = []

    def ok(c, q, extra=u''):
        print(u'  %s  %s%s' % (u'ok  ' if c else u'FALLA', q,
                               u'   %s' % extra if extra else u''))
        if not c:
            fallos.append(q)

    print(u'\n  LIMITES DEL SEMAFORO — se prueban los BORDES, que es donde falla')
    for v, esp in [(110.0, 'sobre_critico'), (109.999, 'sobre'), (100.001, 'sobre'),
                   (100.0, 'limite'), (99.999, 'cerca'), (90.0, 'cerca'),
                   (89.999, 'rango'), (50.0, 'rango'), (49.999, 'subutil'),
                   (25.0, 'subutil'), (24.999, 'bajo_critico'), (0.0, 'bajo_critico')]:
        ok(clasifica(v) == esp, u'%.3f%% → %s' % (v, ETIQUETA[esp]),
           u'da %s' % ETIQUETA[clasifica(v)] if clasifica(v) != esp else u'')

    print(u'\n  100%% EXACTO: limite alcanzado y SIN excedente')
    ok(clasifica(100.0) == 'limite', u'100%% no es sobreconsumo')
    ok(max(0.0, 1000 - 1000) == 0, u'el excedente de un 100%% exacto es cero')
    ok(clasifica(100.0) not in ('sobre', 'sobre_critico'),
       u'un 100%% exacto no entra en los cubos de sobreconsumo')

    print(u'\n  CERO MEDIDO vs DATO AUSENTE')
    ok(clasifica(0.0) == 'bajo_critico', u'consumo 0 con base es 0%% y se clasifica')
    b, _o = base_minutos(u'Comunicación Empresarial 400 minutos', 400)
    ok(b == 400, u'un plan de bolsa declara su base', u'base=%s' % b)

    print(u'\n  PLAN SIN LIMITE VERIFICABLE: no admite porcentaje')
    for plan, incl in [(u'AV 1,000 min Agente Virtual', 1), (u'3 Agentes CP Chat', 1),
                       (u'VILLAUTOS ARAGON 2 números virtuales', 1)]:
        b, o = base_minutos(plan, incl)
        ok(b is None, u'«%s» → sin base, no se le calcula %%' % plan[:38], u'origen=%s' % o)
    b, o = base_minutos(u'13 Extensiones Ilimitadas', 1)
    ok((b, o) == (13 * MINUTOS_POR_EXTENSION, u'extensiones'),
       u'un plan por extensiones SI tiene limite, derivado del nombre', u'base=%s' % b)
    b, o = base_minutos(u'50 Extensiones Visibilidad y Control IP', 12500)
    ok((b, o) == (12500, u'bolsa'),
       u'y una bolsa real no se multiplica por %d' % MINUTOS_POR_EXTENSION, u'base=%s' % b)

    print(u'\n  DURACION DEL CICLO')
    ok(dias_periodo(u'2026-09-26 - 2026-10-25') == 30, u'un ciclo mensual mide 30 dias')
    ok(dias_periodo(u'2024-11-28 - 2026-03-19') == 477, u'el ciclo de 477 dias se mide')
    ok(not (DIAS_MIN <= 477 <= DIAS_MAX), u'477 dias NO es comparable')
    ok(not (DIAS_MIN <= 21 <= DIAS_MAX), u'21 dias NO es comparable')
    ok(DIAS_MIN <= 28 <= DIAS_MAX, u'28 dias SI es comparable')
    ok(dias_periodo(u'sin guion') is None, u'un periodo ilegible no finge una duracion')

    print(u'\n  CONTRASTE: se prueba que el detector sepa FALLAR')
    ok(contraste('#FFFFFF', '#000000') > 20, u'blanco sobre negro pasa')
    ok(contraste('#CCCCCC', '#FFFFFF') < 4.5, u'gris claro sobre blanco FALLA')
    P = paleta()
    ok(contraste(P['TX_ALTO'], '#FFFFFF') >= 4.5, u'la tinta alta de la paleta pasa',
       u'%.2f:1' % contraste(P['TX_ALTO'], '#FFFFFF'))

    print(u'\n  COHERENCIA DE LAS TABLAS DE NIVELES')
    ok(len({k for k, _e, _s, _a in NIVELES}) == len(NIVELES), u'sin claves repetidas')
    ok(len({s for _k, _e, s, _a in NIVELES}) == len(NIVELES), u'sin severidades repetidas')
    ok(set(ALERTA) | {'rango'} == {k for k, _e, _s, _a in NIVELES},
       u'ALERTA y «en rango» cubren todos los niveles, sin solaparse')
    ok(set(BAJO_USO) <= set(ALERTA), u'bajo uso es un subconjunto de alerta')

    print(u'\n  %s' % (u'TODO EN VERDE.' if not fallos
                       else u'*** %d FALLAS: %s' % (len(fallos), u' · '.join(fallos))))
    return 0 if not fallos else 1


def main():
    ap = argparse.ArgumentParser(add_help=True)
    ap.add_argument('--asesor', default=None)
    ap.add_argument('--salida', default=SALIDA_DEF)
    ap.add_argument('--autoprueba', action='store_true')
    a = ap.parse_args()
    if a.autoprueba:
        return autoprueba()

    generado = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    P = paleta()
    print(u'\n  CONSUMO VS PLAN CONTRATADO')
    print(u'  ' + u'=' * 72)
    d = construye(a.asesor)
    print(u'  corte      : %s (última fecha de corte %s)'
          % (d['ruta_corte'], d['corte_max']))
    print(u'  periodo    : %s a %s (%d ciclos en el archivo)'
          % (d['meses_todos'][0], d['meses_todos'][-1], len(d['meses_todos'])))
    print(u'  alcance    : %s' % (a.asesor or u'cartera completa (Dirección)'))
    print(u'  cobertura  : %d evaluables de %d asignadas (%.1f%%)'
          % (d['evaluables'], d['asignadas'],
             100.0 * d['evaluables'] / d['asignadas'] if d['asignadas'] else 0))
    print(u'  semáforo en el último cierre de cada cuenta:')
    for k, e, _s, _a in NIVELES + [('no_evaluable', ETIQUETA['no_evaluable'], 8, u'')]:
        n = d['cubos'].get(k, 0)
        if n:
            print(u'    %-24s %4d' % (e, n))
    print(u'    %-24s %4d  (cierra contra la cartera)' % (u'TOTAL', d['asignadas']))
    print(u'  duplicados : %d filas idénticas · %d pares en conflicto · %d cuenta-mes con dos ciclos'
          % (d['dup_identicos'], len(d['dup_conflicto']), d['dos_en_mes']))

    if not os.path.isdir(a.salida):
        os.makedirs(a.salida)
    nombre = 'consumo-vs-plan.html' if not a.asesor else (
        'consumo-vs-plan-%s.html'
        % re.sub(r'[^a-z0-9]+', '-', a.asesor.lower()
                 .replace(u'á', 'a').replace(u'é', 'e').replace(u'í', 'i')
                 .replace(u'ó', 'o').replace(u'ú', 'u').replace(u'ñ', 'n')).strip('-'))
    ruta = os.path.join(a.salida, nombre)
    doc = html(d, P, a.asesor, generado)
    with io.open(ruta, 'w', encoding='utf-8', newline='') as fh:
        fh.write(doc)
    print(u'\n  escrito: %s  (%s KB)' % (ruta, u'{:,.0f}'.format(len(doc.encode('utf-8')) / 1024.0)))
    print(u'  autocontenido: sin dependencias externas, abre con doble clic y sin conexión.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
