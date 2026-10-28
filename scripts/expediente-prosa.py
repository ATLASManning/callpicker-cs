# -*- coding: utf-8 -*-
u"""LA PROSA DE UNA CUENTA, ENTERA Y SIN RECORTAR.

   `expediente-datos.py` trae los numeros y recorta el texto a 200-300
   caracteres por campo, que es lo correcto para un panorama. Pero un acta de
   reunion de 6,000 caracteres recortada a 300 no es un resumen: es la primera
   frase, y escribir una auditoria contra la primera frase es inventarse el
   resto. [[feedback-contexto-ia-sin-huecos]]

   Esto saca, sin recortar: observaciones y notas de la ficha, los
   seguimientos, las reuniones con resumen/acuerdos/proximos_pasos, las
   actividades con su resultado, y la evidencia de cada alerta — abierta o
   cerrada.

   Imprime el tamaño de cada bloque para que se vea que entro completo, y
   enumera `i/N` para que se note si falta alguno.

   Las credenciales salen de `.env.local` y NO se imprimen.

   USO
       python scripts/expediente-prosa.py F16
       python scripts/expediente-prosa.py F16 --alertas-cerradas
"""
import io
import os
import sys
import json
import urllib.request
import urllib.parse

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if len(sys.argv) < 2:
    print(__doc__); sys.exit(2)
CONS = sys.argv[1].strip().upper()
TODAS_ALERTAS = '--alertas-cerradas' in sys.argv


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


def bloque(rotulo, texto):
    u"""Un campo vacio se DICE vacio: el hueco es el hallazgo, no un silencio."""
    t = (texto or u'').strip()
    if not t:
        print(u'    %-16s (VACIO)' % (rotulo + ':'))
        return
    print(u'    %-16s [%s caracteres]' % (rotulo + ':', u'{:,}'.format(len(t))))
    for linea in t.splitlines():
        print(u'      %s' % linea.rstrip())


f = trae('cuentas?select=id,empresa,cid,consecutivo,asesor,observaciones_kam,notas'
         '&consecutivo=eq.' + CONS)
if not f:
    print(u'  *** no encontre el consecutivo %s' % CONS); sys.exit(1)
c = f[0]
CUENTA = c['id']

print(u'\n  ══ PROSA COMPLETA · %s · %s ══════════════════════'
      % (CONS, c.get('empresa')))
print(u'  CID %s · asesor %s' % (c.get('cid'), c.get('asesor')))

print(u'\n  ── FICHA ───────────────────────────────────────────────────')
bloque(u'observaciones_kam', c.get('observaciones_kam'))
bloque(u'notas', c.get('notas'))

# ── REUNIONES ──────────────────────────────────────────────────────────────
reu = trae('reuniones?select=*&cuenta_id=eq.' + CUENTA + '&order=fecha.desc')
print(u'\n  ── REUNIONES · %d ──────────────────────────────────────────' % len(reu))
for i, x in enumerate(reu, 1):
    print(u'\n  [%d/%d] %s · %s · %s'
          % (i, len(reu), str(x.get('fecha'))[:10], x.get('tipo') or u'—',
             x.get('titulo') or u'(sin titulo)'))
    for k in ('duracion_min', 'participantes', 'origen', 'creado_por'):
        if x.get(k):
            print(u'    %-16s %s' % (k + ':', x[k]))
    for k in ('resumen', 'acuerdos', 'proximos_pasos', 'notas'):
        if k in x:
            bloque(k, x.get(k))

# ── SEGUIMIENTOS ───────────────────────────────────────────────────────────
seg = trae('seguimientos?select=*&cuenta_id=eq.' + CUENTA + '&order=fecha.desc')
print(u'\n  ── SEGUIMIENTOS · %d ───────────────────────────────────────' % len(seg))
for i, x in enumerate(seg, 1):
    print(u'\n  [%d/%d] %s · %s' % (i, len(seg), str(x.get('fecha'))[:10],
                                    x.get('tipo') or u'—'))
    for k in ('asunto', 'titulo'):
        if x.get(k):
            print(u'    %-16s %s' % (k + ':', x[k]))
    bloque(u'descripcion', x.get('descripcion'))

# ── ACTIVIDADES ────────────────────────────────────────────────────────────
act = trae('actividades?select=*&cuenta_id=eq.' + CUENTA
           + '&order=fecha_programada.desc')
print(u'\n  ── ACTIVIDADES · %d ────────────────────────────────────────' % len(act))
for i, x in enumerate(act, 1):
    print(u'\n  [%d/%d] %s · %s · completada=%s'
          % (i, len(act), str(x.get('fecha_programada'))[:10],
             x.get('tipo') or u'—', x.get('completada')))
    for k in ('titulo', 'descripcion', 'resultado'):
        if k in x:
            bloque(k, x.get(k))

# ── ALERTAS ────────────────────────────────────────────────────────────────
#
# La evidencia de una alerta es la unica parte del motor escrita en prosa, y es
# la que explica POR QUE esta abierta. Recortarla deja el titulo sin el dato.
filtro = u'' if TODAS_ALERTAS else u'&estado=eq.abierta'
ep = trae('alertas_episodios?select=*&cuenta_id=eq.' + CUENTA + filtro
          + '&order=abierto_en.desc')
print(u'\n  ── ALERTAS · %d (%s) ───────────────────────────────────────'
      % (len(ep), u'todas' if TODAS_ALERTAS else u'solo abiertas'))
for i, x in enumerate(ep, 1):
    print(u'\n  [%d/%d] %s · %s · %s'
          % (i, len(ep), x.get('condicion'), x.get('tipo'), x.get('estado')))
    print(u'    abierta %s · condicion desde %s · cerrada %s'
          % (str(x.get('abierto_en'))[:10], str(x.get('condicion_desde'))[:10],
             str(x.get('cerrado_en'))[:10] if x.get('cerrado_en') else u'—'))
    print(u'    severidad %s (peor %s) · recurrencia %s · movimiento %s'
          % (x.get('severidad_actual'), x.get('severidad_peor'),
             x.get('recurrencia'), x.get('movimiento') or u'—'))
    for k in ('evidencia_actual', 'evidencia_peor', 'nota'):
        if k in x:
            bloque(k, x.get(k))

print(u'')
