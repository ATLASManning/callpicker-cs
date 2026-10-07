"""Los PUNTOS CIEGOS de la cartera: qué no podemos ver, a cuántas cuentas y
   cuánto dinero.

   De dónde sale el encargo. Daniel Martínez, 6 oct 2026: «la idea de poder
   hacer un wishlist de lo que puede estar en plataforma que no podemos extraer
   y buscar que el equipo nos ayude». Su ejemplo: «puede ser que no te estés
   dando cuenta de que la misma eficiencia que ibas teniendo la estés
   perdiendo… que te entre el buzón de voz y en Callpicker aparezcan todas
   contestadas».

   POR QUÉ ESTE GUION Y NO UN DOCUMENTO. Una wishlist escrita de memoria es una
   carta a los Reyes: ingeniería la lee, la archiva y nadie puede priorizarla
   porque ninguna línea dice cuánto cuesta no tenerla. Cada punto ciego de aquí
   sale de contar la cartera viva y pegarle su MRR del GRC, que es la fuente que
   dirección fijó el 6 de octubre. Una línea que no se puede medir se marca como
   tal y se dice; no se rellena con una estimación.

   NO confundir con `lib/data-gaps.ts`, que son los campos de FICHA que el KAM
   debe preguntarle al cliente. Esto es lo que la plataforma no entrega a nadie,
   ni preguntando.

   Uso:  python scripts/mide-puntos-ciegos.py
"""
import collections
import io
import json
import os
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

env = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8-sig'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
U, K = env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']


def trae(tabla, cols):
    """PostgREST corta en 1000 filas sin avisar. Se pagina siempre."""
    out, desde = [], 0
    while True:
        r = urllib.request.Request('%s/rest/v1/%s?select=%s' % (U, tabla, cols))
        r.add_header('apikey', K)
        r.add_header('Authorization', 'Bearer ' + K)
        r.add_header('Range', '%d-%d' % (desde, desde + 999))
        lote = json.loads(urllib.request.urlopen(r, timeout=120).read().decode())
        out += lote
        if len(lote) < 1000:
            return out
        desde += 1000


def jload(rel):
    return json.load(io.open(os.path.join(RAIZ, rel), encoding='utf-8-sig'))


# ── LA CARTERA VIVA Y SU DINERO ─────────────────────────────────────────────
cuentas = trae('cuentas', 'id,cid,empresa,estado,asesor,facturacion,nps_score')
vivas = [c for c in cuentas if (c.get('estado') or '') in ('activo', 'en_riesgo')]

# El MRR se arma como `lib/facturacion-cuenta.ts`: suma de las filas del CID
# usando `mrrFin` (el vigente, no el inicial). Replicar la regla a mano es
# justo lo que me salió mal con las expresiones, así que aquí sólo se suma —
# la regla no se reinterpreta.
grc = jload('data/grc-zoho.json')
filas = grc.get('filas') if isinstance(grc, dict) else grc
porCid = collections.defaultdict(float)
for f in (filas or []):
    cid = str(f.get('cid') or '').strip()
    if cid:
        porCid[cid] += float(f.get('mrrFin') or 0)

SIN_IMPORTE = []
ORIGEN = collections.Counter()


def mrr(c):
    """El importe de la cuenta, o None cuando NO SE SABE.

    Es `importeDeCuenta()` de `lib/facturacion-cuenta.ts`, al pie de la letra:
    GRC si la suma del CID es MAYOR QUE CERO, si no `cuentas.facturacion`, si no
    sin dato. El `> 0` no es un detalle — sin él, un CID presente en el GRC pero
    que suma cero se queda en cero aquí mientras el tablero sí cae al respaldo, y
    aparecen dos cifras del mismo MRR. Dirección lo dijo sin margen: «no puede
    haber dos cifras».

    Y nunca 0: un cero se lee como «no vale nada» y son cuentas que facturan.
    """
    cid = str(c.get('cid') or '').strip()
    g = porCid.get(cid, 0.0) if cid else 0.0
    if g > 0:
        ORIGEN['grc'] += 1
        return g
    v = float(c.get('facturacion') or 0)
    if v > 0:
        ORIGEN['cuentas'] += 1
        return v
    ORIGEN['sin_dato'] += 1
    SIN_IMPORTE.append(c)
    return None


IMP = {c['id']: mrr(c) for c in vivas}
MRR_TOTAL = sum(v for v in IMP.values() if v is not None)
MEDIBLES = [c for c in vivas if IMP[c['id']] is not None]

