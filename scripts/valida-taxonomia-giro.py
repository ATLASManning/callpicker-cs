"""Valida la taxonomia de giro contra el COMPORTAMIENTO TELEFONICO real.

   POR QUE EXISTE. `prediccion/docs/giro-taxonomia-propuesta.json` agrupa los 176
   valores de texto libre del campo `giro` en 18 grupos, y dice que 174 de 182
   cuentas quedan en grupos de 5 o mas. Esa propuesta la armaron tres
   clasificadores y un juez leyendo TEXTO, y el propio juez puso la condicion:

     «esto es una hipotesis derivada de un campo de texto libre, no una medicion.
      Antes del primer percentil hay que validar cada grupo contra el
      comportamiento real y sacar del grupo a quien se desvie.»

   Esto es esa validacion. Un grupo sirve para publicar un percentil solo si pasa
   TRES compuertas, y la primera no la miro nadie:

     1. COBERTURA. El percentil se calcula sobre cuentas con lectura de llamadas,
        no sobre cuentas. Un grupo de 19 donde 3 tienen datos no publica nada.
     2. ESTRECHEZ. Las cuentas del grupo tienen que parecerse MAS entre si que
        una pareja cualquiera de la cartera. Si la dispersion interna del grupo
        es la de la cartera entera, el grupo no agrupa: el percentil que ve el
        cliente seria el mismo que si lo comparamos contra todos.
     3. QUE SOBREVIVAN 5 despues de sacar a los que se desvian.

   ── POR QUE METRICAS DE FORMA Y NO DE VOLUMEN ──────────────────────────────

   Lo advirtio el juez y es correcto: en los grupos grandes la escala varia
   demasiado —un hospital y un consultorio de tres extensiones no comparten
   volumen— pero si comparten FORMA. Asi que se mide la mezcla y las tasas, nunca
   los totales:

     pctEnt        que parte del trafico es entrante
     pctAtendidas  Redirected / entrantes  — atendidas por una PERSONA
     pctPerdidas   Lost / entrantes
     pctIvr        Self_service / entrantes
     minPorAtend   minutos de conversacion por llamada atendida
     pctFuera      que parte de las entrantes cae fuera de lunes-viernes 8-19

   `Redirected` esta verificado como contestada (99.4% trae minutos). Y NO se usa
   el campo `c` de los destinos, que es «todo lo que no fue Lost» y mete dentro
   el IVR y el buzon. Ver [[llamadas-fuente]].

   ── LA DISPERSION SE MIDE CON MAD, NO CON DESVIACION ESTANDAR ──────────────

   Con grupos de 5 a 19 cuentas, un solo atipico mueve la media y la desviacion
   lo suficiente para que el grupo parezca malo (o bueno) por una cuenta. La
   mediana y la desviacion absoluta mediana no se mueven, que es justo lo que
   hace falta cuando lo que se busca ES el atipico.

   Uso:  python scripts/valida-taxonomia-giro.py
"""
import collections
import io
import json
import os
import statistics
import sys
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

#: Minimo de cuentas CON DATOS para que un grupo pueda publicar un percentil.
#: Es la regla del §7.9 del Prompt Maestro, aplicada donde de verdad aplica.
MIN_COMPARABLES = 5

#: Cuan lejos de la mediana de su grupo puede estar una cuenta antes de que
#: deje de ser comparable. 3.0 en unidades de MAD es el umbral habitual para
#: atipico robusto; por debajo de eso se empieza a expulsar cuentas normales.
UMBRAL_ATIPICO = 3.0

env = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8-sig'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
U, K = env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']


def trae(tabla, cols):
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


def mad(xs):
    """Desviacion absoluta mediana, escalada para ser comparable a una sigma."""
    if len(xs) < 2:
        return None
    m = statistics.median(xs)
    d = statistics.median([abs(x - m) for x in xs])
    return 1.4826 * d


# ── LOS DATOS ───────────────────────────────────────────────────────────────
cuentas = trae('cuentas', 'id,cid,empresa,estado,asesor,giro')
vivas = [c for c in cuentas if str(c.get('estado')) in ('activo', 'en_riesgo')]
llam = json.load(io.open(os.path.join(RAIZ, 'data', 'analisis-llamadas.json'),
                         encoding='utf-8-sig'))['cuentas']
