# -*- coding: utf-8 -*-
u"""Qué cuentas con asesor NO tienen lectura de llamadas, y POR QUÉ no la tienen.

   POR QUE EXISTE
   --------------
   Dirección, 10 oct 2026: «dame el listado de las cuentas asignadas a los
   asesores que no tienen data de llamadas, para solicitar la información y
   actualizar al 100%».

   Una lista de nombres a secas no sirve para pedir nada, porque **«no tiene
   data» tiene cuatro causas distintas y sólo UNA se arregla pidiendo el
   Excel**:

     1. `sin_archivo`    el CID no está en la entrega. Esto SÍ se pide.
     2. `cid_invalido`   la cuenta no trae CID, o trae `0`, que es un hueco y
                         no un CID. Por mucho Excel que llegue, no va a cruzar:
                         se arregla en la ficha, no con el proveedor.
     3. `poco_volumen`   sí está medida, pero con menos de 30 llamadas en toda
                         la ventana. `lib/llamadas-resumen.ts` devuelve `null`
                         a propósito: por debajo de eso no hay con qué concluir.
                         Pedir el archivo otra vez no cambiaría nada.
     4. `solo_ficha`     la ficha SÍ le pinta llamadas pero el motor no la ve.
                         Son dos caminos de búsqueda distintos, ver abajo.

   SON DOS FUENTES Y DOS BÚSQUEDAS, Y CONFUNDIRLAS YA COSTÓ
   --------------------------------------------------------
   - **Ficha** (`app/cuentas/llamadas-data.ts`, el panel «Atención de
     llamadas»): `conciliar()` busca por CID y, si falla, **por nombre
     normalizado**.
   - **Motor** (`data/analisis-llamadas.json` vía `lib/llamadas-resumen.ts`):
     alimenta `fuentesDetalle.llamadas`, las candidaturas y las alertas.
     Busca **SÓLO por CID**, descarta `cid === '0'` y exige >= 30 entrantes.

   O sea que una cuenta puede tener el panel lleno y aun así contar como «sin
   llamadas» para el motor. Esa diferencia es un hallazgo, no un detalle.

   NO SE REPLICA LA LÓGICA: SE COMPRUEBA CONTRA PRODUCCIÓN
   -------------------------------------------------------
   La normalización de nombres se toma del GENERADOR (`gen-llamadas-data.py`),
   que es el que escribió el campo `norm` del archivo — no es una réplica, es
   el original. Y al final la clasificación se contrasta contra
   `fuentesDetalle.llamadas` que publica `/api/alertas/veredictos`, que corre
   el TypeScript de verdad. Si las dos no coinciden, el script lo dice y sale
   con 1: una lista que no cuadra con lo que ve el tablero no se entrega.

   USO
   ---
       python scripts/mide-cobertura-llamadas.py
       python scripts/mide-cobertura-llamadas.py --csv D:\\Archivos\\faltantes.csv
"""
import argparse
import base64
import csv
import gzip
import hashlib
import hmac
import io
import json
import os
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_WEB = 'https://callpicker-cs.vercel.app'
VOLUMEN_MINIMO = 30          # el mismo de lib/llamadas-resumen.ts

ap = argparse.ArgumentParser()
ap.add_argument('--csv', default=None, help='escribe el listado a un .csv')
ap.add_argument('--sin-vivo', action='store_true',
                help='omite el contraste contra produccion (no recomendado)')
args = ap.parse_args()


# ── Credenciales: se LEEN y no se imprimen nunca ────────────────────────────
def entorno():
    e = {}
    with io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8') as f:
        for linea in f:
            linea = linea.strip()
            if '=' in linea and not linea.startswith('#'):
                k, v = linea.split('=', 1)
                e[k.strip()] = v.strip().strip('"')
    return e


E = entorno()
H_SUPA = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
          'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'],
          'Accept': 'application/json'}
B_SUPA = E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/'


def supa(tabla, params):
    """POR PÁGINAS: PostgREST corta en 1000 filas y devuelve 200 sin avisar."""
    filas, desde, paso = [], 0, 1000
    while True:
        q = dict(params)
        q['limit'] = paso
        q['offset'] = desde
        r = urllib.request.Request(B_SUPA + tabla + '?' + urllib.parse.urlencode(q),
                                   headers=H_SUPA)
        with urllib.request.urlopen(r, timeout=120) as x:
            lote = json.loads(x.read().decode())
        filas.extend(lote)
        if len(lote) < paso:
            return filas
        desde += paso


# ── La normalización ORIGINAL, copiada del generador ────────────────────────
# `lib/llamadas-cuenta.ts` dice de su `normalizarNombre`: «Misma normalización
# que el generador (scripts/gen-llamadas-data.py)». O sea que el Python es la
# fuente, no la copia.
RAZON = (r'\b(s\.?a\.?p\.?i\.?|s\.?a\.?|s\.?\s?de\s?r\.?l\.?|c\.?v\.?|'
         r'de\s?c\.?v\.?|sc|sofom|e\.?n\.?r\.?|spr|rl)\b')


