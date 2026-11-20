# -*- coding: utf-8 -*-
u"""LA BRECHA ENTRE LO QUE EL CLIENTE PAGA Y LO QUE USA, EN TODA LA CARTERA.

   Nace de una peticion de direccion (Daniel Martinez, 19 nov 2026):

     «estoy compartiendo dos clientes de Dan AAA que piden reduccion de su plan
      dado que no estan consumiendo todo lo que tiene su plan en cuanto a
      minutos [...] tenemos que hacer alertas o evidentes estas brechas de
      consumo vs plan contratado [...] los downgrades por este tipo de
      subutilizacion [son] una parte importante de nuestro churn, pero de lo
      cual no estamos tan conscientes ya que lo consideramos como un rescate o
      bien que el cliente solo redujo su plan [...] cada que hace corte y sale
      el nuevo registro de consumos y excedentes, mande alerta si es que el
      consumo de la cuenta del cliente es bajo.»

   LO QUE ESTE GUION CONTESTA, Y POR QUE NO SOBRA AUNQUE LA ALERTA YA EXISTA
   El motor YA tiene `uso_bajo` («Paga mucho mas de lo que usa»). Pero el
   bloque de consumo de `lib/alertas-detectar.ts` es una cadena `if / else if`:
   cada cuenta dispara UNA SOLA alerta de consumo, la primera que casa. Y
   `uso_bajo` es la cuarta de la cadena, con el umbral `usoBajo: 15` — o sea
   «nunca paso del 15% de su plan».

   Consecuencia: una cuenta que usa el 40% de su bolsa de forma estable NO
   dispara nada. No cae, no se desploma, no es cero, no esta por debajo del
   15% y no rebasa el 100%: atraviesa la cadena entera y sale muda. Y esa es
   exactamente la cuenta que puede pedir la mitad de su plan manana.

   Este guion mide esa banda. Clasifica TODA la cartera viva con la MISMA
   cadena del detector —para que los totales cierren contra el— y saca aparte
   las que salen mudas, que son las que direccion no esta viendo.

   LO QUE NO HACE
   No escribe nada, no abre episodios y no propone un plan concreto por cuenta:
   la bolsa no es lo unico que se factura (hay extensiones y DIDs), asi que el
   dinero que calcula es un TECHO de exposicion, no una prediccion de cuanto
   bajaria la factura. Se dice en la salida, no se deja que el lector lo
   suponga.

   USO
       python scripts/mide-brecha-plan.py
       python scripts/mide-brecha-plan.py --asesor Dan
       python scripts/mide-brecha-plan.py --umbral 50   # pico maximo, en %

   Las credenciales se leen de `.env.local` y NO se imprimen.
"""
import io
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from plan_minutos_py import (RAIZ, abre_corte, base_minutos, celda, mes, num,  # noqa: E402
                             BOLSA_MINIMA, MINUTOS_POR_EXTENSION)

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# ── Las constantes del detector se LEEN de su .ts, no se copian ────────────
# Mismo motivo que en `plan_minutos_py`: un umbral espejeado a mano deja de
# ser espejo en cuanto alguien toca el original, y entonces este guion dice
# que una cuenta esta muda cuando el motor si la ve.
import re  # noqa: E402
_DET = io.open(os.path.join(RAIZ, 'lib', 'alertas-detectar.ts'), encoding='utf-8').read()
_BLOQUE = re.search(r'export const UMBRALES\s*=\s*\{(.+?)\}\s*as const', _DET, re.S)
if not _BLOQUE:
    print(u'  *** lib/alertas-detectar.ts ya no exporta UMBRALES. No se mide.')
    raise SystemExit(2)
U = {}
for k, v in re.findall(r'(\w+)\s*:\s*([0-9.]+)', _BLOQUE.group(1)):
    U[k] = float(v)
for k in ('mesesCaida', 'caidaMinima', 'consumoMinimoParaMirar', 'desplomeDesde',
          'desplomeHasta', 'usoBajo', 'consumoCero', 'rebase'):
    if k not in U:
        print(u'  *** UMBRALES ya no trae «%s». No se mide con un numero inventado.' % k)
        raise SystemExit(2)
