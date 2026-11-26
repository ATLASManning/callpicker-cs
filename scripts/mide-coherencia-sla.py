# -*- coding: utf-8 -*-
u"""Las tres coherencias del SLA que NINGUNA restriccion vigila.

   USO
   ---
       python scripts/mide-coherencia-sla.py

   POR QUE EXISTE, Y POR QUE NO VA EN EL .sql
   ------------------------------------------
   Los renglones 4, 5 y 6 de `migracion-alertas-sla-verifica.sql` preguntan por
   estas tres cosas, pero ese archivo hay que pegarlo a mano en el editor de
   Supabase porque los otros diez renglones leen el CATALOGO de Postgres
   —`pg_policies`, `pg_trigger`, `pg_constraint`— y PostgREST no lo sirve.

   Estas tres NO. Son `public.alertas_sla`, `public.sla_config`,
   `public.alertas_sla_bitacora` y `public.cuentas_ediciones`: tablas normales
   que la llave de servicio lee por REST. O sea que esperar a que alguien pegue
   SQL para medirlas era pereza mia, no una limitacion.

   LAS TRES PUEDEN SALIR DISTINTAS DE CERO, QUE ES EL PUNTO
   --------------------------------------------------------
   La primera version de esos renglones preguntaba por `fecha_limite IS NULL`
   (columna NOT NULL), por un `sla_id` huerfano (FK con CASCADE) y por un
   `diff` vacio (CHECK `diff_no_vacio`). Los tres salieron verdes y los tres
   eran imposibles de falsear: un «ok» que regala el esquema.
   [[feedback-verificar-antes-asegurar]] [[feedback-probar-al-reves]]

     4. Una condicion que alerta y no tiene fila en `sla_config`. `condicion`
        es TEXT suelto, sin FK. Su compromiso nace SIN RELOJ, y el panel lo lee
        como atendido por omision — un cero que nadie midio.
        [[feedback-cero-sin-medicion]]
     5. Un asiento de bitacora firmado contra una cuenta distinta de la del
        compromiso. El registro de quien respondio por que cuenta acusaria a la
        cuenta equivocada.
     6. Evidencia colgada de un compromiso de OTRA cuenta. Es la regla central
        del encargo —la evidencia va «registrada en la misma cuenta»— y son dos
        FK independientes que nadie obliga a coincidir.

   CONTROL POSITIVO
   ----------------
   Si una tabla viene vacia, su cero NO cuenta como aprobado: se dice que no se
   midio. Tres tablas vacias darian «ninguna incoherencia» con la misma cara
   que un sistema sano.
"""
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
       aqui subestimaria toda incoherencia que viviera despues de la fila mil."""
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


CERRADAS = ('cerrada', 'rechazada')

sla = trae('alertas_sla', 'id,cuenta_id,condicion,estado,empresa,consecutivo')
cfg = trae('sla_config', 'condicion')
bit = trae('alertas_sla_bitacora', 'id,sla_id,cuenta_id,evento')
edi = trae('cuentas_ediciones', 'id,cuenta_id,alerta_sla_id')

porsla = dict((s['id'], s) for s in sla)
condiciones = set(c['condicion'] for c in cfg)

fallan, sinmedir = 0, 0
print('')
print(u'  LAS TRES COHERENCIAS QUE NINGUNA RESTRICCION VIGILA')
print(u'  ' + '-' * 68)
print(u'    poblacion: %d compromisos, %d condiciones configuradas,' % (len(sla), len(cfg)))
print(u'               %d asientos de bitacora, %d ediciones de ficha'
      % (len(bit), len(edi)))
print('')


def veredicto(n, titulo, universo, malas, detalle):
    global fallan, sinmedir
    if not universo:
        sinmedir += 1
        print(u'    %d. %s' % (n, titulo))
        print(u'       *** SIN MEDIR: la tabla esta vacia. Su cero no es un')
        print(u'           aprobado, es que no habia nada que mirar. ***')
        print('')
        return
    if malas:
        fallan += 1
        print(u'    %d. %s' % (n, titulo))
        print(u'       *** %d de %d INCOHERENTES ***' % (len(malas), universo))
        for linea in detalle(malas):
            print(u'         %s' % linea)
    else:
        print(u'    %d. %s' % (n, titulo))
        print(u'       0 de %d   ok' % universo)
    print('')


# ── 4 · condicion sin plazo: el compromiso nace sin reloj ─────────────────
abiertos = [s for s in sla if s['estado'] not in CERRADAS]
sinplazo = [s for s in abiertos if s['condicion'] not in condiciones]
veredicto(4, u'compromisos ABIERTOS cuya condicion no esta en sla_config',
          len(abiertos), sinplazo,
          lambda m: [u'%s · %s · condicion `%s`'
                     % (x.get('consecutivo') or '?', (x.get('empresa') or '?')[:34],
                        x['condicion'])
                     for x in m[:12]])

# ── 5 · asiento firmado contra otra cuenta ────────────────────────────────
conSla = [b for b in bit if b.get('sla_id') and b.get('cuenta_id')]
cruzados = [b for b in conSla
            if b['sla_id'] in porsla
            and b['cuenta_id'] != porsla[b['sla_id']]['cuenta_id']]
veredicto(5, u'asientos de bitacora cuya cuenta NO es la del compromiso',
          len(conSla), cruzados,
          lambda m: [u'asiento %s (evento %s) firma la cuenta %s, el compromiso '
                     u'es de %s' % (x['id'][:8], x.get('evento'),
                                    x['cuenta_id'][:8],
                                    porsla[x['sla_id']]['cuenta_id'][:8])
                     for x in m[:12]])

# ── 6 · la regla central: la evidencia va en la MISMA cuenta ──────────────
conAlerta = [e for e in edi if e.get('alerta_sla_id')]
ajenas = [e for e in conAlerta
          if e['alerta_sla_id'] in porsla
          and e['cuenta_id'] != porsla[e['alerta_sla_id']]['cuenta_id']]
veredicto(6, u'evidencia (edicion) colgada de un compromiso de OTRA cuenta',
          len(conAlerta), ajenas,
          lambda m: [u'edicion %s sobre la cuenta %s cierra un compromiso de %s'
                     % (x['id'][:8], x['cuenta_id'][:8],
                        porsla[x['alerta_sla_id']]['cuenta_id'][:8])
                     for x in m[:12]])

print(u'  ' + '=' * 68)
if fallan:
    print(u'  *** %d coherencia(s) ROTA(S). ***' % fallan)
elif sinmedir:
    print(u'  Lo que habia que mirar, coherente. Pero %d de las tres NO SE'
          % sinmedir)
    print(u'  MIDIERON por falta de filas: eso no es verde, es pendiente.')
else:
    print(u'  Las tres coherentes, y las tres sobre poblacion real.')
print('')
sys.exit(1 if fallan else 0)
