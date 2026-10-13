# -*- coding: utf-8 -*-
u"""Toda la evidencia de UNA cuenta, para escribir su auditoria.

   Reune en una corrida lo que antes costaba seis guiones sueltos: la ficha
   entera, las llamadas con su serie y sus destinos, los tickets desglosados,
   los episodios de alerta y la prosa (reuniones, seguimientos, observaciones).

   NO interpreta. Saca los numeros con su fuente para que el expediente se
   escriba contra ellos y no contra lo que dice la pantalla — que es como me
   equivoque dos veces en Torres Corzo.

   Un campo vacio se IMPRIME como vacio: un hueco en la ficha es un hallazgo.

   USO
       python scripts/expediente-datos.py <consecutivo>
       python scripts/expediente-datos.py C1
"""
import io
import os
import re
import sys
import json
import datetime
import collections
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if len(sys.argv) < 2:
    print(__doc__); sys.exit(2)
CONS = sys.argv[1].strip().upper()


def env(c):
    for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
        l = l.strip()
        if l.startswith(c + '='):
            return l.split('=', 1)[1].strip().strip('"').strip("'")


URL = env('NEXT_PUBLIC_SUPABASE_URL')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
CAB = {'apikey': KEY, 'Authorization': 'Bearer ' + KEY}


def trae(ruta):
    r = urllib.request.Request(URL + '/rest/v1/' + ruta, headers=CAB)
    try:
        return json.loads(urllib.request.urlopen(r, timeout=90).read().decode('utf-8'))
    except Exception as e:
        print(u'  *** %s -> %s' % (ruta.split('?')[0], e))
        return []


# ── 1 · LA FICHA ───────────────────────────────────────────────────────────
f = trae('cuentas?select=*&consecutivo=eq.' + CONS)
if not f:
    print(u'  *** no encontre el consecutivo %s' % CONS); sys.exit(1)
c = f[0]
CUENTA, CID = c['id'], str(c.get('cid') or '').strip()

print(u'\n  ══ %s · %s ══════════════════════════════════' % (CONS, c.get('empresa')))
print(u'  id %s · CID %s' % (CUENTA, CID))

vacios = []
for k in sorted(c):
    v = c[k]
    if v is None or (isinstance(v, str) and not v.strip()) or v in ([], {}):
        vacios.append(k); continue
    s = json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else str(v)
    print(u'  %-26s %s' % (k, s[:300] + (u' …' if len(s) > 300 else u'')))
print(u'\n  VACIOS (%d): %s' % (len(vacios), u', '.join(vacios)))

# ── 2 · LLAMADAS ───────────────────────────────────────────────────────────
print(u'\n  ══ LLAMADAS ════════════════════════════════════════════════')
d = None
for linea in io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8'):
    m = re.match(r'\s*"' + re.escape(CID) + r'":\s*(\{.*\}),\s*$', linea)
    if m:
        d = json.loads(m.group(1)); break
if not d:
    print(u'  SIN LECTURA de llamadas para el CID %s.' % CID)