VENTANA = 5      # `.slice(-5)` en el detector
MINIMO = 3       # `if (pcts.length < 3)` en el detector

# ── El OTRO umbral, el de la ficha. Tambien se lee ─────────────────────────
# La subutilizacion YA se mide y YA se publica, pero en otro sitio y con otro
# numero: `lib/alertas-veredicto.ts` enciende la tarjeta «Esta pagando por
# minutos que no usa» por debajo del 40%, en la clase `entrega` («Para
# ensenarle»), que el 16 nov 2026 dejo de ser alarma por instruccion de
# direccion. El detector, en cambio, abre alerta por debajo del 15%.
#
# DOS REGLAS SOBRE EL MISMO HECHO Y CON DISTINTO NUMERO: entre esos dos
# umbrales hay una banda donde la ficha de la cuenta dice que el cliente paga
# minutos que no usa y la lista de alertas no dice nada. Medir esa banda es el
# objeto de este bloque; dejarla sin medir seria opinar sobre su tamano.
_VER = io.open(os.path.join(RAIZ, 'lib', 'alertas-veredicto.ts'), encoding='utf-8').read()
_TIT = u'Está pagando por minutos que no usa'
_i = _VER.find(_TIT)
_m = re.search(r'consumoPct\s*<\s*([0-9.]+)', _VER[max(0, _i - 400):_i]) if _i >= 0 else None
if not _m:
    print(u'  *** no se encontro el umbral de «%s» en lib/alertas-veredicto.ts.\n'
          u'      O la tarjeta cambio de texto, o cambio de regla. No se mide a ciegas.' % _TIT)
    raise SystemExit(2)
UMBRAL_FICHA = float(_m.group(1))

ASESOR = None
UMBRAL_PICO = 50.0
for i, a in enumerate(sys.argv):
    if a == '--asesor' and i + 1 < len(sys.argv):
        ASESOR = sys.argv[i + 1]
    if a == '--umbral' and i + 1 < len(sys.argv):
        UMBRAL_PICO = float(sys.argv[i + 1])

# ── Cartera ────────────────────────────────────────────────────────────────
env = {}
for line in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    line = line.strip()
    if '=' in line and not line.startswith('#'):
        k, v = line.split('=', 1)
        env[k.strip()] = v.strip().strip('"')
