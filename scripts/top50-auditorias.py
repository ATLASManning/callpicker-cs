# -*- coding: utf-8 -*-
u"""El TOP N por facturacion REAL, y cuales ya tienen auditoria.

   POR QUE SE REESCRIBIO (13 oct 2026)
   -----------------------------------
   La primera version ordenaba por `cuentas.facturacion` a secas, diciendo que
   era «la misma fuente que usa el tablero para esTop». Ya no lo es, y las tres
   primeras auditorias del TOP 50 lo demostraron cada una por su lado:

       Torres Corzo   ficha $316,541   real $272,436
       Tech People    ficha  $59,423   real  $88,783
       OOAPAS         ficha  $38,123   real   $1,078   <- treinta y cinco veces

   OOAPAS figuraba en el puesto 7 de la lista y con su importe real NO pertenece
   al TOP 50: estaba desplazando a una cuenta que si opera. O sea que el orden
   por el que se estaban escribiendo las auditorias era el equivocado, y no por
   poco.

   LA REGLA ES LA DEL TABLERO, NO UNA CUARTA
   -----------------------------------------
   Se replica `importeDeCuenta()` de `lib/facturacion-cuenta.ts`, que es la
   puerta unica desde el 6 oct 2026 y nacio justo de tener tres reglas
   conviviendo:

       1. GRC por CID (suma de `mrrFin` de sus filas), si da > 0   -> 'grc'
       2. si no, `cuentas.facturacion` si da > 0                   -> 'cuentas'
       3. si no, no se sabe                                        -> 'sin_dato'

   Inventar aqui un cuarto criterio seria volver a abrir lo que esa puerta
   cerro. [[feedback-fuente-unica-cuentas]]

   UN «SIN DATO» NO ES UN CERO, Y POR ESO SALE APARTE
   --------------------------------------------------
   Las cuentas sin importe en ninguna fuente no se mandan al fondo del ranking
   como si valieran cero: se listan en su propio bloque, porque lo que les pasa
   es que no se sabe cuanto facturan. Una de ellas podria ser grande.
   [[feedback-cero-sin-medicion]]

   Y OJO CON EL CORTE VIGENTE. El GRC del 11 oct pone en CERO las 13 lineas
   activas de GTC marcandolas «Churn confirmado · sin_verificar». GTC ademas no
   cruza por CID (sus 19 lineas no lo traen), asi que cae por la regla 2 a la
   ficha. Mientras eso no se concilie, cualquier ranking que salga de aqui lleva
   esa advertencia. Ver [[grupo-gtc-torres-corzo]].

   Cruza las auditorias por CONSECUTIVO —que es como `registry.ts` las ata— y
   nunca por nombre: «NERUC Sede Central» en cartera es «Grupo Neruc» en otras
   fuentes, y cruzar por nombre ya mezclo cuentas.

   USO
       python scripts/top50-auditorias.py [N]
       python scripts/top50-auditorias.py 50 --cambios   # quien entra y sale
"""
import io
import os
import re
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = [a for a in sys.argv[1:] if not a.startswith('--')]
N = int(args[0]) if args else 50
CAMBIOS = '--cambios' in sys.argv


def env(clave):
    for linea in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        linea = linea.strip()
        if linea.startswith(clave + '='):
            return linea.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
r = urllib.request.Request(
    URL + '/rest/v1/cuentas?select=cid,consecutivo,empresa,asesor,estado,facturacion&limit=1000',
    headers={'apikey': KEY, 'Authorization': 'Bearer ' + KEY})
cuentas = json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))
vivas = [c for c in cuentas if (c.get('estado') or '').lower() in ('activo', 'en_riesgo')]

# ── EL MAPA DEL GRC, igual que `leer()` de lib/facturacion-cuenta.ts ──────
G = json.load(io.open(os.path.join(RAIZ, 'data', 'grc-zoho.json'), encoding='utf-8'))
por_cid = {}
for f in G.get('filas', []):
    cid = str(f.get('cid') or '').strip()
    if not cid or cid == 'None':
        continue
    p = por_cid.setdefault(cid, {'mrr': 0.0, 'filas': 0, 'agrupadas': 0})
    p['mrr'] += float(f.get('mrrFin') or 0)
    p['filas'] += 1
    if str(f.get('agrupada')).lower() == 'true':
        p['agrupadas'] += 1