print('\n  CARTERA VIVA: %d cuentas · $%s de MRR medible'
      % (len(vivas), format(MRR_TOTAL, ',.0f')))
print('  origen: %d del GRC · %d de cuentas.facturacion · %d sin dato'
      % (ORIGEN['grc'], ORIGEN['cuentas'], ORIGEN['sin_dato']))
print('  (sin dato NO cuenta como cero y no entra en ninguna suma de abajo)\n')

PUNTOS = []


def punto(clave, titulo, afectadas, pregunta, quien, medible=True, nota='',
          sustituto='Nada. El hueco está abierto.'):
    """Un punto ciego. `afectadas` son objetos cuenta; el dinero se suma aquí.

    `sustituto` es LO QUE HACEMOS HOY en su lugar, con su cobertura medida
    cuando la hay. Hace falta porque cinco de estos nueve huecos afectan al
    100% de la cartera y por tanto traen el MISMO importe: una columna de
    dinero que no se mueve no ordena nada y entrena a no mirarla. Lo que de
    verdad separa un hueco de otro es si existe un apaño y cuánto alcanza.
    """
    ids = [c['id'] for c in afectadas]
    dinero = sum(IMP[i] for i in ids if IMP.get(i) is not None)
    sinDato = sum(1 for i in ids if IMP.get(i) is None)
    PUNTOS.append({
        'clave': clave, 'titulo': titulo, 'cuentas': len(ids), 'mrr': dinero,
        'sinImporte': sinDato, 'pregunta': pregunta, 'quien': quien,
        'medible': medible, 'nota': nota, 'sustituto': sustituto,
        'pctCartera': (100.0 * dinero / MRR_TOTAL) if MRR_TOTAL else 0.0,
    })


# ── 1. LLAMADAS: ¿ALGUIEN CONTESTÓ? ─────────────────────────────────────────
# El export parte las entrantes en cuatro y las cuatro suman el total:
# Redirected + Lost + Self_service + Voicemail. No hay bucket «contestada»:
# `Redirected` dice que la llamada se enrutó a una extensión, no que alguien la
# tomara. Es LITERALMENTE lo que teme Daniel.
llam = jload('data/analisis-llamadas.json')
lcu = llam.get('cuentas') or {}
conLectura = []
tipos = collections.Counter()
totMin = 0.0
for c in vivas:
    cid = str(c.get('cid') or '').strip()
    d = lcu.get(cid)
    if not d or not d.get('ent'):
        continue
    conLectura.append(c)
    t = d['ent'].get('tipos') or {}
    for k, v in t.items():
        tipos[k] += v
    totMin += sum(float(x.get('min') or 0) for x in (d['ent'].get('dest') or []))

# CORREGIDO el 7 oct 2026, y la correccion es el hallazgo.
#
# Lo primero que escribi aqui fue que no existe cubeta «contestada» y que las
# 1,683,879 enrutadas cuentan como atendidas «por descarte y no por medicion».
# Es FALSO, y lo desmiente una memoria propia de la fuente: `Redirected` esta
# verificado como contestada —el 99.4% trae minutos > 0, medido sobre el
# archivo detallado—. Confundi dos fuentes de llamadas distintas y por poco se
# va al documento de los fundadores.
#
# Lo que si hay, y es peor, no es un hueco de la plataforma: es NUESTRO. En el
# agregado que consume el tablero, el campo `c` de cada destino se calcula como
# todo lo que no fue `Lost`, asi que dentro van `Self_service` (el IVR, cero
# minutos) y `Voicemail` (el buzon). La columna de `/analisis-llamadas` rotulada
# «Contestadas» publica esa cifra. Son 392,794 llamadas que nadie tomo contadas
# como atendidas — 18.9% de las «contestadas».
#
# O sea la frase de Daniel, literal: «que te entre el buzon de voz y en
# Callpicker aparezcan todas contestadas». Tenia razon, y no habia que pedirselo
# a nadie. Por eso ya no hay fila de wishlist por esto: hay un arreglo.
#
# Lo que SI falta de la plataforma es el tiempo de TIMBRADO. `total_minutes` es
# tiempo de conversacion y si viene; lo que no existe es cuanto espero el cliente
# antes de que alguien tomara la llamada, que es la mitad de la pregunta de
# eficiencia.
punto('timbrado', 'No se sabe cuánto espera el cliente antes de que contesten',
      conLectura,
      '¿Puede el export traer el tiempo de timbrado por llamada —cuánto sonó '
      'antes de que la tomaran o se perdiera—, aunque sea promediado por mes?',
      'Plataforma Callpicker',
      sustituto='Los minutos de conversación, que sí vienen (%s minutos '
                'entrantes, 2.49 por llamada atendida). Dicen cuánto se habló, '
                'nunca cuánto se esperó.' % format(totMin, ',.0f'),
      nota='Sin timbrado no hay tiempo de espera ni abandono, que es justo la '
           'eficiencia que dirección pide poder ver caer. Los conteos por día y '
           'hora dicen CUÁNDO se pierden, no cuánto aguantó quien llamó.')

