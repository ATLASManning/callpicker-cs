# -*- coding: utf-8 -*-
u"""A quien afecta CERRAR un mes en el GRC — las cuentas que entran al churn.

   POR QUE EXISTE
   --------------
   `GRC_MES_EN_CURSO` protege al mes vivo: `NOMBRES_CHURN_GRC`
   (`lib/elegibilidad.ts`) lo SALTA, porque Zoho marca «Churn confirmado» a
   todo contrato que todavia no factura y el mes en curso mide retraso de
   cobranza, no bajas. Ver [[regla-churn-mes-vencido]].

   Pero al rotar esa constante al mes siguiente, **el mes anterior deja de
   estar protegido y sus filas entran de golpe**. Eso cambia lo que Atlas le
   dice al modelo sobre una cuenta («aparece como Churn confirmado») y lo que
   `lib/conciliacion.ts` considera baja.

   Entonces: antes de rotar, MEDIR a quien le cae. Si entre los que entran hay
   cuentas que la base da por ACTIVAS, no es un cierre limpio — es la misma
   patologia del mes vivo, un mes mas tarde, y hay que mirarla una por una.

   Es de SOLO LECTURA.

   USO
   ---
       python scripts/mide-cierre-de-mes-grc.py Septiembre
"""
import collections
import io
import json
import os
import re
import sys
import unicodedata
import urllib.parse
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MES = sys.argv[1] if len(sys.argv) > 1 else 'Septiembre'

# Misma normalizacion que `normalizarNombre` de lib/elegibilidad.ts.
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


# ── Las filas del mes, del .ts generado ─────────────────────────────────────
FILA = re.compile(
    r"\{ cliente: '(.*?)', clas: '([^']*)',.*?"
    r"movimiento: '([^']*)', perdido: ([-\d.]+)")
txt = io.open(os.path.join(RAIZ, 'app', 'churn', 'aaa-grc-data.ts'), encoding='utf-8').read()

bloques = {}
for b in re.split(r"\n  \{\n    mes: '", txt)[1:]:
    mes = b.split("'")[0]
    bloques[mes] = FILA.findall(b)

if MES not in bloques:
    print(u'  *** el mes «%s» no esta en aaa-grc-data.ts. Hay: %s'
          % (MES, ', '.join(bloques)))
    sys.exit(1)

filas = bloques[MES]
confirmado = [f for f in filas if 'Churn confirmado' in f[2]]
print(u'  %s: %d filas · %d con «Churn confirmado»' % (MES, len(filas), len(confirmado)))
print(u'  (al rotar GRC_MES_EN_CURSO, estas %d entran a NOMBRES_CHURN_GRC)'
      % len(confirmado))

# ── Contra la cartera ───────────────────────────────────────────────────────
E = {}
for l in io.open(os.path.join(RAIZ, '.env.local'), encoding='utf-8'):
    l = l.strip()
    if '=' in l and not l.startswith('#'):
        k, v = l.split('=', 1)
        E[k.strip()] = v.strip().strip('"')
H = {'apikey': E['SUPABASE_SERVICE_ROLE_KEY'],
     'Authorization': 'Bearer ' + E['SUPABASE_SERVICE_ROLE_KEY'], 'Accept': 'application/json'}
q = urllib.parse.urlencode({'select': 'empresa,consecutivo,asesor,estado,facturacion',
                            'limit': 1000})
req = urllib.request.Request(E['NEXT_PUBLIC_SUPABASE_URL'] + '/rest/v1/cuentas?' + q, headers=H)
cuentas = json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
porn = {}
for c in cuentas:
    porn.setdefault(norma(c.get('empresa')), c)

VIVAS = ('activo', 'en_riesgo')
tocadas, vivas = [], []
for cli, clas, mov, per in confirmado:
    c = porn.get(norma(cli))
    if not c:
        continue
    tocadas.append((cli, float(per), c))
    if str(c.get('estado')) in VIVAS:
        vivas.append((cli, float(per), c))

print(u'\n  de esas %d, %d cruzan con una cuenta de la cartera'
      % (len(confirmado), len(tocadas)))
print(u'  y %d de ellas la base las da por VIVAS (activo o en_riesgo)' % len(vivas))

if vivas:
    print(u'\n  *** ÉSTAS ENTRARÍAN COMO CHURN ESTANDO VIVAS ***')
    print(u'  Atlas diría de ellas «aparece como Churn confirmado». Mirar una')
    print(u'  por una antes de dar el cierre por bueno.\n')
    print(u'      %-34s %-7s %-11s %-10s %s'
          % (u'cliente (GRC)', u'cons.', u'estado', u'perdido', u'asesor'))
    for cli, per, c in sorted(vivas, key=lambda x: -x[1]):
        print(u'      %-34s %-7s %-11s $%-9s %s'
              % (cli[:34], c.get('consecutivo') or '', c.get('estado'),
                 format(int(per), ',d'), c.get('asesor')))
else:
    print(u'\n  ninguna de las que entran está viva en la base: el cierre es limpio.')

# Y las que SÍ están de baja, que es lo que el cierre debe capturar.
bajas = [t for t in tocadas if str(t[2].get('estado')) not in VIVAS]
print(u'\n  las otras %d ya figuran de baja o dormidas en la base '
      u'(eso es lo que el cierre viene a capturar):' % len(bajas))
for cli, per, c in sorted(bajas, key=lambda x: -x[1])[:12]:
    print(u'      %-34s %-7s %-11s $%s'
          % (cli[:34], c.get('consecutivo') or '', c.get('estado'),
             format(int(per), ',d')))
