# -*- coding: utf-8 -*-
u"""¿DISPARAN DE VERDAD las dos alarmas de atencion telefonica?

   POR QUE EXISTE
   --------------
   `scripts/mide-fuentes-sin-alerta.py` PREDIJO, sobre los datos crudos, que
   la tasa >= 40% encenderia 17 cuentas y el volumen >= 10,000 otras 9. Eso es
   una prediccion, no un hecho: lo mide Python sobre el JSON, y quien tiene que
   producirlas es el motor en TypeScript. `tsc` en cero no prueba que dispare.

   Este guion pide las alertas al motor REAL y comprueba la prediccion. Es el
   mismo patron de `mide-alarmas-sac.py --vivo`, que es como se comprobaron las
   alarmas de mesa el 9 oct.

   LO QUE NO SE PUEDE CONFUNDIR
   ----------------------------
   Si no aparece ninguna de las dos, hay DOS explicaciones y son opuestas: que
   el deploy no haya entrado todavia, o que la logica no dispare. Concluir lo
   segundo cuando es lo primero manda a reescribir codigo que esta bien.

   Asi que se discrimina: se pide la ficha de una cuenta y se busca el ancla
   `id="llamadas"`, que SOLO existe en el commit que trae estas alarmas. Si el
   ancla esta, el deploy entro y el silencio es de la logica.

   Credenciales de `.env.local`, y NO se imprimen.

   USO
   ---
       python scripts/verifica-alertas-atencion.py
       python scripts/verifica-alertas-atencion.py http://localhost:3000
"""
import base64
import collections
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
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BASE = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'https://callpicker-cs.vercel.app'

#: Lo que predijo el medidor. Si el motor da otra cosa, una de las dos miente y
#: hay que mirar cual — no ajustar el numero para que cuadre.
ESPERADO = {'llamadas_sin_contestar': 17, 'llamadas_perdidas_masivas': 9}


def entorno():
    d = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as fh:
        for ln in fh:
            ln = ln.strip()
            if ln and not ln.startswith('#') and '=' in ln:
                k, v = ln.split('=', 1)
                d[k.strip()] = v.strip().strip('"').strip("'")
    return d


def b64(b):
    return base64.urlsafe_b64encode(b).decode().rstrip('=')


def cookie(E):
    """Una sesion de admin, firmada con el mismo secreto que el middleware."""
    sec, now = E['JWT_SECRET'].encode(), int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM',
                          'rol': 'admin', 'asesor_nombre': None,
                          'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return 'cp_session=' + cab + '.' + cue + '.' + b64(
        hmac.new(sec, (cab + '.' + cue).encode(), hashlib.sha256).digest())


def pide(url, gal, texto=False):
    req = urllib.request.Request(url)
    req.add_header('Cookie', gal)
    req.add_header('Cache-Control', 'no-cache')
    with urllib.request.urlopen(req, timeout=300) as x:
        crudo = x.read().decode('utf-8', 'replace')
    return crudo if texto else json.loads(crudo)


fallos = []


def exige(ok, que, detalle=''):
    print(u'  %s  %s%s' % (u'ok  ' if ok else u'FALLA', que,
                           (u'\n          ' + detalle) if detalle else u''))
    if not ok:
        fallos.append(que)


