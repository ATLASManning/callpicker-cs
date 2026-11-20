# -*- coding: utf-8 -*-
u"""Que queda y que sale si las alertas se acotan a INDICIOS DE BAJA O DOWNGRADE
   y SOLO sobre cuentas asignadas a un asesor.

   Instruccion de direccion (16 nov 2026): «las alertas o warnings que emites
   deberan ser por ahora exclusivamente sobre indicios que puedan favorecer una
   solicitud de baja o downgrade, exclusivamente de las cuentas o clientes que
   se encuentran asignados a los asesores».

   POR QUE SE MIDE ANTES DE TOCAR NADA
   -----------------------------------
   Este modulo ya se rediseño una vez con doce señales candidatas y el 96% de
   la cartera encendia algo: una lista que nadie puede recorrer el lunes no es
   una alerta, es ruido. Y el conjunto estrecho `TIPOS_RIESGO` existe
   precisamente porque meter las fallas de mesa lo inflaba de 33 a 49 cuentas.
   Acotar tambien puede romperlo por el otro lado: si al recortar quedan cuentas
   MUDAS —cuentas con riesgo real que dejan de aparecer en ninguna pantalla—,
   eso no es foco, es un hueco. Aqui se cuentan las dos cosas.

   Se mide contra PRODUCCION. Una replica en Python de la deteccion
   confirmaria lo que yo creo que hace el codigo, no lo que hace.
   [[feedback-verificar-antes-asegurar]]

   USO
   ---
       python scripts/mide-indicios-baja.py
       python scripts/mide-indicios-baja.py --base http://localhost:3000
"""
import argparse
import base64
import collections
import gzip
import hashlib
import hmac
import io
import json
import os
import sys
import time
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── LA PROPUESTA QUE SE MIDE ────────────────────────────────────────────────
#
# Un indicio de baja o downgrade es una señal sobre EL CLIENTE: lo que dice,
# lo que deja de usar, lo que deja de contestar, o un servicio que le estamos
# fallando. NO lo es un hueco en NUESTROS datos —no saber algo de una cuenta no
# la acerca a irse, nos impide verla—, ni una oportunidad de venta.
#
# Las tres columnas de abajo son la propuesta, no el estado actual: lo que
# imprime este guion es que pasaria si se aplicara.
INDICIO = {
    # Lo dijo o lo escribio alguien del equipo: la evidencia mas directa.
    'baja_declarada':         'lo declaro',
    'reduccion_declarada':    'lo declaro',
    'riesgo_escrito':         'lo declaro',
    # Deja de usar el servicio: el precursor clasico del downgrade.
    'consumo_cero':           'deja de usarlo',
    'desplome_consumo':       'deja de usarlo',
    'caida_consumo':          'deja de usarlo',
    'uso_bajo':               'deja de usarlo',
    # 20 nov 2026: direccion reclasifico la brecha plan-consumo como
    # indicio de downgrade. Cubre de `usoBajo` a `planSobrado` (15-70%).
    'plan_sobrado':           'deja de usarlo',
    # Se rompe la relacion: asi se pierde una cuenta sin verla venir (Sadat).
    # `nunca_contactada` NO entra, y la medicion es la razon — ver FUERA.
    'sin_interlocutor':       'se rompe la relacion',
    'silencio_60':            'se rompe la relacion',
    # Lo dice la FACTURACION, que es la prueba y no el indicio. Dos tipos
    # nuevos: el GRC tiene medido mes a mes quien bajo su MRR y quien entro en
    # churn, y nada de eso llegaba al motor. Ver `mide-senal-facturacion.py`.
    'downgrade_repetido':     'lo dice la factura',
    'churn_facturado':        'lo dice la factura',
    # Le estamos fallando: el motivo de baja mejor documentado de esta cartera.
    'sac_fuera_sla':          'le fallamos',
    'sac_atraso_cronico':     'le fallamos',
    'sac_fallas_recurrentes': 'le fallamos',
    'llamadas_sin_contestar': 'le fallamos',
    'llamadas_perdidas_masivas': 'le fallamos',
}

