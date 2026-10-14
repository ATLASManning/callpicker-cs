# -*- coding: utf-8 -*-
u"""MIDE EL PESO DE UNA CUENTA EN LA CARTERA, replicando `importeDeCuenta()`.

Nace de un error de la auditoria de Torres Corzo: publicaba «el 23.3% de la
cartera activa» usando como numerador los $316,541 de `cuentas.facturacion`
—el promedio de vida que esa misma auditoria declara equivocado— mientras el
texto de al lado decia que el MRR bueno son $272,436. El porcentaje salia de la
cifra mala y nadie lo noto porque las dos cifras conviven en el archivo.

La regla que se replica es la de lib/facturacion-cuenta.ts:

    GRC por CID si la suma de `mrrFin` es > 0  ->  si no, `cuentas.facturacion`
    ->  si no, `sin_dato` (que NO es cero: ver [[feedback-cero-sin-medicion]])

Y «cartera viva» es `estado in ('activo','en_riesgo')`, igual que
`topDeCartera`. Las cuentas `sin_dato` se CUENTAN aparte y nunca se suman como
cero.

Uso:
    python scripts/mide-peso-cartera.py                 # la cartera entera
    python scripts/mide-peso-cartera.py 130723          # ... y el peso del CID
    python scripts/mide-peso-cartera.py 130723 272436   # ... con numerador fijo

El tercer argumento existe para las cuentas cuyo importe real NO esta en
ninguna de las dos fuentes automaticas, que es el caso de Torres Corzo: sus 19
lineas del GRC no traen CID, asi que el cruce cae a la ficha y la ficha trae el
promedio de vida. Cuando se pasa, el numerador se sustituye Y el denominador se
recalcula con el, porque la cuenta tambien esta dentro del total.
"""
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VIVOS = ('activo', 'en_riesgo')


def entorno():
    d = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as fh:
        for ln in fh:
            ln = ln.strip()
            if not ln or ln.startswith('#') or '=' not in ln:
                continue
            k, v = ln.split('=', 1)
            d[k.strip()] = v.strip().strip('"').strip("'")
    return d