def main():
    E = entorno()
    gal = cookie(E)
    print(u'\n  ATENCION TELEFONICA — ¿disparan las dos alarmas?')
    print(u'  ' + u'=' * 72)
    print(u'  motor: %s\n' % BASE)

    try:
        viva = pide(BASE + '/api/alertas?limite=2000', gal)
    except urllib.error.HTTPError as e:
        print(u'  la API respondio %s — no se comprobo NADA.' % e.code)
        sys.exit(2)

    alertas = viva.get('alertas') or viva.get('rows') or []
    porTipo = collections.Counter(a.get('tipo') for a in alertas)
    print(u'  %d alertas servidas, %d tipos distintos\n' % (len(alertas), len(porTipo)))

    nuevas = sum(porTipo.get(t, 0) for t in ESPERADO)
    if nuevas == 0:
        # ── EL DISCRIMINADOR ────────────────────────────────────────────────
        # Sin esto, «cero alertas nuevas» se lee como «la logica no dispara»
        # cuando puede ser que el deploy no haya entrado. Son opuestos.
        print(u'  Ninguna de las dos aparece. ¿Es el deploy o es la logica?')
        cta = next((a.get('cuentaId') for a in alertas if a.get('cuentaId')), None)
        if cta:
            try:
                html = pide(BASE + '/cuentas/' + cta, gal, texto=True)
                hay = 'id="llamadas"' in html
                print(u'  el ancla `id="llamadas"` de la ficha: %s'
                      % (u'SI esta -> el deploy entro, el silencio es de la logica'
                         if hay else
                         u'NO esta -> el deploy AUN NO entro; repetir en unos minutos'))
                if not hay:
                    print(u'\n  No se concluye nada sobre las alarmas.')
                    sys.exit(2)
            except Exception as e:
                print(u'  no pude leer la ficha para discriminar: %s' % e)
                sys.exit(2)

    print(u'  %-28s %8s %8s' % (u'tipo', u'motor', u'medidor'))
    print(u'  ' + u'-' * 50)
    for t, esp in sorted(ESPERADO.items()):
        n = porTipo.get(t, 0)
        print(u'  %-28s %8d %8d' % (t, n, esp))
        exige(n == esp, u'%s da las %d cuentas que predijo el medidor' % (t, esp),
              u'' if n == esp else u'el motor da %d. Una de las dos lecturas esta mal.' % n)

    # Una alerta sin su cifra no se puede defender ni frente al cliente ni
    # frente al equipo: es lo que convirtio 383 acciones en texto que nadie
    # siguio. Se exige que TODA evidencia traiga digitos.
    delas = [a for a in alertas if a.get('tipo') in ESPERADO]
    sin_cifra = [a for a in delas if not any(c.isdigit() for c in (a.get('evidencia') or ''))]
    exige(not sin_cifra, u'todas las evidencias traen cifras',
          u', '.join(a.get('empresa', '?') for a in sin_cifra[:4]))

    # El enlace tiene que caer en el panel de llamadas, no en lo alto de la
    # ficha: el ancla se anadio en el mismo commit justo para esto.
    sin_ancla = [a for a in delas if not str(a.get('enlace') or '').endswith('#llamadas')]
    exige(not sin_ancla, u'el enlace lleva al panel de llamadas (#llamadas)',
          u', '.join(str(a.get('enlace')) for a in sin_ancla[:3]))

    # Y son EXCLUYENTES: una cuenta no puede traer las dos.
    porCuenta = collections.Counter(a.get('cuentaId') for a in delas)
    dobles = [c for c, n in porCuenta.items() if n > 1]
    exige(not dobles, u'ninguna cuenta enciende las dos a la vez',
          u'%d cuenta(s) con ambas' % len(dobles))

    # ── EL EPISODIO ────────────────────────────────────────────────────────
    # Ahora que el CHECK admite `atencion`, estas alertas DEBEN envejecer. Pero
    # el que escribe episodios es el cron diario: recien corrida la migracion,
    # lo normal es que todavia no los haya sellado. Se informa, no se falla.
    con_edad = [a for a in delas if a.get('diasAbierta') is not None]
    print(u'')
    print(u'  episodio abierto (antiguedad medida): %d de %d'
          % (len(con_edad), len(delas)))
    if len(delas) and not con_edad:
        print(u'      Normal si el cron diario no ha corrido desde la migracion.')
        print(u'      Forzarlo: /api/cron/diario?manual=1')

    # ── EL DINERO, CON SU ORIGEN DICHO ─────────────────────────────────────
    #
    # `a.mrr` es lo que usa el tablero para ordenar, y es una cifra MIXTA por
    # diseño: `importeDeCuenta()` lee el GRC por CID y, si no cruza, cae a
    # `cuentas.facturacion`, que guarda `acumulado / meses` —el promedio de
    # vida— y NO es MRR. La primera version de este guion la imprimia a secas
    # bajo el rotulo «las de mas dinero», que es el mismo error que acababa de
    # corregir en `mide-fuentes-sin-alerta.py`: GRUPO TORRES CORZO salia con
    # $316,541 cuando su institucional son $272,436, y Grupo System ooapas con
    # $38,123 cuando son $1,078. [[grc-fuente-zoho]]
    inst = {}
    try:
        J = json.loads(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'),
                               encoding='utf-8').read())
        for f in J.get('filas', []):
            cid = str(f.get('cid') or '').strip()
            if not cid:
                continue
            v = float(f.get('mrrFin') or 0)
            if v <= 0 and f.get('verificacion') == 'sigue_viva':
                v = float(f.get('mrrIni') or 0)
            if v > 0:
                inst[cid] = inst.get(cid, 0.0) + v
    except Exception as e:
        print(u'  (no pude leer el GRC para el institucional: %s)' % e)

    print(u'')
    if delas:
        peores = sorted(delas, key=lambda a: -(a.get('mrr') or 0))[:8]
        print(u'  Las de mas dinero. DOS COLUMNAS, y no son la misma cifra:')
        print(u'    %-28s %11s %11s  %s'
              % (u'cuenta', u'tablero', u'institucional', u'tipo'))
        for a in peores:
            k = str(a.get('cid') or '').strip()
            g = inst.get(k)
            print(u'    %-28s %11s %11s  %s'
                  % (str(a.get('empresa'))[:28],
                     u'$' + format(int(a.get('mrr') or 0), ',d'),
                     (u'$' + format(int(round(g)), ',d')) if g else u'sin linea',
                     a.get('tipo')))
        print(u'    «tablero» es la cifra mixta con que se ordena; «institucional»')
        print(u'    es el MRR del GRC. «sin linea» NO es cero: es que no cruza.')

    print(u'')
    if fallos:
        print(u'  *** %d COMPROBACION(ES) FALLARON' % len(fallos))
        sys.exit(1)
    print(u'  Las dos alarmas disparan y coinciden con lo medido.')


if __name__ == '__main__':
    main()