URL = env['NEXT_PUBLIC_SUPABASE_URL']
KEY = env.get('SUPABASE_SERVICE_ROLE_KEY') or env['SUPABASE_SERVICE_KEY']
r = urllib.request.Request(
    URL + '/rest/v1/cuentas?select=id,consecutivo,empresa,asesor,estado,cid,facturacion'
          '&limit=1000',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
with urllib.request.urlopen(r, timeout=180) as x:
    cuentas = json.loads(x.read().decode('utf-8', 'replace'))
VIVOS = ('activo', 'en_riesgo')     # lo unico que evalua el motor
vivas = [c for c in cuentas if (c.get('estado') or '') in VIVOS]

# ── El MRR, con la MISMA regla que `importeDeCuenta` ───────────────────────
# GRC por CID si trae mrrFin > 0; si no, lo que diga la ficha; si no, cero.
grc = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
filas_grc = grc.get('filas') if isinstance(grc, dict) else grc
por_cid, banda = {}, {}
for g in filas_grc:
    cid = str(g.get('cid') or '').strip()
    if not cid:
        continue
    por_cid[cid] = por_cid.get(cid, 0.0) + float(g.get('mrrFin') or 0)
    banda.setdefault(cid, g.get('clasif'))


def importe(c):
    cid = str(c.get('cid') or '').strip()
    g = por_cid.get(cid, 0.0)
    if g > 0:
        return g, u'grc'
    propio = float(c.get('facturacion') or 0)
    if propio > 0:
        return propio, u'ficha'
    return 0.0, u'sin_dato'


# ── El corte ───────────────────────────────────────────────────────────────
filas, ix, ruta = abre_corte()
serie = {}
for f in filas:
    cid = str(celda(f, ix, 'CID') or u'').strip()
    if not cid:
        continue
    plan = str(celda(f, ix, 'Nombre del Plan') or u'').strip()
    incl = num(celda(f, ix, 'Minutos Incluidos'))
    cons = num(celda(f, ix, 'Minutos Consumidos'))
    base, origen = base_minutos(plan, incl)
    if not base or base <= 0:
        continue
    serie.setdefault(cid, []).append(
        {'mes': mes(celda(f, ix, 'Fecha de corte')), 'pct': 100.0 * cons / base,
         'plan': plan, 'base': base, 'cons': cons})

meses_corte = sorted({x['mes'] for v in serie.values() for x in v})
print(u'\n  BRECHA ENTRE PLAN CONTRATADO Y CONSUMO REAL')
print(u'  ' + u'=' * 72)
print(u'  corte      : %s' % os.path.relpath(ruta, RAIZ).replace('\\', '/'))
print(u'  periodo    : %s a %s (%d meses en el archivo; el detector mira los %d ultimos)'
      % (meses_corte[0], meses_corte[-1], len(meses_corte), VENTANA))
print(u'  cartera    : %d cuentas vivas de %d en la tabla%s'
      % (len(vivas), len(cuentas), u' · filtrado a %s' % ASESOR if ASESOR else u''))
print(u'  umbrales   : leidos de lib/alertas-detectar.ts — uso bajo <%g%%, '
      u'cero <%g%%, rebase >%g%%' % (U['usoBajo'], U['consumoCero'], U['rebase']))


# ── La MISMA cadena del detector, en el mismo orden ────────────────────────
def clasifica(pcts):
    if len(pcts) < MINIMO:
        return u'sin_consumo_medible'
    ult = pcts[-1]['pct']
    prev = [p['pct'] for p in pcts[:-1]]
    maxprev = max(prev) if prev else 0
    n = int(U['mesesCaida'])
    tramo = [p['pct'] for p in pcts[-n:]]
    bajando = len(tramo) == n and all(tramo[i] < tramo[i - 1] for i in range(1, n))
    caida = ((tramo[0] - ult) / tramo[0]) if (len(tramo) == n and tramo[0] > 0) else 0
    pico = max(p['pct'] for p in pcts)
    if bajando and tramo[0] >= U['consumoMinimoParaMirar'] and caida >= U['caidaMinima']:
        return u'caida_consumo'
    if maxprev >= U['desplomeDesde'] and ult < U['desplomeHasta']:
        return u'desplome_consumo'
    if pico < U['consumoCero']:
        return u'consumo_cero'
    if pico < U['usoBajo']:
        return u'uso_bajo'
    if ult > U['rebase']:
        return u'rebasa_bolsa'
    return u'SIN ALERTA'


cubos, mudas = {}, []
for c in vivas:
    if ASESOR and (c.get('asesor') or '') != ASESOR:
        continue
    cid = str(c.get('cid') or '').strip()
    pcts = sorted(serie.get(cid, []), key=lambda x: x['mes'])[-VENTANA:]
    cls = clasifica(pcts)
    mrr, origen = importe(c)
    cubos.setdefault(cls, []).append((c, mrr))
    if cls == u'SIN ALERTA':
        mudas.append({'c': c, 'mrr': mrr, 'origen': origen, 'pcts': pcts,
                      'pico': max(p['pct'] for p in pcts),
                      'ult': pcts[-1]['pct'], 'plan': pcts[-1]['plan'],
                      'banda': banda.get(cid)})

evaluadas = sum(len(v) for v in cubos.values())
universo = len([c for c in vivas if not ASESOR or (c.get('asesor') or '') == ASESOR])
print(u'\n  QUE ALERTA DE CONSUMO ABRE CADA CUENTA — la cadena es `if/else if`,')
print(u'  asi que cada cuenta cae en UNO y solo un cubo:')
ORDEN = [u'caida_consumo', u'desplome_consumo', u'consumo_cero', u'uso_bajo',
         u'rebasa_bolsa', u'sin_consumo_medible', u'SIN ALERTA']
for k in ORDEN + [k for k in sorted(cubos) if k not in ORDEN]:
    v = cubos.get(k)
    if not v:
        continue
    print(u'    %-22s %4d cuentas   $%12s de MRR'
          % (k, len(v), u'{:,.0f}'.format(sum(m for _, m in v))))
# El total TIENE que cerrar contra el universo, o el cubo «otros» se comio algo.
assert evaluadas == universo, u'los cubos suman %d y la cartera es %d' % (evaluadas, universo)
print(u'    %-22s %4d cuentas   (cierra contra la cartera)' % (u'TOTAL', evaluadas))

print(u'\n  ' + u'=' * 72)
print(u'  LA BANDA QUE NADIE VE: «SIN ALERTA» con consumo medido')
print(u'  Son cuentas con serie medible que atraviesan la cadena entera y no')
print(u'  disparan nada, porque usan MAS del %g%% y MENOS del %g%% de su bolsa.'
      % (U['usoBajo'], U['rebase']))

if not mudas:
    print(u'\n  ninguna. (Si esto sale en un corte con datos, sospechar del filtro.)')
    raise SystemExit(0)

tramos = [(U['usoBajo'], 30), (30, 50), (50, 75), (75, U['rebase'])]
print(u'\n  por PICO de uso en la ventana (el mes que mas uso, que es el que')
print(u'  manda para dimensionar un plan):')
for lo, hi in tramos:
    g = [m for m in mudas if lo <= m['pico'] < hi]
    print(u'    %5.0f%% a %3.0f%%   %3d cuentas   $%12s de MRR'
          % (lo, hi, len(g), u'{:,.0f}'.format(sum(m['mrr'] for m in g))))
resto = [m for m in mudas if m['pico'] >= U['rebase']]
if resto:
    print(u'    >=%3.0f%% (pico)  %3d cuentas   $%12s   — picos sobre la bolsa que'
          u' el ultimo mes no repite' % (U['rebase'], len(resto),
                                         u'{:,.0f}'.format(sum(m['mrr'] for m in resto))))

cand = sorted([m for m in mudas if m['pico'] <= UMBRAL_PICO],
              key=lambda m: -m['mrr'])
expo = sum(m['mrr'] * (1 - m['pico'] / 100.0) for m in cand)
print(u'\n  ' + u'-' * 72)
print(u'  CANDIDATAS A REDUCIR PLAN — pico <= %g%% en los %d cortes de la ventana'
      % (UMBRAL_PICO, VENTANA))
print(u'  %d cuentas · $%s de MRR en juego' % (len(cand), u'{:,.0f}'.format(sum(m['mrr'] for m in cand))))
print(u'  TECHO de exposicion si cada una ajustara su plan a su pico: $%s/mes.'
      % u'{:,.0f}'.format(expo))
print(u'  Es un TECHO, no una prediccion: la bolsa de minutos no es lo unico')
print(u'  que se factura —hay extensiones y DIDs— asi que la factura no baja en')
print(u'  esa proporcion. Sirve para dimensionar el problema, no para cotizar.')
print(u'\n  %-5s %-32s %-8s %-5s %8s  %-7s %s'
      % (u'cons', u'empresa', u'asesor', u'banda', u'MRR', u'pico', u'serie de % por mes'))
for m in cand[:40]:
    c = m['c']
    print(u'  %-5s %-32s %-8s %-5s %8s  %6.0f%%  %s'
          % (c.get('consecutivo') or u'—', (c.get('empresa') or u'')[:32],
             c.get('asesor') or u'—', m['banda'] or u'—',
             u'{:,.0f}'.format(m['mrr']), m['pico'],
             u' → '.join(u'%.0f%%' % p['pct'] for p in m['pcts'])))
if len(cand) > 40:
    print(u'  ... y %d mas. (No se recortan en silencio: aqui esta dicho.)' % (len(cand) - 40))

print(u'\n  por ASESOR, que es quien tiene que trabajar la adopcion:')
pora = {}
for m in cand:
    k = m['c'].get('asesor') or u'sin asesor'
    pora.setdefault(k, []).append(m)
for k in sorted(pora, key=lambda k: -sum(m['mrr'] for m in pora[k])):
    v = pora[k]
    print(u'    %-10s %3d cuentas   $%12s de MRR'
          % (k, len(v), u'{:,.0f}'.format(sum(m['mrr'] for m in v))))

# ── EL DOWNGRADE YA CONSUMADO, QUE EL % NO PUEDE VER ───────────────────────
#
# El hallazgo que obliga a escribir esto: GBS Cuenta Maestra (D6) paso de
# 4,000 minutos a 3,600 y a 2,800 —de «10 cuentas» a «9» y a «7»— DENTRO de
# la ventana medida, y su porcentaje de uso se quedo clavado en el 15%.
#
# No es casualidad: el % se calcula contra la bolsa VIGENTE de cada mes, asi
# que cuando el cliente recorta el plan el denominador baja con el numerador
# y la señal se borra sola. El indicador es ciego justo al evento que tiene
# que detectar. Por eso aqui se mira la BASE, que es un hecho facturado y no
# una proporcion: si la bolsa de un cliente encoge, el downgrade ya ocurrio.
print(u'\n  ' + u'=' * 72)
print(u'  LA FICHA YA LO DICE Y LA ALERTA NO — la banda entre los dos umbrales')
print(u'  La tarjeta «%s» se enciende' % _TIT)
print(u'  por debajo del %.0f%% del ULTIMO corte; el detector abre alerta por' % UMBRAL_FICHA)
print(u'  debajo del %.0f%%. En medio no hay nada que avise.' % U['usoBajo'])
print(u'  OJO: la tarjeta mira UN mes, no la ventana. Un mes flojo la enciende')
print(u'  y un mes bueno la apaga, aunque el ano entero vaya igual.')
muda = []
for c in vivas:
    if ASESOR and (c.get('asesor') or '') != ASESOR:
        continue
    s = sorted(serie.get(str(c.get('cid') or '').strip(), []), key=lambda x: x['mes'])[-VENTANA:]
    if not s:
        continue
    ult = s[-1]['pct']            # exactamente lo que la ficha mira: el ultimo corte
    if ult >= UMBRAL_FICHA:
        continue
    if clasifica(s) != u'SIN ALERTA':
        continue
    mrr, _o = importe(c)
    muda.append({'c': c, 'mrr': mrr, 'ult': ult, 's': s})
muda.sort(key=lambda b: -b['mrr'])
print(u'\n  %d cuentas con la tarjeta ENCENDIDA en su ficha y NINGUNA alerta · $%s de MRR'
      % (len(muda), u'{:,.0f}'.format(sum(b['mrr'] for b in muda))))
print(u'  Para verlas hay que entrar cuenta por cuenta. Nadie las recorre el lunes.')
if muda:
    print(u'\n  %-5s %-30s %-8s %9s %7s  %s'
          % (u'cons', u'empresa', u'asesor', u'MRR', u'ultimo', u'serie de % por mes'))
    for b in muda[:20]:
        c = b['c']
        print(u'  %-5s %-30s %-8s %9s %6.0f%%  %s'
              % (c.get('consecutivo') or u'—', (c.get('empresa') or u'')[:30],
                 c.get('asesor') or u'—', u'{:,.0f}'.format(b['mrr']), b['ult'],
                 u' → '.join(u'%.0f%%' % x['pct'] for x in b['s'])))
    if len(muda) > 20:
        print(u'  ... y %d mas. (No se recortan en silencio: aqui esta dicho.)'
              % (len(muda) - 20))

print(u'\n  ' + u'=' * 72)
print(u'  DOWNGRADES YA CONSUMADOS DENTRO DE LA VENTANA')
print(u'  El %% de uso NO puede verlos: se calcula contra la bolsa vigente de')
print(u'  cada mes, asi que al encoger el plan el porcentaje se queda igual.')
print(u'  Aqui se mira la BASE en minutos, que es un hecho facturado.')
bajaron = []
for c in vivas:
    if ASESOR and (c.get('asesor') or '') != ASESOR:
        continue
    s = sorted(serie.get(str(c.get('cid') or '').strip(), []), key=lambda x: x['mes'])[-VENTANA:]
    if len(s) < 2:
        continue
    bases = [x['base'] for x in s]
    if bases[-1] < bases[0]:
        mrr, _o = importe(c)
        bajaron.append({'c': c, 'mrr': mrr, 's': s,
                        'cae': (bases[0] - bases[-1]) / float(bases[0])})
bajaron.sort(key=lambda b: -b['mrr'])
print(u'\n  %d cuentas con la bolsa MAS CHICA que al inicio de la ventana · $%s de MRR'
      % (len(bajaron), u'{:,.0f}'.format(sum(b['mrr'] for b in bajaron))))
if bajaron:
    print(u'\n  %-5s %-30s %-8s %9s %7s  %s'
          % (u'cons', u'empresa', u'asesor', u'MRR', u'recorte', u'bolsa de minutos por mes'))
    for b in bajaron[:25]:
        c = b['c']
        print(u'  %-5s %-30s %-8s %9s %6.0f%%  %s'
              % (c.get('consecutivo') or u'—', (c.get('empresa') or u'')[:30],
                 c.get('asesor') or u'—', u'{:,.0f}'.format(b['mrr']), 100 * b['cae'],
                 u' → '.join(u'{:,.0f}'.format(x['base']) for x in b['s'])))
    if len(bajaron) > 25:
        print(u'  ... y %d mas. (No se recortan en silencio: aqui esta dicho.)'
              % (len(bajaron) - 25))
    # EL CONTROL, porque una bolsa que encoge tiene DOS explicaciones posibles:
    # que el cliente recortara el plan, o que el nombre del plan dejara de
    # decir sus extensiones y `base_minutos` lo derivara por otra via. Lo
    # segundo no es un downgrade, es un artefacto de la medicion. Se distinguen
    # mirando el NOMBRE: si cambia, el cliente firmo otro plan.
    print(u'\n  CONTROL · ¿recorte del cliente o artefacto del parser? Lo dice el nombre:')
    mudos = []
    for b in bajaron:
        nombres = []
        for x in b['s']:
            if not nombres or nombres[-1] != x['plan']:
                nombres.append(x['plan'])
        if len(nombres) < 2:
            mudos.append(b)
            continue
        print(u'    %-5s %-26s  %s'
              % (b['c'].get('consecutivo') or u'—', (b['c'].get('empresa') or u'')[:26],
                 u'  →  '.join(n[:34] for n in nombres)))
    if mudos:
        print(u'\n    *** %d con la bolsa mas chica y el MISMO nombre de plan todo el'
              u' periodo.' % len(mudos))
        print(u'    Eso NO se puede llamar downgrade: o el corte cambio los minutos')
        print(u'    incluidos sin cambiar el plan, o hay un error de origen. Son:')
        for b in mudos:
            print(u'      %-5s %-30s %s'
                  % (b['c'].get('consecutivo') or u'—', (b['c'].get('empresa') or u'')[:30],
                     u' → '.join(u'{:,.0f}'.format(x['base']) for x in b['s'])))
    else:
        print(u'    Los %d cambian de nombre de plan. Son recortes reales, no del'
              u' parser.' % len(bajaron))

    sin_marca = [b for b in bajaron
                 if clasifica(sorted(serie.get(str(b['c'].get('cid') or '').strip(), []),
                                     key=lambda x: x['mes'])[-VENTANA:]) == u'SIN ALERTA']
    print(u'\n  DE ESAS, %d NO DISPARAN NINGUNA ALERTA DE CONSUMO ($%s de MRR):'
          % (len(sin_marca), u'{:,.0f}'.format(sum(b['mrr'] for b in sin_marca))))
    print(u'  el cliente ya redujo y el tablero no lo dice en ninguna parte.')
    for b in sin_marca[:15]:
        print(u'    %-5s %-32s %-8s %9s'
              % (b['c'].get('consecutivo') or u'—', (b['c'].get('empresa') or u'')[:32],
                 b['c'].get('asesor') or u'—', u'{:,.0f}'.format(b['mrr'])))