# Lo que DEJA de emitirse como alerta. No se borra del motor: sigue alimentando
# los hallazgos de `analisis` y `entrega` en la ficha de la cuenta. Deja de ser
# una ALARMA, que es lo que pidio direccion.
FUERA = {
    'sin_consumo_medible':  'hueco nuestro (ceguera)',
    'sin_radar':            'hueco nuestro (ceguera)',
    'sin_contactos':        'hueco nuestro (ceguera)',
    'sin_ficha':            'hueco nuestro (ceguera)',
    'sin_datos_auditables': 'hueco nuestro (ceguera)',
    'sin_importe':          'hueco nuestro (ceguera)',
    'silencio_30':          'higiene de relacion, no indicio',
    # NUNCA_CONTACTADA SALE, y no por volumen sino por SUJETO.
    #
    # «Nunca la hemos contactado» es un hecho sobre NOSOTROS, no sobre el
    # cliente: no lo acerca a pedir la baja, nos impide ver si va a pedirla. Es
    # ceguera con otro nombre. Y el volumen lo confirma: salta en 91 de 189
    # cuentas —el 48% de la cartera—, asi que como alarma no distingue nada.
    #
    # Lo que SI es indicio se queda: `sin_interlocutor` (2+ intentos fallidos
    # seguidos, el caso Biolaboratorio Sadat) mide que no hay nadie del otro
    # lado, y eso si es del cliente. Son tres cuentas, y esas tres importan.
    'nunca_contactada':     'sin registro de contacto: hueco nuestro',
    'rebasa_bolsa':         'oportunidad de venta',
}

ap = argparse.ArgumentParser()
ap.add_argument('--base', default='https://callpicker-cs.vercel.app')
ap.add_argument('--autoprueba', action='store_true')
ap.add_argument('--verifica', action='store_true',
                help='Despues de desplegar: exige que la API ya NO emita nada '
                     'que no sea indicio, y que todo traiga asesor. Sale con 1 '
                     'si se cuela algo.')
args = ap.parse_args()


def juzga(tipos_vistos):
    u"""(desconocidos, propuesta) — ningun tipo puede quedar sin clasificar.

       Es la regla, y la usan la medicion Y la autoprueba. Un tipo nuevo que
       nadie clasifico se quedaria fuera EN SILENCIO, que es como se apaga una
       alarma sin decidirlo.
    """
    desconocidos = sorted(t for t in tipos_vistos
                          if t not in INDICIO and t not in FUERA)
    return desconocidos, {t: INDICIO.get(t) for t in tipos_vistos if t in INDICIO}


if args.autoprueba:
    assert set(INDICIO) & set(FUERA) == set(), 'un tipo no puede estar en los dos'
    d, _ = juzga(set(INDICIO) | set(FUERA))
    assert not d, 'la propuesta deberia clasificar todo lo que ella misma declara'
    d, _ = juzga({'tipo_inventado'})
    assert d == ['tipo_inventado'], 'deberia delatar un tipo sin clasificar'
    d, p = juzga({'baja_declarada', 'sin_ficha'})
    assert not d and list(p) == ['baja_declarada'], 'deberia dejar fuera la ceguera'
    print(u'  autoprueba: 4/4 — la regla clasifica, delata lo nuevo y excluye')
    print(u'  los huecos propios.')
    sys.exit(0)

E = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        E[k.strip()] = v.strip().strip('"')


def token():
    u"""El secreto se LEE del .env.local y no se imprime nunca."""
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    now = int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(E['JWT_SECRET'].encode(), (cab + '.' + cue).encode(), hashlib.sha256).digest())


def api(ruta):
    r = urllib.request.Request(args.base + ruta)
    r.add_header('Cookie', 'cp_session=' + token())
    r.add_header('Accept-Encoding', 'gzip')
    with urllib.request.urlopen(r, timeout=600) as x:
        b = x.read()
        if (x.headers.get('Content-Encoding') or '').lower() == 'gzip':
            b = gzip.decompress(b)
    return json.loads(b.decode('utf-8', 'replace'))


d = api('/api/alertas?limite=5000')
alertas = d.get('rows') or d.get('alertas') or d.get('lista') or []
if not alertas:
    print(u'  La API no devolvio ninguna alerta. Claves: %s' % ', '.join(sorted(d)))
    sys.exit(1)

print(u'')
print(u'  %d alertas en bruto' % len(alertas))