tax = json.load(io.open(os.path.join(RAIZ, 'prediccion', 'docs',
                                     'giro-taxonomia-propuesta.json'),
                        encoding='utf-8-sig'))

# ── EMPAREJAR LOS VALORES DE LA TAXONOMIA CON LOS DE LA BASE ───────────────
#
# No empatan todos de frente, y el motivo importa: los clasificadores TRUNCARON
# 34 de los valores largos al devolverlos («Comercializacion de vehiculos
# Chevrolet nuevos y seminuevos...»). Medido: 128 de 168 empatan exacto y 40 no.
# Dejarlo asi perdia 58 cuentas, o sea un tercio de la cartera, y los conteos de
# «cuentas con lectura» de cada grupo salian subestimados — justo la cifra que
# decide si un grupo publica.
#
# Asi que un valor que acaba en «...» se empareja por PREFIJO. Y con guarda: si
# un prefijo empata con mas de un giro real, NO se adivina — se declara y la
# cuenta queda sin grupo. Un emparejado silencioso que elige mal mete una cuenta
# en un grupo con el que no compara, y eso es exactamente lo que esta validacion
# existe para evitar.
reales = {str(c.get('giro') or '').strip() for c in vivas if str(c.get('giro') or '').strip()}
deGiro = {}
ambiguos, perdidos = [], []
for g in tax['grupos']:
    for v in (g.get('valores') or []):
        limpio = v.split(' (n=')[0].strip()
        if limpio in reales:
            deGiro[limpio.lower()] = g['nombre']
            continue
        base = limpio.rstrip('.').rstrip('…').rstrip('.').strip()
        cand = [r for r in reales if r.startswith(base[:40])] if len(base) >= 20 else []
        if len(cand) == 1:
            deGiro[cand[0].lower()] = g['nombre']
        elif len(cand) > 1:
            ambiguos.append((limpio, cand))
        else:
            perdidos.append(limpio)

print('\n  emparejado de los %d valores de la taxonomia:' % sum(
    len(g.get('valores') or []) for g in tax['grupos']))
print('     emparejados          : %d' % len(deGiro))
print('     prefijo AMBIGUO      : %d  (quedan sin grupo a proposito)' % len(ambiguos))
for v, cand in ambiguos[:5]:
    print('        «%s» empata con %d' % (v[:58], len(cand)))
print('     sin equivalente      : %d' % len(perdidos))
for v in perdidos[:5]:
    print('        %s' % v[:70])

HORA_HABIL = set(range(8, 19))


def metricas(cid):
    """El vector de FORMA de una cuenta, o None si no hay con que."""
    d = llam.get(str(cid or '').strip())
    if not d:
        return None
    e = d.get('ent') or {}
    s = d.get('sal') or {}
    tot = e.get('total') or 0
    if tot < 100:            # por debajo de cien entrantes una tasa es ruido
        return None
    t = e.get('tipos') or {}
    red = t.get('Redirected', 0)
    dest = e.get('dest') or []
    minutos = sum(float(x.get('min') or 0) for x in dest)
    dh = e.get('dh') or []
    fuera = 0
    if len(dh) == 168:
        for i, n in enumerate(dh):
            dia, hora = i // 24, i % 24
            if dia >= 5 or hora not in HORA_HABIL:
                fuera += n
    salTot = s.get('total') or 0
    return {
        'pctEnt': 100.0 * tot / (tot + salTot) if (tot + salTot) else None,
        'pctAtendidas': 100.0 * red / tot,
        'pctPerdidas': 100.0 * t.get('Lost', 0) / tot,
        'pctIvr': 100.0 * t.get('Self_service', 0) / tot,
        'minPorAtend': (minutos / red) if red else None,
        'pctFuera': (100.0 * fuera / tot) if len(dh) == 168 else None,
    }


CLAVES = ['pctEnt', 'pctAtendidas', 'pctPerdidas', 'pctIvr', 'minPorAtend', 'pctFuera']

# ── CADA CUENTA A SU GRUPO, CON SU VECTOR ───────────────────────────────────
porGrupo = collections.defaultdict(list)
sinGrupo, sinDatos = [], []
for c in vivas:
    g = deGiro.get(str(c.get('giro') or '').strip().lower())
    if not g:
        sinGrupo.append(c)
        continue
    m = metricas(c.get('cid'))
    if m is None:
        sinDatos.append((g, c))
        continue
    porGrupo[g].append((c, m))

