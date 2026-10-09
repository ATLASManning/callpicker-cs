# -*- coding: utf-8 -*-
"""Mide la DISPERSION de cada dimension antes de dibujar una sola grafica.

   POR QUE EXISTE
   --------------
   «Un indicador que nunca cambia entrena a no mirarlo.» Antes de elegir que
   ejes y que combos lleva el Dashboard hay que saber cuales de los candidatos
   se mueven de verdad sobre los datos reales. Una barra que siempre tiene el
   mismo alto, o un combo cuyas seis opciones devuelven el mismo reparto, no
   son informacion: son ruido con aspecto de tablero.

   Lee la MISMA API que servira la pantalla (`/api/alertas/veredictos`), no una
   replica: lo que mida aqui es lo que el usuario vera.

   Para cada dimension candidata informa:
     - cuantos valores distintos toma (una con 1 solo valor no sirve)
     - el reparto, con el bucket mas grande en porcentaje (si uno se lleva el
       95%, la grafica es una barra y cinco migajas)
     - cuantas cuentas NO tienen el dato (un hueco no es un cero)
     - para las numericas, min / p25 / mediana / p75 / max

   Las credenciales se leen de `.env.local` y NUNCA se imprimen.

   USO
   ---
       python scripts/mide-dimensiones-dashboard.py
       python scripts/mide-dimensiones-dashboard.py --guarda <ruta.json>
"""
import base64
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

BASE = 'https://callpicker-cs.vercel.app'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def token():
    """Una sesion de admin firmada con el secreto del proyecto.

       Se construye aqui y se usa aqui: el secreto no sale de esta funcion y no
       se imprime en ningun momento.
    """
    env = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if '=' in linea and not linea.startswith('#'):
                k, v = linea.split('=', 1)
                env[k.strip()] = v.strip().strip('"')
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    sec, now = env['JWT_SECRET'].encode(), int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(sec, (cab + '.' + cue).encode(), hashlib.sha256).digest())


def trae():
    r = urllib.request.Request(BASE + '/api/alertas/veredictos')
    r.add_header('Cookie', 'cp_session=' + token())
    r.add_header('Cache-Control', 'no-cache')
    with urllib.request.urlopen(r, timeout=300) as x:
        return json.loads(x.read().decode())


# ── las dimensiones candidatas ────────────────────────────────────────────
# (etiqueta, como se saca de una fila, 'cat' categorica | 'num' numerica)
def g(fila, *ruta):
    o = fila
    for k in ruta:
        if o is None:
            return None
        o = o.get(k)
    return o


CATEGORICAS = [
    ('situacion',        lambda r: g(r, 'veredicto', 'situacion')),
    ('luz',              lambda r: g(r, 'veredicto', 'luz')),
    ('dueno',            lambda r: g(r, 'veredicto', 'dueno')),
    ('asesor',           lambda r: r.get('asesor')),
    ('esTop',            lambda r: r.get('esTop')),
    ('tieneAuditoria',   lambda r: g(r, 'datos', 'tieneAuditoria')),
    ('plan',             lambda r: g(r, 'datos', 'plan')),
    ('candidatura',      lambda r: g(r, 'datos', 'candidatura')),
    ('relacionNivel',    lambda r: g(r, 'datos', 'relacionNivel')),
    ('tiene CID',        lambda r: r.get('cid') is not None and str(r.get('cid')).strip() != ''),
]

NUMERICAS = [
    ('mrr',                 lambda r: r.get('mrr')),
    ('fuentes (0-8)',       lambda r: g(r, 'datos', 'fuentes')),
    ('consumoPct',          lambda r: g(r, 'datos', 'consumoPct')),
    ('diasSinContacto',     lambda r: g(r, 'datos', 'diasSinContacto')),
    ('entrantes',           lambda r: g(r, 'datos', 'entrantes')),
    ('perdidas',            lambda r: g(r, 'datos', 'perdidas')),
    ('pctPerdidas',         lambda r: g(r, 'datos', 'pctPerdidas')),
    ('tickets',             lambda r: g(r, 'datos', 'tickets')),
    ('fallas',              lambda r: g(r, 'datos', 'fallas')),
    ('reuniones',           lambda r: g(r, 'datos', 'reuniones')),
    ('contactos',           lambda r: g(r, 'datos', 'contactos')),
    ('actividadesCerradas', lambda r: g(r, 'datos', 'actividadesCerradas')),
    ('relacionPct',         lambda r: g(r, 'datos', 'relacionPct')),
    ('candidaturasTotal',   lambda r: g(r, 'datos', 'candidaturasTotal')),
    ('n hallazgos',         lambda r: len(g(r, 'veredicto', 'hallazgos') or [])),
]