else:
    e, s = d.get('ent') or {}, d.get('sal') or {}
    print(u'  corte %s · hasta %s · mes cerrado %s'
          % (d.get('corte'), d.get('hasta'), d.get('mesCerrado')))
    print(u'  entrantes %s · sin contestar %s (%.2f%%) · ventana %s→%s'
          % (u'{:,}'.format(e.get('total', 0)), u'{:,}'.format(e.get('lost', 0)),
             100.0 * e.get('lost', 0) / max(e.get('total', 1), 1),
             e.get('primera'), e.get('ultima')))
    print(u'  salientes %s · no conectaron %s (%.2f%%)'
          % (u'{:,}'.format(s.get('total', 0)), u'{:,}'.format(s.get('noCon', 0)),
             100.0 * s.get('noCon', 0) / max(s.get('total', 1), 1)))
    print(u'\n  serie mensual (t · perdidas · % · r=persona s=menu v=buzon)')
    for m2, v in sorted((e.get('meses') or {}).items()):
        nota = u'← CERRADO' if m2 == d.get('mesCerrado') else (
            u'parcial' if m2 > (d.get('mesCerrado') or u'') else u'')
        print(u'    %-9s %8s %8s %6.1f%%   r=%-7s s=%-7s v=%-6s %s'
              % (m2, u'{:,}'.format(v['t']), u'{:,}'.format(v['l']),
                 100.0 * v['l'] / v['t'] if v['t'] else 0,
                 u'{:,}'.format(v.get('r', 0)), u'{:,}'.format(v.get('s', 0)),
                 u'{:,}'.format(v.get('v', 0)), nota))
    cer, base = d.get('cerrado'), d.get('base') or {}
    if cer and cer['t'] and base.get('t'):
        pc = 100.0 * cer['l'] / cer['t']
        pb = 100.0 * base['l'] / base['t']
        exceso = cer['l'] - cer['t'] * (base['l'] / float(base['t']))
        print(u'\n  mes cerrado %.4f%% · base propia %.4f%% · DELTA %+.4f pts'
              % (pc, pb, pc - pb))
        print(u'  exceso: %s llamadas perdidas de mas de lo normal' % u'{:,.0f}'.format(exceso))
    print(u'\n  destinos (perdidas · contestadas · minutos · numeros)')
    for x in (e.get('dest') or []):
        tot = x['l'] + x['c']
        print(u'    %-42s %7s %8s %8s %8s   pierde %.1f%%'
              % (x['d'][:42], u'{:,}'.format(x['l']), u'{:,}'.format(x['c']),
                 u'{:,}'.format(x.get('min', 0)),
                 u'n/d' if x.get('n') == -1 else u'{:,}'.format(x.get('n', 0)),
                 100.0 * x['l'] / tot if tot else 0))
    DIAS = [u'lun', u'mar', u'mie', u'jue', u'vie', u'sab', u'dom']  # Python weekday()
    dow, dowL = e.get('dow') or [], e.get('dowL') or []
    if dow:
        print(u'\n  por dia (lunes primero — es `weekday()` de Python)')
        for i in range(7):
            t, l = (dow[i] if i < len(dow) else 0), (dowL[i] if i < len(dowL) else 0)
            if t:
                print(u'    %-4s %8s %8s %6.1f%%'
                      % (DIAS[i], u'{:,}'.format(t), u'{:,}'.format(l), 100.0 * l / t))

# ── 3 · TICKETS ────────────────────────────────────────────────────────────
print(u'\n  ══ TICKETS ═════════════════════════════════════════════════')
tix = json.load(io.open(os.path.join(RAIZ, 'lib', 'tickets-data.json'), encoding='utf-8'))
mios = [x for x in tix if str(x.get('cid') or '').strip() == CID]
print(u'  %d de %s (la fuente solo trae CERRADOS)'
      % (len(mios), u'{:,}'.format(len(tix))))