def norma(s):
    s = unicodedata.normalize('NFD', str(s or ''))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn').lower()
    s = s.replace('&', ' y ')
    s = re.sub(r'[.,()\-_/]', ' ', s)
    s = re.sub(RAZON, ' ', s)
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def cid_util(v):
    """Un CID que sirve para buscar. `0` y el vacío NO son CIDs, son huecos."""
    s = re.sub(r'\D', '', str(v or '').strip())
    return s if s and s != '0' else ''


# ── Las dos fuentes ─────────────────────────────────────────────────────────
def lee_ficha():
    """`app/cuentas/llamadas-data.ts` → {cid: {norm, corte}}."""
    ruta = os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts')
    txt = io.open(ruta, encoding='utf-8').read()
    # EL ANCLA LLEVA LOS DOS PUNTOS Y EL TIPO A PROPÓSITO.
    # `export const LLAMADAS[^=]*=` casa ANTES con `export const LLAMADAS_META`,
    # que está declarado más arriba en el mismo archivo. Eso devolvía el objeto
    # de metadatos —12 claves: corte, mesCerrado, meses…— y el script seguía
    # tan tranquilo clasificando 222 cuentas contra él. Habría entregado una
    # lista con total aplomo y completamente falsa.
    m = re.search(r'export\s+const\s+LLAMADAS\s*:\s*Record\s*<[^>]*>\s*=\s*', txt)
    if not m:
        print(u'  *** no se encuentra `export const LLAMADAS: Record<…>` en llamadas-data.ts')
        sys.exit(1)
    ini = txt.index('{', m.end())
    prof, fin = 0, None
    for i in range(ini, len(txt)):
        if txt[i] == '{':
            prof += 1
        elif txt[i] == '}':
            prof -= 1
            if prof == 0:
                fin = i + 1
                break
    if fin is None:
        print(u'  *** el objeto LLAMADAS no cierra.')
        sys.exit(1)
    crudo = txt[ini:fin]
    # El generador deja una coma colgando antes de la llave final; JSON no la
    # admite. No es un parche cosmético: sin esto `json.loads` revienta y el
    # script no mediría nada.
    crudo = re.sub(r',\s*}\s*$', '}', crudo)
    d = json.loads(crudo)
    # ¿ES lo que creo que es? El ancla ya falló una vez y devolvió los
    # metadatos sin que nada chistara. Un parser que agarra el objeto
    # equivocado y sigue adelante es el peor de los fallos: produce una lista
    # completa y falsa. Se exige la FORMA del dato, no sólo que haya parseado.
    malas = [k for k, v in list(d.items())[:20] if not isinstance(v, dict) or 'cid' not in v]
    if malas or len(d) < 50:
        print(u'  *** lo parseado no son cuentas de llamadas: %d claves, '
              u'%d sin forma de cuenta (%s)'
              % (len(d), len(malas), u', '.join(malas[:5])))
        sys.exit(1)
    return d


def lee_amplia():
    """`data/analisis-llamadas.json` → {cid: entrantes_totales}."""
    ruta = os.path.join(RAIZ, 'data', 'analisis-llamadas.json')
    d = json.load(io.open(ruta, encoding='utf-8'))
    out = {}
    for cid, c in (d.get('cuentas') or {}).items():
        ent = (c.get('ent') or {})
        out[str(cid)] = int(ent.get('total') or 0)
    return out


# ── Producción, para contrastar ─────────────────────────────────────────────
def token():
    b64 = lambda x: base64.urlsafe_b64encode(x).rstrip(b'=').decode()
    now = int(time.time())
    cab = b64(json.dumps({'alg': 'HS256', 'typ': 'JWT'}, separators=(',', ':')).encode())
    cue = b64(json.dumps({'email': 'josel@callpicker.com', 'nombre': 'JM', 'rol': 'admin',
                          'asesor_nombre': None, 'iat': now, 'exp': now + 3600},
                         separators=(',', ':')).encode())
    return cab + '.' + cue + '.' + b64(
        hmac.new(E['JWT_SECRET'].encode(), (cab + '.' + cue).encode(), hashlib.sha256).digest())


def api(ruta):
    r = urllib.request.Request(BASE_WEB + ruta)
    r.add_header('Cookie', 'cp_session=' + token())
    r.add_header('Accept-Encoding', 'gzip')
    r.add_header('Cache-Control', 'no-cache')
    with urllib.request.urlopen(r, timeout=600) as x:
        b = x.read()
        if (x.headers.get('Content-Encoding') or '').lower() == 'gzip':
            b = gzip.decompress(b)
    return json.loads(b.decode('utf-8', 'replace'))


