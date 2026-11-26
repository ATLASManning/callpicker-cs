# -*- coding: utf-8 -*-
u"""Comprueba por REST que `migracion-alertas-sla.sql` entro de verdad.

   USO
   ---
       python scripts/verifica-sla-rest.py

   QUE SI PRUEBA, Y QUE NO
   -----------------------
   PostgREST sirve el esquema `public` y NADA del catalogo: `pg_tables`,
   `pg_policies`, `pg_trigger` y `pg_constraint` no se pueden consultar desde
   aqui. O sea que esta sonda **no puede ver los disparadores ni las reglas
   CHECK**, y decir «migracion verificada» con lo que mide seria estirar la
   evidencia. Lo dice al final con esas palabras, en vez de callarlo.

   Lo que SI prueba, y no es poco:

     1. Las seis tablas EXISTEN y responden.
     2. Las semillas estan completas, contadas contra el .sql, no contra un
        numero escrito aqui: si alguien agrega un festivo al archivo, esta
        sonda espera el nuevo total sin tocarla. Un espejo tecleado a mano
        deja de ser espejo. [[feedback-verificar-antes-asegurar]]
     3. Las seis columnas aditivas responden en `seguimientos` y `reuniones`.
        Se piden POR NOMBRE: PostgREST contesta 400 si una no existe, asi que
        un `ADD COLUMN IF NOT EXISTS` que se salto en silencio sale aqui.
     4. EL RLS, medido por COMPORTAMIENTO y no por una bandera. Se pregunta
        con la llave ANON, que es la que tendria un navegador: con RLS
        encendido y cero politicas tiene que devolver CERO filas o un error.
        Si devuelve datos, hay una fuga — y eso es exactamente lo que paso el
        21 oct 2026, cuando encender RLS ACTIVO una politica vieja al rol
        `public` en vez de cerrar nada. [[rls-supabase]]

   CONTROL POSITIVO
   ----------------
   La llave de servicio tiene que PODER leer las mismas tablas. Sin esto, una
   base caida daria «anon no ve nada» y se leeria como candado cerrado.
"""
import io
import json
import os
import re
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
ANON = env('NEXT_PUBLIC_SUPABASE_ANON_KEY')
SERVICE = env('SUPABASE_SERVICE_ROLE_KEY') or env('SUPABASE_SERVICE_KEY')
if not URL or not SERVICE:
    print(u'  *** falta NEXT_PUBLIC_SUPABASE_URL o la llave de servicio en .env.local.')
    print(u'      Sin ellas no hay medicion, y eso NO es un aprobado.')
    sys.exit(2)


# PostgREST contesta **206 Partial Content** cuando se le pide `count=exact` y
# el `limit` no abarca todas las filas. Es EXITO, no fallo: la primera version
# de esta sonda comparaba contra 200 a secas y acuso de «NO RESPONDE» a las
# tres tablas que SI tenian datos, mientras daba por buenas las tres vacias
# —que devuelven 200 justamente porque no hay nada que recortar—. O sea que el
# fallo se veia exactamente al reves de como era.
OK = (200, 206)


def pide(tabla, llave, select='*', limite=1, exacto=False):
    u"""Devuelve (codigo, filas, total). `total` solo si exacto=True."""
    url = u'%s/rest/v1/%s?select=%s&limit=%d' % (URL, tabla, select, limite)
    req = urllib.request.Request(url)
    req.add_header('apikey', llave)
    req.add_header('Authorization', 'Bearer ' + llave)
    if exacto:
        req.add_header('Prefer', 'count=exact')
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            cuerpo = r.read().decode('utf-8')
            total = None
            rango = r.headers.get('Content-Range') or ''
            if '/' in rango:
                cola = rango.split('/')[-1]
                if cola.isdigit():
                    total = int(cola)
            return r.status, json.loads(cuerpo), total
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8', 'replace')[:200], None
    except Exception as e:  # red, DNS, timeout
        return 0, str(e)[:200], None


# ── Las semillas se CUENTAN DEL .sql, no se escriben aqui ──────────────────
sql = io.open(os.path.join(RAIZ, 'scripts', 'migracion-alertas-sla.sql'),
              encoding='utf-8').read().split('\n')


def siembra(tabla):
    ini = None
    for i, l in enumerate(sql):
        if l.startswith('INSERT INTO public.' + tabla):
            ini = i
            break
    if ini is None:
        return None
    fin = next(i for i in range(ini, len(sql)) if sql[i].rstrip().endswith(';'))
    return sum(1 for i in range(ini + 1, fin + 1) if re.match(r'\s*\(', sql[i]))


