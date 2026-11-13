# -*- coding: utf-8 -*-
u"""COMPRUEBA `data/cuentas-downgrade.json` CONTRA LA CARTERA VIVA.

   ── POR QUE EXISTE ────────────────────────────────────────────────────────
   El apartado se llama ACTIVAS con Downgrade, y ese rotulo es una afirmacion:
   que cada cuenta de la lista esta viva. Una capa escrita a mano envejece sin
   avisar —la cuenta se va a Dormidas, el CID cambia de dueno, alguien teclea
   un nombre distinto— y entonces la pantalla sigue diciendo «activa» de algo
   que no lo es, sin que falle nada. [[feedback-verificar-antes-asegurar]]

   LO QUE RECHAZA (sale con codigo 1):
     1. un CID que no esta en `cuentas`
     2. un CID cuyo nombre ya NO es el declarado — el nombre es el TESTIGO del
        CID, y uno reasignado pondria a otra empresa en la lista [[dids-fuente]]
     3. una cuenta que NO esta viva: `hibernacion` o `cancelado` aqui convierte
        el rotulo en mentira. Esa va a Dormidas, que es otra decision.
     4. una cifra DERIVADA tecleada en la capa (mrr, perdida, porcentaje...).
        Esas salen del GRC al leer; tecleadas se quedan viejas y nadie lo nota.
        [[feedback-metricas-derivadas-origen]]
     5. una entrada sin quien la marco o sin cuando

   LO QUE AVISA PERO NO TUMBA:
     que el GRC AAA 2026 no traiga eventos de Downgrade de esa cuenta. NO es un
     error: direccion puede saberlo por la factura antes de que el GRC lo
     publique. Se dice con palabras, que es justo lo que hace la pantalla.
     [[feedback-cero-sin-medicion]]

   Las credenciales se leen de `.env.local` AQUI DENTRO y NO se imprimen.

   USO
       python -I scripts/revisa-cuentas-downgrade.py
       python -I scripts/revisa-cuentas-downgrade.py --autoprueba
"""
import io
import json
import os
import re
import sys
import unicodedata
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAPA = os.path.join(RAIZ, 'data', 'cuentas-downgrade.json')
AAA = os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts')

VIVO = ('activo', 'en_riesgo')

#: Campos que la capa NO puede traer: son derivados y salen de las fuentes.
#: Se comprueba por SUBCADENA para que `mrrAntes`, `mrr_fin` o `perdidaGrc`
#: caigan igual — una lista exacta se esquiva con cualquier variante.
DERIVADOS = ('mrr', 'perdid', 'facturacion', 'importe', 'porcentaje', 'pct',
             'caida', 'monto')
#: Lo que SIEMPRE tiene que venir. Sin `quien` y `fecha` la entrada no se puede
#: revisar despues, que es para lo que existe la capa.
OBLIGADOS = ('cid', 'empresa', 'fecha', 'quien', 'razon')


def norm(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s or '')).lower()
                if not (0x300 <= ord(c) <= 0x36f))
    return re.sub(r'[^a-z0-9]', '', s)


def cartera():
    u"""La cartera completa desde Supabase. Devuelve None si no se pudo leer."""
    env = {}
    ruta = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(ruta):
        return None
    for ln in io.open(ruta, encoding='utf-8'):
        if '=' in ln and not ln.strip().startswith('#'):
            k, v = ln.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    url = env.get('NEXT_PUBLIC_SUPABASE_URL')
    key = env.get('SUPABASE_SERVICE_ROLE_KEY') or env.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        return None
    req = urllib.request.Request(
        url + '/rest/v1/cuentas?select=cid,consecutivo,empresa,asesor,estado&limit=2000',
        headers={'apikey': key, 'Authorization': 'Bearer ' + key})
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode('utf-8'))


def eventos_aaa():
    u"""{nombre normalizado: [meses]} con movimiento Downgrade en GRC AAA."""
    out = {}
    mes = None
    for ln in io.open(AAA, encoding='utf-8'):
        m = re.search(r"mes:\s*'([^']+)'", ln)
        if m:
            mes = m.group(1)
        if "movimiento: 'Downgrade'" in ln:
            c = re.search(r"cliente:\s*'((?:[^'\\]|\\.)*)'", ln)
            if c:
                out.setdefault(norm(c.group(1)), []).append(mes)
    return out


def revisa(entradas, cuentas, aaa, di=print):
    u"""Devuelve (fallos, avisos). `cuentas` es la lista cruda de Supabase."""
    por_cid = {str(c.get('cid') or '').strip(): c for c in cuentas}
    fallos = avisos = 0

    for e in entradas:
        etq = u'%s · %s' % (e.get('consecutivo') or u'—', e.get('empresa') or u'?')

        faltan = [k for k in OBLIGADOS if not str(e.get(k) or '').strip()]
        if faltan:
            di(u'  *** %s — le faltan campos obligatorios: %s'
               % (etq, u', '.join(faltan)))
            di(u'      Sin `quien` y `fecha` la entrada no se puede revisar luego.')
            fallos += 1
            continue

        malos = [k for k in e
                 if any(d in norm(k) for d in DERIVADOS)]
        if malos:
            di(u'  *** %s — trae cifra(s) DERIVADA(S) tecleadas: %s'
               % (etq, u', '.join(malos)))
            di(u'      Esas salen del GRC al leer. Tecleadas se quedan viejas.')
            fallos += 1
            continue

        c = por_cid.get(str(e['cid']).strip())
        if c is None:
            di(u'  *** %s — el CID %s no está en `cuentas`.' % (etq, e['cid']))
            fallos += 1
            continue

        if norm(c.get('empresa')) != norm(e['empresa']):
            di(u'  *** %s — el CID %s ahora es «%s» en la cartera.'
               % (etq, e['cid'], c.get('empresa')))
            di(u'      El nombre es el testigo del CID: no se reclasifica a ciegas.')
            fallos += 1
            continue

        if c.get('estado') not in VIVO:
            di(u'  *** %s — está en estado «%s», no viva.' % (etq, c.get('estado')))
            di(u'      El apartado se llama ACTIVAS con Downgrade: una cuenta')
            di(u'      dormida aquí convierte el rótulo en mentira. Va a Dormidas.')
            fallos += 1
            continue

        meses = aaa.get(norm(c.get('empresa')))
        if meses:
            di(u'  ok     %-38s %-10s GRC AAA la mide en %s'
               % ((c.get('empresa') or u'')[:38], c.get('estado'), u', '.join(meses)))
        else:
            di(u'  AVISO  %-38s %-10s el GRC AAA NO trae eventos suyos.'
               % ((c.get('empresa') or u'')[:38], c.get('estado')))
            di(u'         No es un error ni un cero: puede venir de la factura')
            di(u'         antes de que el GRC lo publique. La pantalla lo dice')
            di(u'         con palabras, pero conviene que `origen` lo explique.')
            avisos += 1

    return fallos, avisos


