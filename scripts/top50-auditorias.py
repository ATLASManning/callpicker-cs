# -*- coding: utf-8 -*-
u"""El TOP 50 por facturacion, y cuales ya tienen auditoria.

   El TOP se saca de la FACTURACION de `cuentas`, que es la misma fuente que
   usa el tablero para «esTop». No se inventa un criterio nuevo.

   Cruza contra `app/auditoria/registry.ts` por CONSECUTIVO —que es como el
   registro las ata— y no por nombre: «NERUC Sede Central» en cartera es
   «Grupo Neruc» en otras fuentes, y cruzar por nombre ya mezclo cuentas.

   Marca ademas si la cuenta tiene LECTURA DE LLAMADAS, porque es lo que
   decide si se le puede auditar la atencion telefonica o solo lo comercial.

   USO
       python scripts/top50-auditorias.py [N]
"""
import io
import os
import re
import sys
import json
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
N = int(sys.argv[1]) if len(sys.argv) > 1 else 50


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
vivas.sort(key=lambda c: -float(c.get('facturacion') or 0))
top = vivas[:N]

# Las auditorias, por consecutivo.
reg = io.open(os.path.join(RAIZ, 'app', 'auditoria', 'registry.ts'), encoding='utf-8').read()
conAud = {}
for m in re.finditer(r"id:\s*'([^']+)'[^}]*?consecutivos:\s*\[([^\]]*)\]", reg):
    for c in re.findall(r"'([^']+)'", m.group(2)):
        conAud[c.upper()] = m.group(1)

# Quien tiene lectura de llamadas.
ll = io.open(os.path.join(RAIZ, 'app', 'cuentas', 'llamadas-data.ts'), encoding='utf-8').read()
conLlamadas = set(re.findall(r'^\s*"([^"]+)":\s*\{', ll, re.M))

print(u'\n  TOP %d POR FACTURACION · $%s al mes\n'
      % (N, u'{:,.0f}'.format(sum(float(c.get('facturacion') or 0) for c in top))))
print(u'  %-3s %-6s %-36s %-9s %11s %-6s %s'
      % (u'#', u'cons', u'cuenta', u'asesor', u'$/mes', u'llam', u'auditoria'))
print(u'  ' + u'─' * 104)
sin_aud, sin_aud_mrr = [], 0.0
for i, c in enumerate(top, 1):
    cons = (c.get('consecutivo') or u'').upper()
    aud = conAud.get(cons)
    tiene_ll = str(c.get('cid') or '').strip() in conLlamadas
    if not aud:
        sin_aud.append(c)
        sin_aud_mrr += float(c.get('facturacion') or 0)
    print(u'  %-3d %-6s %-36s %-9s %11s %-6s %s'
          % (i, cons or u'—', (c.get('empresa') or u'')[:36], c.get('asesor') or u'—',
             u'{:,.0f}'.format(float(c.get('facturacion') or 0)),
             u'si' if tiene_ll else u'NO', aud or u'*** sin auditoria'))

print(u'\n  %d de %d ya tienen expediente · faltan %d, $%s al mes'
      % (N - len(sin_aud), N, len(sin_aud), u'{:,.0f}'.format(sin_aud_mrr)))
con_ll = [c for c in sin_aud if str(c.get('cid') or '').strip() in conLlamadas]
print(u'  de las que faltan, %d YA tienen lectura de llamadas: se les puede'
      % len(con_ll))
print(u'  auditar la atencion telefonica y no solo lo comercial.')