# ════════════════════════════════════════════════════════════════════════════
print(u'  1 · cartera de Supabase …')
cuentas = supa('cuentas', {
    'select': 'id,cid,empresa,asesor,estado,facturacion',
    'asesor': 'not.is.null',
    'order': 'empresa',
})
cuentas = [c for c in cuentas if str(c.get('asesor') or '').strip()]
print(u'      %d cuentas con asesor asignado' % len(cuentas))
por_estado = {}
for c in cuentas:
    k = str(c.get('estado') or 'sin estado')
    por_estado[k] = por_estado.get(k, 0) + 1
print(u'      por estado: %s'
      % u' · '.join(u'%s %d' % (k, v) for k, v in sorted(por_estado.items(),
                                                         key=lambda kv: -kv[1])))

print(u'\n  2 · las dos fuentes de llamadas …')
ficha = lee_ficha()
amplia = lee_amplia()
print(u'      ficha  (llamadas-data.ts)      %d cuentas' % len(ficha))
print(u'      motor  (analisis-llamadas.json) %d cuentas' % len(amplia))
solo_en_una = set(ficha) ^ set(amplia)
print(u'      CIDs en una y no en la otra: %d' % len(solo_en_una))
por_norma = {}
for cid, d in ficha.items():
    por_norma.setdefault(str(d.get('norm') or ''), cid)

# ── Clasificación ───────────────────────────────────────────────────────────
print(u'\n  3 · clasificando …')
filas = []
for c in cuentas:
    cid = cid_util(c.get('cid'))
    empresa = str(c.get('empresa') or '').strip()
    ent = amplia.get(cid, None) if cid else None
    en_ficha = (cid in ficha) if cid else False
    if not en_ficha:
        n = norma(empresa)
        en_ficha = bool(n) and n in por_norma

    if not cid:
        clase, motivo = 'cid_invalido', u'la ficha no trae CID (o trae 0)'
    elif ent is None and not en_ficha:
        clase, motivo = 'sin_archivo', u'el CID no viene en ninguna entrega'
    elif ent is None and en_ficha:
        clase, motivo = 'solo_ficha', u'cruza por nombre en la ficha, no por CID en el motor'
    elif ent < VOLUMEN_MINIMO:
        clase, motivo = 'poco_volumen', u'medida, pero %d llamadas (<%d)' % (ent, VOLUMEN_MINIMO)
    else:
        clase, motivo = 'con_datos', u''
    filas.append({
        'asesor': str(c.get('asesor') or '').strip(),
        'empresa': empresa,
        'cid': str(c.get('cid') or '').strip(),
        'estado': str(c.get('estado') or ''),
        'mrr': c.get('facturacion'),
        'entrantes': ent if ent is not None else '',
        'clase': clase,
        'motivo': motivo,
        'id': c.get('id'),
    })

CLASES = ['sin_archivo', 'cid_invalido', 'poco_volumen', 'solo_ficha', 'con_datos']
conteo = {k: sum(1 for f in filas if f['clase'] == k) for k in CLASES}
assert sum(conteo.values()) == len(filas), u'la clasificacion no cierra'
print(u'      %s' % u' · '.join(u'%s %d' % (k, conteo[k]) for k in CLASES))
print(u'      suma %d = %d cuentas (cierra)' % (sum(conteo.values()), len(filas)))

# ── El contraste con producción ─────────────────────────────────────────────
if not args.sin_vivo:
    print(u'\n  4 · contraste contra /api/alertas/veredictos …')
    ver = api('/api/alertas/veredictos')
    vivo = {}
    for r in (ver.get('cuentas') or ver.get('rows') or []):
        d = (r.get('datos') or {})
        fd = (d.get('fuentesDetalle') or {})
        if 'llamadas' in fd:
            vivo[str(r.get('cid') or '').strip()] = bool(fd['llamadas'])
    print(u'      el tablero publica la bandera para %d cuentas' % len(vivo))
    # El motor sólo evalúa activo/en_riesgo, así que se compara ese subconjunto.
    desacuerdos = []
    comparadas = 0
    for f in filas:
        k = f['cid']
        if k not in vivo:
            continue
        comparadas += 1
        mio = f['clase'] == 'con_datos'
        if mio != vivo[k]:
            desacuerdos.append((f['empresa'], k, f['clase'], vivo[k]))
    print(u'      comparadas %d · desacuerdos %d' % (comparadas, len(desacuerdos)))
    if desacuerdos:
        print(u'\n      *** MI CLASIFICACIÓN NO COINCIDE CON EL TABLERO ***')
        for emp, k, clase, v in desacuerdos[:25]:
            print(u'        %-34s CID %-8s yo=%-12s tablero=%s'
                  % (emp[:34], k, clase, u'con datos' if v else u'sin datos'))
        print(u'\n      No se entrega una lista que no cuadra con lo que ve el tablero.')
        sys.exit(1)
    print(u'      coinciden las %d: la clasificación es la del tablero.' % comparadas)