def pct(n, d):
    return 0.0 if not d else 100.0 * n / d


def cuantil(xs, q):
    if not xs:
        return None
    s = sorted(xs)
    i = (len(s) - 1) * q
    lo, hi = int(i), min(int(i) + 1, len(s) - 1)
    return s[lo] + (s[hi] - s[lo]) * (i - lo)


def main():
    d = trae()
    rows = d.get('rows') or []
    n = len(rows)
    print(u'  VERSION de la API   %s' % d.get('version'))
    print(u'  cuentas             %d' % n)
    if d.get('falla'):
        print(u'  FALLA DECLARADA     %s' % str(d['falla'])[:150])
    print()
    if not n:
        print(u'  sin filas: no se puede medir nada.')
        return 1

    print(u'  ' + u'=' * 86)
    print(u'  CATEGORICAS — cuantos valores distintos, y si uno se lo lleva todo')
    print(u'  ' + u'=' * 86)
    for etq, f in CATEGORICAS:
        vals = [f(r) for r in rows]
        huecos = sum(1 for v in vals if v is None)
        presentes = [v for v in vals if v is not None]
        cuenta = {}
        for v in presentes:
            k = str(v)
            cuenta[k] = cuenta.get(k, 0) + 1
        orden = sorted(cuenta.items(), key=lambda kv: -kv[1])
        mayor = pct(orden[0][1], n) if orden else 0.0
        veredicto = (u'INUTIL (un solo valor)' if len(orden) <= 1
                     else u'POBRE (%.0f%% en uno)' % mayor if mayor >= 90
                     else u'sirve')
        print(u'\n  %-16s %2d valor(es) · %d sin dato (%.0f%%) · %s'
              % (etq, len(orden), huecos, pct(huecos, n), veredicto))
        for k, c in orden[:8]:
            print(u'        %-34s %4d  %5.1f%%' % (k[:34], c, pct(c, n)))
        if len(orden) > 8:
            resto = sum(c for _, c in orden[8:])
            print(u'        %-34s %4d  %5.1f%%  (otros %d valores)'
                  % (u'…', resto, pct(resto, n), len(orden) - 8))

    print()
    print(u'  ' + u'=' * 86)
    print(u'  NUMERICAS — min / p25 / mediana / p75 / max, y cuantas sin dato')
    print(u'  ' + u'=' * 86)
    print(u'  %-22s %6s %9s %9s %9s %9s %9s'
          % (u'dimension', u'sinDato', u'min', u'p25', u'mediana', u'p75', u'max'))
    for etq, f in NUMERICAS:
        vals = [f(r) for r in rows]
        xs = [float(v) for v in vals if isinstance(v, (int, float))]
        huecos = n - len(xs)
        if not xs:
            print(u'  %-22s %5d   — sin un solo dato —' % (etq, huecos))
            continue
        fila = (etq, huecos, min(xs), cuantil(xs, .25), cuantil(xs, .5),
                cuantil(xs, .75), max(xs))
        plano = len(set(xs)) <= 1
        print(u'  %-22s %5d %9.1f %9.1f %9.1f %9.1f %9.1f%s'
              % (fila[0], fila[1], fila[2], fila[3], fila[4], fila[5], fila[6],
                 u'   *** PLANO' if plano else u''))

    # ── los cruces que de verdad interesan para las dos graficas pedidas ───
    print()
    print(u'  ' + u'=' * 86)
    print(u'  LAS DOS GRAFICAS QUE PIDIO DIRECCION')
    print(u'  ' + u'=' * 86)

    print(u'\n  1 · COMPLETITUD: reparto por numero de fuentes con dato (0-8)')
    rep = {}
    mrr_por = {}
    for r in rows:
        k = g(r, 'datos', 'fuentes')
        k = -1 if k is None else int(k)
        rep[k] = rep.get(k, 0) + 1
        m = r.get('mrr')
        mrr_por[k] = mrr_por.get(k, 0.0) + (float(m) if isinstance(m, (int, float)) else 0.0)
    for k in sorted(rep):
        barra = u'#' * int(round(40.0 * rep[k] / n))
        print(u'      %d/8  %4d cuentas  %5.1f%%  $%12s  %s'
              % (k, rep[k], pct(rep[k], n), format(int(mrr_por[k]), ',d'), barra))

    print(u'\n  2 · RIESGO: reparto por situacion, con su dinero')
    ps = d.get('porSituacion') or {}
    cat = d.get('catalogo') or {}
    for k in sorted(ps, key=lambda x: (cat.get(x) or {}).get('orden', 99)):
        e = ps[k]
        print(u'      %-20s %4d cuentas  $%12s  %d sin importe'
              % ((cat.get(k) or {}).get('titulo', k)[:20], e['cuentas'],
                 format(int(e['mrr']), ',d'), e['sinImporte']))

    print(u'\n  3 · CRUCE situacion x asesor (el combo que mas se va a usar)')
    ases = sorted({r.get('asesor') or 'sin asesor' for r in rows})
    sits = sorted({g(r, 'veredicto', 'situacion') for r in rows},
                  key=lambda x: (cat.get(x) or {}).get('orden', 99))
    print(u'      %-20s %s' % (u'', u' '.join(u'%10s' % a[:10] for a in ases)))
    for s in sits:
        fila = [sum(1 for r in rows
                    if g(r, 'veredicto', 'situacion') == s
                    and (r.get('asesor') or 'sin asesor') == a) for a in ases]
        print(u'      %-20s %s' % ((cat.get(s) or {}).get('titulo', s)[:20],
                                   u' '.join(u'%10d' % v for v in fila)))

    print(u'\n  4 · CLASES DE HALLAZGO (riesgo / entrega / analisis)')
    clases = {}
    for r in rows:
        for h in (g(r, 'veredicto', 'hallazgos') or []):
            k = h.get('clase') or 'sin clase'
            clases[k] = clases.get(k, 0) + 1
    tot = sum(clases.values())
    for k, c in sorted(clases.items(), key=lambda kv: -kv[1]):
        print(u'      %-12s %4d hallazgos  %5.1f%%' % (k, c, pct(c, tot)))
    print(u'      %-12s %4d en total, %.1f por cuenta' % (u'TOTAL', tot, tot / float(n)))

    print(u'\n  5 · TITULOS DE HALLAZGO — el eje de «que trabajo tengo encima»')
    titulos = {}
    for r in rows:
        for h in (g(r, 'veredicto', 'hallazgos') or []):
            t = h.get('titulo') or u'sin titulo'
            titulos[t] = titulos.get(t, 0) + 1
    print(u'      %d titulos distintos sobre %d hallazgos' % (len(titulos), tot))
    for t, c in sorted(titulos.items(), key=lambda kv: -kv[1]):
        print(u'      %4d  %5.1f%% de cuentas   %s' % (c, pct(c, n), t[:60]))

    # ── EL INVARIANTE: un hecho se dice UNA vez ──────────────────────────
    #
    # El 8 oct 2026 habia dos pares de titulos que median lo mismo por dos
    # caminos: 142 fichas afirmandolo dos veces, y dos barras gemelas en
    # cualquier grafica que agregue por hallazgo. Se arreglo en
    # `hallazgosDe` con el mapa GEMELA. Esto comprueba que no vuelve.
    #
    # Se comprueba por SOLAPE medido y no por la lista de pares conocidos:
    # un par nuevo que alguien introduzca manana tiene que saltar aqui sin
    # que nadie lo anada a mano.
    print(u'\n  6 · INVARIANTE — ningun hecho contado dos veces')
    porc = []
    for r in rows:
        porc.append({h.get('titulo') for h in (g(r, 'veredicto', 'hallazgos') or [])})
    lista = sorted(titulos, key=lambda t: -titulos[t])
    sospechas = []
    for i, a in enumerate(lista):
        for b in lista[i + 1:]:
            juntos = sum(1 for s in porc if a in s and b in s)
            if not juntos:
                continue
            # Uno contenido en el otro: el pequeno no aporta ni una cuenta
            # que el grande no tenga ya. Eso es una gemela, no un cruce.
            menor = min(titulos[a], titulos[b])
            if juntos == menor and menor >= 5:
                sospechas.append((a, b, juntos, titulos[a], titulos[b]))
    if not sospechas:
        print(u'      ok   ningun titulo esta contenido por completo en otro.')
    else:
        print(u'      *** %d par(es) en que uno es subconjunto del otro:' % len(sospechas))
        for a, b, j, ca, cb in sospechas:
            print(u'          «%s» (%d) ⊂ «%s» (%d), juntos %d' % (a[:34], ca, b[:34], cb, j))
        print(u'      Si son la misma medida por dos caminos, va al mapa GEMELA')
        print(u'      de `hallazgosDe` en lib/alertas-veredicto.ts.')

    if '--guarda' in sys.argv:
        ruta = sys.argv[sys.argv.index('--guarda') + 1]
        with io.open(ruta, 'w', encoding='utf-8') as f:
            f.write(json.dumps(d, ensure_ascii=False))
        print(u'\n  datos crudos en %s' % ruta)
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except urllib.error.HTTPError as e:
        print(u'  la API respondio %s — no se midio nada.' % e.code)
        sys.exit(1)