if args.verifica:
    # ── LO QUE LA API YA NO DEBE EMITIR ──────────────────────────────────
    #
    # Se comprueba CONTRA PRODUCCION y por el lado NEGATIVO: no «¿salen los
    # indicios?» —eso se cumpliria solo mientras salga cualquier cosa— sino
    # «¿se cuela algo que no lo es?». [[feedback-probar-al-reves]]
    fallos = []
    colados = collections.Counter(a['tipo'] for a in alertas if a['tipo'] in FUERA)
    if colados:
        fallos.append(u'emite tipos que no son indicio: %s'
                      % u', '.join('%s (%d)' % (t, n) for t, n in colados.most_common()))
    nuevos = sorted({a['tipo'] for a in alertas} - set(INDICIO) - set(FUERA))
    if nuevos:
        fallos.append(u'emite tipos sin clasificar: %s' % u', '.join(nuevos))
    huerfanas = [a for a in alertas if not (a.get('asesor') or '').strip()]
    if huerfanas:
        fallos.append(u'%d alerta(s) de cuentas SIN asesor asignado: %s'
                      % (len(huerfanas),
                         u', '.join(sorted({a.get('empresa') or '?' for a in huerfanas})[:5])))
    # Y por el lado positivo, un piso: cero alertas no seria foco, seria que el
    # motor no corrio. Un verificador que concluye exito con la lista vacia es
    # peor que no tenerlo. [[feedback-verificar-antes-asegurar]]
    if not alertas:
        fallos.append(u'la API no devolvio NINGUNA alerta: eso no es foco, '
                      u'es que el motor no corrio')
    print(u'')
    for t, n in collections.Counter(a['tipo'] for a in alertas).most_common():
        print(u'     %-28s %5d   %s'
              % (t, n, INDICIO.get(t) or FUERA.get(t) or u'*** SIN CLASIFICAR'))
    print(u'')
    if fallos:
        for f in fallos:
            print(u'  *** %s' % f)
        sys.exit(1)
    # ── LA MEMORIA, que es lo que el CHECK de Supabase habilita ──────────
    #
    # Una alerta que se emite pero cuyo episodio la base rechaza se ve
    # exactamente igual en pantalla —sale, se trabaja— salvo en una cosa: no
    # puede decir «lleva 47 dias asi», que es la unica forma de anticipar en
    # vez de contar. El rechazo se publica en `falla` y aqui se mira.
    ep = d.get('episodios') or {}
    print(u'  memoria de episodios: %s abiertos · %s detectados · %s nuevos'
          % (ep.get('abiertos'), ep.get('detectados'), ep.get('nuevos')))
    if ep.get('falla'):
        print(u'')
        print(u'  *** LA MEMORIA NO ESTA GUARDANDO: %s' % ep['falla'])
        print(u'  Las alertas salen igual, pero sin antiguedad. Si el texto')
        print(u'  menciona el codigo 23514 es el CHECK de')
        print(u'  `alertas_episodios.condicion`: correr')
        print(u'  `scripts/migracion-condicion-facturacion.sql`.')
        sys.exit(1)
    print(u'')
    print(u'  OK — la API emite %d alertas, todas indicio de baja o downgrade,'
          % len(alertas))
    print(u'  todas de cuentas con asesor asignado, y la memoria guarda.')
    sys.exit(0)

k0 = alertas[0]
print(u'  campos de una alerta: %s' % u', '.join(sorted(k0)))

desconocidos, _ = juzga({a['tipo'] for a in alertas})
if desconocidos:
    print(u'')
    print(u'  *** TIPOS SIN CLASIFICAR: %s' % u', '.join(desconocidos))
    print(u'  Un tipo que nadie clasifico se quedaria fuera EN SILENCIO.')
    print(u'  Clasificarlo en INDICIO o en FUERA antes de seguir.')
    sys.exit(1)

# ── 1 · CUANTAS CUENTAS ESTAN ASIGNADAS ─────────────────────────────────────
con_asesor = [a for a in alertas if (a.get('asesor') or '').strip()]
sin_asesor = [a for a in alertas if not (a.get('asesor') or '').strip()]
cu = lambda L: {a['cuentaId'] for a in L}
mrr = lambda L: sum(v for v in {a['cuentaId']: (a.get('mrr') or 0) for a in L}.values())