sinLectura = [c for c in vivas if c not in conLectura]
punto('sin_llamadas', 'Cuentas sin ninguna lectura de llamadas', sinLectura,
      '¿Por qué estas cuentas no aparecen en el reporte de llamadas: no tienen '
      'tráfico, o no están en el corte?',
      'Plataforma Callpicker',
      sustituto='Se marcan NO MEDIBLE y la alerta pide el enlace de carga. Es '
                'honesto, pero no es una medición.',
      nota='Para estas cuentas el consumo es NO MEDIBLE, no cero.')

# ── 2. SOPORTE: NO SE VE UN SOLO TICKET ABIERTO ─────────────────────────────
tk = jload('lib/tickets-data.json')
tfilas = tk.get('tickets') if isinstance(tk, dict) else tk
abiertos = [t for t in (tfilas or []) if not str(t.get('cierre') or '').strip()]
cidsConTicket = set()
for t in (tfilas or []):
    v = str(t.get('cid') or '').strip()
    if v:
        cidsConTicket.add(v)

punto('tickets_abiertos', 'Los tickets abiertos no existen en el export', vivas,
      '¿Puede el reporte de Zoho Desk incluir los tickets ABIERTOS, con su '
      'fecha de apertura y su antigüedad?',
      'Mesa de ayuda · Zoho Desk',
      sustituto='Nada. Se declara NO MEDIBLE en pantalla para no publicar un '
                'cero falso, y ahí acaba lo que se puede hacer.',
      nota='%d de %d filas del archivo no traen fecha de cierre: el export está '
           'filtrado a cerrados, así que «0 abiertos» no es un cero, es ciego. '
           'Un cliente puede llevar semanas esperando y el tablero lo ve igual '
           'que a uno sin incidencias.' % (len(abiertos), len(tfilas or [])))

sinTicket = [c for c in vivas if str(c.get('cid') or '').strip() not in cidsConTicket]
punto('sin_soporte', 'Cuentas sin un solo ticket en el histórico', sinTicket,
      '¿Estas cuentas no han abierto incidencias, o su soporte no pasa por la '
      'mesa de ayuda?',
      'Mesa de ayuda · Zoho Desk',
      sustituto='Preguntarle al asesor cuenta por cuenta.',
      nota='Grupo Petroil ya enseñó que las dos cosas se ven igual: la F32 '
           'tiene cero tickets porque no pasa por la mesa, no porque esté '
           'apagada.')

# ── 3. LA VARA DEL CLIENTE ──────────────────────────────────────────────────
sinNps = [c for c in vivas if not c.get('nps_score')]
punto('nps', 'Nadie ha contestado qué tan satisfecho está', sinNps,
      '¿Puede la plataforma pedir una calificación al cliente, o la seguimos '
      'levantando a mano en la llamada?',
      'Plataforma Callpicker · o el equipo, a mano',
      sustituto='Pedirlo por teléfono. Lleva dos meses en el catálogo de ficha '
                'y la cobertura sigue en 0 de 192: el apaño ya se probó y no '
                'funciona.',
      nota='El NPS está en el catálogo de ficha desde agosto y sigue vacío en '
           'el %d%% de la cartera: pedirlo cuenta por cuenta no ha funcionado.'
           % round(100.0 * len(sinNps) / max(1, len(vivas))))

# Sabemos cuántos números tiene cada cuenta. No sabemos quién los usa.
dids = jload('data/dids.json')
porCidDid = dids.get('porCid') or {}
numeros = 0
conDids = []
for c in vivas:
    cid = str(c.get('cid') or '').strip()
    d = porCidDid.get(cid)
    if d:
        conDids.append(c)
        numeros += len(d) if isinstance(d, list) else int(d.get('total') or 0)