# ── El listado ──────────────────────────────────────────────────────────────
PEDIR = ('sin_archivo',)
ARREGLAR = ('cid_invalido',)
INFORMA = ('poco_volumen', 'solo_ficha')

ETQ = {
    'sin_archivo':  u'SE PIDE EL EXCEL — el CID no viene en ninguna entrega',
    'cid_invalido': u'SE ARREGLA EN LA FICHA — sin CID no hay con qué cruzar',
    'poco_volumen': u'YA ESTÁ MEDIDA — volumen por debajo del mínimo para concluir',
    'solo_ficha':   u'CRUZA POR NOMBRE — el panel la pinta, el motor no la ve',
}

# LAS VIVAS PRIMERO, Y LAS MUERTAS APARTE.
# Pedirle al proveedor el Excel de una cuenta cancelada es gastar la petición:
# el motor de alertas ni siquiera la evalúa —sólo mira activo y en_riesgo— y
# una Dormida no va a usar el análisis. La lista se parte para que la petición
# salga acotada a lo que sirve.
VIVAS = ('activo', 'en_riesgo')

for grupo in (PEDIR, ARREGLAR, INFORMA):
    for clase in grupo:
        sel = [f for f in filas if f['clase'] == clase]
        if not sel:
            continue
        vivas = [f for f in sel if f['estado'] in VIVAS]
        print(u'\n  ══ %s ══' % ETQ[clase])
        est = {}
        for f in sel:
            est[f['estado']] = est.get(f['estado'], 0) + 1
        print(u'     %d cuenta(s): %s' % (
            len(sel), u' · '.join(u'%s %d' % (k, v)
                                  for k, v in sorted(est.items(), key=lambda kv: -kv[1]))))
        print(u'     DE ÉSAS, %d están vivas (activo o en_riesgo) y %d no.'
              % (len(vivas), len(sel) - len(vivas)))
        if clase == 'sin_archivo' and vivas:
            fac = sum(f['mrr'] for f in vivas if isinstance(f['mrr'], (int, float)))
            print(u'     Las vivas facturan $%s al mes entre todas.'
                  % format(int(fac), ',d'))
        por_asesor = {}
        for f in sel:
            por_asesor.setdefault(f['asesor'], []).append(f)
        for asesor in sorted(por_asesor):
            g = sorted(por_asesor[asesor],
                       key=lambda x: (x['estado'] not in VIVAS, x['empresa'].lower()))
            nv = sum(1 for x in g if x['estado'] in VIVAS)
            print(u'\n     %s — %d (%d vivas)' % (asesor, len(g), nv))
            for f in g:
                mrr = f['mrr']
                smrr = (u'$%s' % format(int(mrr), ',d')) if isinstance(mrr, (int, float)) else u'sin MRR'
                print(u'       %-38s CID %-9s %-11s %-11s %s'
                      % (f['empresa'][:38], f['cid'] or u'(vacío)',
                         f['estado'], smrr, f['motivo']))

if args.csv:
    pedir = [f for f in filas if f['clase'] in PEDIR + ARREGLAR + INFORMA]
    with io.open(args.csv, 'w', encoding='utf-8-sig', newline='') as fh:
        w = csv.writer(fh)
        w.writerow(['asesor', 'empresa', 'cid', 'estado', 'mrr',
                    'entrantes_medidas', 'clase', 'que_hacer'])
        for f in sorted(pedir, key=lambda x: (x['clase'], x['asesor'], x['empresa'].lower())):
            w.writerow([f['asesor'], f['empresa'], f['cid'], f['estado'],
                        f['mrr'], f['entrantes'], f['clase'], f['motivo']])
    print(u'\n  csv con las %d que requieren acción: %s' % (len(pedir), args.csv))

print(u'\n  ── RESUMEN ────────────────────────────────────────────────')
tot = len(filas)
print(u'     %d cuentas con asesor' % tot)
print(u'     %d con lectura de llamadas (%.0f%%)'
      % (conteo['con_datos'], 100.0 * conteo['con_datos'] / tot))
pedir_vivas = [f for f in filas if f['clase'] == 'sin_archivo' and f['estado'] in VIVAS]
print(u'     %d hay que PEDIR, y de ésas %d son cuentas vivas'
      % (conteo['sin_archivo'], len(pedir_vivas)))
print(u'     %d hay que ARREGLAR en la ficha (CID)' % conteo['cid_invalido'])
print(u'     %d ya medidas, sin volumen suficiente' % conteo['poco_volumen'])
print(u'     %d cruzan por nombre pero no por CID' % conteo['solo_ficha'])