print(u'\n  GRC: %s filas, %s CID distintos con importe'
      % (u'{:,}'.format(len(G.get('filas', []))), u'{:,}'.format(len(por_cid))))


def importe(c):
    u"""(mrr, origen) — la misma escalera que `importeDeCuenta()`."""
    propio = float(c.get('facturacion') or 0)
    cid = str(c.get('cid') or '').strip()
    g = por_cid.get(cid) if cid else None
    if g and g['mrr'] > 0:
        return g['mrr'], u'grc'
    if propio > 0:
        return propio, u'ficha'
    return 0.0, u'sin_dato'


for c in vivas:
    c['_mrr'], c['_origen'] = importe(c)

medibles = [c for c in vivas if c['_origen'] != u'sin_dato']
sin_dato = [c for c in vivas if c['_origen'] == u'sin_dato']
medibles.sort(key=lambda c: -c['_mrr'])
top = medibles[:N]

# ── las auditorias y las llamadas ────────────────────────────────────────
reg = io.open(os.path.join(RAIZ, 'app', 'auditoria', 'registry.ts'), encoding='utf-8').read()
conAud = {}
for m in re.finditer(r"id:\s*'([^']+)'[^}]*?consecutivos:\s*\[([^\]]*)\]", reg):
    for c in re.findall(r"'([^']+)'", m.group(2)):
        conAud[c.upper()] = m.group(1)

ll = io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8').read()
conLlamadas = set(re.findall(r'^\s*"([^"]+)":\s*\{', ll, re.M))

print(u'\n  TOP %d POR IMPORTE RESUELTO · $%s al mes'
      % (N, u'{:,.0f}'.format(sum(c['_mrr'] for c in top))))
print(u'  (%d de las %d cuentas vivas tienen importe; %d no lo tienen en NINGUNA'
      % (len(medibles), len(vivas), len(sin_dato)))
print(u'   fuente y van en su propio bloque al final — no valen cero.)\n')
print(u'  %-3s %-6s %-34s %-9s %11s %-7s %-5s %s'
      % (u'#', u'cons', u'cuenta', u'asesor', u'$/mes', u'fuente', u'llam', u'auditoria'))
print(u'  ' + u'─' * 112)
sin_aud, sin_aud_mrr = [], 0.0
for i, c in enumerate(top, 1):
    cons = (c.get('consecutivo') or u'').upper()
    aud = conAud.get(cons)
    tiene_ll = str(c.get('cid') or '').strip() in conLlamadas
    if not aud:
        sin_aud.append(c)
        sin_aud_mrr += c['_mrr']
    # Se marca cuando la ficha y el GRC se separan mucho: es donde hay trabajo
    # de facturacion, y donde una auditoria escrita contra la ficha mentiria.
    propio = float(c.get('facturacion') or 0)
    señal = u''
    if c['_origen'] == u'grc' and propio > 0 and abs(c['_mrr'] - propio) / max(propio, 1) > 0.10:
        señal = u'  (ficha dice %s)' % u'{:,.0f}'.format(propio)
    print(u'  %-3d %-6s %-34s %-9s %11s %-7s %-5s %s%s'
          % (i, cons or u'—', (c.get('empresa') or u'')[:34], c.get('asesor') or u'—',
             u'{:,.0f}'.format(c['_mrr']), c['_origen'],
             u'si' if tiene_ll else u'NO', aud or u'*** SIN AUDITORIA', señal))

# ── DE QUE FUENTE CUELGA EL ORDEN ─────────────────────────────────────────
# El ranking se publica con su propia fiabilidad al lado. Una lista ordenada
# por una cifra que sabemos mala no se puede leer como si fuera firme, y decir
# «TOP 50» sin decir sobre que descansa es la forma educada de ocultarlo.
# [[feedback-tablas-deben-cerrar]] · [[feedback-kpi-con-fuente]]
de_grc = [c for c in top if c['_origen'] == u'grc']
de_ficha = [c for c in top if c['_origen'] == u'ficha']
print(u'\n  ══ SOBRE QUE DESCANSA ESTE ORDEN ══════════════════════════')
print(u'  %2d de %d vienen del GRC por CID   $%s   <- firme'
      % (len(de_grc), N, u'{:,.0f}'.format(sum(c['_mrr'] for c in de_grc))))
