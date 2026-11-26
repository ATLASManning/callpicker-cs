# -*- coding: utf-8 -*-
u"""Que nacio en la primera corrida: compromisos por condicion, severidad y plazo.

   USO
   ---
       python scripts/mide-compromisos-sla.py

   POR QUE EXISTE
   --------------
   La corrida publico «nuevos: 240» sobre 702 episodios abiertos. Un numero asi
   no se entrega solo: o se explica el denominador o parece que 462 episodios se
   quedaron sin reloj por un fallo. El filtro es `esIndicioDeBaja` —instruccion
   de direccion del 16 nov 2026: las alertas son exclusivamente sobre indicios
   que puedan favorecer una baja o un downgrade—, pero eso hay que MEDIRLO, no
   citarlo. [[feedback-cero-sin-medicion]]

   Tambien publica el reparto de fechas limite. Si todas cayeran el mismo dia,
   el semaforo nacería entero en un color y la cola no serviria para priorizar.
"""
import collections
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def env(clave):
    p = os.path.join(RAIZ, '.env.local')
    if not os.path.exists(p):
        return None
    for ln in io.open(p, encoding='utf-8'):
        ln = ln.strip()
        if ln.startswith(clave + '='):
            return ln.split('=', 1)[1].strip().strip('"').strip("'")
    return None


URL = (env('NEXT_PUBLIC_SUPABASE_URL') or '').rstrip('/')
KEY = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not KEY:
    print(u'  *** faltan credenciales en .env.local. No se midio nada. ***')
    sys.exit(2)


def trae(tabla, select, filtro=''):
    u"""Pagina de mil en mil: PostgREST corta en 1000 y un corte silencioso
       aqui subestimaria todo lo que sigue."""
    filas, desde = [], 0
    while True:
        url = u'%s/rest/v1/%s?select=%s&limit=1000&offset=%d%s' % (
            URL, tabla, select, desde, filtro)
        req = urllib.request.Request(url)
        req.add_header('apikey', KEY)
        req.add_header('Authorization', 'Bearer ' + KEY)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                lote = json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            print(u'  *** HTTP %s al leer %s: %s'
                  % (e.code, tabla, e.read().decode('utf-8', 'replace')[:160]))
            sys.exit(1)
        filas.extend(lote)
        if len(lote) < 1000:
            return filas
        desde += 1000


eps = trae('alertas_episodios', 'id,condicion,tipo,dueno,estado',
           '&estado=eq.abierta')
sla = trae('alertas_sla',
           'episodio_id,condicion,tipo,severidad,severidad_base,ajustes,'
           'estado,fecha_limite,generada_en,dueno,mrr_en_riesgo')

con_compromiso = set(x['episodio_id'] for x in sla)

print('')
print(u'  EL DENOMINADOR, QUE ES LO QUE HAY QUE EXPLICAR')
print(u'  ' + '-' * 68)
print(u'    episodios ABIERTOS           %d' % len(eps))
print(u'    con compromiso abierto       %d' % len(sla))
print(u'    SIN compromiso               %d' % (len(eps) - len(con_compromiso)))
print('')
print(u'  POR QUE NO TIENEN: el filtro es `esIndicioDeBaja(tipo)`, instruccion')
print(u'  de direccion del 16 nov 2026. Los tipos que se quedan fuera, contados:')
print(u'  ' + '-' * 68)
fuera = collections.Counter()
for e in eps:
    if e['id'] not in con_compromiso:
        fuera[(e['condicion'], e['tipo'])] += 1
for (cond, tipo), n in fuera.most_common(20):
    print(u'    %-14s %-28s %4d' % (cond, tipo, n))
if len(fuera) > 20:
    print(u'    ... y %d combinaciones mas' % (len(fuera) - 20))

print('')
print(u'  LOS 240 QUE SI, POR CONDICION')
print(u'  ' + '-' * 68)
porcond = collections.Counter(c['condicion'] for c in sla)
for cond, n in porcond.most_common():
    print(u'    %-14s %4d' % (cond, n))

print('')
print(u'  LOS 240 QUE SI, POR TIPO — que es lo que de verdad dice QUE pasa')
print(u'  ' + '-' * 68)
print(u'  La condicion agrupa para escalar; el TIPO es el hallazgo. Dentro de')
print(u'  `consumo` caben «dejo de llamar» y «paga mucho mas de lo que usa»,')
print(u'  que no son el mismo problema ni se atienden igual.')
portipo = collections.Counter()
dinerotipo = collections.defaultdict(float)
medibles = collections.Counter()
for c in sla:
    portipo[(c['condicion'], c['tipo'])] += 1
    if c.get('mrr_en_riesgo') is not None:
        dinerotipo[(c['condicion'], c['tipo'])] += float(c['mrr_en_riesgo'])
        medibles[(c['condicion'], c['tipo'])] += 1
for (cond, tipo), n in portipo.most_common():
    med = medibles[(cond, tipo)]
    importe = (u'$%s' % format(int(dinerotipo[(cond, tipo)]), ',d')) if med else u'sin medir'
    cola = u'' if med == n else u'  (%d de %d con importe)' % (med, n)
    print(u'    %-12s %-26s %4d   %12s%s' % (cond, tipo, n, importe, cola))

print('')
print(u'  POR SEVERIDAD, Y CUANTAS SUBIERON DE NIVEL')
print(u'  ' + '-' * 68)
porsev = collections.Counter(c['severidad'] for c in sla)
subidas = sum(1 for c in sla if c['severidad'] != c['severidad_base'])
for sev in ('critica', 'alta', 'media', 'baja'):
    if porsev.get(sev):
        print(u'    %-10s %4d' % (sev, porsev[sev]))
print(u'    de esas, %d subieron sobre la severidad del catalogo' % subidas)
ajustes = collections.Counter()
for c in sla:
    for a in (c.get('ajustes') or []):
        ajustes[a] += 1
for a, n in ajustes.most_common():
    print(u'      por %-28s %4d' % (a, n))
if not ajustes:
    print(u'      (ningun ajuste aplicado: ninguna cuenta entro al top de su')
    print(u'       cartera ni tiene la condicion `mesa` abierta)')

print('')
print(u'  EL REPARTO DE FECHAS LIMITE')
print(u'  ' + '-' * 68)
porfecha = collections.Counter(str(c['fecha_limite'])[:10] for c in sla)
for f, n in sorted(porfecha.items()):
    print(u'    %-12s %4d' % (f, n))
if len(porfecha) == 1:
    print(u'    *** TODAS el mismo dia: el semaforo nace entero de un color y la')
    print(u'        cola no prioriza nada. Revisar los plazos de sla_config. ***')

print('')
print(u'  EL DINERO EN RIESGO (una vez por compromiso, no por cuenta)')
print(u'  ' + '-' * 68)
conmrr = [c for c in sla if c.get('mrr_en_riesgo') is not None]
total = sum(float(c['mrr_en_riesgo']) for c in conmrr)
print(u'    %d de %d compromisos traen importe · $%s al mes'
      % (len(conmrr), len(sla), format(int(total), ',d')))
if len(conmrr) < len(sla):
    print(u'    los %d sin importe NO se cuentan como cero: no se midieron.'
          % (len(sla) - len(conmrr)))

print('')
print(u'  BLOQUEADAS (dueno distinto de `asesor`: no corren contra nadie)')
print(u'  ' + '-' * 68)
bloq = collections.Counter(c['dueno'] for c in sla if c['estado'] == 'bloqueada')
if bloq:
    for d, n in bloq.most_common():
        print(u'    %-14s %4d' % (d, n))
else:
    print(u'    ninguna')
print('')