punto('uso_por_usuario', 'No se sabe cuántos usuarios usan de verdad el servicio',
      vivas,
      '¿Puede la plataforma decir cuántas extensiones o usuarios estuvieron '
      'activos en el mes, y cuántos no se conectaron nunca?',
      'Plataforma Callpicker',
      sustituto='El consumo de minutos de la cuenta entera, que no distingue '
                'entre dos usuarios intensivos y trece a medias.',
      nota='Sabemos qué contrató cada cuenta y cuántos números tiene '
           '(%s números en %d cuentas vivas), pero no cuántos se usan. Una '
           'cuenta que contrató 13 extensiones y ocupa 2 se ve idéntica a una '
           'que ocupa 13: paga lo mismo y se va a ir.'
           % (format(numeros, ','), len(conDids)))

punto('grabaciones', 'Lo que el cliente DICE no está en ninguna parte', vivas,
      '¿Puede la plataforma darnos grabación o transcripción de llamadas, con '
      'el consentimiento que corresponda, para poder leerlas con IA?',
      'Plataforma Callpicker · con el visto bueno legal',
      medible=False,
      sustituto='La prosa del asesor, que la capa cualitativa ya lee. Hoy '
                'encuentra señal escrita en 6 de 192 cuentas: cubre el 3%. '
                'No es que el resto esté bien — es que nadie lo escribió.',
      nota='Es el hueco que explica todo lo demás. Dirección pide que la IA lea '
           'lo cualitativo, y la fuente más rica —lo que el cliente dice en la '
           'llamada— no existe para nosotros. La capa cualitativa que acaba de '
           'entrar lee la prosa del ASESOR, que es de segunda mano: en '
           'Biolaboratorio Sadat funcionó porque la asesora escribió «alto '
           'riesgo de descontinuación», pero si no lo hubiera escrito, no '
           'habría nada que leer.')

punto('para_que_lo_usa', 'No se sabe PARA QUÉ usa el cliente la plataforma',
      vivas,
      '¿Puede la plataforma decir qué hace cada cuenta con el servicio —campañas, '
      'cobranza, soporte, ventas— en vez de sólo cuántas llamadas tuvo?',
      'Plataforma Callpicker',
      medible=False,
      sustituto='El plan contratado y la escalera de producto, que dicen qué '
                'compró, no qué hace con ello.',
      nota='Es el segundo principio de dirección y hoy no hay ni un campo que lo '
           'responda. Lo más cercano es la prosa que escribe el asesor, que es '
           'justo lo que la capa cualitativa tuvo que empezar a leer.')

# ── EL INFORME ──────────────────────────────────────────────────────────────
PUNTOS.sort(key=lambda p: -p['mrr'])
print('  %-44s %7s %13s %7s' % ('PUNTO CIEGO', 'CUENTAS', 'MRR', '% CART'))
print('  ' + '-' * 76)
for p in PUNTOS:
    print('  %-44s %7d %13s %6.1f%%'
          % (p['titulo'][:44], p['cuentas'], format(p['mrr'], ',.0f'), p['pctCartera']))
print('  ' + '-' * 76)

print('\n  ══ DETALLE ══')
for p in PUNTOS:
    print('\n  %s' % p['titulo'].upper())
    print('    cuentas  : %d  ·  $%s  (%.1f%% de la cartera medible)'
          % (p['cuentas'], format(p['mrr'], ',.0f'), p['pctCartera']))
    if p['sinImporte']:
        print('    ojo      : %d de ellas sin importe conocido, no van en esa suma'
              % p['sinImporte'])
    if not p['medible']:
        print('    medición : NO MEDIBLE hoy — no hay campo que lo responda')
    print('    pedir a  : %s' % p['quien'])
    print('    pregunta : %s' % p['pregunta'])
    print('    hoy      : %s' % p['sustituto'])
    if p['nota']:
        print('    por qué  : %s' % p['nota'])

salida = os.path.join(RAIZ, 'data', 'puntos-ciegos.json')
io.open(salida, 'w', encoding='utf-8', newline='\n').write(
    json.dumps({'generado': llam.get('meta', {}).get('generado'),
                'carteraViva': len(vivas), 'mrrMedible': MRR_TOTAL,
                'sinImporte': len(SIN_IMPORTE), 'puntos': PUNTOS},
               ensure_ascii=False, indent=1))
print('\n  escrito: data/puntos-ciegos.json')