ESPERA = {
    'dias_inhabiles': siembra('dias_inhabiles'),
    'sla_config': siembra('sla_config'),
    'sla_parametros': siembra('sla_parametros'),
    'alertas_sla': None,            # lo llena el cron; no se exige numero
    'alertas_sla_bitacora': None,
    'cuentas_ediciones': None,
}

fallan = 0
print('')
print(u'  LAS SEIS TABLAS, CON LA LLAVE DE SERVICIO')
print(u'  ' + '-' * 68)
for tabla, esperado in ESPERA.items():
    cod, cuerpo, total = pide(tabla, SERVICE, select='*', limite=1, exacto=True)
    if cod not in OK:
        fallan += 1
        print(u'    %-24s *** NO RESPONDE *** HTTP %s  %s'
              % (tabla, cod, cuerpo if isinstance(cuerpo, str) else ''))
        continue
    if esperado is None:
        print(u'    %-24s existe · %s fila(s)   (la llena el cron, sin numero exigido)'
              % (tabla, total))
    elif total == esperado:
        print(u'    %-24s existe · %s de %s sembradas   ok' % (tabla, total, esperado))
    else:
        fallan += 1
        print(u'    %-24s *** %s filas, el .sql siembra %s ***'
              % (tabla, total, esperado))

print('')
print(u'  LAS SEIS COLUMNAS ADITIVAS (PostgREST da 400 si una no existe)')
print(u'  ' + '-' * 68)
COLUMNAS = [
    ('seguimientos', 'alerta_sla_id,contacto_nombre,contacto_puesto,'
                     'proximo_paso,proximo_paso_fecha'),
    ('reuniones', 'alerta_sla_id'),
]
for tabla, cols in COLUMNAS:
    cod, cuerpo, _ = pide(tabla, SERVICE, select=cols, limite=1)
    n = len(cols.split(','))
    if cod in OK:
        print(u'    %-14s las %d columnas responden   ok' % (tabla, n))
    else:
        fallan += 1
        print(u'    %-14s *** HTTP %s *** %s' % (tabla, cod, cuerpo))

print('')
print(u'  EL RLS, MEDIDO POR COMPORTAMIENTO (la llave ANON, la del navegador)')
print(u'  ' + '-' * 68)
if not ANON:
    fallan += 1
    print(u'    *** no hay NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.')
    print(u'        Sin ella esta seccion NO se midio. No es un aprobado. ***')
else:
    for tabla in ESPERA:
        cod, cuerpo, _ = pide(tabla, ANON, select='*', limite=1)
        if cod in OK and isinstance(cuerpo, list) and len(cuerpo) == 0:
            print(u'    %-24s anon lee 0 filas   ok (RLS cerrado)' % tabla)
        elif cod not in OK:
            print(u'    %-24s anon rechazado HTTP %s   ok (RLS cerrado)' % (tabla, cod))
        else:
            fallan += 1
            print(u'    %-24s *** FUGA: anon DEVOLVIO DATOS *** %s'
                  % (tabla, str(cuerpo)[:90]))
    # CONTROL POSITIVO: sin esto, una base caida daria «anon no ve nada» y se
    # leeria como candado cerrado.
    cod, cuerpo, total = pide('dias_inhabiles', SERVICE, select='fecha',
                              limite=1, exacto=True)
    if cod in OK and total:
        print(u'    CONTROL POSITIVO         la llave de servicio SI lee '
              u'(%s filas): el cero de anon es del RLS, no de una base caida'
              % total)
    else:
        fallan += 1
        print(u'    *** CONTROL POSITIVO FALLIDO: la llave de servicio tampoco lee.')
        print(u'        Entonces el cero de anon no prueba nada. ***')

print('')
print(u'  ' + '=' * 68)
if fallan:
    print(u'  *** %d comprobacion(es) en rojo. ***' % fallan)
else:
    print(u'  Todo lo que esta sonda ALCANZA, en verde.')
print('')
print(u'  LO QUE ESTO **NO** PRUEBA, y hay que decirlo: PostgREST no sirve el')
print(u'  catalogo de Postgres, asi que desde aqui NO se ven los DOS')
print(u'  disparadores de inmutabilidad ni las NUEVE reglas CHECK ni el UNIQUE')
print(u'  de episodio_id. Eso lo contesta `migracion-alertas-sla-verifica.sql`')
print(u'  en el editor SQL, y la prueba de que MUERDEN es')
print(u'  `migracion-alertas-sla-pruebas-al-reves.sql`.')
print('')
sys.exit(1 if fallan else 0)