print('\n  %d cuentas vivas · %d con grupo y datos · %d con grupo sin datos · %d sin grupo'
      % (len(vivas), sum(len(v) for v in porGrupo.values()), len(sinDatos), len(sinGrupo)))

# ── LA DISPERSION DE LA CARTERA, que es la vara ─────────────────────────────
todas = [m for v in porGrupo.values() for _, m in v] + [metricas(c.get('cid')) for _, c in sinDatos]
todas = [m for m in todas if m]
cartera = {}
for k in CLAVES:
    xs = [m[k] for m in todas if m.get(k) is not None]
    cartera[k] = {'mediana': statistics.median(xs) if xs else None,
                  'mad': mad(xs), 'n': len(xs)}
print('\n  LA VARA — dispersion de la cartera medida (%d cuentas con lectura):' % len(todas))
print('  %-14s %10s %10s' % ('METRICA', 'MEDIANA', 'MAD'))
print('  ' + '-' * 38)
for k in CLAVES:
    c0 = cartera[k]
    print('  %-14s %10s %10s'
          % (k, ('%.1f' % c0['mediana']) if c0['mediana'] is not None else '—',
             ('%.1f' % c0['mad']) if c0['mad'] is not None else '—'))

# ── GRUPO POR GRUPO ─────────────────────────────────────────────────────────
print('\n' + '=' * 92)
print('  VALIDACION GRUPO POR GRUPO')
print('=' * 92)
print('  estrechez = MAD del grupo / MAD de la cartera, promediada sobre las')
print('  metricas con dato. Menor que 1 = el grupo es mas parejo que la cartera,')
print('  que es la unica razon para agrupar. Mayor o igual que 1 = no agrupa.\n')

tamanos = {g['nombre']: g.get('cuentas', 0) for g in tax['grupos']}
resultado = []
for nombre in sorted(porGrupo, key=lambda n: -len(porGrupo[n])):
    filas = porGrupo[nombre]
    propuesto = tamanos.get(nombre, 0)

    # Estrechez, antes de sacar a nadie.
    estrecheces = []
    for k in CLAVES:
        xs = [m[k] for _, m in filas if m.get(k) is not None]
        mg, mc = mad(xs), cartera[k]['mad']
        if mg is not None and mc:
            estrecheces.append(mg / mc)
    estrechez = statistics.mean(estrecheces) if estrecheces else None

    # Atipicos: distancia robusta a la mediana del grupo, promediada.
    atipicos = []
    for c, m in filas:
        zs = []
        for k in CLAVES:
            xs = [mm[k] for _, mm in filas if mm.get(k) is not None]
            if m.get(k) is None or len(xs) < 3:
                continue
            md, mg = statistics.median(xs), mad(xs)
            if mg and mg > 0:
                zs.append(abs(m[k] - md) / mg)
        if zs and statistics.mean(zs) > UMBRAL_ATIPICO:
            atipicos.append((c, statistics.mean(zs)))

    sobreviven = len(filas) - len(atipicos)
    publica = (sobreviven >= MIN_COMPARABLES
               and estrechez is not None and estrechez < 1.0)
    resultado.append({'nombre': nombre, 'propuesto': propuesto,
                      'conDatos': len(filas), 'atipicos': len(atipicos),
                      'sobreviven': sobreviven, 'estrechez': estrechez,
                      'publica': publica,
                      'expulsados': [c['empresa'] for c, _ in atipicos]})

    print('  %s' % nombre)
    print('     propuestas %2d · con lectura %2d · atipicas %d · sobreviven %2d'
          % (propuesto, len(filas), len(atipicos), sobreviven))
    print('     estrechez %s  →  %s'
          % (('%.2f' % estrechez) if estrechez is not None else 'no medible',
             'PUBLICA' if publica else 'NO publica'))
    if atipicos:
        for c, z in sorted(atipicos, key=lambda x: -x[1]):
            print('        fuera: %-34s (se desvia %.1f MAD)' % (c['empresa'][:34], z))
    print()