# ── Autoprueba ───────────────────────────────────────────────────────────────
# Las ramas que una corrida buena NO enseña. Un comprobador del que sólo se ha
# visto el «ok» no está probado. [[feedback-probar-al-reves]]
def autoprueba():
    print(u'\n  AUTOPRUEBA — las ramas que una corrida buena no enseña')
    print(u'  ' + u'─' * 68)
    cuentas = [
        {'cid': '1', 'empresa': u'Cuenta Viva', 'estado': 'activo', 'consecutivo': 'X1'},
        {'cid': '2', 'empresa': u'Cuenta Dormida', 'estado': 'hibernacion', 'consecutivo': 'X2'},
    ]
    aaa = {norm(u'Cuenta Viva'): [u'Mayo']}
    base = {'cid': '1', 'empresa': u'Cuenta Viva', 'fecha': '2026-11-13',
            'quien': u'José Manuel', 'razon': u'porque sí'}
    casos = [
        (u'entrada correcta, con evento medido', dict(base), 0, 0),
        (u'el CID no está en la cartera', dict(base, cid='99'), 1, 0),
        (u'el CID ahora es de otra empresa',
         dict(base, empresa=u'Empresa Distinta'), 1, 0),
        (u'la cuenta está DORMIDA', dict(base, cid='2', empresa=u'Cuenta Dormida'), 1, 0),
        (u'trae un MRR tecleado', dict(base, mrrAntes=5000), 1, 0),
        (u'trae una pérdida tecleada', dict(base, perdida_grc=1200), 1, 0),
        (u'le falta quién la marcó', {k: v for k, v in base.items() if k != 'quien'}, 1, 0),
    ]
    malos = 0
    for nombre, entrada, esp_f, esp_a in casos:
        f, a = revisa([entrada], cuentas, aaa, di=lambda *x: None)
        bien = (f == esp_f)
        if not bien:
            malos += 1
        print(u'    %-46s %s' % (nombre,
              u'ok' if bien else u'*** FALLA ***  dio %d fallo(s), esperaba %d' % (f, esp_f)))

    # Y el aviso tiene que saber dispararse: cuenta viva SIN evento en el GRC.
    f, a = revisa([dict(base, cid='1')], cuentas, {}, di=lambda *x: None)
    bien = (f == 0 and a == 1)
    if not bien:
        malos += 1
    print(u'    %-46s %s' % (u'viva sin evento en GRC AAA → avisa, no tumba',
          u'ok' if bien else u'*** FALLA ***  fallos=%d avisos=%d' % (f, a)))

    print(u'')
    print(u'  %s' % (u'las %d comprobaciones de la autoprueba pasan' % (len(casos) + 1)
                     if not malos else
                     u'*** %d rama(s) de la autoprueba NO funcionan ***' % malos))
    return 1 if malos else 0


def main():
    if '--autoprueba' in sys.argv:
        return autoprueba()

    capa = json.load(io.open(CAPA, encoding='utf-8'))
    entradas = capa.get('cuentas') or []

    print(u'')
    print(u'  CUENTAS ACTIVAS CON DOWNGRADE — capa de dirección')
    print(u'  ' + u'═' * 68)
    print(u'  capa: %d entrada(s)' % len(entradas))

    if not entradas:
        print(u'')
        print(u'  La capa está VACÍA. Eso NO quiere decir que ninguna cuenta de la')
        print(u'  cartera haya tenido un downgrade: quiere decir que nadie ha')
        print(u'  marcado ninguna. La pantalla lo dice con esas palabras.')
        print(u'')
        return 0

    cuentas = cartera()
    if cuentas is None:
        print(u'')
        print(u'  *** NO SE PUDO LEER LA CARTERA (faltan credenciales en .env.local).')
        print(u'      Sin ella no se puede comprobar nada, y «no se miró» no es')
        print(u'      «está bien». [[feedback-cero-sin-medicion]]')
        return 2
    print(u'  cartera: %d cuenta(s)' % len(cuentas))
    print(u'')

    fallos, avisos = revisa(entradas, cuentas, eventos_aaa())

    print(u'')
    if fallos:
        print(u'  *** %d entrada(s) NO pasan. Arréglalas en' % fallos)
        print(u'      data/cuentas-downgrade.json antes de publicar.')
        return 1
    print(u'  las %d entrada(s) pasan%s.'
          % (len(entradas),
             u' (%d con aviso)' % avisos if avisos else u''))
    return 0


if __name__ == '__main__':
    sys.exit(main())