def supabase(tabla, params):
    """Pagina de 1000 en 1000: con `limit` implicito se pierden filas en silencio."""
    E = entorno()
    url = E['NEXT_PUBLIC_SUPABASE_URL'].rstrip('/') + '/rest/v1/' + tabla
    key = E.get('SUPABASE_SERVICE_ROLE_KEY') or E['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    out = []
    desde = 0
    while True:
        q = dict(params)
        q['offset'] = str(desde)
        q['limit'] = '1000'
        pide = urllib.request.Request(
            url + '?' + '&'.join('%s=%s' % (k, v) for k, v in q.items()),
            headers={'apikey': key, 'Authorization': 'Bearer ' + key,
                     'Accept': 'application/json'})
        try:
            crudo = urllib.request.urlopen(pide, timeout=60).read().decode('utf-8')
        except urllib.error.HTTPError as e:
            # Un 400 sin cuerpo no dice que columna falta y manda a adivinar.
            sys.stderr.write('HTTP %s en %s\n  %s\n'
                             % (e.code, tabla, e.read().decode('utf-8', 'replace')[:400]))
            raise
        lote = json.loads(crudo)
        out.extend(lote)
        if len(lote) < 1000:
            return out
        desde += 1000


def mrr_institucional(f):
    """EL MRR INSTITUCIONAL DE UNA LINEA DEL GRC. Instruccion de direccion:
    «lo que debes tomar como institucional financiero es el MRR de Gross
    Revenue Facturacion».

    `mrrFin` es el recurrente al cierre del periodo, y es el que contesta. Pero
    una linea marcada churn trae `mrrFin` = 0, y de las 1,492 marcadas en el
    corte vigente 1,023 estan DESMENTIDAS: su `verificacion` dice `sigue_viva`
    porque su acumulado siguio creciendo o porque la cartera la tiene activa.
    Para esas, el recurrente vigente es `mrrIni` — el mismo criterio con el que
    se fijo el MRR de GTC ($272,436, el `mrrFin` del respaldo del 2 oct y el
    `mrrIni` del corte del 11).

    Un churn CONFIRMADO (`baja`) si vale cero: dejo de facturar.
    """
    fin = float(f.get('mrrFin') or 0)
    if fin > 0:
        return fin, 'mrrFin'
    if f.get('verificacion') == 'sigue_viva':
        ini = float(f.get('mrrIni') or 0)
        if ini > 0:
            return ini, 'mrrIni_desmentido'
    return 0.0, 'cero'


def mapa_grc():
    """porCid -> suma del MRR institucional de sus filas."""
    p = os.path.join(RAIZ, 'data', 'grc-zoho.json')
    J = json.loads(io.open(p, encoding='utf-8').read())
    m = {}
    for f in J.get('filas', []):
        cid = f.get('cid')
        if cid is None:
            continue
        cid = str(cid).strip()
        if not cid:
            continue
        v, como = mrr_institucional(f)
        r = m.setdefault(cid, {'mrr': 0.0, 'filas': 0, 'desmentidas': 0})
        r['mrr'] += v
        r['filas'] += 1
        if como == 'mrrIni_desmentido':
            r['desmentidas'] += 1
    return m, (J.get('meta') or {}).get('mesVivo', '?')


def importe(c, m):
    """Devuelve (valor, origen). TRES origenes, y solo uno es institucional:

      `grc`        el MRR de Gross Revenue Facturacion. ES el institucional.
      `solo_ficha` la cuenta no cruza por CID con el GRC, asi que lo unico que
                   hay es `cuentas.facturacion`, que guarda `acumulado / meses`
                   — el PROMEDIO DE VIDA. No es el MRR y no se mezcla con el.
      `sin_dato`   ni una cosa ni la otra. Nunca se suma como cero.
    """
    cid = c.get('cid')
    cid = None if cid is None else str(cid).strip()
    g = m.get(cid) if cid else None
    if g and g['mrr'] > 0:
        return g['mrr'], 'grc'
    propio = float(c.get('facturacion') or 0)
    if propio > 0:
        return propio, 'solo_ficha'
    return 0.0, 'sin_dato'


def main():
    cid_obj = sys.argv[1].strip() if len(sys.argv) > 1 else None
    forzado = float(sys.argv[2]) if len(sys.argv) > 2 else None

    m, mes = mapa_grc()
    cuentas = supabase('cuentas', {'select': 'consecutivo,empresa,cid,facturacion,estado'})
    print(u'  GRC mesVivo=%s · %d CIDs · cuentas leidas: %d' % (mes, len(m), len(cuentas)))

    estados = sorted({str(c.get('estado')) for c in cuentas})
    grupos = {u'viva (activo + en_riesgo)': [c for c in cuentas if c.get('estado') in VIVOS],
              u'todos los estados': cuentas}
    for e in estados:
        grupos[u'solo estado=%s' % e] = [c for c in cuentas if str(c.get('estado')) == e]

    res = {}
    for etq, lote in grupos.items():
        inst = ficha = 0.0
        n_inst = n_ficha = n_sin = 0
        for c in lote:
            v, o = importe(c, m)
            if forzado is not None and cid_obj and str(c.get('cid') or '').strip() == cid_obj:
                v, o = forzado, 'grc'
            if o == 'sin_dato':
                n_sin += 1
            elif o == 'grc':
                n_inst += 1
                inst += v
            else:
                n_ficha += 1
                ficha += v
        res[etq] = (inst, inst + ficha)
        print(u'\n  %s' % etq)
        print(u'    cuentas                      %d' % len(lote))
        print(u'    con MRR del GRC              %d · $%s   <<< INSTITUCIONAL'
              % (n_inst, '{:,.0f}'.format(inst)))
        print(u'    solo ficha (promedio vida)   %d · $%s   — no es MRR'
              % (n_ficha, '{:,.0f}'.format(ficha)))
        print(u'    SIN DATO                     %d          — no se suman como cero' % n_sin)
        print(u'    mezcla que publica el tablero   $%s' % '{:,.0f}'.format(inst + ficha))

    if not cid_obj:
        return 0

    fila = [c for c in cuentas if str(c.get('cid') or '').strip() == cid_obj]
    if not fila:
        print(u'\n  *** el CID %s no esta en `cuentas`' % cid_obj)
        return 2
    c = fila[0]
    v, o = importe(c, m)
    print(u'\n  CID %s · %s · %s · estado %s'
          % (cid_obj, c.get('consecutivo'), c.get('nombre'), c.get('estado')))
    print(u'    importe que calcula el tablero  $%s  (origen %s)'
          % ('{:,.0f}'.format(v), o))
    if forzado is not None:
        print(u'    numerador forzado               $%s' % '{:,.0f}'.format(forzado))
        v = forzado
    for etq, (inst, mezcla) in res.items():
        if inst <= 0:
            # Un grupo sin MRR del GRC no tiene denominador institucional: se
            # dice, no se rellena con la mezcla.
            print(u'    peso sobre %-26s SIN BASE — ninguna de sus cuentas '
                  u'cruza por CID con el GRC' % etq)
            continue
        print(u'    peso sobre %-26s %6.2f%% del MRR institucional ($%s)'
              % (etq, 100.0 * v / inst, '{:,.0f}'.format(inst)))
        print(u'    %-37s %6.2f%% de la mezcla del tablero ($%s)'
              % ('', 100.0 * v / mezcla, '{:,.0f}'.format(mezcla)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
