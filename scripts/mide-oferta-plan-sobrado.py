# -*- coding: utf-8 -*-
u"""Para cuantas cuentas de «paga mas de lo que usa» se puede proponer QUE ofrecer.

   USO
   ---
       python scripts/mide-oferta-plan-sobrado.py

   LA PREGUNTA QUE CONTESTA
   ------------------------
   Direccion pide (26 nov 2026) que las alertas de subutilizacion vayan
   PRIMERAS y que el asesor no lea «contactar al cliente» sino la jugada
   concreta: este cliente paga $5,000 y usa el 20%, tiene Comunicacion
   Empresarial, llevalo a Visibilidad y Control y metele Chat para que lo que
   pague sea lo que use, con holgura.

   Esa frase necesita CUATRO datos por cuenta —cuanto paga, que porcentaje usa,
   que peldano tiene y cual es la oferta siguiente— y los cuatro viven en
   `data/crecimiento-escalera.json`. Si para una cuenta falta alguno, la accion
   NO se inventa: se escribe que falta. [[feedback-contexto-ia-sin-huecos]]

   POR ESO ESTO EXISTE
   -------------------
   Antes de prometer «la cola dira que ofrecer», hay que saber a cuantas
   alcanza. Una cobertura de 40 sobre 91 no invalida la funcion, pero cambia lo
   que se puede decir de ella — y callarlo la convertiria en una pantalla que
   enseña consejos para unas cuentas y silencio para otras sin explicar por que.

   Y LA ESCALERA TIENE FECHA
   -------------------------
   `crecimiento-escalera.json` lo genera un corte. Esta sonda publica su fecha
   de archivo: un consejo de producto calculado sobre un corte viejo puede
   recomendar justo lo que el cliente ya contrato.
   [[feedback-fuentes-semanales-snapshot]]
"""
import collections
import datetime
import io
import json
import os
import sys
import urllib.error
import urllib.request

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Los cinco tipos de la condicion `consumo`: todos son «usa menos de lo que
# paga», en distinto grado. Direccion los trata como una sola clase.
SUBUTILIZACION = ('plan_sobrado', 'uso_bajo', 'caida_consumo',
                  'consumo_cero', 'desplome_consumo')


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
                  % (e.code, tabla, e.read().decode('utf-8', 'replace')[:180]))
            sys.exit(1)
        filas.extend(lote)
        if len(lote) < 1000:
            return filas
        desde += 1000


ruta = os.path.join(RAIZ, 'data', 'crecimiento-escalera.json')
if not os.path.exists(ruta):
    print(u'  *** no existe data/crecimiento-escalera.json. Sin el no hay oferta')
    print(u'      que proponer, y eso NO se rellena inventando. ***')
    sys.exit(2)

edad = datetime.date.fromtimestamp(os.path.getmtime(ruta))
esc = json.load(io.open(ruta, encoding='utf-8')).get('cuentas') or []
porCuenta = {}
for f in esc:
    if f.get('cuenta_id'):
        porCuenta[str(f['cuenta_id'])] = f

sla = trae('alertas_sla',
           'episodio_id,cuenta_id,condicion,tipo,severidad,estado,'
           'mrr_en_riesgo,empresa,consecutivo')
objetivo = [s for s in sla
            if s['tipo'] in SUBUTILIZACION and s['estado'] != 'cerrada']

print('')
print(u'  «PAGA MAS DE LO QUE USA» — LA CLASE QUE DIRECCION QUIERE PRIMERO')
print(u'  ' + '-' * 68)
print(u'    compromisos de la clase      %d' % len(objetivo))
dinero = sum(float(s['mrr_en_riesgo']) for s in objetivo
             if s.get('mrr_en_riesgo') is not None)
conImporte = sum(1 for s in objetivo if s.get('mrr_en_riesgo') is not None)
print(u'    MRR en riesgo                $%s  (%d de %d con importe)'
      % (format(int(dinero), ',d'), conImporte, len(objetivo)))
print(u'    escalera de producto         %d cuentas, archivo del %s'
      % (len(porCuenta), edad.isoformat()))
print('')

# ── La cobertura, dato por dato ───────────────────────────────────────────
print(u'  ¿ALCANZA LA ESCALERA PARA DECIR QUE OFRECER?')
print(u'  ' + '-' * 68)
CAMPOS = [('peldano', u'peldano actual'), ('oferta', u'oferta siguiente'),
          ('pct_consumo', u'% de consumo'), ('monto_ultimo_corte', u'lo que paga'),
          ('plan_ultimo_corte', u'plan contratado')]
sinFila = [s for s in objetivo if str(s['cuenta_id']) not in porCuenta]
conFila = [s for s in objetivo if str(s['cuenta_id']) in porCuenta]
print(u'    sin fila en la escalera      %d' % len(sinFila))
for campo, nombre in CAMPOS:
    faltan = [s for s in conFila
              if porCuenta[str(s['cuenta_id'])].get(campo) in (None, '', 0)]
    print(u'    sin `%-20s` %d' % (campo + '`', len(faltan)))

completas = [s for s in conFila
             if all(porCuenta[str(s['cuenta_id'])].get(c) not in (None, '')
                    for c, _ in CAMPOS)]
print('')
print(u'    LAS CUATRO PIEZAS COMPLETAS  %d de %d   (%.0f%%)'
      % (len(completas), len(objetivo),
         100.0 * len(completas) / len(objetivo) if objetivo else 0))
print(u'    las otras %d NO llevan oferta: la pantalla tiene que decir que falta'
      % (len(objetivo) - len(completas)))

# ── Que jugadas saldrian, contadas ────────────────────────────────────────
print('')
print(u'  LAS JUGADAS QUE SALDRIAN, CONTADAS (no una muestra elegida a mano)')
print(u'  ' + '-' * 68)
jugadas = collections.Counter()
for s in completas:
    f = porCuenta[str(s['cuenta_id'])]
    jugadas[(str(f.get('peldano')), str(f.get('oferta')))] += 1
for (pel, of), n in jugadas.most_common(12):
    print(u'    %-14s → %-26s %4d' % (pel, of, n))

# ── Las diez mas caras, que son las que se atienden primero ───────────────
print('')
print(u'  LAS DIEZ MAS CARAS DE LA CLASE')
print(u'  ' + '-' * 68)
caras = sorted([s for s in objetivo if s.get('mrr_en_riesgo') is not None],
               key=lambda s: -float(s['mrr_en_riesgo']))[:10]
for s in caras:
    f = porCuenta.get(str(s['cuenta_id'])) or {}
    pct = f.get('pct_consumo')
    pctxt = (u'%.0f%%' % pct) if isinstance(pct, (int, float)) else u'sin medir'
    print(u'    %-7s %-30s $%-10s usa %-10s %s'
          % (s.get('consecutivo') or '?', (s.get('empresa') or '?')[:30],
             format(int(float(s['mrr_en_riesgo'])), ',d'), pctxt,
             f.get('oferta') or u'— sin oferta en la escalera —'))
print('')