if mios:
    print(u'  empresas en la mesa: %s' % u', '.join(sorted({x.get('empresa') or u'' for x in mios})))
    mm = collections.Counter(x.get('fecha') or u'?' for x in mios)
    for k in sorted(mm):
        fl = sum(1 for x in mios if x.get('fecha') == k and x.get('es_falla') == 'Si')
        print(u'    %-9s %4d · %d falla(s)' % (k, mm[k], fl))
    print(u'  fallas: %d de %d (%.1f%%)'
          % (sum(1 for x in mios if x.get('es_falla') == 'Si'), len(mios),
             100.0 * sum(1 for x in mios if x.get('es_falla') == 'Si') / len(mios)))
    sub = collections.Counter(x.get('subcategoria') or u'?' for x in mios)
    print(u'  lo que se repite:')
    for k, n in sub.most_common(8):
        print(u'    %-40s %4d (%.1f%%)' % (k[:40], n, 100.0 * n / len(mios)))
    dur = sorted(float(x['duracion_hrs']) for x in mios
                 if x.get('duracion_hrs') not in (None, '', '-'))
    if dur:
        print(u'  duracion: mediana %.1f h · media %.1f h · peor %.0f h (%.0f d) · %d (%.1f%%) >7 dias'
              % (dur[len(dur) // 2], sum(dur) / len(dur), dur[-1], dur[-1] / 24,
                 sum(1 for x in dur if x > 168),
                 100.0 * sum(1 for x in dur if x > 168) / len(dur)))

# ── 4 · PROSA ──────────────────────────────────────────────────────────────
print(u'\n  ══ PROSA ═══════════════════════════════════════════════════')
for campo in ('observaciones_kam', 'notas'):
    v = (c.get(campo) or u'').strip()
    print(u'  %s: %s' % (campo, v if v else u'(VACIO)'))

seg = trae('seguimientos?select=*&cuenta_id=eq.' + CUENTA + '&order=fecha.desc')
print(u'\n  seguimientos: %d' % len(seg))
for x in seg[:10]:
    t = (x.get('descripcion') or u'').replace('\n', ' ')
    print(u'    %s · %-11s · %s' % (str(x.get('fecha'))[:10], x.get('tipo') or u'—',
                                    t[:200] + (u'…' if len(t) > 200 else u'')))

reu = trae('reuniones?select=*&cuenta_id=eq.' + CUENTA + '&order=fecha.desc')
print(u'\n  reuniones: %d' % len(reu))
for x in reu:
    print(u'    %s · %-12s · %s' % (str(x.get('fecha'))[:10], x.get('tipo') or u'—',
                                    (x.get('titulo') or u'')[:70]))
    for k in ('resumen', 'acuerdos', 'proximos_pasos'):
        t = (x.get(k) or u'').replace('\n', ' ').strip()
        if t:
            print(u'        %-15s %s' % (k + ':', t[:300] + (u'…' if len(t) > 300 else u'')))

act = trae('actividades?select=*&cuenta_id=eq.' + CUENTA + '&order=fecha_programada.desc')
print(u'\n  actividades: %d · completadas %d'
      % (len(act), sum(1 for a in act if a.get('completada'))))
for a in act[:8]:
    print(u'    %s · %-12s · ok=%-5s · %s'
          % (str(a.get('fecha_programada'))[:10], a.get('tipo') or u'—',
             a.get('completada'), (a.get('resultado') or u'')[:110]))

rad = trae('radar_respuestas?select=id&cuenta_id=eq.' + CUENTA)
print(u'\n  radar: %d de 12 contestadas' % len(rad))

ad = trae('adopcion_producto?select=producto,nivel,fecha,notas&cuenta_id=eq.' + CUENTA)
print(u'  adopcion: %d registro(s)' % len(ad))
for x in ad:
    print(u'    %-28s %-7s %s · %s' % (x.get('producto'), x.get('nivel'),
                                       x.get('fecha'), (x.get('notas') or u'')[:120]))

# ── 5 · ALERTAS ────────────────────────────────────────────────────────────
ep = trae('alertas_episodios?select=condicion,tipo,abierto_en,condicion_desde,'
          'severidad_actual,severidad_peor,recurrencia,evidencia_actual'
          '&cuenta_id=eq.' + CUENTA + '&estado=eq.abierta')
print(u'\n  ══ ALERTAS ABIERTAS · %d ═══════════════════════════════════' % len(ep))
for x in ep:
    print(u'  %-10s %-24s desde %s · sev %s (peor %s)'
          % (x.get('condicion'), x.get('tipo'),
             x.get('condicion_desde') or x.get('abierto_en'),
             x.get('severidad_actual'), x.get('severidad_peor')))
    print(u'      %s' % (x.get('evidencia_actual') or u'')[:220])