print(u'  %2d de %d vienen de `cuentas.facturacion`  $%s'
      % (len(de_ficha), N, u'{:,.0f}'.format(sum(c['_mrr'] for c in de_ficha))))
print(u'     ^ esa columna se desvio en las TRES auditorias escritas hasta hoy')
print(u'       (316,541/272,436 · 59,423/88,783 · 38,123/1,078). Donde dice')
print(u'       «ficha» el puesto es PROVISIONAL: el GRC no cruza por CID y el')
print(u'       importe puede moverse en cualquier direccion al conciliarlo.')
assert len(de_grc) + len(de_ficha) == len(top), u'el reparto por fuente no cierra'

print(u'\n  %d de %d ya tienen expediente · faltan %d, $%s al mes'
      % (N - len(sin_aud), N, len(sin_aud), u'{:,.0f}'.format(sin_aud_mrr)))
con_ll = [c for c in sin_aud if str(c.get('cid') or '').strip() in conLlamadas]
print(u'  de las que faltan, %d YA tienen lectura de llamadas: se les puede' % len(con_ll))
print(u'  auditar la atencion telefonica y no solo lo comercial.')
if sin_aud:
    sig = sin_aud[0]
    print(u'\n  LA SIGUIENTE: #%d  %s · %s · %s · $%s al mes%s'
          % (top.index(sig) + 1, (sig.get('consecutivo') or u'?').upper(),
             sig.get('empresa'), sig.get('asesor') or u'—',
             u'{:,.0f}'.format(sig['_mrr']),
             u'' if str(sig.get('cid') or '').strip() in conLlamadas
             else u'  — SIN lectura de llamadas'))

# ── Las que no se pueden ordenar porque no se sabe cuanto facturan ───────
if sin_dato:
    print(u'\n  ══ SIN IMPORTE EN NINGUNA FUENTE · %d cuenta(s) ═══════════' % len(sin_dato))
    print(u'  No entran al ranking porque no se sabe donde van, NO porque')
    print(u'  valgan cero. Cualquiera de estas podria pertenecer al TOP.')
    for c in sorted(sin_dato, key=lambda x: (x.get('asesor') or u'', x.get('empresa') or u'')):
        cons = (c.get('consecutivo') or u'').upper()
        print(u'    %-6s %-34s %-9s cid=%-8s %s'
              % (cons or u'—', (c.get('empresa') or u'')[:34], c.get('asesor') or u'—',
                 str(c.get('cid') or u'—'),
                 conAud.get(cons) or u'sin auditoria'))

# ── Quien entra y quien sale respecto del orden viejo ────────────────────
if CAMBIOS:
    viejo = sorted(vivas, key=lambda c: -float(c.get('facturacion') or 0))[:N]
    v = {(c.get('consecutivo') or u'').upper() for c in viejo}
    n = {(c.get('consecutivo') or u'').upper() for c in top}
    print(u'\n  ══ QUE CAMBIA CONTRA EL ORDEN VIEJO (ficha a secas) ═══════')
    print(u'  SALEN del TOP %d (%d):' % (N, len(v - n)))
    for c in viejo:
        k = (c.get('consecutivo') or u'').upper()
        if k in v - n:
            mrr, orig = importe(c)
            print(u'    %-6s %-34s ficha %10s  real %10s (%s)'
                  % (k, (c.get('empresa') or u'')[:34],
                     u'{:,.0f}'.format(float(c.get('facturacion') or 0)),
                     u'{:,.0f}'.format(mrr), orig))
    print(u'  ENTRAN al TOP %d (%d):' % (N, len(n - v)))
    for c in top:
        k = (c.get('consecutivo') or u'').upper()
        if k in n - v:
            print(u'    %-6s %-34s ficha %10s  real %10s (%s)'
                  % (k, (c.get('empresa') or u'')[:34],
                     u'{:,.0f}'.format(float(c.get('facturacion') or 0)),
                     u'{:,.0f}'.format(c['_mrr']), c['_origen']))
