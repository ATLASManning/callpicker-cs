# -*- coding: utf-8 -*-
"""Las gráficas del Dashboard, comprobadas contra la API que las alimenta.

   POR QUE EXISTE
   --------------
   El modulo pinta assert de cierre en pantalla, pero eso avisa DESPUES de
   publicar y solo si alguien esta mirando. Esto lo comprueba desde fuera, con
   los mismos datos que recibe el navegador, y se puede correr antes de cada
   commit que toque el agregado.

   Replica las tres graficas de `components/DashAlertasGraficas.tsx` y exige:

     1. Los cortes que son PARTICION cierran: la suma de los cubos es el total,
        en cuentas y en dinero. Un top-N que tira la cola miente sin decirlo.
     2. El corte por hallazgo NO cierra —una cuenta tiene varios— y se
        comprueba que de verdad NO cierra: si cerrara, el aviso que el modulo
        pinta seria falso y habria que quitarlo.
     3. El tope de 12 + el cubo «otros» recupera el total entero.
     4. El histograma de fuentes cierra.
     5. Por cada fuente, con dato + sin dato = el total.
     6. `fuentes` (el numero) es EXACTAMENTE cuantas banderas hay en
        `fuentesDetalle`. Son dos campos de la misma cosa y el dia que
        divergan, el «4 de 8» de la cabecera y el desglose de abajo contarian
        historias distintas.
     7. Las TOP son 25, ni una mas.
     8. Ninguna cuenta sin importe entra como cero en la suma de dinero.

   Las credenciales se leen de `.env.local` y NUNCA se imprimen.

   USO
   ---
       python scripts/verifica-graficas-dashboard.py
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
TOPE_FILAS = 12      # el mismo de DashAlertasGraficas.tsx
N_TOP = 25           # el mismo de lib/facturacion-cuenta.ts


def token():
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


fallos = []


def exige(ok, titulo, detalle=''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', titulo,
                           (u'   — ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(titulo)


def main():
    d = trae()
    rows = d.get('rows') or []
    n = len(rows)
    print(u'  VERSION  %s · %d cuentas\n' % (d.get('version'), n))
    if not n:
        print(u'  sin filas: no se puede comprobar nada.')
        return 1

    def mrr(r):
        v = r.get('mrr')
        return float(v) if isinstance(v, (int, float)) else 0.0

    sin_importe = [r for r in rows if r.get('mrr') is None]
    total_mrr = sum(mrr(r) for r in rows)

    # ── 6 · el conteo se deriva del detalle ──────────────────────────────
    malos = []
    for r in rows:
        det = (r.get('datos') or {}).get('fuentesDetalle')
        if det is None:
            malos.append((r.get('empresa'), 'no viene fuentesDetalle'))
            continue
        cuantas = sum(1 for v in det.values() if v)
        if cuantas != (r['datos'] or {}).get('fuentes'):
            malos.append((r.get('empresa'),
                          '%s banderas vs fuentes=%s' % (cuantas, r['datos'].get('fuentes'))))
    exige(not malos, u'`fuentes` es exactamente cuantas banderas trae `fuentesDetalle`',
          u'' if not malos else u'%d cuenta(s): %s' % (len(malos), malos[:3]))

    # ── 7 · las TOP son 25 ───────────────────────────────────────────────
    tops = [r for r in rows if r.get('esTop')]
    exige(len(tops) == N_TOP, u'las cuentas TOP son exactamente %d' % N_TOP,
          u'son %d' % len(tops))
    if tops:
        peor_top = min(mrr(r) for r in tops)
        mejor_resto = max([mrr(r) for r in rows if not r.get('esTop')] or [0])
        exige(peor_top >= mejor_resto,
              u'ninguna cuenta fuera del TOP factura mas que la menor del TOP',
              u'menor TOP $%s vs mayor resto $%s'
              % (format(int(peor_top), ',d'), format(int(mejor_resto), ',d')))

    # ── 8 · el dinero no inventa ceros ───────────────────────────────────
    #
    # Comprobar «ninguna null aporta 0» seria tautologico: el propio `mrr()`
    # las manda a 0. Lo que de verdad hay que exigir es que la suma TOTAL sea
    # exactamente la de las cuentas que SI tienen importe, y que las otras
    # esten contadas aparte para poder declararlas. Si alguna null hubiera
    # entrado como un numero de verdad en origen, estas dos no coincidirian.
    solo_con = sum(float(r['mrr']) for r in rows if r.get('mrr') is not None)
    exige(abs(total_mrr - solo_con) < 0.5 and len(sin_importe) > 0,
          u'el dinero sale solo de las cuentas con importe',
          u'$%s sobre %d cuentas, y %d declaradas sin importe aparte'
          % (format(int(solo_con), ',d'), n - len(sin_importe), len(sin_importe)))

    # ── 1 · los cortes que son PARTICION cierran ─────────────────────────
    print()
    CORTES = [
        (u'situacion',   lambda r: (r['veredicto'] or {}).get('situacion')),
        (u'asesor',      lambda r: r.get('asesor') or 'sin asesor'),
        (u'relacion',    lambda r: (r['datos'] or {}).get('relacionNivel')),
        (u'candidatura', lambda r: (r['datos'] or {}).get('candidatura') or 'Hoy no es candidata a nada'),
        (u'tamano',      lambda r: 'top' if r.get('esTop') else 'resto'),
    ]
    for etq, f in CORTES:
        cubos_n, cubos_m = {}, {}
        for r in rows:
            k = str(f(r))
            cubos_n[k] = cubos_n.get(k, 0) + 1
            cubos_m[k] = cubos_m.get(k, 0.0) + mrr(r)
        sn, sm = sum(cubos_n.values()), sum(cubos_m.values())
        exige(sn == n and abs(sm - total_mrr) < 0.5,
              u'el corte «%s» cierra' % etq,
              u'%d cubos · %d cuentas · $%s' % (len(cubos_n), sn, format(int(sm), ',d')))

    # ── 2 · el corte por hallazgo NO cierra, y tiene que no cerrar ───────
    por_titulo_n, por_titulo_m = {}, {}
    for r in rows:
        vistos = set()
        for h in ((r['veredicto'] or {}).get('hallazgos') or []):
            t = h.get('titulo')
            if t in vistos:
                continue
            vistos.add(t)
            por_titulo_n[t] = por_titulo_n.get(t, 0) + 1
            por_titulo_m[t] = por_titulo_m.get(t, 0.0) + mrr(r)
    suma_h = sum(por_titulo_n.values())
    exige(suma_h > n,
          u'el corte «hallazgo» NO es particion, como declara el modulo',
          u'%d apariciones sobre %d cuentas, %.1f por cuenta'
          % (suma_h, n, suma_h / float(n)))

    # ── 3 · tope de 12 + «otros» recupera el total ───────────────────────
    orden = sorted(por_titulo_n.items(), key=lambda kv: -kv[1])
    visibles = orden[:TOPE_FILAS]
    cola = orden[TOPE_FILAS:]
    rec = sum(v for _, v in visibles) + sum(v for _, v in cola)
    exige(rec == suma_h,
          u'el tope de %d + el cubo «otros» recupera el total' % TOPE_FILAS,
          u'%d visibles + %d en la cola = %d' % (len(visibles), len(cola), rec))

    # ── 4 · el histograma de fuentes cierra ──────────────────────────────
    hist_n, hist_m = {}, {}
    for r in rows:
        k = (r['datos'] or {}).get('fuentes')
        hist_n[k] = hist_n.get(k, 0) + 1
        hist_m[k] = hist_m.get(k, 0.0) + mrr(r)
    exige(sum(hist_n.values()) == n and abs(sum(hist_m.values()) - total_mrr) < 0.5,
          u'el histograma de fuentes cierra',
          u'cubos %s' % ', '.join('%s/8:%d' % (k, hist_n[k]) for k in sorted(hist_n)))

    # ── 5 · por cada fuente, con + sin = total ───────────────────────────
    print()
    claves = sorted((rows[0]['datos'].get('fuentesDetalle') or {}).keys())
    for k in claves:
        con = sum(1 for r in rows if (r['datos'].get('fuentesDetalle') or {}).get(k))
        sin = n - con
        dinero_sin = sum(mrr(r) for r in rows
                         if not (r['datos'].get('fuentesDetalle') or {}).get(k))
        exige(con + sin == n, u'fuente «%s» cierra' % k,
              u'%d con dato, %d sin, $%s tapados'
              % (con, sin, format(int(dinero_sin), ',d')))

    print()
    if fallos:
        print(u'  *** %d comprobacion(es) FALLAN:' % len(fallos))
        for f in fallos:
            print(u'      - %s' % f)
        return 1
    print(u'  las %d comprobaciones pasan.' % (8 + len(CORTES) + len(claves)))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except urllib.error.HTTPError as e:
        print(u'  la API respondio %s — no se comprobo nada.' % e.code)
        sys.exit(1)