# ── EL VEREDICTO ────────────────────────────────────────────────────────────
pub = [r for r in resultado if r['publica']]
print('=' * 92)
print('  VEREDICTO')
print('=' * 92)
print('  la propuesta decia: %s grupos publicables, %s cuentas'
      % (len([g for g in tax['grupos'] if g.get('publicable')]), tax.get('cuentas_publicables')))
print('  lo medido        : %d grupos publicables, %d cuentas comparables'
      % (len(pub), sum(r['sobreviven'] for r in pub)))
print()
print('  por que caen los demas:')
for r in resultado:
    if r['publica']:
        continue
    if r['sobreviven'] < MIN_COMPARABLES:
        razon = ('solo %d cuenta(s) con lectura de llamadas' % r['conDatos']
                 if r['conDatos'] < MIN_COMPARABLES
                 else 'quedan %d tras sacar %d atipica(s)' % (r['sobreviven'], r['atipicos']))
    else:
        razon = ('dispersion interna %.2f de la cartera: no agrupa' % r['estrechez'])
    print('     %-50s %s' % (r['nombre'][:50], razon))

# ── LO QUE SE DESBLOQUEA PIDIENDO EL EXCEL ─────────────────────────────────
#
# Hay dos razones por las que un grupo no publica, y NO son lo mismo:
#
#   · dispersion >= 1  -> el grupo no agrupa. Eso no lo arregla mas dato: hay
#     que repartir esas cuentas de otra forma, o aceptar que no son comparables.
#   · pocas cuentas con lectura -> el grupo probablemente SI agrupa (varios
#     tienen dispersion buena) y lo unico que falta es el archivo de llamadas.
#
# El segundo caso es una orden de trabajo, no un fracaso: es el Excel por cuenta
# y periodo que los asesores ya pueden pedir. Aqui sale la lista exacta, que es
# el camino mas corto para que el comparativo exista.
porNombre = collections.defaultdict(list)
for g, c in sinDatos:
    porNombre[g].append(c)

casi = [r for r in resultado
        if not r['publica'] and r['estrechez'] is not None and r['estrechez'] < 1.0]
if casi:
    print('\n' + '=' * 92)
    print('  LO QUE SE DESBLOQUEA PIDIENDO EL EXCEL DE LLAMADAS')
    print('=' * 92)
    print('  Estos grupos SI agrupan —su dispersion es menor que la de la cartera—')
    print('  y caen solo porque les faltan cuentas con lectura. El Excel de 3 a 6')
    print('  meses por cuenta las trae. Ordenadas por asesor para que sea una sola')
    print('  peticion por persona.\n')
    total = 0
    for r in sorted(casi, key=lambda x: x['estrechez']):
        faltan = MIN_COMPARABLES - r['sobreviven']
        pendientes = porNombre.get(r['nombre'], [])
        print('  %s' % r['nombre'])
        print('     dispersion %.2f · sobreviven %d · le faltan %d para publicar'
              % (r['estrechez'], r['sobreviven'], max(0, faltan)))
        for c in pendientes:
            print('        pedir: %-34s %s' % (c['empresa'][:34], c.get('asesor') or '(sin asesor)'))
            total += 1
        print()
    print('  %d export(s) por pedir para desbloquear %d grupo(s).' % (total, len(casi)))
    porAsesor = collections.Counter(
        (c.get('asesor') or '(sin asesor)')
        for r in casi for c in porNombre.get(r['nombre'], []))
    print('  por asesor: %s' % ' · '.join('%s %d' % (a, n) for a, n in porAsesor.most_common()))

salida = os.path.join(RAIZ, 'prediccion', 'docs', 'giro-taxonomia-validada.json')
io.open(salida, 'w', encoding='utf-8', newline='\n').write(json.dumps({
    '_que_es': 'La taxonomia propuesta, medida contra el comportamiento telefonico '
               'real. `publica` es el veredicto: un grupo solo publica percentil '
               'si le quedan %d cuentas con lectura Y es mas parejo que la '
               'cartera.' % MIN_COMPARABLES,
    'generado': '2026-10-07',
    'min_comparables': MIN_COMPARABLES,
    'umbral_atipico_mad': UMBRAL_ATIPICO,
    'metricas': CLAVES,
    'vara_cartera': cartera,
    'grupos': resultado,
}, ensure_ascii=False, indent=1))
print('\n  escrito: prediccion/docs/giro-taxonomia-validada.json')