print(u'')
print(u'  1 · EL RECORTE POR CARTERA ASIGNADA')
print(u'  %-34s %6s alertas  %5s cuentas  %14s'
      % (u'', u'', u'', u'MRR'))
for etq, L in ((u'asignadas a un asesor', con_asesor),
               (u'SIN asesor asignado (salen)', sin_asesor)):
    print(u'  %-34s %6d          %5d        $%s'
          % (etq, len(L), len(cu(L)), format(mrr(L), ',.0f')))

# ── 2 · EL RECORTE POR TIPO ─────────────────────────────────────────────────
dentro = [a for a in con_asesor if a['tipo'] in INDICIO]
fuera = [a for a in con_asesor if a['tipo'] in FUERA]

print(u'')
print(u'  2 · EL RECORTE POR TIPO, ya dentro de la cartera asignada')
print(u'  %-34s %6s alertas  %5s cuentas  %14s' % (u'', u'', u'', u'MRR'))
print(u'  %-34s %6d          %5d        $%s'
      % (u'indicio de baja o downgrade', len(dentro), len(cu(dentro)),
         format(mrr(dentro), ',.0f')))
print(u'  %-34s %6d          %5d        $%s'
      % (u'deja de ser alerta', len(fuera), len(cu(fuera)),
         format(mrr(fuera), ',.0f')))

print(u'')
print(u'  por grupo de indicio:')
g = collections.defaultdict(list)
for a in dentro:
    g[INDICIO[a['tipo']]].append(a)
for k in sorted(g, key=lambda x: -len(cu(g[x]))):
    print(u'     %-24s %5d alertas  %4d cuentas  $%s'
          % (k, len(g[k]), len(cu(g[k])), format(mrr(g[k]), ',.0f')))

print(u'')
print(u'  por tipo (dentro):')
for t, n in collections.Counter(a['tipo'] for a in dentro).most_common():
    L = [a for a in dentro if a['tipo'] == t]
    print(u'     %-28s %5d  %4d cuentas  $%s'
          % (t, n, len(cu(L)), format(mrr(L), ',.0f')))
print(u'  por tipo (fuera):')
for t, n in collections.Counter(a['tipo'] for a in fuera).most_common():
    L = [a for a in fuera if a['tipo'] == t]
    print(u'     %-28s %5d  %4d cuentas  $%s   %s'
          % (t, n, len(cu(L)), format(mrr(L), ',.0f'), FUERA[t]))

# ── 3 · LAS QUE SE QUEDAN MUDAS, que es el riesgo del recorte ───────────────
mudas = sorted(cu(fuera) - cu(dentro))
print(u'')
print(u'  3 · CUENTAS QUE SE QUEDAN MUDAS')
print(u'  Tenian alerta y dejan de tener ninguna. No es que esten bien: es que')
print(u'  dejan de verse. Si son muchas, el recorte abre un hueco.')
porCuenta = {}
for a in fuera:
    porCuenta.setdefault(a['cuentaId'], []).append(a)
tot = sum((porCuenta[c][0].get('mrr') or 0) for c in mudas)
print(u'     %d cuenta(s), $%s de MRR' % (len(mudas), format(tot, ',.0f')))
for c in sorted(mudas, key=lambda x: -(porCuenta[x][0].get('mrr') or 0))[:15]:
    a = porCuenta[c][0]
    print(u'     %-34s %-9s $%9s   %s'
          % ((a.get('empresa') or '?')[:34], a.get('consecutivo') or '—',
             format(a.get('mrr') or 0, ',.0f'),
             u', '.join(sorted({x['tipo'] for x in porCuenta[c]}))))

# ── 4 · POR ASESOR, que es como se reparte el lunes ─────────────────────────
print(u'')
print(u'  4 · LA CARGA POR ASESOR, antes y despues')
ases = sorted({(a.get('asesor') or '').strip() for a in con_asesor})
print(u'     %-14s %18s   %18s' % (u'', u'HOY', u'CON EL RECORTE'))
for s in ases:
    A = [a for a in con_asesor if (a.get('asesor') or '').strip() == s]
    B = [a for a in dentro if (a.get('asesor') or '').strip() == s]
    print(u'     %-14s %4d al · %3d ctas   %4d al · %3d ctas   $%s'
          % (s, len(A), len(cu(A)), len(B), len(cu(B)), format(mrr(B), ',.0f')))
